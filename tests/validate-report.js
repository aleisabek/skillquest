// Reads SQR2 report lines on stdin (as printed by `sq-lab report NAME`) and checks each with the app's own validator,
// so the lab side and the app can't drift apart. Used by labs/test-labs.sh. Prints "ok" per valid line; exits 1 otherwise.
const fs = require('fs'), path = require('path');
const app = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const pick = n => { const i = app.indexOf(n); return app.slice(i, app.indexOf('\n', i)); };
const src = [pick('const isObj'), pick('const stableStr'), pick('function dayStr('), fs.readFileSync(path.join(__dirname, '..', 'src', 'pilot.js'), 'utf8'), 'module.exports = validateReport;'].join('\n');
const m = { exports: {} }; new Function('module', src)(m);
const lines = fs.readFileSync(0, 'utf8').split('\n').filter(l => l.trim());
let bad = !lines.length;
for (const l of lines) {
  let v; try { v = l.startsWith('SQR2 ') ? m.exports(JSON.parse(l.slice(5))) : { why: 'not an SQR2 line' }; } catch (e) { v = { why: e.message }; }
  if (v.rec) console.log('ok'); else { bad = true; console.log('refused:', v.why); }
}
process.exitCode = bad ? 1 : 0;
