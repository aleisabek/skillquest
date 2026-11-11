// Skills: every quiz generator's label is a real skill with a lesson, every lesson has exercises, the research skills
// serve their own questions, and skill ids only ever grow (progress is keyed by them).
// After deliberately adding skills, refresh the id list with: node tests/feature-skills.js --update
const fs = require('fs');
const vm = require('vm');
const js = fs.readFileSync(__dirname + '/.tmp/script.js', 'utf8');
const [before, app] = js.split('/* ===================== STATE');
const line = n => { const i = app.indexOf('function ' + n + '('); return app.slice(i, app.indexOf('\n', i)); };
const grab = n => { const i = app.indexOf('function ' + n + '('); return app.slice(i, app.indexOf('\n}', i) + 2); };
const ctx = { console };
vm.createContext(ctx);
vm.runInContext(before + ';' + line('shuffle') + ';' + line('esc') + ';' + grab('tableHTML') + ';globalThis.R = {GEN, TGEN, SGEN, LESSONS, allSkills, genFor};', ctx);
const { GEN, TGEN, SGEN, LESSONS, allSkills, genFor } = ctx.R;
let bad = 0; const fail = (...a) => { bad++; console.log('FAIL', ...a); };
const skills = allSkills(), ids = new Set(skills.map(s => s.id));

/* labels and lessons line up both ways */
for (const tid of Object.keys(GEN)) for (const lv of [1, 2]) (GEN[tid][lv] || []).forEach((f, i) => {
  if (!f.sk) fail('unlabelled generator', tid, lv, i);
  else if (!LESSONS['quiz:' + tid + ':' + f.sk]) fail('generator skill has no lesson:', 'quiz:' + tid + ':' + f.sk);
});
for (const id of Object.keys(LESSONS)) if (!ids.has(id)) fail('lesson has no exercises (no skill with this id):', id);
for (const s of skills) if (!LESSONS[s.id]) fail('skill has no lesson:', s.id);

/* every skill knows its level (a generator added after the level stamp would show "Lundefined" and drop out of the path) */
for (const s of skills) if (!Array.isArray(s.lvs) || !s.lvs.length || s.lvs.some(l => l !== 1 && l !== 2)) fail('skill without a valid level:', s.id, JSON.stringify(s.lvs));

/* each research skill drills its own topic (guards against generators being labelled by position again) */
const sample = (tid, sk, n = 300) => Array.from({ length: n }, () => { const f = genFor(tid, 0, sk); const g = f[Math.floor(Math.random() * f.length)]; const q = g && g(); return q ? q.d[2].replace(/<[^>]+>/g, '') : ''; });
const expect = { 'Pre-registration': /strategy backtest/i, 'Walk-forward testing': /walk-forward/i, 'Holdout data': /holdout|seal/i };
for (const [sk, re] of Object.entries(expect)) { const qs = sample('qa', sk); if (!qs.every(q => re.test(q))) fail(sk + ' served a question from another topic:', qs.find(q => !re.test(q)).slice(0, 90)); }
const tp = sample('qa', 'Testing process');
if (tp.some(q => Object.values(expect).some(re => re.test(q)))) fail('Testing process served a research question');

/* skill ids are append-only */
const file = __dirname + '/skill-snapshot.json';
const now = skills.map(s => s.id);
if (process.argv.includes('--update') || !fs.existsSync(file)) {
  fs.writeFileSync(file, JSON.stringify(now, null, 1) + '\n');
  console.log('skill snapshot written |', now.length, 'skills');
} else {
  const snap = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const id of snap) if (!ids.has(id)) fail('skill id disappeared (saved mastery and lessons are keyed by it):', id);
}
console.log('skills', skills.length, '| lessons', Object.keys(LESSONS).length, '| problems', bad);
process.exitCode = bad ? 1 : 0;
