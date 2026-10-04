const {chromium}=require('playwright');
const fs=require('node:fs/promises');
(async () => {
  const browser=await chromium.launch({headless:true, ...(process.env.TEST_BROWSER?{executablePath:process.env.TEST_BROWSER}:{})});
  const context = await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  const p = await context.newPage(), report=[],errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  const check=(name,pass,detail='')=>{report.push({name,pass,detail});if(!pass)throw new Error(name+': '+detail)};
  try {
    await p.addInitScript(()=>{
      window.__plays=0;
      window.Audio=class {constructor(){window.__audio=this}play(){window.__plays++;return Promise.resolve()}pause(){}removeAttribute(){}load(){}};
      if(localStorage.getItem('test-seeded'))return;
      localStorage.setItem('test-seeded','yes');
      localStorage.setItem('daily-page-vocab',JSON.stringify([['de:frisch',{language:'de',word:'frisch',definition:'清新'}]]));
      localStorage.setItem('daily-page-settings',JSON.stringify({duration:'15'}));
      localStorage.setItem('daily-page-progress',JSON.stringify({de:{index:1,done:false},en:{index:0,done:false}}));
    });
    await p.goto('http://localhost:4173');await p.waitForSelector('.path-dots');
    check('Old progress migration renders completed dots',await p.locator('.learning-path').first().locator('.filled').count()===1);
    for(const width of [320,390,1440]){
      await p.setViewportSize({width,height:844});
      await p.locator('[data-read=de]').first().click();
      await p.locator('[data-font]').fill('34');await p.locator('[data-font]').dispatchEvent('input');
      const before=await p.locator('#audio').boundingBox();
      await p.locator('#main').evaluate(el=>el.scrollTop=el.scrollHeight);
      const after=await p.locator('#audio').boundingBox(),back=await p.locator('.global-back').boundingBox();
      check('Fixed controls at '+width,before.y===after.y&&back.y<80);
      const overflow=await p.evaluate(()=>({body:document.body.scrollWidth,main:document.querySelector('#main').scrollWidth,width:innerWidth,mainWidth:document.querySelector('#main').clientWidth,font:getComputedStyle(document.querySelector('.article-text')).fontSize}));
      check('Maximum font fits '+width,overflow.body<=width&&overflow.main<=overflow.mainWidth+1&&overflow.font==='34px',JSON.stringify(overflow));
      if(width===390)await p.screenshot({path:'reading-check.tmp.png'});
      await p.locator('.global-back').click();
    }
    await p.setViewportSize({width:390,height:844});
    await p.reload();await p.waitForSelector('.path-dots');
    check('Font and migrated progress survive reload',await p.evaluate(()=>JSON.parse(localStorage.getItem('daily-page-settings')).fontSize===34&&JSON.parse(localStorage.getItem('daily-page-progress')).de.index===1));
    await p.locator('[data-read=de]').first().click();
    await p.locator('[data-course=finish]').click();
    check('Completion increments once',await p.evaluate(()=>JSON.parse(localStorage.getItem('daily-page-progress')).de.completed===2));
    await p.reload();await p.waitForSelector('.path-dots');
    check('Completed dots survive app update-style reload',await p.locator('.learning-path').first().locator('.filled').count()===2);
    await p.locator('.learning-paths').scrollIntoViewIfNeeded();
    await p.screenshot({path:'progress-check.tmp.png'});
    await p.evaluate(()=>['daily-page-progress','daily-page-vocab','daily-page-settings'].forEach(key=>localStorage.removeItem(key)));
    await p.reload();await p.waitForSelector('.path-dots');
    check('State snapshot restores missing legacy keys',await p.evaluate(()=>JSON.parse(localStorage.getItem('daily-page-progress')).de.completed===2&&JSON.parse(localStorage.getItem('daily-page-vocab')).length===1));
    await p.locator('.mobile-nav [data-nav=settings]').click();
    await p.locator('#cloud-url').fill('https://test.daily-page.example');await p.locator('#cloud-token').fill('test-token');
    let speechRequests=0;
    await p.route('https://test.daily-page.example/**',async route=>{
      if(route.request().url().endsWith('/api/status'))return route.fulfill({json:{ready:true}});
      if(route.request().url().endsWith('/api/chat')){
        const data=route.request().postDataJSON();
        check('AI receives full current article and question',data.article.includes('Heute kauft Lena')&&data.messages.at(-1).content.includes('为什么'));
        return route.fulfill({json:{answer:'<b>这里动词在第二位。</b>'}});
      }
      speechRequests++;return route.fulfill({contentType:'audio/wav',body:Buffer.alloc(44)});
    });
    await p.locator('#save-cloud').click();await p.getByText('连接成功，可以追问和朗读').waitFor();
    await p.locator('#speech-mode').selectOption('cloud');
    await p.locator('.global-back').click();await p.locator('[data-read=de]').first().click();
    await p.locator('[data-chat=article]').click();await p.locator('.ai-form textarea').fill('为什么是这个顺序？');await p.locator('.ai-form [type=submit]').click();
    await p.locator('.ai-message.assistant').waitFor();
    check('AI output shown as text, not executable markup',await p.locator('.ai-message.assistant b').count()===0&&await p.locator('.ai-message.assistant').innerText()==='<b>这里动词在第二位。</b>');
    await p.locator('#close-sheet').click();await p.locator('.sentence-row').first().dispatchEvent('click');
    await p.locator('[data-chat=context]').click();check('Sentence follow-up entry works',await p.locator('.ai-form').count()===1);
    await p.locator('#close-sheet').click();
    await p.locator('#play').click();await p.waitForFunction(()=>window.__plays>=1);
    await p.evaluate(()=>window.__oldEnd=window.__audio.onended);
    await p.locator('[data-word]').first().click();await p.waitForFunction(()=>window.__plays>=2);
    const played=await p.evaluate(()=>window.__plays);await p.evaluate(()=>window.__oldEnd());
    check('Old full-article callback cannot resume after word tap',await p.evaluate(()=>window.__plays)===played);
    await p.locator('#close-sheet').click();const fetched=speechRequests;
    await context.setOffline(true);await p.locator('[data-play-sentence="0"]').click();await p.waitForFunction(()=>window.__plays>=3);
    check('Downloaded cloud sentence plays offline without another request',speechRequests===fetched);
    await context.setOffline(false);await p.locator('.global-back').click();
    await p.locator('.mobile-nav [data-nav=settings]').click();
    const [download]=await Promise.all([p.waitForEvent('download'),p.locator('#export-backup').click()]);
    const data=JSON.parse(await fs.readFile(await download.path(),'utf8'));
    check('Export includes progress without connection secret',JSON.parse(data.data['daily-page-progress']).de.completed===2&&!JSON.stringify(data).includes('test-token'));
    p.once('dialog',d=>d.accept());
    await p.locator('#backup-file').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});await p.waitForSelector('.path-dots');
    check('Backup restore reloads saved progress',await p.locator('.learning-path').first().locator('.filled').count()===2);
    check('No unhandled browser errors',errors.length===0,JSON.stringify(errors));
  } catch(error) {report.push({name:'Test run completed',pass:false,error:error.message});}
  finally{await fs.writeFile('mobile-verification.tmp.json',JSON.stringify(report,null,2));await context.close();await browser.close()}
  console.log(JSON.stringify(report,null,2));if(report.some(r=>!r.pass))process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1});
