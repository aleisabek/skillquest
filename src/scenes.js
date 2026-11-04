/* ===================== ANIMATED LESSON SCENES =====================
   Small animated explainers shown inside a lesson ("Watch it"). A scene is data, not a timeline:
     {id, title, label, w, h, els:[[tag, id, attrs, text?, parentId?]], steps:[{say, ms?, set:{id:{c?, t?, s?}}}]}
   els is the drawing (SVG shapes; parentId puts an element inside a <g> so it moves as one), steps change it.
   sceneState(scene, n) applies steps 0..n in order, so every step is a complete picture: Back, reduced motion and the
   tests all use the same function. CSS transitions animate between pictures; nothing autoplays, and a scene stops
   itself once it leaves the page. Colours come only from theme classes; meaning never rests on colour alone. */
const SCENES = {};
const SCENE_MS = 2600;   /* playing: time on a step, plus a little per caption character, unless the step sets ms */
const sceneDelay = st=>st.ms || SCENE_MS + st.say.length * 22;

/* The complete picture after step n: each element's class list (c), text (t) and style (s) */
function sceneState(sc, n){
  const st = {};
  for(const [, id, , text] of sc.els) st[id] = {c:'', t:text == null ? null : String(text), s:{}};
  for(let i=0; i<=n && i<sc.steps.length; i++)
    for(const [id, ch] of Object.entries(sc.steps[i].set || {})){
      const e = st[id]; if(!e) continue;
      if('c' in ch) e.c = ch.c;
      if('t' in ch) e.t = String(ch.t);
      if(ch.s) e.s = Object.assign({}, e.s, ch.s);
    }
  return st;
}

/* Only one scene is live at a time; leaving the lesson (or opening another) destroys it */
let SCENE_LIVE = null;
function destroyScene(){ if(SCENE_LIVE){ SCENE_LIVE.stop(); SCENE_LIVE = null; } }

function mountScene(host, sc){
  destroyScene();
  if(!host || !sc) return null;
  const NS = 'http://www.w3.org/2000/svg';
  host.innerHTML = '';
  host.classList.add('scene');
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 '+sc.w+' '+sc.h);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', sc.label || sc.title);   /* the caption below is announced separately */
  const nodes = {};
  for(const [tag, id, attrs, text, parent] of sc.els){
    const n = document.createElementNS(NS, tag);
    for(const [k, v] of Object.entries(attrs || {})) n.setAttribute(k, v);
    if(text != null) n.textContent = text;
    (parent && nodes[parent] || svg).appendChild(n); nodes[id] = n;
  }
  /* every caption sits in the same grid cell (hidden copies size it), so the box never changes height
     and the buttons below never move under your thumb */
  const capBox = document.createElement('div'); capBox.className = 'scene-capbox';
  capBox.innerHTML = sc.steps.map(s=>'<span class="scene-sizer" aria-hidden="true">'+esc(s.say)+'</span>').join('');
  const cap = document.createElement('p'); cap.className = 'scene-cap'; cap.setAttribute('aria-live', 'polite');
  capBox.appendChild(cap);
  const ctl = document.createElement('div'); ctl.className = 'scene-ctl';
  ctl.innerHTML = '<button type="button" data-a="back"><span aria-hidden="true">◀ </span>Back</button>'+
    '<button type="button" class="primary" data-a="play">Play</button>'+
    '<button type="button" data-a="next">Next<span aria-hidden="true"> ▶</span></button>'+
    '<span class="scene-pos small" aria-hidden="true"></span>';
  host.append(svg, capBox, ctl);
  host.tabIndex = -1;

  let step = 0, playing = false, raf = 0, stepAt = 0, ctrl = null;
  const btn = a=>ctl.querySelector('[data-a="'+a+'"]');
  const last = sc.steps.length - 1;
  function render(n){
    const st = sceneState(sc, n), changed = [];
    for(const [id, e] of Object.entries(st)){
      const node = nodes[id];
      node.setAttribute('class', ('sc '+(node.getAttribute('data-base') || '')+' '+e.c).trim());
      /* styles: set this picture's, and clear any a later step had set (Back must restore the whole picture) */
      for(const k of node._sk || []) if(!(k in e.s)) node.style.removeProperty(k);
      for(const [k, v] of Object.entries(e.s)) node.style.setProperty(k, v);
      node._sk = Object.keys(e.s);
      if(e.t != null && node.textContent !== e.t){ node.textContent = e.t; changed.push(node); }
    }
    /* restart the fade-in on changed text: one reflow for all of them */
    changed.forEach(x=>x.classList.remove('sc-flash'));
    if(changed.length) void svg.getBoundingClientRect();
    changed.forEach(x=>x.classList.add('sc-flash'));
    cap.textContent = sc.steps[n].say;
    ctl.querySelector('.scene-pos').textContent = 'Step '+(n+1)+' of '+(last+1);
    /* a button about to be disabled can't keep focus: hand it to its partner (enabled first, or the browser refuses
       the focus, e.g. jumping from the last step to the first) so the arrow keys keep working */
    const backOff = n === 0, nextOff = n === last;
    if(!backOff) btn('back').disabled = false;
    if(!nextOff) btn('next').disabled = false;
    if(nextOff && document.activeElement === btn('next')) btn('back').focus();
    if(backOff && document.activeElement === btn('back')) btn('next').focus();
    btn('back').disabled = backOff;
    btn('next').disabled = nextOff;
    if(!playing) btn('play').textContent = n === last ? 'Replay' : 'Play';
  }
  function show(n){ step = Math.max(0, Math.min(last, n)); render(step); stepAt = performance.now(); }
  function setPlaying(p){
    playing = p && step < last;
    btn('play').textContent = playing ? 'Pause' : step === last ? 'Replay' : 'Play';
    cancelAnimationFrame(raf);
    if(playing){ stepAt = performance.now(); raf = requestAnimationFrame(sceneTick); }
  }
  /* gone from the page (e.g. left through Practice, which doesn't pass through go()): clean up fully */
  const gone = ()=>{ if(SCENE_LIVE === ctrl) destroyScene(); else ctrl.stop(); };
  /* One rAF loop while playing: it advances on time and ends itself when the scene is gone */
  function sceneTick(now){
    if(!host.isConnected){ gone(); return; }
    if(!playing) return;
    if(now - stepAt >= sceneDelay(sc.steps[step])){
      show(step + 1);
      if(step >= last){ setPlaying(false); return; }
    }
    raf = requestAnimationFrame(sceneTick);
  }
  const onVis = ()=>{ if(!host.isConnected) gone(); else if(document.hidden && playing) setPlaying(false); };
  document.addEventListener('visibilitychange', onVis);
  ctl.addEventListener('click', e=>{
    const a = e.target.closest('button'); if(!a) return;
    const act = a.dataset.a;
    /* Play moves on straight away (the current step is already on screen); at the end it reads Replay and starts over */
    if(act === 'play'){ if(playing) setPlaying(false); else { show(step === last ? 0 : step + 1); setPlaying(true); } }
    else { setPlaying(false); show(act === 'back' ? step - 1 : step + 1); }
  });
  /* keys only while focus is inside the scene: ← → step, Space plays or pauses */
  host.addEventListener('keydown', e=>{
    if(e.ctrlKey || e.altKey || e.metaKey) return;
    if(e.key === 'ArrowRight'){ e.preventDefault(); setPlaying(false); show(step + 1); }
    else if(e.key === 'ArrowLeft'){ e.preventDefault(); setPlaying(false); show(step - 1); }
    else if(e.key === ' ' && e.target === host){ e.preventDefault(); btn('play').click(); }
  });
  ctrl = {
    stop(){ playing = false; cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', onVis); },
    show, get step(){ return step; }, get playing(){ return playing; }
  };
  SCENE_LIVE = ctrl;
  show(0);
  return ctrl;
}

/* ---------- Subnetting: 32 bits, a mask over the network part, then network, broadcast and host count ---------- */
/* The same arithmetic the lesson's worked example uses; tests check the lesson text against it. */
function subnetMath(ip, prefix){
  const oct = ip.split('.').map(Number), n = oct.reduce((a, b)=>a * 256 + b, 0) >>> 0;
  const mask = prefix === 0 ? 0 : (0xFFFFFFFF << (32 - prefix)) >>> 0;
  const net = (n & mask) >>> 0, bc = (net | (~mask >>> 0)) >>> 0;
  const dot = v=>[24, 16, 8, 0].map(s=>(v >>> s) & 255).join('.');
  const bits = v=>Array.from({length:32}, (_, i)=>(v >>> (31 - i)) & 1);
  const total = Math.pow(2, 32 - prefix);
  return {ip, prefix, bits:bits(n), net:dot(net), bc:dot(bc), total, usable:Math.max(0, total - 2),
    first:dot(net + 1), last:dot(bc - 1), octets:oct, netOct:dot(net).split('.').map(Number), bcOct:dot(bc).split('.').map(Number)};
}
const SUBNET_EXAMPLE = ['192.168.1.77', 27];   /* the lesson's worked example */

function subnetScene(ip, prefix){
  /* the captions assume a normal subnet (network and broadcast plus at least two hosts) */
  if(!(prefix >= 1 && prefix <= 30)) throw new Error('subnetScene expects a /1 to /30 example');
  const m = subnetMath(ip, prefix), host = 32 - prefix, tail = s=>'.'+s.split('.').pop();
  /* phone-first: 320 wide, so at a 360px screen the smallest label still renders at 12px or more */
  const W = 320, CW = 18, P = 19, OG = 12, X0 = (W - (8 * P - 1) * 2 - OG) / 2, Y0 = [38, 116];
  const at = b=>{ const o = b >> 3; return {x: X0 + (o & 1) * (8 * P - 1 + OG) + (b & 7) * P, y: Y0[o >> 1]}; };
  const els = [['text', 'head', {x:W/2, y:22, 'text-anchor':'middle', 'data-base':'sc-head'}, ip+' /'+prefix]];
  for(let b=0; b<32; b++){
    const {x, y} = at(b);
    els.push(['rect', 'c'+b, {x, y, width:CW, height:24, rx:2, 'data-base':'sc-cell'}]);
    els.push(['text', 'b'+b, {x:x + CW/2, y:y + 17.5, 'text-anchor':'middle', 'data-base':'sc-bitt'}, m.bits[b]]);
  }
  for(let o=0; o<4; o++){
    const {x, y} = at(o * 8), nb = Math.max(0, Math.min(8, prefix - o * 8));
    els.push(['text', 'o'+o, {x:x + (8 * P - 1)/2, y:y + 45, 'text-anchor':'middle', 'data-base':'sc-oct'}, m.octets[o]]);
    if(nb) els.push(['rect', 'bar'+o, {x, y:y + 27, width:nb * P - 1, height:4, 'data-base':'sc-bar', style:'transition-delay:'+(o * 40)+'ms'}]);
  }
  els.push(['text', 'lnet', {x:W/2, y:188, 'text-anchor':'middle', 'data-base':'sc-legend sc-l-net'}, '■ NETWORK · '+prefix+' bits']);
  els.push(['text', 'lhost', {x:W/2, y:208, 'text-anchor':'middle', 'data-base':'sc-legend sc-l-host'}, '┄ HOST · '+host+' bits']);
  els.push(['text', 'res', {x:W/2, y:236, 'text-anchor':'middle', 'data-base':'sc-res'}, '']);

  const all = f=>{ const o = {}; for(let b=0; b<32; b++) Object.assign(o, f(b)); return o; };
  const isNet = b=>b < prefix;
  const bars = {}; for(let o=0; o<4; o++) if(prefix - o * 8 > 0) bars['bar'+o] = {c:'on'};
  /* host bits get the focus; network bits step back a little (never the octet values: they are part of the answer) */
  const hostBits = v=>all(b=>isNet(b) ? {} : {['b'+b]:{t:v === null ? m.bits[b] : v, c:'focus'}});
  const octs = vals=>{ const o = {}; for(let i=0; i<4; i++) o['o'+i] = {t:vals[i], c:i * 8 + 8 > prefix ? 'focus' : ''}; return o; };
  const steps = [
    {say: ip+' is 32 bits: four octets of 8 bits. The number under each octet is its value.',
     set: {lnet:{c:'hide'}, lhost:{c:'hide'}, res:{c:'hide'}}},
    {say: '/'+prefix+' means the first '+prefix+' bits are the network part. The bars mark them.',
     set: Object.assign({lnet:{c:''}}, bars, all(b=>isNet(b) ? {['c'+b]:{c:'net'}} : {}))},
    {say: 'The '+host+' bits left over are the host part (dashed). They number the devices inside this subnet.',
     set: Object.assign({lhost:{c:''}}, all(b=>({['c'+b]:{c:isNet(b) ? 'net' : 'host'}, ['b'+b]:{c:isNet(b) ? 'dim' : 'focus'}})))},
    {say: 'Set every host bit to 0 and you get the network address: '+m.net+'.',
     set: Object.assign({res:{c:'', t:'network = '+m.net}}, hostBits(0), octs(m.netOct))},
    {say: 'Set every host bit to 1 and you get the broadcast address: '+m.bc+'. So this block runs '+tail(m.net)+' to '+tail(m.bc)+'.',
     set: Object.assign({res:{c:'', t:'broadcast = '+m.bc}}, hostBits(1), octs(m.bcOct))},
    {say: host+' host bits make '+Array(host).fill(2).join('×')+' = '+m.total+' addresses. Minus network and broadcast: '+m.usable+' usable hosts, '+tail(m.first)+' to '+tail(m.last)+'. Back to '+tail(ip)+': it is one of them.',
     set: Object.assign({res:{c:'', t:m.total+' addresses − 2 = '+m.usable+' usable'}}, hostBits(null), octs(m.octets))}
  ];
  return {id:'subnet', title:'Subnetting '+ip+'/'+prefix, label:'The 32 bits of '+ip+' in four octets, with the /'+prefix+' network and host parts marked',
    w:W, h:248, els, steps, math:m};
}
SCENES['quiz:net:Subnetting'] = subnetScene(SUBNET_EXAMPLE[0], SUBNET_EXAMPLE[1]);
