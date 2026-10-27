// Checks that Quiz, Terminal, SQL console and Exams never repeat a question inside one set,
// and that every tab builds its sets through the shared no-repeat picker.
const fs = require('fs');
const js = fs.readFileSync(__dirname + '/.tmp/script.js', 'utf8');
const line = n => { const i = js.indexOf('function ' + n + '('); return js.slice(i, js.indexOf('\n', i)); };
const grab = n => { const i = js.indexOf('function ' + n + '('); return js.slice(i, js.indexOf('\n}', i) + 2); };
const dayStr = () => '2026-10-27', save = () => {}, toast = () => {};
eval(js.split('/* ===================== STATE')[0] + ';' + line('shuffle') + ';' + line('esc') + ';' + grab('tableHTML') +
  ';global.F = {TGEN, SGEN, GEN, CERTS, skillsOf, genSkills, termSet, sqlSet, quizSet, freshSet, termKey, sqlKey, quizKey, buildExam, rememberRecent};');
let bad = 0, sets = 0; const fail = (...a) => { bad++; if (bad < 20) console.log('FAIL', ...a); };
const noDup = (what, items, key) => { sets++; const k = items.map(key); if (new Set(k).size !== k.length) fail(what, 'repeats a question'); };

for (let r = 0; r < 40; r++) {
  F.skillsOf(F.TGEN).forEach(sk => noDup('terminal ' + sk, F.termSet(8, 0, sk), F.termKey));
  F.skillsOf(F.SGEN).forEach(sk => noDup('sql ' + sk, F.sqlSet(8, 0, sk), F.sqlKey));
  Object.keys(F.GEN).forEach(t => F.genSkills(t).forEach(([sk]) => noDup('quiz ' + t + ' ' + sk, F.quizSet(t, 8, 0, sk), F.quizKey)));
  noDup('terminal mixed', F.termSet(8, 0, null), F.termKey);
  for (const c of F.CERTS) noDup('exam ' + c.id, F.buildExam(c, 45), it => it.d[2]);
}
// every generator template gets a turn before any repeats: an 8-set from a skill with >= 8 templates uses 8 different ones
const tpl = t => t[3];
F.skillsOf(F.TGEN).forEach(sk => { const g = F.TGEN.filter(x => x.sk === sk).length; const s = F.termSet(Math.min(g, 8), 0, sk); if (new Set(s.map(tpl)).size < Math.min(g, 8, s.length)) fail('terminal ' + sk, 'reused a template before using them all'); });
// recently seen questions are avoided when others exist
const recent = []; F.rememberRecent({ term: recent }, 'term', []);
const first = F.termSet(4, 0, 'Reading & identifying'), again = F.termSet(4, 0, 'Reading & identifying', first.map(F.termKey));
if (again.some(t => first.map(F.termKey).includes(F.termKey(t)))) fail('recent questions were not avoided');
// wiring: no tab builds generated sets one random pick at a time any more
const app = ['startTerm', 'startSQL', 'startQuiz'].map(grab).join('\n') + grab('buildExam');
if (/genTask\(|makeGen\(/.test(app)) fail('a tab still draws generated questions with genTask/makeGen');
['termSet(', 'sqlSet(', 'quizSet(', 'freshSet('].forEach(f => { if (!app.includes(f)) fail('missing', f); });
console.log('   sets checked ' + sets + ' | problems ' + bad);
process.exit(bad ? 1 : 0);
