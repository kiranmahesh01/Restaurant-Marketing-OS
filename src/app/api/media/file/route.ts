import {NextRequest,NextResponse} from 'next/server';
import {withWorkspace} from '@/lib/server/workspace';
import {adminClient} from '@/lib/server/supabase';
import {getStore,scoped} from '@/lib/store';
export const dynamic='force-dynamic';
export const GET=withWorkspace(async(req:NextRequest)=>{
 const asset=scoped(getStore().media).find(a=>a.id===req.nextUrl.searchParams.get('id'));
 if(!asset?.storagePath)return NextResponse.json({error:'Media not found'},{status:404});
 if(!asset.storagePath.startsWith(`${getStore().activeRestaurantId}/`))return NextResponse.json({error:'Media access denied'},{status:403});
 const {data,error}=await adminClient().storage.from('rmos-media').createSignedUrl(asset.storagePath,60);
 if(error||!data)return NextResponse.json({error:'Media unavailable'},{status:503});
 return NextResponse.redirect(data.signedUrl);
});
