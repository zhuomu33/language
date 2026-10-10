// Shared validation for generated lessons and backups.
export function validateLesson(value) {
  const str=(v,max=1500)=>{if(typeof v!=='string'||!v.trim()||v.length>max||/[<>"&]/.test(v))throw new Error('文章格式不正确，请重新生成');return v};
  const list=(v,min,max,fn)=>{if(!Array.isArray(v)||v.length<min||v.length>max)throw new Error('文章内容不完整');return v.map(fn)};
  if(!value||typeof value!=='object')throw new Error('文章为空');
  const sentences=list(value.sentences,6,24,v=>str(v,600)),n=sentences.length,meanings={};
  if(!value.meanings||typeof value.meanings!=='object'||Array.isArray(value.meanings)||Object.keys(value.meanings).length>500)throw new Error('缺少词语解释');
  for(const [key,v] of Object.entries(value.meanings)){str(key,80);if(['__proto__','constructor','prototype'].includes(key))continue;meanings[key]=str(v,600)}
  return {title:str(value.title,180),subtitle:str(value.subtitle,180),category:'AI 原创故事',sentences,
    translations:list(value.translations,n,n,v=>str(v)),grammar:list(value.grammar,n,n,v=>str(v)),
    examples:list(value.examples,n,n,v=>list(v,2,2,s=>str(s,600))),meanings,marked:{},
    questions:list(value.questions,3,6,q=>({question:str(q.question,400),choices:list(q.choices,3,4,v=>str(v,400)),answer:(()=>{if(!Number.isInteger(q.answer)||q.answer<0||q.answer>=q.choices.length)throw new Error('答案无效');return q.answer})(),explanation:str(q.explanation,700)}))};
}
