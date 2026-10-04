const {chromium}=require('playwright');
const {build}=require('esbuild');
const {writeFile}=require('node:fs/promises');

(async()=>{
 const report=[],native=new Map();
 const bundle=await build({entryPoints:['native-storage.js'],bundle:true,write:false,format:'iife',target:'es2020',plugins:[{
  name:'native-test-bridge',setup(build){
   build.onResolve({filter:/^@capacitor\//},args=>({path:args.path,namespace:'mock'}));
   build.onLoad({filter:/.*/,namespace:'mock'},args=>({contents:args.path.endsWith('core')?'export const Capacitor={isNativePlatform:()=>true};':args.path.endsWith('preferences')?'export const Preferences={get:({key})=>window.testNativeGet(key),set:({key,value})=>window.testNativeSet(key,value)};':args.path.endsWith('filesystem')?'export const Filesystem={},Directory={},Encoding={};':'export const Share={};',loader:'js'}));
  }
 }]});
 const browser=await chromium.launch({headless:true,...(process.env.TEST_BROWSER?{executablePath:process.env.TEST_BROWSER}:{})});
 const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage();
 const check=(name,pass)=>{report.push({name,pass});if(!pass)throw new Error(name)};
 try{
  await context.exposeFunction('testNativeGet',key=>({value:native.get(key)||null}));
  await context.exposeFunction('testNativeSet',(key,value)=>{native.set(key,value)});
  await context.route('**/native-storage.bundle.js',r=>r.fulfill({contentType:'application/javascript',body:bundle.outputFiles[0].text}));
  await page.addInitScript(()=>{
   if(sessionStorage.getItem('seeded'))return;sessionStorage.setItem('seeded','1');
   localStorage.setItem('daily-page-progress',JSON.stringify({de:{index:1,done:true},en:{index:1,done:false}}));
   localStorage.setItem('daily-page-vocab',JSON.stringify([['de:Berg',{language:'de',word:'Berg'}]]));
   localStorage.setItem('daily-page-settings',JSON.stringify({fontSize:30}));
  });
  await page.goto('http://localhost:4173');await page.waitForSelector('.path-dots');
  await page.evaluate(()=>DailyStore.save());
  const state=JSON.parse(native.get('daily-page-state-v1'));
  check('First upgrade migrates legacy records into native preferences',JSON.parse(state.data['daily-page-progress']).de.completed===2&&JSON.parse(state.data['daily-page-vocab']).length===1);
  await page.evaluate(()=>localStorage.clear());
  await page.reload();await page.waitForSelector('.path-dots');
  check('Native snapshot restores after web storage loss',await page.evaluate(()=>JSON.parse(localStorage.getItem('daily-page-progress')).de.completed===2&&JSON.parse(localStorage.getItem('daily-page-settings')).fontSize===30));
  native.set('daily-page-state-v1','broken');
  await page.evaluate(()=>localStorage.clear());await page.reload();await page.waitForSelector('.path-dots');
  check('Previous native snapshot recovers damaged primary snapshot',await page.locator('.learning-path').first().locator('.filled').count()===2);
 }catch(error){report.push({name:'Native persistence run',pass:false,error:error.message})}
 finally{await context.close();await browser.close();await writeFile('native-verification.tmp.json',JSON.stringify(report,null,2))}
 console.log(JSON.stringify(report,null,2));if(report.some(r=>!r.pass))process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1});
