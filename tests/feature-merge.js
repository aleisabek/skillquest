// Checks that merging two devices' progress keeps the best of both and loses nothing.
const fs = require('fs');
const js = fs.readFileSync(__dirname + '/.tmp/script.js', 'utf8');
const grab = n => { const i = js.indexOf('function ' + n + '('); return js.slice(i, js.indexOf('\n}', i) + 2); };
const defLine = js.slice(js.indexOf('const DEFAULT'), js.indexOf('\n', js.indexOf('const DEFAULT')));
const line = n => { const i = js.indexOf(n); return js.slice(i, js.indexOf('\n', i)); };
eval(defLine + ';' + line('const BOX_DAYS') + ';' + line('const JOURNAL_MAX') + ';' + line('function dayStr(') + ';' + line('function addDays(') + ';' + line('const QUIZ_FADE') + ';' + grab('migrateQuiz') + ';' + grab('isFullDay') + ';' + grab('recountStreak') + ';' + grab('mergeProgress') + ';' + grab('migrateTerm') + ';global.M = mergeProgress; global.D = DEFAULT; global.MT = migrateTerm;');
let bad = 0; const fail = (...a) => { bad++; console.log('FAIL', ...a); };
const pc = Object.assign(structuredClone(D), {
  xp: 500, best: 4, streak: 2, lastFull: '2026-10-20', lastBackup: '2026-10-19',
  quiz: { q1: true }, miss: { q2: true, q3: true }, iv: { i0: 2 }, tickets: { pos: 60 }, lessons: { a: '2026-10-18' }, labs: { crlf: '2026-10-19' },
  notes: { i0: 'short' }, days: { '2026-10-20': { quiz: true } }, cards: { c1: { box: 2, due: '2026-10-22' } },
  mastery: { s1: { s: 70, n: 5, right: 4, last: '2026-10-20' }, s2: { s: 30, n: 1, right: 0, last: '2026-10-19' } },
  gen: { net: { right: 5, total: 8 } },
  journal: [{ id: 'm1', key: 'quiz|Q1', at: '2026-10-18', hits: ['2026-10-19'], done: false }, { id: 'm2', key: 'quiz|Q2', at: '2026-10-18', hits: [], done: false }],
  exams: [{ cert: 'secplus', date: '2026-10-19', pct: 60, n: 20, secs: 900 }]
});
const phone = Object.assign(structuredClone(D), {
  xp: 300, best: 6, streak: 5, lastFull: '2026-10-25', lastBackup: '2026-10-24',
  quiz: { q2: true, q9: true }, miss: { q4: true }, iv: { i0: 3, i5: 1 }, tickets: { pos: 90, noc: 70 }, lessons: { a: '2026-10-24', b: '2026-10-24' },
  notes: { i0: 'a much longer note from the phone' }, days: { '2026-10-20': { iv: true }, '2026-10-25': { quiz: true, skill: true, iv: true } },
  cards: { c1: { box: 4, due: '2026-11-08' }, c7: { box: 1, due: '2026-10-26' } },
  mastery: { s1: { s: 60, n: 3, right: 2, last: '2026-10-25' }, s2: { s: 80, n: 6, right: 6, last: '2026-10-24' }, s3: { s: 40, n: 1, right: 1, last: '2026-10-24' } },
  gen: { net: { right: 9, total: 12 }, sec: { right: 1, total: 2 } },
  journal: [{ id: 'm1b', key: 'quiz|Q1', at: '2026-10-18', hits: ['2026-10-19', '2026-10-24'], done: true }, { id: 'm3', key: 'quiz|Q3', at: '2026-10-24', hits: [], done: false }],
  exams: [{ cert: 'netplus', date: '2026-10-24', pct: 75, n: 20, secs: 1000 }, { cert: 'secplus', date: '2026-10-19', pct: 60, n: 20, secs: 900 }]
});
for (const [a, b, label] of [[pc, phone, 'pc+phone'], [phone, pc, 'phone+pc']]) {
  const m = M(a, b), chk = (c, msg) => { if (!c) fail(label + ': ' + msg); };
  chk(m.xp === 500 && m.best === 6, 'xp/best should be the max');
  chk(m.streak === 5 && m.lastFull === '2026-10-25', 'streak should come from the most recent full day');
  chk(m.lastBackup === '2026-10-24', 'latest backup date');
  chk(m.quiz.q1 && m.quiz.q2 && m.quiz.q9, 'answered questions from both');
  chk(m.miss.q2 && m.miss.q3 && m.miss.q4, 'a miss from either device is kept until the question is answered right again');
  chk(m.iv.i0 === 3 && m.iv.i5 === 1 && m.tickets.pos === 90 && m.tickets.noc === 70, 'best interview and ticket scores');
  chk(m.lessons.a === '2026-10-24' && m.lessons.b && m.labs.crlf, 'lessons/labs union with latest dates');
  chk(m.notes.i0 === 'a much longer note from the phone', 'longer note kept');
  chk(m.days['2026-10-20'].quiz && m.days['2026-10-20'].iv && m.days['2026-10-25'].skill, 'mission days merged');
  chk(m.cards.c1.box === 4 && m.cards.c7, 'higher flashcard box kept');
  chk(m.mastery.s1.n === 5 && m.mastery.s2.n === 6 && m.mastery.s3, 'mastery: more-practiced record kept');
  chk(m.gen.net.total === 12 && m.gen.sec, 'generated counters');
  const q1 = m.journal.filter(e => e.key === 'quiz|Q1');
  chk(q1.length === 1 && q1[0].done, 'a mistake cleared on either device stays cleared (no duplicate)');
  chk(m.journal.some(e => e.key === 'quiz|Q2') && m.journal.some(e => e.key === 'quiz|Q3'), 'journal entries from both');
  chk(m.exams.length === 2, 'exam history union without duplicates');
  chk(JSON.stringify(a) === JSON.stringify(label === 'pc+phone' ? pc : phone), 'merge must not modify its inputs');
}
/* honest merges: misses survive merging a state with itself, and the most recently reviewed card wins even with a lower box */
const self = M(pc, pc); if (!self.miss.q2 || !self.miss.q3) fail('merging a state with itself must keep its misses');
const oldHigh = Object.assign(structuredClone(D), { xp: 1, cards: { c5: { box: 4, due: '2026-10-20' } } });   // reviewed 2026-10-13
const newLapse = Object.assign(structuredClone(D), { xp: 1, cards: { c5: { box: 1, due: '2026-10-26' } } });  // reviewed 2026-10-25
for (const [a, b] of [[oldHigh, newLapse], [newLapse, oldHigh]]) if (M(a, b).cards.c5.box !== 1) fail('the more recent review (a lapse) should win over an older higher box');
/* streak is recounted from the combined full-mission days, so alternating devices add up */
const full = { quiz: true, skill: true, iv: true };
const devA = Object.assign(structuredClone(D), { xp: 1, streak: 1, best: 1, lastFull: '2026-10-23', days: { '2026-10-20': full, '2026-10-22': full, '2026-10-23': full } });
const devB = Object.assign(structuredClone(D), { xp: 1, streak: 1, best: 2, lastFull: '2026-10-21', days: { '2026-10-21': full, '2026-10-19': { quiz: true } } });
for (const [a, b] of [[devA, devB], [devB, devA]]) {
  const m = M(a, b);
  if (m.streak !== 4 || m.lastFull !== '2026-10-23' || m.best !== 4) fail('merged streak should be 4 days ending 2026-10-23, got', m.streak, m.lastFull, 'best', m.best);
}
const keep = Object.assign(structuredClone(D), { xp: 1, streak: 9, best: 12, lastFull: '2026-10-23', days: { '2026-10-23': full } });
const kept = M(keep, structuredClone(D)); if (kept.streak !== 9 || kept.best !== 12) fail('a recount must never lower a streak or best it cannot see');
/* old "true" quiz answers are upgraded to dates (so they can fade); otherwise merging with itself changes nothing */
const same = M(pc, pc); if (JSON.stringify(Object.keys(same.quiz)) !== JSON.stringify(Object.keys(pc.quiz)) || same.xp !== pc.xp) fail('merging a backup with itself should change nothing');
if (Object.values(same.quiz).some(v => v === true)) fail('old true quiz answers should be upgraded to a date');
const dated = M(Object.assign(structuredClone(D), { xp: 1, quiz: { q1: true } }), Object.assign(structuredClone(D), { xp: 1, quiz: { q1: '2026-09-01' } }));
if (dated.quiz.q1 !== '2026-09-01') fail('a real answer date should beat an old true flag, got', dated.quiz.q1);
const later = M(Object.assign(structuredClone(D), { xp: 1, quiz: { q1: '2026-09-01' } }), Object.assign(structuredClone(D), { xp: 1, quiz: { q1: '2026-10-02' } }));
if (later.quiz.q1 !== '2026-10-02') fail('the later answer date should win');
/* review flags: done on either device stays done; review counts keep the larger */
const dayA = Object.assign(structuredClone(D), { xp: 1, days: { '2026-10-24': { quiz: true, skill: true, iv: true, rev: false, reviews: 5 } } });
const dayB = Object.assign(structuredClone(D), { xp: 1, days: { '2026-10-24': { rev: true, reviews: 12 } } });
for (const [a, b] of [[dayA, dayB], [dayB, dayA]]) { const d = M(a, b).days['2026-10-24']; if (d.rev !== true || d.reviews !== 12 || !d.quiz) fail('day flags should OR and review counts take the max', JSON.stringify(d)); }
const legacyDay = Object.assign(structuredClone(D), { xp: 1, days: { '2026-10-26': { quiz: true, skill: true, iv: true } } });
const newDay = Object.assign(structuredClone(D), { xp: 1, days: { '2026-10-26': { quiz: true, rev: false } } });
const sorted = o => JSON.stringify(Object.keys(o).sort().map(k => [k, o[k]]));
if (sorted(M(legacyDay, newDay).days['2026-10-26']) !== sorted(M(newDay, legacyDay).days['2026-10-26'])) fail('merging a legacy day with a rev:false day should give the same result in both orders');
const noRev = Object.assign(structuredClone(D), { xp: 1, days: { '2026-10-25': { quiz: true, skill: true, iv: true, rev: false } } });
if (M(noRev, structuredClone(D)).lastFull === '2026-10-25') fail('a day with missions done but reviews not handled is not a full day');
/* Terminal skill rename (2026-10-27): old progress moves to the deck-topic skills, nothing is lost */
const old = Object.assign(structuredClone(D), {
  mastery: { 'term:linux:Reading files': { s: 80, n: 6, right: 5, last: '2026-10-25' }, 'term:linux:Searching': { s: 50, n: 3, right: 2, last: '2026-10-24' },
             'term:linux:Services & logs': { s: 40, n: 2, right: 1, last: '2026-10-20' }, 'term:linux:Scheduling (cron)': { s: 90, n: 9, right: 9, last: '2026-10-26' },
             'term:linux:Networking': { s: 60, n: 4, right: 3, last: '2026-10-22' } },
  lessons: { 'term:linux:Disk & archives': '2026-10-21' },
  journal: [{ id: 'm9', key: 'term|x', at: '2026-10-20', hits: [], done: false, sid: 'term:linux:Permissions & ownership' }]
});
const mig = MT(structuredClone(old)), mm = mig.mastery;
if (Object.keys(mm).some(k => /Reading files|Searching|Services & logs|Scheduling \(cron\)/.test(k))) fail('old terminal skill names left behind');
if (!mm['term:linux:Reading & identifying'] || mm['term:linux:Reading & identifying'].n !== 6) fail('Reading files should move to Reading & identifying');
if (!mm['term:linux:Finding'] || !mm['term:linux:Filtering text']) fail('Searching should move to Finding and Filtering text');
if (!mm['term:linux:Admin'] || mm['term:linux:Admin'].n !== 9) fail('Admin should keep the most-practised record (cron, n=9)');
if (mm['term:linux:Networking'].n !== 4) fail('Networking (unchanged name) must be untouched');
if (mig.lessons['term:linux:Archives'] !== '2026-10-21' || mig.lessons['term:linux:Disk & archives']) fail('lesson dates should move');
if (mig.journal[0].sid !== 'term:linux:Users, processes & privilege') fail('journal entries should point at the new skill');
if (JSON.stringify(MT(structuredClone(mig))) !== JSON.stringify(mig)) fail('migration must be safe to run twice');
const mergedOld = M(structuredClone(D), old);
if (mergedOld.mastery['term:linux:Reading files'] || !mergedOld.mastery['term:linux:Reading & identifying']) fail('merging an old backup must migrate it');
console.log('merge checks | problems', bad);
process.exitCode = bad ? 1 : 0;
