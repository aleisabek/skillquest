/* ===================== STATE ===================== */
/* The build sets this to true for the phone version (published as a private artifact),
   where file downloads and the microphone aren't available. */
const PHONE = false;
const KEY = 'skillquest-v1';
const DEFAULT = {xp:0, streak:0, best:0, lastFull:null, days:{}, cards:{}, quiz:{}, miss:{}, term:{}, iv:{}, notes:{}, tickets:{}, sql:{}, gen:{}, mastery:{}, lessons:{}, recent:{}};
/* Progress safety: saved data that can't be read is copied aside and never saved over (saveBlocked) until you decide
   what to do on Today; a save the browser refuses (storage full or blocked) is reported instead of silently lost. */
let saveBlocked = false, saveFailed = false, saveWarned = false;
const QUIZ_FADE = 30;   /* days a right quiz answer stays retained (load's migration uses it, so it lives up here) */
let S = load();
if(!saveBlocked) save();   /* store upgrades made while loading (quiz dates, streak recount) right away */
function load(){
  let raw = null;
  try{ raw = localStorage.getItem(KEY); }catch(e){ saveFailed = true; }
  if(!raw) return structuredClone(DEFAULT);
  let st;
  try{ st = migrateTerm(Object.assign(structuredClone(DEFAULT), JSON.parse(raw))); }
  catch(e){
    try{ localStorage.setItem(KEY+'.corrupt-'+Date.now(), raw); }catch(e2){}
    saveBlocked = true;
    return structuredClone(DEFAULT);
  }
  try{ migrateQuiz(st); recountStreak(st); if(Array.isArray(st.journal)) st.journal = oneJournalPerId(st.journal); }catch(e){}   /* upgrades old quiz answers and repairs a streak shortened by an older merge; never blocks loading */
  return st;
}
/* true when progress reached storage */
function save(){
  if(saveBlocked){ warnSave('Not saved: your earlier progress could not be read. Open Today to choose what to do.'); return false; }
  try{ localStorage.setItem(KEY, JSON.stringify(S)); saveFailed = false; return true; }
  catch(e){ saveFailed = true; warnSave('Progress NOT saved: browser storage is full or blocked. Download a backup from How to use → Backup now.'); return false; }
}
function warnSave(msg){ if(saveWarned) return; saveWarned = true; try{ toast(msg); }catch(e){} }
/* Before anything that replaces progress (restore, merge, erase), keep the current state so it can be undone once. */
const PREV = KEY+'.prev';
function snapshot(what){ try{ localStorage.setItem(PREV, JSON.stringify({at:dayStr(), what, S})); return true; }catch(e){ return false; } }
function prevSnapshot(){ try{ const p = JSON.parse(localStorage.getItem(PREV)); return p && p.S ? p : null; }catch(e){ return null; } }
const UNDO_DAYS = 3;   /* the undo button is offered for this many days after a merge, restore or reset */
function prevRaw(){ try{ return localStorage.getItem(PREV); }catch(e){ return null; } }
function putPrevRaw(raw){ try{ if(raw == null) localStorage.removeItem(PREV); else localStorage.setItem(PREV, raw); }catch(e){} }
/* The undo copy is used up only once the restored progress has actually saved; otherwise nothing changes. */
function undoLast(){
  const p = prevSnapshot();
  if(!p){ toast('Nothing to undo'); return false; }
  const before = S, blocked = saveBlocked;
  S = recountStreak(migrateQuiz(migrateTerm(Object.assign(structuredClone(DEFAULT), p.S)))); saveBlocked = false;
  if(!save()){
    S = before; saveBlocked = blocked;
    toast('Not undone: browser storage refused to save it. The undo is still here; free some space and try again.');
    return false;
  }
  try{ localStorage.removeItem(PREV); }catch(e){}
  header(); toast('Undone: progress is back to how it was before the '+p.what);
  return true;
}
/* Replace progress (restore, merge, erase) with next(): keep the undo copy first, and keep the change only if it saves.
   'ok'; 'nosnap' = the undo copy couldn't be stored, so nothing changed (unless force); 'nosave' = storage refused the
   new progress, so the old progress and the earlier undo copy are put back; 'noundo' = saved, but you chose to go on
   without an undo copy (an older one is removed, so Undo can't bring back something unrelated); 'session' = storage
   isn't working at all, so the change lasts until the page closes. */
function replaceProgress(what, next, force){
  const before = structuredClone(S), blocked = saveBlocked, oldPrev = prevRaw(), storageDown = saveFailed;
  const snapped = snapshot(what);
  if(!snapped && !force) return 'nosnap';
  if(!snapped) putPrevRaw(null);
  S = next(); saveBlocked = false;
  if(save()) return snapped ? 'ok' : 'noundo';
  if(!snapped || storageDown){ if(!snapped) putPrevRaw(oldPrev); return 'session'; }   /* nothing new was stored, so the earlier undo still fits */
  S = before; saveBlocked = blocked; putPrevRaw(oldPrev);
  return 'nosave';
}
/* Storage is blocked outright (some private windows and embedded viewers) when it can't be used at all: even a tiny
   write fails and either nothing is stored or the refusal isn't about space. A browser that is merely full (a quota
   error while data is stored) is not blocked: freeing space fixes it, so no "go ahead without undo" is offered there. */
function storageBlocked(){
  try{ localStorage.setItem(KEY+'.probe', '1'); localStorage.removeItem(KEY+'.probe'); return false; }
  catch(e){ try{ return localStorage.length === 0 || !/quota/i.test((e && e.name || '')+' '+(e && e.message || '')); }catch(e2){ return true; } }
}
/* Say what really happened. If the undo copy couldn't be kept, nothing changes; only where storage is blocked
   outright (so restoring could never work otherwise) is going ahead offered, and Cancel stays the default. */
function replaceDone(r, done, retry){
  header();
  if(r === 'nosnap'){
    if(!storageBlocked()) return toast('Nothing changed: browser storage refused the undo copy (it may be full). Free some space or download a backup, then try again.');
    return askConfirm('This browser blocks storage, so no undo copy can be kept. If you go ahead, this cannot be undone, and it only lasts until you close the page. Go ahead?', 'Go ahead, no undo', ()=>replaceDone(retry(), done, retry));
  }
  vBackup();
  if(r === 'ok') toast(done+' Undo is on this page if it looks wrong.');
  else if(r === 'noundo') toast(done+' There is no undo for this one.');
  else if(r === 'session') toast(done+' Browser storage isn\'t saving, so this lasts until you close the page. Download a backup to keep it.');
  else if(r === 'nosave') toast('Nothing changed: browser storage refused to save it. Free some space or download a backup, then try again.');
}
function hasProgress(st){ st = st || S; return st.xp > 0 || Object.keys(st.mastery||{}).length > 0 || Object.keys(st.cards||{}).length > 0; }
/* 2026-10-27: Terminal skills were renamed to match the flashcard deck's topics. Progress under an old name
   moves to the new skill(s); where two old skills land on one new skill, the record with more practice wins.
   Safe to run any number of times (old backups are migrated when merged or restored). */
function migrateTerm(st){
  const TERM_RENAME = {'Reading files':['Reading & identifying'], 'Files & folders':['Files & names'], 'Searching':['Finding','Filtering text'],
    'Permissions & ownership':['Users, processes & privilege'], 'Services & logs':['Admin','Filtering text'], 'Disk & archives':['Archives','Admin'], 'Scheduling (cron)':['Admin']};
  const better = (a, b)=>!a || b.n > a.n || (b.n === a.n && (b.last||'') > (a.last||''));
  for(const [old, news] of Object.entries(TERM_RENAME)){
    const oid = 'term:linux:'+old;
    const m = st.mastery && st.mastery[oid];
    if(m){ news.forEach(n=>{ const nid = 'term:linux:'+n; if(better(st.mastery[nid], m)) st.mastery[nid] = Object.assign({}, m); }); delete st.mastery[oid]; }
    const l = st.lessons && st.lessons[oid];
    if(l){ news.forEach(n=>{ const nid = 'term:linux:'+n; if((st.lessons[nid]||'') < l) st.lessons[nid] = l; }); delete st.lessons[oid]; }
    (st.journal||[]).forEach(e=>{ if(e.sid === oid) e.sid = 'term:linux:'+news[0]; });
  }
  return st;
}

/* ===================== HELPERS ===================== */
const $ = s => document.querySelector(s);
const view = $('#view');
function dayStr(d){ d = d || new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function addDays(str, n){ const d = new Date(str+'T12:00:00'); d.setDate(d.getDate()+n); return dayStr(d); }
function dayNum(){ return Math.floor(new Date(dayStr()+'T12:00:00').getTime()/86400000); }
function shuffle(a){ a = a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function track(id){ return TRACKS.find(t=>t.id===id); }
function esc(s){ return String(s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function rankOf(xp){ let r = RANKS[0], next = null; for(let i=0;i<RANKS.length;i++){ if(xp>=RANKS[i][0]){ r=RANKS[i]; next=RANKS[i+1]||null; } } return {r, next}; }
let toastT;
function toast(msg, ms){ const t=$('#toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'), ms || 1800); }
function addXP(n, why){
  const before = rankOf(S.xp).r[1];
  S.xp += n; save(); header();
  const after = rankOf(S.xp).r[1];
  if(after !== before) toast('🎉 Rank up: ' + after + '!'); else if(why) toast('+' + n + ' XP · ' + why);
}
/* In-page confirmation (browser confirm() pop-ups don't work in every place the app runs, e.g. the phone version). */
function askConfirm(msg, yesLabel, onYes){
  const old = $('#ask'); if(old) old.remove();
  const box = document.createElement('div'); box.id = 'ask'; box.className = 'ask';
  box.innerHTML = '<div class="card" role="dialog" aria-modal="true"><p>'+esc(msg)+'</p><div class="row"><button class="primary" id="askYes">'+esc(yesLabel)+'</button><button id="askNo">Cancel</button></div></div>';
  document.body.appendChild(box);
  $('#askNo').onclick = ()=>box.remove();
  $('#askYes').onclick = ()=>{ box.remove(); onYes(); };
  $('#askNo').focus();
}
/* Backups as text, for devices where file downloads are blocked (copy on one device, paste on the other). */
function copyBackupText(){
  const txt = JSON.stringify(S);
  try{ navigator.clipboard.writeText(txt).then(()=>{ S.lastBackup = dayStr(); save(); toast('Backup copied. Paste it into SkillQuest on your other device (How to use → Backup).'); if(current === 'backup') vBackup(); }, ()=>showBackupText(txt)); }
  catch(e){ showBackupText(txt); }
}
function showBackupText(txt){ const t = $('#bkText'); if(t){ t.hidden = false; t.value = txt; t.select(); toast('Copy blocked here: the backup text is selected below, copy it manually.'); } }
/* Backups: a JSON file of all progress. The date is remembered so Today can remind you weekly. */
function downloadBackup(){
  if(PHONE) return copyBackupText();
  S.lastBackup = dayStr(); save();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(S,null,1)], {type:'application/json'}));
  a.download = 'skillquest-backup-'+dayStr()+'.json'; a.click();
  toast('Backup downloaded. Keep it somewhere safe, like OneDrive or a USB drive.');
}
/* Combine progress from two devices (e.g. phone + PC) instead of overwriting one with the other.
   For each kind of data, keep the most progress: higher scores, later dates, and both sets of entries.
   Order doesn't matter: merging phone into PC gives the same progress as PC into phone, because every conflict is
   settled by a rule that looks only at the two values, and a full tie falls back to stableStr (never "whichever came
   first"). Only this device's own view state (today's plan, recently shown items) stays with the device you merge into. */
const stableStr = x=>JSON.stringify(x, (k, v)=>v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map(j=>[j, v[j]])) : v);
const tieLow = (x, y)=>stableStr(x) <= stableStr(y) ? x : y;   /* same answer whichever way round */
function mergeProgress(a, b){
  /* rename old skill names on both sides first, so a conflict between devices always goes through the rules below
     (migrateTerm's own "most practised" choice is only for renamed skills within one device) */
  a = migrateTerm(structuredClone(a)); b = migrateTerm(structuredClone(b));
  const m = Object.assign(structuredClone(DEFAULT), structuredClone(a));
  const maxNum = k=>{ m[k] = Math.max(a[k]||0, b[k]||0); };
  ['xp','best'].forEach(maxNum);
  const later = (x,y)=>(x||'') >= (y||'') ? x : y;
  /* streak: take it from whichever device had a full day most recently (the longer streak on the same day), then
     recount it from the combined days (after days are merged below), so days done on different devices add up */
  if((b.lastFull||'') > (a.lastFull||'')){ m.streak = b.streak; m.lastFull = b.lastFull; }
  else if((b.lastFull||'') === (a.lastFull||'')) m.streak = Math.max(a.streak||0, b.streak||0);
  m.lastBackup = later(a.lastBackup, b.lastBackup);
  /* simple maps: union; on conflict keep the "more done" value */
  for(const k of ['quiz','term','sql','lessons','labs','practice','notes']){
    m[k] = Object.assign({}, a[k]||{});
    for(const [x,v] of Object.entries(b[k]||{})){
      const o = m[k][x];
      if(o === undefined) m[k][x] = v;
      else if(k === 'notes') m[k][x] = String(v).length !== String(o).length ? (String(v).length > String(o).length ? v : o) : tieLow(o, v);   /* keep the longer note */
      else if(typeof o === 'string' && typeof v === 'string') m[k][x] = later(o, v);   /* dates: keep the latest */
      else if(o === true && typeof v === 'string') m[k][x] = v;   /* a real date beats an old "done" flag */
    }
  }
  for(const k of ['iv','tickets']){ m[k] = Object.assign({}, a[k]||{}); for(const [x,v] of Object.entries(b[k]||{})) m[k][x] = Math.max(m[k][x]||0, v); }
  /* misses: keep a miss from either device. S.quiz stays true once a question was ever right, so it can't clear a miss;
     the miss clears when the question is answered right again. */
  m.miss = Object.assign({}, a.miss||{}, b.miss||{});
  /* a dated miss is dropped when the kept right answer is from a later day (newer results win); an undated (older build)
     miss is kept, so a miss is never lost on a guess */
  m.missAt = {};
  for(const x of Object.keys(m.miss)){
    const ds = [[a, a.missAt], [b, b.missAt]].filter(([s])=>(s.miss||{})[x]).map(([, at])=>(at||{})[x] || null);
    const when = ds.filter(Boolean).sort().pop();
    if(ds.every(Boolean) && typeof m.quiz[x] === 'string' && m.quiz[x] > when){ delete m.miss[x]; continue; }
    if(when) m.missAt[x] = when;
  }
  if(!Object.keys(m.missAt).length) delete m.missAt;
  /* first day of each question's run of right answers: take it from the device whose latest right answer was kept
     (both, if the same day: the earlier start); a miss on either device still sends the question back to Learning */
  m.qfirst = {};
  const qa = a.quiz||{}, qb = b.quiz||{}, fa = a.qfirst||{}, fb = b.qfirst||{};
  for(const x of new Set([...Object.keys(fa), ...Object.keys(fb)])){
    const pick = m.quiz[x] === qa[x] && m.quiz[x] === qb[x] ? [fa[x], fb[x]].filter(Boolean).sort()[0] : m.quiz[x] === qb[x] ? fb[x] : fa[x];
    if(pick) m.qfirst[x] = pick;
  }
  /* days: union of completed steps (a flag set on either device stays set) */
  const bareRev = v=>{ v = Object.assign({}, v||{}); if(v.rev === true && !v.reviews && !['learn','p0','p1','p2','apply','quiz','skill','iv'].some(k=>v[k])) delete v.rev; return v; };
  m.days = Object.fromEntries(Object.entries(a.days||{}).map(([d, v])=>[d, bareRev(v)]));
  for(const [d,v0] of Object.entries(b.days||{})){ const v = bareRev(v0), md = m.days[d] = Object.assign({}, m.days[d]||{});
    for(const [k,x] of Object.entries(v||{})) md[k] = (md[k] === true || x === true) ? true : md[k] === undefined ? x
      : typeof x === 'number' && typeof md[k] === 'number' ? Math.max(md[k], x) : tieLow(md[k], x); }
  /* flashcards: keep the most recently reviewed record (review day = due minus its gap), so a lapse on one device
     isn't erased by an older, higher box from the other; on a tie keep the higher box */
  const reviewed = c=>addDays(c.due, -(BOX_DAYS[c.box] || 0));
  m.cards = Object.assign({}, a.cards||{});
  for(const [x,v] of Object.entries(b.cards||{})){ const o = m.cards[x];
    m.cards[x] = !o ? v : reviewed(v) !== reviewed(o) ? (reviewed(v) > reviewed(o) ? v : o) : v.box !== o.box ? (v.box > o.box ? v : o) : tieLow(o, v); }
  /* skill mastery: the newer record wins (Alei, 2026-11-04), so a recent lapse can't be erased by an older record
     that simply had more practice; on the same day the lower score wins, because a tie shouldn't claim more skill.
     This is for progress records from two devices. (A future pilot attempt with one ID finished differently on two
     devices is a different case: keep both, flag it unresolved, and give no credit until it's resolved.) */
  const newerSkill = (o, v)=>{
    if((v.last||'') !== (o.last||'')) return (v.last||'') > (o.last||'') ? v : o;
    if((v.s||0) !== (o.s||0)) return (v.s||0) < (o.s||0) ? v : o;
    return tieLow(o, v);
  };
  m.mastery = Object.assign({}, a.mastery||{}); for(const [x,v] of Object.entries(b.mastery||{})){ const o = m.mastery[x]; m.mastery[x] = o ? newerSkill(o, v) : v; }
  /* generated-problem counters: keep the larger totals */
  m.gen = Object.assign({}, a.gen||{}); for(const [x,v] of Object.entries(b.gen||{})){ const o = m.gen[x];
    m.gen[x] = !o ? v : v.total !== o.total ? (v.total > o.total ? v : o) : tieLow(o, v); }
  /* journal: union by question; a mistake cleared on either device stays cleared */
  /* the same entry from both devices: a cleared one beats an open one, then more retries, then a fixed tie-break */
  const journalPick = (o, e)=>!!e.done !== !!o.done ? (e.done ? e : o) : (e.hits||[]).length !== (o.hits||[]).length ? ((e.hits||[]).length > (o.hits||[]).length ? e : o) : tieLow(o, e);
  const J = new Map(); for(const e of [...(a.journal||[]), ...(b.journal||[])]){ const k = e.key+'|'+e.at, o = J.get(k); J.set(k, o ? journalPick(o, e) : e); }
  const byKeyThen = (x,y)=>(y.at||'').localeCompare(x.at||'') || stableStr(x).localeCompare(stableStr(y));
  m.journal = oneJournalPerId([...J.values()]).sort(byKeyThen).slice(0, JOURNAL_MAX);
  /* exam history: union, newest first */
  const E = new Map(); for(const e of [...(a.exams||[]), ...(b.exams||[])]){ const k = e.cert+e.date+e.pct+e.n+e.secs, o = E.get(k); E.set(k, o ? tieLow(o, e) : e); }
  m.exams = [...E.values()].sort((x,y)=>y.date.localeCompare(x.date) || stableStr(x).localeCompare(stableStr(y))).slice(0, 50);
  if(a.typed === false && b.typed === false) m.typed = false; else delete m.typed;
  mergePilot(m, a, b);
  return recountStreak(migrateQuiz(migrateTerm(m)));
}
/* Imported backups are untrusted text: keep only known fields with the right types, so a damaged or tampered file
   can't break a tab or inject markup. Older backups (missing newer fields) still restore. null = not a SkillQuest backup. */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const isObj = v=>!!v && typeof v === 'object' && !Array.isArray(v);
const clampNum = (v, lo, hi)=>{ v = Number(v); return Number.isFinite(v) ? Math.min(Math.max(v, lo), hi) : lo; };
const okDate = v=>typeof v === 'string' && DATE_RE.test(v) ? v : null;
function cleanMap(v, fix){
  const o = {};
  if(isObj(v)) for(const [k, x] of Object.entries(v)){
    if(k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
    const y = fix(x, k); if(y !== undefined && y !== null) o[k] = y;
  }
  return o;
}
function sanitizeBackup(b){
  if(!isObj(b) || !('xp' in b)) return null;
  const flag = x=>x === true ? true : undefined;
  const s = {xp:clampNum(b.xp, 0, 1e9), best:clampNum(b.best, 0, 1e5), streak:clampNum(b.streak, 0, 1e5), lastFull:okDate(b.lastFull)};
  if(okDate(b.lastBackup)) s.lastBackup = b.lastBackup;
  s.days = cleanMap(b.days, (v, k)=>DATE_RE.test(k) ? cleanMap(v, (x, f)=>f === 'reviews' ? clampNum(x, 0, 1e5) : (x === true || x === false) ? x : undefined) : undefined);
  s.cards = cleanMap(b.cards, v=>{ if(!isObj(v) || !okDate(v.due)) return; const c = {box:Math.round(clampNum(v.box, 1, 5)), due:v.due}; if(okDate(v.seen)) c.seen = v.seen; return c; });
  s.quiz = cleanMap(b.quiz, v=>v === true || okDate(v) ? v : undefined);
  if(isObj(b.qfirst)) s.qfirst = cleanMap(b.qfirst, okDate);
  for(const k of ['miss','term','sql']) s[k] = cleanMap(b[k], flag);
  if(isObj(b.missAt)) s.missAt = cleanMap(b.missAt, okDate);
  s.iv = cleanMap(b.iv, v=>clampNum(v, 0, 3));
  s.tickets = cleanMap(b.tickets, v=>clampNum(v, 0, 100));
  s.notes = cleanMap(b.notes, v=>typeof v === 'string' ? v.slice(0, 20000) : undefined);
  for(const k of ['lessons','labs','practice']) s[k] = cleanMap(b[k], okDate);
  s.gen = cleanMap(b.gen, v=>isObj(v) ? {right:clampNum(v.right, 0, 1e7), total:clampNum(v.total, 0, 1e7)} : undefined);
  s.mastery = cleanMap(b.mastery, v=>{ if(!isObj(v)) return;
    const m = {s:clampNum(v.s, 0, 100), n:clampNum(v.n, 0, 1e7), right:clampNum(v.right, 0, 1e7), last:okDate(v.last)};
    if(v.rd !== undefined){ m.rd = Math.round(clampNum(v.rd, 0, 1e5)); m.lr = okDate(v.lr); }
    return m; });
  s.recent = cleanMap(b.recent, v=>Array.isArray(v) ? v.filter(x=>typeof x === 'string').slice(-80) : undefined);
  s.journal = (Array.isArray(b.journal) ? b.journal : []).map(cleanEntry).filter(Boolean).slice(0, JOURNAL_MAX);
  const certs = CERTS.map(c=>c.id);
  s.exams = (Array.isArray(b.exams) ? b.exams : []).filter(e=>isObj(e) && certs.includes(e.cert) && okDate(e.date))
    .map(e=>({cert:e.cert, date:e.date, n:clampNum(e.n, 0, 1000), pct:clampNum(e.pct, 0, 100), secs:clampNum(e.secs, 0, 1e6), doms:cleanMap(e.doms, v=>clampNum(v, 0, 100))})).slice(0, 50);
  /* pilot lab reports: each one validated in full; a damaged or newer-version report is refused, never half-kept */
  const ev = cleanEvidence(b.evidence); s.evidence = ev.list; EV_REJECTED = ev.bad.length;
  s.evres = cleanResolutions(b.evres);
  if(isObj(b.pilot) && okDate(b.pilot.worked)) s.pilot = {worked:b.pilot.worked};
  if(b.typed === false) s.typed = false;
  return s;
}
let EV_REJECTED = 0;   /* pilot reports refused by the last backup read; shown with the restore/merge message */
const evNote = ()=>EV_REJECTED ? ' '+EV_REJECTED+' pilot lab report'+(EV_REJECTED === 1 ? ' was' : 's were')+' refused (damaged, or from a newer version) and not imported.' : '';
/* Journal entries from a backup: fixed questions are re-read from QUIZ (never trusted from the file); generated ones keep only safe markup. */
function cleanEntry(e){
  if(!isObj(e) || !['quiz','term','sql','lab'].includes(e.kind)) return null;
  const x = {id:/^[\w-]{1,40}$/.test(e.id) ? e.id : 'm'+Math.random().toString(36).slice(2, 10), kind:e.kind, key:String(e.key||'').slice(0, 2000),
    at:okDate(e.at) || dayStr(), count:Math.round(clampNum(e.count, 1, 1e4)), hits:(Array.isArray(e.hits) ? e.hits : []).filter(okDate).slice(0, 10),
    done:e.done === true, why:WHY.some(w=>w[0]===e.why) ? e.why : null, your:typeof e.your === 'string' ? e.your.slice(0, 2000) : '', sid:typeof e.sid === 'string' ? e.sid.slice(0, 200) : null};
  if(okDate(e.doneAt)) x.doneAt = e.doneAt;
  if(okDate(e.tried)) x.tried = e.tried;
  if(e.kind === 'lab') x.wait = Math.round(clampNum(e.wait, 0, 30));
  if(e.kind !== 'quiz'){ x.task = String(e.task||'').slice(0, 2000); x.model = String(e.model||'').slice(0, 2000); return x; }
  if(Number.isInteger(e.qi) && QUIZ[e.qi]){ x.qi = e.qi; x.d = QUIZ[e.qi].slice(0, 6); }
  else {
    const d = e.d;
    if(!Array.isArray(d) || !TRACKS.some(t=>t.id===d[0]) || !Array.isArray(d[3]) || !d[3].length) return null;
    const opts = d[3].slice(0, 8).map(safeHTML);
    x.qi = null; x.d = [d[0], Math.round(clampNum(d[1], 1, 4)), safeHTML(d[2]), opts, Math.round(clampNum(d[4], 0, opts.length-1)), safeHTML(d[5])];
  }
  x.key = 'quiz|'+x.d[2];
  return x;
}
/* Keep only harmless formatting tags (attributes dropped, except a plain class) from imported HTML; escape everything else. */
const SAFE_TAGS = /^(code|b|i|em|strong|br|p|ul|ol|li|span|div|table|thead|tbody|tr|td|th|pre|sub|sup)$/;
function safeHTML(h){
  return String(h == null ? '' : h).slice(0, 20000).replace(/<(\/?)([a-z][a-z0-9]*)([^<>]*)>|[<>]/gi, (m, close, tag, attrs)=>{
    if(!tag) return m === '<' ? '&lt;' : '&gt;';
    tag = tag.toLowerCase();
    if(!SAFE_TAGS.test(tag)) return esc(m);
    const cls = !close && /^\s*class="([\w -]*)"\s*\/?\s*$/.exec(attrs);
    return '<'+close+tag+(cls ? ' class="'+cls[1]+'"' : '')+'>';
  });
}
/* Quiz answers store the day they were answered right (they used to be true). An old true gets today's date once,
   so nothing you know drops at the switch; it starts fading QUIZ_FADE days later unless you answer it again. */
function migrateQuiz(st){
  for(const k of Object.keys(st.quiz||{})) if(st.quiz[k] === true){
    /* spread over the fade window by key, so old answers don't all fade on the same day */
    let h = 0; for(const c of k) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    st.quiz[k] = addDays(dayStr(), -(h % QUIZ_FADE));
  }
  /* Two-day rule (qfirst = first day of the current run of right answers): an answer recorded before the rule, or from a
     backup without it, counts as one proven day, so one more right answer on a later day proves it. */
  st.qfirst = st.qfirst || {};
  for(const [k, v] of Object.entries(st.quiz||{})) if(!st.qfirst[k] && typeof v === 'string') st.qfirst[k] = v;
  /* Same for skills: rd = days with a right answer, lr = the last such day. Older records count as one day. */
  for(const m of Object.values(st.mastery||{})) if(m && m.rd === undefined && m.right > 0){ m.rd = 1; m.lr = m.last || null; }
  return st;
}
/* Retained needs right answers on two different days: once is a good sign, twice on separate days is learning. */
const QUIZ_DAYS = 2;
function provenTwice(id){ const v = S.quiz[id], f = (S.qfirst||{})[id]; return typeof v === 'string' && !!f && v > f; }
function quizRight(id, firstDay){
  S.qfirst = S.qfirst || {};
  if(S.miss[id] || !S.qfirst[id]) S.qfirst[id] = firstDay || dayStr();   /* a miss restarts the run */
  S.quiz[id] = dayStr(); delete S.miss[id]; if(S.missAt) delete S.missAt[id];
}
/* Rebuild streak and best from the full days themselves (see isFullDay). Only ever raises them,
   or moves lastFull to a later full day, so it is safe on load and after merges. */
function recountStreak(st){
  const full = Object.keys(st.days||{}).filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d) && isFullDay(st.days[d])).sort();
  if(!full.length) return st;
  let run = 1, best = 1;
  for(let i=1;i<full.length;i++){ run = full[i-1] === addDays(full[i], -1) ? run+1 : 1; best = Math.max(best, run); }
  const last = full[full.length-1];
  if(last > (st.lastFull||'')){ st.lastFull = last; st.streak = run; }
  else if(last === st.lastFull) st.streak = Math.max(st.streak||0, run);
  st.best = Math.max(st.best||0, best, st.streak||0);
  return st;
}
function backupDue(){
  if(!hasProgress()) return false;
  if(!S.lastBackup) return true;
  return (new Date(dayStr()+'T12:00:00') - new Date(S.lastBackup+'T12:00:00')) / 86400000 > 7;
}
function cardId(i){ return 'c'+i; }
function quizId(i){ return 'q'+i; }
function cardDue(i){ const c = S.cards[cardId(i)]; return !c || c.due <= dayStr(); }
/* Honest mastery: a card counts only while it is proven (box 3+) and not overdue by more than its own review gap;
   a quiz question counts only if your latest answer to it was right and under QUIZ_FADE days old (see quizStatus). */
function cardStatus(i){
  const c = S.cards[cardId(i)];
  if(!c) return 'new';
  if(c.box < 3) return 'learning';
  return addDays(c.due, BOX_DAYS[c.box]) < dayStr() ? 'fading' : 'retained';
}
/* A quiz question counts while your latest answer was right and that answer is under QUIZ_FADE days old (defined
   at the top); after that it shows as Fading until you answer it right again (Review → Fading quiz questions). */
function quizStatus(i){
  const id = quizId(i), v = S.quiz[id];
  if(S.miss[id]) return 'learning';
  if(!v) return 'new';
  if(typeof v === 'string' && !provenTwice(id)) return 'learning';
  return typeof v === 'string' && addDays(v, QUIZ_FADE) < dayStr() ? 'fading' : 'retained';
}
function fadingQuiz(){ return QUIZ.map((q,i)=>i).filter(i=>quizStatus(i)==='fading'); }
function levelStats(tid, lv){
  const st = {retained:0, fading:0, learning:0, new:0, total:0};
  QUIZ.forEach((q,i)=>{ if(q[0]===tid && q[1]===lv){ st[quizStatus(i)]++; st.total++; } });
  CARDS.forEach((c,i)=>{ if(c[0]===tid && c[1]===lv){ st[cardStatus(i)]++; st.total++; } });
  return st;
}
const STATUS = {retained:'Retained', fading:'Fading', learning:'Learning', new:'New'};
function statsLine(st){
  return '<div class="small mstats" title="Retained: proven (questions right on two different days) and recent. Fading: proven, but overdue for review. Learning: seen, not proven yet. New: never seen.">'+
    Object.keys(STATUS).map(k=>'<span class="st-'+k+'">'+STATUS[k]+' '+st[k]+'</span>').join(' · ')+'</div>';
}

/* ===================== DAILY LEARNING LOOP =====================
   Every day: LEARN 3 lessons → PRACTICE 4 exercises from each of those skills → APPLY one ticket or interview rep
   in the same area → REVIEWS. The lessons are the input, the exercises and the rep are the output.

   Career path: cloud security and red team, foundations first. Every beginner skill stays; the path only orders them.
   Per track, Level 1 skills come first and its Level 2 skills open once the Level 1 ones average PATH.solid.
   Weights say how central a track is to both paths (Software Testing is not on it; it stays in Study).
   Cloud Security and Offensive Security are the later stages (gated below). */
const PATH = {name:'Cloud security + Red team', weights:{linux:3, net:3, sec:3, code:2, sql:2, support:1, cloud:2, offsec:2}, solid:70,
  /* later-stage tracks open only when these tracks' Level 1 skills each average PATH.solid; together they take at most
     gatedMax of the day's slots */
  after:{cloud:['sec','net'], offsec:['sec','net','linux','code']}, gatedMax:1};
const isGated = tid=>!!PATH.after[tid];
function previewLesson(tid){ const s = allSkills().find(x=>x.tid===tid && lessonFor(x.id)); return s && s.id; }
/* Once a gated track is started it stays open: foundation scores decay between sessions, and a short break
   shouldn't hide progress already made. Locked tracks can't be practiced anywhere, so a mastery record means it was open. */
function trackOpen(tid){
  if(!isGated(tid)) return true;
  const M = S.mastery || {};
  return allSkills().some(s=>s.tid===tid && M[s.id]) || PATH.after[tid].every(t=>trackL1Avg(t) >= PATH.solid);
}
/* "Security L1 54/70 · Networking L1 41/70": the honest distance to unlocking a gated track (floored, so 69.6 never reads 70/70) */
function unlockText(tid){ return (PATH.after[tid] || []).map(t=>track(t).name+' L1 '+Math.floor(trackL1Avg(t))+'/'+PATH.solid).join(' · '); }
const PRACTICE_N = 4;
function pathSkills(){ return allSkills().filter(s=>PATH.weights[s.tid] && lessonFor(s.id)); }
const skillLevel = s=>Math.min(...s.lvs);
function trackL1Avg(tid){
  const l1 = pathSkills().filter(s=>s.tid===tid && skillLevel(s)===1);
  return l1.length ? l1.reduce((a,s)=>a+skillScore(s.id),0) / l1.length : 100;
}
function hashStr(t){ let h = 0; for(const c of t) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }
/* Today's 3 skills, fixed for the day: two path skills from different tracks (started-but-weak first, then new ones by
   track weight and level), plus one "weakest" slot for a started path skill that is slipping. */
function dailyPlan(){
  const d = dayStr();
  if(S.plan && S.plan.day === d && S.plan.ids.length && S.plan.ids.every(skillById)) return S.plan;
  /* how many days in a row each skill has held a slot; a skill that has held one 3 days running steps aside for a new one */
  const prev = S.plan && S.plan.day === addDays(d, -1) ? S.plan : null, runs0 = (prev && prev.runs) || {};
  const run = s=>prev && prev.ids.includes(s.id) ? (runs0[s.id] || 1) : 0;
  const M = S.mastery||{}, tie = s=>hashStr(s.id+d);
  /* a later-stage track is taught in its own order: only its first unstarted skill is offered (Scoping before anything offensive) */
  const firstNew = tid=>pathSkills().find(x=>x.tid===tid && !M[x.id]);
  const pool = pathSkills().filter(s=>trackOpen(s.tid) && (skillLevel(s)===1 || trackL1Avg(s.tid) >= PATH.solid) && (!isGated(s.tid) || M[s.id] || firstNew(s.tid) === s));
  /* at most PATH.gatedMax of the day's skills may come from a gated (later-stage) track */
  const room = s=>!isGated(s.tid) || ids.filter(id=>isGated(skillById(id).tid)).length < PATH.gatedMax;
  const key = s=>M[s.id] ? [0, skillScore(s.id), 0, tie(s)] : [1, -PATH.weights[s.tid], skillLevel(s), tie(s)];
  const cmp = (a,b)=>{ const x = key(a), y = key(b); for(let i=0;i<4;i++) if(x[i] !== y[i]) return x[i] - y[i]; return 0; };
  const need = pool.filter(s=>skillScore(s.id) < PATH.solid).sort((a,b)=>(run(a) >= 3) - (run(b) >= 3) || cmp(a,b));
  const ids = [];
  for(const s of need){ if(ids.length < 2 && room(s) && !ids.some(id=>skillById(id).tid === s.tid)) ids.push(s.id); }
  for(const s of need){ if(ids.length < 2 && room(s) && !ids.includes(s.id)) ids.push(s.id); }
  /* any started skill can come back here, including Level 2 skills whose track foundations have since dipped */
  const slipping = pathSkills().filter(s=>trackOpen(s.tid) && M[s.id] && !ids.includes(s.id) && room(s)).sort((a,b)=>skillScore(a.id)-skillScore(b.id) || tie(a)-tie(b));
  const tracksSoFar = ids.map(id=>skillById(id).tid);
  /* third slot: a skill that has really slipped (under PATH.solid) first; then an opened later-stage track, so
     later-stage tracks don't wait behind every half-learned skill once unlocked; then a mildly slipping skill; then a new skill elsewhere.
     A later-stage track with nothing practiced in 3 days goes ahead of the slipped skill, so none starves mid-path. */
  const gatedFree = need.filter(s=>isGated(s.tid) && room(s) && !ids.includes(s.id)), gatedNext = gatedFree[0];
  const practicedLately = tid=>pathSkills().some(s=>s.tid===tid && M[s.id] && M[s.id].last && daysSince(M[s.id].last) < 3);
  const gatedStale = gatedFree.find(s=>!practicedLately(s.tid));
  const third = gatedStale || slipping.find(s=>skillScore(s.id) < PATH.solid) || gatedNext
    || slipping.find(s=>skillScore(s.id) < 85)
    || need.find(s=>room(s) && !ids.includes(s.id) && !tracksSoFar.includes(s.tid)) || need.find(s=>room(s) && !ids.includes(s.id)) || slipping[0];
  if(third) ids.push(third.id);
  /* everything solid: keep it fresh with the weakest path skills, different tracks first */
  const rest = pool.slice().sort((a,b)=>skillScore(a.id)-skillScore(b.id) || tie(a)-tie(b));
  for(const s of rest) if(ids.length < 3 && room(s) && !ids.includes(s.id) && !ids.some(id=>skillById(id).tid === s.tid)) ids.push(s.id);
  for(const s of rest) if(ids.length < 3 && room(s) && !ids.includes(s.id)) ids.push(s.id);
  const runs = {}; ids.slice(0, 3).forEach(id=>{ runs[id] = prev && prev.ids.includes(id) ? (runs0[id] || 1) + 1 : 1; });
  S.plan = {day:d, ids:ids.slice(0, 3), runs, apply:applyRep(ids[0])};
  save();
  return S.plan;
}
/* The rep for today: a ticket scenario in the main skill's area while its best score is under 90, otherwise an interview question. */
const SCEN_TRACK = {disk:'linux', noc:'net', pos:'support', lockout:'support', regression:'qa', phish:'sec', leakedkey:'cloud', scope:'offsec'};
function applyRep(id){
  const s = id && skillById(id), tid = s ? s.tid : 'linux';
  const sc = SCEN.findIndex(x=>SCEN_TRACK[x.id] === tid && ((S.tickets||{})[x.id]||0) < 90);
  if(sc >= 0) return {kind:'ticket', i:sc};
  const qs = IV.map((q,i)=>i).filter(i=>IV[i].c==='technical' || IV[i].c==='jobready');
  const open = qs.filter(i=>((S.iv||{})['i'+i]||0) < 3), list = open.length ? open : qs;
  return {kind:'iv', i:list[dayNum() % list.length]};
}
/* A lesson is needed if never read, or (read before today) the skill dropped under 50% or you missed 2+ of its exercises today. */
function lessonNeeded(id){
  if(!lessonFor(id)) return false;
  const read = (S.lessons||{})[id], m = (S.mastery||{})[id], slip = (S.slip||{})[id];
  if(!read) return true;
  if(read === dayStr()) return false;
  /* slipped = it was once solid (60%+) and is now under 50%, or it's still under 50% three days after the lesson,
     or you missed 2+ of its exercises on a day after reading it. A weak skill isn't re-assigned its lesson every day. */
  const v = skillScore(id), slipped = !!m && m.s >= 60 && v < 50, stuck = !!m && v < 50 && read <= addDays(dayStr(), -3);
  return slipped || stuck || (!!slip && slip.n >= 2 && slip.day > read);
}
function todaySteps(){
  const plan = dailyPlan(), d = dayStr(), day = S.days[d] || {};
  const lessons = plan.ids.map(id=>({id, state:(S.lessons||{})[id] === d ? 'read' : lessonNeeded(id) ? 'todo' : 'skip'}));
  const practice = plan.ids.map((id,i)=>!!day['p'+i]);
  return {plan, day, lessons, practice, learn:lessons.every(l=>l.state !== 'todo'), practiced:practice.every(Boolean), applied:!!day.apply, reviewed:reviewsOk(day)};
}
/* Store the step flags a full day needs (learn, practice) once they're earned. Learn counts once a lesson was read or
   practice started, so a day where every lesson is skipped for being healthy isn't "started" by just opening Today. */
function syncPlanFlags(){
  const day = S.days[dayStr()]; if(!day) return;
  const st = todaySteps();
  if(st.practiced) day.practice = true;
  if(st.learn && (st.lessons.some(l=>l.state === 'read') || st.practice.some(Boolean) || day.apply)) day.learn = true;
}
function afterStep(){ syncPlanFlags(); checkReviews(); checkFullDay(); }
/* End of a practice session: a plan slot (p0-p2) counts only with at least one right answer (revealed answers and skips
   don't count), so a slot can't be ticked by skipping through it. Other missions complete as before. */
function finishMission(s){
  if(/^p[0-2]$/.test(s.mission) && !(s.right >= 1)){ toast('Not counted for today: get at least one right without revealing it. Try a fresh set.', 5000); return false; }
  completeMission(s.mission); return true;
}
function completeMission(key){
  const d = dayStr(); S.days[d] = S.days[d] || {};
  if(S.days[d][key]) return;
  S.days[d][key] = true;
  afterStep();
}
/* A day is full when the loop is done (learn, practice, apply) AND reviews are handled: nothing due (cards, mistakes,
   fading quiz questions) or REVIEW_CAP reviewed that day, so a backlog can't block it. day.rev: true = handled,
   false = not yet. Days from before the loop used three missions (quiz, skill, iv); those still count (and days saved
   before the review rule have no rev at all). A function declaration, because load() uses it via recountStreak. */
const REVIEW_CAP = 20;
const STEP_KEYS = ['learn','p0','p1','p2','apply','quiz','skill','iv'];
function isFullDay(day){
  if(!day || day.rev === false) return false;
  return (!!day.learn && !!day.practice && !!day.apply && day.rev === true) || ['quiz','skill','iv'].every(k=>day[k]);
}
function dueReviewCount(){ return CARDS.filter((c,i)=>S.cards[cardId(i)] && cardDue(i)).length + journal().filter(isDue).length + fadingQuiz().length; }
const reviewsOk = day=>!!(day && day.rev === true) || dueReviewCount() === 0 || ((day||{}).reviews||0) >= REVIEW_CAP;
function checkReviews(){
  if(saveBlocked) return;
  const d = dayStr(), day = S.days[d];
  if(day && day.rev === true) return;
  if(reviewsOk(day)){ if(!day || !(STEP_KEYS.some(k=>day[k]) || day.reviews)) return; day.rev = true; checkFullDay(); }
  else if(day && STEP_KEYS.some(k=>day[k])) day.rev = false;   /* "not yet" is only stored once a step is done */
}
/* one due item reviewed (a due card, a mistake retry or a fading quiz question) */
function noteReview(){ const day = S.days[dayStr()] = S.days[dayStr()] || {}; day.reviews = (day.reviews||0) + 1; checkReviews(); save(); }
function checkFullDay(){
  const d = dayStr();
  if(S.lastFull !== d && isFullDay(S.days[d])){
    S.streak = (S.lastFull === addDays(d,-1)) ? S.streak+1 : 1;
    S.best = Math.max(S.best||0, S.streak);
    S.lastFull = d; save();
    addXP(50, 'Full day: learned, practiced, applied and reviewed! Streak ' + S.streak);
  } else save();
  header();
}

/* ===================== HEADER / NAV ===================== */
const TABS = [['today','Today'],['skills','Skills'],['tracks','Tracks'],['tickets','Tickets'],['terminal','Terminal'],['sql','SQL'],['interview','Interview'],['review','Review'],['exams','Exams'],['labs','Labs'],['practice','Free resources'],['ready','Job practice'],['progress','Progress'],['guide','How to use'],['backup','Backup']];
let current = 'today';
function header(){
  const {r,next} = rankOf(S.xp);
  $('#rank').textContent = r[1];
  $('#xp').textContent = S.xp;
  const pct = next ? Math.round((S.xp - r[0]) / (next[0] - r[0]) * 100) : 100;
  $('#xpfill').style.width = pct + '%';
  const live = (S.lastFull === dayStr() || S.lastFull === addDays(dayStr(),-1)) ? S.streak : 0;
  $('#streak').textContent = live;
  const g = groupOf(current), sub = g[1].length > 1;
  lastIn[g[0]] = current;
  $('#nav').innerHTML = '<div class="tabs">'+GROUPS.map(([name, ks])=>{ const on = name === g[0];
      return '<button class="'+(on?'on':'')+'"'+(on ? ' aria-current="'+(sub?'true':'page')+'"' : '')+' data-tab="'+(lastIn[name] || ks[0])+'">'+name+'</button>'; }).join('')+'</div>'+
    (sub ? '<div class="subtabs" role="group" aria-label="'+g[0]+' sections">'+g[1].map(k=>'<button class="'+(k===current?'on':'')+'"'+(k===current?' aria-current="page"':'')+' data-tab="'+k+'">'+tabLabel(k)+'</button>').join('')+'</div>' : '');
}
/* Six top tabs, each grouping existing screens; a group with more than one screen shows them as sub-tabs.
   Screen keys are unchanged, so go('sql'), go('ready') and the rest still work everywhere. */
const GROUPS = [['Today',['today']], ['Study',['skills','tracks']], ['Hands-on',['terminal','sql','labs']],
  ['Job prep',['interview','tickets','exams','ready']], ['Review',['review','progress']], ['Guide',['guide','backup','practice']]];
const lastIn = {};   /* the screen you were last on in each group, so a top tab returns you there */
function groupOf(k){ return GROUPS.find(g=>g[1].includes(k)) || GROUPS[0]; }
function tabLabel(k){ const t = TABS.find(t=>t[0]===k); return t ? t[1] : k; }
$('#nav').addEventListener('click', e=>{ const b=e.target.closest('button'); if(b) go(b.dataset.tab); });
function go(tab){
  if(EX && tab!=='exams'){ askConfirm('Leave the exam in progress? Your answers will be lost.', 'Leave exam', ()=>{ stopExamTimer(); EX = null; go(tab); }); return; }
  stopRecording(true);   /* leaving the page discards a half-finished recording */
  destroyScene();        /* and stops any lesson animation */
  current = tab; stopTimer(); header(); ({today:vToday,skills:vSkills,exams:vExams,labs:vLabs,practice:vPractice,tracks:vTracks,tickets:vTickets,sql:vSQL,terminal:vTerminal,interview:vInterview,review:vReview,ready:vReady,progress:vProgress,guide:vGuide,backup:vBackup})[tab](); window.scrollTo(0,0); }

/* ===================== VIEWS ===================== */
/* Today: the loop as a 4-step checklist with one "Next up" button, the last 14 days, one real lab, and a short tip. */
function vToday(){
  if(S.days[dayStr()]) afterStep(); else checkReviews();
  const st = todaySteps(), d = st.day, plan = st.plan, sk = plan.ids.map(skillById);
  const rep = plan.apply || applyRep(plan.ids[0]);
  const dueN = dueReviewCount(), revLeft = st.reviewed ? 0 : Math.min(dueN, Math.max(0, REVIEW_CAP - (d.reviews||0)));
  const todo = st.lessons.filter(l=>l.state === 'todo').length, pLeft = st.practice.filter(x=>!x).length;
  const mins = todo*2 + pLeft*PRACTICE_N + (st.applied ? 0 : 5) + Math.ceil(revLeft*0.3);
  const doneN = [st.learn, st.practiced, st.applied, st.reviewed].filter(Boolean).length;
  const repTitle = rep.kind === 'ticket' ? '🎫 Ticket: '+esc(SCEN[rep.i].title) : '🎤 Interview: "'+esc(IV[rep.i].q)+'"';
  const repGo = ()=> rep.kind === 'ticket' ? playTicket(rep.i, 'apply') : startIV(rep.i, 'apply');
  const next = (()=>{
    for(let i=0;i<plan.ids.length;i++){
      if(st.lessons[i].state === 'todo') return ['📖 Lesson: '+esc(sk[i].sk), ()=>vLesson(plan.ids[i], 'p'+i)];
      if(!st.practice[i]) return ['✍ Practice: '+esc(sk[i].sk)+' ('+PRACTICE_N+')', ()=>startSkill(sk[i], PRACTICE_N, 'p'+i)];
    }
    if(!st.applied) return [rep.kind === 'ticket' ? '🎫 Apply: ticket' : '🎤 Apply: interview rep', repGo];
    if(!st.reviewed) return ['🔁 Reviews ('+dueN+' due)', ()=>go('review')];
    return null;
  })();
  const solid = pathSkills().filter(s=>skillLevel(s)===1), solidN = solid.filter(s=>skillScore(s.id) >= PATH.solid).length;
  const chip = (attr, i, label, state)=>'<button class="chip'+(state==='done'?' on':'')+'" data-'+attr+'="'+i+'">'+label+'</button>';
  const step = (n, name, ok, hint, body)=>'<div class="step'+(ok?' ok':'')+'"><span class="chk" aria-hidden="true">'+(ok?'✓':'○')+'</span><span class="sr">'+(ok?'Done: ':'To do: ')+'</span><div><b>'+n+' · '+name+'</b> <span class="small">'+hint+'</span>'+body+'</div></div>';
  const lab = labPick(plan);
  view.innerHTML =
    (saveBlocked ? '<div class="card tip" style="margin-top:18px;border-color:var(--bad)"><b>⚠ Your saved progress could not be read.</b> A copy was kept in this browser, and nothing will be saved over it until you choose. '+
      'Best: restore your latest backup. Or start fresh (the unreadable copy stays in browser storage).<div class="row" style="margin-top:10px"><button class="primary" id="fixRestore">Restore a backup</button><button id="fixFresh">Start fresh</button></div></div>' : '')+
    (!saveBlocked && saveFailed ? '<div class="card tip" style="margin-top:18px;border-color:var(--bad)"><b>⚠ Progress is not being saved.</b> This browser is refusing to store data (storage full, blocked, or private mode). Download a backup before closing.<div class="row" style="margin-top:10px"><button class="primary" id="fixBackup">Download backup</button></div></div>' : '')+
    (!saveBlocked && !hasProgress() ? '<div class="slim">👋 Studied SkillQuest in another browser, profile or on your phone? Merge that backup so your progress follows you. <button id="fixMerge">Merge a backup</button></div>' : '')+
    (backupDue() ? '<div class="slim">💾 '+(S.lastBackup ? 'Last backup '+esc(S.lastBackup)+'.' : 'No backup yet.')+' <button id="bk">'+(PHONE?'Copy backup':'Back up now')+'</button></div>' : '')+
    (journal().some(labDue) ? '<div class="slim">🧭 Permissions pilot: your delayed check is due. In Ubuntu: <code>sq-lab start perm-recheck</code> <button id="pilotDue">Open the pilot</button></div>' : '')+
    '<h1>Today\'s loop</h1><p class="sub">Path: '+PATH.name+', foundations first ('+solidN+' of '+solid.length+' foundation skills solid). Each lesson feeds its own exercises.</p>'+
    '<div class="card today"><div class="row" style="justify-content:space-between"><b>'+doneN+' of 4 done</b><span class="small">'+(isFullDay(S.days[dayStr()]) ? 'Full day ✓' : next ? '~'+Math.max(mins,1)+' min left' : '')+'</span></div>'+
      step(1, 'Learn', st.learn, '2-minute lessons (skipped when the skill is healthy)', '<div class="chips">'+st.lessons.map((l,i)=>chip('lesson', i, sk[i].icon+' '+esc(sk[i].sk)+(l.state==='read'?' ✓':l.state==='skip'?' · healthy':''), l.state==='read'?'done':'')).join('')+'</div>')+
      step(2, 'Practice', st.practiced, PRACTICE_N+' exercises per lesson, typed, first try counts. A set counts as done with one right answer: that is practice done, not mastery', '<div class="chips">'+st.practice.map((ok,i)=>chip('prac', i, esc(sk[i].sk)+(ok?' ✓':''), ok?'done':'')).join('')+'</div>')+
      step(3, 'Apply', st.applied, 'one rep in today\'s main area', '<div class="chips"><button class="chip'+(st.applied?' on':'')+'" data-apply="1">'+repTitle+(st.applied?' ✓':'')+'</button></div>')+
      step(4, 'Reviews', st.reviewed, st.reviewed ? 'handled for today' : dueN+' due · '+(d.reviews||0)+' of '+REVIEW_CAP+' done (clear them, or do '+REVIEW_CAP+')', st.reviewed ? '' : '<div class="chips"><button class="chip" data-go="review">Open Review</button></div>')+
      '<div class="row" style="margin-top:12px">'+(next ? '<button class="primary" id="nextUp">Next up: '+next[0]+'</button>' : '<span class="small">All four steps done. Extra practice is in Study and Hands-on.</span>')+'</div></div>'+
    stripHTML()+
    (lab ? '<div class="card"><b>🌐 Outside practice (free)</b> <span class="small">· fits today\'s '+esc(track(lab.tid).name)+' lesson</span>'+
      '<p style="margin:8px 0"><a href="'+lab.url+'" target="_blank" rel="noopener">'+esc(lab.name)+' ↗</a> <span class="small">'+esc(lab.note)+'</span></p>'+
      '<div class="row"><button id="labUsed"'+(lab.usedToday?' disabled':'')+'>'+(lab.usedToday?'✓ Used today':'✓ Mark used today')+'</button><a href="#" id="moreLabs" class="small">More free resources →</a></div></div>' : '')+
    (()=>{ const tip = STRATEGIES[dayNum() % STRATEGIES.length]; return '<details class="tipline"><summary>💡 Tip: <b>'+tip[0]+'</b></summary><p class="small">'+tip[1]+'</p></details>'; })();
  const on = (sel, f)=>{ const b = $(sel); if(b) b.onclick = f; };
  view.querySelectorAll('[data-lesson]').forEach(b=>b.onclick=()=>vLesson(plan.ids[+b.dataset.lesson], 'p'+b.dataset.lesson));
  view.querySelectorAll('[data-prac]').forEach(b=>b.onclick=()=>{ const i = +b.dataset.prac; startSkill(sk[i], PRACTICE_N, 'p'+i); });
  view.querySelectorAll('[data-apply]').forEach(b=>b.onclick=repGo);
  view.querySelectorAll('[data-go="review"]').forEach(b=>b.onclick=()=>go('review'));
  if(next) on('#nextUp', next[1]);
  on('#labUsed', ()=>{ S.practice = S.practice || {}; S.practice[lab.name] = dayStr(); save(); toast('Logged: '+lab.name); vToday(); });
  on('#moreLabs', e=>{ e.preventDefault(); go('practice'); });
  on('#bk', ()=>{ downloadBackup(); vToday(); });
  on('#fixRestore', ()=>go('backup'));
  on('#fixMerge', ()=>go('backup'));
  on('#fixBackup', ()=>{ downloadBackup(); });
  on('#pilotDue', ()=>{ go('labs'); const p = $('#pilot'); if(p) p.scrollIntoView(); });
  on('#fixFresh', ()=>askConfirm('Start fresh? The unreadable copy stays in browser storage, but SkillQuest will begin saving new progress now.', 'Start fresh', ()=>{ saveBlocked = false; save(); vToday(); }));
}
/* Last 14 days: full, partly done, or nothing; today is outlined until it's full. */
function dayState(day, isToday){
  const r = S.days[day];
  if(isFullDay(r)) return 'full';
  if(isToday) return 'today';
  return r && STEP_KEYS.some(k=>r[k]) ? 'part' : 'miss';
}
function stripHTML(){
  const label = {full:'full day', part:'partly done', miss:'nothing done', today:'today'};
  const cells = [], n = {full:0, part:0, miss:0, today:0};
  for(let k=13;k>=0;k--){ const day = addDays(dayStr(), -k), c = dayState(day, k===0); n[c]++; cells.push('<span class="sq '+c+'" title="'+day+': '+label[c]+'"></span>'); }
  const live = (S.lastFull === dayStr() || S.lastFull === addDays(dayStr(),-1)) ? S.streak : 0;
  return '<div class="card strip"><div class="row" style="justify-content:space-between"><b>Last 14 days</b><span class="small">Streak '+live+' · Best '+(S.best||0)+'</span></div>'+
    '<div class="sqs" role="img" aria-label="Last 14 days: '+n.full+' full, '+n.part+' partly done, '+n.miss+' missed">'+cells.join('')+'</div>'+
    '<div class="small"><span class="sq full"></span> full <span class="sq part"></span> partly <span class="sq miss"></span> missed</div></div>';
}
/* One real lab for today: matched to today's skills (offense-leaning for the path), not used in the last 7 days if possible. */
const LAB_FOR = {linux:['OverTheWire'], net:['Cisco Networking Academy','TryHackMe free rooms'], sec:['picoCTF','Hack The Box Academy','TryHackMe free rooms','CyberDefenders'],
  code:['picoCTF'], sql:['SQLBolt','SQLZoo'], support:['Microsoft Learn','Professor Messer'], cloud:['AWS Skill Builder','flaws.cloud','Microsoft Learn'],
  offsec:['PortSwigger Web Security Academy','OWASP Juice Shop','TryHackMe free rooms']};
function labPick(plan){
  const items = PRACTICE.flatMap(g=>g.items), tids = plan.ids.map(id=>skillById(id).tid);
  const cand = [...new Set(tids.flatMap(t=>LAB_FOR[t]||[]))].map(n=>items.find(x=>x[0]===n)).filter(Boolean);
  if(!cand.length) return null;
  const used = n=>(S.practice||{})[n] || '';
  const fresh = cand.filter(x=>used(x[0]) < addDays(dayStr(), -7));
  const pick = fresh.length ? fresh[hashStr(dayStr()) % fresh.length] : cand.slice().sort((a,b)=>used(a[0]).localeCompare(used(b[0])))[0];
  return {name:pick[0], url:pick[1], note:pick[2], tid:tids.find(t=>(LAB_FOR[t]||[]).includes(pick[0])), usedToday:used(pick[0]) === dayStr()};
}

/* Mastery = share of a level's questions and cards that are retained right now (see cardStatus / quizStatus) */
function mastery(tid, lv){ const st = levelStats(tid, lv || 1); return st.total ? Math.round(st.retained / st.total * 100) : 0; }
/* Suggest Level 2 once 60% of Level 1 is retained */
function levelFor(tid){ return mastery(tid,1) >= 60 && QUIZ.some(q=>q[0]===tid && q[1]===2) ? 2 : 1; }
function vTracks(){
  const OPEN = 2;
  view.innerHTML = '<h1>Tracks</h1><p class="sub">Each track has four levels, from basics to senior. Levels 1 and 2 are ready. The % is what you have <b>retained</b>: proven and reviewed on time. It drops when reviews go overdue or a question you knew is missed. Tip: get Level 1 to 60% before starting Level 2.</p>'+
    '<div class="grid">'+TRACKS.map(t=>{
      const lvRow = n=>{ const m = mastery(t.id, n);
        return '<div style="margin-top:12px"><div class="row" style="justify-content:space-between"><b>L'+n+' '+LEVELS[n-1].name+'</b><span class="small">'+m+'%</span></div>'+
          '<div class="meter"><i style="width:'+m+'%"></i></div>'+statsLine(levelStats(t.id, n))+
          '<div class="row" style="margin-top:8px"><button class="primary" data-q="'+t.id+'" data-lv="'+n+'">Quiz</button><button data-c="'+t.id+'" data-lv="'+n+'">Flashcards</button>'+
          (genFor(t.id, n).length ? '<button data-e="'+t.id+'" data-lv="'+n+'" title="Endless, freshly generated problems">∞ Drill</button>' : '')+'</div></div>'; };
      /* a locked track offers only a read-only preview: no Browse, quizzes or drills, since those would record mastery */
      if(!trackOpen(t.id)) return '<div class="card"><h3 style="margin:0">'+t.icon+' '+t.name+' 🔒</h3><p class="small">'+t.blurb+'</p>'+
        '<p class="small" style="margin-top:12px">Opens when '+unlockText(t.id)+'.</p><div class="row"><button data-preview="'+t.id+'">Preview a lesson (records nothing)</button></div></div>';
      return '<div class="card"><div class="row" style="justify-content:space-between"><h3 style="margin:0">'+t.icon+' '+t.name+'</h3><button data-b="'+t.id+'" title="Search every card in this track, filter by topic, and study what you find">Browse</button></div><p class="small">'+t.blurb+'</p>'+
        '<div class="levels">'+LEVELS.map(l=>'<span class="lv '+(l.n<=OPEN?'open':'')+'" title="'+esc(l.desc)+'">L'+l.n+' '+l.name+(l.n>OPEN?' 🔒':'')+'</span>').join('')+'</div>'+
        lvRow(1)+lvRow(2)+
        (genSkills(t.id).length ? '<div class="small" style="margin-top:14px">∞ Drill one skill:</div><div class="chips">'+
          genSkills(t.id).map(([sk,lvs])=>'<button class="chip" data-sk="'+esc(sk)+'" data-trk="'+t.id+'" title="Endless fresh problems: '+esc(sk)+' ('+lvs.map(l=>'L'+l).join(', ')+')">'+esc(sk)+' <span class="small">'+lvs.map(l=>'L'+l).join('/')+'</span></button>').join('')+'</div>' : '')+
        '</div>';
    }).join('')+'</div>'+
    '<h2>What the levels mean</h2><div class="card">'+LEVELS.map(l=>'<p><b>L'+l.n+' '+l.name+':</b> '+l.desc+'</p>').join('')+'</div>';
  view.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>startQuiz(b.dataset.q, 10, null, null, +b.dataset.lv));
  view.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>startCards(b.dataset.c, 12, null, null, +b.dataset.lv));
  view.querySelectorAll('[data-b]').forEach(b=>b.onclick=()=>vBrowse(b.dataset.b));
  view.querySelectorAll('[data-preview]').forEach(b=>b.onclick=()=>vLesson(previewLesson(b.dataset.preview), null, {preview:true, back:'tracks'}));
  view.querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>startQuiz(b.dataset.e, 10, null, null, +b.dataset.lv, true));
  view.querySelectorAll('[data-sk]').forEach(b=>b.onclick=()=>startQuiz(b.dataset.trk, 10, null, null, 0, true, b.dataset.sk));
}

/* ---------- Quiz ---------- */
/* Regular quizzes mix the fixed questions with freshly generated ones (about half).
   endless = true gives only generated questions, so every round is brand new. */
function startQuiz(tid, n, mission, list, lv, endless, sk){
  const pool = list || QUIZ.map((q,i)=>i).filter(i=>QUIZ[i][0]===tid && (!lv || QUIZ[i][1]===lv));
  let items = endless ? [] : shuffle(pool).slice(0, n);
  if(!list && tid && genFor(tid, lv, sk).length){
    const k = endless ? n : Math.min(Math.ceil(n/2), n);
    S.recent = S.recent || {};
    const fresh = quizSet(tid, k, lv, sk, S.recent.quiz);
    rememberRecent(S.recent, 'quiz', fresh.map(quizKey)); save();
    items = endless ? fresh : shuffle(items.slice(0, n - fresh.length).concat(fresh));
  }
  if(!items.length){ toast('Quiz questions for this level are coming soon'); return; }
  const sess = {items, i:0, right:0, mission, tid, lv, endless, sk};
  quizStep(sess);
}
function quizStep(s){
  if(s.i >= s.items.length) return quizEnd(s);
  const idx = s.items[s.i], isGen = typeof idx === 'object', q = isGen ? idx.d : QUIZ[idx], t = track(q[0]);
  const sid = isGen && idx.sk ? skillIdFor('quiz', idx.tid, idx.sk) : null;
  /* Generated short-answer questions are typed (recall), unless typed mode is off or you asked to see the choices. */
  const typed = isGen && typedOn() && typeable(idx) && !s.showChoices;
  const order = shuffle(q[3].map((o,k)=>k));
  view.innerHTML = '<h1>'+(s.journalRun ? '📓 Mistake retry' : t.icon+' '+(s.sk ? esc(s.sk) : t.name)+(s.endless?' drill':' quiz'))+' <span class="lv open">L'+q[1]+'</span>'+(isGen && !s.journalRun?' <span class="lv open" title="Freshly generated for you">∞ new</span>':'')+(typed?' <span class="lv open" title="Type the answer from memory">⌨ type it</span>':'')+'</h1>'+
    '<div class="card"><div class="progress"><span>Question '+(s.i+1)+' of '+s.items.length+'</span><span>'+s.right+' correct</span></div>'+
    '<div class="q">'+q[2]+'</div>'+
    (typed ? '<div class="row"><input id="ta" class="typed" autocomplete="off" spellcheck="false" placeholder="Type your answer, then Enter" aria-label="Your answer"><button class="primary" id="chk">Check</button></div>'+
             '<p class="small">Recall it from memory; that is what makes it stick. Stuck? <a href="#" id="choices">Show the choices</a> (counts as a guess).</p>'
           : '<div class="opts">'+order.map(k=>'<button class="opt" data-k="'+k+'">'+q[3][k]+'</button>').join('')+'</div>')+
    '<div id="after"></div></div>';
  const advance = ()=>{ s.i++; s.showChoices = false; s.usedChoices = false; quizStep(s); };
  const finish = (ok, viaChoice, your)=>{
    /* Mistake journal: retries update their entry; new misses are saved with your answer. */
    if(idx.journal){ if(journalResult(idx.journal, ok)) noteReview(); if(ok){ s.right++; addXP(10); } }
    else {
      if(!ok) addMistake(q, {kind:'quiz', your, sid, qi: isGen ? null : idx});
      if(isGen){
        const g = S.gen[q[0]] = S.gen[q[0]] || {right:0, total:0};
        g.total++; if(ok){ g.right++; s.right++; addXP(typed ? 15 : 10); } else save();
      }
      else {
        const fade = quizStatus(idx) === 'fading';
        if(ok){ s.right++; quizRight(quizId(idx)); addXP(10); }
        else { S.miss[quizId(idx)] = true; (S.missAt = S.missAt || {})[quizId(idx)] = dayStr(); save(); }
        if(fade) noteReview();   /* reviewing a fading question counts, right or wrong (wrong moves it to Learning) */
      }
    }
    const nx = s.i+1 < s.items.length ? 'Next' : 'Finish';
    /* After a correct answer on a skill question, ask whether it was sure or a guess: guesses barely raise mastery. */
    const btns = (sid && ok) ? '<button class="primary" id="sure">'+nx+' · I was sure</button><button id="guess">'+nx+' · I guessed</button>' : '<button class="primary" id="next">'+nx+'</button>';
    $('#after').innerHTML = '<div class="explain">'+(ok?'✅ <b>Correct.</b> ':'❌ <b>Not quite.</b> ')+(typed && !ok ? 'Answer: <b>'+q[3][q[4]]+'</b>. ' : '')+q[5]+'</div><div class="row" style="margin-top:12px">'+btns+'</div>';
    if(sid && ok){
      $('#sure').onclick = ()=>{ recordSkill(sid, true, !viaChoice); advance(); };
      $('#guess').onclick = ()=>{ recordSkill(sid, true, false); advance(); };
      $('#sure').focus();
    } else {
      if(sid) recordSkill(sid, false);
      $('#next').onclick = advance; $('#next').focus();
    }
  };
  if(typed){
    const inp = $('#ta'); inp.focus();
    const check = ()=>{
      if(!inp.value.trim()) return;
      const ok = normAns(inp.value) === normAns(plainText(q[3][q[4]]));
      inp.disabled = true; $('#chk').disabled = true; inp.classList.add(ok ? 'ok' : 'no');
      finish(ok, false, inp.value.trim());
    };
    $('#chk').onclick = check;
    inp.onkeydown = e=>{ if(e.key==='Enter'){ e.preventDefault(); check(); } };
    $('#choices').onclick = e=>{ e.preventDefault(); s.showChoices = true; s.usedChoices = true; quizStep(s); };
  } else view.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{
    const k = +b.dataset.k, ok = k===q[4];
    view.querySelectorAll('.opt').forEach(x=>{ x.disabled=true; if(+x.dataset.k===q[4]) x.classList.add('right'); });
    if(!ok) b.classList.add('wrong');
    finish(ok, !!s.usedChoices, plainText(q[3][k]));
  });
}
function quizEnd(s){
  if(s.mission) finishMission(s);
  const pct = Math.round(s.right/s.items.length*100);
  view.innerHTML = '<h1>'+(s.journalRun?'Mistake retry done':'Quiz complete')+'</h1><div class="card"><p class="q">'+s.right+' / '+s.items.length+' ('+pct+'%)</p><p>'+
    (s.journalRun ? 'Each mistake needs a correct answer on two different days to clear. The ones you got right today come back tomorrow for the second check.'
      : pct===100?'Perfect round. Try the flashcards next to lock it in.':pct>=70?'Solid. Your misses are saved in the mistake journal (Review tab).':'Good practice. Your misses are in the mistake journal (Review tab); retry them tomorrow.')+'</p>'+
    '<div class="row"><button class="primary" id="again">'+(s.journalRun?'Open the journal':!s.tid?'Back to Review':'Another round')+'</button><button id="home">Back to Today</button></div></div>';
  $('#again').onclick=()=> s.journalRun ? vJournal() : !s.tid ? go('review') : startQuiz(s.tid, s.items.length, null, null, s.lv, s.endless, s.sk);
  $('#home').onclick=()=>go('today');
}

/* ---------- Flashcards ---------- */
/* At most this many never-seen cards a day (all tracks), so reviews don't pile up faster than you can learn them. */
const NEW_PER_DAY = 10;
function newToday(){ const d = dayStr(); return Object.values(S.cards).filter(c=>c.seen===d).length; }
/* The card's next record after a rating, or null when it isn't due yet: early review is practice only,
   so extra same-day runs can't push a card up the boxes (and count it as retained) without real spacing. */
function rateCard(cur, good){
  if(cur && cur.due > dayStr()) return null;
  const box = good ? Math.min((cur ? cur.box : 0)+1, 5) : 1;
  return {box, due:addDays(dayStr(), BOX_DAYS[box]), seen:(cur && cur.seen) || dayStr()};
}
function startCards(tid, n, mission, list, lv){
  let pool = list || CARDS.map((c,i)=>i).filter(i=>CARDS[i][0]===tid && (!lv || CARDS[i][1]===lv));
  /* due and new cards first (lowest box first), then not-due cards as practice */
  const order = i=>{ const c = S.cards[cardId(i)]; return (cardDue(i) ? 0 : 10) + (c ? c.box : 0); };
  pool = shuffle(pool).sort((a,b)=>order(a)-order(b));
  let left = Math.max(0, NEW_PER_DAY - newToday()), held = 0;
  pool = pool.filter(i=>{ if(S.cards[cardId(i)]) return true; if(left > 0){ left--; return true; } held++; return false; });
  if(!pool.length){
    view.innerHTML = '<h1>Flashcards</h1><div class="card"><p>You have started '+NEW_PER_DAY+' new cards today, and nothing here is ready to review. New cards unlock again tomorrow; spreading them out is what makes them stick.</p><div class="row"><button class="primary" id="home">Back to Today</button></div></div>';
    $('#home').onclick=()=>go('today'); return;
  }
  const items = pool.slice(0,n);
  cardStep({items, first:items.length, i:0, flipped:false, mission, tid, good:0, missed:[], held: pool.length < n ? held : 0});
}
function psToggle(){ return '<button class="chip" id="psBtn" title="Show or hide the PowerShell line on Linux cards">PowerShell: '+(psOn()?'shown':'hidden')+'</button>'; }
function bindPsToggle(){ const b = $('#psBtn'); if(b) b.onclick = ()=>{ setPref('skillquest-ps', psOn()?'off':'on'); applyPs(); b.textContent = 'PowerShell: '+(psOn()?'shown':'hidden'); }; }
function cardStep(s){
  if(s.i >= s.items.length){
    if(s.mission) finishMission(s);
    view.innerHTML = '<h1>Cards done</h1><div class="card"><p class="q">'+s.good+' / '+s.first+' marked "Got it" first time</p><p>Missed cards were asked again at the end and come back tomorrow. Cards you know come back later, with longer gaps each time. Cards not due yet were practice only, so their schedule stayed the same.</p>'+
      (s.missed.length ? '<h3>Missed this round</h3><ul class="clean">'+s.missed.map(i=>'<li>'+CARDS[i][2]+'</li>').join('')+'</ul>' : '')+
      (s.held ? '<p class="small">'+s.held+' more new card'+(s.held===1?'':'s')+' unlock tomorrow (limit '+NEW_PER_DAY+' new a day).</p>' : '')+
      '<div class="row"><button class="primary" id="home">Back to Today</button></div></div>';
    $('#home').onclick=()=>go('today'); return;
  }
  const idx = s.items[s.i], c = CARDS[idx], t = track(c[0]);
  const cur = S.cards[cardId(idx)], box = (cur||{box:0}).box, nextGap = BOX_DAYS[Math.min(box+1, 5)];
  const early = !!cur && cur.due > dayStr(), retry = s.i >= s.first;
  const days = n=>n+' day'+(n===1?'':'s');
  view.innerHTML = '<h1>'+t.icon+' '+t.name+' flashcards</h1>'+
    '<div class="progress"><span>Card '+(s.i+1)+' of '+s.items.length+(c[4] ? ' · '+CARD_TOPICS[c[4]] : '')+'</span><span>'+(retry ? 'Second try' : early ? 'Practice · due '+cur.due : box ? 'Last gap: '+days(BOX_DAYS[box]) : 'New card')+'</span></div>'+
    '<div class="card flash '+(s.flipped?'back':'')+'" id="fc"'+(s.flipped?'':' role="button" tabindex="0"')+'>'+(s.flipped?'<div>'+c[3]+'</div>':'<div><div>'+c[2]+'</div><p class="small" style="margin-top:16px">Say the answer out loud, then tap or press Space to flip.</p></div>')+'</div>'+
    '<div class="row" style="margin-top:14px">'+(s.flipped?'<button id="again">↺ Again <span class="small">1'+(early ? ' · practice' : ' · back tomorrow')+'</span></button><button class="primary" id="good">✓ Got it <span class="small">2'+(early ? ' · practice, schedule unchanged' : ' · next in '+days(nextGap))+'</span></button>':'<button class="primary" id="flip">Flip</button>')+
    (c[3].includes('class="ps"') ? psToggle() : '')+'</div>';
  bindPsToggle();
  const flip = ()=>{ s.flipped=true; cardStep(s); };
  $('#fc').onclick = s.flipped ? null : flip;
  if(!s.flipped) $('#flip').onclick = flip;
  else {
    const rate = good=>{
      const prior = S.cards[cardId(idx)], next = rateCard(prior, good);
      if(next) S.cards[cardId(idx)] = next;
      if(next && prior) noteReview();   /* a due card (not a brand-new one) counts toward today's reviews */
      if(good && !retry){ s.good++; if(next) addXP(5); else save(); }
      else save();
      /* a miss is asked once more at the end of this session (no box change: it is now due tomorrow) */
      if(!good && !retry){ s.missed.push(idx); s.items.push(idx); }
      s.i++; s.flipped=false; cardStep(s);
    };
    $('#again').onclick=()=>rate(false); $('#good').onclick=()=>rate(true);
  }
}

/* ---------- Browse: search a track's cards, filter by topic, study what you find ---------- */
/* Public, read-only copy of the Linux cards (npm run export-deck), handy on any device or to share */
const PUBLIC_CARDS = 'https://aleisabek.github.io/Linux-Cheat-sheet/';
function vBrowse(tid, topic){
  const t = track(tid);
  const all = CARDS.map((c,i)=>i).filter(i=>CARDS[i][0]===tid);
  const text = {}; all.forEach(i=>{ text[i] = plainText(CARDS[i][2]+' '+CARDS[i][3]).toLowerCase(); });
  const topics = Object.keys(CARD_TOPICS).filter(k=>all.some(i=>CARDS[i][4]===k));
  let hits = [];
  view.innerHTML = '<h1>'+t.icon+' '+t.name+' cards</h1><p class="sub">Every card in this track. Search by command or by what you want to do ("hidden", "bytes", "decode"), then study the results as flashcards.'+(tid==='linux' ? ' Away from SkillQuest? The same cards are on the <a href="'+PUBLIC_CARDS+'" target="_blank" rel="noopener">public Linux &amp; Bandit command deck</a> (no progress tracking).' : '')+'</p>'+
    '<div class="card"><div class="row"><input id="bq" class="typed" autocomplete="off" spellcheck="false" placeholder="Search cards" aria-label="Search cards">'+(tid==='linux' ? psToggle() : '')+'</div>'+
    (topics.length ? '<div class="chips"><button class="chip" data-tp="">All</button>'+topics.map(k=>'<button class="chip" data-tp="'+k+'">'+CARD_TOPICS[k]+'</button>').join('')+'</div>' : '')+
    '<div class="row" style="margin-top:10px;justify-content:space-between"><span class="small" id="bn"></span><span class="row"><button class="primary" id="bstudy">Study these</button><button id="bback">Back to Tracks</button></span></div></div>'+
    (tid==='linux' ? '<details class="card"><summary>Bandit study guide</summary><p class="small">What to review, roughly in the order OverTheWire Bandit needs it. It names techniques only: no level answers, and never paste passwords anywhere. Stuck? Re-read the level page, then <code>man</code> the commands it suggests.</p><ol>'+
      BANDIT_GUIDE.map(step=>'<li>'+step.map(k=>'<button class="chip" data-tp="'+k+'">'+CARD_TOPICS[k]+'</button>').join(' ')+'</li>').join('')+
      '</ol><p class="small"><a href="https://overthewire.org/wargames/bandit/" target="_blank" rel="noopener">Open Bandit</a></p></details>' : '')+
    '<div id="bres"></div>';
  const draw = ()=>{
    const words = $('#bq').value.toLowerCase().split(/\s+/).filter(Boolean);
    hits = all.filter(i=>(!topic || CARDS[i][4]===topic) && words.every(w=>text[i].includes(w)));
    view.querySelectorAll('[data-tp]').forEach(b=>b.classList.toggle('on', b.dataset.tp===(topic||'')));
    $('#bn').textContent = hits.length+' of '+all.length+' cards';
    $('#bstudy').disabled = !hits.length;
    $('#bres').innerHTML = hits.map(i=>{ const c = CARDS[i], st = cardStatus(i);
      return '<div class="card brow"><div class="bq">'+c[2]+'</div><div class="ba">'+c[3]+'</div>'+
        '<div class="row small" style="margin-top:6px"><span class="pill st-'+st+'">'+STATUS[st]+'</span><span>L'+c[1]+(c[4] ? ' · '+CARD_TOPICS[c[4]] : '')+'</span>'+
        (c[3].includes('<code>') ? '<button class="chip" data-cp="'+i+'">Copy command</button>' : '')+'</div></div>'; }).join('');
    $('#bres').querySelectorAll('[data-cp]').forEach(b=>b.onclick=()=>{
      const code = b.closest('.brow').querySelector('.ba code').textContent;
      try{ navigator.clipboard.writeText(code).then(()=>toast('Copied: '+code), ()=>toast(code)); }catch(e){ toast(code); }
    });
  };
  view.querySelectorAll('[data-tp]').forEach(b=>b.onclick=()=>{ topic = b.dataset.tp; draw(); });
  $('#bq').oninput = draw;
  $('#bstudy').onclick = ()=>startCards(null, Math.min(hits.length, 20), null, hits);
  $('#bback').onclick = ()=>go('tracks');
  bindPsToggle();
  draw(); $('#bq').focus();
}

/* ---------- Terminal ---------- */
function vTerminal(){
  const done = lv=>TERM.filter(t=>(t[4]||1)===lv && S.term[t[2]]).length, tot = lv=>TERM.filter(t=>(t[4]||1)===lv).length;
  view.innerHTML = '<h1>🐧 Terminal</h1><p class="sub">Type real Linux commands. Different correct ways of writing a command are accepted.</p><div class="grid">'+
    '<div class="card mission"><h3>Level 1: Foundations</h3><p>Moving around, reading files, permissions, searching. Solved '+done(1)+' of '+tot(1)+'.</p><div><button class="primary" data-tl="1">Start</button></div></div>'+
    '<div class="card mission"><h3>Level 2: Job-ready</h3><p>Services, logs, disk space, ports, cron, SSH, archives. Solved '+done(2)+' of '+tot(2)+'.</p><div><button class="primary" data-tl="2">Start</button></div></div>'+
    '<div class="card mission"><h3>Mixed practice</h3><p>8 random tasks from both levels.</p><div><button data-tl="0">Start</button></div></div></div>'+
    skillGrid(TGEN, 'ts', 'Every task is freshly generated: new file names, services, users and numbers each time.');
  view.querySelectorAll('[data-tl]').forEach(b=>b.onclick=()=>startTerm(8, null, +b.dataset.tl));
  view.querySelectorAll('[data-ts]').forEach(b=>b.onclick=()=>startTerm(8, null, 0, b.dataset.ts));
}
/* Skill picker shared by Terminal and SQL: one card per skill, plus "all skills" */
function skillGrid(list, attr, note){
  return '<h2>∞ Endless practice by skill</h2><p class="sub">'+note+'</p><div class="grid">'+
    skillsOf(list).map(sk=>{ const lvs = [...new Set(list.filter(g=>g.sk===sk).map(g=>g.lv))].sort();
      return '<div class="card mission"><h3>'+esc(sk)+'</h3><p>'+lvs.map(l=>'<span class="lv open">L'+l+'</span>').join(' ')+' '+list.filter(g=>g.sk===sk).length+' task types</p><div><button data-'+attr+'="'+esc(sk)+'">Drill</button></div></div>'; }).join('')+
    '<div class="card mission"><h3>All skills</h3><p>Endless random mix of every skill above.</p><div><button class="primary" data-'+attr+'="*">Drill</button></div></div></div>';
}
/* Normal sets mix fixed tasks with about half freshly generated ones. sk = a skill name (or "*") gives only generated tasks. */
function startTerm(n, mission, lv, sk){
  current = 'terminal'; header();
  let items;
  S.recent = S.recent || {};
  if(sk) items = termSet(n, 0, sk==='*'?null:sk, S.recent.term);
  else {
    const pool = TERM.map((t,i)=>i).filter(i=>!lv || (TERM[i][4]||1)===lv);
    const fresh = termSet(Math.floor(n/2), lv||0, null, S.recent.term);
    items = shuffle(shuffle(pool).slice(0, n - fresh.length).concat(fresh));
  }
  /* every practice set (not the short daily mission) ends with one multi-step scenario when the skill has one */
  const chain = mission ? null : chainSet(1, sk ? 0 : lv||0, sk && sk!=='*' ? sk : null, S.recent.chain)[0];
  if(chain){ items = items.slice(0, Math.max(n - 2, 1)).concat(chain); rememberRecent(S.recent, 'chain', [chainKey(chain)]); }
  rememberRecent(S.recent, 'term', items.filter(Array.isArray).map(termKey)); save();
  if(!items.length){ toast('No terminal tasks for this yet'); return; }
  const s = {items, i:0, mission, lv, sk, lines:[], hinted:false, right:0};
  termStep(s);
}
function norm(x){ return x.trim().replace(/\s+/g,' ').replace(/["']/g,''); }
/* What a typed command is checked against: norm(x), which the answer patterns are written for, but only when its quotes
   don't change the words the shell sees. 'ls -la' is one word (a command named "ls -la"), and '-l -a' is one argument
   rather than two flags, so both return null; so does a quote left open. Quotes around an argument are fine
   (grep "failed login" f, cut -d' ', alias ll='ls -la'), and a backslash escapes one character (it\'s, -exec ... \;). */
function termNorm(x){
  let quote = '', tok = '', inTok = false, opened = false, cmd = true, wrap = false, bad = false;
  const end = ()=>{
    if(!inTok) return;
    if(cmd && /\s/.test(tok)) bad = true;                 /* the command name itself contains a space */
    if(opened && /^-\S*\s/.test(tok)) bad = true;         /* a quoted group of flags is a single argument */
    /* sudo, time, env... run the next word as a command, so it is a command name too (their own flags aside) */
    const runs = cmd && (/^(sudo|time|env|nohup|watch|xargs)$/.test(tok) || (wrap && tok[0] === '-'));
    tok = ''; inTok = false; opened = false; cmd = wrap = runs;
  };
  for(let i=0; i<x.length; i++){
    const c = x[i];
    if(quote === "'"){ if(c === "'") quote = ''; else tok += c; continue; }
    if(quote === '"'){
      if(c === '\\' && /["\\$`]/.test(x[i+1] || '')) tok += x[++i];
      else if(c === '"') quote = ''; else tok += c;
      continue;
    }
    if(c === '\\'){ tok += x[i+1] || ''; i++; inTok = true; }
    else if(c === "'" || c === '"'){ if(!inTok) opened = true; inTok = true; quote = c; }
    else if(/\s/.test(c)) end();
    else if(/[|;&]/.test(c)){ end(); cmd = true; }       /* the next word starts a new command */
    else { tok += c; inTok = true; }
  }
  if(quote) return null;
  end();
  return bad ? null : norm(x);
}
function termStep(s){
  if(s.i >= s.items.length){
    if(s.mission) finishMission(s);
    view.innerHTML = '<h1>🐧 Terminal</h1><div class="card"><p class="q">'+s.right+' / '+s.items.length+' solved</p><p>Want the real thing? Log into OverTheWire Bandit and use these commands on an actual server.</p><div class="row"><button class="primary" id="more">Another set</button><button id="home">Back to Today</button></div></div>';
    $('#more').onclick=()=>startTerm(8,null,s.lv,s.sk); $('#home').onclick=()=>go('today'); return;
  }
  const it = s.items[s.i], isGen = Array.isArray(it), t = isGen ? it : TERM[it];
  view.innerHTML = '<h1>🐧 Terminal</h1><p class="sub">Type the Linux command and press Enter. Task '+(s.i+1)+' of '+s.items.length+'.</p>'+
    '<div class="term" id="term">'+(t.chain ? '<div class="task"># SCENARIO: '+esc(t.chain.title)+' (step '+(t.chain.i+1)+' of '+t.chain.n+')</div>' : '')+
    (t.out ? t.out.map(l=>'<div class="line'+(/^\$ /.test(l) ? '' : ' outp')+'">'+esc(l)+'</div>').join('') : '')+
    '<div class="task"># TASK: '+esc(t[0])+'</div>'+
    s.lines.map(l=>'<div class="line '+l[1]+'">'+esc(l[0])+'</div>').join('')+
    (s.settled ? '' : '<div class="inrow"><span class="ok">alei@skillquest:~$</span><input id="cmd" autocomplete="off" spellcheck="false" aria-label="Command"></div>')+'</div>'+
    /* once solved the task is settled: no input, and nothing moves on until you choose Next (no timer to outlive the page) */
    (s.settled ? '<div class="row" style="margin-top:12px"><button class="primary" id="tnext">'+(s.i + 1 < s.items.length ? 'Next task' : 'See results')+'</button></div>'
      : '<div class="row" style="margin-top:12px"><button id="hint">Hint</button><button id="show">Show answer</button><button id="skip">Skip</button></div>');
  const next = ()=>{ s.i++; s.lines=[]; s.hinted=false; s.wrong=false; s.shown=false; s.settled=false; termStep(s); };
  if(s.settled){
    const nb = $('#tnext'); nb.focus();
    nb.onclick = next;
    nb.onkeydown = e=>{ if(e.repeat && (e.key === 'Enter' || e.key === ' ')) e.preventDefault(); };   /* a held Enter doesn't skip ahead */
    return;
  }
  const inp = $('#cmd'); inp.focus();
  /* Mastery: first try with no hint = sure; wrong tries or a hint = guess; shown answer or skip = miss. */
  const sid = isGen && t.sk ? skillIdFor('term', 'linux', t.sk) : null;
  inp.onkeydown = e=>{
    if(e.key!=='Enter') return;
    e.preventDefault();   /* this Enter must not also press the Next button that appears */
    if(s.settled) return;
    const v = inp.value; if(!v.trim()) return;
    s.lines.push(['$ '+v, '']);
    const typed = termNorm(v);
    if(typed !== null && t[1].some(re=>re.test(typed))){
      s.settled = true;
      /* A shown answer typed back in is practice only: no XP, not counted as solved. */
      const pts = s.shown ? 0 : s.hinted ? 8 : 15;
      if(isGen){ const g = S.gen.terminal = S.gen.terminal || {right:0,total:0}; g.total++; if(!s.shown) g.right++; } else if(!s.shown) S.term[t[2]] = true;
      if(!s.shown) s.right++;
      if(sid) recordSkill(sid, !s.shown, !s.hinted && !s.wrong);
      if(pts) addXP(pts); else save();
      s.lines.push([s.shown ? '✔ Locked in (no XP, the answer was shown).' : '✔ Correct (+'+pts+' XP). Model answer: '+t[2], 'ok']);
      termStep(s);
    } else {
      s.wrong = true; s.last = v;
      s.lines.push([typed === null ? '✘ Check the quotes: they change which words the shell sees (\'ls -la\' is one word, not ls plus -la).' : '✘ Not that one. Try again, or use Hint.', 'no']); termStep(s);
    }
  };
  $('#hint').onclick=()=>{ s.hinted=true; s.lines.push(['hint: '+t[3], '']); termStep(s); };
  $('#show').onclick=()=>{ s.lines.push(['answer: '+t[2]+'  (type it to lock it in, no XP)', '']); s.hinted=true; s.shown=true; addNote('term', t[0], t[2], s.last, sid); termStep(s); };
  $('#skip').onclick=()=>{ if(sid) recordSkill(sid, false); addNote('term', t[0], t[2], s.last, sid); s.last = ''; next(); };
}

/* ---------- Interview ---------- */
const IVCATS = [['resume','About your resume'],['behavioral','Behavioral (STAR)'],['technical','Technical basics'],['jobready','Job-ready scenarios (L2)'],['ask','Questions to ask them']];
function vInterview(){
  view.innerHTML = '<h1>🎤 Interview practice</h1><p class="sub">Read the question, start the timer, answer out loud (or type), then compare with the model answer and check off what you covered.</p>'+
    IVCATS.map(([k,l])=>'<h2>'+l+'</h2><div class="grid">'+IV.map((q,i)=>[q,i]).filter(([q])=>q.c===k).map(([q,i])=>{
      const r = S.iv['i'+i];
      return '<div class="card mission '+(r?'done':'')+'"><h3 style="font-size:1rem">'+esc(q.q)+'</h3><p class="small">'+(r?'Best: '+['','Need work','Okay','Nailed it'][r]:'Not practiced yet')+'</p><div><button data-i="'+i+'">Practice</button></div></div>';
    }).join('')+'</div>').join('');
  view.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>startIV(+b.dataset.i, null));
}
let timerT = null;
function stopTimer(){ if(timerT){ clearInterval(timerT); timerT=null; } }
function startIV(i, mission){
  current = 'interview'; header(); stopTimer();
  const q = IV[i];
  view.innerHTML = '<h1>🎤 Interview rep</h1><div class="card"><div class="small">'+IVCATS.find(c=>c[0]===q.c)[1]+'</div><p class="q">'+esc(q.q)+'</p><p class="small">💡 '+esc(q.tip)+'</p>'+
    '<div class="row" style="margin:12px 0"><span class="timer" id="tm">1:30</span><button class="primary" id="startt">Start 90-second timer</button></div>'+
    '<h2>🎙 Say it out loud</h2><div id="rec"></div>'+
    '<h2>📝 Notes</h2><textarea id="ans" placeholder="Optional: jot your answer or key points here. It\'s saved on this computer."></textarea>'+
    '<div class="row" style="margin-top:12px"><button class="primary" id="reveal">Reveal model answer</button></div><div id="after"></div></div>';
  renderRecorder('i'+i);
  const ta = $('#ans'); ta.value = S.notes['i'+i] || '';
  ta.oninput = ()=>{ S.notes['i'+i] = ta.value; save(); };
  $('#startt').onclick=()=>{
    stopTimer(); let left=90; const el=$('#tm');
    timerT = setInterval(()=>{ left--; el.textContent=Math.floor(left/60)+':'+String(left%60).padStart(2,'0'); el.classList.toggle('low', left<=15); if(left<=0){ stopTimer(); el.textContent='Time!'; } },1000);
  };
  $('#reveal').onclick=()=>{
    stopTimer();
    $('#reveal').disabled = true;
    $('#after').innerHTML = '<h2>Model answer</h2><div class="model">'+esc(q.model)+'</div>'+
      '<p class="small">Anything in [brackets] is for you to fill in with your own real story. Never say something that did not happen.</p>'+
      '<h2>Did you cover these?</h2><div class="checks">'+q.points.map((p,k)=>'<label><input type="checkbox" data-p="'+k+'"> '+esc(p)+'</label>').join('')+'</div>'+
      '<h2>How did it go?</h2><div class="row"><button data-r="1">Need work</button><button data-r="2">Okay</button><button class="primary" data-r="3">Nailed it</button></div>';
    $('#after').querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{
      const r = +b.dataset.r, id='i'+i;
      S.iv[id] = Math.max(S.iv[id]||0, r);
      addXP([0,10,15,25][r], 'Interview rep');
      if(mission) completeMission(mission);
      const nextI = (i+1) % IV.length;
      $('#after').insertAdjacentHTML('beforeend','<div class="row" style="margin-top:14px"><button class="primary" id="nxt">Next question</button><button id="home">Back to Today</button></div>');
      $('#after').querySelectorAll('[data-r]').forEach(x=>x.disabled=true);
      $('#nxt').onclick=()=>{ stopRecording(true); startIV(nextI,null); }; $('#home').onclick=()=>go('today');
    });
  };
}

/* ---------- SQL console ---------- */
function tableHTML(cols, rows){
  return '<div class="tw"><table class="res"><tr>'+cols.map(c=>'<th>'+esc(c)+'</th>').join('')+'</tr>'+
    rows.map(r=>'<tr>'+r.map(v=>v===null?'<td class="null">NULL</td>':'<td>'+esc(v)+'</td>').join('')+'</tr>').join('')+'</table></div>';
}
function schemaHTML(open){
  return '<details'+(open?' open':'')+'><summary>Database: tickets and users tables</summary>'+
    '<p class="small"><b>tickets</b> (assigned_to points to users.id)</p>'+tableHTML(TK.cols, TK.rows)+
    '<p class="small"><b>users</b></p>'+tableHTML(US.cols, US.rows)+'</details>';
}
/* Spacing, keyword case and a final semicolon don't matter; the case of text inside quotes does, because
   WHERE department = 'it' finds no rows when the data says 'IT'. Text right after LIKE is lowercased, since SQLite's
   LIKE ignores case (for these plain ASCII values). Double quotes count as single quotes, as before. */
function sqlNorm(x){
  const parts = x.trim().replace(/;+\s*$/,'').replace(/"/g,"'").split("'");   /* odd parts are the quoted text */
  for(let i=0; i<parts.length; i+=2) parts[i] = parts[i].toLowerCase().replace(/\s+/g,' ').replace(/\s*([,=()<>*])\s*/g,'$1');
  for(let i=1; i<parts.length; i+=2) if(/\blike ?$/.test(parts[i-1])) parts[i] = parts[i].toLowerCase();
  return parts.join("'").trim();
}
function sqlPct(lv){ const t = SQLT.filter(q=>q[0]===lv); return Math.round(t.filter(q=>S.sql[q[3]]).length / t.length * 100); }
function vSQL(){
  const n1 = SQLT.filter(q=>q[0]===1), n2 = SQLT.filter(q=>q[0]===2);
  const solved = l=>l.filter(q=>(S.sql||{})[q[3]]).length;
  view.innerHTML = '<h1>🗄️ SQL console</h1><p class="sub">Write real SQL against a small help-desk database. Any normal spacing, capital letters and semicolons are fine.</p>'+
    '<div class="grid">'+
    '<div class="card mission"><h3>Level 1: Foundations</h3><p>SELECT, WHERE, ORDER BY, COUNT, GROUP BY, LIKE, NULL. Solved '+solved(n1)+' of '+n1.length+'.</p><div><button class="primary" data-l="1">Start</button></div></div>'+
    '<div class="card mission"><h3>Level 2: Job-ready</h3><p>JOIN, LEFT JOIN, HAVING, sorting counts, and a safe UPDATE. Solved '+solved(n2)+' of '+n2.length+'.</p><div><button class="primary" data-l="2">Start</button></div></div>'+
    '<div class="card mission"><h3>Mixed practice</h3><p>8 random challenges from both levels.</p><div><button data-l="0">Start</button></div></div></div>'+
    skillGrid(SGEN, 'ss', 'Every challenge is freshly generated with different values, names, dates and columns.')+
    '<h2>The practice database</h2><div class="card">'+schemaHTML(true)+'</div>';
  view.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>startSQL(8, null, +b.dataset.l));
  view.querySelectorAll('[data-ss]').forEach(b=>b.onclick=()=>startSQL(8, null, 0, b.dataset.ss));
}
function startSQL(n, mission, lv, sk){
  current = 'sql'; header();
  let items;
  S.recent = S.recent || {};
  if(sk) items = sqlSet(n, 0, sk==='*'?null:sk, S.recent.sql);
  else {
    const pool = SQLT.map((q,i)=>i).filter(i=>!lv || SQLT[i][0]===lv);
    const fresh = sqlSet(Math.floor(n/2), lv||0, null, S.recent.sql);
    items = shuffle(shuffle(pool).slice(0, n - fresh.length).concat(fresh));
  }
  rememberRecent(S.recent, 'sql', items.filter(Array.isArray).map(sqlKey)); save();
  if(!items.length){ toast('No SQL challenges for this yet'); return; }
  sqlStep({items, i:0, mission, lv, sk, right:0, hinted:false});
}
function sqlStep(s){
  if(s.i >= s.items.length){
    if(s.mission) finishMission(s);
    view.innerHTML = '<h1>🗄️ SQL console</h1><div class="card"><p class="q">'+s.right+' / '+s.items.length+' solved</p><p>Want more? SQLBolt (sqlbolt.com) has free interactive lessons that use the same skills.</p><div class="row"><button class="primary" id="more">Another set</button><button id="home">Back to Today</button></div></div>';
    $('#more').onclick=()=>startSQL(8, null, s.lv, s.sk); $('#home').onclick=()=>go('today'); return;
  }
  const it = s.items[s.i], isGen = Array.isArray(it), t = isGen ? it : SQLT[it];
  view.innerHTML = '<h1>🗄️ SQL console <span class="lv open">L'+t[0]+'</span></h1><p class="sub">Challenge '+(s.i+1)+' of '+s.items.length+'. Press Ctrl+Enter to run.</p>'+
    '<div class="card">'+schemaHTML(false)+'<p class="q">'+esc(t[1])+'</p>'+
    '<textarea class="sqlin" id="sq" spellcheck="false" placeholder="SELECT ..."></textarea>'+
    '<div class="row" style="margin-top:10px"><button class="primary" id="run">Run</button><button id="hint">Hint</button><button id="show">Show answer</button><button id="skip">Skip</button></div>'+
    '<div id="out"></div></div>';
  const ta = $('#sq'), out = $('#out'); ta.focus();
  const sid = isGen && t.sk ? skillIdFor('sql', 'sql', t.sk) : null;
  const next = ()=>{ s.i++; s.hinted=false; s.wrong=false; s.shown=false; sqlStep(s); };
  const run = ()=>{
    const v = ta.value; if(!v.trim()) return;
    const q = sqlNorm(v);
    if(t[2].some(re=>re.test(q))){
      if($('#run').disabled) return;
      /* A shown answer typed back in is practice only: no XP, not counted as solved. */
      const pts = s.shown ? 0 : s.hinted ? 8 : 15;
      if(isGen){ const g = S.gen.sqlconsole = S.gen.sqlconsole || {right:0,total:0}; g.total++; if(!s.shown) g.right++; } else if(!s.shown) S.sql[t[3]] = true;
      if(!s.shown) s.right++;
      if(sid) recordSkill(sid, !s.shown, !s.hinted && !s.wrong);
      if(pts) addXP(pts); else save();
      const r = t[5]();
      out.innerHTML = '<div class="explain">✅ <b>'+(s.shown ? 'Locked in (no XP, the answer was shown).' : 'Correct (+'+pts+' XP).')+'</b> Model answer: <code>'+esc(t[3])+'</code></div>'+
        (r.msg ? '<p>'+esc(r.msg)+'</p>' : '<p class="small">Expected result (from the model answer, which your query matched): '+r.rows.length+' row'+(r.rows.length===1?'':'s')+'</p>'+tableHTML(r.cols, r.rows))+
        '<div class="row" style="margin-top:10px"><button class="primary" id="nx">Next challenge</button></div>';
      $('#run').disabled = true; $('#nx').onclick = next; $('#nx').focus();
    } else if(/^(update|delete)\b/.test(q) && !/ where /.test(q)){
      s.wrong = true;
      out.innerHTML = '<div class="explain">⚠️ <b>Careful!</b> An UPDATE or DELETE without WHERE changes <b>every row</b> in the table. Add a WHERE clause.</div>';
    } else if(t[2].some(re=>new RegExp(re.source, 'i').test(q))){
      s.wrong = true;   /* right query, wrong capitals inside the quotes: = compares text exactly */
      out.innerHTML = '<div class="explain">❌ Almost: text in quotes must match the data exactly, capital letters included. <code>= \'it\'</code> finds nothing when the table says <code>IT</code>.</div>';
    } else {
      s.wrong = true;
      out.innerHTML = '<div class="explain">❌ Not quite. Check the table and column names, the quotes around text, and the order of clauses (SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY, LIMIT).</div>';
    }
  };
  $('#run').onclick = run;
  ta.onkeydown = e=>{ if(e.key==='Enter' && (e.ctrlKey||e.metaKey)){ e.preventDefault(); run(); } };
  $('#hint').onclick=()=>{ s.hinted=true; out.innerHTML='<div class="explain">💡 '+esc(t[4])+'</div>'; };
  $('#show').onclick=()=>{ s.hinted=true; s.shown=true; addNote('sql', t[1], t[3], ta.value.trim(), sid); out.innerHTML='<div class="explain">Answer: <code>'+esc(t[3])+'</code><br><span class="small">Type it in yourself to lock it in (no XP).</span></div>'; };
  $('#skip').onclick = ()=>{ if(sid) recordSkill(sid, false); addNote('sql', t[1], t[3], ta.value.trim(), sid); next(); };
}

/* ---------- Job practice ---------- */
function ivPct(cat){ const qs = IV.map((q,i)=>i).filter(i=>IV[i].c===cat); return Math.round(qs.filter(i=>(S.iv['i'+i]||0)>=2).length / qs.length * 100); }
function termPct(){ return Math.round(TERM.filter(t=>S.term[t[2]]).length / TERM.length * 100); }
function tkPct(id){ return (S.tickets||{})[id] || 0; }
const scenIdx = id=>SCEN.findIndex(s=>s.id===id);
/* Readiness items: [label, score(), practice(), fades]. Only items whose score fades without review (track mastery)
   count toward a job's %; tickets, console tasks and interview reps are shown as practice done, since a best-ever score never drops. */
const R = {
  track:(tid,lv)=>[track(tid).icon+' '+track(tid).name+' L'+lv, ()=>mastery(tid,lv), ()=>startQuiz(tid,10,null,null,lv), true, tid],
  ticket:id=>['🎫 Ticket: '+SCEN[scenIdx(id)].title, ()=>tkPct(id), ()=>playTicket(scenIdx(id),null), false, SCEN_TRACK[id]],
  sql:lv=>['🗄️ SQL console L'+lv, ()=>sqlPct(lv), ()=>startSQL(8,null,lv)],
  term:()=>['🐧 Terminal commands', termPct, ()=>startTerm(8,null)],
  iv:(cat,label)=>['🎤 Interview: '+label, ()=>ivPct(cat), ()=>go('interview')]
};
/* The jobs being applied to live in src/private.js (never committed); without it, these example roles stand in. */
const EXAMPLE_JOBS = [
  {name:'Restaurant group · IT Support Specialist', status:'Example role', items:[
    R.track('support',1), R.track('support',2), R.track('net',1), R.track('sec',1), R.ticket('pos'), R.ticket('lockout'), R.iv('technical','technical basics')]},
  {name:'Healthcare billing software · Software Tester', status:'Example role', items:[
    R.track('qa',1), R.track('qa',2), R.track('sql',1), R.sql(1), R.sql(2), R.ticket('regression'), R.iv('resume','about your resume')]},
  {name:'Energy company · Jr Linux IT Specialist', status:'Example role', items:[
    R.track('linux',1), R.track('linux',2), R.term(), R.track('net',1), R.track('code',1), R.ticket('disk'), R.iv('jobready','job-ready scenarios')]},
  {name:'Network operations center · NOC Admin', status:'Example role', items:[
    R.track('net',1), R.track('net',2), R.track('support',1), R.track('support',2), R.ticket('noc'), R.iv('behavioral','behavioral (STAR)'), R.iv('jobready','job-ready scenarios')]}
];
const JOBS = (typeof privateJobs === 'function' ? privateJobs(R) : EXAMPLE_JOBS).concat([
  {name:'Path goal · Cloud Security Engineer', status:'Long-term target · Cloud opens after Security + Networking L1', items:[
    R.track('cloud',1), R.track('cloud',2), R.track('sec',1), R.track('sec',2), R.track('net',1), R.track('linux',1)]},
  {name:'Path goal · Penetration Tester (red team)', status:'Long-term target · Offensive opens after Security, Networking, Linux + Code L1', items:[
    R.track('offsec',1), R.track('offsec',2), R.track('sec',1), R.track('sec',2), R.track('net',1), R.track('linux',1), R.track('code',1), R.ticket('scope')]},
  {name:'Future goal · Junior Security / SOC Analyst', status:'Needs Security+ first', items:[
    R.track('sec',1), R.track('sec',2), R.track('net',1), R.track('net',2), R.track('linux',1)]}
]);
function jobScore(j){ const f = j.items.filter(it=>it[3]); return f.length ? Math.round(f.reduce((a,it)=>a+it[1](),0) / f.length) : 0; }
function readyLabel(p){ return p>=90?'Strong':p>=70?'Interview-ready':p>=40?'Getting there':'Building'; }
function vReady(){
  view.innerHTML = '<h1>🎯 Job practice</h1><p class="sub">How much of the core knowledge for each job you have <b>retained right now</b> (track practice scores, which drop when reviews go overdue). Tickets, terminal, SQL and interview reps are listed as practice done: useful, but a best-ever score never shows what you still remember. It measures your practice, not a hiring decision.</p>'+
    JOBS.map((j,ji)=>{
      const p = jobScore(j);
      const locked = it=>it[4] && !trackOpen(it[4]);
      const weakest = j.items.map((it,k)=>[it[1](),k]).filter(([,k])=>!locked(j.items[k])).sort((a,b)=>a[0]-b[0])[0] || [100];
      return '<div class="card" style="margin-bottom:14px"><div class="row" style="justify-content:space-between"><h3 style="margin:0">'+esc(j.name)+'</h3><span class="pill">'+esc(j.status)+'</span></div>'+
        '<div class="row" style="margin-top:8px;gap:14px"><span class="q" style="margin:0">'+p+'%</span><span class="small">'+readyLabel(p)+'</span></div>'+
        '<div class="meter"><i style="width:'+p+'%"></i></div>'+
        j.items.map((it,k)=>{ const v = it[1](); return '<div class="ritem"><span>'+it[0]+(it[3] ? '' : ' <span class="small">(practice done, not counted)</span>')+'</span><div class="meter"><i style="width:'+v+'%"></i></div><span class="small" style="width:40px;text-align:right">'+v+'%</span>'+
          (locked(it) ? '<span class="small" title="Opens when '+esc(unlockText(it[4]))+'">🔒 Opens after '+PATH.after[it[4]].map(t=>esc(track(t).name)).join(' + ')+' L1</span>' : '<button data-j="'+ji+'" data-k="'+k+'">Practice</button>')+'</div>'; }).join('')+
        (weakest[0] < 100 ? '<p class="small" style="margin-top:10px">👉 Next best step: <b>'+j.items[weakest[1]][0]+'</b></p>' : '<p class="small">✅ Everything here is mastered. Do the interview questions out loud before the real interview.</p>')+
      '</div>';
    }).join('');
  view.querySelectorAll('[data-j]').forEach(b=>b.onclick=()=>JOBS[+b.dataset.j].items[+b.dataset.k][2]());
}

/* ---------- Ticket simulator ---------- */
function vTickets(){
  view.innerHTML = '<h1>🎫 Ticket simulator</h1><p class="sub">Real situations from the jobs you are applying for. Each step, pick what you would actually do. Strong techs score 90% or more.</p>'+
    '<div class="grid">'+SCEN.map((sc,i)=>{
      const best = S.tickets[sc.id];
      return '<div class="card mission '+(best>=90?'done':'')+'"><div class="tag">'+esc(sc.job)+'</div><h3>'+esc(sc.title)+'</h3><p>'+esc(sc.role)+' · '+sc.steps.length+' decisions</p>'+
        '<p class="small">'+(best===undefined?'Not played yet':'Best score: '+best+'%')+'</p><div><button class="primary" data-t="'+i+'">'+(best===undefined?'Play':'Play again')+'</button></div></div>';
    }).join('')+'</div>';
  view.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>playTicket(+b.dataset.t, null));
}
function playTicket(i, mission){
  current = 'tickets'; header();
  ticketStep({i, step:0, score:0, mission});
}
function ticketStep(st){
  const sc = SCEN[st.i];
  if(st.step >= sc.steps.length) return ticketEnd(st);
  const step = sc.steps[st.step];
  const order = shuffle(step.c.map((c,k)=>k));
  const top = Math.max(...step.c.map(c=>c[1]));
  view.innerHTML = '<h1>🎫 '+esc(sc.title)+'</h1><p class="sub">Your role: '+esc(sc.role)+'.</p>'+
    '<div class="card"><div class="progress"><span>Decision '+(st.step+1)+' of '+sc.steps.length+'</span><span>'+st.score+' points</span></div>'+
    '<div class="q">'+step.s+'</div><div class="opts">'+order.map(k=>'<button class="opt" data-k="'+k+'">'+step.c[k][0]+'</button>').join('')+'</div><div id="after"></div></div>';
  view.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{
    const k = +b.dataset.k, pts = step.c[k][1];
    st.score += pts;
    view.querySelectorAll('.opt').forEach(x=>{ x.disabled = true; if(step.c[+x.dataset.k][1]===top && +x.dataset.k!==k) x.classList.add('best'); });
    b.classList.add(pts>=8?'right':pts>=4?'mid':'wrong');
    $('#after').innerHTML = '<div class="explain">'+(pts>=8?'✅ ':pts>=4?'🟡 ':'❌ ')+'<b>+'+pts+' of '+top+'.</b> '+step.c[k][2]+
      (pts<top?'<br><span class="small">Best move: '+step.c.find(c=>c[1]===top)[0]+'</span>':'')+'</div>'+
      '<div class="row" style="margin-top:12px"><button class="primary" id="next">'+(st.step+1<sc.steps.length?'Next decision':'See result')+'</button></div>';
    $('#next').onclick=()=>{ st.step++; ticketStep(st); };
    $('#next').focus();
  });
}
function ticketEnd(st){
  const sc = SCEN[st.i];
  const pct = Math.round(st.score / (sc.steps.length*10) * 100);
  const prev = S.tickets[sc.id];
  S.tickets[sc.id] = Math.max(prev||0, pct);
  addXP(Math.round(pct/4), 'Ticket closed');
  if(st.mission) completeMission(st.mission);
  const verdict = pct>=90 ? 'Ticket handled like a pro. This is exactly the thinking interviewers listen for.'
    : pct>=70 ? 'Solid work. Re-read the feedback on the steps where you lost points, then play it again.'
    : 'Good practice. Play it again tomorrow; the order of the choices changes each time.';
  view.innerHTML = '<h1>🎫 Ticket closed</h1><div class="card"><p class="q">'+pct+'%</p><p>'+verdict+'</p>'+
    '<p class="small">Interview tip: you can retell this scenario as a "how would you handle..." answer.</p>'+
    '<div class="row"><button class="primary" id="nextT">Next scenario</button><button id="again">Play again</button><button id="home">Back to Today</button></div></div>';
  $('#nextT').onclick=()=>playTicket((st.i+1)%SCEN.length, null);
  $('#again').onclick=()=>playTicket(st.i, null);
  $('#home').onclick=()=>go('today');
}

/* ---------- Review ---------- */
function vReview(){
  const due = CARDS.map((c,i)=>i).filter(i=>S.cards[cardId(i)] && cardDue(i));
  importOldMisses();
  const open = journal().filter(isOpen).length, jdue = journal().filter(isDue).length;
  const weak = IV.map((q,i)=>i).filter(i=>S.iv['i'+i]===1);
  const fq = fadingQuiz();
  view.innerHTML = '<h1>Review</h1><p class="sub">This is where learning sticks. Come here whenever something is due.</p><div class="grid">'+
    '<div class="card mission"><h3>🃏 Due flashcards</h3><p>'+due.length+' card'+(due.length===1?'':'s')+' due today.</p><div><button class="primary" id="rc" '+(due.length?'':'disabled')+'>Review cards</button></div></div>'+
    '<div class="card mission"><h3>🔁 Fading quiz questions</h3><p>'+fq.length+' question'+(fq.length===1?'':'s')+' you answered right over '+QUIZ_FADE+' days ago. Answer again to keep them counted.</p><div><button class="primary" id="rf" '+(fq.length?'':'disabled')+'>Review '+Math.min(fq.length,10)+'</button></div></div>'+
    '<div class="card mission"><h3>📓 Mistake journal</h3><p>'+open+' open mistake'+(open===1?'':'s')+', '+jdue+' due for a retry today.</p><div class="row"><button class="primary" id="rq" '+(jdue?'':'disabled')+'>Retry due</button><button id="rj">Open journal</button></div></div>'+
    '<div class="card mission"><h3>🎤 Weak interview answers</h3><p>'+weak.length+' marked "Need work."</p><div><button class="primary" id="ri" '+(weak.length?'':'disabled')+'>Practice one</button></div></div></div>';
  if(due.length) $('#rc').onclick=()=>startCards(null, 20, null, due);
  if(fq.length) $('#rf').onclick=()=>startQuiz(null, 10, null, fq);
  if(jdue) $('#rq').onclick = retryMistakes;
  $('#rj').onclick = vJournal;
  if(weak.length) $('#ri').onclick=()=>startIV(weak[0], null);
}

/* ---------- Progress ---------- */
function vProgress(){
  const {r} = rankOf(S.xp);
  const learned = CARDS.filter((c,i)=>cardStatus(i)==='retained').length;
  const quizKept = QUIZ.filter((q,i)=>quizStatus(i)==='retained').length;
  const days = Object.keys(S.days).filter(d=>isFullDay(S.days[d])).length;
  view.innerHTML = '<h1>Progress</h1><div class="grid">'+
    '<div class="card"><h3 style="margin-top:0">Your numbers</h3><p>⭐ '+S.xp+' XP<br>🔥 Best streak: '+(S.best||0)+' days<br>📅 Full days (missions + reviews): '+days+'<br>🃏 Cards retained (proven, reviews on time): '+learned+' of '+CARDS.length+'<br>✅ Quiz questions retained (latest answer right, within 30 days): '+quizKept+' of '+QUIZ.length+'<br>🐧 Terminal commands solved: '+Object.keys(S.term).length+' of '+TERM.length+'<br>🎤 Interview questions practiced: '+Object.keys(S.iv).length+' of '+IV.length+'<br>🎫 Ticket scenarios played: '+Object.keys(S.tickets||{}).length+' of '+SCEN.length+'<br>🗄️ SQL challenges solved: '+Object.keys(S.sql||{}).length+' of '+SQLT.length+
    '<br>∞ Generated problems: '+Object.values(S.gen||{}).reduce((a,g)=>a+g.right,0)+' right of '+Object.values(S.gen||{}).reduce((a,g)=>a+g.total,0)+'</p></div>'+
    '<div class="card ladder"><h3 style="margin-top:0">Rank ladder</h3>'+RANKS.map(x=>'<div class="'+(x[1]===r[1]?'me':'')+'"><span>'+x[1]+'</span><span>'+x[0]+' XP</span></div>').join('')+'</div></div>'+
    '<h2>Track practice scores</h2><div class="card">'+TRACKS.map(t=>{const m1=mastery(t.id,1), m2=mastery(t.id,2); return '<div style="margin:10px 0">'+t.icon+' '+t.name+' <span class="small">L1 '+m1+'% · L2 '+m2+'%</span><div class="meter"><i style="width:'+m1+'%"></i></div><div class="meter"><i style="width:'+m2+'%;background:var(--accent)"></i></div>'+statsLine([1,2].map(n=>levelStats(t.id,n)).reduce((a,b)=>{ for(const k in a) a[k]+=b[k]; return a; }))+'</div>';}).join('')+'</div>'+
    '<h2>Backup</h2><div class="card"><p class="small">Back up, restore, or move progress between your PC and phone in <b>How to use → Backup</b>. Last backup: <b>'+esc(S.lastBackup || 'never')+'</b>.</p><div class="row"><button class="primary" id="toBackup">Open Backup</button></div></div>';
  $('#toBackup').onclick = ()=>go('backup');
}

/* ---------- Backup (How to use → Backup) ---------- */
function vBackup(){
  view.innerHTML = '<h1>Backup</h1>'+
    '<div class="card"><p class="small">Progress is saved in this browser only. A new computer, a new browser or cleared browser data starts empty, so download a backup once a week. To bring progress here from another device, use <b>Replace</b> on a device that has nothing yet, or <b>Merge</b> to combine two devices you both use. Last backup: <b>'+esc(S.lastBackup || 'never')+'</b>.</p>'+
    '<div class="row"><button class="primary" id="exp"'+(PHONE?' hidden':'')+'>Download backup file</button><button id="mrgb" title="Combine a backup file with the progress here. Nothing is lost.">Merge a backup file in</button><button id="impb" title="Throw away the progress here and use the backup instead">Replace with a backup file</button><input type="file" id="imp" accept=".json,application/json,text/plain" hidden><button id="reset">Reset everything</button>'+
    (prevSnapshot() && daysSince(prevSnapshot().at) <= UNDO_DAYS ? '<button id="undo" title="Go back to how progress was before the last merge, restore or reset">↺ Undo last '+esc(prevSnapshot().what)+' ('+esc(prevSnapshot().at)+')</button>' : '')+'</div>'+
    '<h3>Move progress between your PC and phone</h3>'+
    '<p class="small">Your PC and your phone each keep their own progress. To combine them: on one device tap <b>Copy backup</b>, send the text to yourself (email, OneDrive or a note), then on the other device paste it below and tap <b>Merge</b>. Merging keeps the best of both (higher scores, all missions, mistakes and exams) and never erases anything.</p>'+
    '<div class="row"><button class="primary" id="cpb">Copy backup</button></div>'+
    '<textarea id="bkText" hidden readonly style="min-height:70px;margin-top:8px" aria-label="Backup text"></textarea>'+
    '<textarea id="pasteBk" style="min-height:70px;margin-top:8px" placeholder="Paste backup text from your other device here" aria-label="Paste backup text"></textarea>'+
    '<div class="row" style="margin-top:8px"><button id="pasteMerge">Merge pasted backup</button><button id="pasteReplace" title="Throw away the progress here and use the pasted backup instead">Replace with pasted backup</button></div></div>';
  $('#exp').onclick=()=>{ downloadBackup(); vBackup(); };
  $('#cpb').onclick = copyBackupText;
  const pasted = mode=>{
    const raw = $('#pasteBk').value.trim(), r = importBackup(raw, mode);
    if(r !== 'bad') replaceDone(r, (mode === 'merge' ? 'Backup merged in.' : 'Backup restored.')+evNote(), ()=>importBackup(raw, mode, true));
    else toast('That text isn\'t a complete SkillQuest backup. Copy it again on the other device and paste all of it.');
  };
  $('#pasteMerge').onclick = ()=>pasted('merge');
  $('#pasteReplace').onclick = ()=>askConfirm('Replace ALL progress on this device with the pasted backup? Use "Merge" to keep both. (You can undo it afterwards.)', 'Replace with pasted backup', ()=>pasted('replace'));
  let importMode = 'merge';
  $('#mrgb').onclick = ()=>{ importMode = 'merge'; $('#imp').click(); };
  $('#impb').onclick = ()=>askConfirm('Replace ALL progress on this device with a backup file? Use "Merge" to keep both. (You can undo it afterwards.)', 'Choose file to replace with', ()=>{ importMode = 'replace'; $('#imp').click(); });
  $('#imp').onchange = e=>{ const f = e.target.files[0]; if(!f) return; const rd = new FileReader();
    rd.onload = ()=>{
      const mode = importMode, r = importBackup(rd.result, mode);
      if(r !== 'bad') replaceDone(r, (mode === 'merge' ? 'Backup merged in.' : 'Backup restored.')+evNote(), ()=>importBackup(rd.result, mode, true));
      else toast('That file is not a SkillQuest backup');
      e.target.value = ''; };
    rd.readAsText(f); };
  $('#reset').onclick=()=>askConfirm('Erase ALL SkillQuest progress on this device? You can undo it once from this page.', 'Erase everything', ()=>{
    const erase = force=>replaceProgress('reset', ()=>structuredClone(DEFAULT), force);
    replaceDone(erase(false), 'Progress erased.', ()=>erase(true)); });
  /* Undo puts back the whole snapshot, so anything done since then is lost: say so, and only offer it for UNDO_DAYS */
  const un = $('#undo'); if(un) un.onclick = ()=>askConfirm('Go back to your progress from before the last '+prevSnapshot().what+' ('+prevSnapshot().at+')? Everything you did since then on this device will be lost.', 'Undo the '+prevSnapshot().what, ()=>{ undoLast(); vBackup(); });
}
/* Bring a backup in: clean it, then merge or replace through replaceProgress (undo copy first, kept only if it saves).
   'bad' = not a usable backup; otherwise replaceProgress's answer. */
function importBackup(raw, mode, force){
  let b = null;
  try{ b = sanitizeBackup(JSON.parse(raw)); }catch(e){}
  if(!b) return 'bad';
  return replaceProgress(mode === 'merge' ? 'merge' : 'restore',
    ()=>mode === 'merge' ? mergeProgress(S, b) : recountStreak(migrateQuiz(migrateTerm(Object.assign(structuredClone(DEFAULT), b)))), force);
}

/* ---------- Guide ---------- */
function vGuide(){
  view.innerHTML = '<h1>How to use SkillQuest</h1><div class="card"><ol>'+
    '<li><b>Every day (20 to 30 minutes):</b> open Today and follow <b>Next up</b>: 3 two-minute lessons, 4 exercises from each, one ticket or interview rep, then your due reviews (clear them, or do 20). That full loop keeps your 🔥 streak. Lessons are picked for your path (cloud security + red team, foundations first) plus one slipping skill, and come back when a skill drops.</li>'+
    '<li><b>Type your answers.</b> Short-answer questions ask you to type from memory. That is harder than picking, and that is why it works. After a correct answer, say honestly whether you were sure or guessed: guesses barely count toward the practice score.</li>'+
    '<li><b>Mistake journal (Review tab):</b> every miss is saved with the right answer. Tag why you missed it, and retry what is due each day. A mistake clears only after you get it right on two different days.</li>'+
    '<li><b>Labs (Hands-on):</b> real break-and-fix problems in your WSL Ubuntu. Do one or two a week; they are your best interview stories.</li>'+
    '<li><b>Exams (Job prep):</b> timed Security+ and Network+ practice by official domain. Use it weekly to see which domain is weakest; aim for 85%+ on several attempts.</li>'+
    '<li><b>Watch Study → Skills.</b> Every skill has a practice score that fades if you don\'t practice, so skills come back for review before you forget them. Aim to get every skill to "Strong" (85%+).</li>'+
    '<li><b>Then one real lab</b> from the list on the Today tab (TryHackMe, Bandit, SQLBolt or Microsoft Learn).</li>'+
    '<li><b>Browse (Study → Tracks):</b> search every card in a track, filter by topic, copy a command, then study just those cards. The Linux track has the full Bandit toolkit plus a Bandit study guide. Keys in flashcards: Space flips, 1 = Again, 2 = Got it. At most '+NEW_PER_DAY+' new cards a day.</li>'+
    '<li><b>Honest numbers:</b> track % counts only what is retained right now. A card stops counting if its review is badly overdue, and a question stops counting if you miss it again. Expect it to go down sometimes; that is it telling you what to review.</li>'+
    '<li><b>Check the Review tab</b> whenever cards are due. Spaced review is what moves things into long-term memory.</li>'+
    '<li><b>Before any interview:</b> do every question in the Job prep → Interview for that job type, out loud, with the timer.</li>'+
    '<li><b>Fridays:</b> go to Progress and download a backup.</li></ol>'+
    '<p><b>Scoring:</b> quiz +10, flashcard +5, terminal and SQL +15 (+8 with a hint, 0 once the answer is shown), interview rep +10 to +25, full day (learn, practice, apply + reviews) +50.</p>'+
    '<p><b>Levels:</b> Levels 1 (Foundations) and 2 (Job-ready) are ready now. Levels 3 and 4 (Mid-level, Senior) come in a later phase.</p>'+
    '<p><b>Look and feel:</b> the ◐ button switches between three color modes (matrix, cyber, amber). The ⁂ rain button turns the background code rain on or off.</p>'+
    '<p class="small">Your progress stays on this computer. When you are online, the fonts load from Google Fonts; offline, it uses your built-in coding font.</p></div>';
}

/* ===================== THEME + EFFECTS + START ===================== */
const THEMES = ['matrix','cyber','amber'];
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
function pref(k, d){ try{ const v = localStorage.getItem(k); return v===null ? d : v; }catch(e){ return d; } }
function setPref(k, v){ try{ localStorage.setItem(k, v); }catch(e){} }
function applyTheme(t){
  if(!THEMES.includes(t)) t = 'matrix';
  document.documentElement.dataset.theme = t;
  $('#themeName').textContent = t;
}
applyTheme(pref('skillquest-theme','matrix'));
/* PowerShell line on Linux cards: shown unless turned off */
function psOn(){ return pref('skillquest-ps','on') !== 'off'; }
function applyPs(){ document.documentElement.classList.toggle('nops', !psOn()); }
applyPs();
$('#theme').onclick=()=>{
  const t = THEMES[(THEMES.indexOf(document.documentElement.dataset.theme)+1) % THEMES.length];
  applyTheme(t); setPref('skillquest-theme', t); toast('Color mode: '+t);
};

/* Code rain in the background (canvas) */
const rain = (function(){
  const cv = $('#rain'), ctx = cv.getContext('2d');
  const glyphs = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEF<>/{}$#';
  let cols = [], fs = 16, on = false, last = 0, raf = null;
  function size(){ cv.width = innerWidth; cv.height = innerHeight; cols = Array(Math.ceil(cv.width/fs)).fill(0).map(()=>Math.random()*-60); }
  function frame(ts){
    raf = requestAnimationFrame(frame);
    if(ts - last < 55) return; last = ts;
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(0,0,cv.width,cv.height);
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#39ff88';
    ctx.font = fs+'px monospace';
    cols.forEach((y,i)=>{
      ctx.fillText(glyphs[Math.floor(Math.random()*glyphs.length)], i*fs, y*fs);
      cols[i] = (y*fs > cv.height && Math.random() > 0.975) ? 0 : y + 1;
    });
  }
  addEventListener('resize', size);
  return {
    set(v){ on = v; $('#rainBtn').style.opacity = v ? 1 : .5;
      if(v && !raf){ size(); raf = requestAnimationFrame(frame); }
      if(!v && raf){ cancelAnimationFrame(raf); raf = null; ctx.clearRect(0,0,cv.width,cv.height); } },
    get on(){ return on; }
  };
})();
rain.set(!calm && pref('skillquest-rain','on')==='on');
$('#rainBtn').onclick=()=>{ rain.set(!rain.on); setPref('skillquest-rain', rain.on?'on':'off'); };

/* "Decrypt" effect: page titles scramble, then resolve */
function decrypt(el){
  const node = [...el.childNodes].find(n=>n.nodeType===3 && n.textContent.trim());
  if(!node || calm) return;
  const final = node.textContent, chars = '!<>-_\\/[]{}=+*^?#01';
  let frame = 0; const total = 14;
  const tick = ()=>{
    frame++;
    node.textContent = final.split('').map((c,i)=> c===' ' || i < (frame/total)*final.length ? c : chars[Math.floor(Math.random()*chars.length)]).join('');
    if(frame < total) requestAnimationFrame(tick); else node.textContent = final;
  };
  tick();
}
let lastTitle = '';
new MutationObserver(()=>{
  const h = view.querySelector('h1'); if(!h || h.dataset.dc) return;
  h.dataset.dc = 1;
  h.setAttribute('aria-label', h.textContent);   /* screen readers read the real title, not the scramble effect */
  if(h.textContent !== lastTitle){ lastTitle = h.textContent; decrypt(h); }
}).observe(view, {childList:true});
/* Flashcard keys: Space flips, 1 = Again, 2 = Got it */
document.addEventListener('keydown', e=>{
  if(!$('#fc') || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.ctrlKey || e.altKey || e.metaKey) return;
  if((e.code==='Space' || (e.key==='Enter' && e.target.id==='fc')) && $('#flip')){ e.preventDefault(); $('#flip').click(); }
  else if(e.key==='1' && $('#again')){ e.preventDefault(); $('#again').click(); }
  else if(e.key==='2' && $('#good')){ e.preventDefault(); $('#good').click(); }
});
/* Ask the browser not to clear SkillQuest's storage under disk pressure (silently ignored where unsupported). */
try{ if(navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(()=>{}); }catch(e){}
header(); vToday();
