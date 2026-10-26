/* ===================== PRACTICE EXAMS =====================
   Timed, exam-style practice mapped to the official CompTIA exam domains, built from SkillQuest content.
   Honest by design: it shows how much of each domain SkillQuest covers, and it is not an official exam. */

/* Each domain: official name, weight (share of the real exam), fixed QUIZ question indexes, and generator skills [track, skill]. */
const CERTS = [
 {id:'secplus', name:'CompTIA Security+', code:'SY0-701', real:'Up to 90 questions in 90 minutes; passing score 750 on a 100–900 scale.',
  domains:[
   {n:1, name:'General Security Concepts', w:12, qs:[20,21,22,27,29], gens:[['sec','CIA triad'],['sec','Authentication & MFA'],['sec','Cryptography']]},
   {n:2, name:'Threats, Vulnerabilities & Mitigations', w:22, qs:[23,25,26,89], gens:[['sec','Vulnerabilities']]},
   {n:3, name:'Security Architecture', w:18, qs:[79,83,90], gens:[['sec','Backups']]},
   {n:4, name:'Security Operations', w:28, qs:[24,28,84,85,86,87,88,91], gens:[['sec','Windows logs']]},
   {n:5, name:'Security Program Management & Oversight', w:20, qs:[], gens:[]}
  ]},
 {id:'netplus', name:'CompTIA Network+', code:'N10-009', real:'Up to 90 questions in 90 minutes; passing score 720 on a 100–900 scale.',
  domains:[
   {n:1, name:'Networking Concepts', w:23, qs:[10,12,14,17,18,77], gens:[['net','Ports & services'],['net','DNS records']]},
   {n:2, name:'Network Implementation', w:20, qs:[13,15,16,76,79,81], gens:[['net','IP addressing'],['net','Subnetting']]},
   {n:3, name:'Network Operations', w:19, qs:[78,82], gens:[]},
   {n:4, name:'Network Security', w:14, qs:[83], gens:[]},
   {n:5, name:'Network Troubleshooting', w:24, qs:[11,19,80], gens:[['support','Troubleshooting method']]}
  ]}
];
const domCovered = d=>d.qs.length > 0 || d.gens.length > 0;
/* How many questions of a domain an exam can hold: fixed ones once each, generated ones without limit. */
const domCap = d=>d.gens.length ? Infinity : d.qs.length;

/* Split n questions across covered domains by weight; domains that run out pass their share to the others. */
function examPlan(cert, n){
  const doms = cert.domains.filter(domCovered), totalW = doms.reduce((a,d)=>a+d.w, 0);
  const plan = new Map(doms.map(d=>[d, Math.min(domCap(d), Math.round(n*d.w/totalW))]));
  let left = n - [...plan.values()].reduce((a,b)=>a+b, 0);
  const growable = doms.filter(d=>domCap(d)===Infinity).sort((a,b)=>b.w-a.w);
  for(let i=0; left>0 && growable.length; i++, left--) plan.set(growable[i%growable.length], plan.get(growable[i%growable.length])+1);
  for(const d of doms){ while(left<0 && plan.get(d)>1){ plan.set(d, plan.get(d)-1); left++; } }
  return plan;
}
function buildExam(cert, n){
  const items = [];
  for(const [d, k] of examPlan(cert, n)){
    const fixed = shuffle(d.qs).slice(0, d.gens.length ? Math.ceil(k/2) : k);
    fixed.forEach(i=>items.push({d:QUIZ[i], qi:i, dom:d.n}));
    for(let j=fixed.length; j<k; j++){
      const [tid, sk] = pick(d.gens), g = makeGen(tid, 0, sk);
      if(g) items.push({d:g.d, sid:skillIdFor('quiz', tid, sk), dom:d.n});
    }
  }
  return shuffle(items).map(it=>Object.assign(it, {order:shuffle([0,1,2,3]), pick:null, flag:false}));
}

let EX = null, exTimer = null;
function stopExamTimer(){ if(exTimer){ clearInterval(exTimer); exTimer = null; } }
function startExam(certId, n){
  const cert = CERTS.find(c=>c.id===certId);
  EX = {cert, items:buildExam(cert, n), i:0, secs:n*60, start:Date.now()};
  current = 'exams'; header(); stopExamTimer();
  exTimer = setInterval(()=>{ if(!EX) return stopExamTimer(); const left = EX.secs - Math.floor((Date.now()-EX.start)/1000);
    const el = $('#exClock'); if(el){ el.textContent = Math.floor(Math.max(0,left)/60)+':'+String(Math.max(0,left)%60).padStart(2,'0'); el.classList.toggle('low', left<=60); }
    if(left <= 0){ toast('Time is up'); submitExam(); } }, 1000);
  examStep();
}
function examStep(){
  const it = EX.items[EX.i], q = it.d, answered = EX.items.filter(x=>x.pick!==null).length;
  view.innerHTML = '<h1>📝 '+esc(EX.cert.name)+' practice</h1>'+
    '<div class="row" style="justify-content:space-between"><span class="small">Question '+(EX.i+1)+' of '+EX.items.length+' · '+answered+' answered · no feedback until you submit</span><span class="timer" id="exClock">--:--</span></div>'+
    '<div class="card" style="margin-top:10px"><div class="q">'+q[2]+'</div><div class="opts">'+
      it.order.map(k=>'<button class="opt" data-k="'+k+'" style="'+(it.pick===k?'border-color:var(--accent);background:var(--accent-soft);color:var(--text)':'')+'">'+q[3][k]+'</button>').join('')+'</div>'+
    '<div class="row" style="margin-top:14px"><button id="prev" '+(EX.i?'':'disabled')+'>◀ Prev</button><button id="flag">'+(it.flag?'🚩 Flagged':'⚐ Flag as unsure')+'</button><button id="nxt" '+(EX.i<EX.items.length-1?'':'disabled')+'>Next ▶</button><button class="primary" id="sub">Submit exam</button></div></div>'+
    '<div class="chips" style="margin-top:14px">'+EX.items.map((x,j)=>'<button class="chip" data-j="'+j+'" style="'+(j===EX.i?'border-color:var(--accent);color:var(--accent);':'')+(x.pick!==null?'border-style:solid;':'')+'">'+(j+1)+(x.flag?'🚩':'')+'</button>').join('')+'</div>'+
    '<p class="small">Solid chips = answered. Flag questions you are unsure about; they count as guesses toward skill mastery.</p>';
  view.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{ it.pick = +b.dataset.k; if(EX.i < EX.items.length-1) EX.i++; examStep(); });
  view.querySelectorAll('[data-j]').forEach(b=>b.onclick=()=>{ EX.i = +b.dataset.j; examStep(); });
  $('#prev').onclick = ()=>{ EX.i--; examStep(); };
  $('#nxt').onclick = ()=>{ EX.i++; examStep(); };
  $('#flag').onclick = ()=>{ it.flag = !it.flag; examStep(); };
  $('#sub').onclick = ()=>{ const blank = EX.items.length - answered; if(!blank) submitExam(); else askConfirm(blank+' question'+(blank===1?' is':'s are')+' unanswered. Submit anyway?', 'Submit exam', submitExam); };
}
function submitExam(){
  stopExamTimer(); if(!EX) return;
  const ex = EX; EX = null;
  const used = Math.min(ex.secs, Math.round((Date.now()-ex.start)/1000));
  const byDom = {}; let right = 0;
  ex.items.forEach(it=>{
    it.ok = it.pick === it.d[4]; if(it.ok) right++;
    const b = byDom[it.dom] = byDom[it.dom] || {r:0, t:0}; b.t++; if(it.ok) b.r++;
    if(it.sid) recordSkill(it.sid, it.ok, !it.flag);
    if(!it.ok) addMistake(it.d, {kind:'quiz', your: it.pick===null ? '(no answer)' : plainText(it.d[3][it.pick]), sid: it.sid, qi: it.qi==null ? null : it.qi});
  });
  const pct = Math.round(right/ex.items.length*100);
  S.exams = S.exams || []; S.exams.unshift({cert:ex.cert.id, date:dayStr(), n:ex.items.length, pct, secs:used, doms:Object.fromEntries(Object.entries(byDom).map(([k,v])=>[k, Math.round(v.r/v.t*100)]))});
  S.exams.length = Math.min(S.exams.length, 50);
  addXP(Math.round(right*3), 'Exam submitted');
  save();
  const weakest = Object.entries(byDom).map(([k,v])=>[+k, v.r/v.t]).sort((a,b)=>a[1]-b[1])[0];
  view.innerHTML = '<h1>📝 Exam results</h1><div class="card"><p class="q">'+right+' / '+ex.items.length+' ('+pct+'%)</p>'+
    '<p>'+(pct>=85 ? 'Strong result. Keep this up across a few exams before booking the real one.' : pct>=75 ? 'Close to ready. Drill your weakest domain below, then try again.' : 'Keep building. Read the lessons for your weakest domain and drill it before the next attempt.')+
    ' <span class="small">(Aim for 85%+ here on several attempts. Real CompTIA exams use scaled scores and performance-based questions, so this is a readiness signal, not a prediction.)</span></p>'+
    '<p class="small">Time used: '+Math.floor(used/60)+' min '+(used%60)+' s of '+Math.round(ex.secs/60)+' min.</p>'+
    '<h2>By domain</h2>'+ex.cert.domains.map(d=>{ const b = byDom[d.n];
      return '<div class="ritem"><span>'+d.n+'. '+esc(d.name)+' <span class="small">('+d.w+'% of real exam)</span></span>'+
        (b ? '<div class="meter"><i style="width:'+Math.round(b.r/b.t*100)+'%"></i></div><span class="small" style="width:70px;text-align:right">'+b.r+'/'+b.t+'</span>' : '<span class="small">not covered by SkillQuest yet</span>')+'</div>'; }).join('')+
    (weakest ? '<p class="small" style="margin-top:10px">👉 Weakest domain: <b>'+esc(ex.cert.domains.find(d=>d.n===weakest[0]).name)+'</b>. Your misses are saved in the mistake journal.</p>' : '')+
    '<div class="row" style="margin-top:12px"><button class="primary" id="rev">Review answers</button><button id="again">New exam</button><button id="home">Back to Today</button></div></div><div id="review"></div>';
  $('#again').onclick = ()=>vExams();
  $('#home').onclick = ()=>go('today');
  $('#rev').onclick = ()=>{ $('#review').innerHTML = '<h2>All answers</h2>'+ex.items.map((it,j)=>'<details class="card" style="margin:8px 0" '+(it.ok?'':'open')+'><summary>'+(it.ok?'✅':'❌')+' '+(j+1)+'. '+it.d[2].replace(/<table[\s\S]*?<\/table>/g,' [table] ')+(it.flag?' 🚩':'')+'</summary>'+
      '<p>You: <b>'+(it.pick===null?'(no answer)':it.d[3][it.pick])+'</b><br>Right: <b>'+it.d[3][it.d[4]]+'</b></p><div class="explain">'+it.d[5]+'</div></details>').join(''); $('#rev').disabled = true; };
}
function vExams(){
  current = 'exams'; header(); stopExamTimer();
  if(EX){ examStep(); askConfirm('Leave the exam in progress? Your answers will be lost.', 'Leave exam', ()=>{ stopExamTimer(); EX = null; vExams(); }); return; }
  const hist = S.exams || [];
  view.innerHTML = '<h1>📝 Practice exams</h1><p class="sub">Timed, exam-style practice mapped to the official CompTIA domains. No feedback until you submit, like the real thing. Fixed questions plus freshly generated ones, so every exam is different.</p>'+
    CERTS.map(c=>{ const mine = hist.filter(h=>h.cert===c.id), best = mine.length ? Math.max(...mine.map(h=>h.pct)) : null;
      return '<div class="card" style="margin-bottom:14px"><div class="row" style="justify-content:space-between"><h3 style="margin:0">'+esc(c.name)+' <span class="small">'+c.code+'</span></h3>'+(best!==null?'<span class="pill">best '+best+'% · '+mine.length+' tries</span>':'')+'</div>'+
        '<p class="small">Real exam: '+esc(c.real)+'</p>'+
        c.domains.map(d=>'<div class="ritem"><span>'+d.n+'. '+esc(d.name)+' <span class="small">'+d.w+'%</span></span><span class="small">'+
          (!domCovered(d) ? '⚠ not covered yet' : (d.qs.length+' fixed questions'+(d.gens.length?' + endless generated ('+d.gens.map(g=>g[1]).join(', ')+')':'')))+'</span></div>').join('')+
        '<div class="row" style="margin-top:10px"><button class="primary" data-ex="'+c.id+'" data-n="20">Quick exam · 20 questions · 20 min</button><button data-ex="'+c.id+'" data-n="45">Full practice · 45 questions · 45 min</button></div></div>'; }).join('')+
    (hist.length ? '<h2>History</h2><div class="card">'+hist.slice(0,10).map(h=>'<div class="ritem"><span>'+h.date+' · '+esc(CERTS.find(c=>c.id===h.cert).name)+' · '+h.n+' Q</span><div class="meter"><i style="width:'+h.pct+'%"></i></div><span class="small" style="width:50px;text-align:right">'+h.pct+'%</span></div>').join('')+'</div>' : '')+
    '<p class="small">Coverage is honest: domains marked "not covered yet" are left out of the exam and listed in your results, so you know what to study elsewhere (Professor Messer\'s free videos cover every domain).</p>';
  view.querySelectorAll('[data-ex]').forEach(b=>b.onclick=()=>startExam(b.dataset.ex, +b.dataset.n));
}
