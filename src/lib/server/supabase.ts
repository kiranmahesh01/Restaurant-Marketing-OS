import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { AppError } from './context';
export function publicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new AppError('Supabase is not configured. Contact the administrator.', 503);
  return { url, key };
}
export async function authClient() {
  const { url, key } = publicConfig();
  const jar = await cookies();
  return createServerClient(url, key, { cookies: {
    getAll: () => jar.getAll(),
    setAll: (items) => { try { items.forEach(({name,value,options})=>jar.set(name,value,options)); } catch { /* Server components refresh via middleware. */ } },
  }});
}
export function adminClient() {
  const { url } = publicConfig();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new AppError('Server database credentials are not configured.', 503);
  return createClient(url, key, { auth: { persistSession:false, autoRefreshToken:false }});
}
export async function requireUser() {
  const client = await authClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) throw new AppError('Please sign in.',401);
  return user;
}
