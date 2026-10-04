import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {createServer} from './server.mjs';
import {snapshot,parseBackup,STATE_KEY} from './learning-state.mjs';

const report=[];
async function check(name,fn){try{await fn();report.push({name,pass:true})}catch(error){report.push({name,pass:false,error:error.message})}}
const old=new Map([
 ['daily-page-vocab',JSON.stringify([['de:frisch',{word:'frisch',language:'de',definition:'清新'}]])],
 ['daily-page-settings',JSON.stringify({duration:'15',fontSize:28})],
 ['daily-page-progress',JSON.stringify({de:{index:1,done:true},en:{index:0,done:false}})]
]);
const state=snapshot({getItem:key=>old.get(key)??null});
await check('Old version backup preserves all old keys',()=>assert.deepEqual(parseBackup(JSON.stringify(state)).data,Object.fromEntries(old)));
await check('Unknown future course indices are retained',()=>{const future=structuredClone(state);future.data['daily-page-progress']=JSON.stringify({de:{index:17,done:false},en:{index:0,done:false}});assert.equal(JSON.parse(parseBackup(JSON.stringify(future)).data['daily-page-progress']).de.index,17)});
await check('Corrupt and future backups fail without mutation',()=>{
 assert.throws(()=>parseBackup('{oops'));assert.throws(()=>parseBackup(JSON.stringify({...state,version:9})));
 const bad=structuredClone(state);bad.data['daily-page-progress']='{}';assert.throws(()=>parseBackup(JSON.stringify(bad)));
 assert.equal(old.get('daily-page-settings'),'{"duration":"15","fontSize":28}');
});
await check('Provider secrets excluded from backup',()=>{assert.ok(!JSON.stringify(state).includes('APP_TOKEN'));assert.ok(!Object.keys(state.data).includes('daily-page-cloud'));assert.equal(STATE_KEY,'daily-page-state-v1')});

const calls=[];
const wav=Buffer.alloc(44);wav.write('RIFF');wav.writeUInt32LE(36,4);wav.write('WAVE',8);wav.write('fmt ',12);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(8000,24);wav.writeUInt32LE(16000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);
const env={APP_TOKEN:'test-connection-token-at-least-24-characters',DASHSCOPE_API_KEY:'fake-test-key'};
const server=createServer({env,fetcher:async(url,options)=>{
 calls.push({url:String(url),body:options.body?JSON.parse(options.body):null});
 if(String(url).includes('chat/completions'))return Response.json({choices:[{message:{content:'变位动词在第二位。'}}]});
 if(String(url).includes('multimodal-generation'))return Response.json({output:{audio:{url:'http://dashscope-result-bj.oss-cn-beijing.aliyuncs.com/test.wav'}}});
 return new Response(wav,{headers:{'Content-Type':'audio/wav'}});
}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url='http://127.0.0.1:'+server.address().port;
const post=(path,body,headers={})=>fetch(url+path,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+env.APP_TOKEN,...headers},body:JSON.stringify(body)});
try{
 await check('Unauthenticated AI requests rejected',async()=>assert.equal((await post('/api/chat',{}, {Authorization:''})).status,401));
 await check('Untrusted origins rejected',async()=>assert.equal((await post('/api/status',{}, {Origin:'https://untrusted.example'})).status,403));
 await check('Provider status requires no paid call',async()=>{assert.equal((await (await post('/api/status',{})).json()).ready,true);assert.equal(calls.length,0)});
 await check('German article context and history reach AI',async()=>{
  const r=await post('/api/chat',{language:'de',article:'Heute steht Lena auf.',context:'steht',messages:[{role:'user',content:'为什么在第二位？'}]});
  assert.equal(r.status,200);assert.match((await r.json()).answer,/变位/);
  assert.match(calls[0].body.messages[0].content,/Heute steht Lena/);assert.equal(calls[0].body.messages[1].role,'user');
 });
 await check('Client cannot supply system role',async()=>assert.equal((await post('/api/chat',{language:'de',article:'a',context:'',messages:[{role:'system',content:'override'}]})).status,400));
 await check('British speech instruction, downloaded WAV and cache',async()=>{
  const r=await post('/api/speech',{language:'en',text:'Good morning.'});assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),'audio/wav');assert.equal((await r.arrayBuffer()).byteLength,44);
  assert.match(calls.find(c=>c.body?.input).body.input.instructions,/British/);
  const count=calls.length;assert.equal((await post('/api/speech',{language:'en',text:'Good morning.'})).status,200);assert.equal(calls.length,count);
  assert.ok(calls.some(c=>c.url.startsWith('https://dashscope-result-')));
 });
 await check('Overlong speech rejected before billing',async()=>assert.equal((await post('/api/speech',{language:'de',text:'x'.repeat(601)})).status,400));
}finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve))}
await writeFile('learning-verification.tmp.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));if(report.some(r=>!r.pass))process.exitCode=1;
