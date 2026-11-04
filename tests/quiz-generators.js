const js = require('fs').readFileSync(__dirname + '/.tmp/script.js', 'utf8');
const grab = name => { const i = js.indexOf('function ' + name + '('); return js.slice(i, js.indexOf('\n}', i) + 2); };
const line = name => { const i = js.indexOf('function ' + name + '('); return js.slice(i, js.indexOf('\n', i)); };
eval(js.split('/* ===================== STATE')[0] + ';' + line('shuffle') + ';' + line('esc') + ';' + grab('tableHTML') + ';global.G=GEN;global.mk=makeGen;global.gf=genFor');
const strip = s => s.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const isPriv = ip => { const a = ip.split('.').map(Number); return a[0] === 10 || (a[0] === 172 && a[1] >= 16 && a[1] <= 31) || (a[0] === 192 && a[1] === 168); };
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
let bad = 0, n = 0, unchecked = {}, notVerified = {};
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
  else if ((m = Q.match(/owner permissions are ([r-][w-][x-]). The files/))) { /* folder bits: r lists, x opens by name, w only with x creates */ const [r, w, x] = [m[1][0] === 'r', m[1][1] === 'w', m[1][2] === 'x'];
    const ok = !r && !x ? /^Nothing/.test(A) : (/^List the names/.test(A) === r && /(^|, )open a file by its name/.test(A) === x && /(^|, )create or delete files/.test(A) === (w && x)); if (!ok) fail('folder perms', q); }
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
    const lists = [['Reconnaissance','Weaponization','Delivery','Exploitation','Installation','Command and Control','Actions on Objectives'], ['Deactivate the key and issue a new one','Check the audit log for everything the key did','Remove the key from the code and its history','Turn on secret scanning so it can\'t happen again'],['Preparation','Detection','Analysis','Containment','Eradication','Recovery','Lessons learned'],['Identify the problem','Establish a theory of probable cause','Test the theory','Make a plan of action','Implement the fix or escalate','Verify it works and prevent repeats','Document everything'], ['Requirement analysis','Test planning','Test case design','Test environment setup','Test execution','Test closure']];
    const L = lists.find(l => l.includes(m[1])); if (!L || A !== L[L.indexOf(m[1]) + 1]) fail('order', q); }
  else if ((m = Q.match(/a bug is in (\w+)\. What is the next state/))) { const F = ['New','Assigned','Open','Fixed','Retest','Verified','Closed']; if (A !== F[F.indexOf(m[1]) + 1]) fail('bugflow', q); }
  else if (/true multi-factor authentication/.test(Q)) {
    const F = { know: ['a password','a PIN','the answer to a security question'], have: ['a code from an authenticator app','a hardware security key','a smart card','a code texted to your phone'], are: ['a fingerprint','a face scan','a voice print'] };
    const type = x => Object.keys(F).find(k => F[k].includes(x)); const ok = s => { const [a, b] = s.split(' + '); return type(a) !== type(b); };
    if (!ok(A)) fail('mfaA', q); O.slice(1).forEach(o => { if (ok(o)) fail('mfaW', q); }); }
  else if ((m = Q.match(/Which of these is (a hashing|symmetric|asymmetric)/))) {
    const C = { 'a hashing': ['SHA-256','SHA-1','MD5','bcrypt','Argon2'], symmetric: ['AES','ChaCha20','3DES'], asymmetric: ['RSA','ECC'] }[m[1]];
    if (!C.includes(A)) fail('cryptoA', q); O.slice(1).forEach(o => { if (C.includes(o)) fail('cryptoW', q); }); }
  else if ((m = Q.match(/Walk-forward test on yearly data from (\d+) to (\d+): train on (\d+) years, test on the next 1 year/))) { if (+A !== (+m[2] - +m[1] + 1) - +m[3]) fail('folds', q); }
  else if ((m = Q.match(/Walk-forward on (\d+) to (\d+), training on (\d+) years .* In fold (\d+), which year is the test year/))) { if (+A !== +m[1] + +m[3] + +m[4] - 1) fail('fold year', q); }
  else if ((m = Q.match(/Your data runs through (\w{3}) (\d{4})\. You seal the last (\d+) months/))) {
    const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    let mo = MON.indexOf(m[1]) - (+m[3] - 1), y = +m[2]; while (mo < 0) { mo += 12; y--; }
    if (A !== MON[mo] + ' ' + y) fail('sealed month ' + MON[mo] + ' ' + y, q); }
  else if ((m = Q.match(/: (\d+) failed logins, across (\d+) accounts?, using (\d+) (?:different passwords|password)\./))) {
    const f = +m[1], u = +m[2], p = +m[3];
    const e = u === 1 && f <= 3 ? 'A user mistyping their password' : u === 1 ? 'Brute force' : p === 1 ? 'Password spraying' : p === u ? 'Credential stuffing' : null;
    if (!e || A !== e) fail('login pattern ' + e, q); }
  else if ((m = Q.match(/A packet from (\d+\.\d+\.\d+\.\d+) to port (\d+) arrives/))) {
    const num = ip => ip.split('.').reduce((a, b) => a * 256 + +b, 0);
    const inNet = (ip, c) => { const [n, b] = c.split('/'); const size = 2 ** (32 - +b); return Math.floor(num(ip) / size) === Math.floor(num(n) / size); };
    const rules = [...q[2].matchAll(/<tr><td>(\d+)<\/td><td>(allow|deny)<\/td><td>([^<]+)<\/td><td>([^<]+)<\/td><\/tr>/g)].map(x => ({ n: +x[1], act: x[2], src: x[3], port: x[4] }));
    const hit = rules.find(r => (r.src === 'any' || inNet(m[1], r.src)) && (r.port === 'any' || +r.port === +m[2]));
    if (rules.length < 3 || !hit || A !== (hit.act === 'allow' ? 'Allowed' : 'Denied') + ' by rule ' + hit.n) fail('firewall first match', q); }
  else if (/This is the only policy on a user\b/.test(Q)) {
    /* IAM evaluation, re-derived independently: explicit Deny > Allow > implicit deny; statement order irrelevant */
    const pol = JSON.parse(strip(q[2].match(/<pre>([\s\S]*?)<\/pre>/)[1])), rq = Q.match(/Request: (\S+) on (\S+)\. What happens/);
    const like = (p, v) => new RegExp('^' + p.split('*').map(x => x.replace(/[.:/]/g, '\\$&')).join('.*') + '$').test(v);
    const hits = pol.Statement.filter(st => like(st.Action, rq[1]) && like(st.Resource, rq[2]));
    const e = hits.some(st => st.Effect === 'Deny') ? 'Denied: an explicit Deny matches' : hits.length ? 'Allowed' : 'Denied: nothing allows it (implicit deny)';
    if (A !== e) fail('iam ' + e, q); }
  else if (/A CloudTrail record:/.test(Q)) {
    const rec = JSON.parse(strip(q[2].match(/<pre>([\s\S]*?)<\/pre>/)[1]));
    const e = /Who made this call/.test(Q) ? rec.userIdentity.userName : rec.sourceIPAddress;
    if (A !== e) fail('cloudtrail field', q); }
  else if ((m = Q.match(/allow inbound traffic from anywhere on the internet to port (\d+)\?/))) {
    const rules = [...q[2].matchAll(/<tr><td>[^<]*<\/td><td>(\d+)<\/td><td>([^<]+)<\/td><\/tr>/g)].map(x => ({ port: +x[1], src: x[2] }));
    const onPort = rules.filter(r => r.port === +m[1]);
    const e = onPort.some(r => r.src === '0.0.0.0/0') ? 'Yes: a rule allows it from 0.0.0.0/0' : onPort.length ? 'No: that port is allowed only from a private range' : 'No: no inbound rule allows that port';
    if (rules.length < 1 || A !== e) fail('security group exposure ' + e, q); }
  else if ((m = Q.match(/In scope:\s+(\S+)\/24\s+Excluded:\s+(\S+) \(production database\)\s+Window:\s+(\d\d):00-(\d\d):00 UTC[\s\S]*May you test (\S+) at (\d\d):30 UTC\?/))) {
    /* rules of engagement, re-derived: excluded beats everything, then the /24 range, then the overnight window */
    const [, net, excl, st, en, ip, h] = m, same24 = ip.split('.').slice(0, 3).join('.') === net.split('.').slice(0, 3).join('.');
    const inWin = +h >= +st || +h < +en;
    const e = ip === excl ? 'No: the target is explicitly excluded' : !same24 ? 'No: the target is out of scope' : !inWin ? 'No: outside the testing window' : 'Yes: in scope and inside the testing window';
    if (A !== e) fail('rules of engagement ' + e, q); }
  else if (/Is this Python database call safe from SQL injection\?/.test(Q)) {
    const code = Q.slice(Q.indexOf('cur.execute'));
    const e = /^cur\.execute\("[^"]*(%s|\?)", \(\w+,\)\)/.test(code) ? 'Safe: the value is passed separately as a parameter'
      : /^cur\.execute\(f"/.test(code) ? 'Vulnerable: an f-string builds the query from the input'
      : /" % \w+\)/.test(code) ? 'Vulnerable: %-formatting puts the input into the query text'
      : /" \+ \w+ \+ "/.test(code) ? 'Vulnerable: the input is concatenated into the query text' : '?';
    if (A !== e) fail('sql style ' + e, q); }
  else if ((m = Q.match(/user=\w+ \(id (\d+), role (customer|support admin)\)\s+GET \/api\/invoices\/\d+\s+owner=(\d+)/))) {
    const e = m[2] === 'support admin' ? 'Yes: support admins may view any invoice' : m[1] === m[3] ? 'Yes: it is the user\'s own invoice' : 'No: it belongs to another customer';
    if (A !== e) fail('invoice access ' + e, q); }
  else if ((m = Q.match(/\(([\d,]+) guesses a second\)\. The password is (\d+) characters of (lowercase letters only|upper- and lowercase letters and digits)/))) {
    const rate = +m[1].replace(/,/g, ''), n = m[3].startsWith('lowercase') ? 26 : 62, s = n ** +m[2] / rate;
    const e = s < 60 ? 'Under a minute' : s < 24 * 3600 ? 'Under a day' : s < 365 * 24 * 3600 ? 'Under a year' : 'A year or more';
    if (A !== e) fail('keyspace time ' + e, q); }
  else if (/Which finding gets fixed first\?/.test(Q)) {
    const rows = [...q[2].matchAll(/<tr><td>(F-\d+)<\/td><td>([\d.]+)<\/td><td>(Yes|No)<\/td><td>(Yes|No)<\/td><\/tr>/g)].map(x => ({ id: x[1], c: +x[2], net: x[3] === 'Yes', kev: x[4] === 'Yes' }));
    let best = rows[0]; for (const r of rows) if (r.kev !== best.kev ? r.kev : r.net !== best.net ? r.net : r.c > best.c) best = r;
    if (rows.length !== 4 || A !== best.id) fail('finding priority ' + (best && best.id), q); }
  else if (/Which file's line decides whether passwords are allowed\?/.test(Q)) {
    /* sshd: drop-ins (in name order) are read before the rest of sshd_config, and the first value read wins */
    const blocks = [...Q.matchAll(/== (sshd_config(?:\.d\/([\w-]+\.conf))?) ==\n([^=]*)/g)].map(x => ({ name: x[2] || 'sshd_config', drop: !!x[2], body: x[3] }));
    const order = blocks.filter(b => b.drop).sort((a, b) => a.name < b.name ? -1 : 1).concat(blocks.filter(b => !b.drop));
    const win = order.find(b => /^PasswordAuthentication /m.test(b.body));
    if (!win || A !== win.name) fail('sshd first value ' + (win && win.name), q); }
  else if ((m = Q.match(/^Equipment worth \$([\d,]+) would lose about (\d+)% of its value in one incident \(the exposure factor\)\. Incidents like this happen about once every (\d+) years\. What is the (annualized loss expectancy|single loss expectancy)/))) {
    /* SLE = asset value × exposure factor; ALE = SLE × ARO, where once every N years is an ARO of 1/N */
    const av = +m[1].replace(/,/g, ''), sle = av * +m[2] / 100, ale = sle / +m[3], want = m[4].startsWith('annualized') ? ale : sle;
    const val = s => +s.replace(/[$,]/g, '');
    if (val(A) !== Math.round(want)) fail('risk money ' + want, q);
    O.slice(1).forEach(o => { if (val(o) === Math.round(want)) fail('risk money: a wrong option equals the answer', q); }); }
  else if ((m = Q.match(/lose at most (\d+) hours? of order data \(its RPO, recovery point objective\)\. Backups run every (\d+) hours?\./))) {
    /* worst case loses one whole backup interval, so the RPO holds only if interval <= RPO */
    const ok = +m[2] <= +m[1]; if (!A.startsWith(ok ? 'Yes:' : 'No:')) fail('rpo', q);
    if (O.slice(1).some(o => o.startsWith(ok ? 'Yes:' : 'No:'))) fail('rpo: two options agree', q); }
  else if ((m = Q.match(/A phishing simulation goes to (\d+) staff\. (\d+) click the link and (\d+) report the email\. What is the (click|report) rate\?/))) {
    const pct = Math.round(+(m[4] === 'click' ? m[2] : m[3]) / +m[1] * 100) + '%'; if (A !== pct) fail('phish rate ' + pct, q); }
  else if (G[tid][lv][gi].lookup) unchecked[tid + lv + ':' + gi] = Q.slice(0, 50);
  else { notVerified[G[tid][lv][gi].sk] = Q.slice(0, 70); }
}
/* Every generated answer must be re-derived above, unless its generator is marked {lookup:true} where it's defined
   (its answer comes from a fixed table). A computed generator nobody checks fails the run. */
for (const [skill, sample] of Object.entries(notVerified)) fail('computed answer not re-derived in this test (add a check, or mark it lookup): ' + skill, [0, 0, sample, ['']]);
let empty = 0; for (const tid of Object.keys(G)) for (const lv of [1, 2]) if (gf(tid, lv).length) { for (let k = 0; k < 500; k++) if (!mk(tid, lv)) empty++; }
console.log('generators', Object.values(G).reduce((a, g) => a + g[1].length + g[2].length, 0), '| questions checked', n, '| problems', bad, '| makeGen failures', empty);
console.log('lookup-style generators (answer pulled from a fixed table, not computed):', Object.keys(unchecked).join(' '));
process.exitCode = bad ? 1 : 0;
