import {validateLesson} from './lesson-schema.mjs';
export const DATA_KEYS = ['daily-page-vocab', 'daily-page-settings', 'daily-page-progress'];
export const STATE_KEY = 'daily-page-state-v1';

export function validateData(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('备份格式不正确');
  const result = {};
  for (const key of DATA_KEYS) {
    if (typeof data[key] !== 'string') throw new Error('备份缺少学习记录');
    result[key] = data[key];
  }
  const vocab = JSON.parse(result[DATA_KEYS[0]]);
  if (!Array.isArray(vocab) || vocab.length > 50000 || vocab.some(row => !Array.isArray(row) || row.length !== 2 || typeof row[0] !== 'string' || !['de', 'en'].includes(row[1]?.language) || typeof row[1]?.word !== 'string')) throw new Error('生词记录损坏');
  const settings = JSON.parse(result[DATA_KEYS[1]]);
  if (!settings || typeof settings !== 'object' || Array.isArray(settings) || Object.values(settings).some(v => !['string', 'number', 'boolean'].includes(typeof v))) throw new Error('学习设置损坏');
  const progress = JSON.parse(result[DATA_KEYS[2]]);
  for (const lang of ['de', 'en']) {
    const item = progress[lang];
    if (!item || !Number.isSafeInteger(item.index) || item.index < 0 || typeof item.done !== 'boolean') throw new Error('课程进度损坏');
    if (item.completed !== undefined && (!Number.isSafeInteger(item.completed) || item.completed < 0)) throw new Error('完成记录损坏');
    if(item.lesson) validateLesson(item.lesson);
  }
  return result;
}

export function parseBackup(text) {
  if (text.length > 8 * 1024 * 1024) throw new Error('备份过大');
  const state = JSON.parse(text);
  if (state.format !== 'daily-page-backup' || state.version !== 1 || !Number.isFinite(Date.parse(state.updatedAt))) throw new Error('不支持这个备份版本');
  state.data = validateData(state.data);
  return state;
}

export function snapshot(storage) {
  const defaults = ['[]', '{}', JSON.stringify({de:{index:0,done:false},en:{index:0,done:false}})];
  const data = Object.fromEntries(DATA_KEYS.map((key, i) => [key, storage.getItem(key) ?? defaults[i]]));
  return {format:'daily-page-backup', version:1, updatedAt:new Date().toISOString(), data:validateData(data)};
}
