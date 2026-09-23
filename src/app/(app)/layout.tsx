import { AppShell } from '@/components/shell';
import { isDemoMode } from '@/lib/server/context';
import { requireUser } from '@/lib/server/supabase';
import { redirect } from 'next/navigation';
export const dynamic='force-dynamic';
export default async function AppLayout({children}:{children:React.ReactNode}) {
 if(!isDemoMode()) { try { await requireUser(); } catch { redirect('/login'); } }
 return <AppShell>{children}</AppShell>;
}
