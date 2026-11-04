// Two-day rule: a quiz question counts as retained, and a skill as Strong, only after right answers on two different
// days. Covers answering, a miss restarting the run, the mistake journal, migration of older saves, backups and merges.
const fs = require('fs');
const vm = require('vm');
const js = fs.readFileSync(__dirname + '/.tmp/script.js', 'utf8');
const [before, app] = js.split('/* ===================== STATE');
const grab = n => { const i = app.indexOf('function ' + n + '('); if (i < 0) throw new Error('missing ' + n); return app.slice(i, app.indexOf('\n}', i) + 2); };
const line = n => { const i = app.indexOf(n); if (i < 0) throw new Error('missing ' + n); return app.slice(i, app.indexOf('\n', i)); };
const ctx = { console, structuredClone };
vm.createContext(ctx);
vm.runInContext(before + '\n' + [
  'var TODAY = "2026-11-03"; var S;', 'function save(){} function toast(){} function header(){}',
  line('const DEFAULT'), line('const QUIZ_FADE'), line('const QUIZ_DAYS'),
  line('function dayStr(').replace('d = d || new Date();', 'if(!d) return TODAY;'), line('function addDays('), line('function dayNum('), line('function esc('),
  line('function quizId('), line('function cardId('), grab('migrateTerm'), grab('migrateQuiz'), line('function provenTwice('), grab('quizRight'), grab('quizStatus'),
  grab('isFullDay'), grab('recountStreak'), grab('mergeProgress'),
  line('const DATE_RE'), line('const isObj'), line('const clampNum'), line('const okDate'), grab('cleanMap'), grab('sanitizeBackup'), grab('cleanEntry'), line('const SAFE_TAGS'), grab('safeHTML'),
  'globalThis.T = { DEFAULT, migrateQuiz, quizRight, quizStatus, mergeProgress, sanitizeBackup, recordSkill, isStrong, skillStatus, journalResult, addMistake, QUIZ,',
  '  get S(){ return S; }, set S(v){ S = v; }, set today(v){ TODAY = v; } };'
].join('\n'), ctx);
const T = ctx.T;
let bad = 0; const fail = (...a) => { bad++; console.log('FAIL', ...a); };
const fresh = extra => { T.today = '2026-11-03'; T.S = T.migrateQuiz(Object.assign(structuredClone(T.DEFAULT), { journal: [] }, extra || {})); };
const qi = 0, id = 'q0';

/* 1. right once is Learning; right again the same day is still Learning; right on a later day is Retained */
fresh(); T.quizRight(id);
if (T.quizStatus(qi) !== 'learning') fail('right once should be Learning, got', T.quizStatus(qi));
T.quizRight(id);
if (T.quizStatus(qi) !== 'learning') fail('twice on the same day should still be Learning');
T.today = '2026-11-04'; T.quizRight(id);
if (T.quizStatus(qi) !== 'retained') fail('right on a second day should be Retained, got', T.quizStatus(qi));

/* 2. a miss restarts the run: one right answer after it is not enough */
T.S.miss[id] = true;
if (T.quizStatus(qi) !== 'learning') fail('a miss should send it back to Learning');
T.today = '2026-11-05'; T.quizRight(id);
if (T.quizStatus(qi) !== 'learning') fail('one right answer after a miss should not re-prove it');
T.today = '2026-11-06'; T.quizRight(id);
if (T.quizStatus(qi) !== 'retained') fail('right on two days after the miss should prove it again');

/* 3. older saves: an answer recorded before the rule counts as one day; one more right answer on a later day proves it */
fresh({ quiz: { [id]: '2026-10-30' } });
if (T.S.qfirst[id] !== '2026-10-30') fail('migration should record the old answer as its first day');
if (T.quizStatus(qi) !== 'learning') fail('an old single answer should be Learning until confirmed');
T.quizRight(id);
if (T.quizStatus(qi) !== 'retained') fail('confirming an old answer on a later day should retain it');
fresh({ quiz: { [id]: true } });
if (T.quizStatus(qi) !== 'learning') fail('a very old "true" answer should also need one more day');
const again = JSON.stringify(T.migrateQuiz(structuredClone(T.S)).qfirst);
if (again !== JSON.stringify(T.S.qfirst)) fail('migration must be stable when run twice');

/* 4. clearing a mistake in the journal means right on two different days, so the question is proven */
fresh(); const q = T.QUIZ[qi];
T.addMistake(q, { kind: 'quiz', your: 'x', sid: null, qi });
const m = T.S.journal[0];
if (T.quizStatus(qi) !== 'new' && T.quizStatus(qi) !== 'learning') fail('a mistake should not count as retained');
T.today = '2026-11-04'; T.journalResult(m.id, true);
T.today = '2026-11-06'; T.journalResult(m.id, true);
if (!T.S.journal[0].done) fail('two right days should clear the mistake');
if (T.quizStatus(qi) !== 'retained') fail('a cleared mistake should count as retained, got', T.quizStatus(qi));

/* 5. backups: the first-day record and skill day counts survive a restore; junk is dropped */
fresh(); T.today = '2026-11-03'; T.quizRight(id); T.today = '2026-11-04'; T.quizRight(id);
const b = T.sanitizeBackup(JSON.parse(JSON.stringify(Object.assign({}, T.S, { qfirst: Object.assign({ bad: '<script>' }, T.S.qfirst),
  mastery: { s1: { s: 90, n: 6, right: 6, last: '2026-11-04', rd: 2, lr: '2026-11-04' } } }))));
if (!b.qfirst || b.qfirst[id] !== '2026-11-03' || 'bad' in b.qfirst) fail('backup should keep valid first days only', JSON.stringify(b.qfirst));
if (b.mastery.s1.rd !== 2 || b.mastery.s1.lr !== '2026-11-04') fail('backup should keep skill day counts', JSON.stringify(b.mastery.s1));
T.S = T.migrateQuiz(Object.assign(structuredClone(T.DEFAULT), b));
if (T.quizStatus(qi) !== 'retained') fail('a restored proven question should stay retained');

/* 6. merges: the first day travels with the latest right answer that was kept; a miss on either device still counts */
const base = extra => T.migrateQuiz(Object.assign(structuredClone(T.DEFAULT), { journal: [] }, extra));
let mg = T.mergeProgress(base({ quiz: { [id]: '2026-11-02' }, qfirst: { [id]: '2026-10-28' } }), base({ quiz: { [id]: '2026-11-03' }, qfirst: { [id]: '2026-11-03' } }));
if (mg.quiz[id] !== '2026-11-03' || mg.qfirst[id] !== '2026-11-03') fail('merge should pair the kept answer with its own first day', JSON.stringify([mg.quiz, mg.qfirst]));
mg = T.mergeProgress(base({ quiz: { [id]: '2026-11-03' }, qfirst: { [id]: '2026-10-28' } }), base({ quiz: { [id]: '2026-11-03' }, qfirst: { [id]: '2026-11-01' } }));
if (mg.qfirst[id] !== '2026-10-28') fail('same latest answer on both devices: keep the earlier first day');
mg = T.mergeProgress(base({ quiz: { [id]: '2026-11-03' }, qfirst: { [id]: '2026-10-28' } }), base({ miss: { [id]: true } }));
T.S = mg; if (T.quizStatus(qi) !== 'learning') fail('a miss from the other device should still mean Learning');

/* 7. skills: Strong needs a high score on two different days */
fresh(); const sid = 'quiz:sec:CIA triad';
for (let k = 0; k < 8; k++) T.recordSkill(sid, true, true);
if (T.isStrong(sid)) fail('eight right answers in one day should not be Strong');
if (T.skillStatus(sid)[0] !== 'Strong once') fail('one strong day should read "Strong once", got', T.skillStatus(sid)[0]);
T.today = '2026-11-04'; T.recordSkill(sid, true, true);
if (!T.isStrong(sid) || T.skillStatus(sid)[0] !== 'Strong') fail('a high score on a second day should be Strong', JSON.stringify(T.S.mastery[sid]));
fresh({ mastery: { [sid]: { s: 95, n: 10, right: 10, last: '2026-11-03' } } });
if (T.S.mastery[sid].rd !== 1) fail('older skill records should count as one day');
if (T.isStrong(sid)) fail('an older record needs one more day to be Strong');

console.log('two-day rule checks | problems', bad);
process.exitCode = bad ? 1 : 0;
