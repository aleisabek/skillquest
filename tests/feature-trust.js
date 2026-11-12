// Answers mean what they say, and progress operations tell the truth:
//  1. a typed command is checked as the shell would read it (quotes that merge words don't pass),
//  2. grep/rsync flags that change the result (-v, -c, -l, -q, -o, -I, rsync -n) are never credited,
//  3. SQL text in quotes keeps its case ('it' is not 'IT'), except after LIKE, which ignores case in SQLite,
//  4. a solved terminal task is credited once and waits for Next (no timer that can outlive the page),
//  5. restore/merge/erase/undo never lose the undo copy or report success when storage refused the save,
//  6. a microphone permission that arrives after you left never starts a recording.
const fs = require('fs');
const vm = require('vm');
const js = fs.readFileSync(__dirname + '/.tmp/script.js', 'utf8');
const [before, app] = js.split('/* ===================== STATE');
const grab = n => { const i = app.indexOf('function ' + n + '('); if (i < 0) throw new Error('missing ' + n); return app.slice(i, app.indexOf('\n}', i) + 2); };
const line = n => { const i = app.indexOf(n); if (i < 0) throw new Error('missing ' + n); return app.slice(i, app.indexOf('\n', i)); };
let bad = 0, checks = 0; const fail = (...a) => { bad++; if (bad < 30) console.log('FAIL', ...a); };
const expect = (ok, ...msg) => { checks++; if (!ok) fail(...msg); };

/* ---------- 1. termNorm: shell words ---------- */
const C = {};
vm.createContext(C);
vm.runInContext(before + '\n' + line('function shuffle(') + '\n' + line('function norm(') + '\n' + grab('termNorm') + '\n' + grab('sqlNorm') + '\nglobalThis.X = {termNorm, sqlNorm, TERM, TGEN, SQLT, SGEN, CERTS, examCoverage, LESSONS};', C);
const { termNorm, sqlNorm, TERM, TGEN, SQLT, SGEN } = C.X;
for (const ok of ['grep "failed login" auth.log', "cut -d' ' -f1 users.txt", "awk -F' ' '{print $1}' f", "alias ll='ls -la'", "sed 's/a/b/g' f",
  'cat "q3 report.md"', "echo it\\'s", 'find . -name x -exec rm {} \\;', 'echo "a;b|c"', "grep 'failed' auth.log", 'ls -la 2>&1 | grep x'])
  expect(termNorm(ok) !== null, 'termNorm should accept', ok);
for (const ok of ['sudo systemctl restart nginx', 'sudo -u bob ls -la', 'sudo grep -i "bad login" /var/log/auth.log', 'find . -name "*.log" | xargs grep -n error'])
  expect(termNorm(ok) !== null, 'termNorm should accept', ok);
for (const no of ["sudo 'systemctl restart nginx'", "time 'ls -la'", "sudo -n 'ls -la'", "'ls -la'", '"ls -la"', "cat auth.log | 'grep failed'", "ls '-l -a'", "echo 'open", 'echo "open', "x && 'rm -rf' d"])
  expect(termNorm(no) === null, 'termNorm should reject', no);

/* ---------- 2. flags that change what grep/rsync do ---------- */
const accepts = (t, a) => { const v = termNorm(a); return v !== null && t[1].some(r => r.test(v)); };
const fixed = re => { const t = TERM.find(x => re.test(x[0])); if (!t) throw new Error('no task ' + re); return t; };
const failed = fixed(/^Find every line containing the word failed/);
for (const a of ['grep failed auth.log', 'grep -n failed auth.log', 'grep -i failed auth.log', 'grep -w failed auth.log', 'cat auth.log | grep -n failed']) expect(accepts(failed, a), 'should accept', a);
for (const f of ['-v', '-c', '-l', '-q', '-o', '-L', '-vn']) expect(!accepts(failed, 'grep ' + f + ' failed auth.log') && !accepts(failed, 'cat auth.log | grep ' + f + ' failed'), 'should reject grep', f);
expect(!accepts(failed, "'grep failed' auth.log"), 'a quoted command name is one word');
const sys = fixed(/any capitalization\) in \/var\/log\/syslog/);
for (const a of ['grep -i error /var/log/syslog', 'grep -i ERROR /var/log/syslog', 'sudo grep -i Error /var/log/syslog']) expect(accepts(sys, a), 'should accept', a);
for (const a of ['grep -I error /var/log/syslog', 'GREP -i error /var/log/syslog', 'grep error /var/log/syslog']) expect(!accepts(sys, a), 'should reject', a);
const live = fixed(/^Follow app\.log live/);
for (const a of ['tail -f app.log | grep ERROR', 'tail -f app.log | grep -n ERROR', 'tail -f app.log | grep -i error']) expect(accepts(live, a), 'should accept', a);
for (const a of ['tail -f app.log | grep error', 'tail -f app.log | grep -v ERROR', 'TAIL -F app.log | grep ERROR', 'tail -f app.log | grep -I error']) expect(!accepts(live, a), 'should reject', a);
const strs = fixed(/readable strings inside program\.bin/);
expect(accepts(strs, 'strings program.bin | grep key') && !accepts(strs, 'strings program.bin | grep -v key') && !accepts(strs, 'strings program.bin | grep -c key'), 'strings | grep flags');
const gens = re => TGEN.filter(g => { for (let k = 0; k < 40; k++) if (re.test(g.f()[0])) return true; return false; });
const sample = (re, n, f) => { for (const g of gens(re)) for (let k = 0, hit = 0; k < 400 && hit < n; k++) { const t = g.f(), m = t[0].match(re); if (m) { hit++; f(t, m); } } };
sample(/^Show every line containing the word (\S+) in (\S+)\.$/, 30, (t, [, w, f]) => {
  expect(accepts(t, 'grep ' + w + ' ' + f) && accepts(t, 'grep -n ' + w + ' ' + f), 'grep word should pass', t[0]);
  for (const fl of ['-v', '-c', '-l', '-q', '-o']) expect(!accepts(t, 'grep ' + fl + ' ' + w + ' ' + f), 'generated grep should reject', fl, t[0]);
});
let tailChecked = 0;
sample(/^Follow (\S+) live and show only lines containing (\S+)\.$/, 30, (t, [, f, w]) => {
  tailChecked++;
  expect(accepts(t, 'tail -f ' + f + ' | grep ' + w) && accepts(t, 'tail -f ' + f + ' | grep -i ' + w.toLowerCase()), 'tail | grep should pass', t[0]);
  expect(!accepts(t, 'tail -f ' + f + ' | grep -v ' + w), 'tail | grep -v should fail', t[0]);
  if (w !== w.toLowerCase()) expect(!accepts(t, 'tail -f ' + f + ' | grep ' + w.toLowerCase()), 'case-sensitive grep with the wrong case should fail', t[0]);
});
expect(tailChecked > 0, 'no generated tail | grep tasks were found');
let rsyncChecked = 0;
sample(/^Copy (\S+) to the \/tmp folder on (\S+), logging in as (\S+)\.$/, 20, t => {
  rsyncChecked++;
  const arg = t[2].replace(/^scp /, '');
  expect(accepts(t, 'rsync -avz ' + arg) && !accepts(t, 'rsync -n ' + arg) && !accepts(t, 'rsync -avn ' + arg), 'rsync -n (a dry run) must not count', t[2]);
});
expect(rsyncChecked > 0, 'no generated copy tasks were found');

/* ---------- 3. SQL: quoted text keeps its case, except after LIKE ---------- */
const sqlOK = (t, a) => t[2].some(r => r.test(sqlNorm(a)));
/* swap the case of every quoted value that isn't a LIKE pattern; null when that changes nothing */
const swapLiterals = sql => { let changed = false;
  const out = sql.replace(/(\blike\s*)?'([^']*)'/gi, (all, like, v) => { if (like) return all; const s = v.replace(/[a-z]/gi, c => c === c.toLowerCase() ? c.toUpperCase() : c.toLowerCase()); if (s !== v) changed = true; return "'" + s + "'"; });
  return changed ? out : null; };
const sqlTasks = SQLT.slice(); for (const g of SGEN) for (let k = 0; k < 25; k++) sqlTasks.push(g.f());
let swapped = 0;
for (const t of sqlTasks) {
  expect(sqlOK(t, t[3]), 'SQL model answer rejected', t[3]);
  const w = swapLiterals(t[3]); if (w) { swapped++; expect(!sqlOK(t, w), 'wrong-case text in quotes was accepted:', w); }
  if (/ like '/i.test(t[3])) expect(sqlOK(t, t[3].replace(/(like\s*')([^']*)'/i, (a, p, v) => p + v.toUpperCase() + "'")), 'LIKE ignores case, so an upper-case pattern should pass', t[3]);
}
expect(swapped > 20, 'too few SQL answers with quoted text were checked:', swapped);
const it = SQLT.find(t => /IT department/.test(t[1]));
expect(sqlOK(it, "SELECT * FROM users WHERE department = 'IT';") && !sqlOK(it, "select * from users where department = 'it'"), 'the IT task must need IT');
expect(sqlOK(SQLT.find(t => /"printer" anywhere/.test(t[1])), "SELECT * FROM tickets WHERE title LIKE '%PRINTER%'"), 'LIKE %PRINTER% should pass');

/* ---------- 4. terminal: settle once, explicit Next, nothing left running ---------- */
{
  let nodes = {}, timers = 0, xp = 0;
  const view = {}; let html = '';
  Object.defineProperty(view, 'innerHTML', { get: () => html, set: v => { html = v; nodes = {}; } });
  const T = { console, view, esc: String, norm: null, TERM: [], S: { gen: {}, term: {} }, skillIdFor: () => null, recordSkill() {}, addXP: n => { xp += n; }, save() {}, addNote() {},
    finishMission() {}, startTerm() {}, go() {}, say() {}, setTimeout: () => { timers++; }, $: sel => nodes[sel] = nodes[sel] || { value: '', focus() {} } };
  vm.createContext(T);
  vm.runInContext(line('function norm(') + '\n' + grab('termNorm') + '\n' + grab('termStep') + '\nglobalThis.step = termStep;', T);
  const task = ['Print working directory', [/^pwd$/], 'pwd', 'Use pwd'], ls = ['List all files', [/^ls -la$/], 'ls -la', 'ls'];
  const s = { items: [task, ls], i: 0, lines: [], hinted: false, right: 0 };
  T.step(s);
  const inp = T.$('#cmd'), enter = { key: 'Enter', preventDefault() {} };
  inp.value = 'pwd'; inp.onkeydown(enter);
  expect(s.right === 1 && xp === 15 && s.settled, 'a correct answer should be credited once and settle the task', JSON.stringify({ right: s.right, xp }));
  expect(/id="tnext"/.test(html) && !/id="cmd"/.test(html), 'a settled task shows Next and no command input');
  inp.onkeydown(enter); inp.onkeydown(enter);   /* the old input's handler, pressed again */
  expect(s.right === 1 && xp === 15 && s.i === 0, 'pressing Enter again must not credit or skip anything', JSON.stringify({ right: s.right, xp, i: s.i }));
  expect(timers === 0, 'no timer may be started (it could redraw a page you already left)');
  T.$('#tnext').onclick();
  expect(s.i === 1 && !s.settled && /id="cmd"/.test(html), 'Next moves to the next task');
  const inp2 = T.$('#cmd'); inp2.value = "'ls -la'"; inp2.onkeydown(enter);
  expect(s.right === 1 && /Check the quotes/.test(html), 'a quoted command name is rejected with a reason');
  const inp3 = T.$('#cmd'); inp3.value = 'ls -la'; inp3.onkeydown(enter);
  expect(s.right === 2 && /See results/.test(html), 'the last task offers See results');
}

/* ---------- 5. storage: undo copy first, and only true success is reported ---------- */
{
  const store = {}, toasts = [], failKeys = new Set();
  const ctx = { console, structuredClone, full: false, blocked: false };
  /* full = out of space (a quota error, data still stored); blocked = the browser refuses storage altogether */
  const refuse = () => { if (ctx.blocked) { const e = new Error('The operation is insecure.'); e.name = 'SecurityError'; throw e; } };
  ctx.localStorage = { get length() { return ctx.blocked ? 0 : Object.keys(store).length; }, getItem: k => { refuse(); return k in store ? store[k] : null; },
    setItem: (k, v) => { refuse(); if (ctx.full || failKeys.has(k)) { const e = new Error('Quota exceeded'); e.name = 'QuotaExceededError'; throw e; } store[k] = String(v); }, removeItem: k => { refuse(); delete store[k]; } };
  vm.createContext(ctx);
  vm.runInContext(before + '\n' + [
    line('const KEY'), line('const DEFAULT'), line('let saveBlocked'), line('const QUIZ_FADE'), 'var S;', 'globalThis.toasts = [];',
    'function toast(m){ toasts.push(m); } function header(){} function vProgress(){} function vBackup(){}',
    'globalThis.asked = []; function askConfirm(msg, yes, onYes){ asked.push({msg, yes, onYes}); }',
    grab('storageBlocked'), grab('replaceDone'),
    grab('save'), line('function warnSave('), line('const PREV'), line('function snapshot('), line('function prevSnapshot('),
    line('function prevRaw('), line('function putPrevRaw('), grab('undoLast'), grab('replaceProgress'), grab('importBackup'),
    grab('migrateTerm'), line('function dayStr('), line('function addDays('), line('function esc('),
    line('const DATE_RE'), line('const isObj'), line('const clampNum'), line('const okDate'), grab('cleanMap'), grab('sanitizeBackup'), grab('cleanEntry'), line('const SAFE_TAGS'), grab('safeHTML'),
    grab('migrateQuiz'), grab('isFullDay'), grab('recountStreak'), line('const stableStr'), line('const tieLow'), grab('mergeProgress'),
    'globalThis.T = { save, undoLast, importBackup, replaceProgress, replaceDone, KEY, PREV, DEFAULT, get S(){ return S; }, set S(v){ S = v; }, reset(){ saveBlocked = saveFailed = saveWarned = false; } };'
  ].join('\n'), ctx);
  const T = ctx.T, K = T.KEY, P = T.PREV;
  const fresh = xp => { for (const k of Object.keys(store)) delete store[k]; failKeys.clear(); ctx.full = ctx.blocked = false; ctx.toasts.length = 0; T.reset();
    T.S = Object.assign(structuredClone(T.DEFAULT), { xp }); T.save(); };
  const backup = JSON.stringify(Object.assign(structuredClone(T.DEFAULT), { xp: 500 }));
  const oldUndo = JSON.stringify({ at: '2026-10-01', what: 'merge', S: Object.assign(structuredClone(T.DEFAULT), { xp: 1 }) });

  fresh(40); store[P] = oldUndo; failKeys.add(P);
  let r = T.importBackup(backup, 'replace');
  expect(r === 'nosnap' && T.S.xp === 40 && JSON.parse(store[K]).xp === 40, 'no undo copy, no force: nothing may change', r);
  r = T.importBackup(backup, 'replace', true);
  expect(r === 'noundo' && T.S.xp === 500 && JSON.parse(store[K]).xp === 500 && !(P in store), 'forced: it saves and the unrelated old undo copy is gone', r);

  fresh(40); store[P] = oldUndo; failKeys.add(K);
  r = T.importBackup(backup, 'replace');
  expect(r === 'nosave' && T.S.xp === 40 && store[P] === oldUndo, 'a refused save puts back the progress and the earlier undo copy', r, T.S.xp);

  fresh(40); r = T.replaceProgress('reset', () => structuredClone(T.DEFAULT));
  expect(r === 'ok' && T.S.xp === 0 && JSON.parse(store[P]).S.xp === 40, 'erase keeps an undo copy', r);
  failKeys.add(K);
  expect(T.undoLast() === false && T.S.xp === 0 && P in store, 'undo whose save is refused must keep the undo copy and change nothing');
  expect(ctx.toasts.some(m => /Not undone/.test(m)), 'a failed undo says so');
  failKeys.clear();
  expect(T.undoLast() === true && T.S.xp === 40 && !(P in store) && JSON.parse(store[K]).xp === 40, 'undo works once storage does');

  fresh(40); ctx.full = true; T.save();   /* storage stops working altogether, e.g. blocked in this browser */
  r = T.importBackup(backup, 'merge');
  expect(r === 'nosnap' && T.S.xp === 40, 'blocked storage asks before going on without undo', r);
  r = T.importBackup(backup, 'merge', true);
  expect(r === 'session' && T.S.xp >= 500, 'blocked storage: a chosen merge still applies for this session', r, T.S.xp);
  expect(T.importBackup('not a backup', 'merge') === 'bad', 'a broken file is reported as bad');

  /* going ahead without undo is offered only where storage is blocked outright, never when the undo copy merely failed */
  fresh(40); failKeys.add(P); ctx.asked.length = 0;
  T.replaceDone(T.importBackup(backup, 'replace'), 'Backup restored.', () => T.importBackup(backup, 'replace', true));
  expect(ctx.asked.length === 0 && T.S.xp === 40 && ctx.toasts.some(m => /^Nothing changed/.test(m)), 'storage that works but refused the undo copy: abort, no bypass offered');
  fresh(40); ctx.full = true; T.save(); ctx.asked.length = 0; ctx.toasts.length = 0;   /* exactly full: even the probe fails, but data is stored */
  T.replaceDone(T.importBackup(backup, 'replace'), 'Backup restored.', () => T.importBackup(backup, 'replace', true));
  expect(ctx.asked.length === 0 && T.S.xp === 40 && ctx.toasts.some(m => /^Nothing changed/.test(m)), 'a full (not blocked) browser: abort, no bypass offered');
  fresh(40); ctx.blocked = true; T.save(); ctx.asked.length = 0;
  T.replaceDone(T.importBackup(backup, 'replace'), 'Backup restored.', () => T.importBackup(backup, 'replace', true));
  expect(ctx.asked.length === 1 && /cannot be undone/.test(ctx.asked[0].msg) && T.S.xp === 40, 'blocked storage: asks first, says it cannot be undone, changes nothing yet');
  ctx.asked[0].onYes();
  expect(T.S.xp === 500 && ctx.toasts.some(m => /until you close the page/.test(m)), 'blocked storage, confirmed: restored for this session, and it says so');
}

/* ---------- 6. recorder: a late microphone answer never records ---------- */
const recorderRun = async () => {
  const rec = fs.readFileSync(__dirname + '/../src/recorder.js', 'utf8');
  const make = () => {
    let answer, refuse; const asked = { n: 0 }, state = { started: 0, released: 0, toasts: [] };
    const box = { innerHTML: '', dataset: {}, querySelectorAll: () => [] }, btn = {}, nodes = { '#rec': box, '#recBtn': btn };
    class FakeRecorder { constructor() { this.state = 'inactive'; } start() { state.started++; this.state = 'recording'; } stop() { this.state = 'inactive'; if (this.onstop) this.onstop(); } }
    const R = { console, PHONE: false, Date, Blob, URL, setInterval: () => 1, clearInterval() {}, toast: m => state.toasts.push(m), addXP() {}, dayStr: () => '2026-11-04',
      navigator: { mediaDevices: { getUserMedia: () => { asked.n++; return new Promise((a, b) => { answer = a; refuse = b; }); } } },
      MediaRecorder: FakeRecorder, $: k => nodes[k] || null };
    R.window = { MediaRecorder: FakeRecorder };
    vm.createContext(R);
    vm.runInContext(rec + ';clipsFor = async () => []; globalThis.api = {renderRecorder, stopRecording};', R);
    const stream = { getTracks: () => [{ stop() { state.released++; } }] };
    return { R, nodes, box, btn, asked, state, answer: () => answer(stream), refuse: () => refuse(new Error('denied')) };
  };
  let m = make(); await m.R.api.renderRecorder('i1');
  let p = m.btn.onclick(); m.btn.onclick(); m.R.api.stopRecording(true); m.answer(); await p;
  expect(m.asked.n === 1, 'a second click while waiting for permission must not ask again');
  expect(m.state.started === 0 && m.state.released === 1, 'permission after leaving: no recording, microphone released', JSON.stringify(m.state));
  m = make(); await m.R.api.renderRecorder('i1');
  p = m.btn.onclick(); m.R.api.stopRecording(true); m.refuse(); await p;
  expect(m.state.toasts.length === 0, 'a refusal that arrives after you left shows nothing');
  m = make(); await m.R.api.renderRecorder('i1');
  p = m.btn.onclick(); m.box.dataset.qid = 'i2'; m.answer(); await p;
  expect(m.state.started === 0 && m.state.released === 1, 'permission after moving to another question: no recording');
  m = make(); await m.R.api.renderRecorder('i1');
  p = m.btn.onclick(); m.answer(); await p;
  expect(m.state.started === 1 && m.state.released === 0, 'permission while still on the question starts recording');
};
/* ---------- 7. honest labels and lesson wording ---------- */
{
  const { CERTS, examCoverage, LESSONS } = C.X, cov = id => examCoverage(CERTS.find(c => c.id === id));
  const sec = cov('secplus'), net = cov('netplus');
  /* the labels still tell the truth about any domain without questions, or with only a few repeating ones */
  const fake = examCoverage({ domains: [{ n: 1, name: 'A', w: 60, qs: [1], gens: [['sec', 'CIA triad']], tagged: [] }, { n: 2, name: 'B', w: 30, qs: [], gens: [], tagged: [] }, { n: 3, name: 'C', w: 10, qs: [5], gens: [], tagged: [] }] });
  expect(fake.missing.map(d => d.name).join() === 'B' && fake.w === 70, 'a domain with no questions must be listed as unmeasured, and left out of the covered weight');
  expect(fake.thin.map(d => d.name).join() === 'C', 'a domain with a few fixed questions and no generators must be flagged as thin');
  /* Security+ governance and Network+ network security now have generated questions (gap-filling, 2026-11-04) */
  expect(!sec.missing.length && !sec.thin.some(d => /Oversight/.test(d.name)), 'Security+ governance should now be measured, with generated questions');
  expect(!net.missing.length && !net.thin.some(d => d.name === 'Network Security'), 'Network+ network security should now be measured, with generated questions');
  /* SY0-801 (added 2026-11-12): weights from comptia.org sum to 100, every domain measured, and its scores are kept apart from SY0-701's */
  const s8 = CERTS.find(c => c.id === 'secplus8'), sec8 = cov('secplus8');
  expect(s8 && s8.code === 'SY0-801' && s8.domains.reduce((a, d) => a + d.w, 0) === 100 && s8.domains.map(d => d.w).join() === '16,24,19,27,14', 'SY0-801 weights are 16/24/19/27/14');
  expect(!sec8.missing.length && !sec8.thin.some(d => /Oversight/.test(d.name)), 'SY0-801 governance should be measured, with generated questions');
  expect(CERTS.find(c => c.id === 'secplus').code === 'SY0-701', 'the old id keeps meaning SY0-701, so old exam history is not relabelled');
  const exam = fs.readFileSync(__dirname + '/../src/exam.js', 'utf8');
  for (const gone of ['Close to ready', 'readiness signal', 'before booking the real one', 'Full practice', 'not covered yet', '<h1>📝 Practice exams'])
    expect(!exam.includes(gone), 'exam pages should no longer say', gone);
  expect(exam.includes('Partial practice exams') && exam.includes('unmeasured: no questions yet'), 'exams are labelled partial, and empty domains unmeasured');
  const text = id => Object.values(LESSONS[id]).flat().map(v => typeof v === 'string' ? v : JSON.stringify(v)).join(' ');
  const ip = text('quiz:net:IP addressing'), cloud = text('quiz:cloud:IAM & least privilege'), sub = text('quiz:net:Subnetting');
  expect(!/so DHCP failed|It means no DHCP at all|can't be reached from the internet without NAT/.test(ip) && /169\.254\.169\.254/.test(ip) && /VPNs/.test(ip), 'IP lesson: 169.254 is a clue, NAT is not the only way private networks connect');
  expect(!/nothing more/.test(cloud) && /only if this is its only permission/.test(cloud), 'IAM lesson: no "nothing more" claim beyond the policy shown');
  expect(/\/31/.test(sub) && /\/32/.test(sub), 'Subnetting lesson mentions the /31 and /32 exceptions');
}

recorderRun().catch(e => fail('recorder check crashed:', e.message)).then(() => {
  console.log('trust checks', checks, '| SQL answers with quoted text', swapped, '| problems', bad);
  process.exitCode = bad ? 1 : 0;
});
