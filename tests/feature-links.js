// How it connects (links.js) and the mixed-set order (mix.js): every link points at a real lesson, no lesson links to
// itself, no pair is listed twice (either way round), every lesson ends up with at least two links, and each reason is
// one plain sentence. mixOrder keeps every question, and never puts the same skill twice in a row when it can avoid it.
const fs = require('fs');
const js = fs.readFileSync(__dirname + '/.tmp/script.js', 'utf8');
const line = name => { const i = js.indexOf('function ' + name + '('); return js.slice(i, js.indexOf('\n', i)); };
eval(js.split('/* ===================== STATE')[0] + ';' + line('shuffle') + ';' + line('esc') +
  ';global.T = {LESSON_LINKS, lessonLinks, mixOrder, LESSONS, ids: allSkills().map(s => s.id)};');
let bad = 0; const fail = (...a) => { bad++; if (bad < 25) console.log('FAIL', ...a); };

/* 1. links */
const ids = new Set(T.ids), pairs = new Set();
for (const [from, list] of Object.entries(T.LESSON_LINKS)) {
  if (!ids.has(from)) fail('links listed under a lesson that does not exist:', from);
  for (const [to, why] of list) {
    if (!ids.has(to) || !T.LESSONS[to]) fail(from, 'links to a lesson that does not exist:', to);
    if (to === from) fail(from, 'links to itself');
    const key = [from, to].sort().join(' ~ ');
    if (pairs.has(key)) fail('the pair is listed twice:', key); pairs.add(key);
    if (typeof why !== 'string' || why.length < 25 || why.length > 200) fail(from, '→', to, 'needs a one-sentence reason (25 to 200 characters)');
    else if (/<[a-z\/!]/i.test(why) ||!/[.?]$/.test(why)) fail(from, '→', to, 'reason should be plain text ending in a period');
  }
}
let fewest = 99;
for (const id of T.ids) { const n = T.lessonLinks(id).length; fewest = Math.min(fewest, n); if (n < 2) fail(id, 'has', n, 'link(s); every lesson needs at least 2'); }

/* 2. the mixed set's order */
let r = 7; const rand = () => (r = (r * 16807) % 2147483647) / 2147483647;
for (let trial = 0; trial < 2000; trial++) {
  const sizes = [1 + Math.floor(rand() * 4), 1 + Math.floor(rand() * 4), Math.floor(rand() * 5), Math.floor(rand() * 2), Math.floor(rand() * 2)];
  const entries = []; sizes.forEach((n, k) => { for (let i = 0; i < n; i++) entries.push({key:'s' + k, i}); });
  const out = T.mixOrder(entries.slice(), rand);
  if (out.length !== entries.length || new Set(out).size !== entries.length || !entries.every(e => out.includes(e))) { fail('mixOrder lost or repeated a question', sizes); continue; }
  /* the same skill twice in a row is only allowed when one skill has more than all the others put together, plus one */
  const most = Math.max(...sizes), rest = entries.length - most, avoidable = most <= rest + 1;
  const twice = out.some((e, i) => i && e.key === out[i - 1].key);
  if (avoidable && twice) fail('mixOrder put a skill twice in a row when it could avoid it', sizes, out.map(e => e.key).join(','));
}
console.log('links', pairs.size, '| fewest per lesson', fewest, '| mixed-order trials 2000 | problems', bad);
process.exit(bad ? 1 : 0);
