import assert from 'node:assert/strict';
import {readFile, stat, writeFile} from 'node:fs/promises';
const report=[];
async function check(name,test){try{await test();report.push({name,pass:true})}catch(error){report.push({name,pass:false,error:error.message})}}
await check('Lockfile matches package',async()=>{
 const pkg=JSON.parse(await readFile('package.json','utf8'));
 const lock=JSON.parse(await readFile('package-lock.json','utf8'));
 assert.deepEqual(lock.packages[''].dependencies,pkg.dependencies);
 assert.deepEqual(lock.packages[''].devDependencies,pkg.devDependencies);
});
await check('Bundled assets and entry points',async()=>{
 for(const file of ['index.html','ui-preview.html','app.js','learning-tools.js','learning-tools.css','native-storage.bundle.js','course-progress.js','manifest.webmanifest','sw.js','apple-touch-icon.png','icon-192.png','icon-512.png','assets/forest.jpg','assets/mountains.jpg','assets/lucide.min.js'])assert.ok((await stat(`release/${file}`)).size>0,file);
});
await check('No external image or script hosts',async()=>{
 const html=await readFile('release/index.html','utf8');assert.ok(!html.includes('https://unpkg.com'));assert.ok(!(await readFile('release/app.js','utf8')).includes('https://images.unsplash.com'));
});
await check('Manifest icons exist',async()=>{
 const manifest=JSON.parse(await readFile('release/manifest.webmanifest','utf8'));
 for(const icon of manifest.icons)assert.ok((await stat(`release/${icon.src}`)).size>0);
});
if(process.argv.includes('--report'))await writeFile('release-verification.tmp.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));if(report.some(item=>!item.pass))process.exitCode=1;
