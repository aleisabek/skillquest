// Typed answers and PBQ number fields accept a number however a person writes it: 40 = 40% = "40 percent",
// 12500 = $12,500 = 12,500. Lists stay lists ("3, 5" is not 35), words still have to match, and no generated question
// offers two options that would now count as the same number (typing "40" must not fit both "40" and "40%").
const js = require('fs').readFileSync(__dirname + '/.tmp/script.js', 'utf8');
const line = name => { const i = js.indexOf('function ' + name + '('); return js.slice(i, js.indexOf('\n', i)); };
const grab = name => { const i = js.indexOf('function ' + name + '('); return js.slice(i, js.indexOf('\n}', i) + 2); };
const pbqSrc = (()=>{ const i = js.indexOf('function pbqNum('); return js.slice(i, js.indexOf('\n', i)); })();
eval(js.split('/* ===================== STATE')[0] + ';' + line('shuffle') + ';' + line('esc') + ';' + grab('tableHTML') +
  ';' + pbqSrc + ';global.T = {typedOk, numAns, pbqNum, G: GEN};');
let bad = 0, n = 0; const fail = (...a) => { bad++; if (bad < 20) console.log('FAIL', ...a); };

const CASES = [
  ['40', '40%', true], ['40%', '40%', true], ['40 %', '40%', true], ['40 percent', '40%', true], ['40%', '40', true],
  ['41', '40%', false], ['0.4', '40%', false],
  ['12500', '$12,500', true], ['$12500', '$12,500', true], ['12,500', '$12,500', true], ['$ 12,500', '$12,500', true], ['12,000', '$12,500', false],
  ['1000', '1,000', true], ['0.5', '0.5', true], ['0.50', '0.5', false], ['5.0', '5', false], ['5', '5.0', false], ['-3', '-3', true],
  ['35', '3, 5', false], ['3, 5', '3, 5', true], ['3,5', '3, 5', true],
  ['forty', '40%', false], ['', '40%', false], ['40%%', '40%', false], ['4O', '40', false], ['12,50', '$12,500', false],
  ['grep', 'grep', true], ['Grep', 'grep', true], ['grap', 'grep', false]
];
for (const [typed, answer, want] of CASES) { n++; if (T.typedOk(typed, answer) !== want) fail(JSON.stringify(typed), 'vs', JSON.stringify(answer), want ? 'should count' : 'should not count'); }
for (const [typed, want] of [['40%', '40'], ['$1,234.50', '1234.50'], ['3, 5', null], ['10.0.0.1', null], ['abc', null], ['', null]]) {
  n++; if (T.numAns(typed) !== want) fail('numAns', JSON.stringify(typed), 'gave', T.numAns(typed), 'not', want);
}

/* PBQ number fields */
for (const [typed, want] of [['$12,500', 12500], ['12500', 12500], ['12,500', 12500], ['40%', 40], ['0.5', 0.5], ['.5', 0.5], ['0.25', 0.25], ['abc', null], ['', null]]) {
  n++; if (T.pbqNum(typed) !== want) fail('pbqNum', JSON.stringify(typed), 'gave', T.pbqNum(typed), 'not', want);
}

/* every generated question: the right answer still counts, and no wrong option is the same number written differently */
const strip = s => String(s).replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();
let numeric = 0;
for (const tid of Object.keys(T.G)) for (const lv of [1, 2]) for (const g of T.G[tid][lv]) for (let k = 0; k < 200; k++) {
  const r = g(); if (!r) continue;
  const q = r.d, opts = q[3].map(strip), A = opts[q[4] || 0];
  n++;
  if (!T.typedOk(A, A)) { fail('answer does not match itself:', A); continue; }
  if (T.numAns(A) === null) continue;
  numeric++;
  const twin = opts.find((o, i) => i !== (q[4] || 0) && T.typedOk(o, A));
  if (twin !== undefined) fail('two options are the same number:', A, 'and', twin, '|', strip(q[2]).slice(0, 100));
}
console.log('typed number checks', n, '| numeric answers', numeric, '| problems', bad);
process.exit(bad ? 1 : 0);
