import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const base=process.env.VERIFY_BASE_URL || 'http://127.0.0.1:43827';
if (!['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) throw new Error('Run only against a disposable local demo'); const results=[];
async function req(path,body){const r=await fetch(base+path,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});const t=await r.text();let data;try{data=JSON.parse(t)}catch{data=t}return {status:r.status,data}}
async function test(name,fn){try{await fn();results.push({name,result:'PASS'})}catch(e){results.push({name,result:'FAIL',detail:e.message})}}
const post=async(p,b)=>{const r=await req(p,b);assert.equal(r.status,200,JSON.stringify(r.data));return r.data};
await post('/api/demo/reset',{});
for(const p of ['','admin','ads','approvals','audit','blasts','calendar','campaigns','content','customers','dashboard','docs','integrations','offers','orders','reviews','settings','support']) await test('Page /'+p,async()=>assert.equal((await req('/'+p)).status,200));
for(const p of ['ai/status','blasts','content','customers','dashboard','health','integrations','media','notifications','offers','ops/checklist','orders','restaurants','reviews','session','tickets']) await test('GET /api/'+p,async()=>assert.equal((await req('/api/'+p)).status,200));
let content,offer,customer;
await test('Local AI generation',async()=>{const r=await post('/api/ai/generate',{topic:'Weekend brunch',provider:'demo'});assert.ok(r.body)});
await test('Content create / approve / schedule / publish',async()=>{content=(await post('/api/content',{title:'Verification',body:'Test caption'})).content;for(const action of ['approve','schedule','publish']){const r=await post('/api/content',{action,id:content.id});assert.ok(r.content)}});
await test('Offer create / activate / pause',async()=>{offer=(await post('/api/offers',{name:'Verification',code:'VERIFY10'})).offer;for(const action of ['activate','pause'])await post('/api/offers',{action,id:offer.id})});
await test('Customer creation and order loyalty attribution',async()=>{customer=(await post('/api/customers',{name:'Verification guest'})).customer;await post('/api/orders',{total:20,customerId:customer.id});const r=await req('/api/customers');assert.equal(r.data.customers.find(c=>c.id===customer.id).points,20)});
await test('AI review reply',async()=>{const r=await req('/api/reviews');assert.ok((await post('/api/reviews',{action:'reply',id:r.data.reviews[0].id,ai:true})).review.replied)});
await test('Campaign creation',async()=>{const r=await post('/api/campaigns/drop',{name:'Verification',topic:'Brunch',offer:{name:'Test',code:'TEST20',value:20},platforms:['instagram','sms']});assert.equal(r.content.length,2)});
await test('Demo blast creation and send',async()=>{const r=await post('/api/blasts',{name:'Verification',body:'Test',channel:'sms'});assert.equal((await post('/api/blasts',{action:'send',id:r.blast.id})).demo,true)});
await test('Media create / delete',async()=>{const r=await post('/api/media',{name:'Test',url:'https://example.com/test.png'});await post('/api/media',{action:'delete',id:r.asset.id})});
await test('Support ticket creation',async()=>assert.ok((await post('/api/tickets',{subject:'Verification',body:'Test'})).ticket));
await test('Due scheduled post worker',async()=>{const fresh=(await post('/api/content',{title:'Scheduled check',body:'Test'})).content;await post('/api/content',{action:'approve',id:fresh.id});await post('/api/content',{action:'schedule',id:fresh.id,scheduledAt:'2020-01-01T00:00:00Z'});assert.ok((await post('/api/jobs/scheduled-publish',{})).ids.includes(fresh.id))});
let session=(await req('/api/session')).data;let viewer=session.users.find(u=>u.role==='viewer');let marketer=session.users.find(u=>u.role==='marketer');
await test('Viewer denied content creation',async()=>{assert.ok(viewer);await post('/api/session',{action:'switch_user',userId:viewer.id});assert.equal((await req('/api/content',{title:'Forbidden',body:'Test'})).status,403)});
await test('Viewer denied customer creation',async()=>assert.equal((await req('/api/customers',{name:'Should be denied'})).status,403));
await test('Viewer denied orders',async()=>assert.equal((await req('/api/orders',{total:10})).status,403));
await test('Marketer cannot bypass approval via update',async()=>{assert.ok(marketer);await post('/api/session',{action:'switch_user',userId:marketer.id});assert.equal((await req('/api/content',{action:'update',id:content.id,patch:{status:'approved'}})).status,403)});
await post('/api/demo/reset',{});
console.log(JSON.stringify(results,null,2));writeFileSync(new URL('./results.json', import.meta.url),JSON.stringify(results,null,2));
process.exitCode = results.some(r=>r.result==='FAIL') ? 1 : 0;
