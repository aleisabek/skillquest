// Checks the Terminal's multi-step scenarios and the "read the output" / "fix the command" tasks:
// every step accepts its own model answer and rejects junk, each step shows the previous step's output,
// and practice sets end with a scenario.
const fs = require('fs');
const js = fs.readFileSync(__dirname + '/.tmp/script.js', 'utf8');
const line = n => { const i = js.indexOf('function ' + n + '('); return js.slice(i, js.indexOf('\n', i)); };
const grab = n => { const i = js.indexOf('function ' + n + '('); return js.slice(i, js.indexOf('\n}', i) + 2); };
eval(js.split('/* ===================== STATE')[0] + ';' + line('norm') + ';' + line('shuffle') + ';global.C = {TCHAIN, TGEN, buildChain, chainSet, chainKey, norm};');
let bad = 0, steps = 0; const fail = (...a) => { bad++; if (bad < 25) console.log('FAIL', ...a); };
const WRONG = ['ls', 'cd /', 'rm -rf /', 'cat', 'systemctl', 'echo hi', 'sudo'];
const skills = new Set(C.TGEN.map(g => g.sk));

for (const c of C.TCHAIN) {
  if (!skills.has(c.sk)) fail('scenario', c.title, 'has a skill the Terminal does not have:', c.sk);
  for (let k = 0; k < 300; k++) {
    const ch = C.buildChain(c);
    if (ch.length < 3 || ch.length > 8) fail(c.title, 'should have 3 to 8 steps, has', ch.length);
    ch.forEach((t, i) => {
      steps++;
      if (t.length !== 5 || t[4] !== c.lv || t.sk !== c.sk) fail(c.title, 'step', i, 'bad shape');
      if (!t.chain || t.chain.i !== i || t.chain.n !== ch.length) fail(c.title, 'step', i, 'missing step numbers');
      if (!t[1].some(r => r.test(C.norm(t[2])))) fail(c.title, 'step', i, 'model rejected:', t[2]);
      WRONG.forEach(w => { if (t[1].some(r => r.test(C.norm(w)))) fail(c.title, 'step', i, 'accepts junk:', w); });
      if (i > 0 && (!t.out || t.out[0] !== '$ ' + ch[i - 1][2])) fail(c.title, 'step', i, 'should show the previous command and its output');
      if (/hidden in practice mode/i.test(t[2])) fail(c.title, 'answer leaks placeholder text');
    });
  }
}
// read-the-output and fix-the-command tasks carry their output
const withOut = C.TGEN.filter(g => g.f().out);
if (withOut.length < 25) fail('expected at least 25 read/fix tasks, found', withOut.length);
for (const g of withOut) for (let k = 0; k < 200; k++) { const t = g.f(); if (!t.out || !t.out.length || t.out.some(l => typeof l !== 'string')) fail(g.sk, 'bad output lines'); if (!/^\$ /.test(t.out[0])) fail(g.sk, 'output should start with the command that produced it:', t.out[0]); }
// no-repeat for scenarios too
const a = C.chainSet(1, 0, null)[0], b = C.chainSet(1, 0, null, [C.chainKey(a)])[0];
if (C.chainKey(a) === C.chainKey(b)) fail('a scenario you just did should not come straight back');
// wiring: practice sets end with a scenario, daily missions don't
const st = grab('startTerm');
if (!/mission \? null : chainSet\(/.test(st)) fail('startTerm should add a scenario to practice sets only');
console.log('   scenarios ' + C.TCHAIN.length + ' | steps checked ' + steps + ' | read/fix tasks ' + withOut.length + ' | problems ' + bad);
process.exit(bad ? 1 : 0);
