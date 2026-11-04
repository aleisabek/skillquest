/* ===================== ANIMATED LESSON SCENES =====================
   Small animated explainers shown inside a lesson ("Watch it"). A scene is data, not a timeline:
     {id, title, label, w, h, els:[[tag, id, attrs, text?, parentId?]], steps:[{say, ms?, set:{id:{c?, t?, s?}}, ask?}]}
   els is the drawing (SVG shapes; parentId puts an element inside a <g> so it moves as one), steps change it.
   sceneState(scene, n) applies steps 0..n in order, so every step is a complete picture: Back, reduced motion and the
   tests all use the same function. CSS transitions animate between pictures; nothing autoplays, and a scene stops
   itself once it leaves the page. Colours come only from theme classes; meaning never rests on colour alone. */
const SCENES = {};
/* A step may ask first: {say:'question', ask:{options:[[label, right?], ...]}}. The step after it shows the answer. */
const SCENE_REPLY = {right:'Right. Next shows why.', wrong:'Not quite. Next shows what happens.'};
const SCENE_MS = 2600;   /* playing: time on a step, plus a little per caption character, unless the step sets ms */
/* A caption may hold several lines (split on \n). When there are several lines, each one that starts with a short label ("Established:") gets it in bold,
   so different kinds of statement never run together. textContent stays exactly the step's say. */
function capText(el, say){
  el.textContent = '';
  const multi = say.includes('\n');
  say.split('\n').forEach((line, i)=>{
    if(i) el.append('\n');
    const m = multi ? /^([A-Z][a-z]*(?: [a-z0-9]+){0,2}:)( .+)$/.exec(line) : null;
    if(m){ const b = document.createElement('strong'); b.textContent = m[1]; el.append(b, m[2]); } else el.append(line);
  });
}
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
  /* The buttons sit right under the picture, before the caption in the page order too (so keyboard and screen-reader
     order match what you see). The caption below them takes each step's own height, and the buttons never move. */
  const opts = ask=>'<div class="scene-opts">'+ask.options.map((o, i)=>'<button type="button" data-o="'+i+'" aria-pressed="false">'+esc(o[0])+'</button>').join('')+'</div>';
  const capBox = document.createElement('div'); capBox.className = 'scene-capbox';
  const live = document.createElement('div'); live.className = 'scene-live';
  const cap = document.createElement('p'); cap.className = 'scene-cap'; cap.setAttribute('aria-live', 'polite'); cap.setAttribute('aria-atomic', 'true');
  const choices = document.createElement('div'), reply = document.createElement('p'); choices.className = 'scene-choices';
  reply.className = 'scene-verdict small'; reply.setAttribute('aria-live', 'polite');
  live.append(cap, choices, reply); capBox.appendChild(live);
  const ctl = document.createElement('div'); ctl.className = 'scene-ctl';
  ctl.innerHTML = '<button type="button" data-a="back"><span aria-hidden="true">◀ </span>Back</button>'+
    '<button type="button" class="primary" data-a="play">Play</button>'+
    '<button type="button" data-a="next">Next<span aria-hidden="true"> ▶</span></button>'+
    '<span class="scene-pos small" aria-hidden="true"></span>';
  host.append(svg, ctl, capBox);
  host.tabIndex = -1;
  /* optional hands-on panel under the animation (it never touches progress) */
  if(sc.tryIt){ const t = document.createElement('div'); t.className = 'scene-try'; host.appendChild(t); sc.tryIt(t); }

  let step = 0, playing = false, raf = 0, stepAt = 0, ctrl = null;
  const picked = {};   /* prediction choices on this visit (never saved, never scored) */
  /* a prediction step asks before the next step shows the answer: pick one, or just press Next */
  function drawAsk(n){
    const ask = sc.steps[n].ask;
    choices.innerHTML = ask ? opts(ask) : ''; reply.textContent = '';
    if(!ask) return;
    const mark = ()=>{
      const i = picked[n]; if(i === undefined) return;
      choices.querySelectorAll('[data-o]').forEach(b=>b.setAttribute('aria-pressed', String(+b.dataset.o === i)));
      reply.textContent = ask.options[i][1] ? SCENE_REPLY.right : SCENE_REPLY.wrong;
    };
    choices.querySelectorAll('[data-o]').forEach(b=>b.onclick = ()=>{ picked[n] = +b.dataset.o; mark(); btn('next').focus(); });
    mark();
  }
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
    capText(cap, sc.steps[n].say);
    drawAsk(n);
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
  /* playing stops at a question, so there is time to think; Play or Next carries on */
  function show(n){ step = Math.max(0, Math.min(last, n)); render(step); stepAt = performance.now(); if(playing && sc.steps[step].ask) setPlaying(false); }
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
    if(act === 'play'){ if(playing) setPlaying(false); else { show(step === last ? 0 : step + 1); if(!sc.steps[step].ask) setPlaying(true); } }
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

/* ---------- Subnetting: where the /27 splits the bits, the mask, the AND that finds the network, the block ---------- */
/* The same arithmetic the lesson's worked example uses; tests check the lesson text and the Try it panel against it. */
function subnetMath(ip, prefix){
  const oct = ip.split('.').map(Number), n = oct.reduce((a, b)=>a * 256 + b, 0) >>> 0;
  const mask = prefix === 0 ? 0 : (0xFFFFFFFF << (32 - prefix)) >>> 0;
  const net = (n & mask) >>> 0, bc = (net | (~mask >>> 0)) >>> 0;
  const dot = v=>[24, 16, 8, 0].map(s=>(v >>> s) & 255).join('.');
  const bits = v=>Array.from({length:32}, (_, i)=>(v >>> (31 - i)) & 1);
  const total = Math.pow(2, 32 - prefix);
  /* k = the octet the split falls in (for /24, /16, /8 it is the first all-host octet); block = addresses per subnet
     counted in that octet */
  const k = Math.min(3, prefix >> 3), inOct = prefix - k * 8, block = Math.pow(2, 8 - inOct);
  return {ip, prefix, bits:bits(n), maskBits:bits(mask), net:dot(net), bc:dot(bc), mask:dot(mask), total, usable:Math.max(0, total - 2),
    first:dot(net + 1), last:dot(bc - 1), octets:oct, netOct:dot(net).split('.').map(Number), bcOct:dot(bc).split('.').map(Number),
    maskOct:dot(mask).split('.').map(Number), k, inOct, block};
}
const SUBNET_EXAMPLE = ['192.168.1.77', 27];   /* the lesson's worked example */
const bin8 = v=>v.toString(2).padStart(8, '0');
const PV = [128, 64, 32, 16, 8, 4, 2, 1];
const pvSum = v=>PV.filter(b=>v & b).join('+') || '0';
const nBits = n=>n === 1 ? '1 bit' : n+' bits';

function subnetScene(ip, prefix){
  /* the captions are written for a split inside the last octet (/25 to /30), like the lesson's example */
  if(!(prefix >= 25 && prefix <= 30)) throw new Error('subnetScene expects a /25 to /30 example');
  const m = subnetMath(ip, prefix), host = 32 - prefix, k = 3, o = m.octets[k], inN = prefix - 24;
  const W = 320, CW = 18, P = 19, OG = 12, X0 = (W - (8 * P - 1) * 2 - OG) / 2, Y0 = [32, 88];
  const at = b=>{ const q = b >> 3; return {x: X0 + (q & 1) * (8 * P - 1 + OG) + (b & 7) * P, y: Y0[q >> 1]}; };
  const els = [['text', 'head', {x:W/2, y:20, 'text-anchor':'middle', 'data-base':'sc-head'}, ip+' /'+prefix]];
  /* the full address: 32 bits in two rows of two octets */
  for(let b=0; b<32; b++){
    const {x, y} = at(b);
    els.push(['rect', 'c'+b, {x, y, width:CW, height:22, rx:2, 'data-base':'sc-cell'}]);
    els.push(['text', 'b'+b, {x:x + CW/2, y:y + 16, 'text-anchor':'middle', 'data-base':'sc-bitt'}, m.bits[b]]);
  }
  for(let q=0; q<4; q++){
    const {x, y} = at(q * 8), nb = Math.max(0, Math.min(8, prefix - q * 8));
    els.push(['text', 'o'+q, {x:x + (8 * P - 1)/2, y:y + 41, 'text-anchor':'middle', 'data-base':'sc-oct'}, m.octets[q]]);
    if(nb) els.push(['rect', 'bar'+q, {x, y:y + 25, width:nb * P - 1, height:3, 'data-base':'sc-bar', style:'transition-delay:'+(q * 40)+'ms'}]);
  }
  /* zoom: place values on top (staggered over two lines so 128 and 64 never touch), then the last octet, the mask's
     last octet, and the result of combining them */
  const ZX = 90, ZP = 21, ZW = 19, ZY = [202, 230, 270];
  const rows = [['za', 'address', bin8(o), o], ['zm', 'mask', bin8(m.maskOct[k]), m.maskOct[k]], ['zr', 'network', bin8(m.netOct[k]), m.netOct[k]]];
  els.push(['text', 'ztitle', {x:W/2, y:152, 'text-anchor':'middle', 'data-base':'sc-sub'}, 'last octet, zoomed in']);
  PV.forEach((v, i)=>els.push(['text', 'pv'+i, {x:ZX + i * ZP + ZW/2, y:i & 1 ? 194 : 174, 'text-anchor':'middle', 'data-base':'sc-tick'}, v]));
  rows.forEach(([id, label, bits, val], r)=>{
    els.push(['text', id+'l', {x:4, y:ZY[r] + 16, 'data-base':'sc-lab'}, label]);
    for(let i=0; i<8; i++){
      els.push(['rect', id+'c'+i, {x:ZX + i * ZP, y:ZY[r], width:ZW, height:22, rx:2, 'data-base':'sc-cell', style:r === 2 ? 'transition-delay:'+(i * 90)+'ms' : ''}]);
      els.push(['text', id+'t'+i, {x:ZX + i * ZP + ZW/2, y:ZY[r] + 16, 'text-anchor':'middle', 'data-base':'sc-bitt', style:r === 2 ? 'transition-delay:'+(i * 90)+'ms' : ''}, bits[i]]);
    }
    els.push(['text', id+'v', {x:W - 6, y:ZY[r] + 16, 'text-anchor':'end', 'data-base':'sc-val'}, '= '+val]);
  });
  els.push(['line', 'zrule', {x1:ZX, y1:262, x2:ZX + 8 * ZP - 2, y2:262, 'data-base':'sc-rule'}]);
  /* number line: the octet from 0 to 255 cut into blocks; this address's block highlighted */
  const NX = 10, NW = 300, NY = 328, vx = v=>NX + v * NW / 256, lo = m.netOct[k], hi = m.bcOct[k];
  els.push(['rect', 'nblock', {x:vx(lo), y:NY - 14, width:vx(hi + 1) - vx(lo), height:14, 'data-base':'sc-block'}]);
  els.push(['line', 'nline', {x1:NX, y1:NY, x2:NX + NW, y2:NY, 'data-base':'sc-rule'}]);
  for(let v=0; v<=256; v+=m.block){
    els.push(['line', 'nt'+v, {x1:vx(v), y1:NY - 4, x2:vx(v), y2:NY + 4, 'data-base':'sc-rule'}]);
    if(v < 256 && (m.block >= 32 || v % 64 === 0)) els.push(['text', 'nl'+v, {x:vx(v), y:NY + 17, 'text-anchor':'middle', 'data-base':'sc-tick'}, v]);
  }
  els.push(['text', 'nmark', {x:vx(o) + (vx(o + 1) - vx(o))/2, y:NY - 18, 'text-anchor':'middle', 'data-base':'sc-mark'}, '▼ '+o]);
  els.push(['text', 'res1', {x:W/2, y:370, 'text-anchor':'middle', 'data-base':'sc-res'}, '']);
  els.push(['text', 'res2', {x:W/2, y:392, 'text-anchor':'middle', 'data-base':'sc-sub'}, '']);

  const all = f=>{ const r = {}; for(let b=0; b<32; b++) Object.assign(r, f(b)); return r; };
  const isNet = b=>b < prefix, inNet = i=>i < inN;
  const group = (n, f)=>{ const r = {}; for(let i=0; i<n; i++) Object.assign(r, f(i)); return r; };
  const known = new Set(els.map(e=>e[1]));
  const to = (ids, c)=>Object.fromEntries(ids.filter(i=>known.has(i)).map(i=>[i, {c}]));
  const ticks = Array.from({length:256 / m.block + 1}, (_, j)=>j * m.block);
  /* before the zoom and the number line are used, their outlines show faintly (no bits or values given away) */
  const outline = ['zrule', 'nline'].concat(...rows.map(([id])=>Array.from({length:8}, (_, i)=>id+'c'+i)), ticks.map(v=>'nt'+v));
  const hidden = ['ztitle', 'nblock', 'nmark', 'res1', 'res2'].concat(PV.map((_, i)=>'pv'+i), ...rows.map(([id])=>[id+'l', id+'v'].concat(Array.from({length:8}, (_, i)=>id+'t'+i))), ticks.map(v=>'nl'+v));
  const bars = {}; for(let q=0; q<4; q++) if(prefix - q * 8 > 0) bars['bar'+q] = {c:'on'};
  const tail = s=>'.'+s.split('.').pop(), first3 = m.octets.slice(0, 3).join('.');
  const netPart = bin8(o).slice(0, inN), lastNetCol = 'pv'+(inN - 1);
  const steps = [
    {say: 'Here is '+ip+' as 32 bits, in four octets. The /'+prefix+' says where to cut them: the first '+prefix+' bits name the network, the last '+host+' name one device on that network.',
     set: Object.assign(to(outline, 'ghost'), to(hidden, 'hide'))},
    {say: 'Solid cells with a bar under them are the '+prefix+' network bits: all of '+first3+' plus the first '+nBits(inN)+' of '+o+'. Every address in this subnet shares them. Only the '+host+' dashed bits can change.',
     set: Object.assign({}, bars, all(b=>({['c'+b]:{c:isNet(b) ? 'net' : 'host'}})))},
    {say: 'Zoom into the last octet, where the cut falls. '+o+' = '+pvSum(o)+' = '+bin8(o)+'. The first '+nBits(inN)+' ('+netPart+') are network and stay fixed; the last '+host+' ('+bin8(o).slice(inN)+', dashed) pick the device.',
     set: Object.assign(to(['ztitle', 'zal', 'zav'].concat(PV.map((_, i)=>'pv'+i)), ''), group(8, i=>({['zac'+i]:{c:inNet(i) ? 'net' : 'host'}, ['zat'+i]:{c:''}})))},
    {say: 'The subnet mask writes the cut as bits: 1 under each network bit, 0 under each device bit. '+bin8(m.maskOct[k])+' = '+pvSum(m.maskOct[k])+' = '+m.maskOct[k]+', so the mask is '+m.mask+' ('+prefix+' ones, then '+host+' zeros).',
     set: Object.assign(to(['zml', 'zmv'], ''), group(8, i=>({['zmc'+i]:{c:inNet(i) ? 'net' : 'host'}, ['zmt'+i]:{c:''}})))},
    {say: 'The network row is address AND mask, column by column: 1 only if both bits above are 1. Under the mask\'s 1s, 1 AND x = x, so the address bits copy straight down: '+netPart+'.',
     set: Object.assign(to(['zrl', 'zrule'], ''), group(8, i=>inNet(i) ? {['zrc'+i]:{c:'net'}, ['zrt'+i]:{c:''}} : {}))},
    {say: 'Under the mask\'s 0s, 0 AND x = 0 whatever the address bit was, so all '+host+' device bits become 0. That is the job of the mask: keep the network part, wipe the device part.',
     set: group(8, i=>inNet(i) ? {} : {['zrc'+i]:{c:'host'}, ['zrt'+i]:{c:'focus'}})},
    {say: bin8(m.netOct[k])+' = '+m.netOct[k]+': '+(m.netOct[k] ? 'only '+pvSum(m.netOct[k])+' is left on' : 'no bits are left on')+'. So the network address is '+m.net+', the first address in the subnet. It is the subnet\'s name, so it is never given to a device.',
     set: {zrv:{c:'focus', t:'= '+m.netOct[k]}, res1:{c:'', t:'network = '+m.net}}},
    {say: 'Keep the network bits '+netPart+' and set all '+host+' device bits to 1: '+bin8(m.bcOct[k])+' = '+m.netOct[k]+'+'+(m.block - 1)+' = '+m.bcOct[k]+'. That is the broadcast address '+m.bc+', the last in the subnet: a packet sent there goes to every device on it.',
     set: Object.assign({zrl:{t:'broadcast'}, zrv:{c:'focus', t:'= '+m.bcOct[k]}, res1:{c:'', t:'network '+tail(m.net)+' · broadcast '+tail(m.bc)}},
       group(8, i=>inNet(i) ? {} : {['zrt'+i]:{t:1, c:'focus'}}))},
    {say: host+' device bits make 2^'+host+' = '+m.total+' addresses, so the octet is cut into blocks of '+m.block+'.\nShortcut: 256 − '+m.maskOct[k]+' (the mask) = '+m.block+'.\nBlocks start at 0, '+m.block+', '+2 * m.block+', '+3 * m.block+'… and '+o+' lands in '+lo+' to '+hi+'.',
     set: Object.assign(to(['nblock', 'nmark', 'nline'].concat(ticks.map(v=>'nt'+v), ticks.map(v=>'nl'+v)), ''),
       {[lastNetCol]:{c:'focus'}}, known.has('nl'+lo) ? {['nl'+lo]:{c:'focus'}} : {}, known.has('nl'+(hi + 1)) ? {['nl'+(hi + 1)]:{c:'focus', t:hi}} : {})},
    {say: 'Inside the block: '+tail(m.net)+' is the network, '+tail(m.bc)+' the broadcast, and the '+m.usable+' addresses between them ('+tail(m.first)+' to '+tail(m.last)+') can go to devices. '+tail(ip)+' is one of them, so it is a valid device address.',
     set: {[lastNetCol]:{c:''}, res1:{c:'', t:m.total+' addresses − 2 = '+m.usable+' usable'}, res2:{c:'', t:'devices: '+tail(m.first)+' to '+tail(m.last)}}}
  ];
  return {id:'subnet', title:'Subnetting '+ip+'/'+prefix, label:'The bits of '+ip+' split at /'+prefix+', place values, the mask, the AND that gives the network address, and the address block on a number line',
    w:W, h:400, els, steps, math:m, tryIt:subnetTry};
}

/* Try it: any address and prefix, worked out live with the same maths */
function subnetTry(box){
  box.innerHTML = '<h3>Try it yourself</h3><div class="row try-in">'+
    '<label>Address <input class="typed" data-k="ip" value="'+SUBNET_EXAMPLE[0]+'" inputmode="decimal" autocomplete="off" spellcheck="false" aria-describedby="trymsg"></label>'+
    '<label>Prefix <span data-k="pv">/'+SUBNET_EXAMPLE[1]+'</span><input type="range" data-k="p" min="8" max="30" value="'+SUBNET_EXAMPLE[1]+'"></label></div>'+
    '<p class="small" id="trymsg" data-k="msg" aria-live="polite"></p><div class="try-out" data-k="out"></div>';
  const q = k=>box.querySelector('[data-k="'+k+'"]');
  const update = ()=>{
    const ip = q('ip').value.trim(), p = +q('p').value;
    q('pv').textContent = '/'+p;
    if(!/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.test(ip) || ip.split('.').some(x=>+x > 255)){
      q('msg').textContent = 'Type an address like 10.0.5.200 (four numbers from 0 to 255).'; q('out').innerHTML = ''; return;
    }
    const m = subnetMath(ip, p), k = m.k, inOct = m.inOct, copy = k === 1 ? 'octet 1 copies' : 'octets 1 to '+k+' copy';
    /* a prefix on an octet boundary (/8, /16, /24) needs no binary: whole octets copy, the rest are 0 or 255 */
    q('msg').textContent = inOct
      ? 'The cut is '+nBits(inOct)+' into octet '+(k + 1)+', so that is the octet to work out in binary.'+(k ? ' Before it, '+copy+' into the network unchanged.' : '')
      : '/'+p+' ends exactly between octet '+k+' and octet '+(k + 1)+': '+copy+' into the network unchanged; the rest become 0 (network) or 255 (broadcast). No binary needed.';
    const row = (label, v, bits)=>'<tr><th scope="row">'+label+'</th><td><code>'+bits+'</code></td><td>'+v+'</td></tr>';
    q('out').innerHTML = '<table><tbody>'+
      row('octet '+(k + 1)+' of the address', m.octets[k], bin8(m.octets[k]))+
      row('mask', m.maskOct[k], bin8(m.maskOct[k]))+
      row('address AND mask = network', m.netOct[k], bin8(m.netOct[k]))+
      row('device bits all 1 = broadcast', m.bcOct[k], bin8(m.bcOct[k]))+
      '</tbody></table><ul class="clean">'+
      '<li>Mask: <b>'+m.mask+'</b> · '+(inOct ? 'subnets start every <b>'+m.block+'</b> in octet '+(k + 1)+' (256 − '+m.maskOct[k]+')' : 'subnets step by <b>1</b> in octet '+k)+'</li>'+
      (k < 3 ? '<li>Octets after octet '+(k + 1)+': 0 in the network, 255 in the broadcast.</li>' : '')+
      '<li>Network: <b>'+m.net+'</b> · broadcast: <b>'+m.bc+'</b></li>'+
      '<li>Devices: <b>'+m.first+'</b> to <b>'+m.last+'</b> (<b>'+m.usable.toLocaleString('en-US')+'</b> usable of '+m.total.toLocaleString('en-US')+')</li></ul>';
  };
  box.addEventListener('input', update);
  update();
}
SCENES['quiz:net:Subnetting'] = subnetScene(SUBNET_EXAMPLE[0], SUBNET_EXAMPLE[1]);

/* ---------- drawing helpers for the scenes below: each returns one [tag, id, attrs, text?, parentId?] entry ---------- */
/* SVG collapses repeated spaces, so columns are separate text elements, never padded strings */
const scR = (id, x, y, w, h, base, g)=>['rect', id, {x, y, width:w, height:h, rx:3, 'data-base':base}, null, g];
const scT = (id, x, y, text, base, anchor, g)=>['text', id, Object.assign({x, y, 'data-base':base}, anchor ? {'text-anchor':anchor} : {}), text, g];
const scG = id=>['g', id, {'data-base':'sc-g'}];
const scC = (ids, c)=>Object.fromEntries(ids.map(i=>[i, {c}]));          /* the same class on several elements */
const scY = (y, x)=>({transform:'translate('+(x || 0)+'px,'+y+'px)'});  /* moves a <g>; the move animates */
const scOK = ok=>ok ? '✓' : '✗';
/* a Try it panel: heading, the inputs, a live message and an output area; returns a query helper */
function scTryBox(box, inputs){
  box.innerHTML = '<h3>Try it yourself</h3><div class="row try-in">'+inputs+'</div>'+
    '<p class="small" id="trymsg" data-k="msg" aria-live="polite"></p><div class="try-out" data-k="out"></div>';
  return k=>box.querySelector('[data-k="'+k+'"]');
}

/* ---------- Permissions: reading -rw-------, the one set Linux applies to you, chown, chmod 640, and why not 777 ---------- */
const PERM_EXAMPLE = {file:'config.yml', owner:'root', group:'root', newGroup:'www-data', user:'www-data', from:0o600, to:0o640};
const PERM_SETS = ['owner', 'group', 'others'];
function permMath(mode){
  const sets = [6, 3, 0].map(s=>(mode >> s) & 7);
  const sym = sets.map(d=>(d & 4 ? 'r' : '-')+(d & 2 ? 'w' : '-')+(d & 1 ? 'x' : '-'));
  return {sets, sym, str:sym.join(''), digits:sets.join(''), sum:sets.map(d=>[4, 2, 1].filter(b=>d & b).join('+') || '0')};
}
/* Linux applies exactly one set: the owner's if you own the file, else the group's if you are in its group, else
   the others' set. It never falls through to a later set, even one that grants more. */
const permWho = (user, groups, owner, group)=>user === owner ? 0 : groups.includes(group) ? 1 : 2;

function permScene(){
  const E = PERM_EXAMPLE, W = 320, a = permMath(E.from), b = permMath(E.to), all7 = permMath(0o777);
  const CW = 24, CP = 27, CY = 80, GX = g=>49 + g * 90, CX = (g, i)=>GX(g) + i * CP;
  const els = [scT('cmd', W/2, 20, '$ ls -l '+E.file, 'sc-sub', 'middle'), scT('ls', W/2, 46, '-'+a.str+' '+E.owner+' '+E.group, 'sc-code', 'middle'),
    scR('ty', 13, CY, CW, 28, 'sc-cell'), scT('tyt', 13 + CW/2, CY + 19, '-', 'sc-bitt', 'middle')];
  const pvIds = [];
  for(let g=0; g<3; g++){
    for(let i=0; i<3; i++){
      els.push(scT('pv'+g+i, CX(g, i) + CW/2, CY - 6, [4, 2, 1][i], 'sc-tick', 'middle'), scR('p'+g+i, CX(g, i), CY, CW, 28, 'sc-cell'),
        scT('pt'+g+i, CX(g, i) + CW/2, CY + 19, a.sym[g][i], 'sc-bitt', 'middle'));
      pvIds.push('pv'+g+i);
    }
    const mid = GX(g) + (3 * CP - 3)/2;
    els.push(scT('sl'+g, mid, CY + 48, PERM_SETS[g], 'sc-lab', 'middle'), scT('sw'+g, mid, CY + 68, [E.owner, E.group, 'the rest'][g], 'sc-sub', 'middle'),
      scT('sd'+g, mid, CY + 92, '', 'sc-val', 'middle'));
  }
  els.push(scT('mode', W/2, CY + 118, '', 'sc-res', 'middle'), scT('who', W/2, 222, 'the app runs as '+E.user, 'sc-sub', 'middle'));
  const QT = ['1 owner: '+E.owner, '2 group: '+E.group, '3 everyone else'];
  QT.forEach((t, q)=>els.push(scR('q'+q, 8, 232 + q * 30, 304, 26, 'sc-box'), scT('qt'+q, 16, 250 + q * 30, t, 'sc-code'), scT('qr'+q, 304, 250 + q * 30, '', 'sc-val', 'end')));
  els.push(scT('res', W/2, 344, '', 'sc-res', 'middle'));

  /* the cells for a mode: granted bits filled; in the 777 picture the others set is marked as the danger */
  const cells = (p, warn)=>{ const r = {}; for(let g=0; g<3; g++) for(let i=0; i<3; i++){ const on = p.sym[g][i] !== '-';
    r['p'+g+i] = {c:on ? (warn && g === 2 ? 'net bad' : 'net') : ''}; r['pt'+g+i] = {t:p.sym[g][i], c:on ? '' : 'dim'}; } return r; };
  const digits = p=>Object.fromEntries([0, 1, 2].map(g=>['sd'+g, {c:'', t:p.sum[g] === String(p.sets[g]) ? p.sets[g] : p.sum[g]+' = '+p.sets[g]}]));
  /* the three checks, in order: the one that applies is marked, the ones after it are never looked at */
  const ladder = (gi, res)=>{ const r = {who:{c:''}};
    for(let q=0; q<3; q++){ r['q'+q] = {c:q === gi ? 'hit' : q > gi ? 'skip' : ''}; r['qt'+q] = {c:q > gi ? 'skip' : ''};
      r['qr'+q] = {c:q > gi ? 'skip' : q === gi ? 'focus' : '', t:q < gi ? 'no' : q === gi ? res : 'not checked'}; }
    return r; };
  const file = (p, grp)=>({ls:{t:'-'+p.str+' '+E.owner+' '+grp}, mode:{c:'', t:'mode '+p.digits}});
  const who = permWho(E.user, [E.user], E.owner, E.group), whoAfter = permWho(E.user, [E.user], E.owner, E.newGroup);
  const rights = (p, g)=>'read '+scOK(p.sets[g] & 4)+'  write '+scOK(p.sets[g] & 2)+'  run '+scOK(p.sets[g] & 1);
  const steps = [
    {say: 'ls -l shows -'+a.str+' '+E.owner+' '+E.group+'. The first character is the file type (- means a regular file). The next 9 are three sets of r, w, x: the owner\'s, the group\'s and everyone else\'s.',
     set: scC(['who', 'q0', 'qt0', 'qr0', 'q1', 'qt1', 'qr1', 'q2', 'qt2', 'qr2', 'res', 'mode', 'sd0', 'sd1', 'sd2'].concat(pvIds), 'hide')},
    {say: 'The owner, '+E.owner+', has '+a.sym[0]+': read and write, but no x (execute). The group set and the others set are both ---, no access at all. The file\'s group is also '+E.group+'.',
     set: cells(a)},
    {say: 'Each set is a 3-bit number: r = 4, w = 2, x = 1, added up. '+a.sym[0]+' = '+a.sum[0]+' = '+a.sets[0]+' and --- = 0, so -'+a.str+' is mode '+a.digits+', always read as owner, group, others.',
     set: Object.assign(scC(pvIds, ''), digits(a), file(a, E.group))},
    {say: 'The app runs as '+E.user+': not '+E.owner+', and not in the file\'s group ('+E.group+'). Which of the three sets does Linux give it?',
     ask:{options:[['owner set ('+a.sym[0]+')', false], ['group set ('+a.sym[1]+')', false], ['others set ('+a.sym[2]+')', true]]}, set:{}},
    {say: 'The app runs as '+E.user+'. Linux applies exactly one set: the owner\'s if you own the file, else the group\'s if you\'re in its group, else everyone else\'s. '+E.user+' is neither, so it gets ---: denied.',
     set: Object.assign(ladder(who, '---: denied'), {res:{c:'', t:rights(a, who)}})},
    {say: 'sudo chown '+E.owner+':'+E.newGroup+' '+E.file+' makes '+E.newGroup+' the file\'s group. Now check 2 matches, so the group set applies, but it is still ---.\nchown alone doesn\'t fix it.',
     set: Object.assign(ladder(whoAfter, 'yes: '+a.sym[1]), file(a, E.newGroup), {cmd:{t:'# chown '+E.owner+':'+E.newGroup+' '+E.file}, sw1:{t:E.newGroup}, qt1:{c:'', t:'2 group: '+E.newGroup}, res:{t:rights(a, whoAfter)}})},
    {say: 'chmod 640 sets each set from one digit: 6 = 4+2 = rw- for the owner, 4 = r-- for the group, 0 = --- for others. Exactly one bit changed: the group\'s r.',
     set: Object.assign(cells(b), digits(b), file(b, E.newGroup), {cmd:{t:'# chmod '+b.digits+' '+E.file}})},
    {say: 'After chown and chmod '+b.digits+', the app ('+E.user+', now in the file\'s group) tries again. What can it do with the config?',
     ask:{options:[['read and change it', false], ['read only', true], ['nothing', false]]}, set:{}},
    {say: 'Check again: '+E.user+' isn\'t the owner but is in the group, so it gets '+b.sym[1]+' and Linux stops looking. The app can read the config, can\'t change it, and nobody else can read it.',
     set: Object.assign(ladder(whoAfter, 'yes: '+b.sym[1]), {res:{t:rights(b, whoAfter)}})},
    {say: 'chmod 777 would also stop the error, but the last set becomes rwx: every user and process on the server could read and rewrite the config. That swaps one bug for a security hole.',
     set: Object.assign(cells(all7, true), digits(all7), file(all7, E.newGroup), ladder(whoAfter, 'yes: rwx'), {cmd:{t:'# chmod 777 '+E.file+'  (don\'t)'}, res:{t:'anyone: read ✓  write ✓  run ✓'}})},
    {say: 'So 640 is least privilege: root can edit, the app\'s group can only read, everyone else gets nothing. Fix who owns the file first, then grant the smallest set that works.',
     set: Object.assign(cells(b), digits(b), file(b, E.newGroup), ladder(whoAfter, 'yes: '+b.sym[1]), {cmd:{t:'# chmod '+b.digits+' '+E.file}, res:{t:rights(b, whoAfter)}})}
  ];
  return {id:'perm', title:'Reading and fixing '+E.file+' permissions', label:'The permission string -rw------- split into owner, group and others sets, their numbers, which set the app gets, and the change to 640',
    w:W, h:356, els, steps, tryIt:permTry};
}

function permTry(box){
  const q = scTryBox(box, '<label>chmod <input class="typed" data-k="m" value="640" inputmode="numeric" maxlength="3" autocomplete="off" spellcheck="false" aria-describedby="trymsg"></label>'+
    '<label>Who is asking <select data-k="who"><option value="0">the owner</option><option value="1" selected>someone in the group</option><option value="2">anyone else</option></select></label>');
  const update = ()=>{
    const v = q('m').value.trim(), who = +q('who').value;
    if(!/^[0-7]{3}$/.test(v)){ q('msg').textContent = 'Type three digits from 0 to 7: owner, group, others (like 640).'; q('out').innerHTML = ''; return; }
    const p = permMath(parseInt(v, 8)), d = p.sets[who];
    q('msg').textContent = 'ls -l would show -'+p.str+'. Linux checks owner, then group, then others, and uses only the first that fits you.';
    const row = g=>'<tr><th scope="row">'+PERM_SETS[g]+(g === who ? ' (applies)' : '')+'</th><td><code>'+p.sym[g]+'</code></td><td>'+(p.sum[g] === String(p.sets[g]) ? p.sets[g] : p.sum[g]+' = '+p.sets[g])+'</td></tr>';
    const notes = [];
    if(p.sets[2] & 2) notes.push('Anyone on the server can change this file. For config and keys, others should be 0.');
    if(p.sets.some((s, g)=>g > 0 && (s & ~p.sets[0] & 7))) notes.push('The owner has fewer rights than another set. Linux doesn\'t fall through: the owner still gets only the owner set.');
    q('out').innerHTML = '<table><tbody>'+row(0)+row(1)+row(2)+'</tbody></table><ul class="clean">'+
      '<li>'+['The owner', 'Someone in the group', 'Anyone else'][who]+' gets <code>'+p.sym[who]+'</code>: read <b>'+(d & 4 ? 'yes' : 'no')+'</b> · write <b>'+(d & 2 ? 'yes' : 'no')+'</b> · run <b>'+(d & 1 ? 'yes' : 'no')+'</b></li>'+
      notes.map(n=>'<li>'+n+'</li>').join('')+'</ul>';
  };
  box.addEventListener('input', update); box.addEventListener('change', update);
  update();
}

/* ---------- Firewalls: packets walk the rule table top down, the first match decides; then two rules swap ---------- */
const FW_RULES = [{act:'allow', src:'10.0.5.0/24', port:22}, {act:'deny', src:'any', port:22}, {act:'allow', src:'any', port:443}, {act:'deny', src:'any', port:'any'}];
function fwMatch(r, ip, port){
  const [net, bits] = r.src.split('/');
  return {src:r.src === 'any' || subnetMath(ip, +bits).net === subnetMath(net, +bits).net, port:r.port === 'any' || r.port === port};
}
/* rules in the order given; returns the index of the first match (-1 if none) and what each rule checked up to it */
function fwEval(rules, ip, port){
  const trace = [];
  for(let i=0; i<rules.length; i++){ const m = fwMatch(rules[i], ip, port); trace.push(m); if(m.src && m.port) return {hit:i, trace}; }
  return {hit:-1, trace};
}
const FW_PACKETS = [['10.0.5.20', 22], ['198.51.100.7', 22], ['198.51.100.7', 443], ['198.51.100.7', 3389]];

function fwScene(){
  const W = 320, RY = j=>70 + j * 36, els = [scR('pk', 8, 8, 304, 30, 'sc-box'), scT('pkt', W/2, 28, '', 'sc-code', 'middle')];
  [['#', 18], ['rule', 38], ['source', 94], ['port', 200], ['check', 304]].forEach(([t, x], i)=>els.push(scT('th'+i, x, 62, t, 'sc-tick', i === 4 ? 'end' : '')));
  els.push(scG('pg'), scT('ptr', 0, 20, '▶', 'sc-mark', '', 'pg'));
  FW_RULES.forEach((r, i)=>{
    els.push(scG('r'+i), scR('rb'+i, 12, 0, 300, 30, 'sc-box', 'r'+i), scT('rn'+i, 18, 20, i + 1, 'sc-lab', '', 'r'+i), scT('ra'+i, 38, 20, r.act, 'sc-val', '', 'r'+i),
      scT('rs'+i, 94, 20, r.src, 'sc-code', '', 'r'+i), scT('rp'+i, 200, 20, r.port, 'sc-code', '', 'r'+i), scT('rr'+i, 304, 20, '', 'sc-val', 'end', 'r'+i));
  });
  els.push(scT('vd', W/2, 234, '', 'sc-res', 'middle'));
  for(let i=0; i<5; i++) els.push(scT('lg'+i, W/2, 262 + i * 20, '', 'sc-code', 'middle'));

  const order0 = [0, 1, 2, 3], swapped = [1, 0, 2, 3];
  /* rows sit in their slots; a rule's number is its slot, so swapping renumbers them */
  const place = order=>{ const r = {}; order.forEach((i, j)=>{ r['r'+i] = {c:'', s:scY(RY(j))}; r['rb'+i] = {c:''}; r['rn'+i] = {t:j + 1}; r['rr'+i] = {c:'', t:''}; }); return r; };
  /* one packet through the rules in this order; 'decide' false shows only the checks up to the match */
  const run = (ip, port, order, decide)=>{
    const ev = fwEval(order.map(i=>FW_RULES[i]), ip, port), hit = ev.hit, rule = FW_RULES[order[hit]];
    const r = Object.assign(place(order), {pk:{c:''}, pkt:{c:'', t:ip+' → port '+port}, pg:{c:'', s:scY(RY(hit))}});
    order.forEach((i, j)=>{
      const t = ev.trace[j];
      if(j < hit) r['rr'+i] = {c:'bad', t:t.src ? '✗ port' : '✗ source'};
      else if(j === hit){ r['rr'+i] = {c:'ok', t:'✓ match'}; r['rb'+i] = {c:decide ? (rule.act === 'allow' ? 'ok' : 'bad') : 'hit'}; }
      else if(decide){ r['r'+i].c = 'skip'; r['rr'+i] = {c:'', t:'not read'}; }
    });
    r.vd = decide ? {c:'', t:(rule.act === 'allow' ? 'allowed' : 'denied')+' by rule '+(hit + 1)} : {c:'hide'};
    return {r, rule, hit};
  };
  const logLine = (n, ip, port, order, before)=>{ const {rule, hit} = run(ip, port, order, true); return {['lg'+n]:{c:'', t:(before || '')+ip+':'+port+' → '+rule.act+(before ? '' : ' (rule '+(hit + 1)+')')}}; };
  const P = FW_PACKETS, go = (k, order, decide)=>run(P[k][0], P[k][1], order || order0, decide).r;
  const quiet = scC(['pk', 'pkt', 'pg', 'vd'], 'hide');
  const steps = [
    {say: 'This firewall (like iptables or a network ACL) checks each packet against its rules from the top down; the first match decides.\nNote: AWS security groups differ: allow-only, no order.',
     set: Object.assign(place(order0), quiet, scC(['lg0', 'lg1', 'lg2', 'lg3', 'lg4'], 'hide'))},
    {say: 'Packet: '+P[0][0]+' to port '+P[0][1]+'.\nRule 1: is '+P[0][0]+' in 10.0.5.0/24? Yes: /24 means the first three numbers (10.0.5) must match, and they do.\nPort 22 matches too.',
     set: go(0, order0, false)},
    {say: 'First match wins: rule 1 allows it, and rules 2 to 4 are never read, not even the deny for port 22 right below it. That deny only sees packets rule 1 lets past.',
     set: Object.assign(go(0, order0, true), logLine(0, P[0][0], P[0][1], order0))},
    {say: 'Next packet: '+P[1][0]+' to port 22. Which rule decides what happens to it?',
     ask:{options:[['rule 1 (allow)', false], ['rule 2 (deny)', true], ['rule 4 (deny all)', false]]},
     set: Object.assign(place(order0), {pk:{c:''}, pkt:{c:'', t:P[1][0]+' → port '+P[1][1]}, pg:{c:'hide'}, vd:{c:'hide'}})},
    {say: 'Packet: '+P[1][0]+' to port 22.\nRule 1: not in 10.0.5.0/24, so no match; move down.\nRule 2: any source, port 22: a match, so it is denied.\nOnly the admin subnet gets SSH.',
     set: Object.assign(go(1, order0, true), logLine(1, P[1][0], P[1][1], order0))},
    {say: 'Same sender, port 443 (HTTPS). Rule 1 fails on source, rule 2 on port (it is for 22 only). Rule 3 allows any source on 443, so the packet is allowed.',
     set: Object.assign(go(2, order0, true), logLine(2, P[2][0], P[2][1], order0))},
    {say: 'Port 3389 (Remote Desktop) fails rules 1 to 3 on port and reaches rule 4: deny any source, any port. Anything no rule above allows ends here.',
     set: Object.assign(go(3, order0, true), logLine(3, P[3][0], P[3][1], order0))},
    {say: 'Now swap rules 1 and 2, so "deny any source to port 22" is on top. The rules themselves are unchanged; only their order is different.',
     set: Object.assign(place(swapped), quiet)},
    {say: 'With rules 1 and 2 swapped, '+P[0][0]+' sends to port 22 again. What happens to it now?',
     ask:{options:[['allowed', false], ['denied', true]]},
     set: {pk:{c:''}, pkt:{c:'', t:P[0][0]+' → port '+P[0][1]}}},
    {say: P[0][0]+' to port 22 again. The deny is checked first, and any source on port 22 matches it, so the admins are blocked too. The allow below is never read.',
     set: Object.assign(go(0, swapped, true), logLine(4, P[0][0], P[0][1], swapped, 'swapped: '))},
    {say: 'So order is part of the rule set: specific rules (one subnet) above broad ones (any source), and a deny-all at the bottom. Read every rule set from the top.',
     set: Object.assign(place(order0), quiet)}
  ];
  return {id:'fw', title:'First match wins', label:'Four firewall rules checked top down for four packets, then rules 1 and 2 swapped so the deny blocks the admins',
    w:W, h:352, els, steps, tryIt:fwTry};
}

function fwTry(box){
  const q = scTryBox(box, '<label>Source <input class="typed" data-k="ip" value="10.0.5.20" inputmode="decimal" autocomplete="off" spellcheck="false" aria-describedby="trymsg"></label>'+
    '<label>Port <input class="typed" data-k="port" value="22" inputmode="numeric" autocomplete="off" style="width:6em"></label>'+
    '<label><input type="checkbox" data-k="sw"> swap rules 1 and 2</label>');
  const update = ()=>{
    const ip = q('ip').value.trim(), port = +q('port').value, order = q('sw').checked ? [1, 0, 2, 3] : [0, 1, 2, 3];
    if(!/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.test(ip) || ip.split('.').some(x=>+x > 255) || !(port >= 1 && port <= 65535 && Number.isInteger(port))){
      q('msg').textContent = 'Type an address like 203.0.113.9 and a port from 1 to 65535.'; q('out').innerHTML = ''; return; }
    const rules = order.map(i=>FW_RULES[i]), ev = fwEval(rules, ip, port);
    q('msg').textContent = 'Checked from rule 1 down; the first match decides.';
    q('out').innerHTML = '<ol>'+rules.map((r, j)=>{
      const t = ev.trace[j], head = '<code>'+r.act+' '+r.src+' port '+r.port+'</code>';
      return '<li>'+head+' · '+(j < ev.hit ? 'no match ('+(t.src ? 'port' : 'source')+'), next' : j === ev.hit ? '<b>match: '+r.act+'</b>' : 'not read')+'</li>';
    }).join('')+'</ol><p><b>'+(ev.hit < 0 ? 'No rule matched' : (rules[ev.hit].act === 'allow' ? 'Allowed' : 'Denied')+' by rule '+(ev.hit + 1))+'</b></p>';
  };
  box.addEventListener('input', update); box.addEventListener('change', update);
  update();
}

/* ---------- SSH hardening: sshd keeps the first value it reads, and Include pulls drop-ins in before the rest ---------- */
const SSHD_MAIN = {name:'sshd_config', lines:['Include sshd_config.d/*.conf', 'PermitRootLogin no', 'PasswordAuthentication no']};
const SSHD_CLOUD = {name:'50-cloud-init.conf', lines:['PasswordAuthentication yes']};
const SSHD_FIX = {name:'10-hardening.conf', lines:['PasswordAuthentication no']};
/* The order sshd reads lines in, and the value it keeps for each setting (the first one; keywords ignore case).
   Include reads the matching drop-ins right there, sorted by name; only names ending .conf match. */
function sshdRead(main, dropins){
  const order = [], settings = {};
  const read = (file, line)=>{
    const [k, ...v] = line.trim().split(/\s+/), key = k.toLowerCase();
    if(key === 'include'){
      order.push({file, line, status:'include'});
      dropins.filter(d=>/\.conf$/.test(d.name)).sort((x, y)=>x.name < y.name ? -1 : x.name > y.name ? 1 : 0).forEach(d=>d.lines.forEach(l=>read(d.name, l)));
      return;
    }
    const first = !(key in settings);
    if(first) settings[key] = {key:k, value:v.join(' '), file};
    order.push({file, line, key, status:first ? 'kept' : 'ignored'});
  };
  main.lines.forEach(l=>read(main.name, l));
  return {order, settings};
}

function sshdScene(){
  const W = 320, M = SSHD_MAIN, C = SSHD_CLOUD, F = SSHD_FIX, PA = 'passwordauthentication';
  const before = sshdRead(M, [C]), after = sshdRead(M, [C, F]);
  /* every line that can appear, in the order sshd reads them once the fix is in */
  const ROWS = [['h0', '/etc/ssh/'+M.name, 14, 'sc-tick'], ['i0', M.lines[0], 22], ['h1', '↳ '+F.name, 30, 'sc-tick'], ['f1', F.lines[0], 38],
    ['h2', '↳ '+C.name, 30, 'sc-tick'], ['f2', C.lines[0], 38], ['m1', M.lines[1], 22], ['m2', M.lines[2], 22]];
  const els = [scT('title', W/2, 20, 'sshd reads from the top', 'sc-sub', 'middle'), scG('pg'), scT('ptr', 2, 17, '▶', 'sc-mark', '', 'pg')];
  for(const [id, text, x, base] of ROWS){ els.push(scG('g'+id), scT('x'+id, x, 17, text, base || 'sc-code', '', 'g'+id)); if(!base) els.push(scT('m'+id, 308, 17, '', 'sc-val', 'end', 'g'+id)); }
  els.push(scT('st', 14, 262, 'settings sshd will use', 'sc-sub'));
  [['PasswordAuthentication', 286], ['PermitRootLogin', 330]].forEach(([k, y], i)=>els.push(scT('k'+i, 14, y, k, 'sc-code'), scT('kv'+i, 308, y, '', 'sc-val', 'end'), scT('ks'+i, 14, y + 20, '', 'sc-tick')));
  els.push(scT('c0', 10, 376, '# sshd -T | grep -i passwordauth', 'sc-code'), scT('c1', 10, 396, '', 'sc-val'));

  const V0 = ['h0', 'i0', 'm1', 'm2'], V1 = V0.concat('h2', 'f2'), V2 = V1.concat('h1', 'f1');
  /* hidden rows wait at the spot they will appear in, so inserting a file pushes the lines below it down */
  const place = vis=>{ const r = {}; let y = 30; for(const [id] of ROWS){ r['g'+id] = {c:vis.includes(id) ? '' : 'hide', s:scY(y)}; if(vis.includes(id)) y += 24; } return r; };
  const ptr = (vis, at)=>{ let y = 30; for(const [id] of ROWS){ if(id === at) break; if(vis.includes(id)) y += 24; } return {pg:{c:'', s:scY(y)}}; };
  const mark = (id, kept)=>({['x'+id]:{c:kept ? 'ok' : 'strike skip'}, ['m'+id]:{c:kept ? 'ok' : 'bad', t:scOK(kept)}});
  const unmark = ids=>Object.assign({}, ...ids.map(id=>({['x'+id]:{c:''}, ['m'+id]:{c:'', t:''}})));
  const setting = (i, s)=>({['k'+i]:{c:''}, ['kv'+i]:{c:'focus', t:s.value}, ['ks'+i]:{c:'', t:'from '+s.file}});
  const tHide = scC(['st', 'k0', 'kv0', 'ks0', 'k1', 'kv1', 'ks1'], 'hide'), cHide = scC(['c0', 'c1'], 'hide');
  const pa0 = before.settings[PA], pa1 = after.settings[PA], root = before.settings.permitrootlogin;
  const steps = [
    {say: 'The admin put PasswordAuthentication no at the bottom of /etc/ssh/sshd_config and reloaded sshd, yet password sign-ins still work. Follow the order sshd reads its config in.',
     set: Object.assign(place(V0), tHide, cHide, {pg:{c:'hide', s:scY(54)}})},
    {say: 'sshd reads from the top and keeps the first value it finds for each setting; a later line for that setting is ignored. Line 1 is an Include, so sshd reads those files right now.',
     set: ptr(V0, 'i0')},
    {say: 'sshd_config.d holds one file, '+C.name+', shipped with the cloud image. It sets PasswordAuthentication '+pa0.value+', the first value for that setting, so sshd keeps it.',
     set: Object.assign(place(V1), ptr(V1, 'f2'), mark('f2', true), setting(0, pa0), {st:{c:''}})},
    {say: 'Back in the main file: PermitRootLogin '+root.value+'. Nothing set PermitRootLogin earlier, so this is its first value and sshd keeps it. Root can\'t sign in over SSH.',
     set: Object.assign(ptr(V1, 'm1'), mark('m1', true), setting(1, root))},
    {say: 'sshd now reaches PasswordAuthentication no in the main file. What does it do with this line?',
     ask:{options:[['uses it: passwords off', false], ['skips it: already set', true]]}, set: ptr(V1, 'm2')},
    {say: 'PasswordAuthentication no: that setting already has a value, '+pa0.value+' from the drop-in, so sshd skips this line. The admin changed a line sshd never uses.',
     set: Object.assign(ptr(V1, 'm2'), mark('m2', false))},
    {say: 'sshd -T prints the values sshd is really using, after every Include. It says '+PA+' '+pa0.value+'. Check this output, not only the file you edited.',
     set: Object.assign(scC(['c0'], ''), {c1:{c:'', t:PA+' '+pa0.value}, pg:{c:'hide'}})},
    {say: 'The fix: add a drop-in that is read earlier. Drop-ins load in name order, and '+F.name+' sorts before '+C.name+' (1 before 5). It sets PasswordAuthentication no.',
     set: Object.assign(place(V2), unmark(['f2', 'm1', 'm2']), tHide, cHide)},
    {say: 'With '+F.name+' added, sshd reads everything again from the top. Which PasswordAuthentication value does it use now?',
     ask:{options:[['yes (cloud-init)', false], ['no (10-hardening)', true], ['no (main file)', false]]}, set:{}},
    {say: 'Read it again: '+F.name+' now gives the first value, '+pa1.value+'. The cloud-init yes and the main file\'s line are both ignored. sshd -T confirms '+PA+' '+pa1.value+'.',
     set: Object.assign(mark('f1', true), mark('f2', false), mark('m1', true), mark('m2', false), setting(0, pa1), setting(1, root),
       {st:{c:''}, c0:{c:''}, c1:{c:'', t:PA+' '+pa1.value}})},
    {say: 'Before you log out: sshd -t checks the syntax, a reload applies it, then open a new session with your key. Keep the old session open until the new sign-in works.',
     set: {c0:{t:'# sshd -t && systemctl reload ssh'}, c1:{t:'new key sign-in: works'}}}
  ];
  return {id:'sshd', title:'The first value wins', label:'The order sshd reads sshd_config and its drop-in files, which PasswordAuthentication value it keeps, and the earlier-named drop-in that fixes it',
    w:W, h:404, els, steps, tryIt:sshdTry};
}

function sshdTry(box){
  const q = scTryBox(box, '<label>Your drop-in <input class="typed" data-k="n" value="'+SSHD_FIX.name+'" autocomplete="off" spellcheck="false" aria-describedby="trymsg"></label>'+
    '<label>PasswordAuthentication <select data-k="v"><option>no</option><option>yes</option></select></label>');
  const update = ()=>{
    const name = q('n').value.trim(), v = q('v').value;
    if(!/^[A-Za-z0-9._-]{1,40}$/.test(name)){ q('msg').textContent = 'Type a file name like 10-hardening.conf (letters, digits, dot, dash, underscore).'; q('out').innerHTML = ''; return; }
    const mine = {name, lines:['PasswordAuthentication '+v]}, r = sshdRead(SSHD_MAIN, [SSHD_CLOUD, mine]), win = r.settings.passwordauthentication;
    q('msg').textContent = !/\.conf$/.test(name) ? 'Include only matches *.conf, so this file is never read.'
      : win.file === name ? name+' sorts before '+SSHD_CLOUD.name+', so its value is read first and kept.'
      : name+' sorts after '+SSHD_CLOUD.name+' (or matches it), so cloud-init\'s value was already kept.';
    q('out').innerHTML = '<ol>'+r.order.map(o=>'<li><code>'+esc(o.line)+'</code> · '+esc(o.file)+' · '+(o.status === 'include' ? 'reads the drop-ins here' : o.status === 'kept' ? '<b>kept</b>' : 'ignored')+'</li>').join('')+
      '</ol><p>sshd -T: <b>passwordauthentication '+esc(win.value)+'</b> (from '+esc(win.file)+')</p>';
  };
  box.addEventListener('input', update); box.addEventListener('change', update);
  update();
}

/* ---------- IAM: three questions in a fixed order, so an explicit Deny wins wherever it is written ---------- */
const IAM_POLICY = [{Effect:'Allow', Action:'s3:*', Resource:'*'}, {Effect:'Deny', Action:'s3:DeleteObject', Resource:'payroll/*'}];
/* * matches any run of characters, ? one character; action names ignore case, resources don't */
const iamGlob = (pat, val, ci)=>new RegExp('^'+pat.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.')+'$', ci ? 'i' : '').test(val);
function iamEval(stmts, action, resource){
  const m = stmts.map(s=>{ const a = iamGlob(s.Action, action, true), r = iamGlob(s.Resource, resource); return {a, r, hit:a && r}; });
  const deny = stmts.some((s, i)=>s.Effect === 'Deny' && m[i].hit), allow = stmts.some((s, i)=>s.Effect === 'Allow' && m[i].hit);
  return {m, decision:deny ? 'explicit-deny' : allow ? 'allow' : 'implicit-deny'};
}
const IAM_REQUESTS = [['s3:DeleteObject', 'payroll/june.csv'], ['s3:GetObject', 'payroll/june.csv'], ['ec2:StartInstances', 'i-0abc123'],
  ['s3:DeleteObject', 'reports/q3.csv'], ['s3:GetObject', 'reports/q3.csv']];
const IAM_NARROW = {Effect:'Allow', Action:'s3:GetObject', Resource:'reports/*'};

function iamScene(){
  const W = 320, SY = j=>66 + j * 74;
  const els = [scR('rq', 8, 6, 304, 50, 'sc-box'), scT('rql', 16, 26, 'action', 'sc-tick'), scT('rqa', 100, 26, '', 'sc-code'), scT('rrl', 16, 46, 'resource', 'sc-tick'), scT('rqr', 100, 46, '', 'sc-code')];
  IAM_POLICY.forEach((s, i)=>{
    const g = 'sg'+i;
    els.push(scG(g), scR('sb'+i, 8, 0, 304, 66, 'sc-box', g), scT('se'+i, 16, 19, s.Effect, 'sc-val', '', g), scT('sm'+i, 304, 19, '', 'sc-val', 'end', g),
      scT('sal'+i, 16, 39, 'action', 'sc-tick', '', g), scT('sav'+i, 100, 39, s.Action, 'sc-code', '', g), scT('sac'+i, 304, 39, '', 'sc-val', 'end', g),
      scT('srl'+i, 16, 59, 'resource', 'sc-tick', '', g), scT('srv'+i, 100, 59, s.Resource, 'sc-code', '', g), scT('src'+i, 304, 59, '', 'sc-val', 'end', g));
  });
  ['1 a Deny matches?', '2 an Allow matches?', '3 nothing matched'].forEach((t, j)=>els.push(scR('gb'+j, 8, 218 + j * 30, 304, 26, 'sc-box'),
    scT('gt'+j, 16, 236 + j * 30, t, 'sc-code'), scT('gr'+j, 304, 236 + j * 30, '', 'sc-val', 'end')));
  els.push(scT('vd', W/2, 332, '', 'sc-res', 'middle'));

  const req = ([a, r])=>({rqa:{t:a}, rqr:{t:r}});
  const slots = order=>Object.fromEntries(order.map((i, j)=>['sg'+i, {s:scY(SY(j))}]));
  const marks = (stmts, rq, which)=>{ const ev = iamEval(stmts, rq[0], rq[1]), r = {};
    (which || [0, 1]).forEach(i=>{ const x = ev.m[i];
      Object.assign(r, {['sac'+i]:{c:x.a ? 'ok' : 'bad', t:scOK(x.a)}, ['src'+i]:{c:x.r ? 'ok' : 'bad', t:scOK(x.r)}, ['sm'+i]:{c:x.hit ? 'focus' : '', t:x.hit ? 'matches' : 'no match'}, ['sb'+i]:{c:x.hit ? 'hit' : ''}}); });
    return r; };
  const blank = Object.assign({}, ...[0, 1].map(i=>({['sac'+i]:{t:''}, ['src'+i]:{t:''}, ['sm'+i]:{t:''}, ['sb'+i]:{c:''}})));
  /* the three questions: the one that decides is marked, later ones are never asked */
  const gates = d=>{ const at = {'explicit-deny':0, allow:1, 'implicit-deny':2}[d], r = {};
    for(let j=0; j<3; j++){ r['gb'+j] = {c:j === at ? (d === 'allow' ? 'ok' : 'bad') : j > at ? 'skip' : ''}; r['gt'+j] = {c:j > at ? 'skip' : ''};
      r['gr'+j] = {c:j > at ? 'skip' : j === at ? (d === 'allow' ? 'ok' : 'bad') : '', t:j < at ? 'no' : j > at ? 'not asked' : j === 2 ? '→ DENY' : 'yes → '+(d === 'allow' ? 'ALLOW' : 'DENY')}; }
    r.vd = {c:'', t:{'explicit-deny':'denied (explicit Deny)', allow:'allowed', 'implicit-deny':'denied (by default)'}[d]};
    return r; };
  const unGate = Object.assign({vd:{c:'hide'}}, ...[0, 1, 2].map(j=>({['gb'+j]:{c:''}, ['gt'+j]:{c:''}, ['gr'+j]:{c:'', t:''}})));
  const decide = (stmts, rq)=>Object.assign(req(rq), marks(stmts, rq), gates(iamEval(stmts, rq[0], rq[1]).decision));
  const P = IAM_POLICY, NP = [IAM_NARROW, P[1]], RQ = IAM_REQUESTS;
  const steps = [
    {say: 'One policy, two statements, and a request: delete payroll/june.csv (s3:DeleteObject). payroll/* is short for arn:aws:s3:::<bucket>/payroll/*. AWS asks three questions, always in the same order.',
     set: Object.assign(req(RQ[0]), slots([0, 1]), scC(['vd'], 'hide'))},
    {say: 'Does the Allow match? s3:* is a wildcard for every S3 action, DeleteObject included, and Resource * covers every resource. Both parts match, so the statement matches.',
     set: marks(P, RQ[0], [0])},
    {say: 'Does the Deny match? s3:DeleteObject is exactly the request\'s action, and payroll/* covers payroll/june.csv. It matches too: both statements apply to this request.',
     set: marks(P, RQ[0], [1])},
    {say: 'Both statements match the delete request: the Allow (written first) and the Deny. What does AWS decide?',
     ask:{options:[['allowed', false], ['denied', true], ['depends on the order', false]]}, set:{}},
    {say: 'Question 1: does any Deny match? Yes, so the request is denied and AWS stops there.\nThe rule: an explicit Deny always wins; the Allow is never weighed against it.',
     set: gates(iamEval(P, RQ[0][0], RQ[0][1]).decision)},
    {say: 'Write the Deny first instead: same answer. Unlike firewall rules, statement order means nothing here, because any matching Deny wins wherever it sits.',
     set: slots([1, 0])},
    {say: 'New request: read the same file (s3:GetObject).\nQuestion 1: no, the Deny covers only DeleteObject.\nQuestion 2: the Allow matches, so it\'s allowed.',
     set: decide(P, RQ[1])},
    {say: 'New request: ec2:StartInstances. Neither statement mentions EC2 at all. What happens?',
     ask:{options:[['allowed', false], ['denied', true]]},
     set: Object.assign(req(RQ[2]), blank, unGate)},
    {say: 'ec2:StartInstances isn\'t an S3 action, so neither statement matches.\nResult: no Deny, no Allow, so question 3 applies and it\'s denied by default.\nThe rule: nothing has to forbid it.',
     set: decide(P, RQ[2])},
    {say: 'Least privilege: the reporting app\'s Allow becomes s3:GetObject on reports/*.\nResult: deleting reports/q3.csv now matches nothing, so it\'s denied by default.\nWith only this policy, stolen role credentials can\'t delete.',
     set: Object.assign(blank, slots([0, 1]), {sav0:{t:IAM_NARROW.Action}, srv0:{t:IAM_NARROW.Resource}}, decide(NP, RQ[3]))},
    {say: 'Its real job still works: reading reports/q3.csv matches the narrow Allow. Grant exactly the actions and resources a job needs; everything else is denied by default.',
     set: decide(NP, RQ[4])}
  ];
  return {id:'iam', title:'An explicit Deny wins', label:'A request checked against an Allow and a Deny statement, the three questions AWS asks in order, and a least-privilege Allow',
    w:W, h:344, els, steps, tryIt:iamTry};
}

function iamTry(box){
  const stmt = (i, s)=>'<label>Statement '+(i + 1)+' <select data-k="e'+i+'"><option'+(s.Effect === 'Allow' ? ' selected' : '')+'>Allow</option><option'+(s.Effect === 'Deny' ? ' selected' : '')+'>Deny</option></select>'+
    '<input class="typed" data-k="a'+i+'" value="'+s.Action+'" autocomplete="off" spellcheck="false" aria-label="Statement '+(i + 1)+' action">'+
    '<input class="typed" data-k="r'+i+'" value="'+s.Resource+'" autocomplete="off" spellcheck="false" aria-label="Statement '+(i + 1)+' resource"></label>';
  const q = scTryBox(box, stmt(0, IAM_POLICY[0])+stmt(1, IAM_POLICY[1])+
    '<label>Request <input class="typed" data-k="ra" value="'+IAM_REQUESTS[0][0]+'" autocomplete="off" spellcheck="false" aria-label="Request action" aria-describedby="trymsg">'+
    '<input class="typed" data-k="rr" value="'+IAM_REQUESTS[0][1]+'" autocomplete="off" spellcheck="false" aria-label="Request resource"></label>');
  const update = ()=>{
    const stmts = [0, 1].map(i=>({Effect:q('e'+i).value, Action:q('a'+i).value.trim(), Resource:q('r'+i).value.trim()}));
    const a = q('ra').value.trim(), r = q('rr').value.trim();
    if(!a || !r || stmts.some(s=>!s.Action || !s.Resource)){ q('msg').textContent = 'Fill in every action and resource (* is a wildcard).'; q('out').innerHTML = ''; return; }
    const ev = iamEval(stmts, a, r);
    q('msg').textContent = 'Order doesn\'t matter: AWS asks about Deny first, then Allow, then denies by default.';
    q('out').innerHTML = '<ul class="clean">'+stmts.map((s, i)=>'<li>Statement '+(i + 1)+' ('+s.Effect+'): action '+scOK(ev.m[i].a)+' · resource '+scOK(ev.m[i].r)+' · <b>'+(ev.m[i].hit ? 'matches' : 'no match')+'</b></li>').join('')+'</ul>'+
      '<p><b>'+{'explicit-deny':'Denied: a Deny matched, and an explicit Deny always wins.', allow:'Allowed: no Deny matched, and an Allow did.', 'implicit-deny':'Denied by default: nothing matched.'}[ev.decision]+'</b></p>';
  };
  box.addEventListener('input', update); box.addEventListener('change', update);
  update();
}

/* ---------- Leaked key: a commit is a snapshot, history keeps it, copies keep it, so contain the key first ---------- */
const LEAK = {key:'AKIAEXAMPLE7EXAMPLE', commits:[['a1b2c3d', 'init'], ['4f2a9c1', 'quick fix'], ['9e8d7f6', 'remove key']], rewritten:'c7d1e2a'};
const LEAK_STEPS = [['Contain', 'Deactivate the key and issue a new one'], ['Investigate', 'Search CloudTrail for what the key did'],
  ['Clean up', 'Delete what it created, purge the repo history'], ['Prevent', 'Turn on secret scanning, move the app to a role']];
const LEAK_WHY = ['Until the key is dead, every copy of it still works, so containing it comes first.', 'You need to know what the key did before you can clean it all up.',
  'Undo what it created and take the key out of history, now that you know the full list.', 'Last, make sure the next key is caught before it is committed, or never exists.'];

function leakScene(){
  const W = 320, L = LEAK, KX = [50, 160, 270], bad = LEAK.commits[1][0];
  const els = [scT('title', 14, 14, 'commits on main', 'sc-sub'), ['line', 'tl', {x1:KX[0], y1:54, x2:KX[2], y2:54, 'data-base':'sc-rule'}], scG('hg'), scT('hd', 0, 38, 'HEAD ▼', 'sc-mark', 'middle', 'hg')];
  L.commits.forEach(([h, msg], i)=>els.push(['circle', 'k'+i, {cx:KX[i], cy:54, r:9, 'data-base':'sc-node'}], scT('kh'+i, KX[i], 82, h, 'sc-code', 'middle'), scT('km'+i, KX[i], 102, msg, 'sc-tick', 'middle')));
  els.push(scR('sn', 8, 116, 304, 84, 'sc-box'), scT('snt', 16, 136, '', 'sc-lab'), scT('sn1', 16, 160, 'REGION=us-east-1', 'sc-code'), scT('sn2', 16, 184, '', 'sc-code'));
  ['your repo', 'GitHub', 'a clone'].forEach((n, j)=>els.push(scR('pb'+j, 8 + j * 104, 212, 96, 56, 'sc-box'), scT('pn'+j, 56 + j * 104, 234, n, 'sc-lab', 'middle'), scT('ps'+j, 56 + j * 104, 256, '', 'sc-val', 'middle')));
  els.push(scR('kb', 8, 280, 304, 52, 'sc-box'), scT('kt', 16, 300, L.key, 'sc-code'), scT('ks', 304, 300, '', 'sc-val', 'end'), scT('kx', 16, 322, '', 'sc-tick'));
  els.push(scT('ct0', 8, 356, 'CloudTrail: calls by this key', 'sc-sub'), scT('ct1', 8, 378, 'CreateUser    backup-admin', 'sc-code'), scT('ct2', 8, 398, 'RunInstances ×4  eu-north-1', 'sc-code'));

  const keyLine = 'AWS_ACCESS_KEY_ID=AKIA…';
  const snap = (title, keyed)=>({snt:{t:title}, sn1:{t:'REGION=us-east-1', c:''}, sn2:keyed ? {c:'bad', t:keyLine} : {c:'skip', t:'(key line deleted)'}, sn:{c:keyed ? 'bad' : ''}});
  const place = (j, s)=>({['ps'+j]:{c:s === 'has key' ? 'bad' : s === 'clean' || s === 'dead key' ? 'ok' : '', t:s}, ['pb'+j]:{c:s === 'has key' ? 'bad' : ''}});
  const head = i=>({hg:{c:'', s:scY(0, KX[i])}});
  const steps = [
    {say: 'Commit '+bad+', "quick fix", added config.env with an AWS access key (example values). Every commit stores a full snapshot of the files, and history keeps every commit.',
     set: Object.assign(head(1), scC(['k2', 'kh2', 'km2', 'kx', 'ct0', 'ct1', 'ct2'], 'hide'), {k1:{c:'bad'}},
       snap('config.env at '+bad, true), place(0, 'has key'), place(1, 'not pushed'), place(2, '—'), {ks:{c:'bad', t:'active'}, kb:{c:'bad'}})},
    {say: 'git push copies every commit to the public repository on GitHub. Bots scan new pushes for keys within minutes, so assume a stranger has already cloned it.',
     set: Object.assign(place(1, 'has key'), place(2, 'has key'))},
    {say: 'The developer deletes the line and commits "remove key". The newest snapshot is clean, so the file looks fixed in the editor and on GitHub.',
     set: Object.assign(head(2), scC(['k2', 'kh2', 'km2'], ''), {k1:{c:''}}, snap('config.env at '+L.commits[2][0], false))},
    {say: 'The newest commit deleted the key line. Can someone with a copy of the repository still get the key?',
     ask:{options:[['no, it is gone', false], ['yes, in old commits', true]]}, set:{}},
    {say: 'But '+bad+' is still in history: git show '+bad+':config.env prints the key, on every copy. Deleting a line only adds a new commit on top; it erases nothing.',
     set: Object.assign({k1:{c:'bad'}}, snap('$ git show '+bad+':config.env', true))},
    {say: 'Rewriting history (git filter-repo, then a force-push) removes '+bad+' from your branches; the later commit gets a new ID. Clones, forks and GitHub\'s cached views can still hold it.',
     set: Object.assign(scC(['k1', 'kh1', 'km1'], 'hide'), {kh2:{t:L.rewritten}}, snap('config.env at '+L.rewritten, false), place(0, 'clean'), place(1, 'clean'))},
    {say: 'Your repo and GitHub are clean now, but a stranger\'s clone still has the key. What actually makes the leaked key harmless?',
     ask:{options:[['another force-push', false], ['deactivate the key', true], ['ask GitHub to delete it', false]]}, set:{}},
    {say: 'Cleaning git can never reach every copy, so containing the key comes first, outside git: deactivate it in IAM and issue a new one. Every copy now holds a dead key.',
     set: Object.assign(place(2, 'dead key'), {ks:{c:'ok', t:'inactive'}, kb:{c:''}})},
    {say: 'Deactivating doesn\'t end temporary sessions already issued from the key. Attach a deny for sessions issued before now (an aws:TokenIssueTime condition) to cut those off too.',
     set: {kx:{c:'', t:'older sessions: denied too'}}},
    {say: 'Investigate: search CloudTrail for every call made with that key ID. Here it created a user and started 4 servers in another region. Delete what it made; rotate what it touched.',
     set: scC(['ct0', 'ct1', 'ct2'], '')},
    {say: 'Prevent: a secret scan in pre-commit (and on push) blocks the next key before it is committed, and a role with short-lived credentials means the app stores no key at all.',
     set: {snt:{t:'$ git commit   (pre-commit scan)'}, sn1:{c:'bad', t:'found: AWS access key'}, sn2:{c:'ok', t:'commit blocked'}, sn:{c:'ok'}}}
  ];
  return {id:'leak', title:'A leaked key stays in history', label:'A commit that added an access key, a later commit that deleted the line, which copies still hold the key, and the response order',
    w:W, h:410, els, steps, tryIt:leakTry};
}

/* Try it: put the response in order; a wrong pick says why it can't come yet */
function leakTry(box){
  const shown = [2, 0, 3, 1];
  const q = scTryBox(box, shown.map(i=>'<button type="button" data-i="'+i+'">'+LEAK_STEPS[i][1]+'</button>').join('')+'<button type="button" data-k="reset">Start over</button>');
  q('msg').textContent = 'A key leaked an hour ago. Pick the four steps in the order you would do them.';
  let done = 0;
  const draw = ()=>{ q('out').innerHTML = done ? '<ol>'+LEAK_STEPS.slice(0, done).map((s, i)=>'<li><b>'+s[0]+'</b>: '+s[1]+'. '+LEAK_WHY[i]+'</li>').join('')+'</ol>' : '';
    box.querySelectorAll('[data-i]').forEach(b=>{ b.disabled = +b.dataset.i < done; }); };
  box.addEventListener('click', e=>{
    const b = e.target.closest('button'); if(!b) return;
    if(b.dataset.k === 'reset'){ done = 0; q('msg').textContent = 'Pick the four steps in the order you would do them.'; draw(); return; }
    const i = +b.dataset.i;
    if(i === done){ done++; q('msg').textContent = done === 4 ? 'That\'s the order: contain, investigate, clean up, prevent.' : 'Right. What comes next?'; }
    else q('msg').textContent = 'Not yet: '+LEAK_STEPS[done][0].toLowerCase()+' comes first. '+LEAK_WHY[done];
    draw();
  });
  draw();
}

/* ---------- Permissions pilot, step 1: the worked example (opened from Labs, not a lesson scene) ----------
   A config you own won't open. Each check says what it establishes and what it leaves unknown; the conclusion is never
   bigger than the evidence. Current user only: you own everything, so only the owner set ever applies to you. */
const PILOT_EX = {user:'student', dir:'cfg', file:'cfg/app.ini'};
function pilotScene(){
  const E = PILOT_EX, W = 340, L = ['$ cat '+E.file, 'cat: '+E.file+': Permission denied', '$ id -un', E.user, '$ ls -l '+E.file, '--w------- '+E.user+' '+E.user+' app.ini',
    '$ namei -l '+E.file, 'drwx------ '+E.user+' '+E.user+' '+E.dir, '--w------- '+E.user+' '+E.user+' app.ini', '$ chmod u+r '+E.file, '$ cat '+E.file, 'port=8080'];
  const ids = L.map((t, i)=>'l'+i);
  const els = [scR('term', 4, 4, W - 8, 278, 'sc-box')].concat(L.map((t, i)=>scT('l'+i, 14, 28 + i * 22, t, 'sc-code')),
    [scT('est', 8, 304, '', 'sc-sub'), scT('unk', 8, 326, '', 'sc-sub')]);
  const show = n=>scC(ids.slice(0, n), ''), hideAfter = n=>scC(ids.slice(n), 'hide');
  const steps = [
    {say: 'You own every file in this lab, but cat '+E.file+' says Permission denied. Start with evidence, not a fix. First: who are you?',
     set: Object.assign(hideAfter(0), show(2), {l1:{c:'bad'}, est:{t:''}, unk:{t:''}})},
    {say: 'id -un says '+E.user+'; ls -l shows the file is owned by '+E.user+'. You are the owner, so only the owner set (the first three letters) applies to you; the group set is never consulted.',
     set: Object.assign(show(6), {l5:{c:''}})},
    {say: 'The owner set is -w-: write, but no r. What does this establish so far?',
     ask:{options:[['the file blocks you; the folders are unchecked', true], ['the folders are fine too', false], ['nothing yet', false]]}, set:{}},
    {say: 'What the evidence shows so far:\nEstablished: the owner set lacks r, which explains the error.\nNot yet established: whether each folder on the path lets you through (x).\nWhy it matters: one fault never rules out a second one.',
     set: {est:{t:'established: owner set lacks r'}, unk:{t:'unknown: x on the folder '+E.dir}}},
    {say: 'namei -l lists every part of the path.\nChecked: '+E.dir+' is drwx------, so it has x for you and the path is fine.\nThat is now checked, not assumed.',
     set: Object.assign(show(9), {unk:{t:'checked: '+E.dir+' has x for you'}})},
    {say: 'The fix should give exactly what is missing, to exactly who needs it. Which command is least privilege?',
     ask:{options:[['chmod u+r '+E.file, true], ['chmod +r '+E.file, false], ['chmod 777 '+E.file, false]]}, set:{}},
    {say: 'chmod u+r adds r for the owner only: now -rw-------.\nCompare: plain chmod +r usually adds r for the group and others too (umask 022), and 777 gives everyone everything.',
     set: Object.assign(show(10), {l8:{t:'-rw------- '+E.user+' '+E.user+' app.ini', c:''}, est:{t:'fixed: owner set is now rw-'}})},
    {say: 'Verified: cat now prints the config.\nThe method: evidence first, a conclusion no bigger than the evidence, the smallest fix, then verify.',
     set: Object.assign(show(12), {l1:{c:'skip'}, l11:{c:'ok'}, unk:{t:'verified: cat works'}})}
  ];
  return {id:'pilot', title:'Worked example: a config you own won\'t open', label:'A terminal: cat fails, id and ls -l show you own the file but its owner set lacks r, namei -l shows the folder has x, chmod u+r fixes it, cat works',
    w:W, h:336, els, steps};
}

SCENES['quiz:linux:Permissions'] = permScene();
SCENES['quiz:sec:Firewalls'] = fwScene();
SCENES['quiz:sec:SSH hardening'] = sshdScene();
SCENES['quiz:cloud:IAM & least privilege'] = iamScene();
SCENES['quiz:cloud:Leaked key response'] = leakScene();
