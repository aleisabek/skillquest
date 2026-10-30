// Checks that every lab in the app matches a lab folder, its completion code matches the sq-lab formula,
// and its skills exist. (The labs themselves are tested in WSL by labs/test-labs.sh.)
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const js = fs.readFileSync(__dirname + '/.tmp/script.js', 'utf8');
const line = n => { const i = js.indexOf('function ' + n + '('); return js.slice(i, js.indexOf('\n', i)); };
const grab = n => { const i = js.indexOf('function ' + n + '('); return js.slice(i, js.indexOf('\n}', i) + 2); };
let S = {};
eval(js.split('/* ===================== STATE')[0] + ';' + line('shuffle') + ';' + line('esc') + ';' + grab('tableHTML') + ';global.L = {LABS, skillById, lessonFor, labForLesson};');
let bad = 0; const fail = (...a) => { bad++; console.log('FAIL', ...a); };
const dirs = fs.readdirSync(path.join(__dirname, '..', 'labs', 'labs'));
L.LABS.forEach(l => {
  if (!dirs.includes(l.id)) fail('no lab folder for', l.id);
  const code = crypto.createHash('sha256').update('skillquest-lab:' + l.id).digest('hex').slice(0, 6).toUpperCase();
  if (code !== l.code) fail('completion code mismatch for', l.id, l.code, 'should be', code);
  l.skills.forEach(s => { if (!L.skillById(s)) fail('unknown skill', s, 'in lab', l.id); });
});
dirs.forEach(d => { if (!L.LABS.some(l => l.id === d)) fail('lab folder not listed in the app:', d); });
/* every lab is exercised end to end in WSL: test-labs.sh needs a run line for each folder */
const runner = fs.readFileSync(path.join(__dirname, '..', 'labs', 'test-labs.sh'), 'utf8');
dirs.forEach(d => { if (!new RegExp('^run ' + d + ' ', 'm').test(runner)) fail('labs/test-labs.sh has no run line for', d); });
/* security labs practice one lesson: it must exist, and that lesson must point back to the lab */
const SECURITY = ['cloudtrail-hunt', 'iam-tighten', 'ssh-harden', 'secret-leak', 'vuln-triage'];
L.LABS.filter(l => SECURITY.includes(l.id)).forEach(l => {
  if (!l.lesson || !L.lessonFor(l.lesson)) fail('lab', l.id, 'needs a lesson that exists, got', l.lesson);
  else if (L.labForLesson(l.lesson) !== l) fail('lesson', l.lesson, 'does not link back to lab', l.id);
  if (!fs.existsSync(path.join(__dirname, '..', 'labs', 'test-solutions', l.id + '.sh'))) fail('lab', l.id, 'needs test-solutions/' + l.id + '.sh (right, wrong and broken fixes)');
});
const seen = new Set(); L.LABS.forEach(l => { if (l.lesson && seen.has(l.lesson)) fail('two labs share lesson', l.lesson); seen.add(l.lesson); });
console.log('labs', L.LABS.length, '| folders', dirs.length, '| problems', bad);
process.exitCode = bad ? 1 : 0;
