import { NextRequest,NextResponse } from 'next/server';
import { authClient } from '@/lib/server/supabase';
import {checkOrigin,errorResponse} from '@/lib/server/workspace';
export async function POST(req:NextRequest){try{checkOrigin(req);const client=await authClient();await client.auth.signOut();const res=NextResponse.json({ok:true});res.cookies.delete('rmos_restaurant');return res;}catch(e){return errorResponse(e);}}
