import {Capacitor} from '@capacitor/core';
import {Preferences} from '@capacitor/preferences';
import {Filesystem, Directory, Encoding} from '@capacitor/filesystem';
import {Share} from '@capacitor/share';
import {DATA_KEYS, STATE_KEY, parseBackup, snapshot} from './learning-state.mjs';

const native = Capacitor.isNativePlatform();
let queue = Promise.resolve();
let warning = '';
let status = '';
let restoring = false;
const notify = () => window.dispatchEvent(new Event('learning-storage'));

function apply(state) {
  for (const key of DATA_KEYS) localStorage.setItem(key, state.data[key]);
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

async function writeNative(text) {
  if (!native) return;
  const old = (await Preferences.get({key:STATE_KEY})).value;
  if (old) {
    try { parseBackup(old); await Preferences.set({key:STATE_KEY + '-previous', value:old}); } catch {}
  }
  await Preferences.set({key:STATE_KEY, value:text});
}

function save() {
  if (restoring) return queue;
  try {
    const text = JSON.stringify(snapshot(localStorage));
    localStorage.setItem(STATE_KEY, text);
    status = '正在保存'; notify();
    queue = queue.catch(() => {}).then(() => writeNative(text)).then(() => {
      status = native ? '已保存到本机原生存储' : '已保存到此浏览器'; notify();
    }).catch(() => { status = '原生副本保存失败，请导出备份'; notify(); });
    return queue;
  } catch {
    status = '保存失败，请立即导出备份'; notify();
    return Promise.reject(new Error(status));
  }
}

async function exportBackup() {
  const text = JSON.stringify(snapshot(localStorage), null, 2);
  const name = 'daily-page-backup-' + new Date().toISOString().slice(0,10) + '.json';
  if (native) {
    const file = await Filesystem.writeFile({path:name, data:text, directory:Directory.Cache, encoding:Encoding.UTF8});
    await Share.share({title:'学习记录备份', url:file.uri});
  } else {
    const url = URL.createObjectURL(new Blob([text], {type:'application/json'}));
    const a = Object.assign(document.createElement('a'), {href:url, download:name});
    a.click(); setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
}

window.DailyStore = {
  native, save, exportBackup,
  get status() { return status; },
  get warning() { return warning; },
  async importBackup(text) {
    const next = parseBackup(text);
    // Retain a rollback copy before a user-confirmed restore.
    localStorage.setItem(STATE_KEY + '-before-import', JSON.stringify(snapshot(localStorage)));
    restoring = true;
    try {
      await queue;
      next.updatedAt = new Date().toISOString();
      await writeNative(JSON.stringify(next));
      apply(next);
    } finally { restoring = false; }
  }
};

async function boot() {
  const candidates = [];
  for (const key of [STATE_KEY, STATE_KEY + '-previous']) {
    const values = [localStorage.getItem(key)];
    if (native) values.push((await Preferences.get({key})).value);
    for (const value of values.filter(Boolean)) {
      try { candidates.push(parseBackup(value)); } catch { warning = '发现损坏副本，已尝试恢复有效记录'; }
    }
  }
  if (candidates.length) {
    candidates.sort((a,b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
    apply(candidates[0]);
  } else {
    // First upgrade: adopt the old keys without renaming or resetting them.
    snapshot(localStorage);
  }
  await save();
  for (const src of ['app.js', 'course-progress.js', 'learning-tools.js']) {
    await new Promise((resolve,reject) => {
      const script = document.createElement('script');
      script.src = src; script.onload = resolve; script.onerror = reject;
      document.body.append(script);
    });
  }
}
boot().catch(() => {
  const main = document.querySelector('#main');
  main.replaceChildren();
  const p = document.createElement('p');
  p.textContent = '学习记录暂时无法载入，原记录未清除。请关闭后重开应用；仍失败时请保留应用并联系排查。';
  main.append(p);
});
