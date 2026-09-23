import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
test('PostgreSQL migration, tenant reads, write restrictions and atomic version updates',async()=>{
 const db=new PGlite();
 try {
 await db.exec(`create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;`);
 const migration=readFileSync('supabase/migrations/003_live_workspaces.sql','utf8');await db.exec(migration);await db.exec(migration);
 const u1='00000000-0000-0000-0000-000000000001',u2='00000000-0000-0000-0000-000000000002';const r1='00000000-0000-0000-0000-000000000011',r2='00000000-0000-0000-0000-000000000022';
 await db.query('insert into auth.users values($1),($2)',[u1,u2]);
 for(const [u,r]of [[u1,r1],[u2,r2]])await db.query('select public.rmos_create_workspace($1,$2,$3)',[u,JSON.stringify({id:r,name:'Test'}),JSON.stringify({content:[]})]);
 await db.exec(`set role authenticated; set request.jwt.claim.sub='${u1}';`);
 const own=await db.query('select id from public.rmos_workspaces');assert.equal(own.rows.length,1);assert.equal((own.rows[0]as{id:string}).id,r1);
 await assert.rejects(db.exec(`update public.rmos_workspaces set state='{}'`));await assert.rejects(db.exec(`insert into public.rmos_members values('${r2}','${u1}','owner')`));await assert.rejects(db.query('select public.rmos_create_workspace($1,$2,$3)',[u1,JSON.stringify({id:r2}),'{}']));
 await db.exec('reset role; set role service_role');
 const a=await db.query('update public.rmos_workspaces set version=version+1 where id=$1 and version=0 returning id',[r1]);const b=await db.query('update public.rmos_workspaces set version=version+1 where id=$1 and version=0 returning id',[r1]);assert.equal(a.rows.length,1);assert.equal(b.rows.length,0);
 }finally{await db.close();}
});
