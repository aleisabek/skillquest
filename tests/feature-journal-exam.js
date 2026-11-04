// Checks the mistake journal rules and the practice-exam builder.
const fs = require('fs');
const js = fs.readFileSync(__dirname + '/.tmp/script.js', 'utf8');
const line = n => { const i = js.indexOf('function ' + n + '('); return js.slice(i, js.indexOf('\n', i)); };
const grab = n => { const i = js.indexOf('function ' + n + '('); return js.slice(i, js.indexOf('\n}', i) + 2); };
let today = '2026-10-25';
const dayStr = () => today, save = () => {}, toast = () => {}, quizId = i => 'q' + i;
let S = { mastery: {}, lessons: {}, quiz: {}, miss: {}, journal: [] };
eval(js.split('/* ===================== STATE')[0] + ';' + line('shuffle') + ';' + line('esc') + ';' + grab('tableHTML') +
  ';global.T = {addMistake, addNote, journalResult, journal, isDue, isOpen, CERTS, examPlan, buildExam, domCovered, QUIZ, makeGen};');
let bad = 0; const fail = (...a) => { bad++; if (bad < 20) console.log('FAIL', ...a); };

// Journal: a miss is saved once (repeats count up), clears only after correct answers on 2 different days
const q = T.QUIZ[20];
T.addMistake(q, { kind: 'quiz', your: 'Confidentiality', qi: 20 });
T.addMistake(q, { kind: 'quiz', your: 'Availability', qi: 20 });
let e = T.journal()[0];
if (T.journal().length !== 1 || e.count !== 2 || e.your !== 'Availability') fail('repeat miss should update one entry');
T.journalResult(e.id, true); T.journalResult(e.id, true);
if (e.done) fail('two correct answers on the SAME day must not clear it');
if (T.isDue(e)) fail('should not be due again the same day after a correct answer');
today = '2026-10-26'; T.journalResult(e.id, true);
if (!e.done || !S.quiz.q20) fail('correct on a second day should clear it and mark the question learned');
const q2 = T.QUIZ[21]; T.addMistake(q2, { kind: 'quiz', your: 'x' }); const e2 = T.journal()[0];
T.journalResult(e2.id, true); today = '2026-10-27'; T.journalResult(e2.id, false); today = '2026-10-28'; T.journalResult(e2.id, true);
if (e2.done) fail('a miss in between should reset progress');
T.addNote('term', 'Restart nginx', 'sudo systemctl restart nginx', 'systemctl nginx', 'term:linux:Admin');
if (!T.isOpen(T.journal()[0])) fail('terminal note should be open while the skill is weak');
if (JSON.parse(JSON.stringify(S.journal)).length !== S.journal.length) fail('journal must be JSON-serializable');

// Exams: right length, domain split follows weights, only covered domains, valid questions
for (const cert of T.CERTS) {
  for (const n of [20, 45]) {
    const plan = T.examPlan(cert, n), total = [...plan.values()].reduce((a, b) => a + b, 0);
    if (total !== n) fail(cert.id, 'plan total', total, '!=', n);
    for (const [d, k] of plan) { if (!T.domCovered(d)) fail('uncovered domain in plan', d.name); if (k > ((d.gens.length || (d.tagged || []).length) ? Infinity : d.qs.length)) fail('over capacity', d.name, k); }
    for (let r = 0; r < 50; r++) {
      const ex = T.buildExam(cert, n);
      if (ex.length !== n) fail(cert.id, 'exam length', ex.length, 'expected', n);
      const seen = new Set();
      ex.forEach(it => {
        if (!Array.isArray(it.d) || it.d[3].length !== 4 || it.d[4] < 0 || it.d[4] > 3) fail('bad exam question', it.d && it.d[2]);
        if (it.qi != null) { if (seen.has(it.qi)) fail('fixed question repeated in one exam', it.qi); seen.add(it.qi); }
      });
    }
  }
  cert.domains.forEach(d => d.qs.forEach(i => { if (!T.QUIZ[i] || !['sec', 'net'].includes(T.QUIZ[i][0])) fail('domain maps to a non sec/net question', cert.id, d.n, i); }));
}
console.log('journal + exams checked | problems', bad);
process.exitCode = bad ? 1 : 0;
