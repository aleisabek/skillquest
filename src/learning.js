/* ===================== LEARNING ENGINE =====================
   Skills, mastery scores, recommendations, typed answers and mini-lessons.
   Loaded after generators.js and before app.js. Nothing here runs at load time. */

/* Every skill you can practice: quiz skills per track, plus Terminal and SQL console skills.
   id = 'kind:track:skill name' (used as the key for mastery and lessons). */
function allSkills(){
  if(allSkills.cache) return allSkills.cache;
  const lvsOf = (list, sk)=>[...new Set(list.filter(g=>g.sk===sk).map(g=>g.lv))].sort();
  const list = [];
  TRACKS.forEach(t=>genSkills(t.id).forEach(([sk,lvs])=>list.push({id:'quiz:'+t.id+':'+sk, kind:'quiz', tid:t.id, sk, lvs, icon:t.icon, area:t.name})));
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
  S.lessons = S.lessons || {}; S.lessons[id] = dayStr(); save();
  const v = skillScore(id), [st, cls] = skillStatus(id);
  view.innerHTML = '<h1>'+s.icon+' '+esc(s.sk)+'</h1><p class="sub">'+esc(s.area)+' · '+s.lvs.map(l=>'L'+l).join('/')+' · mastery '+v+'% ('+st+') · about 2 minutes</p>'+
    '<div class="card"><h2>Why it matters at work</h2><p>'+L.why+'</p>'+
    '<h2>The core idea</h2>'+L.idea+
    '<h2>Worked example</h2><div class="model">'+L.example+'</div>'+
    '<h2>Common mistakes</h2><ul class="clean">'+L.mistakes.map(x=>'<li>'+x+'</li>').join('')+'</ul>'+
    '<h2>Say it in an interview</h2><div class="explain">"'+L.say+'"</div>'+
    '<div class="row" style="margin-top:16px"><button class="primary" id="prac">Practice it now: 6 fresh problems</button><button id="back">Skills map</button></div></div>';
  $('#prac').onclick = ()=>startSkill(s, 6, mission || null);
  $('#back').onclick = ()=>go('skills');
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
function vSkills(){
  const rec = recommend(3), skills = allSkills();
  const areas = [...new Set(skills.map(s=>s.area))];
  const strong = skills.filter(s=>skillScore(s.id)>=85).length, started = skills.filter(s=>(S.mastery||{})[s.id]).length;
  view.innerHTML = '<h1>🧠 Skills map</h1><p class="sub">Every skill has a mastery score. Sure, correct answers raise it; misses and time lower it, so old skills come back for review before you forget them.</p>'+
    '<div class="row" style="margin-bottom:6px"><span class="pill">'+skills.length+' skills</span><span class="pill">'+started+' started</span><span class="pill">'+strong+' strong (85%+)</span>'+
    '<button id="typedT">⌨ Typed answers: '+(typedOn()?'ON':'OFF')+'</button></div>'+
    '<h2>Recommended now</h2><div class="grid">'+rec.map(s=>{ const [st] = skillStatus(s.id);
      return '<div class="card mission"><div class="tag">'+esc(s.area)+'</div><h3>'+s.icon+' '+esc(s.sk)+'</h3><p>'+st+' · mastery '+skillScore(s.id)+'%</p><div class="row">'+
        (lessonFor(s.id) ? '<button class="primary" data-learn="'+esc(s.id)+'">📖 Learn + practice</button>' : '')+'<button data-drill="'+esc(s.id)+'">Drill</button></div></div>'; }).join('')+'</div>'+
    areas.map(a=>'<h2>'+esc(a)+'</h2><div class="card">'+skills.filter(s=>s.area===a).map(skillRow).join('')+'</div>').join('');
  view.querySelectorAll('[data-learn]').forEach(b=>b.onclick=()=>vLesson(b.dataset.learn));
  view.querySelectorAll('[data-drill]').forEach(b=>b.onclick=()=>startSkill(skillById(b.dataset.drill), 8, null));
  $('#typedT').onclick = ()=>{ S.typed = !typedOn(); save(); vSkills(); toast('Typed answers '+(typedOn()?'on':'off')); };
}
