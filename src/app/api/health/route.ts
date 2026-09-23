import {NextResponse} from 'next/server';
import {adminClient} from '@/lib/server/supabase';
import {isDemoMode} from '@/lib/server/context';
export const dynamic='force-dynamic';
export async function GET(){
 const demoMode=isDemoMode();
 let database=false;
 if(!demoMode){try{const {error}=await adminClient().from('rmos_workspaces').select('id').limit(1);database=!error;}catch{database=false;}}
 const ok=demoMode||database;
 return NextResponse.json({ok,service:'restaurant-marketing-os',demoMode,database:demoMode?'demo-memory':database?'connected':'unavailable',deliveryReady:false,message:demoMode?'Demo only: no durable storage or external delivery.':database?'Database connected. External delivery requires configured adapters.':'Complete Supabase credentials and migration setup.'},{status:ok?200:503,headers:{'Cache-Control':'no-store'}});
}
