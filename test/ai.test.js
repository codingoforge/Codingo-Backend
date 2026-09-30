import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createAiRouter } from '../modules/ai/ai.routes.js';

const brief = { title:'Inventory MVP', summary:'Track stock in two warehouses.', solution:'Warehouse management', features:['Stock movements'], mvp:['Inventory screen'], questions:['Which barcode scanners?'] };
const idea = 'We need warehouse inventory tracking across two locations.';
async function withApi(options, run) {
  const app = express(); app.use('/api/ai', createAiRouter(options));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const call = (body = { idea }) => fetch(`http://127.0.0.1:${server.address().port}/api/ai/brief`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  try { await run(call); } finally { await new Promise(resolve => server.close(resolve)); }
}
const env = { GEMINI_API_KEY:'test-only-never-a-real-key' };
test('valid request uses server credential, validates response and never returns key', async () => {
  await withApi({ env, fetchImpl: async (url, options) => {
    assert.match(url, /generativelanguage.googleapis.com/);
    assert.equal(options.headers['x-goog-api-key'], env.GEMINI_API_KEY);
    assert.equal(JSON.parse(options.body).contents[0].parts[0].text, idea);
    return Response.json({ candidates:[{ finishReason:'STOP',content:{parts:[{text:JSON.stringify(brief)}]}}] });
  }}, async call => {
    const r = await call(); assert.equal(r.status,200); assert.equal(r.headers.get('cache-control'),'no-store');
    assert.deepEqual(await r.json(), {brief});
  });
});
test('invalid, empty and oversized descriptions never call provider', async () => {
  await withApi({ env, fetchImpl: () => { throw new Error('must not call'); } }, async call => {
    for (const body of [{idea:'short'},{idea:42},{idea:' '.repeat(30)},{idea:'x'.repeat(3001)},{}]) assert.equal((await call(body)).status,400);
    assert.equal((await call({idea:'x'.repeat(20000)})).status,413);
  });
});
test('missing key produces clear unavailable response', async () => {
  await withApi({env:{}},async call => assert.equal((await call()).status,503));
});
test('provider failures and malformed or truncated output fail closed', async () => {
  for (const response of [new Response('secret details',{status:403}),Response.json({candidates:[{finishReason:'MAX_TOKENS'}]}),Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:'{}'}]}}]})]) {
    await withApi({env,fetchImpl: async () => response},async call => { const r=await call(); assert.equal(r.status,503); assert.ok(!(await r.text()).includes('secret details')); });
  }
});
test('request cap blocks excess calls before contacting provider', async () => {
  let calls=0;
  await withApi({env,fetchImpl:async()=>{calls++;return new Response('',{status:429});}},async call=> {
    for(let i=0;i<11;i++) assert.equal((await call()).status,429);
    assert.equal(calls,10);
  });
});
