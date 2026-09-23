import { NextRequest,NextResponse } from 'next/server';
import { authClient } from '@/lib/server/supabase';
export async function GET(req:NextRequest){const code=req.nextUrl.searchParams.get('code');if(code){const client=await authClient();const {error}=await client.auth.exchangeCodeForSession(code);if(!error)return NextResponse.redirect(new URL('/dashboard',req.url));}return NextResponse.redirect(new URL('/login',req.url));}
