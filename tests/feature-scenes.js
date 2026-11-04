// Animated lesson scenes (src/scenes.js): every scene belongs to a real lesson, is well-formed data, gives the same
// picture every time, changes something on every step, uses theme classes only (no hard-coded colours or outside
// assets), stays small, and teaches the same numbers as the lesson's own worked example.
const fs = require('fs'), path = require('path');
const js = fs.readFileSync(__dirname + '/.tmp/script.js', 'utf8');
const before = js.split('/* ===================== STATE')[0];
const T = new Function(before + ';return {SCENES, LESSONS, sceneState, subnetMath, SUBNET_EXAMPLE};')();
let bad = 0; const fail = (...a) => { bad++; console.log('FAIL', ...a); };

const TAGS = new Set(['text', 'rect', 'line', 'circle', 'path', 'polyline', 'polygon', 'g']);
const ids = Object.keys(T.SCENES);
if (!ids.length) fail('no scenes defined');
for (const id of ids) {
  const sc = T.SCENES[id];
  if (!T.LESSONS[id]) fail(id, 'has no lesson');
  if (!(sc.w > 0 && sc.h > 0)) fail(id, 'needs a viewBox size');
  if (sc.steps.length < 3 || sc.steps.length > 10) fail(id, 'should have 3 to 10 steps, has', sc.steps.length);
  const els = new Map();
  for (const [tag, eid, attrs] of sc.els) {
    if (!TAGS.has(tag)) fail(id, 'uses an unexpected element', tag);
    if (els.has(eid)) fail(id, 'repeats element id', eid);
    els.set(eid, true);
    /* colour and fonts come from theme classes in styles.css, never from the drawing */
    for (const k of Object.keys(attrs || {})) if (/^(fill|stroke|color|font-family)$/.test(k)) fail(id, eid, 'sets', k, 'inline; use a theme class');
  }
  const raw = JSON.stringify(sc.els) + JSON.stringify(sc.steps);
  if (/#[0-9a-f]{3,8}\b|rgba?\(|url\(|https?:|<image|@import/i.test(raw)) fail(id, 'contains a hard-coded colour or outside asset');
  sc.steps.forEach((st, i) => {
    if (typeof st.say !== 'string' || st.say.length < 20 || st.say.length > 240) fail(id, 'step', i + 1, 'caption should be 20 to 240 characters');
    for (const eid of Object.keys(st.set || {})) if (!els.has(eid)) fail(id, 'step', i + 1, 'changes unknown element', eid);
    const a = JSON.stringify(T.sceneState(sc, i)), b = JSON.stringify(T.sceneState(sc, i));
    if (a !== b) fail(id, 'step', i + 1, 'is not deterministic');
    if (i > 0 && a === JSON.stringify(T.sceneState(sc, i - 1))) fail(id, 'step', i + 1, 'changes nothing on screen');
  });
}

/* Subnetting: the arithmetic, re-derived independently for many addresses */
const num = ip => ip.split('.').reduce((a, b) => a * 256 + +b, 0);
const dot = v => [24, 16, 8, 0].map(s => Math.floor(v / 2 ** s) % 256).join('.');
for (let k = 0; k < 2000; k++) {
  const ip = [0, 0, 0, 0].map(() => Math.floor(Math.random() * 256)).join('.'), p = 1 + Math.floor(Math.random() * 31);
  const m = T.subnetMath(ip, p), size = 2 ** (32 - p), net = Math.floor(num(ip) / size) * size;
  if (m.net !== dot(net) || m.bc !== dot(net + size - 1) || m.total !== size || m.usable !== Math.max(0, size - 2)) { fail('subnetMath wrong for', ip + '/' + p, JSON.stringify([m.net, m.bc, m.usable])); break; }
  if (m.bits.join('') !== num(ip).toString(2).padStart(32, '0')) { fail('subnetMath bits wrong for', ip); break; }
}
/* ...and the scene teaches exactly the lesson's worked example */
const [eip, ep] = T.SUBNET_EXAMPLE, m = T.subnetMath(eip, ep), L = T.LESSONS['quiz:net:Subnetting'];
const lessonText = (L.example + L.idea).replace(/<[^>]+>/g, '');
for (const must of [eip + '/' + ep, m.net, m.bc, '(' + m.usable + ' hosts)', '.' + m.first.split('.').pop() + ' to .' + m.last.split('.').pop()])
  if (!lessonText.includes(must)) fail('the Subnetting lesson does not say', must, '(the scene shows it)');
const sc = T.SCENES['quiz:net:Subnetting'], last = sc.steps.length - 1;
const at = n => T.sceneState(sc, n);
/* Try it covers /8 to /30: the octet the split falls in, and the block size inside that octet */
for (let p = 8; p <= 30; p++) {
  const t = T.subnetMath('10.20.30.40', p), k = Math.min(3, Math.floor(p / 8)), size = 2 ** (8 - (p - 8 * k));
  if (t.k !== k || t.block !== size) fail('Try it maths for /' + p, 'octet', t.k + 1, 'block', t.block, 'expected', k + 1, size);
  if (t.netOct[k] % size !== 0 || t.bcOct[k] !== t.netOct[k] + size - 1) fail('Try it block bounds for /' + p);
}
/* find the steps by what they teach, then check the picture at each one */
const stepOf = re => sc.steps.findIndex(s => re.test(s.say));
const sNet = stepOf(/network address is/), sBc = stepOf(/broadcast address/), sMask = stepOf(/subnet mask/), sBlock = stepOf(/blocks of/);
if ([sNet, sBc, sMask, sBlock].some(i => i < 0)) fail('subnet scene is missing a step (network, broadcast, mask or blocks)');
else {
  const lastOct = +eip.split('.')[3], bits8 = v => v.toString(2).padStart(8, '0'), k = ep - 24;
  const row = (st, id) => Array.from({ length: 8 }, (_, i) => st[id + 't' + i].t).join('');
  if (row(at(sMask), 'za') !== bits8(lastOct)) fail('zoomed address bits', row(at(sMask), 'za'));
  if (row(at(sMask), 'zm') !== bits8(+m.mask.split('.')[3]) || at(sMask).zmv.t !== '= ' + m.mask.split('.')[3]) fail('zoomed mask', row(at(sMask), 'zm'));
  /* the AND, re-derived bit by bit, then the broadcast with every device bit set to 1 */
  const and = Array.from({ length: 8 }, (_, i) => +(bits8(lastOct)[i] === '1' && i < k)).join('');
  if (row(at(sNet), 'zr') !== and || at(sNet).zrv.t !== '= ' + m.net.split('.')[3]) fail('AND result should be', and, 'got', row(at(sNet), 'zr'));
  if (row(at(sBc), 'zr') !== and.slice(0, k) + '1'.repeat(8 - k) || at(sBc).zrv.t !== '= ' + m.bc.split('.')[3]) fail('broadcast row', row(at(sBc), 'zr'));
  if (!at(sNet).res1.t.includes(m.net) || !at(sBc).res1.t.includes('.' + m.bc.split('.').pop()) || !at(last).res1.t.includes(m.usable + ' usable')) fail('subnet scene result lines');
  if (at(sBlock).nblock.c === 'hide' || at(sBlock - 1).nblock.c !== 'hide') fail('the number line should appear on the blocks step');
  if (!sc.steps[sNet].say.includes(m.net) || !sc.steps[sBc].say.includes(m.bc) || !sc.steps[sMask].say.includes(m.mask)) fail('captions must state the computed mask, network and broadcast');
  if (!sc.steps[sBlock].say.includes('blocks of ' + m.block) || !sc.steps[last].say.includes(m.usable + ' addresses')) fail('captions must state the block size and usable count');
}

/* size and the motion/reduced-motion rules */
const css = fs.readFileSync(path.join(__dirname, '..', 'src', 'styles.css'), 'utf8');
const sceneCss = css.split('\n').filter(l => /scene|\.sc\b|sc-|scflash/.test(l)).join('\n');
const kb = (fs.statSync(path.join(__dirname, '..', 'src', 'scenes.js')).size + sceneCss.length) / 1024;
if (kb > 60) fail('scenes add', kb.toFixed(1), 'KB; keep them under 60 KB');
if (!/prefers-reduced-motion[^}]*\.scene \.sc\{transition:none\}/.test(css)) fail('reduced motion must switch scene transitions off');
if (/infinite/.test(sceneCss)) fail('scene animations must never loop');
console.log('scenes', ids.length, '| steps', ids.reduce((a, i) => a + T.SCENES[i].steps.length, 0), '| size', kb.toFixed(1), 'KB | problems', bad);
process.exitCode = bad ? 1 : 0;
