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
    if (typeof st.say !== 'string' || st.say.length < 20 || st.say.length > 200) fail(id, 'step', i + 1, 'caption should be 20 to 200 characters');
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
if (at(3).o3.t !== m.net.split('.')[3] || at(4).o3.t !== m.bc.split('.')[3] || at(last).o3.t !== eip.split('.')[3]) fail('subnet scene octet values', at(3).o3.t, at(4).o3.t, at(last).o3.t);
if (!at(3).res.t.includes(m.net) || !at(4).res.t.includes(m.bc) || !at(last).res.t.includes(String(m.usable))) fail('subnet scene result lines');
for (let b = ep; b < 32; b++) if (at(3)['b' + b].t !== '0' || at(4)['b' + b].t !== '1') { fail('host bit', b, 'should be 0 then 1'); break; }
if (!sc.steps[3].say.includes(m.net) || !sc.steps[4].say.includes(m.bc) || !sc.steps[last].say.includes(m.usable + ' usable hosts')) fail('the captions must state the computed network, broadcast and host count');

/* size and the motion/reduced-motion rules */
const css = fs.readFileSync(path.join(__dirname, '..', 'src', 'styles.css'), 'utf8');
const sceneCss = css.split('\n').filter(l => /scene|\.sc\b|sc-|scflash/.test(l)).join('\n');
const kb = (fs.statSync(path.join(__dirname, '..', 'src', 'scenes.js')).size + sceneCss.length) / 1024;
if (kb > 60) fail('scenes add', kb.toFixed(1), 'KB; keep them under 60 KB');
if (!/prefers-reduced-motion[^}]*\.scene \.sc\{transition:none\}/.test(css)) fail('reduced motion must switch scene transitions off');
if (/infinite/.test(sceneCss)) fail('scene animations must never loop');
console.log('scenes', ids.length, '| steps', ids.reduce((a, i) => a + T.SCENES[i].steps.length, 0), '| size', kb.toFixed(1), 'KB | problems', bad);
process.exitCode = bad ? 1 : 0;
