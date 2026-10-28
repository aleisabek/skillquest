// Progress safety: unreadable saves are kept (never overwritten), failed saves are reported, imported backups are
// cleaned (no markup injection, no crashes from unknown values, old backups still restore), undo works, and early
// flashcard review can't raise a card's box.
const fs = require('fs');
const vm = require('vm');
const js = fs.readFileSync(__dirname + '/.tmp/script.js', 'utf8');
const [before, app] = js.split('/* ===================== STATE');
const grab = n => { const i = app.indexOf('function ' + n + '('); if (i < 0) throw new Error('missing ' + n); return app.slice(i, app.indexOf('\n}', i) + 2); };
const line = n => { const i = app.indexOf(n); if (i < 0) throw new Error('missing ' + n); return app.slice(i, app.indexOf('\n', i)); };

const store = {}, toasts = [];
const ctx = { console, structuredClone, full: false, toasts };
ctx.localStorage = { getItem: k => k in store ? store[k] : null, setItem: (k, v) => { if (ctx.full) throw new Error('QuotaExceeded'); store[k] = String(v); }, removeItem: k => { delete store[k]; } };
vm.createContext(ctx);
vm.runInContext(before + '\n' + [
  line('const KEY'), line('const DEFAULT'), line('let saveBlocked'), line('const QUIZ_FADE'), 'var S;',
  'function toast(m){ toasts.push(m); } function header(){}',
  grab('load'), grab('save'), line('function warnSave('), line('const PREV'), line('function snapshot('), line('function prevSnapshot('), grab('undoLast'), line('function hasProgress('),
  grab('migrateTerm'), line('function dayStr('), line('function addDays('), line('function esc('),
  line('const DATE_RE'), line('const isObj'), line('const clampNum'), line('const okDate'), grab('cleanMap'), grab('sanitizeBackup'), grab('cleanEntry'), line('const SAFE_TAGS'), grab('safeHTML'),
  grab('rateCard'), grab('migrateQuiz'), grab('recountStreak'), grab('mergeProgress'),
  'globalThis.T = { load, save, snapshot, undoLast, sanitizeBackup, safeHTML, rateCard, mergeProgress, dayStr, addDays, KEY, PREV, DEFAULT, QUIZ, CERTS,',
  '  get S(){ return S; }, set S(v){ S = v; }, get blocked(){ return saveBlocked; }, get failed(){ return saveFailed; }, reset(){ saveBlocked = saveFailed = saveWarned = false; } };'
].join('\n'), ctx);
const T = ctx.T;
let bad = 0; const fail = (...a) => { bad++; console.log('FAIL', ...a); };
const clear = () => { for (const k of Object.keys(store)) delete store[k]; toasts.length = 0; ctx.full = false; T.reset(); };

/* 1. unreadable save: the raw text is copied aside and never saved over */
clear(); store[T.KEY] = '{"xp": 5, broken';
T.S = T.load();
if (!T.blocked) fail('a save that cannot be parsed should block saving');
if (!Object.keys(store).some(k => k.startsWith(T.KEY + '.corrupt-') && store[k] === '{"xp": 5, broken')) fail('the unreadable raw save should be copied aside');
T.S.xp = 99; T.save();
if (store[T.KEY] !== '{"xp": 5, broken') fail('save() must not overwrite unreadable progress');
if (!toasts.some(t => /Not saved/.test(t))) fail('blocked save should warn');

/* 1b. a valid save loads normally, and loading repairs a streak an older merge cut short */
clear(); const fullDay = { quiz: true, skill: true, iv: true };
store[T.KEY] = JSON.stringify(Object.assign(structuredClone(T.DEFAULT), { xp: 40, streak: 1, best: 1, lastFull: '2026-10-22', days: { '2026-10-20': fullDay, '2026-10-21': fullDay, '2026-10-22': fullDay } }));
T.S = T.load();
if (T.blocked || T.S.xp !== 40) fail('a valid save must load without being flagged unreadable');
if (T.S.streak !== 3 || T.S.best !== 3) fail('loading should recount the streak from mission days, got', T.S.streak, T.S.best);

/* 2. a save the browser refuses is reported */
clear(); T.S = Object.assign(structuredClone(T.DEFAULT), { xp: 5 }); ctx.full = true; T.save();
if (!T.failed || !toasts.some(t => /NOT saved/.test(t))) fail('a failed save should set saveFailed and warn');

/* 3. a tampered backup is cleaned */
const cert = T.CERTS[0].id;
const evil = JSON.parse(JSON.stringify({
  xp: '12', lastBackup: '<img src=x onerror=alert(1)>', practice: { picoCTF: '<img src=x onerror=alert(2)>' },
  exams: [{ cert: 'evil', date: '2026-10-01', pct: 50 }, { cert, date: '<b>x</b>', pct: 1 }, { cert, date: '2026-10-02', pct: '<script>', n: 5, secs: 9 }],
  journal: [
    { kind: 'quiz', id: '"><img src=x onerror=alert(3)>', qi: null, d: ['linux', 1, 'Q <img src=x onerror=alert(4)> <code onclick="x()">ls</code>', ['<script>a()</script>', 'b'], 0, '<b style="color:red">ok</b>'] },
    { kind: 'quiz', id: 'mok', qi: 0, d: ['linux', 1, '<img src=x onerror=alert(5)>', ['x'], 0, 'y'] },
    { kind: 'bogus' }
  ],
  cards: { c1: { box: 9, due: '2026-10-01' }, c2: { box: 2, due: 'nope' } }
}));
evil.quiz = JSON.parse('{"__proto__": {"polluted": true}, "q3": true, "q4": "<b>"}');
const s = T.sanitizeBackup(evil);
if (!s) fail('a backup with bad fields should still be cleaned, not rejected');
else {
  const text = JSON.stringify(s);
  if (/<(img|script)/i.test(text) || /<[^>]*\son\w+\s*=/i.test(text)) fail('cleaned backup still contains live markup: ' + text.slice(0, 200));
  if (s.xp !== 12 || 'lastBackup' in s || Object.keys(s.practice).length) fail('numbers coerced, bad dates dropped');
  if (s.exams.length !== 1 || s.exams[0].pct !== 0) fail('exams: unknown cert and bad date dropped, non-numeric pct zeroed', JSON.stringify(s.exams));
  if (s.journal.length !== 2) fail('unknown journal kinds dropped');
  const g = s.journal[0];
  if (!/^m\w+$/.test(g.id)) fail('unsafe journal id should be replaced');
  if (!g.d[2].includes('<code>ls</code>') || !g.d[2].includes('&lt;img') || g.d[5] !== '<b>ok</b>') fail('generated question keeps safe tags only', JSON.stringify(g.d));
  if (JSON.stringify(s.journal[1].d) !== JSON.stringify(T.QUIZ[0].slice(0, 6))) fail('fixed questions are re-read from QUIZ, not trusted from the file');
  if (s.cards.c1.box !== 5 || s.cards.c2) fail('card boxes clamped, records with bad dates dropped');
  if (vm.runInContext('({}).polluted', ctx) || Object.getPrototypeOf(s.quiz) !== vm.runInContext('Object.prototype', ctx) || s.quiz.q4 || !s.quiz.q3) fail('__proto__ keys and bad values must be dropped');
}
if (T.sanitizeBackup([1, 2]) !== null || T.sanitizeBackup({ hello: 1 }) !== null || T.sanitizeBackup(null) !== null) fail('non-backups are rejected');
if (T.safeHTML('<b title=">" onmouseover="x">hi</b>').match(/<[^>]*onmouseover/)) fail('attribute tricks must not survive safeHTML');

/* 4. an old, minimal backup still restores */
const old = T.sanitizeBackup({ xp: 5, cards: { c1: { box: 2, due: '2026-10-01' } }, quiz: { q1: true }, miss: { q2: true } });
const merged = T.mergeProgress(structuredClone(T.DEFAULT), old);
if (!merged.cards.c1 || !merged.quiz.q1 || !merged.miss.q2 || merged.xp !== 5) fail('old-format backup should restore its progress');

/* 5. undo restores the state from before an import or reset */
clear(); T.S = Object.assign(structuredClone(T.DEFAULT), { xp: 7 }); T.save(); T.snapshot('merge');
T.S = Object.assign(structuredClone(T.DEFAULT), { xp: 99 }); T.save();
if (!T.undoLast() || T.S.xp !== 7 || T.PREV in store || JSON.parse(store[T.KEY]).xp !== 7) fail('undo should bring back the snapshot and save it');
if (T.undoLast()) fail('a second undo has nothing to restore');

/* 6. early review is practice only */
const today = T.dayStr();
const r1 = T.rateCard(undefined, true);
if (r1.box !== 1 || r1.due !== T.addDays(today, 1) || r1.seen !== today) fail('a new card rated Got it goes to box 1, due tomorrow');
if (T.rateCard(r1, true) !== null || T.rateCard(r1, false) !== null) fail('rating a card that is not due yet must not change it');
const due = T.rateCard({ box: 2, due: today, seen: '2026-10-01' }, true);
if (due.box !== 3 || due.seen !== '2026-10-01') fail('a due card moves up one box and keeps its first-seen day');
if (T.rateCard({ box: 4, due: today }, false).box !== 1) fail('a due card rated Again goes back to box 1');

console.log('safety checks | problems', bad);
process.exitCode = bad ? 1 : 0;
