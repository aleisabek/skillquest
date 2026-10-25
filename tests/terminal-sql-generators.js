const fs = require('fs');
const js = fs.readFileSync(__dirname + '/.tmp/script.js', 'utf8');
const grab = name => { const i = js.indexOf('function ' + name + '('); return js.slice(i, js.indexOf('\n}', i) + 2); };
const line = name => { const i = js.indexOf('function ' + name + '('); return js.slice(i, js.indexOf('\n', i)); };
eval(js.split('/* ===================== STATE')[0] + ';' + line('shuffle') + ';' + line('esc') + ';' + grab('tableHTML') + ';' + grab('sqlNorm') + ';' + line('norm') +
  ';global.TG=TGEN;global.SG=SGEN;global.SQ=SQLT;global.SN=sqlNorm;global.NM=norm;global.DBX=DB');
let bad = 0, n = 0;
const fail = (...a) => { bad++; if (bad < 15) console.log('FAIL', ...a); };

// Terminal: model answer + known alternates must pass; obviously wrong commands must fail
const ALT = s => [s, 'sudo ' + s.replace(/^sudo /, ''), s.replace(/"/g, ''), s.replace(/ +/g, '  ')];
const WRONG = ['ls', 'cd /', 'rm -rf /', 'cat', 'systemctl', 'echo hi'];
const skills = new Set();
for (const g of TG) for (let k = 0; k < 2000; k++) {
  const t = g.f(); n++; skills.add(g.sk);
  if (t.length !== 5 || t[4] !== g.lv) fail('shape', g.sk, t[0]);
  const okAny = a => t[1].some(r => r.test(NM(a)));
  if (!okAny(t[2])) fail('model rejected', g.sk, t[0], '|', t[2]);
  if (!okAny(t[2].replace(/"/g, ''))) fail('unquoted rejected', t[2]);
  if (/^sudo /.test(t[2]) && !okAny(t[2].replace(/^sudo /, ''))) { /* some tasks need sudo optional only */ }
  WRONG.forEach(w => { if (okAny(w)) fail('wrong accepted', t[0], w); });
}
// cross-check: a task's model answer should NOT satisfy a different task of the same type with different values
for (const g of TG) for (let k = 0; k < 300; k++) { const a = g.f(), b = g.f(); if (a[2] !== b[2] && b[1].some(r => r.test(NM(a[2])))) fail('values not enforced', g.sk, a[2], 'vs', b[0]); }

// SQL: model must pass its own pattern; dump SELECTs for sqlite comparison
const dump = [];
const sskills = new Set();
for (const g of SG) for (let k = 0; k < 600; k++) {
  const t = g.f(); n++; sskills.add(g.sk);
  if (t.length !== 6 || t[0] !== g.lv) fail('sql shape', t[1]);
  if (!t[2].some(r => r.test(SN(t[3])))) fail('sql model rejected', t[1], '|', t[3], '|', SN(t[3]));
  const r = t[5]();
  if (r.msg) { if (!/^(update|delete)/i.test(t[3])) fail('msg on select', t[3]); continue; }
  dump.push({ q: t[3], cols: r.cols, rows: r.rows, ordered: /order by/i.test(t[3]) });
}
const colSet = q => { const m = SN(q).match(/^select ([\w,]+) from tickets$/); return m ? m[1].split(',').sort().join(',') : null; };
for (const g of SG) for (let k = 0; k < 200; k++) { const a = g.f(), b = g.f(); if (SN(a[3]) !== SN(b[3]) && colSet(a[3]) !== colSet(b[3]) && b[2].some(r => r.test(SN(a[3])))) fail('sql values not enforced', a[3], 'vs', b[1]); }
// also the fixed SQLT challenges
for (const t of SQ) { const r = t[5](); if (!r.msg) dump.push({ q: t[3], cols: r.cols, rows: r.rows, ordered: /order by/i.test(t[3]) }); }
fs.writeFileSync(__dirname + '/.tmp/sql_dump.json', JSON.stringify({ db: DBX, cases: dump }));
console.log('terminal generators', TG.length, 'skills', [...skills].join(' / '));
console.log('sql generators', SG.length, 'skills', [...sskills].join(' / '));
console.log('samples', n, '| problems', bad, '| sql cases for sqlite', dump.length);
process.exitCode = bad ? 1 : 0;
