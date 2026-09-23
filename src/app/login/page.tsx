'use client';
import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
export default function Login() {
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 async function submit(e:React.FormEvent) {
  e.preventDefault();setBusy(true);setMessage('');
  try {
   const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
   if(!url||!key)throw new Error('Sign-in is not configured yet. Please contact the administrator.');
   const client=createBrowserClient(url,key);
   const {error}=await client.auth.signInWithPassword({email,password});
   if(error)throw error;
   window.location.assign('/dashboard');
  }catch(e){setMessage(e instanceof Error?e.message:'Unable to sign in.');}finally{setBusy(false);}
 }
 return <main className="flex min-h-screen items-center justify-center bg-ink-50 p-6"><form onSubmit={submit} className="w-full max-w-md space-y-5 rounded-2xl bg-white p-8 shadow-soft"><h1 className="text-2xl font-semibold">Sign in to Restaurant OS</h1><p className="text-sm text-ink-500">Use the account provided by your administrator.</p><label className="block">Email<input required type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full rounded-lg border p-3"/></label><label className="block">Password<input required type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 w-full rounded-lg border p-3"/></label>{message&&<p role="alert" className="text-sm text-red-700">{message}</p>}<button disabled={busy} className="w-full rounded-lg bg-ink-900 p-3 text-white disabled:opacity-50">{busy?'Signing in…':'Sign in'}</button><p className="text-xs text-ink-500">Need access or a password reset? Contact your restaurant administrator.</p></form></main>;
}
