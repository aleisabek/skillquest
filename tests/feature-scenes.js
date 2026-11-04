// Animated lesson scenes (src/scenes.js): every scene belongs to a real lesson, is well-formed data, gives the same
// picture every time, changes something on every step, uses theme classes only (no hard-coded colours or outside
// assets), stays small, and teaches the same numbers as the lesson's own worked example.
const fs = require('fs'), path = require('path');
const js = fs.readFileSync(__dirname + '/.tmp/script.js', 'utf8');
const before = js.split('/* ===================== STATE')[0];
const T = new Function(before + ';return {SCENES, LESSONS, sceneState, subnetMath, SUBNET_EXAMPLE, permMath, permWho, PERM_EXAMPLE, FW_RULES, FW_PACKETS, fwEval,' +
  ' SSHD_MAIN, SSHD_CLOUD, SSHD_FIX, sshdRead, IAM_POLICY, IAM_NARROW, IAM_REQUESTS, iamEval, LEAK, LEAK_STEPS};')();
let bad = 0; const fail = (...a) => { bad++; console.log('FAIL', ...a); };

const TAGS = new Set(['text', 'rect', 'line', 'circle', 'path', 'polyline', 'polygon', 'g']);
const ids = Object.keys(T.SCENES);
if (!ids.length) fail('no scenes defined');
for (const id of ids) {
  const sc = T.SCENES[id];
  if (!T.LESSONS[id]) fail(id, 'has no lesson');
  if (!(sc.w > 0 && sc.h > 0)) fail(id, 'needs a viewBox size');
  if (sc.steps.length < 3 || sc.steps.length > 12) fail(id, 'should have 3 to 12 steps, has', sc.steps.length);
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
    /* a prediction step may keep the picture (it asks about what comes next); every other step must change it */
    if (i > 0 && !st.ask && a === JSON.stringify(T.sceneState(sc, i - 1))) fail(id, 'step', i + 1, 'changes nothing on screen');
    if (st.ask) {
      const o = st.ask.options || [];
      if (o.length < 2 || o.length > 4 || o.filter(x => x[1] === true).length !== 1 || o.some(x => typeof x[0] !== 'string' || x[0].length > 48))
        fail(id, 'step', i + 1, 'a prediction needs 2 to 4 short choices with exactly one right');
      if (i === 0 || i === sc.steps.length - 1 || (sc.steps[i + 1] || {}).ask) fail(id, 'step', i + 1, 'a prediction must be followed by the step that answers it');
    }
  });
  /* the five newer scenes each ask before their key reveals; the Subnetting pilot stays as it was */
  if (id !== 'quiz:net:Subnetting' && sc.steps.filter(s => s.ask).length < 2) fail(id, 'should ask for at least two predictions');
  if (sc.steps[1] && sc.steps[1].ask) fail(id, 'step 2 must not be a prediction (Play starts by moving to it)');
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

/* ---------- the five newer scenes teach their own lesson's example, with independently checked logic ---------- */
const lessonOf = id => { const L = T.LESSONS[id]; return [L.idea, L.seen, L.example, L.spot && L.spot.q, L.spot && L.spot.a].filter(Boolean).join('\n').replace(/<[^>]+>/g, '\n').replace(/&lt;/g, '<').replace(/&gt;/g, '>'); };   /* tags become line breaks, so table rows stay rows */
const lastState = id => T.sceneState(T.SCENES[id], T.SCENES[id].steps.length - 1);
/* Permissions: the string, the digits and which set applies */
{
  const E = T.PERM_EXAMPLE, txt = lessonOf('quiz:linux:Permissions');
  for (const must of ['-rw------- root root', 'chown root:www-data', 'chmod 640', 'www-data']) if (!txt.includes(must)) fail('Permissions lesson does not say', must);
  for (let mode = 0; mode < 512; mode++) {
    const p = T.permMath(mode), want = [6, 3, 0].map(sft => { const d = (mode >> sft) & 7; return (d & 4 ? 'r' : '-') + (d & 2 ? 'w' : '-') + (d & 1 ? 'x' : '-'); }).join('');
    if (p.str !== want || p.digits !== mode.toString(8).padStart(3, '0')) { fail('permMath wrong for', mode.toString(8)); break; }
  }
  if (T.permWho('www-data', ['www-data'], 'root', 'root') !== 2 || T.permWho('www-data', ['www-data'], 'root', 'www-data') !== 1 || T.permWho('root', [], 'root', 'x') !== 0) fail('permWho picks the wrong set');
  if (lastState('quiz:linux:Permissions').ls.t !== '-rw-r----- root www-data') fail('Permissions scene should end at -rw-r----- root www-data');
}
/* Firewalls: the lesson's table, its two worked packets, and the swap */
{
  const txt = lessonOf('quiz:sec:Firewalls'), rows = [...txt.matchAll(/^(\d)\s+(allow|deny)\s+(\S+)\s+(\S+)$/gm)].map(m => ({ act: m[2], src: m[3], port: m[4] === 'any' ? 'any' : +m[4] }));
  if (JSON.stringify(rows) !== JSON.stringify(T.FW_RULES)) fail('firewall scene rules differ from the lesson table', JSON.stringify(rows));
  const ev = (ip, port, order) => T.fwEval((order || [0, 1, 2, 3]).map(i => T.FW_RULES[i]), ip, port).hit;
  if (ev('10.0.5.20', 22) !== 0 || ev('198.51.100.7', 22) !== 1 || ev('198.51.100.7', 443) !== 2 || ev('198.51.100.7', 3389) !== 3) fail('firewall packets are decided by the wrong rules');
  if (T.FW_RULES[[1, 0, 2, 3][ev('10.0.5.20', 22, [1, 0, 2, 3])]].act !== 'deny') fail('after the swap the admin packet must be denied');
  if (!/10\.0\.5\.20/.test(txt) || !/198\.51\.100\.7/.test(txt)) fail('the firewall lesson should use the same packets');
}
/* SSH: first value wins, drop-ins in name order, only *.conf */
{
  const txt = lessonOf('quiz:sec:SSH hardening'), pa = r => r.settings.passwordauthentication;
  for (const must of ['50-cloud-init.conf:PasswordAuthentication yes', 'sshd_config:PasswordAuthentication no']) if (!txt.includes(must)) fail('SSH lesson does not show', must);
  if (pa(T.sshdRead(T.SSHD_MAIN, [T.SSHD_CLOUD])).value !== 'yes') fail('without the fix, the drop-in yes must win');
  if (pa(T.sshdRead(T.SSHD_MAIN, [T.SSHD_CLOUD, T.SSHD_FIX])).value !== 'no') fail('10-hardening.conf must win');
  if (pa(T.sshdRead(T.SSHD_MAIN, [T.SSHD_CLOUD, { name: '99-late.conf', lines: ['PasswordAuthentication no'] }])).value !== 'yes') fail('a later-named drop-in must lose');
  if (pa(T.sshdRead(T.SSHD_MAIN, [T.SSHD_CLOUD, { name: '00-first.cfg', lines: ['PasswordAuthentication no'] }])).file !== T.SSHD_CLOUD.name) fail('a file not ending .conf is never read');
  if (pa(T.sshdRead(T.SSHD_MAIN, [{ name: '00-a.conf', lines: ['passwordauthentication No'] }, T.SSHD_CLOUD])).value !== 'No') fail('keywords ignore case');
}
/* IAM: an explicit Deny wins in any order; nothing matching means denied */
{
  const txt = lessonOf('quiz:cloud:IAM & least privilege');
  for (const must of ['Allow s3:* on *', 'Deny s3:DeleteObject on payroll/*', 's3:GetObject', 'reports/*']) if (!txt.includes(must)) fail('IAM lesson does not say', must);
  const P = T.IAM_POLICY, d = (st, r) => T.iamEval(st, r[0], r[1]).decision, R = T.IAM_REQUESTS;
  if (d(P, R[0]) !== 'explicit-deny' || d(P.slice().reverse(), R[0]) !== 'explicit-deny') fail('the Deny must win in either order');
  if (d(P, R[1]) !== 'allow' || d(P, R[2]) !== 'implicit-deny') fail('read allowed, EC2 denied by default');
  if (d([T.IAM_NARROW, P[1]], R[3]) !== 'implicit-deny' || d([T.IAM_NARROW, P[1]], R[4]) !== 'allow') fail('the narrow Allow: delete denied by default, read allowed');
}
/* Leaked key: the lesson's commit and key, and its response order */
{
  const txt = lessonOf('quiz:cloud:Leaked key response');
  if (!txt.includes(T.LEAK.commits[1][0]) || !txt.includes(T.LEAK.key)) fail('the leaked-key scene should use the lesson\'s commit and example key');
  const order = [...T.LESSONS['quiz:cloud:Leaked key response'].idea.matchAll(/<li><b>([^<]+)<\/b>/g)].map(m => m[1]);
  if (JSON.stringify(order) !== JSON.stringify(T.LEAK_STEPS.map(x => x[0]))) fail('Try it order differs from the lesson:', order.join(', '));
}

/* size and the motion/reduced-motion rules */
const css = fs.readFileSync(path.join(__dirname, '..', 'src', 'styles.css'), 'utf8');
const sceneCss = css.split('\n').filter(l => /scene|\.sc\b|sc-|scflash/.test(l)).join('\n');
const kb = (fs.statSync(path.join(__dirname, '..', 'src', 'scenes.js')).size + sceneCss.length) / 1024;
/* A fixed budget, raised on purpose when a scene is added: 75 KB for these six (60 KB was set with only the Subnetting
   pilot). No single scene may take more than 16 KB of src/scenes.js, Try it panel included. */
if (kb > 75) fail('scenes add', kb.toFixed(1), 'KB; keep them under 75 KB (raise it on purpose when adding a scene)');
{ const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'scenes.js'), 'utf8'), marks = [...src.matchAll(/^\/\* -{10} (.+?) -{10} \*\/$/gm)];
  marks.forEach((m, i) => { const size = ((marks[i + 1] ? marks[i + 1].index : src.length) - m.index) / 1024; if (/:/.test(m[1]) && size > 16) fail('scene section', JSON.stringify(m[1].slice(0, 40)), size.toFixed(1), 'KB; keep each under 16 KB'); }); }
if (!/prefers-reduced-motion[^}]*\.scene \.sc\{transition:none\}/.test(css)) fail('reduced motion must switch scene transitions off');
if (/infinite/.test(sceneCss)) fail('scene animations must never loop');
console.log('scenes', ids.length, '| steps', ids.reduce((a, i) => a + T.SCENES[i].steps.length, 0), '| size', kb.toFixed(1), 'KB | problems', bad);
process.exitCode = bad ? 1 : 0;
