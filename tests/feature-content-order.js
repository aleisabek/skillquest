// Saved progress is keyed by array position, so CARDS, QUIZ, TERM, IV and SQLT may only grow at the end.
// content-snapshot.json holds a short hash of every item; the current arrays must start with exactly those items.
// After a deliberate wording fix, refresh it with: node tests/feature-content-order.js --update
const fs = require('fs');
const crypto = require('crypto');
const js = fs.readFileSync(__dirname + '/.tmp/script.js', 'utf8');
eval(js.split('/* ===================== STATE')[0] + ';global.T={CARDS,QUIZ,TERM,IV,SQLT}');
const key = {
  CARDS: c => c[0] + '|' + c[2], QUIZ: q => q[0] + '|' + q[2], TERM: t => t[0], IV: q => q.q, SQLT: t => t[1],
  /* Terminal and SQL progress is stored under the model answer (S.term[t[2]], S.sql[t[3]]), so that is guarded too */
  TERM_ANSWER: t => t[2], SQLT_ANSWER: t => t[3]
};
T.TERM_ANSWER = T.TERM; T.SQLT_ANSWER = T.SQLT;
const hash = s => crypto.createHash('sha1').update(s).digest('hex').slice(0, 10);
const now = Object.fromEntries(Object.entries(key).map(([k, f]) => [k, T[k].map(x => hash(f(x)))]));
const file = __dirname + '/content-snapshot.json';
if (process.argv.includes('--update') || !fs.existsSync(file)) {
  fs.writeFileSync(file, JSON.stringify(now, null, 0) + '\n');
  console.log('snapshot written |', Object.entries(now).map(([k, v]) => k + ' ' + v.length).join(', '));
  process.exit(0);
}
const snap = JSON.parse(fs.readFileSync(file, 'utf8'));
let bad = 0;
for (const k of Object.keys(key)) {
  const old = snap[k] || [];
  if (now[k].length < old.length) { bad++; console.log(k + ': items were removed (' + old.length + ' → ' + now[k].length + ')'); }
  old.forEach((h, i) => { if (now[k][i] !== undefined && now[k][i] !== h) { bad++; console.log(k + '[' + i + '] changed or moved: ' + key[k](T[k][i]).slice(0, 80)); } });
}
console.log('append-only check |', Object.keys(key).map(k => k + ' ' + (snap[k] || []).length + '→' + now[k].length).join(', '), '| problems', bad);
process.exitCode = bad ? 1 : 0;
