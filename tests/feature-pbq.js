// Performance-based practice: every task kind, built many times, always has a reachable right answer.
// Each dropdown answer is one of its options, order tasks use every position once, the model firewall passes all the
// test traffic (and a wide-open firewall fails), log answers match the attack, and the risk numbers add up.
const fs = require('fs');
const js = fs.readFileSync(__dirname + '/.tmp/script.js', 'utf8');
const line = n => { const i = js.indexOf('function ' + n + '('); return js.slice(i, js.indexOf('\n', i)); };
const dayStr = () => '2026-11-12', save = () => {}, toast = () => {};
let S = { mastery: {}, lessons: {}, quiz: {}, miss: {}, journal: [] };
eval(js.split('/* ===================== STATE')[0] + ';' + line('shuffle') + ';' + line('esc') +
  ';global.P = {PBQ_BUILDERS, SKILLS: Object.keys(GEN).flatMap(t => genSkills(t).map(([sk]) => "quiz:" + t + ":" + sk))};');
let bad = 0; const fail = (...a) => { bad++; if (bad < 25) console.log('FAIL', ...a); };
let built = 0, fields = 0;
for (const b of P.PBQ_BUILDERS) for (let k = 0; k < 300; k++) {
  const t = b(); built++;
  if (!t.title || !t.html || !Array.isArray(t.fields) || !t.fields.length) { fail(b.name, 'is missing parts'); break; }
  if (!P.SKILLS.includes(t.skill)) { fail(b.name, 'counts toward a skill that does not exist:', t.skill); break; }
  const labels = t.fields.map(f => f.label);
  if (new Set(labels).size !== labels.length) fail(b.name, 'has two items with the same label');
  for (const f of t.fields) {
    fields++;
    if (t.check) continue;
    if (f.num) { if (typeof f.answer !== 'number' || !isFinite(f.answer)) fail(b.name, f.label, 'has no numeric answer'); }
    else if (!f.options.includes(f.answer)) fail(b.name, f.label, 'answer is not an option:', f.answer);
    if (!f.why) fail(b.name, f.label, 'has no explanation');
  }
  if (/Order$/.test(b.name)) { const a = t.fields.map(f => f.answer).sort(); if (a.join() !== t.fields.map((_, i) => String(i + 1)).join()) fail(b.name, 'positions are not 1..n once each'); }
  if (b.name === 'firewall') {
    const g = /One answer: 1 Allow (\S+) → (\S+) (\S+) · 2 Allow (\S+) → (\S+) (\S+) · 3 Allow (\S+) → (\S+) (\S+) · 4 Deny Any → Any Any/.exec(t.check({}).model);
    if (!g) { fail('firewall model answer cannot be read'); break; }
    const v = {}; [1, 2, 3].forEach((r, i) => { v['Rule ' + r + ' action'] = 'Allow'; v['Rule ' + r + ' source'] = g[1 + i * 3]; v['Rule ' + r + ' destination'] = g[2 + i * 3]; v['Rule ' + r + ' port'] = g[3 + i * 3]; });
    Object.assign(v, { 'Rule 4 action': 'Deny', 'Rule 4 source': 'Any', 'Rule 4 destination': 'Any', 'Rule 4 port': 'Any' });
    for (const [k, val] of Object.entries(v)) if (!t.fields.find(f => f.label === k).options.includes(val)) fail('firewall model uses a value not offered:', k, val);
    if (!t.check(v).parts.every(p => p.ok)) fail('firewall model answer fails its own traffic:', t.check(v).parts.filter(p => !p.ok).map(p => p.text));
    const open = { 'Rule 1 action': 'Allow', 'Rule 1 source': 'Any', 'Rule 1 destination': 'Any', 'Rule 1 port': 'Any' };
    if (t.check(open).parts.every(p => p.ok)) fail('a wide-open firewall passes');
    if (t.check({}).parts.every(p => p.ok)) fail('an empty firewall passes');
  }
  if (b.name === 'logs') {
    const atk = t.fields[t.fields.length - 1].answer, bad = t.fields.filter(f => f.answer === 'Part of the attack');
    const users = new Set(bad.map(f => (/for (\S+) from/.exec(t.html.replace(/<[^>]+>/g, '\n').split('\n').find(l => l.startsWith(f.label.split(': ')[1])) || '') || [])[1]));
    if (bad.length !== 5) fail('logs: expected 5 attack lines, got', bad.length);
    if ((atk === 'Password spraying') !== (users.size > 1)) fail('logs: attack name does not match the lines', atk, [...users]);
  }
  if (b.name === 'risk') {
    const [sle, aro, ale] = t.fields.map(f => f.answer);
    if (Math.abs(sle * aro - ale) > 1) fail('risk: ALE is not SLE × ARO', sle, aro, ale);
  }
}
console.log('pbq kinds', P.PBQ_BUILDERS.length, '| tasks built', built, '| items', fields, '| problems', bad);
process.exitCode = bad ? 1 : 0;
