// Streak engine: a day is full only when all 3 missions are done AND reviews are handled (nothing due, or REVIEW_CAP
// reviewed); +50 is awarded once; mistake retries can't be farmed; days roll over at midnight; backups keep review flags.
const fs = require('fs');
const vm = require('vm');
const js = fs.readFileSync(__dirname + '/.tmp/script.js', 'utf8');
const [before, app] = js.split('/* ===================== STATE');
const grab = n => { const i = app.indexOf('function ' + n + '('); if (i < 0) throw new Error('missing ' + n); return app.slice(i, app.indexOf('\n}', i) + 2); };
const line = n => { const i = app.indexOf(n); if (i < 0) throw new Error('missing ' + n); return app.slice(i, app.indexOf('\n', i)); };

const ctx = { console, structuredClone, awards: [] };
vm.createContext(ctx);
vm.runInContext(before + '\n' + [
  'var TODAY = "2026-10-28"; var S;',
  line('const KEY'), line('const DEFAULT'), line('let saveBlocked'), line('const QUIZ_FADE'),
  'function toast(){} function header(){} function save(){} function addXP(n){ S.xp += n; awards.push(n); }',
  line('function dayStr(').replace('d = d || new Date();', 'if(!d) return TODAY;'), line('function addDays('), line('function esc('),
  line('function cardId('), line('function quizId('), line('function cardDue('), grab('quizStatus'), line('function fadingQuiz('),
  grab('rateCard'), grab('migrateQuiz'), grab('completeMission'), line('const REVIEW_CAP'), line('const STEP_KEYS'), grab('isFullDay'), 'function syncPlanFlags(){}', line('function afterStep('), line('function dueReviewCount('),
  line('const reviewsOk'), grab('checkReviews'), line('function noteReview('), grab('checkFullDay'),
  line('const DATE_RE'), line('const isObj'), line('const clampNum'), line('const okDate'), grab('cleanMap'), grab('sanitizeBackup'), grab('cleanEntry'), line('const SAFE_TAGS'), grab('safeHTML'),
  'globalThis.T = { completeMission, checkReviews, noteReview, checkFullDay, rateCard, isFullDay, dueReviewCount, migrateQuiz, sanitizeBackup, addMistake, journalResult, isDue, addDays, QUIZ, DEFAULT,',
  '  get S(){ return S; }, set S(v){ S = v; }, set today(v){ TODAY = v; } };'
].join('\n'), ctx);
const T = ctx.T, awards = ctx.awards;
let bad = 0; const fail = (...a) => { bad++; console.log('FAIL', ...a); };
const today = '2026-10-28', yday = '2026-10-27', tmrw = '2026-10-29';
const fresh = extra => { T.today = today; awards.length = 0; T.S = Object.assign(structuredClone(T.DEFAULT), { xp: 0, streak: 2, best: 2, lastFull: yday, journal: [] }, extra || {}); };
const dueCards = n => Object.fromEntries(Array.from({ length: n }, (_, i) => ['c' + i, { box: 2, due: today }]));

/* 1. missions with something due: not full; clearing it makes the day full and pays +50 exactly once */
fresh({ cards: dueCards(1) });
['quiz', 'skill', 'iv'].forEach(T.completeMission);
if (T.S.lastFull !== yday || T.S.days[today].rev !== false || awards.length) fail('missions alone must not make a full day while a review is due');
T.S.cards.c0 = T.rateCard(T.S.cards.c0, true); T.noteReview();
if (T.S.lastFull !== today || T.S.streak !== 3 || T.S.days[today].rev !== true || awards.join() !== '50') fail('clearing the due card should complete the day once', T.S.streak, awards);
T.checkFullDay(); T.completeMission('quiz'); T.noteReview();
if (awards.length !== 1) fail('+50 must be awarded only once per day');

/* 2. a big backlog can't block the streak: 20 reviews are enough */
fresh({ cards: dueCards(50) });
['quiz', 'skill', 'iv'].forEach(T.completeMission);
for (let i = 0; i < 19; i++) T.noteReview();
if (T.S.lastFull === today) fail('19 reviews of a 50-card backlog should not be enough');
T.noteReview();
if (T.S.lastFull !== today) fail('the 20th review should make the day full');

/* 3. reviews done before the missions still count when the last mission lands */
fresh({ cards: dueCards(1) });
T.S.cards.c0 = T.rateCard(T.S.cards.c0, false); T.noteReview();
['quiz', 'skill', 'iv'].forEach(T.completeMission);
if (T.S.lastFull !== today) fail('reviews first, missions second should still be a full day');

/* 4. mistake retries: not due on the day they're made; only the first retry per day counts; a missed retry returns tomorrow */
fresh();
T.addMistake(T.QUIZ[0], { kind: 'quiz', qi: 0, your: 'x' });
const e = T.S.journal[0];
if (T.isDue(e)) fail('a mistake made today must not be due today');
e.at = yday;
if (!T.isDue(e)) fail('a mistake from yesterday should be due');
if (T.journalResult(e.id, false) !== true) fail('the first retry today should count as a review');
if (T.isDue(e) || T.journalResult(e.id, false) !== false) fail('after one retry the mistake is not due again today, and further tries do not count');
T.today = tmrw;
if (!T.isDue(e)) fail('a missed retry should come back tomorrow');

/* 5. opening Today with something due but no missions done stores no "not yet" flag */
fresh({ cards: dueCards(1) });
T.checkReviews();
if (T.S.days[today] && 'rev' in T.S.days[today]) fail('no rev flag should be stored on a day without missions');

/* 6. midnight: reviews land on the day they're done */
fresh({ cards: dueCards(5) });
T.noteReview(); T.noteReview(); T.today = tmrw; T.noteReview();
if (T.S.days[today].reviews !== 2 || T.S.days[tmrw].reviews !== 1 || T.isFullDay(T.S.days[today])) fail('reviews should be counted per day', JSON.stringify(T.S.days));

/* 7. backups keep review flags and clamp counts */
const sb = T.sanitizeBackup({ xp: 1, days: { '2026-10-01': { rev: false, reviews: 12, quiz: true, x: 'y' }, '2026-10-02': { rev: 'x', reviews: -5 }, '2026-10-03': { reviews: 'abc' } } });
const d1 = sb.days['2026-10-01'], d2 = sb.days['2026-10-02'], d3 = sb.days['2026-10-03'];
if (d1.rev !== false || d1.reviews !== 12 || !d1.quiz || 'x' in d1 || 'rev' in d2 || d2.reviews !== 0 || d3.reviews !== 0) fail('sanitizeBackup should keep rev true/false and clamp reviews', JSON.stringify(sb.days));

/* 8. old quiz answers: true becomes a date spread over the fade window; running it again changes nothing */
T.today = today;
const st = T.migrateQuiz({ quiz: { q1: true, q7: true, q2: '2026-01-01' } });
const inWindow = v => typeof v === 'string' && v <= today && v >= T.addDays(today, -29);
if (!inWindow(st.quiz.q1) || !inWindow(st.quiz.q7) || st.quiz.q2 !== '2026-01-01') fail('migrated dates should fall in the last 30 days', JSON.stringify(st.quiz));
const again = JSON.stringify(T.migrateQuiz(JSON.parse(JSON.stringify(st))).quiz);
if (again !== JSON.stringify(st.quiz)) fail('migrateQuiz must be idempotent');

console.log('streak checks | problems', bad);
process.exitCode = bad ? 1 : 0;
