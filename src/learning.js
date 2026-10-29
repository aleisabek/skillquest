/* ===================== LEARNING ENGINE =====================
   Skills, mastery scores, recommendations, typed answers and mini-lessons.
   Loaded after generators.js and before app.js. Nothing here runs at load time. */

/* Every skill you can practice: quiz skills per track, plus Terminal and SQL console skills.
   id = 'kind:track:skill name' (used as the key for mastery and lessons). */
/* Display-only area overrides: these trading-research skills live in the Software Testing generators (so their ids,
   and the progress saved under them, stay 'quiz:qa:...') but belong with research and data work. */
const AREA_OF = {'quiz:qa:Pre-registration':'Research & data', 'quiz:qa:Walk-forward testing':'Research & data', 'quiz:qa:Holdout data':'Research & data'};
function allSkills(){
  if(allSkills.cache) return allSkills.cache;
  const lvsOf = (list, sk)=>[...new Set(list.filter(g=>g.sk===sk).map(g=>g.lv))].sort();
  const list = [];
  TRACKS.forEach(t=>genSkills(t.id).forEach(([sk,lvs])=>list.push({id:'quiz:'+t.id+':'+sk, kind:'quiz', tid:t.id, sk, lvs, icon:t.icon, area:AREA_OF['quiz:'+t.id+':'+sk] || t.name})));
  skillsOf(TGEN).forEach(sk=>list.push({id:'term:linux:'+sk, kind:'term', tid:'linux', sk, lvs:lvsOf(TGEN, sk), icon:'⌨️', area:'Terminal (type commands)'}));
  skillsOf(SGEN).forEach(sk=>list.push({id:'sql:sql:'+sk, kind:'sql', tid:'sql', sk, lvs:lvsOf(SGEN, sk), icon:'🗄️', area:'SQL console (write queries)'}));
  return allSkills.cache = list;
}
function skillById(id){ return allSkills().find(s=>s.id===id); }
function skillIdFor(kind, tid, sk){ return kind+':'+tid+':'+sk; }

/* ---- Mastery: a 0-100 score per skill that rises with sure, correct answers and fades with time ---- */
function daysSince(d){ return d ? Math.max(0, Math.round((new Date(dayStr()+'T12:00:00') - new Date(d+'T12:00:00'))/86400000)) : 0; }
/* Forgetting: the score halves after (4 + 2 × practice sessions, up to 10) days without practice */
function skillScore(id){
  const m = (S.mastery||{})[id]; if(!m) return 0;
  const half = 4 + 2*Math.min(m.n, 10);
  return Math.round(m.s * Math.pow(0.5, daysSince(m.last)/half));
}
/* correct + sure = big gain, correct but guessed = small gain, wrong = drop */
function recordSkill(id, correct, sure){
  if(!id) return;
  S.mastery = S.mastery || {};
  const cur = skillScore(id);
  const m = S.mastery[id] = S.mastery[id] || {s:0, n:0, right:0, last:null};
  m.s = correct ? cur + (100-cur)*(sure ? 0.3 : 0.12) : cur*0.65;
  m.n++; if(correct) m.right++; m.last = dayStr();
  /* misses per skill per day: 2+ in a day brings its lesson back in the daily plan (see lessonNeeded) */
  if(!correct){ S.slip = S.slip || {}; const sl = S.slip[id]; S.slip[id] = sl && sl.day === dayStr() ? {day:sl.day, n:sl.n+1} : {day:dayStr(), n:1}; }
  save();
}
function skillStatus(id){
  const m = (S.mastery||{})[id], v = skillScore(id);
  if(!m) return ['New', ''];
  if(v >= 85) return ['Strong', 'good'];
  if(v < 60 && (m.n >= 3 || m.s >= 60)) return ['Needs review', 'bad'];  /* weak after real practice, or faded over time */
  return ['Learning', 'mid'];
}
/* What to practice next: weak skills you've tried first, then new Level 1 skills, then fading ones. */
function recommend(k){
  return allSkills().map(s=>{
    const m = (S.mastery||{})[s.id], v = skillScore(s.id);
    const pri = m ? (v < 85 ? v : 999) : (s.lvs.includes(1) ? 55 : 75);
    return [pri, s];
  }).filter(x=>x[0] < 999).sort((a,b)=>a[0]-b[0]).slice(0, k).map(x=>x[1]);
}
function startSkill(s, n, mission){
  if(s.kind==='quiz') return startQuiz(s.tid, n, mission, null, 0, true, s.sk);
  if(s.kind==='term') return startTerm(n, mission, 0, s.sk);
  return startSQL(n, mission, 0, s.sk);
}

/* ---- Typed answers (recall beats recognition) ---- */
function plainText(h){ const d = document.createElement('div'); d.innerHTML = h; return d.textContent.trim(); }
function normAns(x){ return String(x).toLowerCase().trim().replace(/\s+/g,' ').replace(/\s*,\s*/g,', ').replace(/[.\/]+$/,''); }
/* Only short, single-answer questions are typed; long or multi-answer ones keep multiple choice. */
function typeable(g){
  if(!g || g.noType) return false;
  const a = plainText(g.d[3][g.d[4]]);
  return a.length <= 24 && (/^\S+$/.test(a) || /^-?\d+(, -?\d+)+$/.test(a));
}
function typedOn(){ return S.typed !== false; }

/* ---- Mini-lessons ---- */
function lessonFor(id){ return (typeof LESSONS !== 'undefined' && LESSONS[id]) || null; }
function vLesson(id, mission){
  const s = skillById(id), L = lessonFor(id);
  if(!s || !L){ toast('No lesson for this skill yet'); return; }
  current = 'skills'; header();
  /* a lesson counts as read when you finish it (Practice or Back), not when it opens. From today's plan (mission
     'p0'..'p2') that can complete the Learn step, and its practice is that slot's exercises. */
  const fromPlan = /^p[0-2]$/.test(mission||'');
  const markRead = ()=>{ S.lessons = S.lessons || {}; S.lessons[id] = dayStr(); S.days[dayStr()] = S.days[dayStr()] || {}; afterStep(); save(); };
  const v = skillScore(id), [st, cls] = skillStatus(id);
  view.innerHTML = '<h1>'+s.icon+' '+esc(s.sk)+'</h1><p class="sub">'+esc(s.area)+' · '+s.lvs.map(l=>'L'+l).join('/')+' · mastery '+v+'% ('+st+') · about 2 minutes</p>'+
    '<div class="card"><h2>Why it matters at work</h2><p>'+L.why+'</p>'+
    '<h2>The core idea</h2>'+L.idea+
    (L.seen ? '<h2>You\'ll see this as</h2><div class="model">'+L.seen+'</div>' : '')+
    '<h2>Worked example</h2><div class="model">'+L.example+'</div>'+
    '<h2>Common mistakes</h2><ul class="clean">'+L.mistakes.map(x=>'<li>'+x+'</li>').join('')+'</ul>'+
    (L.spot ? '<h2>Spot the problem</h2><p>'+L.spot.q+'</p><details><summary>Show the answer</summary><p>'+L.spot.a+'</p></details>' : '')+
    '<h2>Say it in an interview</h2><div class="explain">"'+L.say+'"</div>'+
    '<div class="row" style="margin-top:16px"><button class="primary" id="prac">Practice it now: '+(fromPlan ? PRACTICE_N+' exercises (today’s plan)' : '6 fresh problems')+'</button><button id="back">'+(fromPlan ? 'Back to Today' : 'Skills map')+'</button></div></div>';
  $('#prac').onclick = ()=>{ markRead(); startSkill(s, fromPlan ? PRACTICE_N : 6, mission || null); };
  $('#back').onclick = ()=>{ markRead(); go(fromPlan ? 'today' : 'skills'); };
}

/* ---- Skills map view ---- */
function skillRow(s){
  const v = skillScore(s.id), [st, cls] = skillStatus(s.id), m = (S.mastery||{})[s.id];
  const tag = '<span class="lv '+(cls==='good'?'open':'')+'" style="'+(cls==='bad'?'border-color:var(--bad);color:var(--bad)':cls==='mid'?'border-color:var(--warn);color:var(--warn)':'')+'">'+st+'</span>';
  return '<div class="ritem"><span>'+esc(s.sk)+' <span class="small">'+s.lvs.map(l=>'L'+l).join('/')+'</span></span>'+
    '<div class="meter"><i style="width:'+v+'%"></i></div><span class="small" style="width:42px;text-align:right">'+v+'%</span>'+tag+
    (lessonFor(s.id) ? '<button data-learn="'+esc(s.id)+'">📖 Learn</button>' : '')+
    '<button data-drill="'+esc(s.id)+'">Drill</button>'+
    (m ? '<span class="small" title="Practiced '+m.n+' times, '+m.right+' right">'+m.right+'/'+m.n+'</span>' : '')+'</div>';
}
/* The Skills map follows the career path: foundations (Level 1), then job-ready (Level 2), then everything off the path.
   A skill spanning both levels counts as a foundation. */
const onPath = s=>!!PATH.weights[s.tid] && !AREA_OF[s.id];
const STAGES = [
  ['Path · Foundations (Level 1)', 'Where the daily plan starts. Get these to 70% and each track opens its Level 2 skills.', s=>onPath(s) && Math.min(...s.lvs) === 1],
  ['Path · Job-ready (Level 2)', 'Opens per track once its foundations average 70%. Cloud Security and Offensive Security come after this stage.', s=>onPath(s) && Math.min(...s.lvs) === 2],
  ['Off the path', 'Still here for practice and your current applications; the daily plan does not assign them.', s=>!onPath(s)]
];
function vSkills(){
  const rec = recommend(3), skills = allSkills();
  const strong = skills.filter(s=>skillScore(s.id)>=85).length, started = skills.filter(s=>(S.mastery||{})[s.id]).length;
  view.innerHTML = '<h1>🧠 Skills map</h1><p class="sub">Every skill has a mastery score. Sure, correct answers raise it; misses and time lower it, so old skills come back for review before you forget them.</p>'+
    '<div class="row" style="margin-bottom:6px"><span class="pill">'+skills.length+' skills</span><span class="pill">'+started+' started</span><span class="pill">'+strong+' strong (85%+)</span>'+
    '<button id="typedT">⌨ Typed answers: '+(typedOn()?'ON':'OFF')+'</button></div>'+
    '<h2>Recommended now</h2><div class="grid">'+rec.map(s=>{ const [st] = skillStatus(s.id);
      return '<div class="card mission"><div class="tag">'+esc(s.area)+'</div><h3>'+s.icon+' '+esc(s.sk)+'</h3><p>'+st+' · mastery '+skillScore(s.id)+'%</p><div class="row">'+
        (lessonFor(s.id) ? '<button class="primary" data-learn="'+esc(s.id)+'">📖 Learn + practice</button>' : '')+'<button data-drill="'+esc(s.id)+'">Drill</button></div></div>'; }).join('')+'</div>'+
    STAGES.map(([name, note, test])=>{ const inStage = skills.filter(test); if(!inStage.length) return '';
      return '<h2>'+esc(name)+'</h2><p class="small">'+note+'</p>'+[...new Set(inStage.map(s=>s.area))].map(a=>
        '<h3 class="area">'+esc(a)+'</h3><div class="card">'+inStage.filter(s=>s.area===a).map(skillRow).join('')+'</div>').join(''); }).join('');
  view.querySelectorAll('[data-learn]').forEach(b=>b.onclick=()=>vLesson(b.dataset.learn));
  view.querySelectorAll('[data-drill]').forEach(b=>b.onclick=()=>startSkill(skillById(b.dataset.drill), 8, null));
  $('#typedT').onclick = ()=>{ S.typed = !typedOn(); save(); vSkills(); toast('Typed answers '+(typedOn()?'on':'off')); };
}
