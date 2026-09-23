import { NextRequest,NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { adminClient,requireUser } from '@/lib/server/supabase';
import { checkOrigin,emptyState,statePayload,errorResponse } from '@/lib/server/workspace';
import { AppError } from '@/lib/server/context';
import type { Restaurant } from '@/lib/types';
export async function POST(req:NextRequest){try{
 checkOrigin(req);const user=await requireUser();
 const parsed=z.object({name:z.string().trim().min(1).max(120),city:z.string().trim().min(1).max(100),state:z.string().max(100).optional(),cuisine:z.string().max(100).optional()}).safeParse(await req.json());
 if(!parsed.success)throw new AppError('A restaurant name and city are required.');
 const input=parsed.data,id=randomUUID();
 const restaurant:Restaurant={id,orgId:id,name:input.name,slug:input.name.toLowerCase().replace(/[^a-z0-9]+/g,'-'),city:input.city,state:input.state||'',cuisine:input.cuisine||'',timezone:'America/Los_Angeles',brandVoice:'Warm, welcoming and local.',brandColors:{primary:'#ea580c',secondary:'#0f172a'},locations:1,createdAt:new Date().toISOString()};
 const db=adminClient();const {error}=await db.rpc('rmos_create_workspace',{p_user:user.id,p_restaurant:restaurant,p_state:statePayload(emptyState(restaurant))});
 if(error)throw new AppError('Could not create the restaurant. Check database setup and your restaurant limit.',503);
 const res=NextResponse.json({restaurant},{status:201});res.cookies.set('rmos_restaurant',id,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/'});return res;
}catch(e){return errorResponse(e);}}
