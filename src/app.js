/* ===================== STATE ===================== */
/* The build sets this to true for the phone version (published as a private artifact),
   where file downloads and the microphone aren't available. */
const PHONE = false;
const KEY = 'skillquest-v1';
const DEFAULT = {xp:0, streak:0, best:0, lastFull:null, days:{}, cards:{}, quiz:{}, miss:{}, term:{}, iv:{}, notes:{}, tickets:{}, sql:{}, gen:{}, mastery:{}, lessons:{}};
let S = load();
function load(){
  try{ const raw = localStorage.getItem(KEY); if(raw) return Object.assign(structuredClone(DEFAULT), JSON.parse(raw)); }catch(e){}
  return structuredClone(DEFAULT);
}
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} }

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
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'),1800); }
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
  try{ navigator.clipboard.writeText(txt).then(()=>{ S.lastBackup = dayStr(); save(); toast('Backup copied. Paste it into SkillQuest on your other device (Progress → Paste backup).'); vProgress(); }, ()=>showBackupText(txt)); }
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
   For each kind of data, keep the most progress: higher scores, later dates, and both sets of entries. */
function mergeProgress(a, b){
  const m = Object.assign(structuredClone(DEFAULT), structuredClone(a));
  const maxNum = k=>{ m[k] = Math.max(a[k]||0, b[k]||0); };
  ['xp','best'].forEach(maxNum);
  const later = (x,y)=>(x||'') >= (y||'') ? x : y;
  /* streak: take it from whichever device finished all missions most recently */
  if((b.lastFull||'') > (a.lastFull||'')){ m.streak = b.streak; m.lastFull = b.lastFull; }
  m.lastBackup = later(a.lastBackup, b.lastBackup);
  /* simple maps: union; on conflict keep the "more done" value */
  for(const k of ['quiz','term','sql','lessons','labs','practice','notes']){
    m[k] = Object.assign({}, a[k]||{});
    for(const [x,v] of Object.entries(b[k]||{})){
      const o = m[k][x];
      if(o === undefined) m[k][x] = v;
      else if(k === 'notes') m[k][x] = String(v).length > String(o).length ? v : o;   /* keep the longer note */
      else if(typeof o === 'string' && typeof v === 'string') m[k][x] = later(o, v);   /* dates: keep the latest */
    }
  }
  for(const k of ['iv','tickets']){ m[k] = Object.assign({}, a[k]||{}); for(const [x,v] of Object.entries(b[k]||{})) m[k][x] = Math.max(m[k][x]||0, v); }
  /* misses: keep only those not answered right on either device */
  m.miss = Object.assign({}, a.miss||{}, b.miss||{}); for(const x of Object.keys(m.miss)) if(m.quiz[x]) delete m.miss[x];
  /* days: union of completed missions */
  m.days = structuredClone(a.days||{}); for(const [d,v] of Object.entries(b.days||{})) m.days[d] = Object.assign({}, m.days[d]||{}, v);
  /* flashcards: keep the higher box (and its due date) */
  m.cards = Object.assign({}, a.cards||{}); for(const [x,v] of Object.entries(b.cards||{})) if(!m.cards[x] || v.box > m.cards[x].box) m.cards[x] = v;
  /* skill mastery: keep the record with more practice, or the more recent one */
  m.mastery = Object.assign({}, a.mastery||{}); for(const [x,v] of Object.entries(b.mastery||{})){ const o = m.mastery[x]; if(!o || v.n > o.n || (v.n===o.n && (v.last||'') > (o.last||''))) m.mastery[x] = v; }
  /* generated-problem counters: keep the larger totals */
  m.gen = Object.assign({}, a.gen||{}); for(const [x,v] of Object.entries(b.gen||{})) if(!m.gen[x] || v.total > m.gen[x].total) m.gen[x] = v;
  /* journal: union by question; a mistake cleared on either device stays cleared */
  const J = new Map(); for(const e of [...(a.journal||[]), ...(b.journal||[])]){ const o = J.get(e.key+'|'+e.at); if(!o || (e.done && !o.done) || (e.hits||[]).length > (o.hits||[]).length) J.set(e.key+'|'+e.at, e); }
  m.journal = [...J.values()].sort((x,y)=>(y.at||'').localeCompare(x.at||'')).slice(0, 300);
  /* exam history: union, newest first */
  const E = new Map(); for(const e of [...(a.exams||[]), ...(b.exams||[])]) E.set(e.cert+e.date+e.pct+e.n+e.secs, e);
  m.exams = [...E.values()].sort((x,y)=>y.date.localeCompare(x.date)).slice(0, 50);
  if(a.typed === false && b.typed === false) m.typed = false; else delete m.typed;
  return m;
}
function backupDue(){
  const hasProgress = S.xp > 0 || Object.keys(S.mastery||{}).length > 0;
  if(!hasProgress) return false;
  if(!S.lastBackup) return true;
  return (new Date(dayStr()+'T12:00:00') - new Date(S.lastBackup+'T12:00:00')) / 86400000 > 7;
}
function cardId(i){ return 'c'+i; }
function quizId(i){ return 'q'+i; }
function cardDue(i){ const c = S.cards[cardId(i)]; return !c || c.due <= dayStr(); }

/* ===================== DAILY MISSIONS ===================== */
function missions(){
  const n = dayNum();
  const QT = TRACKS.filter(t=>QUIZ.some(q=>q[0]===t.id));
  const qt = QT[n % QT.length];
  const ft = TRACKS[(n+3) % TRACKS.length];
  const qlv = levelFor(qt.id), flv = levelFor(ft.id);
  const kind = n % 4;
  const sc = n % SCEN.length;
  const ivIdx = n % IV.length;
  /* Mission 1 targets your weakest (or next new) skill: lesson first if you haven't read it, then fresh problems. */
  const focus = recommend(1)[0];
  const fresh = focus && lessonFor(focus.id) && !(S.lessons||{})[focus.id];
  return [
    focus
      ? {key:'quiz', tag:'Mission 1 · Focus skill', title:focus.icon+' '+focus.sk, text:(skillStatus(focus.id)[0]==='New' ? 'A new skill for you. ' : 'Your weakest skill right now ('+skillScore(focus.id)+'%). ')+(fresh ? 'Read the 2-minute lesson, then 6 fresh problems.' : '6 fresh problems. Type your answers.'),
         go:()=> fresh ? vLesson(focus.id, 'quiz') : startSkill(focus, 6, 'quiz')}
      : {key:'quiz', tag:'Mission 1 · Quiz', title:qt.icon+' '+qt.name+' quiz (L'+qlv+')', text:'5 questions. Read every explanation, even when you get it right.', go:()=>startQuiz(qt.id, 5, 'quiz', null, qlv)},
    [
      {key:'skill', tag:'Mission 2 · Hands-on', title:'🐧 Terminal challenge', text:'5 real Linux tasks. Type the command like you would on a server.', go:()=>startTerm(5,'skill',levelFor('linux'))},
      {key:'skill', tag:'Mission 2 · Memory', title:ft.icon+' '+ft.name+' flashcards (L'+flv+')', text:'8 cards. Say each answer out loud before you flip.', go:()=>startCards(ft.id, 8, 'skill', null, flv)},
      {key:'skill', tag:'Mission 2 · Ticket simulator', title:'🎫 '+SCEN[sc].title, text:'Your role: '+SCEN[sc].role+'. Make the calls a real tech would make.', go:()=>playTicket(sc,'skill')},
      {key:'skill', tag:'Mission 2 · SQL console', title:'🗄️ SQL challenge (L'+levelFor('sql')+')', text:'4 queries against a help-desk ticket database.', go:()=>startSQL(4,'skill',levelFor('sql'))}
    ][kind],
    {key:'iv', tag:'Mission 3 · Interview rep', title:'🎤 One interview question', text:'"'+IV[ivIdx].q+'" Answer out loud, then compare.', go:()=>startIV(ivIdx,'iv')}
  ];
}
function completeMission(key){
  const d = dayStr(); S.days[d] = S.days[d] || {};
  if(S.days[d][key]) return;
  S.days[d][key] = true;
  const all = ['quiz','skill','iv'].every(k=>S.days[d][k]);
  if(all){
    S.streak = (S.lastFull === addDays(d,-1)) ? S.streak+1 : 1;
    S.best = Math.max(S.best||0, S.streak);
    S.lastFull = d; save();
    addXP(50, 'All 3 missions done! Streak ' + S.streak);
  } else save();
  header();
}

/* ===================== HEADER / NAV ===================== */
const TABS = [['today','Today'],['skills','Skills'],['tracks','Tracks'],['tickets','Tickets'],['terminal','Terminal'],['sql','SQL'],['interview','Interview'],['review','Review'],['exams','Exams'],['labs','Labs'],['practice','Free practice'],['ready','Job readiness'],['progress','Progress'],['guide','How to use']];
let current = 'today';
function header(){
  const {r,next} = rankOf(S.xp);
  $('#rank').textContent = r[1];
  $('#xp').textContent = S.xp;
  const pct = next ? Math.round((S.xp - r[0]) / (next[0] - r[0]) * 100) : 100;
  $('#xpfill').style.width = pct + '%';
  const live = (S.lastFull === dayStr() || S.lastFull === addDays(dayStr(),-1)) ? S.streak : 0;
  $('#streak').textContent = live;
  $('#nav').innerHTML = TABS.map(([k,l])=>'<button class="'+(k===current?'on':'')+'" data-tab="'+k+'">'+l+'</button>').join('');
}
$('#nav').addEventListener('click', e=>{ const b=e.target.closest('button'); if(b) go(b.dataset.tab); });
function go(tab){
  if(EX && tab!=='exams'){ askConfirm('Leave the exam in progress? Your answers will be lost.', 'Leave exam', ()=>{ stopExamTimer(); EX = null; go(tab); }); return; }
  stopRecording(true);   /* leaving the page discards a half-finished recording */
  current = tab; stopTimer(); header(); ({today:vToday,skills:vSkills,exams:vExams,labs:vLabs,practice:vPractice,tracks:vTracks,tickets:vTickets,sql:vSQL,terminal:vTerminal,interview:vInterview,review:vReview,ready:vReady,progress:vProgress,guide:vGuide})[tab](); window.scrollTo(0,0); }

/* ===================== VIEWS ===================== */
function vToday(){
  const d = S.days[dayStr()] || {};
  const ms = missions();
  const done = ms.filter(m=>d[m.key]).length;
  const tip = STRATEGIES[dayNum() % STRATEGIES.length];
  const due = CARDS.filter((c,i)=>S.cards[cardId(i)] && cardDue(i)).length;
  const jdue = journal().filter(isDue).length;
  const reviewBits = [due ? due+' flashcard'+(due>1?'s':'') : '', jdue ? jdue+' mistake'+(jdue>1?'s':'')+' to retry' : ''].filter(Boolean);
  view.innerHTML =
    (backupDue() ? '<div class="card tip row" style="margin-top:18px;justify-content:space-between"><span>💾 '+(S.lastBackup ? 'Your last backup was on '+S.lastBackup+'.' : 'You haven\'t backed up your progress yet.')+' A backup protects your progress if browser data gets cleared.</span><button class="primary" id="bk">'+(PHONE?'Copy backup':'Download backup')+'</button></div>' : '')+
    '<h1>Today\'s missions</h1><p class="sub">'+done+' of 3 done. Finish all three for +50 XP and to keep your streak.</p>'+
    '<div class="grid">'+ms.map((m,i)=>
      '<div class="card mission '+(d[m.key]?'done':'')+'"><div class="tag">'+m.tag+'</div><h3>'+m.title+'</h3><p>'+esc(m.text)+'</p>'+
      '<div><button class="'+(d[m.key]?'':'primary')+'" data-m="'+i+'">'+(d[m.key]?'✓ Done · do it again':'Start')+'</button></div></div>').join('')+'</div>'+
    '<h2>Strategy of the day</h2><div class="card tip"><b>'+tip[0]+'.</b> '+tip[1]+'</div>'+
    (reviewBits.length ? '<h2>Review</h2><div class="card row"><span>Due today: '+reviewBits.join(' and ')+'.</span><button data-go="review">Review now</button></div>' : '')+
    '<h2>Real labs to pair with today</h2><div class="card"><ul class="clean">'+
      '<li><a href="https://tryhackme.com" target="_blank" rel="noopener">TryHackMe</a>: start the <i>Pre Security</i> path, then <i>SOC Level 1</i>.</li>'+
      '<li><a href="https://overthewire.org/wargames/bandit/" target="_blank" rel="noopener">OverTheWire Bandit</a>: one level a day.</li>'+
      '<li><a href="https://sqlbolt.com" target="_blank" rel="noopener">SQLBolt</a>: one lesson. Employers keep asking for SQL.</li>'+
      '<li><a href="https://learn.microsoft.com/training/" target="_blank" rel="noopener">Microsoft Learn</a>: search "Microsoft 365 fundamentals."</li>'+
      '<li><a href="https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/sy0-701-comptia-security-plus-course/" target="_blank" rel="noopener">Professor Messer Security+</a>: one free video.</li></ul>'+
      '<p class="small">Many TryHackMe paths need a paid plan. <a href="#" id="toPractice">See the Free practice tab</a> for no-cost alternatives (picoCTF, Hack The Box Academy, Blue Team Labs, Cisco NetAcad and more).</p></div>';
  view.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>ms[+b.dataset.m].go());
  const r = view.querySelector('[data-go]'); if(r) r.onclick=()=>go('review');
  $('#toPractice').onclick = e=>{ e.preventDefault(); go('practice'); };
  const bk = $('#bk'); if(bk) bk.onclick = ()=>{ downloadBackup(); vToday(); };
}

function mastery(tid, lv){
  lv = lv || 1;
  const qs = QUIZ.map((q,i)=>[q,i]).filter(([q])=>q[0]===tid && q[1]===lv);
  const cs = CARDS.map((c,i)=>[c,i]).filter(([c])=>c[0]===tid && c[1]===lv);
  if(!qs.length && !cs.length) return 0;
  const got = qs.filter(([q,i])=>S.quiz[quizId(i)]).length + cs.filter(([c,i])=>(S.cards[cardId(i)]||{}).box>=3).length;
  return Math.round(got / (qs.length + cs.length) * 100);
}
/* Suggest Level 2 once Level 1 of a track is 60% mastered */
function levelFor(tid){ return mastery(tid,1) >= 60 && QUIZ.some(q=>q[0]===tid && q[1]===2) ? 2 : 1; }
function vTracks(){
  const OPEN = 2;
  view.innerHTML = '<h1>Tracks</h1><p class="sub">Each track has four levels, from basics to senior. Levels 1 and 2 are ready. Tip: get Level 1 to 60% before starting Level 2.</p>'+
    '<div class="grid">'+TRACKS.map(t=>{
      const lvRow = n=>{ const m = mastery(t.id, n);
        return '<div style="margin-top:12px"><div class="row" style="justify-content:space-between"><b>L'+n+' '+LEVELS[n-1].name+'</b><span class="small">'+m+'%</span></div>'+
          '<div class="meter"><i style="width:'+m+'%"></i></div>'+
          '<div class="row" style="margin-top:8px"><button class="primary" data-q="'+t.id+'" data-lv="'+n+'">Quiz</button><button data-c="'+t.id+'" data-lv="'+n+'">Flashcards</button>'+
          (genFor(t.id, n).length ? '<button data-e="'+t.id+'" data-lv="'+n+'" title="Endless, freshly generated problems">∞ Drill</button>' : '')+'</div></div>'; };
      return '<div class="card"><h3 style="margin:0">'+t.icon+' '+t.name+'</h3><p class="small">'+t.blurb+'</p>'+
        '<div class="levels">'+LEVELS.map(l=>'<span class="lv '+(l.n<=OPEN?'open':'')+'" title="'+esc(l.desc)+'">L'+l.n+' '+l.name+(l.n>OPEN?' 🔒':'')+'</span>').join('')+'</div>'+
        lvRow(1)+lvRow(2)+
        (genSkills(t.id).length ? '<div class="small" style="margin-top:14px">∞ Drill one skill:</div><div class="chips">'+
          genSkills(t.id).map(([sk,lvs])=>'<button class="chip" data-sk="'+esc(sk)+'" data-trk="'+t.id+'" title="Endless fresh problems: '+esc(sk)+' ('+lvs.map(l=>'L'+l).join(', ')+')">'+esc(sk)+' <span class="small">'+lvs.map(l=>'L'+l).join('/')+'</span></button>').join('')+'</div>' : '')+
        '</div>';
    }).join('')+'</div>'+
    '<h2>What the levels mean</h2><div class="card">'+LEVELS.map(l=>'<p><b>L'+l.n+' '+l.name+':</b> '+l.desc+'</p>').join('')+'</div>';
  view.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>startQuiz(b.dataset.q, 10, null, null, +b.dataset.lv));
  view.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>startCards(b.dataset.c, 12, null, null, +b.dataset.lv));
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
    const fresh = []; for(let j=0;j<k;j++){ const g = makeGen(tid, lv, sk); if(g) fresh.push(g); }
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
    if(idx.journal){ journalResult(idx.journal, ok); if(ok){ s.right++; addXP(10); } }
    else {
      if(!ok) addMistake(q, {kind:'quiz', your, sid, qi: isGen ? null : idx});
      if(isGen){
        const g = S.gen[q[0]] = S.gen[q[0]] || {right:0, total:0};
        g.total++; if(ok){ g.right++; s.right++; addXP(typed ? 15 : 10); } else save();
      }
      else if(ok){ s.right++; S.quiz[quizId(idx)] = true; delete S.miss[quizId(idx)]; addXP(10); }
      else { S.miss[quizId(idx)] = true; save(); }
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
  if(s.mission) completeMission(s.mission);
  const pct = Math.round(s.right/s.items.length*100);
  view.innerHTML = '<h1>'+(s.journalRun?'Mistake retry done':'Quiz complete')+'</h1><div class="card"><p class="q">'+s.right+' / '+s.items.length+' ('+pct+'%)</p><p>'+
    (s.journalRun ? 'Each mistake needs a correct answer on two different days to clear. The ones you got right today come back tomorrow for the second check.'
      : pct===100?'Perfect round. Try the flashcards next to lock it in.':pct>=70?'Solid. Your misses are saved in the mistake journal (Review tab).':'Good practice. Your misses are in the mistake journal (Review tab); retry them tomorrow.')+'</p>'+
    '<div class="row"><button class="primary" id="again">'+(s.journalRun?'Open the journal':'Another round')+'</button><button id="home">Back to Today</button></div></div>';
  $('#again').onclick=()=> s.journalRun ? vJournal() : startQuiz(s.tid, s.items.length, null, null, s.lv, s.endless, s.sk);
  $('#home').onclick=()=>go('today');
}

/* ---------- Flashcards ---------- */
function startCards(tid, n, mission, list, lv){
  let pool = list || CARDS.map((c,i)=>i).filter(i=>CARDS[i][0]===tid && (!lv || CARDS[i][1]===lv));
  pool = shuffle(pool).sort((a,b)=>((S.cards[cardId(a)]||{box:0}).box)-((S.cards[cardId(b)]||{box:0}).box));
  cardStep({items:pool.slice(0,n), i:0, flipped:false, mission, tid, good:0});
}
function cardStep(s){
  if(s.i >= s.items.length){
    if(s.mission) completeMission(s.mission);
    view.innerHTML = '<h1>Cards done</h1><div class="card"><p class="q">'+s.good+' / '+s.items.length+' marked "Got it"</p><p>Cards you missed come back sooner. Cards you know come back later.</p><div class="row"><button class="primary" id="home">Back to Today</button></div></div>';
    $('#home').onclick=()=>go('today'); return;
  }
  const idx = s.items[s.i], c = CARDS[idx], t = track(c[0]);
  view.innerHTML = '<h1>'+t.icon+' '+t.name+' flashcards</h1>'+
    '<div class="progress"><span>Card '+(s.i+1)+' of '+s.items.length+'</span><span>Box '+((S.cards[cardId(idx)]||{box:0}).box)+' of 5</span></div>'+
    '<div class="card flash '+(s.flipped?'back':'')+'" id="fc">'+(s.flipped?c[3]:'<div><div>'+c[2]+'</div><p class="small" style="margin-top:16px">Say the answer out loud, then click or press Space to flip.</p></div>')+'</div>'+
    '<div class="row" style="margin-top:14px">'+(s.flipped?'<button id="again">↺ Again</button><button class="primary" id="good">✓ Got it</button>':'<button class="primary" id="flip">Flip</button>')+'</div>';
  const flip = ()=>{ s.flipped=true; cardStep(s); };
  $('#fc').onclick = s.flipped ? null : flip;
  if(!s.flipped) $('#flip').onclick = flip;
  else {
    const rate = good=>{
      const id = cardId(idx), cur = S.cards[id] || {box:0};
      const box = good ? Math.min(cur.box+1, 5) : 1;
      S.cards[id] = {box, due:addDays(dayStr(), BOX_DAYS[box])};
      if(good){ s.good++; addXP(5); } else save();
      s.i++; s.flipped=false; cardStep(s);
    };
    $('#again').onclick=()=>rate(false); $('#good').onclick=()=>rate(true);
  }
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
  if(sk){ items = []; for(let j=0;j<n;j++){ const g = genTask(TGEN, 0, sk==='*'?null:sk); if(g) items.push(g); } }
  else {
    const pool = TERM.map((t,i)=>i).filter(i=>!lv || (TERM[i][4]||1)===lv), k = Math.floor(n/2);
    const fresh = []; for(let j=0;j<k;j++){ const g = genTask(TGEN, lv||0); if(g) fresh.push(g); }
    items = shuffle(shuffle(pool).slice(0, n - fresh.length).concat(fresh));
  }
  const s = {items, i:0, mission, lv, sk, lines:[], hinted:false, right:0};
  termStep(s);
}
function norm(x){ return x.trim().replace(/\s+/g,' ').replace(/["']/g,''); }
function termStep(s){
  if(s.i >= s.items.length){
    if(s.mission) completeMission(s.mission);
    view.innerHTML = '<h1>🐧 Terminal</h1><div class="card"><p class="q">'+s.right+' / '+s.items.length+' solved</p><p>Want the real thing? Log into OverTheWire Bandit and use these commands on an actual server.</p><div class="row"><button class="primary" id="more">Another set</button><button id="home">Back to Today</button></div></div>';
    $('#more').onclick=()=>startTerm(8,null,s.lv,s.sk); $('#home').onclick=()=>go('today'); return;
  }
  const it = s.items[s.i], isGen = Array.isArray(it), t = isGen ? it : TERM[it];
  view.innerHTML = '<h1>🐧 Terminal</h1><p class="sub">Type the Linux command and press Enter. Task '+(s.i+1)+' of '+s.items.length+'.</p>'+
    '<div class="term" id="term"><div class="task"># TASK: '+esc(t[0])+'</div>'+
    s.lines.map(l=>'<div class="line '+l[1]+'">'+esc(l[0])+'</div>').join('')+
    '<div class="inrow"><span class="ok">alei@skillquest:~$</span><input id="cmd" autocomplete="off" spellcheck="false" aria-label="Command"></div></div>'+
    '<div class="row" style="margin-top:12px"><button id="hint">Hint</button><button id="show">Show answer</button><button id="skip">Skip</button></div>';
  const inp = $('#cmd'); inp.focus();
  /* Mastery: first try with no hint = sure; wrong tries or a hint = guess; shown answer or skip = miss. */
  const sid = isGen && t.sk ? skillIdFor('term', 'linux', t.sk) : null;
  const next = ()=>{ s.i++; s.lines=[]; s.hinted=false; s.wrong=false; s.shown=false; termStep(s); };
  inp.onkeydown = e=>{
    if(e.key!=='Enter') return;
    const v = inp.value; if(!v.trim()) return;
    s.lines.push(['$ '+v, '']);
    if(t[1].some(re=>re.test(norm(v)))){
      s.right++; const pts = s.hinted?8:15;
      if(isGen){ const g = S.gen.terminal = S.gen.terminal || {right:0,total:0}; g.right++; g.total++; } else S.term[t[2]] = true;
      if(sid) recordSkill(sid, !s.shown, !s.hinted && !s.wrong);
      addXP(pts);
      s.lines.push(['✔ Correct (+'+pts+' XP). Model answer: '+t[2], 'ok']);
      termStep(s); setTimeout(next, 1100);
    } else {
      s.wrong = true; s.last = v;
      s.lines.push(['✘ Not that one. Try again, or use Hint.', 'no']); termStep(s);
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
function sqlNorm(x){
  return x.trim().replace(/;+\s*$/,'').toLowerCase().replace(/"/g,"'").replace(/\s+/g,' ').replace(/\s*([,=()<>*])\s*/g,'$1').trim();
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
  if(sk){ items = []; for(let j=0;j<n;j++){ const g = genTask(SGEN, 0, sk==='*'?null:sk); if(g) items.push(g); } }
  else {
    const pool = SQLT.map((q,i)=>i).filter(i=>!lv || SQLT[i][0]===lv), k = Math.floor(n/2);
    const fresh = []; for(let j=0;j<k;j++){ const g = genTask(SGEN, lv||0); if(g) fresh.push(g); }
    items = shuffle(shuffle(pool).slice(0, n - fresh.length).concat(fresh));
  }
  sqlStep({items, i:0, mission, lv, sk, right:0, hinted:false});
}
function sqlStep(s){
  if(s.i >= s.items.length){
    if(s.mission) completeMission(s.mission);
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
      s.right++; const pts = s.hinted?8:15;
      if(isGen){ const g = S.gen.sqlconsole = S.gen.sqlconsole || {right:0,total:0}; g.right++; g.total++; } else S.sql[t[3]] = true;
      if(sid) recordSkill(sid, !s.shown, !s.hinted && !s.wrong);
      addXP(pts);
      const r = t[5]();
      out.innerHTML = '<div class="explain">✅ <b>Correct (+'+pts+' XP).</b> Model answer: <code>'+esc(t[3])+'</code></div>'+
        (r.msg ? '<p>'+esc(r.msg)+'</p>' : '<p class="small">Result: '+r.rows.length+' row'+(r.rows.length===1?'':'s')+'</p>'+tableHTML(r.cols, r.rows))+
        '<div class="row" style="margin-top:10px"><button class="primary" id="nx">Next challenge</button></div>';
      $('#run').disabled = true; $('#nx').onclick = next; $('#nx').focus();
    } else if(/^(update|delete)\b/.test(q) && !/ where /.test(q)){
      s.wrong = true;
      out.innerHTML = '<div class="explain">⚠️ <b>Careful!</b> An UPDATE or DELETE without WHERE changes <b>every row</b> in the table. Add a WHERE clause.</div>';
    } else {
      s.wrong = true;
      out.innerHTML = '<div class="explain">❌ Not quite. Check the table and column names, the quotes around text, and the order of clauses (SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY, LIMIT).</div>';
    }
  };
  $('#run').onclick = run;
  ta.onkeydown = e=>{ if(e.key==='Enter' && (e.ctrlKey||e.metaKey)){ e.preventDefault(); run(); } };
  $('#hint').onclick=()=>{ s.hinted=true; out.innerHTML='<div class="explain">💡 '+esc(t[4])+'</div>'; };
  $('#show').onclick=()=>{ s.hinted=true; s.shown=true; addNote('sql', t[1], t[3], ta.value.trim(), sid); out.innerHTML='<div class="explain">Answer: <code>'+esc(t[3])+'</code><br><span class="small">Type it in yourself to lock it in (fewer XP).</span></div>'; };
  $('#skip').onclick = ()=>{ if(sid) recordSkill(sid, false); addNote('sql', t[1], t[3], ta.value.trim(), sid); next(); };
}

/* ---------- Job readiness ---------- */
function ivPct(cat){ const qs = IV.map((q,i)=>i).filter(i=>IV[i].c===cat); return Math.round(qs.filter(i=>(S.iv['i'+i]||0)>=2).length / qs.length * 100); }
function termPct(){ return Math.round(TERM.filter(t=>S.term[t[2]]).length / TERM.length * 100); }
function tkPct(id){ return (S.tickets||{})[id] || 0; }
const scenIdx = id=>SCEN.findIndex(s=>s.id===id);
const R = {
  track:(tid,lv)=>[track(tid).icon+' '+track(tid).name+' L'+lv, ()=>mastery(tid,lv), ()=>startQuiz(tid,10,null,null,lv)],
  ticket:id=>['🎫 Ticket: '+SCEN[scenIdx(id)].title, ()=>tkPct(id), ()=>playTicket(scenIdx(id),null)],
  sql:lv=>['🗄️ SQL console L'+lv, ()=>sqlPct(lv), ()=>startSQL(8,null,lv)],
  term:()=>['🐧 Terminal commands', termPct, ()=>startTerm(8,null)],
  iv:(cat,label)=>['🎤 Interview: '+label, ()=>ivPct(cat), ()=>go('interview')]
};
const JOBS = [
  {name:'Restaurant group · IT Support Specialist', status:'Example role', items:[
    R.track('support',1), R.track('support',2), R.track('net',1), R.track('sec',1), R.ticket('pos'), R.ticket('lockout'), R.iv('technical','technical basics')]},
  {name:'Healthcare billing · Software Tester', status:'Example role', items:[
    R.track('qa',1), R.track('qa',2), R.track('sql',1), R.sql(1), R.sql(2), R.ticket('regression'), R.iv('resume','about your resume')]},
  {name:'Energy company · Jr Linux IT Specialist', status:'Example role', items:[
    R.track('linux',1), R.track('linux',2), R.term(), R.track('net',1), R.track('code',1), R.ticket('disk'), R.iv('jobready','job-ready scenarios')]},
  {name:'NOC employer · NOC Admin', status:'Example role', items:[
    R.track('net',1), R.track('net',2), R.track('support',1), R.track('support',2), R.ticket('noc'), R.iv('behavioral','behavioral (STAR)'), R.iv('jobready','job-ready scenarios')]},
  {name:'Future goal · Junior Security / SOC Analyst', status:'Needs Security+ first', items:[
    R.track('sec',1), R.track('sec',2), R.track('net',1), R.track('net',2), R.track('linux',1)]}
];
function jobScore(j){ return Math.round(j.items.reduce((a,it)=>a+it[1](),0) / j.items.length); }
function readyLabel(p){ return p>=90?'Strong':p>=70?'Interview-ready':p>=40?'Getting there':'Building'; }
function vReady(){
  view.innerHTML = '<h1>🎯 Job readiness</h1><p class="sub">How much of the practice for each job you have mastered here. It measures your practice, not a hiring decision, but 70% or more means you can talk about these topics with confidence.</p>'+
    JOBS.map((j,ji)=>{
      const p = jobScore(j);
      const weakest = j.items.map((it,k)=>[it[1](),k]).sort((a,b)=>a[0]-b[0])[0];
      return '<div class="card" style="margin-bottom:14px"><div class="row" style="justify-content:space-between"><h3 style="margin:0">'+esc(j.name)+'</h3><span class="pill">'+esc(j.status)+'</span></div>'+
        '<div class="row" style="margin-top:8px;gap:14px"><span class="q" style="margin:0">'+p+'%</span><span class="small">'+readyLabel(p)+'</span></div>'+
        '<div class="meter"><i style="width:'+p+'%"></i></div>'+
        j.items.map((it,k)=>{ const v = it[1](); return '<div class="ritem"><span>'+it[0]+'</span><div class="meter"><i style="width:'+v+'%"></i></div><span class="small" style="width:40px;text-align:right">'+v+'%</span><button data-j="'+ji+'" data-k="'+k+'">Practice</button></div>'; }).join('')+
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
  view.innerHTML = '<h1>Review</h1><p class="sub">This is where learning sticks. Come here whenever something is due.</p><div class="grid">'+
    '<div class="card mission"><h3>🃏 Due flashcards</h3><p>'+due.length+' card'+(due.length===1?'':'s')+' due today.</p><div><button class="primary" id="rc" '+(due.length?'':'disabled')+'>Review cards</button></div></div>'+
    '<div class="card mission"><h3>📓 Mistake journal</h3><p>'+open+' open mistake'+(open===1?'':'s')+', '+jdue+' due for a retry today.</p><div class="row"><button class="primary" id="rq" '+(jdue?'':'disabled')+'>Retry due</button><button id="rj">Open journal</button></div></div>'+
    '<div class="card mission"><h3>🎤 Weak interview answers</h3><p>'+weak.length+' marked "Need work."</p><div><button class="primary" id="ri" '+(weak.length?'':'disabled')+'>Practice one</button></div></div></div>';
  if(due.length) $('#rc').onclick=()=>startCards(null, 20, null, due);
  if(jdue) $('#rq').onclick = retryMistakes;
  $('#rj').onclick = vJournal;
  if(weak.length) $('#ri').onclick=()=>startIV(weak[0], null);
}

/* ---------- Progress ---------- */
function vProgress(){
  const {r} = rankOf(S.xp);
  const learned = Object.values(S.cards).filter(c=>c.box>=3).length;
  const days = Object.keys(S.days).filter(d=>['quiz','skill','iv'].every(k=>S.days[d][k])).length;
  view.innerHTML = '<h1>Progress</h1><div class="grid">'+
    '<div class="card"><h3 style="margin-top:0">Your numbers</h3><p>⭐ '+S.xp+' XP<br>🔥 Best streak: '+(S.best||0)+' days<br>📅 Full mission days: '+days+'<br>🃏 Cards learned (box 3+): '+learned+' of '+CARDS.length+'<br>✅ Quiz questions answered right: '+Object.keys(S.quiz).length+' of '+QUIZ.length+'<br>🐧 Terminal commands solved: '+Object.keys(S.term).length+' of '+TERM.length+'<br>🎤 Interview questions practiced: '+Object.keys(S.iv).length+' of '+IV.length+'<br>🎫 Ticket scenarios played: '+Object.keys(S.tickets||{}).length+' of '+SCEN.length+'<br>🗄️ SQL challenges solved: '+Object.keys(S.sql||{}).length+' of '+SQLT.length+
    '<br>∞ Generated problems: '+Object.values(S.gen||{}).reduce((a,g)=>a+g.right,0)+' right of '+Object.values(S.gen||{}).reduce((a,g)=>a+g.total,0)+'</p></div>'+
    '<div class="card ladder"><h3 style="margin-top:0">Rank ladder</h3>'+RANKS.map(x=>'<div class="'+(x[1]===r[1]?'me':'')+'"><span>'+x[1]+'</span><span>'+x[0]+' XP</span></div>').join('')+'</div></div>'+
    '<h2>Track mastery</h2><div class="card">'+TRACKS.map(t=>{const m1=mastery(t.id,1), m2=mastery(t.id,2); return '<div style="margin:10px 0">'+t.icon+' '+t.name+' <span class="small">L1 '+m1+'% · L2 '+m2+'%</span><div class="meter"><i style="width:'+m1+'%"></i></div><div class="meter"><i style="width:'+m2+'%;background:var(--accent)"></i></div></div>';}).join('')+'</div>'+
    '<h2>Backup</h2><div class="card"><p class="small">Progress is saved in this browser only. Clearing browser data or switching browsers loses it, so download a backup once a week. Last backup: <b>'+(S.lastBackup || 'never')+'</b>.</p>'+
    '<div class="row"><button class="primary" id="exp"'+(PHONE?' hidden':'')+'>Download backup file</button><button id="mrgb" title="Combine a backup file with the progress here. Nothing is lost.">Merge a backup file in</button><button id="impb" title="Throw away the progress here and use the backup instead">Replace with a backup file</button><input type="file" id="imp" accept=".json,application/json,text/plain" hidden><button id="reset">Reset everything</button></div>'+
    '<h3>Move progress between your PC and phone</h3>'+
    '<p class="small">Your PC and your phone each keep their own progress. To combine them: on one device tap <b>Copy backup</b>, send the text to yourself (email, OneDrive or a note), then on the other device paste it below and tap <b>Merge</b>. Merging keeps the best of both (higher scores, all missions, mistakes and exams) and never erases anything.</p>'+
    '<div class="row"><button class="primary" id="cpb">Copy backup</button></div>'+
    '<textarea id="bkText" hidden readonly style="min-height:70px;margin-top:8px" aria-label="Backup text"></textarea>'+
    '<textarea id="pasteBk" style="min-height:70px;margin-top:8px" placeholder="Paste backup text from your other device here" aria-label="Paste backup text"></textarea>'+
    '<div class="row" style="margin-top:8px"><button id="pasteMerge">Merge pasted backup</button></div></div>';
  $('#exp').onclick=()=>{ downloadBackup(); vProgress(); };
  $('#cpb').onclick = copyBackupText;
  $('#pasteMerge').onclick = ()=>{
    try{ const b = JSON.parse($('#pasteBk').value.trim()); if(typeof b !== 'object' || b === null || !('xp' in b)) throw new Error('not a backup');
      S = mergeProgress(S, b); save(); header(); vProgress(); toast('Backup merged in. Nothing was lost.'); }
    catch(e){ toast('That text isn\'t a complete SkillQuest backup. Copy it again on the other device and paste all of it.'); }
  };
  let importMode = 'merge';
  $('#mrgb').onclick = ()=>{ importMode = 'merge'; $('#imp').click(); };
  $('#impb').onclick = ()=>askConfirm('Replace ALL progress on this device with a backup file? Use "Merge" to keep both.', 'Choose file to replace with', ()=>{ importMode = 'replace'; $('#imp').click(); });
  $('#imp').onchange = e=>{ const f = e.target.files[0]; if(!f) return; const rd = new FileReader();
    rd.onload = ()=>{ try{
        const b = JSON.parse(rd.result); if(typeof b !== 'object' || b === null || !('xp' in b)) throw new Error('not a backup');
        S = importMode === 'merge' ? mergeProgress(S, b) : Object.assign(structuredClone(DEFAULT), b);
        save(); header(); vProgress(); toast(importMode === 'merge' ? 'Backup merged in' : 'Backup restored');
      }catch(err){ toast('That file is not a SkillQuest backup'); } e.target.value = ''; };
    rd.readAsText(f); };
  $('#reset').onclick=()=>askConfirm('Erase ALL SkillQuest progress on this device? This cannot be undone.', 'Erase everything', ()=>{ S=structuredClone(DEFAULT); save(); header(); vProgress(); });
}

/* ---------- Guide ---------- */
function vGuide(){
  view.innerHTML = '<h1>How to use SkillQuest</h1><div class="card"><ol>'+
    '<li><b>Every day (20 to 30 minutes):</b> open the Today tab and finish all 3 missions. That keeps your 🔥 streak. Mission 1 always targets your weakest skill: read its 2-minute lesson the first time, then practice.</li>'+
    '<li><b>Type your answers.</b> Short-answer questions ask you to type from memory. That is harder than picking, and that is why it works. After a correct answer, say honestly whether you were sure or guessed: guesses barely count toward mastery.</li>'+
    '<li><b>Mistake journal (Review tab):</b> every miss is saved with the right answer. Tag why you missed it, and retry what is due each day. A mistake clears only after you get it right on two different days.</li>'+
    '<li><b>Labs tab:</b> real break-and-fix problems in your WSL Ubuntu. Do one or two a week; they are your best interview stories.</li>'+
    '<li><b>Exams tab:</b> timed Security+ and Network+ practice by official domain. Use it weekly to see which domain is weakest; aim for 85%+ on several attempts.</li>'+
    '<li><b>Watch the Skills tab.</b> Every skill has a mastery score that fades if you don\'t practice, so skills come back for review before you forget them. Aim to get every skill to "Strong" (85%+).</li>'+
    '<li><b>Then one real lab</b> from the list on the Today tab (TryHackMe, Bandit, SQLBolt or Microsoft Learn).</li>'+
    '<li><b>Check the Review tab</b> whenever cards are due. Spaced review is what moves things into long-term memory.</li>'+
    '<li><b>Before any interview:</b> do every question in the Interview tab for that job type, out loud, with the timer.</li>'+
    '<li><b>Fridays:</b> go to Progress and download a backup.</li></ol>'+
    '<p><b>Scoring:</b> quiz +10, flashcard +5, terminal +15 (+8 with a hint), interview rep +10 to +25, all 3 missions +50.</p>'+
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
  if(h.textContent !== lastTitle){ lastTitle = h.textContent; decrypt(h); }
}).observe(view, {childList:true});
document.addEventListener('keydown', e=>{ if(e.code==='Space' && $('#fc') && $('#flip')){ e.preventDefault(); $('#flip').click(); } });
header(); vToday();
