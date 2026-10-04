const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let cloudConfig = {};
try { cloudConfig = JSON.parse(localStorage.getItem('daily-page-cloud') || '{}'); } catch {}
let currentChat = null;
const chats = new Map();

function applyFont() {
  const size = Math.min(34, Math.max(18, Number(settingValues.fontSize) || 22));
  document.documentElement.style.setProperty('--reading-size', size + 'px');
  document.documentElement.style.setProperty('--detail-size', Math.max(14, size - 6) + 'px');
  document.querySelectorAll('[data-font]').forEach(input => { input.value = size; });
}

function fontControl() {
  return `<label>字号 <input data-font type="range" min="18" max="34" step="1" value="${Number(settingValues.fontSize)||22}" aria-label="阅读字号"></label>`;
}

function progressView(lang) {
  const state = courseProgress[lang], completed = state.completed || 0;
  const total = Math.min(730, Math.max(7, Number(settingValues['plan-' + lang]) || (lang === 'de' ? 180 : 320)));
  const dots = Array.from({length:total}, (_, i) => `<i aria-hidden="true" class="path-dot ${i<completed?'filled':i===completed?'current':''}"></i>`).join('');
  return `<section class="learning-path"><div class="row between"><h2>${lessons[lang].name}学习路径</h2><span>${lang==='de'?'A1 → A2':'B2 → C1'}</span></div><div class="path-dots" role="img" aria-label="计划 ${total} 篇，已完成 ${completed} 篇，预计还需 ${Math.max(0,total-completed)} 个学习日">${dots}</div><div class="path-legend"><span><i class="done"></i>已完成</span><span><i></i>待学习</span></div><p class="muted" style="font-size:12px;margin-top:10px">${completed>=total?'本阶段计划已完成，可做等级测评后调整目标。':'每点一篇，约一个学习日；加读会提前填满。'} 按计划估算，不代表等级测评结果。</p></section>`;
}

function learningRender() {
  applyFont();
  if (page === 'home') {
    const paths = document.createElement('section'); paths.className='learning-paths';
    paths.innerHTML = progressView('de') + progressView('en');
    document.querySelector('.today-grid').after(paths);
    for (const b of document.querySelectorAll('[data-read]')) {
      const lang=b.dataset.read;
      if(courseProgress[lang].done || courseProgress[lang].index>0) b.innerHTML=`继续${lessons[lang].name}学习 ${icon('arrow-right')}`;
    }
  }
  if (page === 'reader') {
    const tools = document.createElement('div'); tools.className='reading-tools';
    tools.innerHTML = `${fontControl()}<button class="icon" data-chat="article" title="向 AI 追问文章" aria-label="向 AI 追问文章">${icon('messages-square')}</button><button class="icon" data-download-audio title="下载本文云端音频" aria-label="下载本文云端音频">${icon('download')}</button>`;
    document.querySelector('.article-head').before(tools);
  }
  if (page === 'settings') {
    document.querySelector('.settings').insertAdjacentHTML('beforeend', `
      <div class="setting">${fontControl()}</div>
      <div class="setting"><div>德语至 A2 的计划学习量<p>每篇约 15 分钟，可按实际调整</p></div><input data-plan="de" type="number" min="7" max="730" value="${Number(settingValues['plan-de'])||180}" aria-label="德语计划篇数"></div>
      <div class="setting"><div>英语至 C1 的计划学习量<p>个人计划，不是达级承诺</p></div><input data-plan="en" type="number" min="7" max="730" value="${Number(settingValues['plan-en'])||320}" aria-label="英语计划篇数"></div>
      <div class="setting"><label for="speech-mode">朗读来源</label><select id="speech-mode"><option value="system">手机系统语音</option><option value="cloud">云端自然语音</option></select></div>
      <div class="setting"><div>AI 服务<p>文章追问与自然语音 · 阿里云百炼</p></div><div class="cloud-fields"><label>服务地址<input id="cloud-url" type="url" placeholder="https://你的服务域名" value="${escapeHtml(cloudConfig.url||'')}" autocapitalize="off" spellcheck="false"></label><label>应用连接口令<input id="cloud-token" type="password" autocomplete="off" value="${escapeHtml(cloudConfig.token||'')}"></label><p class="muted">使用你部署的服务地址和连接口令，百炼 API Key 仅配置在服务端。</p><button class="secondary" id="save-cloud">${icon('plug')}保存并检查连接</button><p id="cloud-status" role="status"></p></div></div>
      <div class="setting"><div>学习记录备份<p class="storage-state" data-storage-status></p><p>覆盖更新保留进度；卸载或换机前请导出。尚未启用账号云同步。</p></div><div class="storage-actions"><button class="secondary" id="export-backup">${icon('download')}导出备份</button><button class="secondary" id="import-backup">${icon('upload')}恢复备份</button><input type="file" id="backup-file" accept=".json,application/json" hidden></div></div>`);
    $('#speech-mode').value=settingValues.speechMode||'system';
    updateStorageStatus();
  }
}
window.learningRender=learningRender;
function updateStorageStatus(){document.querySelectorAll('[data-storage-status]').forEach(el=>{el.textContent=DailyStore.status+(DailyStore.warning?' · '+DailyStore.warning:'')})}
window.addEventListener('learning-storage',updateStorageStatus);

window.learningSheet=()=>{
  if(!['句子解析','词语释义'].includes($('#sheet-title').textContent))return;
  const box=document.createElement('div');box.className='ai-entry';
  box.innerHTML=`<button class="secondary" data-chat="context">${icon('messages-square')}向 AI 追问</button>`;
  $('#sheet-body').append(box);
};

function baseUrl(){
  if(!cloudConfig.url || !cloudConfig.token)throw new Error('请先在设置中连接 AI 服务');
  const u=new URL(cloudConfig.url);
  if(u.protocol!=='https:' && !(u.protocol==='http:'&&['localhost','127.0.0.1'].includes(u.hostname)))throw new Error('服务地址必须使用 HTTPS');
  if(u.username||u.password||u.search||u.hash)throw new Error('服务地址不能包含密码或查询参数');
  return u.href.replace(/\/$/,'');
}
async function api(path,body,signal){
  const response=await fetch(baseUrl()+path,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+cloudConfig.token},body:JSON.stringify(body),signal});
  if(!response.ok){
    const error=await response.json().catch(()=>({}));
    throw new Error(error.error||`服务暂时不可用 (${response.status})`);
  }
  return response;
}

function openChat(kind){
  const l=lessons[language];
  let context='';
  if(kind==='context')context=$('#sheet-body .quote')?.textContent||[$('#sheet-body .dictionary-title')?.textContent,window.selectedWordSentence].filter(Boolean).join(' · ');
  const key=language+'|'+l.title+'|'+context;
  if(!chats.has(key))chats.set(key,{language,title:l.title,article:l.sentences.join('\n'),context,messages:[],busy:false});
  currentChat=chats.get(key);
  openSheet('AI 追问',`<p class="muted">${escapeHtml(context||l.title)}</p><div class="ai-messages" aria-live="polite"></div><form class="ai-form"><textarea aria-label="向 AI 提问" maxlength="2000" placeholder="这句话为什么这样排列？" required></textarea><button class="icon" type="submit" title="发送问题" aria-label="发送问题">${icon('send')}</button><button class="icon" type="button" data-cancel-chat title="停止回答" aria-label="停止回答">${icon('square')}</button></form>`);
  drawChat();
}
function drawChat(){
  const target=$('.ai-messages');if(!target||!currentChat)return;
  target.replaceChildren();
  for(const message of currentChat.messages){const p=document.createElement('p');p.className='ai-message '+message.role;p.textContent=message.content;target.append(p)}
  if(currentChat.busy||currentChat.error){const p=document.createElement('p');p.className='ai-message muted';p.textContent=currentChat.error||'正在思考…';target.append(p)}
  $('.ai-form button[type=submit]').disabled=currentChat.busy;
  $('[data-cancel-chat]').disabled=!currentChat.busy;
  target.scrollTop=target.scrollHeight;
}
document.addEventListener('submit',async e=>{
  if(!e.target.matches('.ai-form'))return;e.preventDefault();
  const chat=currentChat,field=e.target.querySelector('textarea'),question=field.value.trim();
  if(!question||chat.busy)return;
  try{baseUrl()}catch(error){toast(error.message);return}
  chat.messages.push({role:'user',content:question});chat.messages=chat.messages.slice(-16);
  field.value='';chat.busy=true;chat.error='';chat.controller=new AbortController();drawChat();
  const timeout=setTimeout(()=>chat.controller.abort(),60000);
  try{
    const response=await api('/api/chat',{language:chat.language,article:chat.article,context:chat.context,messages:chat.messages},chat.controller.signal);
    const result=await response.json();
    if(typeof result.answer!=='string'||!result.answer.trim())throw new Error('AI 暂未返回回答，请重试');
    chat.messages.push({role:'assistant',content:result.answer});
  }catch(error){chat.error=error.name==='AbortError'?'回答已停止或超时，可重新提问':error.message}
  finally{clearTimeout(timeout);chat.busy=false;if(currentChat===chat)drawChat()}
});

let audioDB;
async function audioCache(){
  if(!audioDB)audioDB=new Promise((resolve,reject)=>{const req=indexedDB.open('daily-page-audio',1);req.onupgradeneeded=()=>req.result.createObjectStore('clips');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});
  return audioDB;
}
async function cachedClip(key,blob){
  const db=await audioCache();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('clips',blob?'readwrite':'readonly'),store=tx.objectStore('clips');
    const req=blob?store.put(blob,key):store.get(key);
    tx.oncomplete=()=>resolve(req.result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
  });
}
async function getClip(text,lang,signal){
  const key=(cloudConfig.url||'')+'|v1|'+lang+'|'+text;
  const cached=await cachedClip(key).catch(()=>null);if(cached)return cached;
  const response=await api('/api/speech',{text,language:lang},signal);
  if(!response.headers.get('content-type')?.startsWith('audio/'))throw new Error('服务没有返回有效音频');
  const blob=await response.blob();
  if(blob.size<40||blob.size>12*1024*1024)throw new Error('音频内容无效');
  await cachedClip(key,blob).catch(()=>toast('音频已生成，但本机缓存空间不足'));
  return blob;
}
let cloudAudio=null,audioAbort=null,audioUrl=null;
window.CloudSpeech={
  get active(){return !!cloudAudio},
  setRate(rate){if(cloudAudio)cloudAudio.playbackRate=rate},
  stop(){audioAbort?.abort();audioAbort=null;if(cloudAudio){cloudAudio.onended=null;cloudAudio.pause();cloudAudio.removeAttribute('src');cloudAudio.load();cloudAudio=null}if(audioUrl)URL.revokeObjectURL(audioUrl);audioUrl=null},
  async speak(text,onend){
    const token=speechToken,lang=language;
    audioAbort=new AbortController();const controller=audioAbort;
    const timeout=setTimeout(()=>controller.abort(),60000);
    playing=true;$('#play').innerHTML=icon('square');$('#play').setAttribute('aria-label','停止播放');icons();
    try{
      const blob=await getClip(text,lang,controller.signal);
      if(token!==speechToken||controller.signal.aborted)return;
      audioUrl=URL.createObjectURL(blob);cloudAudio=new Audio(audioUrl);cloudAudio.playbackRate=Number($('#speed').value);
      cloudAudio.onended=()=>{if(token!==speechToken)return;if(onend)onend();else stopAudio()};
      cloudAudio.onerror=()=>{if(token===speechToken){stopAudio();toast('音频播放失败，请重试')}};
      await cloudAudio.play();
    }catch(error){if(token===speechToken){stopAudio();toast(error.name==='AbortError'?'语音请求超时，请重试':error.message)}}
    finally{clearTimeout(timeout)}
  }
};

document.addEventListener('input',e=>{
  if(!e.target.matches('[data-font]'))return;
  settingValues.fontSize=Number(e.target.value);applyFont();persist();
});
document.addEventListener('change',async e=>{
  const el=e.target;
  if(el.matches('[data-plan]')){if(!el.checkValidity()){el.reportValidity();return}settingValues['plan-'+el.dataset.plan]=Number(el.value);persist()}
  if(el.id==='speech-mode'){stopAudio();settingValues.speechMode=el.value;persist()}
  if(el.id==='backup-file'&&el.files[0]){
    const file=el.files[0];
    if(file.size>8*1024*1024){toast('备份文件过大');return}
    if(!confirm('将用所选备份恢复学习记录，覆盖当前进度。继续？'))return;
    try{await DailyStore.importBackup(await file.text());location.reload()}catch(error){toast('恢复失败：'+error.message)}
  }
});
document.addEventListener('click',async e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.chat)openChat(b.dataset.chat);
  if(b.hasAttribute('data-cancel-chat'))currentChat?.controller?.abort();
  if(b.id==='export-backup'){try{await DailyStore.exportBackup()}catch{toast('备份导出未完成，请重试')}}
  if(b.id==='import-backup')$('#backup-file').click();
  if(b.id==='save-cloud'){
    const url=$('#cloud-url').value.trim(),token=$('#cloud-token').value.trim();
    cloudConfig={url,token};
    try{
      baseUrl();localStorage.setItem('daily-page-cloud',JSON.stringify(cloudConfig));b.disabled=true;
      $('#cloud-status').textContent='正在检查连接…';
      const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
      try{const r=await api('/api/status',{},controller.signal);const s=await r.json();$('#cloud-status').textContent=s.ready?'连接成功，可以追问和朗读':'服务已连接，等待配置百炼 API Key'}finally{clearTimeout(timeout)}
    }catch(error){if($('#cloud-status'))$('#cloud-status').textContent=error.message}finally{b.disabled=false}
  }
  if(b.hasAttribute('data-download-audio')){
    const lang=language,sentences=[...lessons[lang].sentences];b.disabled=true;
    try{
      for(let i=0;i<sentences.length;i++){
        const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),60000);
        try{await getClip(sentences[i],lang,controller.signal)}finally{clearTimeout(timeout)}
      }
      toast('本文语音已保存，可离线播放');
    }catch(error){toast(error.message)}finally{b.disabled=false}
  }
});
saveProgress();render();
