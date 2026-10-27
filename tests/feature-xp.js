// Checks that typing in an answer you already revealed ("Show answer") gives no XP and doesn't count as solved.
const fs = require('fs');
const js = fs.readFileSync(__dirname + '/.tmp/script.js', 'utf8');
let bad = 0; const fail = (...a) => { bad++; console.log('FAIL', ...a); };

for (const [name, fn] of [['terminal', 'termStep'], ['SQL console', 'sqlStep']]) {
  const i = js.indexOf('function ' + fn + '(');
  if (i < 0) { fail('missing', fn); continue; }
  const body = js.slice(i, js.indexOf('\n}', i));
  if (!/const pts = s\.shown \? 0 : s\.hinted \? 8 : 15;/.test(body)) fail(name, 'should give 0 XP once the answer was shown');
  if (/addXP\(pts\)/.test(body) && !/if\(pts\) addXP\(pts\)/.test(body)) fail(name, 'calls addXP even when pts is 0');
  if (!/if\(!s\.shown\) s\.right\+\+/.test(body)) fail(name, 'counts a shown answer as solved');
  if (!/s\.shown\s*=\s*true/.test(body)) fail(name, 'Show answer no longer sets s.shown');
}
console.log('   reveal = no XP in terminal + SQL | problems ' + bad);
process.exit(bad ? 1 : 0);
