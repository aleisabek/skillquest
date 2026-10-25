// Checks that every lab in the app matches a lab folder, its completion code matches the sq-lab formula,
// and its skills exist. (The labs themselves are tested in WSL by labs/test-labs.sh.)
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const js = fs.readFileSync(__dirname + '/.tmp/script.js', 'utf8');
const line = n => { const i = js.indexOf('function ' + n + '('); return js.slice(i, js.indexOf('\n', i)); };
const grab = n => { const i = js.indexOf('function ' + n + '('); return js.slice(i, js.indexOf('\n}', i) + 2); };
let S = {};
eval(js.split('/* ===================== STATE')[0] + ';' + line('shuffle') + ';' + line('esc') + ';' + grab('tableHTML') + ';global.L = {LABS, skillById};');
let bad = 0; const fail = (...a) => { bad++; console.log('FAIL', ...a); };
const dirs = fs.readdirSync(path.join(__dirname, '..', 'labs', 'labs'));
L.LABS.forEach(l => {
  if (!dirs.includes(l.id)) fail('no lab folder for', l.id);
  const code = crypto.createHash('sha256').update('skillquest-lab:' + l.id).digest('hex').slice(0, 6).toUpperCase();
  if (code !== l.code) fail('completion code mismatch for', l.id, l.code, 'should be', code);
  l.skills.forEach(s => { if (!L.skillById(s)) fail('unknown skill', s, 'in lab', l.id); });
});
dirs.forEach(d => { if (!L.LABS.some(l => l.id === d)) fail('lab folder not listed in the app:', d); });
console.log('labs', L.LABS.length, '| folders', dirs.length, '| problems', bad);
process.exitCode = bad ? 1 : 0;
