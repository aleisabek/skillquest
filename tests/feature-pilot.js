// Permissions pilot (handoff §5.4 and §10): lab reports are validated in full, imported without anything irreversible,
// kept through backup -> restore, merged the same way whichever device is merged into which, and conflicting records
// for one attempt id are both kept, unresolved, and count for nothing until one is chosen. The evidence panel counts
// only what each step can honestly show: guided passes never become independent evidence, a retry is practice, and a
// delayed check counts only 3+ days after an independent pass.
const fs = require('fs');
const vm = require('vm');
const js = fs.readFileSync(__dirname + '/.tmp/script.js', 'utf8');
const [before, app] = js.split('/* ===================== STATE');
const grab = n => { const i = app.indexOf('function ' + n + '('); if (i < 0) { if (before.includes('function ' + n + '(')) return ''; throw new Error('missing ' + n); } return app.slice(i, app.indexOf('\n}', i) + 2); };
const line = n => { const i = app.indexOf(n); if (i < 0) { if (before.includes(n)) return ''; throw new Error('missing ' + n); } return app.slice(i, app.indexOf('\n', i)); };
let bad = 0, checks = 0; const fail = (...a) => { bad++; if (bad < 30) console.log('FAIL', ...a); };
const expect = (ok, ...msg) => { checks++; if (!ok) fail(...msg); };

const C = { saves: 0, structuredClone, console };
vm.createContext(C);
vm.runInContext(before + '\n' + [line('const DEFAULT'), line('const BOX_DAYS'), line('const QUIZ_FADE'), line('function dayStr('), line('function addDays('), line('function esc('),
  line('const stableStr'), line('const tieLow'), line('const DATE_RE'), line('const isObj'), line('const clampNum'), line('const okDate'), grab('cleanMap'), grab('sanitizeBackup'),
  line('let EV_REJECTED'), line('const evNote'), grab('cleanEntry'), line('const SAFE_TAGS'), grab('safeHTML'), grab('migrateQuiz'), grab('isFullDay'), grab('recountStreak'),
  grab('mergeProgress'), grab('migrateTerm')].join('\n') +
  '\nvar S = structuredClone(DEFAULT); function save(){ saves++; return true; } function toast(){}' +
  '\nglobalThis.X = {get S(){ return S; }, set S(v){ S = v; }, PILOT, validateReport, importReports, resolveAttempt, pilotEvidence, pilotAttempts, syncPilotJournal, labDue, evHash,' +
  ' sanitizeBackup, mergeProgress, DEFAULT, dayStr, addDays, stableStr, pilotHTML, get EV_REJECTED(){ return EV_REJECTED; }, evNote, journal};', C);
const X = C.X;

/* a report as sq-lab writes it (see labs/sq-evidence.py) */
let n = 0;
const uuid = () => { const h = (++n).toString(16).padStart(12, '0'); return '00000000-0000-4000-8000-' + h; };
const iso = (daysAgo, h) => { const d = new Date(); d.setDate(d.getDate() - daysAgo); d.setHours(h || 12, 0, 0, 0); return d.toISOString().slice(0, 19) + 'Z'; };
function report(o) {
  o = Object.assign({ lab: 'perm-diagnose', fault: 'dir-x', fixed: true, q1: null, q2: null, hints: [], ago: 0, id: uuid(), outcome: null }, o);
  const checks = ['config opens with cat', 'config contents unchanged', 'every file and folder still in place', 'nobody else gained access', "no copies of the config's secret"]
    .map((c, i) => ({ check: c, expected: 'ok', observed: o.fixed || i ? 'ok' : 'cat: Permission denied', pass: o.fixed || i > 0 }));
  const q1 = o.q1 || o.fault, q2 = o.q2 || (o.fault === 'dir-x' ? 'file-r' : 'dir-x');
  const named = q1 === o.fault, ruled = X.PILOT.ruledOut[o.fault].includes(q2);
  const outcome = o.outcome || (!(o.fixed && named && ruled) ? 'fail' : o.hints.length ? 'hinted-pass' : 'independent-pass');
  const r = { schema_version: 2, attempt_id: o.id, content_id: o.lab, content_version: 1, attempt_date: iso(o.ago, 10), finished_at: iso(o.ago, 11),
    scenario_family: 'perm-read-own-file', scenario_instance_id: 'abcdef012345', fault_type: o.fault, previous_exposure: o.prev || [],
    assistance_viewed: o.hints, help_used: o.hints.length ? o.hints.slice().sort().pop() : 'none', evidence: 'not recorded',
    checker_results: outcome === 'abandoned' ? [] : checks, outcome, checker: { name: 'sq-lab', version: '2.0' } };
  if (outcome !== 'abandoned') r.reasoning = { fault_named: q1, ruled_out: q2, fault_named_right: named, ruled_out_valid: ruled, provenance: 'learner-reported, compared by sq-lab' };
  return r;
}
const line2 = r => 'SQR2 ' + JSON.stringify(r);
const fresh = () => { X.S = structuredClone(X.DEFAULT); };
const ev = () => X.pilotEvidence();

/* ---------- 1. validation: well formed, consistent, nothing unknown ---------- */
const good = report({});
expect(X.validateReport(good).rec, 'a valid report should pass:', X.validateReport(good).why);
const broken = [
  ['unknown field', r => { r.score = 99; }], ['future schema', r => { r.schema_version = 3; }], ['bad attempt id', r => { r.attempt_id = '../x'; }],
  ['not a pilot lab', r => { r.content_id = 'permissions'; }], ['finished before it started', r => { r.finished_at = '2020-01-01T00:00:00Z'; }],
  ['unknown fault', r => { r.fault_type = 'root'; }], ['claims a pass with a failed check', r => { r.checker_results[0].pass = false; }],
  ['claims independent with a hint', r => { r.assistance_viewed = ['hint-1']; }], ['help_used mismatch', r => { r.help_used = 'hint-2'; }],
  ['self-graded reasoning', r => { r.reasoning.fault_named = 'file-r'; }], ['too long', r => { r.reflection = 'x'.repeat(501); }],
  ['markup in a check is fine but extra keys are not', r => { r.checker_results[0].html = '<img onerror=1>'; }],
  ['reasoning on an abandoned attempt', r => { r.outcome = 'abandoned'; }], ['no checker', r => { delete r.checker; }],
  ['a pass with no checks at all', r => { r.checker_results = []; }]];
for (const [name, f] of broken) { const r = structuredClone(good); f(r); const v = X.validateReport(r); expect(!v.rec && v.why, 'should be refused:', name); }
expect(/newer sq-lab/.test(X.validateReport(Object.assign({}, good, { schema_version: 3 })).why), 'a future version should say so plainly');
expect(X.validateReport(report({ outcome: 'abandoned' })).rec, 'an abandoned attempt is a valid report');
expect(X.validateReport(report({ lab: 'perm-guided', fault: 'file-r', hints: ['hint-1', 'hint-3'] })).rec, 'all three hint levels are valid (hint-3 added, Alei 2026-11-04)');

/* ---------- 2. import: refuse clearly, store nothing for a bad line, never twice ---------- */
fresh();
let res = X.importReports(line2(good) + '\nhello\nSQR2 {broken\n' + line2(Object.assign({}, good, { schema_version: 9 })));
expect(res.length === 4 && res[0].rec && res.slice(1).every(r => r.why), 'one good line, three refused with reasons', JSON.stringify(res.map(r => r.why || 'ok')));
expect(X.S.evidence.length === 1, 'only the valid report is stored');
res = X.importReports(line2(good));
expect(res[0].dup && X.S.evidence.length === 1, 'importing the same report again changes nothing');
const before1 = X.stableStr(X.S.mastery);
expect(before1 === X.stableStr(X.DEFAULT.mastery), 'importing never touches practice scores');

/* ---------- 3. lifecycle conflicts: same id, different report -> both kept, unresolved, no credit ---------- */
fresh();
const id = uuid(), pass = report({ id }), failed = report({ id, fixed: false });
X.importReports(line2(pass));
res = X.importReports(line2(failed));
expect(res[0].conflict, 'a different report for the same attempt is flagged');
expect(X.S.evidence.length === 2, 'both reports are kept');
expect(ev().unresolved.length === 1 && !ev().first, 'an unresolved attempt counts for nothing');
/* compared without import times, which are app-side and differ by when you clicked */
const view1 = () => X.stableStr([X.S.evidence.map(e => e.p), ev().unresolved.map(a => a.id), ev().first, ev().guided, ev().rech, X.journal()]);
const orderA = view1();
fresh(); X.importReports(line2(failed)); X.importReports(line2(pass));
expect(view1() === orderA, 'import order does not change the result');
X.resolveAttempt(id, X.evHash(pass), 'second device was a test');
expect(ev().unresolved.length === 0 && ev().first && ev().first.outcome === 'independent-pass', 'choosing one resolves it');
expect(X.S.evidence.length === 2, 'the superseded report stays');
expect(X.pilotHTML().includes('Independent') && !X.pilotHTML().includes('Unresolved attempt'), 'the panel shows the resolved attempt');

/* ---------- 4. backup: valid survives, invalid and future refused and counted ---------- */
fresh(); X.importReports([report({}), report({ lab: 'perm-guided', fault: 'file-r', hints: ['hint-2'] })].map(line2).join('\n'));
const exported = JSON.parse(JSON.stringify(X.S));
exported.evidence.push({ p: Object.assign({}, good, { schema_version: 3 }), at: null }, { p: { attempt_id: 'x' }, at: null }, 'junk');
const restored = X.sanitizeBackup(exported);
expect(restored.evidence.length === 2, 'valid reports survive backup -> restore, got', restored.evidence.length);
expect(X.EV_REJECTED === 3 && /3 pilot lab reports were refused/.test(X.evNote()), 'refused reports are counted and reported:', X.EV_REJECTED);
expect(X.stableStr(restored.evidence.map(e => e.p)) === X.stableStr(X.S.evidence.map(e => e.p)), 'restored reports are unchanged');
expect(X.sanitizeBackup({ xp: 5 }).evidence.length === 0 && X.EV_REJECTED === 0, 'an old backup without pilot data still restores');

/* ---------- 5. merge: the same answer both ways, including conflicts and resolutions ---------- */
for (let t = 0; t < 200; t++) {
  const pool = [];
  for (let k = 0; k < 4; k++) { const i = uuid(); pool.push(report({ id: i }), report({ id: i, fixed: false }), report({ lab: 'perm-recheck', ago: k })); }
  const pick = () => pool.filter(() => Math.random() < 0.4).map(p => ({ p, at: iso(Math.floor(Math.random() * 5)) }));
  const devA = Object.assign(structuredClone(X.DEFAULT), { evidence: pick(), pilot: Math.random() < .5 ? { worked: X.addDays(X.dayStr(), -2) } : {} });
  const devB = Object.assign(structuredClone(X.DEFAULT), { evidence: pick(), pilot: Math.random() < .5 ? { worked: X.addDays(X.dayStr(), -4) } : {} });
  const conflictId = pool[0].attempt_id;
  if (Math.random() < .5) devA.evres = { [conflictId]: { keep: X.evHash(pool[0]), at: iso(1), note: 'a' } };
  if (Math.random() < .5) devB.evres = { [conflictId]: { keep: X.evHash(pool[1]), at: iso(Math.random() < .5 ? 1 : 2), note: 'b' } };
  const ab = X.mergeProgress(devA, devB), ba = X.mergeProgress(devB, devA);
  const pick3 = m => X.stableStr([m.evidence, m.evres, m.pilot]);
  if (pick3(ab) !== pick3(ba)) { fail('merge depends on direction', t); break; }
  X.S = ab; const e1 = X.stableStr(ev()); X.S = ba; if (e1 !== X.stableStr(ev())) { fail('evidence panel depends on merge direction', t); break; }
}
/* the same report imported on two devices (different import times) is one attempt, not a conflict */
const shared = report({});
const d1 = Object.assign(structuredClone(X.DEFAULT), { evidence: [{ p: shared, at: iso(1) }] }), d2 = Object.assign(structuredClone(X.DEFAULT), { evidence: [{ p: shared, at: iso(0) }] });
const m12 = X.mergeProgress(d1, d2);
expect(m12.evidence.length === 1 && m12.evidence[0].at === iso(1), 'cross-device: one record, earliest import time');

/* ---------- 6. what each step can show ---------- */
fresh();
X.importReports(line2(report({ lab: 'perm-guided', fault: 'file-r', ago: 9 })));
expect(!ev().first && ev().guided.length === 1, 'an unhinted guided pass is practice, never the independent row');
X.importReports(line2(report({ fixed: false, ago: 8 })));
X.importReports(line2(report({ ago: 7 })));
expect(ev().first.outcome === 'fail' && !ev().indep && ev().retries.length === 1, 'the first step 3 attempt is the evidence; a later pass is practice');
expect(X.journal().some(e => e.kind === 'lab' && e.done), 'a fail goes to the journal and clears after a later pass');
fresh();
X.importReports(line2(report({ ago: 5 })));
X.importReports(line2(report({ lab: 'perm-recheck', ago: 4 })));
expect(!ev().delayed && ev().rech[0].gap === 1, 'a recheck 1 day later does not count as delayed');
expect(X.journal().some(e => e.key === 'lab|perm-recheck' && !e.done && X.labDue(e)), 'the delayed check is due from day 3, as a journal entry');
X.importReports(line2(report({ lab: 'perm-recheck', ago: 1, fixed: false })));
expect(ev().delayed && ev().delayed.gap === 4 && ev().delayed.r.outcome === 'fail', 'a recheck 4 days later counts, pass or fail');
expect(ev().indep, 'a failed delayed check does not erase the independent pass');
expect(X.journal().some(e => e.key === 'lab|perm-recheck' && e.done), 'the delayed-check entry clears once it is done');
fresh();
X.importReports(line2(report({ lab: 'perm-recheck', ago: 6 })));
X.importReports(line2(report({ ago: 5 })));
expect(!ev().delayed && ev().rech[0].gap < 0, 'a recheck before the independent pass is not delayed evidence');
fresh();
X.importReports(line2(report({ outcome: 'abandoned' })));
expect(!ev().first, 'an abandoned attempt counts for nothing');
fresh();
X.importReports(line2(report({ prev: [{ content_id: 'perm-recheck', fault_type: 'dir-x' }] })));
expect(!ev().first, 'a step 3 attempt after this fault was already seen is not unfamiliar evidence');
/* legacy labs stay legacy */
fresh(); X.S.labs = { permissions: '2026-10-01' };
expect(/legacy: details unknown/.test(X.pilotHTML()), 'the old completion-code lab is shown as legacy');
/* text from a report is escaped on display */
fresh(); const evil = report({}); evil.reflection = '<img src=x onerror=alert(1)>'; X.importReports(line2(evil));
expect(!/<img/.test(X.pilotHTML()), 'report text never becomes markup');

console.log('pilot checks', checks, '| problems', bad);
process.exitCode = bad ? 1 : 0;
