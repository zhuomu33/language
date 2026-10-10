const {chromium}=require('playwright');
const fs=require('node:fs/promises');
(async()=>{
 const {fixtureLesson}=await import('./lesson-test-fixture.mjs');
 const browser=await chromium.launch({headless:true,...(process.env.TEST_BROWSER?{executablePath:process.env.TEST_BROWSER}:{})});
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),p=await context.newPage(),report=[];
 const check=(name,pass)=>{report.push({name,pass});if(!pass)throw new Error(name)};
 try{
  await p.addInitScript(()=>{if(sessionStorage.seeded)return;sessionStorage.seeded='1';localStorage.setItem('daily-page-progress',JSON.stringify({de:{index:1,done:true},en:{index:0,done:false}}));localStorage.setItem('daily-page-cloud',JSON.stringify({url:'https://lesson.test',token:'test'}))});
  let fail=false,count=0;
  await p.route('https://lesson.test/api/lesson',async r=>{count++;await r.fulfill(fail?{status:503,json:{error:'测试服务失败'}}:{json:{lesson:fixtureLesson}})});
  await p.goto('http://localhost:4173');await p.waitForSelector('.path-dots');await p.locator('[data-read=de]').first().click();
  await p.locator('[data-course=next]').click();await p.getByRole('heading',{name:fixtureLesson.title,exact:true}).waitFor();
  check('Third lesson generated and cursor advanced once',await p.evaluate(()=>courseProgress.de.index===2&&!courseProgress.de.done)&&count===1);
  await p.locator('#practice').click();check('New comprehension questions rendered',await p.locator('[data-quiz]').count()===9);await p.locator('[data-quiz="0"][data-choice="1"]').click();check('Correct answer need not be first',(await p.locator('[data-quiz-feedback="0"]').innerText()).includes('正确'));
  await p.locator('#close-sheet').click();await p.reload();await p.waitForSelector('.path-dots');await p.locator('[data-read=de]').first().click();
  check('Generated lesson persists on restart',await p.locator('.article-head h1').innerText()===fixtureLesson.title);
  await p.locator('[data-course=finish]').click();fail=true;await p.locator('[data-course=next]').click();await p.getByText('测试服务失败').waitFor();
  check('Failed generation preserves completed lesson and index',await p.evaluate(()=>courseProgress.de.index===2&&courseProgress.de.done&&courseProgress.de.lesson.title==='Ein neuer Weg'));
  check('Zoom disabled while vertical scrolling allowed',await p.evaluate(()=>document.querySelector('meta[name=viewport]').content.includes('user-scalable=no')&&getComputedStyle(document.documentElement).touchAction==='pan-x pan-y'));
  check('Double tap default is cancelled',await p.evaluate(()=>!document.querySelector('.article-head').dispatchEvent(new MouseEvent('dblclick',{bubbles:true,cancelable:true}))));
 }catch(error){report.push({name:'Next lesson flow',pass:false,error:error.message})}
 finally{await browser.close();await fs.writeFile('next-lesson-verification.tmp.json',JSON.stringify(report,null,2))}
 console.log(JSON.stringify(report,null,2));if(report.some(r=>!r.pass))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
