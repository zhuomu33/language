// Preview sequence: each language has two lessons. Production adds AI lessons to this same sequence.
const firstLessons = {de:structuredClone(lessons.de), en:structuredClone(lessons.en)};
const initialNotes = {de:structuredClone(deNotes), en:structuredClone(enNotes)};
const nextLessons = {
  de: {
    title:'Ein Besuch auf dem Markt', subtitle:'去市场的一天', category:'生活故事',
    sentences:['Heute kauft Lena auf dem Markt ein.','Nach dem Frühstück nimmt sie ihren Rucksack mit.','Auf dem Markt sieht sie frisches Brot und Äpfel.','Sie kauft Brot, aber sie braucht keinen Tee.','Dann geht sie zum See und sitzt auf einer Bank.','Die Luft ist frisch. Lena hat Zeit und bleibt noch ein bisschen.'],
    translations:['今天莱娜在市场购物。','早餐后她带上背包。','在市场她看到了新鲜面包和苹果。','她买面包，但是她不需要茶。','然后她走向湖边，坐在长椅上。','空气很清新。莱娜有时间，再待一会儿。'],
    grammar:['einkaufen 是可分动词：kauft 在第二位，ein 在句末。auf dem Markt 表示位置，用第三格。','Nach dem Frühstück 占第一位，nimmt 在第二位。mitnehmen 拆成 nimmt ... mit。','Auf dem Markt 是地点状语，sieht 在第二位。frisches Brot 是第四格中性宾语。','aber 连接两个分句。keinen 修饰第四格阳性名词 Tee，表示没有、不需要。','Dann 是时间副词。und 连接两个动作，第二个动作省略相同主语 sie。','第一句是主系表结构。第二句用 und 连接 hat 和 bleibt 两个动作。'],
    examples:[['Am Abend kauft sie ein.','晚上她购物。'],['Nach der Arbeit nimmt er die Tasche mit.','下班后他带上包。'],['Im Park sieht sie einen Baum.','她在公园看见一棵树。'],['Ich kaufe Brot, aber ich brauche keinen Tee.','我买面包，但不需要茶。'],['Dann geht er nach Hause und trinkt Tee.','然后他回家喝茶。'],['Sie hat Zeit und liest ein Buch.','她有时间，读一本书。']],
    marked:{1:'Rucksack',5:'frisch'},
    meanings:{kauft:'购买；kaufen 的第三人称单数',markt:'市场；der Markt，复数 die Märkte',ein:'可分动词 einkaufen 的前缀；kauft ... ein 表示购物',sieht:'看见；原形 sehen',frisches:'新鲜的；frisch 的变格形式，修饰中性宾语 Brot',brot:'面包；das Brot，复数 die Brote',äpfel:'苹果；der Apfel 的复数',aber:'但是；并列连词',braucht:'需要；原形 brauchen',keinen:'没有；kein 的阳性第四格形式',dann:'然后'},
    question:'Was kauft Lena auf dem Markt?', choices:['Brot.','Tee.','Einen Rucksack.']
  },
  en: {
    title:'A Garden Worth Sharing',subtitle:'值得共享的一座花园',category:'环境与生活',
    sentences:['Beneath the trees, a community garden offers a quiet place to meet.','Although space is scarce, careful planning allows people to grow food together.','The garden requires sustained attention rather than a single enthusiastic effort.','Some people plant trees, while others provide water and care for the soil.','What makes the garden valuable is not only its beauty but also the relationships it creates.','Progress may be slow, yet the commitment extends beyond a single season.'],
    translations:['树下的一座社区花园提供了一个安静的见面空间。','虽然空间稀缺，细致的规划使人们能够一起种植食物。','这座花园需要持续关注，而不是一次热情的努力。','一些人种树，另一些人提供水并照顾土壤。','让花园珍贵的不仅是它的美，还有它建立的人际关系。','进展也许缓慢，但这份投入超越了单个季节。'],
    grammar:['Beneath the trees 是地点状语；a community garden 是主语；to meet 修饰 place。','Although 引导让步从句。allow somebody to do something 表示让某人能够做某事。','rather than 对比两种投入方式；sustained 修饰 attention，强调持续性。','while 连接对比的两个分句；care for 是照料的意思。','What makes the garden valuable 是主语从句；not only ... but also ... 连接两个表语。','yet 表转折；extends beyond 表示超越某一范围，这里是时间范围。'],
    examples:[['Beneath the bridge, a path offers a place to walk.','桥下的小路提供了散步的空间。'],['Although time is scarce, planning allows us to learn.','虽然时间少，规划使我们能够学习。'],['Learning requires practice rather than luck.','学习需要练习而非运气。'],['Some people read, while others listen.','一些人阅读，另一些人聆听。'],['What makes the place special is its history.','让这个地方特别的是它的历史。'],['Change is slow, yet our work continues.','变化缓慢，但我们的工作仍在继续。']],
    marked:{1:'scarce',2:'sustained'},
    meanings:{community:'社区；这里作定语',garden:'花园；名词',offers:'提供；offer 的第三人称单数',quiet:'安静的',meet:'见面；会面',although:'虽然；引导让步从句',space:'空间',allows:'使能够；allow 的第三人称单数',people:'人们',grow:'种植；生长',food:'食物',together:'一起',rather:'rather than 表示而不是',than:'与 rather 构成 rather than（而不是）',single:'单个的；一次的',enthusiastic:'充满热情的',effort:'努力',some:'一些',plant:'种植',others:'其他人',water:'水',care:'照料；care for 表示照料',for:'与 care 构成 care for（照顾）',soil:'土壤',what:'引导主语从句，意为……的事情',its:'它的',but:'但是；not only ... but also ... 表示不仅……而且……',also:'也',relationships:'人际关系；relationship 的复数',creates:'建立；创造',may:'可能；情态动词',our:'我们的',season:'季节'},
    question:'What does the garden need?', choices:['Sustained attention.','Only one day of work.','No planning.']
  }
};
const courseProgress = (()=>{
  try {
    const state=JSON.parse(localStorage.getItem('daily-page-progress')||'{}');
    for(const lang of ['de','en']) {
      if(!state[lang]) state[lang]={index:0,done:false};
      state[lang].completed=Math.max(state[lang].completed||0,state[lang].index+Number(state[lang].done));
    }
    return state;
  } catch { return {de:{index:0,done:false},en:{index:0,done:false}}; }
})();
function saveProgress(){localStorage.setItem('daily-page-progress',JSON.stringify(courseProgress));DailyStore.save().catch(()=>{})}
function currentCourse(lang){return courseProgress[lang].index>=2?courseProgress[lang].lesson:courseProgress[lang].index===1?nextLessons[lang]:null}
function syncCourse(){
  for(const lang of ['de','en']) {
    const data=currentCourse(lang),second=!!data;
    lessons[lang]=structuredClone(firstLessons[lang]);
    if(second) Object.assign(lessons[lang],{title:data.title,subtitle:data.subtitle,category:data.category,sentences:data.sentences,marked:data.marked,word:{}});
    const notes=second?data.translations.map((translation,i)=>lang==='de'?[translation,'',data.grammar[i],...data.examples[i]]:[translation,data.grammar[i],...data.examples[i]]):initialNotes[lang];
    const destination=lang==='de'?deNotes:enNotes;
    destination.splice(0,destination.length,...structuredClone(notes));
    originalWords[lang]=structuredClone(lessons[lang].word);
  }
}
function courseControls(){
  const state=courseProgress[language];
  const footer=document.querySelector('.article-end');
  if(!footer)return;
  const section=document.createElement('section');
  section.className='course-controls';
  section.innerHTML=`<small class="muted">第 ${state.index+1} 次学习 · ${state.done?'阅读已完成':'正在阅读'}</small><div class="row" style="flex-wrap:wrap;margin-top:12px">${state.done?`<button class="primary" data-course="next">继续学习下一篇 ${icon('arrow-right')}</button><button class="secondary" data-nav="home">今天到这里</button>`:`<button class="primary" data-course="finish">完成本篇阅读 ${icon('check')}</button>`}</div>`;
  footer.after(section);
  if(state.done){
    const label=document.createElement('label');label.textContent='这篇读起来：';
    const select=document.createElement('select');select.setAttribute('aria-label','阅读难度反馈');
    for(const [value,title] of [['hard','吃力，多复习'],['steady','刚刚好'],['easy','轻松，稍微提高']])select.add(new Option(title,value));
    select.value=state.comfort||'steady';select.onchange=()=>{state.comfort=select.value;saveProgress()};label.append(select);section.prepend(label);
  }
}
let generatingLesson=false;
document.addEventListener('click',async e=>{
  const action=e.target.closest('[data-course]')?.dataset.course;
  if(!action)return;
  const state=courseProgress[language];
  if(action==='finish') {
    if(!state.done){state.completed++;state.done=true;state.lastCompleted=new Date().toISOString();}saveProgress();render();
    document.querySelector('.course-controls')?.scrollIntoView({block:'center'});
  } else if(action==='next'&&state.done) {
    if(generatingLesson)return;
    if(state.index>=1){
      const lang=language,button=e.target.closest('[data-course]');
      generatingLesson=true;button.disabled=true;button.textContent='正在准备下一篇…';
      const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),90000);
      try{
        const words=[...saved.values()].filter(v=>v.language===lang).slice(-20).map(v=>v.word);
        const response=await api('/api/lesson',{language:lang,index:state.index+1,previousTitle:lessons[lang].title,words,duration:Number(settingValues.duration)||15,comfort:state.comfort||'steady'},controller.signal);
        const lesson=validateLesson((await response.json()).lesson);
        // Store content and cursor together. Failure leaves the completed lesson intact.
        const next={...state,index:state.index+1,done:false,lesson};
        localStorage.setItem('daily-page-progress',JSON.stringify({...courseProgress,[lang]:next}));
        courseProgress[lang]=next;await DailyStore.save();syncCourse();
        if(language===lang&&page==='reader'){sentenceIndex=0;go('reader')}else toast('下一篇已保存，随时可以继续');
      }catch(error){toast(error.name==='AbortError'?'生成超时，进度未推进，请重试':error.message)}
      finally{clearTimeout(timeout);generatingLesson=false;if(button.isConnected){button.disabled=false;button.textContent='继续学习下一篇'}}
      return;
    }
    state.index++;state.done=false;saveProgress();syncCourse();sentenceIndex=0;go('reader');
  }
});
syncCourse();
render();
