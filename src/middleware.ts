import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
export async function middleware(req: NextRequest) {
  let response=NextResponse.next({request:req});
  if(process.env.DEMO_MODE==='true')return response;
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url||!key)return response;
  const client=createServerClient(url,key,{cookies:{getAll:()=>req.cookies.getAll(),setAll(items){items.forEach(({name,value})=>req.cookies.set(name,value));response=NextResponse.next({request:req});items.forEach(({name,value,options})=>response.cookies.set(name,value,options));}}});
  await client.auth.getUser();
  response.headers.set('Cache-Control','private, no-store');
  return response;
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico|api/).*)']};
