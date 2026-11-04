/* ===================== MISTAKE JOURNAL =====================
   Every missed quiz question is saved with your answer, the right answer and the explanation.
   A mistake is "cleared" only after you get it right on two different days.
   Terminal and SQL misses are kept as review notes with the model answer. */

function journal(){ S.journal = S.journal || []; return S.journal; }
const JOURNAL_MAX = 300;

/* d = the question array [track, level, question, options, answerIndex, explanation] */
function addMistake(d, info){
  const J = journal(), key = (info.kind||'quiz')+'|'+d[2];
  let e = J.find(x=>x.key===key && !x.done);
  if(e){ e.count++; e.hits = []; e.your = info.your; e.at = dayStr(); }
  else {
    e = {id:'m'+Date.now().toString(36)+Math.floor(Math.random()*1e4), key, kind:info.kind||'quiz', at:dayStr(), count:1, hits:[], done:false, why:null,
         d: d.slice(0,6), your: info.your||'', sid: info.sid||null, qi: info.qi==null ? null : info.qi};
    J.unshift(e);
  }
  if(J.length > JOURNAL_MAX) J.length = JOURNAL_MAX;
  save();
}
/* Terminal / SQL: keep the task and the model answer */
function addNote(kind, task, model, your, sid){
  const J = journal(), key = kind+'|'+task;
  if(J.find(x=>x.key===key && !x.done)) return;
  J.unshift({id:'m'+Date.now().toString(36), key, kind, at:dayStr(), count:1, hits:[], done:false, why:null, task, model, your:your||'', sid:sid||null});
  if(J.length > JOURNAL_MAX) J.length = JOURNAL_MAX;
  save();
}
/* Returns true for the first retry of this mistake today (that one counts as a review); later tries the same day don't. */
function journalResult(id, ok){
  const e = journal().find(x=>x.id===id); if(!e) return false;
  const first = e.tried !== dayStr(); e.tried = dayStr();
  if(ok){
    if(!e.hits.includes(dayStr())) e.hits.push(dayStr());
    if(e.hits.length >= 2){ e.done = true; e.doneAt = dayStr(); if(e.qi!=null){ const qid = quizId(e.qi); S.qfirst = S.qfirst || {}; S.qfirst[qid] = e.hits[0]; delete S.miss[qid]; S.quiz[qid] = dayStr(); }   /* right on two days: proven */ toast('Mistake cleared for good'); }
  } else e.hits = [];
  save();
  return first;
}
const isOpen = e=>!e.done && (e.kind==='quiz' ? true : !(e.sid && skillScore(e.sid) >= 70));
/* due = a quiz mistake from an earlier day that you haven't retried today (a missed retry comes back tomorrow, like a card) */
const isDue = e=>e.kind==='quiz' && !e.done && (e.at||'') < dayStr() && e.tried !== dayStr() && e.hits[e.hits.length-1] !== dayStr();
const WHY = [['know',"Didn't know it"],['misread','Misread the question'],['mixed','Mixed up two things'],['careless','Careless slip']];

/* Misses saved before the journal existed (S.miss) become journal entries once. */
function importOldMisses(){
  Object.keys(S.miss||{}).forEach(k=>{
    const i = +k.slice(1), q = QUIZ[i];
    if(q && !journal().some(e=>e.qi===i)) addMistake(q, {kind:'quiz', your:'', qi:i});
  });
}
function retryMistakes(){
  const due = journal().filter(isDue).slice(0, 10);
  if(!due.length){ toast('Nothing due right now. Come back tomorrow.'); return; }
  const items = due.map(e=>({gen:true, d:e.d, journal:e.id, sk:null, tid:e.d[0], noType:true}));
  quizStep({items, i:0, right:0, mission:null, tid:null, lv:0, endless:false, journalRun:true});
}

function vJournal(){
  current = 'review'; header();
  const J = journal(), open = J.filter(isOpen), due = J.filter(isDue), cleared = J.filter(e=>e.done).length;
  const whyCount = WHY.map(([k,l])=>[l, open.filter(e=>e.why===k).length]);
  const groups = {};
  open.forEach(e=>{ const s = e.sid && skillById(e.sid); const g = s ? s.icon+' '+s.sk : (e.kind==='quiz' ? track(e.d[0]).icon+' '+track(e.d[0]).name+' (fixed questions)' : (e.kind==='term'?'⌨️ Terminal':'🗄️ SQL')); (groups[g] = groups[g] || []).push(e); });
  const entry = e=>{
    if(e.kind !== 'quiz') return '<details class="card" style="margin:8px 0"><summary>'+esc(e.task)+'</summary><p class="small">Your last try: <code>'+esc(e.your||'(skipped)')+'</code></p><p>Model answer: <code>'+esc(e.model)+'</code></p>'+
      '<p class="small">Clears when this skill\'s practice score reaches 70%.</p>'+(e.sid?'<button data-pr="'+esc(e.sid)+'">Practice this skill</button>':'')+'</details>';
    const right = e.d[3][e.d[4]];
    return '<details class="card" style="margin:8px 0"><summary>'+e.d[2].replace(/<table[\s\S]*?<\/table>/g,' [table] ')+(e.count>1?' <span class="lv" style="color:var(--bad);border-color:var(--bad)">missed ×'+e.count+'</span>':'')+'</summary>'+
      '<p>❌ You: <b>'+(e.your ? esc(e.your) : '(no answer)')+'</b><br>✅ Right: <b>'+right+'</b></p><div class="explain">'+e.d[5]+'</div>'+
      '<p class="small">Right on '+e.hits.length+' of 2 separate days needed.</p>'+
      '<div class="small">Why did you miss it?</div><div class="chips">'+WHY.map(([k,l])=>'<button class="chip" data-why="'+k+'" data-id="'+esc(e.id)+'" style="'+(e.why===k?'border-color:var(--accent);color:var(--accent)':'')+'">'+l+'</button>').join('')+'</div>'+
      (e.sid?'<div style="margin-top:8px"><button data-pr="'+esc(e.sid)+'">Practice this skill</button></div>':'')+'</details>';
  };
  view.innerHTML = '<h1>📓 Mistake journal</h1><p class="sub">Your misses, saved with the right answer and why. A mistake clears only after you get it right on two different days, so it really sticks.</p>'+
    '<div class="row"><span class="pill">'+open.length+' open</span><span class="pill">'+due.length+' due today</span><span class="pill">'+cleared+' cleared</span>'+
    '<button class="primary" id="retry" '+(due.length?'':'disabled')+'>Retry '+Math.min(due.length,10)+' due mistakes</button></div>'+
    (whyCount.some(x=>x[1]) ? '<p class="small" style="margin-top:12px">Your pattern: '+whyCount.filter(x=>x[1]).map(x=>x[0]+' ×'+x[1]).join(' · ')+
      (whyCount[0][1] >= Math.max(whyCount[1][1], whyCount[3][1]) ? ' → mostly knowledge gaps: read the lessons.' : ' → mostly slips: slow down and re-read each question.')+'</p>' : '')+
    (open.length ? Object.entries(groups).map(([g,list])=>'<h2>'+esc(g)+' ('+list.length+')</h2>'+list.map(entry).join('')).join('')
                 : '<div class="card" style="margin-top:16px"><p>No open mistakes. Misses from quizzes, drills and exams will appear here automatically.</p></div>');
  if(due.length) $('#retry').onclick = retryMistakes;
  view.querySelectorAll('[data-why]').forEach(b=>b.onclick=()=>{ const e = journal().find(x=>x.id===b.dataset.id); if(e){ e.why = e.why===b.dataset.why ? null : b.dataset.why; save(); vJournal(); } });
  view.querySelectorAll('[data-pr]').forEach(b=>b.onclick=()=>startSkill(skillById(b.dataset.pr), 6, null));
}
