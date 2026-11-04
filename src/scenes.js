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
  /* optional hands-on panel under the animation (it never touches progress) */
  if(sc.tryIt){ const t = document.createElement('div'); t.className = 'scene-try'; host.appendChild(t); sc.tryIt(t); }

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
    {say: host+' device bits make 2^'+host+' = '+m.total+' addresses, so the octet is cut into blocks of '+m.block+'. Shortcut: 256 − '+m.maskOct[k]+' (the mask) = '+m.block+'. Blocks start at 0, '+m.block+', '+2 * m.block+', '+3 * m.block+'… and '+o+' lands in '+lo+' to '+hi+'.',
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
