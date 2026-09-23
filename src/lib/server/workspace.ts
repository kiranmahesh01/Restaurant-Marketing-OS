import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { storeContext, AppError, isDemoMode } from './context';
import { adminClient, requireUser } from './supabase';
import type { Restaurant, StoreShape, UserRole } from '../types';
import { getActiveUser } from '../store';

const roles: UserRole[] = ['owner','manager','marketer','viewer'];
export const dataKeys = ['content','offers','customers','orders','reviews','integrations','notifications','auditLogs','campaigns','ads','analytics','media','blasts','tickets'] as const;
export function emptyState(restaurant: Restaurant): StoreShape {
  return { restaurants:[restaurant],users:[],activeRestaurantId:restaurant.id,activeUserId:'',demoMode:false,
    content:[], offers:[], customers:[], orders:[], reviews:[], integrations:[], notifications:[], auditLogs:[],campaigns:[],ads:[],media:[],blasts:[],tickets:[],
    analytics:[{restaurantId:restaurant.id,period:'last_30_days',revenue:0,orders:0,avgTicket:0,newCustomers:0,loyaltyRedemptions:0,contentPublished:0,adSpend:0,adRoas:0,reviewAvg:0,reviewCount:0,topItems:[],revenueByDay:[],channelMix:[]}],
  };
}
export function statePayload(s: StoreShape) { return Object.fromEntries(dataKeys.map(k=>[k,s[k]])); }
export function errorResponse(error: unknown) {
  const status = error instanceof AppError ? error.status : 500;
  if (status === 500) console.error('Request failed:', error instanceof Error ? error.message : 'Unknown error');
  return NextResponse.json({error:status===500?'Unable to complete the request. Please try again.':(error as Error).message},{status});
}
export function checkOrigin(req: NextRequest) {
  const origin = req.headers.get('origin');
  const expected = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  if (origin && origin !== new URL(expected).origin) throw new AppError('Untrusted request origin',403);
  if (req.headers.get('sec-fetch-site')==='cross-site') throw new AppError('Cross-site request rejected',403);
}
export function withWorkspace(handler:(req:NextRequest)=>Promise<Response>, options:{roles?:UserRole[];demoOnly?:boolean}={}) {
  return async (req: NextRequest) => {
    try {
      const mutating = !['GET','HEAD'].includes(req.method);
      if(mutating) checkOrigin(req);
      if(options.demoOnly && !isDemoMode()) throw new AppError('This demo action is disabled in live mode.',404);
      if(isDemoMode()) {
        if(options.roles && !options.roles.includes(getActiveUser()?.role)) throw new AppError('Your role cannot perform this action.',403);
        const response = await handler(req);
        response.headers.set('Cache-Control','no-store');
        return response;
      }
      const user = await requireUser();
      const db = adminClient();
      const {data:members,error:membershipError}=await db.from('rmos_members').select('workspace_id,role').eq('user_id',user.id);
      if(membershipError) throw new AppError('Database setup is incomplete. Contact the administrator.',503);
      if(!members?.length) return NextResponse.json({error:'Create your restaurant first.',code:'ONBOARDING_REQUIRED'},{status:409});
      const jar = await cookies();
      const requested = req.headers.get('x-restaurant-id') || jar.get('rmos_restaurant')?.value || members[0].workspace_id;
      const membership=members.find(m=>m.workspace_id===requested);
      if(!membership || !roles.includes(membership.role)) throw new AppError('Restaurant access denied.',403);
      const role=membership.role as UserRole;
      if(options.roles && !options.roles.includes(role)) throw new AppError('Your role cannot perform this action.',403);
      const {data:workspaces,error}=await db.from('rmos_workspaces').select('id,restaurant,state,version').in('id',members.map(m=>m.workspace_id));
      if(error) throw new AppError('Unable to load restaurant data.',503);
      const workspace=workspaces?.find(w=>w.id===requested);
      if(!workspace) throw new AppError('Restaurant not found.',404);
      const restaurant=workspace.restaurant as Restaurant;
      const state=emptyState(restaurant);
      for(const key of dataKeys) if(Array.isArray(workspace.state[key])) (state[key] as unknown[])=workspace.state[key];
      state.restaurants=workspaces!.map(w=>w.restaurant as Restaurant);
      state.activeUserId=user.id;
      state.users=[{id:user.id,email:user.email || '',name:user.user_metadata?.full_name || user.email || 'User',role,restaurantIds:members.map(m=>m.workspace_id),portal:'client'}];
      const context={data:state,dirty:false,rollback:[] as Array<()=>Promise<void>>,afterCommit:[] as Array<()=>Promise<void>>};
      return await storeContext.run(context,async()=>{
        try {
        const response=await handler(req);
        if(response.ok && context.dirty) {
          const payload=statePayload(context.data);
          if(JSON.stringify(payload).length>8_000_000) throw new AppError('Restaurant storage limit reached. Archive old records before adding more.',413);
          const {data:saved,error:saveError}=await db.from('rmos_workspaces').update({state:payload,version:workspace.version+1,updated_at:new Date().toISOString()}).eq('id',requested).eq('version',workspace.version).select('id');
          if(saveError) throw new AppError('Changes could not be saved. Please try again.',503);
          if(!saved?.length) throw new AppError('Another user changed this restaurant. Refresh and retry your change.',409);
        }
        if(!response.ok) await Promise.allSettled(context.rollback.map(fn=>fn()));
        else await Promise.allSettled(context.afterCommit.map(fn=>fn()));
        response.headers.set('Cache-Control','private, no-store');
        return response;
        } catch(error) { await Promise.allSettled(context.rollback.map(fn=>fn())); throw error; }
      });
    }catch(error){return errorResponse(error);}
  };
}
export const writers: UserRole[]=['platform_admin','owner','manager','marketer'];
export const managers: UserRole[]=['platform_admin','owner','manager'];
