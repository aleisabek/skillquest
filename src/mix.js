/* ===================== MIXED DAILY PRACTICE =====================
   After today's lessons, their exercises come as one shuffled set instead of 4 in a row per lesson: PRACTICE_N from
   each lesson whose practice isn't done yet, plus up to MIX_OLD from skills you started on other days. Nothing says
   which skill a question is from until you answer it, so you have to work out what each one needs, the way the exam
   asks. Mixed sets score lower while you practice and stick better afterward (interleaving).
   Each question still runs in its own engine (quiz, terminal or SQL), one at a time, and records its own skill as
   usual. A lesson's practice step (day.p0..p2) counts as soon as one of its questions is right without the answer
   shown, the same bar as before, so leaving halfway keeps what you've earned. Nothing new is saved. */
const MIX_OLD = 2;
/* Order the set so the same skill never comes twice in a row when that can be avoided: each pick is the skill with
   the most questions left that isn't the one just asked (ties broken at random). entries: [{key, ...}] */
function mixOrder(entries, rand){
  rand = rand || Math.random;
  const left = new Map();
  for(const e of entries){ if(!left.has(e.key)) left.set(e.key, []); left.get(e.key).push(e); }
  const out = []; let prev = null;
  while(out.length < entries.length){
    const keys = [...left.keys()].filter(k=>left.get(k).length), pool = keys.filter(k=>k !== prev);
    const from = pool.length ? pool : keys, top = Math.max(...from.map(k=>left.get(k).length));
    const best = from.filter(k=>left.get(k).length === top), k = best[Math.floor(rand() * best.length)];
    out.push(left.get(k).shift()); prev = k;
  }
  return out;
}
/* Older skills to mix in: started on an earlier day, not in today's plan, in an open track. Prefer ones not practiced
   for 2+ days (a little forgotten is when recall does the most), one from the same track as a plan skill (lookalikes
   you have to tell apart), then the weakest. */
function mixOlder(planIds, n){
  const M = S.mastery || {}, today = dayStr(), tie = s=>hashStr(s.id + today);
  const planT = planIds.map(id=>(skillById(id) || {}).tid);
  const pool = pathSkills().filter(s=>!planIds.includes(s.id) && trackOpen(s.tid) && M[s.id] && M[s.id].last && M[s.id].last !== today);
  const rank = (a, b)=>(daysSince(M[b.id].last) >= 2) - (daysSince(M[a.id].last) >= 2) || skillScore(a.id) - skillScore(b.id) || tie(a) - tie(b);
  const out = [], same = pool.filter(s=>planT.includes(s.tid)).sort(rank)[0];
  if(same && n > 0) out.push(same);
  for(const s of pool.slice().sort(rank)) if(out.length < n && !out.includes(s)) out.push(s);
  return out;
}
/* fresh exercises for one skill, from whichever engine it uses */
function mixItemsFor(s, n){
  S.recent = S.recent || {};
  if(s.kind === 'quiz'){ const q = quizSet(s.tid, n, 0, s.sk, S.recent.quiz); rememberRecent(S.recent, 'quiz', q.map(quizKey)); return q; }
  if(s.kind === 'term'){ const t = termSet(n, 0, s.sk, S.recent.term); rememberRecent(S.recent, 'term', t.map(termKey)); return t; }
  const q = sqlSet(n, 0, s.sk, S.recent.sql); rememberRecent(S.recent, 'sql', q.map(sqlKey)); return q;
}
function startMix(){
  const st = todaySteps(), plan = st.plan, entries = [];
  plan.ids.forEach((id, i)=>{ if(st.practice[i]) return; const s = skillById(id);
    mixItemsFor(s, PRACTICE_N).forEach(item=>entries.push({key:id, s, slot:i, item})); });
  if(!entries.length){ toast('Today\'s practice is already done.'); return go('today'); }
  mixOlder(plan.ids, MIX_OLD).forEach(s=>mixItemsFor(s, 1).forEach(item=>entries.push({key:s.id, s, slot:-1, item})));
  save();
  mixStep({queue:mixOrder(entries), at:0, day:dayStr(), got:{}});
}
function mixStep(m){
  if(m.at >= m.queue.length) return mixEnd(m);
  current = 'today'; header();
  const e = m.queue[m.at];
  const then = s=>{
    const ok = s.right > 0, g = m.got[e.key] = m.got[e.key] || {s:e.s, slot:e.slot, right:0, n:0};
    g.n++; if(ok) g.right++;
    if(ok && e.slot >= 0 && dayStr() === m.day) completeMission('p'+e.slot);
    m.at++; mixStep(m);
  };
  const s = {items:[e.item], i:0, right:0, mission:null, sk:e.s.sk, lv:0, then, mix:{n:m.at + 1, of:m.queue.length, sk:e.s.sk}};
  if(e.s.kind === 'quiz') quizStep(Object.assign(s, {tid:e.s.tid, endless:true}));
  else if(e.s.kind === 'term') termStep(Object.assign(s, {lines:[], hinted:false}));
  else sqlStep(Object.assign(s, {hinted:false}));
}
/* the label a mixed question shows instead of its skill name, and the line that names the skill once it's answered */
const mixLabel = s=>'Question '+s.mix.n+' of '+s.mix.of;
const mixReveal = s=>'<p class="small mixwas">This one was: <b>'+esc(s.mix.sk)+'</b></p>';
function mixEnd(m){
  const rows = Object.values(m.got), right = rows.reduce((a, g)=>a + g.right, 0), n = rows.reduce((a, g)=>a + g.n, 0);
  const st = todaySteps(), missed = rows.filter(g=>g.slot >= 0 && !st.practice[g.slot]);
  view.innerHTML = '<h1>🔀 Mixed practice done</h1><div class="card"><p class="q">'+right+' / '+n+' ('+(n ? Math.round(100 * right / n) : 0)+'%)</p>'+
    '<ul class="clean">'+rows.map(g=>'<li>'+g.s.icon+' '+esc(g.s.sk)+': '+g.right+' of '+g.n+(g.slot < 0 ? ' <span class="small">(older skill, mixed in)</span>' : '')+'</li>').join('')+'</ul>'+
    '<p class="small">Mixed sets score lower than one-topic sets while you do them. That is expected: working out what each question needs is the part that makes it stick, and it is what the exam asks of you.</p>'+
    (missed.length ? '<p><b>Not counted yet:</b> '+missed.map(g=>esc(g.s.sk)).join(', ')+'. Get one of its questions right without showing the answer.</p>' : '')+
    '<div class="row">'+(missed.length ? '<button class="primary" id="mixAgain">Another mixed set</button>' : '')+'<button'+(missed.length ? '' : ' class="primary"')+' id="home">Back to Today</button></div></div>';
  if($('#mixAgain')) $('#mixAgain').onclick = startMix;
  $('#home').onclick = ()=>go('today');
  (missed.length ? $('#mixAgain') : $('#home')).focus();
}
