const js = require('fs').readFileSync(__dirname + '/.tmp/script.js', 'utf8');
const grab = name => { const i = js.indexOf('function ' + name + '('); return js.slice(i, js.indexOf('\n}', i) + 2); };
const line = name => { const i = js.indexOf('function ' + name + '('); return js.slice(i, js.indexOf('\n', i)); };
eval(js.split('/* ===================== STATE')[0] + ';' + line('shuffle') + ';' + line('esc') + ';' + grab('tableHTML') + ';global.G=GEN;global.mk=makeGen;global.gf=genFor');
const strip = s => s.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const isPriv = ip => { const a = ip.split('.').map(Number); return a[0] === 10 || (a[0] === 172 && a[1] >= 16 && a[1] <= 31) || (a[0] === 192 && a[1] === 168); };
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
let bad = 0, n = 0, unchecked = {};
const fail = (m, q) => { bad++; if (bad < 15) console.log('FAIL', m, '|', strip(q[2]).slice(0, 160), '|', q[3].map(strip)); };
for (const tid of Object.keys(G)) for (const lv of [1, 2]) for (let gi = 0; gi < G[tid][lv].length; gi++) for (let k = 0; k < 3000; k++) {
  const r = G[tid][lv][gi](); if (!r) continue; n++;
  const q = r.d, Q = strip(q[2]), A = strip(q[3][0]), O = q[3].map(strip);
  if (q[3].length !== 4 || new Set(q[3]).size !== 4 || q[4] !== 0) { fail('options', q); continue; }
  let m;
  if ((m = Q.match(/usable host addresses are in a \/(\d+)/))) { if (+A !== 2 ** (32 - m[1]) - 2) fail('hosts', q); }
  else if ((m = Q.match(/subnet mask is the same as \/(\d+)/))) { const p = +m[1], v = (0xFFFFFFFF << (32 - p)) >>> 0; const s = [24, 16, 8, 0].map(b => (v >>> b) & 255).join('.'); if (A !== s) fail('mask', q); }
  else if ((m = Q.match(/(network|broadcast) address of (\d+\.\d+\.\d+\.(\d+))\/(\d+)/))) { const blk = 2 ** (32 - m[4]), d = +m[3], net = Math.floor(d / blk) * blk; if (+A.split('.')[3] !== (m[1] === 'network' ? net : net + blk - 1)) fail('netbc', q); }
  else if ((m = Q.match(/same subnet as 10\.1\.\d+\.(\d+)\/(\d+)/))) { const blk = 2 ** (32 - m[2]), b = Math.floor(m[1] / blk); if (Math.floor(A.split('.')[3] / blk) !== b) fail('subnetA', q); O.slice(1).forEach(o => { if (Math.floor(o.split('.')[3] / blk) === b) fail('subnetW', q); }); }
  else if (/private IP address/.test(Q)) { if (!isPriv(A)) fail('privA', q); O.slice(1).forEach(o => { if (isPriv(o)) fail('privW', q); }); }
  else if ((m = Q.match(/chmod (\d{3}) file/))) { const s = m[1].split('').map(d => ((d & 4) ? 'r' : '-') + ((d & 2) ? 'w' : '-') + ((d & 1) ? 'x' : '-')).join(''); if (A !== s) fail('chmod', q); }
  else if ((m = Q.match(/matches the permissions ([rwx-]{9})/))) { const d = [0, 3, 6].map(i => m[1].slice(i, i + 3)).map(t => (t[0] === 'r' ? 4 : 0) + (t[1] === 'w' ? 2 : 0) + (t[2] === 'x' ? 1 : 0)).join(''); if (A !== d) fail('perm', q); }
  else if ((m = Q.match(/cron line (\d+) (\d+) \* \* (\S+)/))) { const exp = 'At ' + String(m[2]).padStart(2, '0') + ':' + String(m[1]).padStart(2, '0') + (m[3] === '*' ? ' every day' : ' every ' + DAYS[m[3]]); if (A !== exp) fail('cron', q); }
  else if ((m = Q.match(/print\((\d+) \/\/ (\d+)\)/))) { if (+A !== Math.floor(m[1] / m[2])) fail('floordiv', q); }
  else if ((m = Q.match(/print\((\d+) % (\d+)\)/))) { if (+A !== m[1] % m[2]) fail('mod', q); }
  else if ((m = Q.match(/print\(len\(\[([\d, ]+)\]\)\)/))) { if (+A !== m[1].split(',').length) fail('len', q); }
  else if ((m = Q.match(/items = \[(.*)\]print\(items\[(-?\d+)\]\)/))) { const xs = JSON.parse('[' + m[1] + ']'), i = +m[2]; if (A !== xs.at(i)) fail('index', q); }
  else if ((m = Q.match(/matches the regex (\S+)\?/))) { const R = new RegExp(m[1]); if (!R.test(A)) fail('reA', q); O.slice(1).forEach(o => { if (R.test(o)) fail('reW', q); }); }
  else if (/tickets table/.test(q[2])) {
    const rows = [...q[2].matchAll(/<tr><td>(\d+)<\/td><td>(\w+)<\/td><td>(\w+)<\/td>(?:<td class="null">NULL<\/td>|<td>(\d+)<\/td>)<\/tr>/g)].map(x => [+x[1], x[2], x[3], x[4] === undefined ? null : +x[4]]);
    let exp;
    if ((m = Q.match(/WHERE (priority|status) = '(\w+)';/))) exp = rows.filter(r => r[m[1] === 'priority' ? 1 : 2] === m[2]).length;
    else if (/IS NULL/.test(Q)) exp = rows.filter(r => r[3] === null).length;
    else if (/HAVING/.test(Q)) { const c = {}; rows.forEach(r => c[r[2]] = (c[r[2]] || 0) + 1); exp = Object.values(c).filter(v => v > 1).length; }
    else if (/GROUP BY status/.test(Q)) exp = new Set(rows.map(r => r[2])).size;
    else if ((m = Q.match(/priority = '(\w+)' ORDER BY id DESC LIMIT 1/))) exp = Math.max(...rows.filter(r => r[1] === m[1]).map(r => r[0]));
    else if (/LEFT JOIN/.test(Q)) exp = rows.length;
    else if (/JOIN/.test(Q)) exp = rows.filter(r => r[3] !== null).length;
    if (rows.length < 5) fail('table parse ' + rows.length, q);
    if (exp === undefined || +A !== exp) fail('sql ' + exp, q);
  }
  else if ((m = Q.match(/CVSS score of (\d+\.\d)/))) { const v = +m[1]; const e = v >= 9 ? 'Critical' : v >= 7 ? 'High' : v >= 4 ? 'Medium' : v > 0 ? 'Low' : 'None'; if (A !== e) fail('cvss', q); }
  else if ((m = Q.match(/Who is affected: (.*?)• Urgency: (.*)$/))) {
    const im = /whole restaurant/.test(m[1]) ? 'H' : /team/.test(m[1]) ? 'M' : 'L', ur = /stopped/.test(m[2]) ? 'H' : /workaround/.test(m[2]) ? 'M' : 'L';
    const M = { HH: 'P1', HM: 'P2', MH: 'P2', MM: 'P3', HL: 'P3', LH: 'P3', ML: 'P4', LM: 'P4', LL: 'P4' }; if (A !== M[im + ur]) fail('priority ' + im + ur, q); }
  else if ((m = Q.match(/keeps (\d+) cop\w+ of the data, on (\d+) type\w* of storage, with (one|no) copy offsite/))) {
    const c = +m[1], md = +m[2], off = m[3] === 'one'; const fails = [c < 3, md < 2, !off].filter(Boolean).length;
    if (fails > 1) fail('321 ambiguous', q);
    const e = c < 3 ? 'No: it needs at least 3 copies' : md < 2 ? 'No: it needs 2 different types of storage' : !off ? 'No: it needs 1 copy offsite' : 'Yes, it meets 3-2-1'; if (A !== e) fail('321', q); }
  else if ((m = Q.match(/accepts whole numbers from (\d+) to (\d+)/))) { const lo = +m[1], hi = +m[2]; if (A !== [lo - 1, lo, hi, hi + 1].join(', ')) fail('boundary', q); }
  else if ((m = Q.match(/accepts (\d+) to (\d+)\. Using equivalence partitioning, which value belongs to the (valid|too low|too high)/))) {
    const lo = +m[1], hi = +m[2], g = v => v < lo ? 'too low' : v > hi ? 'too high' : 'valid';
    if (g(+A) !== m[3]) fail('partA', q); O.slice(1).forEach(o => { if (g(+o) === m[3]) fail('partW', q); }); }
  else if ((m = Q.match(/what comes right after "(.+?)"\?/))) {
    const lists = [['Identify the problem','Establish a theory of probable cause','Test the theory','Make a plan of action','Implement the fix or escalate','Verify it works and prevent repeats','Document everything'], ['Requirement analysis','Test planning','Test case design','Test environment setup','Test execution','Test closure']];
    const L = lists.find(l => l.includes(m[1])); if (!L || A !== L[L.indexOf(m[1]) + 1]) fail('order', q); }
  else if ((m = Q.match(/a bug is in (\w+)\. What is the next state/))) { const F = ['New','Assigned','Open','Fixed','Retest','Verified','Closed']; if (A !== F[F.indexOf(m[1]) + 1]) fail('bugflow', q); }
  else if (/true multi-factor authentication/.test(Q)) {
    const F = { know: ['a password','a PIN','the answer to a security question'], have: ['a code from an authenticator app','a hardware security key','a smart card','a code texted to your phone'], are: ['a fingerprint','a face scan','a voice print'] };
    const type = x => Object.keys(F).find(k => F[k].includes(x)); const ok = s => { const [a, b] = s.split(' + '); return type(a) !== type(b); };
    if (!ok(A)) fail('mfaA', q); O.slice(1).forEach(o => { if (ok(o)) fail('mfaW', q); }); }
  else if ((m = Q.match(/Which of these is (a hashing|symmetric|asymmetric)/))) {
    const C = { 'a hashing': ['SHA-256','SHA-1','MD5','bcrypt','Argon2'], symmetric: ['AES','ChaCha20','3DES'], asymmetric: ['RSA','ECC'] }[m[1]];
    if (!C.includes(A)) fail('cryptoA', q); O.slice(1).forEach(o => { if (C.includes(o)) fail('cryptoW', q); }); }
  else unchecked[tid + lv + ':' + gi] = Q.slice(0, 50);
}
let empty = 0; for (const tid of Object.keys(G)) for (const lv of [1, 2]) if (gf(tid, lv).length) { for (let k = 0; k < 500; k++) if (!mk(tid, lv)) empty++; }
console.log('generators', Object.values(G).reduce((a, g) => a + g[1].length + g[2].length, 0), '| questions checked', n, '| problems', bad, '| makeGen failures', empty);
console.log('lookup-style generators (answer pulled from a fixed table, not computed):', Object.keys(unchecked).join(' '));
process.exitCode = bad ? 1 : 0;
