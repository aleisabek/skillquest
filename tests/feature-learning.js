// Checks the learning engine: skill registry, mastery math, recommendations, typed answers and lessons.
const fs = require('fs');
const js = fs.readFileSync(__dirname + '/.tmp/script.js', 'utf8');
const line = n => { const i = js.indexOf('function ' + n + '('); return js.slice(i, js.indexOf('\n', i)); };
const grab = n => { const i = js.indexOf('function ' + n + '('); return js.slice(i, js.indexOf('\n}', i) + 2); };
let today = '2026-10-25';
const dayStr = () => today;
let S = { mastery: {}, lessons: {} };
const save = () => {};
eval(js.split('/* ===================== STATE')[0] + ';' + line('shuffle') + ';' + line('esc') + ';' + grab('tableHTML') +
  ';plainText = h => h.replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").trim();' +
  'global.L = {allSkills, skillScore, recordSkill, recommend, typeable, normAns, plainText, makeGen, genSkills, LESSONS, TRACKS, skillIdFor};');
let bad = 0; const fail = (...a) => { bad++; if (bad < 20) console.log('FAIL', ...a); };

// 1. Skill registry
const skills = L.allSkills(), ids = new Set(skills.map(s => s.id));
if (ids.size !== skills.length) fail('duplicate skill ids');
skills.forEach(s => { if (!s.lvs.length || !s.sk || !['quiz', 'term', 'sql'].includes(s.kind)) fail('bad skill', s.id); });

// 2. Mastery math: sure answers climb, guesses climb slowly, misses drop, time decays
const id = skills[0].id;
for (let k = 0; k < 6; k++) L.recordSkill(id, true, true);
const afterSure = L.skillScore(id);
if (afterSure < 80 || afterSure > 100) fail('sure answers should climb above 80, got', afterSure);
L.recordSkill(id, false); if (L.skillScore(id) >= afterSure) fail('a miss should lower the score');
const id2 = skills[1].id; for (let k = 0; k < 6; k++) L.recordSkill(id2, true, false);
if (L.skillScore(id2) >= afterSure) fail('guesses should climb slower than sure answers');
const before = L.skillScore(id); today = '2026-11-25'; const later = L.skillScore(id); today = '2026-10-25';
if (!(later < before * 0.6)) fail('a month without practice should decay the score', before, later);

// 3. Recommendations: a weak practiced skill outranks new ones; strong skills are not recommended
S.mastery = {}; const weak = skills[5].id; L.recordSkill(weak, false); L.recordSkill(weak, false);
if (L.recommend(1)[0].id !== weak) fail('weak skill should be recommended first');
const strong = skills[6].id; for (let k = 0; k < 12; k++) L.recordSkill(strong, true, true);
if (L.recommend(999).some(s => s.id === strong)) fail('strong skill should not be recommended');

// 4. Typed answers: for every typeable generated question, the typed answer matches only the right option
let typed = 0, total = 0;
for (const t of L.TRACKS) for (let k = 0; k < 3000; k++) {
  const q = L.makeGen(t.id, 0); if (!q) continue; total++;
  if (!L.typeable(q)) continue; typed++;
  const ans = L.normAns(L.plainText(q.d[3][q.d[4]]));
  if (!ans) fail('empty typed answer', q.d[2]);
  q.d[3].forEach((o, i) => { if (i !== q.d[4] && L.normAns(L.plainText(o)) === ans) fail('typed answer also matches a wrong option', q.d[2], o); });
  if (L.normAns(' ' + L.plainText(q.d[3][q.d[4]]).toUpperCase() + ' ') !== ans) fail('case/space should not matter', ans);
}

// 5. Lessons: every lesson belongs to a real skill and has all parts
const need = ['why', 'idea', 'example', 'mistakes', 'say'];
for (const [k, les] of Object.entries(L.LESSONS)) {
  if (!ids.has(k)) fail('lesson for unknown skill', k);
  need.forEach(f => { if (!les[f] || (f === 'mistakes' && (!Array.isArray(les.mistakes) || les.mistakes.length < 2))) fail('lesson missing', f, k); });
}
const missing = skills.filter(s => !L.LESSONS[s.id]).map(s => s.id);
console.log('skills', skills.length, '| typed questions', typed, 'of', total, '| lessons', Object.keys(L.LESSONS).length + '/' + skills.length,
  missing.length ? '| no lesson yet: ' + missing.length : '', '| problems', bad);
process.exitCode = bad ? 1 : 0;
