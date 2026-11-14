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
  /* rd: how many different days this skill was answered right (Strong needs QUIZ_DAYS of them) */
  if(correct && m.lr !== dayStr()){ m.rd = (m.rd || 0) + 1; m.lr = dayStr(); }
  /* misses per skill per day: 2+ in a day brings its lesson back in the daily plan (see lessonNeeded) */
  if(!correct){ S.slip = S.slip || {}; const sl = S.slip[id]; S.slip[id] = sl && sl.day === dayStr() ? {day:sl.day, n:sl.n+1} : {day:dayStr(), n:1}; }
  save();
}
/* Strong = a high score that has held up on more than one day, not one good session */
function isStrong(id){ const m = (S.mastery||{})[id]; return !!m && skillScore(id) >= 85 && (m.rd || 0) >= QUIZ_DAYS; }
function skillStatus(id){
  const m = (S.mastery||{})[id], v = skillScore(id);
  if(!m) return ['New', ''];
  if(isStrong(id)) return ['Strong', 'good'];
  if(v >= 85) return ['Strong once', 'mid'];   /* high score, but only one day so far: confirm it on another day */
  if(v < 60 && (m.n >= 3 || m.s >= 60)) return ['Needs review', 'bad'];  /* weak after real practice, or faded over time */
  return ['Learning', 'mid'];
}
/* What to practice next: weak skills you've tried first, then new Level 1 skills, then fading ones. */
function recommend(k){
  return allSkills().filter(s=>typeof trackOpen !== 'function' || trackOpen(s.tid)).map(s=>{
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
/* A number typed the way people write it, reduced to its digits: "40", "40%", "40 percent" -> "40"; "$12,500", "12,500",
   "12500" -> "12500". Only the %, the $ and thousands commas are ignored: decimals must match exactly, because in a code
   question 5 and 5.0 are different answers. Commas count only as thousands separators (1,000 / 12,500), never as a
   list ("3, 5" stays a list). Returns null if it isn't a number. */
function numAns(x){
  const m = /^\$?\s*(-?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?)\s*(%|percent)?$/i.exec(String(x).trim());
  return m ? m[1].replace(/,/g, '') : null;
}
/* typed answer vs the right one: the same words, or the same number with or without % / $ / thousands commas */
function typedOk(typed, answer){
  if(normAns(typed) === normAns(answer)) return true;
  const a = numAns(answer);
  return a !== null && a === numAns(typed);
}
/* Only short, single-answer questions are typed; long or multi-answer ones keep multiple choice. */
function typeable(g){
  if(!g || g.noType) return false;
  const a = plainText(g.d[3][g.d[4]]);
  return a.length <= 24 && (/^\S+$/.test(a) || /^-?\d+(, -?\d+)+$/.test(a));
}
function typedOn(){ return S.typed !== false; }

/* ---- Mini-lessons ---- */
function lessonFor(id){ return (typeof LESSONS !== 'undefined' && LESSONS[id]) || null; }
/* opts.preview: a locked track's sample lesson. Read-only: no practice button, and nothing is recorded. */
/* Lesson stepper (glass looks): a row of section buttons above the lesson. Each one scrolls to its heading and moves
   focus there; the section you are reading is marked while you scroll. (Glass looks; every look is glass since the hacker looks were retired.) */
let lessonObs = null;
function lessonSteps(){
  if(lessonObs){ lessonObs.disconnect(); lessonObs = null; }
  const card = view.querySelector('.card.reading'); if(!card) return;
  const hs = [...card.querySelectorAll(':scope > h2')]; if(hs.length < 3) return;
  const nav = document.createElement('nav'); nav.className = 'lsteps'; nav.setAttribute('aria-label', 'Lesson sections');
  nav.innerHTML = hs.map((h, i)=>'<button type="button" data-step="'+i+'">'+esc(h.textContent)+'</button>').join('');
  card.before(nav);
  nav.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>{ const h = hs[+b.dataset.step]; h.tabIndex = -1;
    h.scrollIntoView({behavior: motionOK() ? 'smooth' : 'auto', block:'start'}); h.focus({preventScroll:true}); });
  if(!('IntersectionObserver' in window)) return;
  lessonObs = new IntersectionObserver(es=>{ es.forEach(e=>{ if(!e.isIntersecting) return; const i = hs.indexOf(e.target);
    nav.querySelectorAll('[data-step]').forEach((b, k)=>b.toggleAttribute('aria-current', k === i)); }); }, {rootMargin:'-30% 0px -60% 0px'});
  hs.forEach(h=>lessonObs.observe(h));
}
function vLesson(id, mission, opts){
  const preview = !!(opts && opts.preview);
  const s = skillById(id), L = lessonFor(id);
  if(!s || !L){ toast('No lesson for this skill yet'); return; }
  current = 'skills'; header(); queueMicrotask(enterView);   /* after the lesson is drawn */
  /* a lesson counts as read when you finish it (Practice or Back), not when it opens. From today's plan (mission
     'p0'..'p2') that can complete the Learn step, and its practice is that slot's exercises. */
  const fromPlan = /^p[0-2]$/.test(mission||'');
  const markRead = ()=>{ S.lessons = S.lessons || {}; S.lessons[id] = dayStr(); S.days[dayStr()] = S.days[dayStr()] || {}; afterStep(); save(); };
  const v = skillScore(id), [st, cls] = skillStatus(id);
  view.innerHTML = '<h1>'+s.icon+' '+esc(s.sk)+'</h1><p class="sub">'+esc(s.area)+' · '+s.lvs.map(l=>'L'+l).join('/')+' · practice score '+v+'% ('+st+') · about 2 minutes</p>'+
    '<div class="card reading"><h2>Why it matters at work</h2><p>'+L.why+'</p>'+
    '<h2>The core idea</h2>'+L.idea+
    (SCENES[id] ? '<h2>Watch it</h2><div id="scene" role="group" aria-label="Animated explainer: '+esc(SCENES[id].title)+'"></div>' : '')+
    (L.seen ? '<h2>You\'ll see this as</h2><div class="model">'+L.seen+'</div>' : '')+
    '<h2>Worked example</h2><div class="model">'+L.example+'</div>'+
    (L.prevent ? '<h2>How to prevent it</h2>'+L.prevent : '')+
    (L.detect ? '<h2>How to detect it</h2>'+L.detect : '')+
    '<h2>Common mistakes</h2><ul class="clean">'+L.mistakes.map(x=>'<li>'+x+'</li>').join('')+'</ul>'+
    (L.spot ? '<h2>Spot the problem</h2><p>'+L.spot.q+'</p><details><summary>Show the answer</summary><p>'+L.spot.a+'</p></details>' : '')+
    '<h2>Say it in an interview</h2><div class="explain">"'+L.say+'"</div>'+
    (!PHONE && !preview && labForLesson(id) ? '<h2>Try it for real (optional, on your PC)</h2><p>In Ubuntu (WSL): <code>sq-lab start '+esc(labForLesson(id).id)+'</code>. '+esc(labForLesson(id).summary)+' <a href="#" id="toLabs">Open Labs</a></p>' : '')+
    (preview ? '<p class="small" style="margin-top:16px">🔒 Preview: reading this records nothing. '+esc(track(s.tid).name)+' opens when '+unlockText(s.tid)+'.</p><div class="row"><button id="back">Back</button></div></div>'
      : '<div class="row" style="margin-top:16px"><button class="primary" id="prac">Practice it now: '+(fromPlan ? PRACTICE_N+' exercises (today’s plan)' : '6 fresh problems')+'</button><button id="back">'+(fromPlan ? 'Back to Today' : 'Skills map')+'</button></div></div>');
  if(SCENES[id]) mountScene($('#scene'), SCENES[id]); else destroyScene();
  lessonSteps();
  if(preview){ $('#back').onclick = ()=>go(opts.back || 'skills'); return; }
  if($('#toLabs')) $('#toLabs').onclick = e=>{ e.preventDefault(); markRead(); go('labs'); };
  $('#prac').onclick = ()=>{ markRead(); startSkill(s, fromPlan ? PRACTICE_N : 6, mission || null); };
  $('#back').onclick = ()=>{ markRead(); go(fromPlan ? 'today' : 'skills'); };
}

/* ---- Skill galaxy: every skill as a star, every track as a constellation ----
   A star's size and brightness follow its practice score (skillScore), its colour its status (strong, learning,
   needs review); a never-practised skill is a faint point. Tracks that are still locked are drawn dashed and
   can't be clicked. Positions come from a hash of the ids, so the sky is the same every visit. Mouse users can
   click a star to drill it; the list further down has the same Drill buttons for keyboard and screen readers, so
   the drawing itself is hidden from them. Static SVG: no animation, so it costs nothing while you read. */
function galaxySVG(skills){
  const tids = TRACKS.map(t=>t.id).filter(t=>skills.some(s=>s.tid===t));
  const W = 1000, H = 520, cols = Math.ceil(tids.length / 2), cw = W / cols, ch = H / 2;
  const col = {good:'var(--accent)', mid:'var(--warn)', bad:'var(--bad)', '':'var(--muted)'};
  let out = '';
  tids.forEach((tid, ti)=>{
    const h = hashStr(tid), open = !isGated(tid) || trackOpen(tid);
    const cx = cw * (ti % cols + .5) + ((h % 41) - 20), cy = ch * (Math.floor(ti / cols) + .5) - 14 + ((h >> 6) % 31 - 15);
    const list = skills.filter(s=>s.tid===tid), n = list.length, spin = (h % 360) * Math.PI / 180;
    const pts = list.map((sk, i)=>{ const r = 14 + Math.min(cw, ch) * .36 * Math.sqrt((i + .6) / n), a = spin + i * 2.39996;
      return [sk, cx + r * Math.cos(a) * 1.15, cy + r * Math.sin(a) * .8]; });
    /* constellation lines: each star joins its nearest earlier star, so the lines branch like a real star chart */
    const seg = pts.slice(1).map((p, i)=>{ const q = pts.slice(0, i + 1).reduce((b, c)=>Math.hypot(c[1]-p[1], c[2]-p[2]) < Math.hypot(b[1]-p[1], b[2]-p[2]) ? c : b);
      return 'M'+p[1].toFixed(1)+' '+p[2].toFixed(1)+'L'+q[1].toFixed(1)+' '+q[2].toFixed(1); }).join('');
    out += '<path class="gl-line'+(open ? '' : ' locked')+'" d="'+seg+'"/>';
    pts.forEach(([sk, x, y])=>{ const v = skillScore(sk.id), cls = skillStatus(sk.id)[1], r = (1.4 + v / 100 * 4.2).toFixed(1);
      out += '<g class="gl-star'+(open ? '' : ' locked')+'"'+(open ? ' data-star="'+esc(sk.id)+'"' : '')+'><title>'+esc(sk.sk)+' · '+(open ? v+'%' : 'locked')+'</title>'+
        (v >= 60 ? '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+(r * 3.2).toFixed(1)+'" fill="'+col[cls]+'" opacity=".16"/>' : '')+
        '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+r+'" fill="'+(v ? col[cls] : 'var(--muted)')+'" opacity="'+(open ? (.35 + v / 160).toFixed(2) : .25)+'"/>'+
        '<circle class="gl-hit" cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="12"/></g>'; });
    const t = track(tid);
    out += '<text class="gl-name" x="'+cx.toFixed(1)+'" y="'+(cy + ch * .45).toFixed(1)+'" text-anchor="middle">'+esc(t.name)+(open ? '' : ' 🔒')+'</text>';
  });
  return '<svg class="galaxy" viewBox="0 0 '+W+' '+H+'" aria-hidden="true" focusable="false">'+out+'</svg>';
}
function galaxyCard(skills){
  const lit = skills.filter(s=>skillScore(s.id) > 0).length;
  return '<div class="card galaxycard"><div class="row" style="justify-content:space-between"><b>Your skill galaxy</b><span class="small">'+lit+' of '+skills.length+' stars lit</span></div>'+
    galaxySVG(skills)+
    '<p class="small">Each star is a skill and each constellation a track. Stars grow and brighten as your practice score rises, and fade if you leave them. '+
    (lit ? 'Bright: strong · amber: learning · red: needs review. Click a star to drill it.' : 'Nothing is lit yet: practise any skill (Today is the easiest start) and its star appears.')+
    ' Keyboard and screen readers: the same skills, with Drill buttons, are listed below.</p></div>';
}

/* ---- Skills map view ---- */
function skillRow(s){
  const v = skillScore(s.id), [st, cls] = skillStatus(s.id), m = (S.mastery||{})[s.id];
  const tag = '<span class="lv '+(cls==='good'?'open':'')+'" style="'+(cls==='bad'?'border-color:var(--bad);color:var(--bad)':cls==='mid'?'border-color:var(--warn);color:var(--warn)':'')+'">'+st+'</span>';
  /* .sring: a score ring that only the glass looks show (the meter is the fallback without glass) */
  return '<div class="ritem skill"><i class="sring '+(cls||'none')+'" style="--v:'+v+'" aria-hidden="true"></i><span>'+esc(s.sk)+' <span class="small">'+s.lvs.map(l=>'L'+l).join('/')+'</span></span>'+
    '<div class="meter"><i style="width:'+v+'%"></i></div><span class="small" style="width:42px;text-align:right">'+v+'%</span>'+tag+
    (lessonFor(s.id) ? '<button data-learn="'+esc(s.id)+'">📖 Learn</button>' : '')+
    '<button data-drill="'+esc(s.id)+'">Drill</button>'+
    (m ? '<span class="small" title="Practiced '+m.n+' times, '+m.right+' right">'+m.right+'/'+m.n+'</span>' : '')+'</div>';
}
/* The Skills map follows the career path: foundations (Level 1), then job-ready (Level 2), then everything off the path.
   A skill spanning both levels counts as a foundation. */
const onPath = s=>!!PATH.weights[s.tid] && !AREA_OF[s.id];
const STAGES = [
  ['Path · Foundations (Level 1)', 'Where the daily plan starts. Get these to 70% and each track opens its Level 2 skills.', s=>onPath(s) && !isGated(s.tid) && Math.min(...s.lvs) === 1],
  ['Path · Job-ready (Level 2)', 'Opens per track once its foundations average 70%.', s=>onPath(s) && !isGated(s.tid) && Math.min(...s.lvs) === 2],
  ['Path · Cloud Security', 'A later stage of your path. Cloud and Offensive Security share one daily lesson slot once open.', s=>s.tid === 'cloud', 'cloud'],
  ['Path · Offensive Security', 'The last stage: how authorized testers think, always defense first. Shares the one later-stage slot with Cloud.', s=>s.tid === 'offsec', 'offsec'],
  ['Off the path', 'Still here for practice and your current applications; the daily plan does not assign them.', s=>!onPath(s)]
];
function vSkills(){
  const rec = recommend(3), skills = allSkills();
  const strong = skills.filter(s=>isStrong(s.id)).length, started = skills.filter(s=>(S.mastery||{})[s.id]).length;
  view.innerHTML = '<h1>🧠 Skills map</h1><p class="sub">Every skill has a practice score from your answers here: sure, correct answers raise it; misses and time lower it, so old skills come back for review before you forget them. It reflects this practice (questions you have seen before count too), not exam or job readiness.</p>'+
    '<div class="row" style="margin-bottom:6px"><span class="pill">'+skills.length+' skills</span><span class="pill">'+started+' started</span><span class="pill">'+strong+' strong (85%+ on 2 days)</span>'+
    '<button id="typedT">⌨ Typed answers: '+(typedOn()?'ON':'OFF')+'</button></div>'+
    galaxyCard(skills)+
    '<h2>Recommended now</h2><div class="grid">'+rec.map(s=>{ const [st] = skillStatus(s.id);
      return '<div class="card mission"><div class="tag">'+esc(s.area)+'</div><h3>'+s.icon+' '+esc(s.sk)+'</h3><p>'+st+' · practice score '+skillScore(s.id)+'%</p><div class="row">'+
        (lessonFor(s.id) ? '<button class="primary" data-learn="'+esc(s.id)+'">📖 Learn + practice</button>' : '')+'<button data-drill="'+esc(s.id)+'">Drill</button></div></div>'; }).join('')+'</div>'+
    STAGES.map(([name, note, test, gate])=>{ const inStage = skills.filter(test); if(!inStage.length) return '';
      if(gate && !trackOpen(gate)) return '<h2>'+esc(name)+' 🔒</h2><div class="card"><p>Opens when '+unlockText(gate)+'. '+inStage.length+' skills are waiting: '+inStage.map(s=>esc(s.sk)).join(', ')+'.</p>'+
        '<div class="row"><button data-preview="'+gate+'">Preview a lesson (records nothing)</button></div></div>';
      return '<h2>'+esc(name)+'</h2><p class="small">'+note+'</p>'+[...new Set(inStage.map(s=>s.area))].map(a=>
        '<h3 class="area">'+esc(a)+'</h3><div class="card skillgrid">'+inStage.filter(s=>s.area===a).map(skillRow).join('')+'</div>').join(''); }).join('');
  view.querySelectorAll('[data-learn]').forEach(b=>b.onclick=()=>vLesson(b.dataset.learn));
  view.querySelectorAll('[data-preview]').forEach(b=>b.onclick=()=>vLesson(previewLesson(b.dataset.preview), null, {preview:true}));
  view.querySelectorAll('[data-drill]').forEach(b=>b.onclick=()=>startSkill(skillById(b.dataset.drill), 8, null));
  view.querySelectorAll('[data-star]').forEach(g=>g.onclick=()=>startSkill(skillById(g.dataset.star), 8, null));
  $('#typedT').onclick = ()=>{ S.typed = !typedOn(); save(); vSkills(); toast('Typed answers '+(typedOn()?'on':'off')); };
}
