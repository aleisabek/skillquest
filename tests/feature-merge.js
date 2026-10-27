// Checks that merging two devices' progress keeps the best of both and loses nothing.
const fs = require('fs');
const js = fs.readFileSync(__dirname + '/.tmp/script.js', 'utf8');
const grab = n => { const i = js.indexOf('function ' + n + '('); return js.slice(i, js.indexOf('\n}', i) + 2); };
const defLine = js.slice(js.indexOf('const DEFAULT'), js.indexOf('\n', js.indexOf('const DEFAULT')));
eval(defLine + ';' + grab('mergeProgress') + ';' + grab('migrateTerm') + ';global.M = mergeProgress; global.D = DEFAULT; global.MT = migrateTerm;');
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
  cards: { c1: { box: 4, due: '2026-11-01' }, c7: { box: 1, due: '2026-10-26' } },
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
  chk(!m.miss.q2 && m.miss.q3 && m.miss.q4, 'misses answered on either device are dropped, others kept');
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
const same = M(pc, pc); if (JSON.stringify(same.quiz) !== JSON.stringify(pc.quiz) || same.xp !== pc.xp) fail('merging a backup with itself should change nothing');
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
