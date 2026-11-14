// Multiple-choice answers must be worked out, not spotted. The right answer can't keep being the longest choice
// (or the only one far longer than the rest), in the ticket simulator, the fixed quiz questions or any question
// generator, and ticket decisions have one best move, real feedback on every choice, and no joke choices.
// By chance the right answer is the longest about 1 time in 4.
const fs = require('fs');
const js = fs.readFileSync(__dirname + '/.tmp/script.js', 'utf8');
const line = name => { const i = js.indexOf('function ' + name + '('); return js.slice(i, js.indexOf('\n', i)); };
eval(js.split('/* ===================== STATE')[0] + ';' + line('shuffle') + ';' + line('esc') +
  ';function tableHTML(c, r){ return c.join(" ") + r.map(x => x.join(" ")).join(" "); }' +
  ';global.T = {SCEN, QUIZ, GEN, TRACKS};');
let bad = 0; const fail = (...a) => { bad++; if (bad < 30) console.log('FAIL', ...a); };
const txt = h => String(h).replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();
/* the share of questions where the right answer is the longest, and where it is 30% longer than every other choice */
const tell = qs => {
  let longest = 0, wide = 0;
  for (const [opts, r] of qs) { const L = opts.map(o => txt(o).length), m = Math.max(...L.filter((_, k) => k !== r));
    if (L[r] > m) longest++; if (L[r] >= 1.3 * m) wide++; }
  return {longest: longest / qs.length, wide: wide / qs.length};
};
const pct = x => Math.round(100 * x) + '%';
/* choices that are jokes rather than mistakes a real person makes; once removed they stay out */
const JOKES = /required by law|only on fridays|the monitor is off|the keyboard|post it (online|on social)|turn the screen brightness up|to hack the|it is harmless|reboot again|delete your notes|using it wrong|on purpose/i;

/* 1. ticket simulator */
const steps = T.SCEN.flatMap(s => s.steps.map((st, i) => ({id: s.id + ' #' + (i + 1), st})));
const ticket = steps.map(({st}) => { const top = Math.max(...st.c.map(c => c[1])); return [st.c.map(c => c[0]), st.c.findIndex(c => c[1] === top)]; });
for (const {id, st} of steps) {
  const top = st.c.filter(c => c[1] === 10);
  if (st.c.length !== 4) fail(id, 'should have 4 choices');
  if (top.length !== 1) fail(id, 'should have exactly one best move worth 10, has', top.length);
  if (st.c.some(c => c[1] < 0 || c[1] > 10 || (c[1] !== 10 && c[1] > 7))) fail(id, 'other choices score 0 to 7 (a 10 is the best move)');
  for (const c of st.c) {
    if (typeof c[2] !== 'string' || c[2].length < 25) fail(id, 'every choice needs real feedback on why:', txt(c[0]));
    if (JOKES.test(txt(c[0]))) fail(id, 'joke choice:', txt(c[0]));
  }
  const L = st.c.map(c => txt(c[0]).length);
  if (Math.max(...L) > 1.6 * Math.min(...L)) fail(id, 'choices should be about the same length:', L.join(', '));
}
const tk = tell(ticket);
if (tk.longest > 0.35) fail('tickets: the best move is the longest choice in', pct(tk.longest), 'of decisions (limit 35%)');
if (tk.wide > 0) fail('tickets: the best move is far longer than the others in', pct(tk.wide), 'of decisions');
/* and not always the shortest either */
const shortest = ticket.filter(([o, r]) => { const L = o.map(x => txt(x).length); return L[r] < Math.min(...L.filter((_, k) => k !== r)); }).length / ticket.length;
if (shortest > 0.4) fail('tickets: the best move is the shortest choice in', pct(shortest), 'of decisions (limit 40%)');

/* 2. fixed quiz questions */
const quiz = T.QUIZ.filter(q => q[3].length >= 3).map(q => [q[3], q[4]]);
const qz = tell(quiz);
if (qz.longest > 0.4) fail('fixed quiz: the right answer is the longest in', pct(qz.longest), '(limit 40%)');
if (qz.wide > 0.1) fail('fixed quiz: the right answer is far longer than the rest in', pct(qz.wide), '(limit 10%)');
T.QUIZ.forEach((q, i) => q[3].forEach((o, k) => { if (k !== q[4] && JOKES.test(txt(o))) fail('QUIZ[' + i + '] joke choice:', txt(o)); }));

/* 3. every generator, sampled */
let gens = 0;
for (const t of T.TRACKS) for (const lv of [1, 2]) ((T.GEN[t.id] || {})[lv] || []).forEach((f, k) => {
  const qs = [];
  for (let i = 0; i < 60; i++) { let q = null; try { q = f(); } catch (e) {} if (q && q.d[3].length >= 3) qs.push([q.d[3], q.d[4]]); }
  if (!qs.length) return; gens++;
  /* a generator that always shows the same labels (Incident / Service request / Problem / Change) gives nothing away */
  const fixedLabels = new Set(qs.map(([o]) => o.map(txt).sort().join('|'))).size === 1;
  const g = tell(qs);
  if (!fixedLabels && g.wide > 0.35)fail('generator', t.id, 'L' + lv, '#' + k, f.sk, ': the right answer is far longer than the rest in', pct(g.wide));
  qs.forEach(([o, r]) => o.forEach((x, j) => { if (j !== r && JOKES.test(txt(x))) fail('generator', t.id, f.sk, 'joke choice:', txt(x)); }));
});
console.log('ticket decisions', ticket.length, '(best is longest', pct(tk.longest) + ', shortest', pct(shortest) + ') | fixed quiz', quiz.length,
  '(right is longest', pct(qz.longest) + ', far longer', pct(qz.wide) + ') | generators', gens, '| problems', bad);
process.exit(bad ? 1 : 0);
