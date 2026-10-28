// Checks the flashcard deck (topics, duplicates, HTML) and that mastery only counts what is retained right now.
const fs = require('fs');
const js = fs.readFileSync(__dirname + '/.tmp/script.js', 'utf8');
const content = js.split('/* ===================== STATE')[0];
const grab = n => { const i = js.indexOf('function ' + n + '('); if (i < 0) throw new Error('missing ' + n); return js.slice(i, js.indexOf('\n}', i) + 2); };
const line = n => { const i = js.indexOf(n); return js.slice(i, js.indexOf('\n', i)); };
let TODAY = '2026-10-27';
eval(content + ';' + line('const QUIZ_FADE') + ';' + ['dayStr', 'addDays', 'cardId', 'quizId', 'cardStatus', 'quizStatus', 'levelStats', 'mastery'].map(n =>
  n === 'dayStr' ? line('function dayStr(').replace('d = d || new Date();', 'if(!d) return TODAY;') : ['cardId', 'quizId', 'addDays'].includes(n) ? line('function ' + n + '(') : grab(n)).join('\n') +
  ';global.X={CARDS,QUIZ,CARD_TOPICS,BANDIT_GUIDE,cardStatus,quizStatus,levelStats,mastery,setS:v=>{S=v}}; var S;');
const { CARDS, QUIZ, CARD_TOPICS, BANDIT_GUIDE } = X;
let bad = 0; const fail = (...a) => { bad++; console.log('FAIL', ...a); };

/* ---- deck shape ---- */
const strip = h => h.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim().toLowerCase();
const fronts = new Map();
CARDS.forEach((c, i) => {
  if (c.length !== 4 && c.length !== 5) fail('card', i, 'should have 4 or 5 fields');
  if (c[4] !== undefined && !CARD_TOPICS[c[4]]) fail('card', i, 'unknown topic', c[4]);
  if (c[0] === 'linux' && !c[4]) fail('linux card', i, 'needs a topic so Browse can filter it');
  const f = c[0] + '|' + strip(c[2]);
  if (fronts.has(f)) fail('duplicate front:', c[2], '(cards', fronts.get(f), 'and', i + ')');
  fronts.set(f, i);
  for (const side of [c[2], c[3]]) {
    const rest = side.replace(/<\/?(code|b|i|br)>/g, '').replace(/<span class="(ps|small)">|<\/span>/g, '');
    if (/[<>]/.test(rest)) fail('card', i, 'has raw < or > (escape it as &lt; &gt;):', side.slice(0, 80));
    if ((side.match(/<code>/g) || []).length !== (side.match(/<\/code>/g) || []).length) fail('card', i, 'unbalanced <code>');
  }
  if (c[2].includes('class="ps"')) fail('card', i, 'PowerShell belongs on the back only');
  if ((c[3].match(/class="ps"/g) || []).length > 1) fail('card', i, 'more than one PowerShell line');
});
const used = new Set(CARDS.filter(c => c[0] === 'linux').map(c => c[4]));
BANDIT_GUIDE.flat().forEach(k => { if (!CARD_TOPICS[k] || !used.has(k)) fail('Bandit guide topic without cards:', k); });
/* no Bandit spoilers: cards teach techniques, never passwords or level walkthroughs */
CARDS.forEach((c, i) => { if (/bandit\d|level \d+/i.test(c[2] + c[3])) fail('card', i, 'mentions a specific Bandit level'); });

/* ---- honest mastery ---- */
const ci = CARDS.findIndex(c => c[0] === 'linux' && c[1] === 1), qi = QUIZ.findIndex(q => q[0] === 'linux' && q[1] === 1);
const base = () => ({ cards: {}, quiz: {}, miss: {} });
const chk = (s, what, want) => { X.setS(s); const got = what(); if (got !== want) fail(JSON.stringify(s), '→', got, 'expected', want); };
chk(base(), () => X.cardStatus(ci), 'new');
chk(Object.assign(base(), { cards: { ['c' + ci]: { box: 2, due: '2026-10-30' } } }), () => X.cardStatus(ci), 'learning');
chk(Object.assign(base(), { cards: { ['c' + ci]: { box: 3, due: '2026-11-01' } } }), () => X.cardStatus(ci), 'retained');
chk(Object.assign(base(), { cards: { ['c' + ci]: { box: 3, due: '2026-10-20' } } }), () => X.cardStatus(ci), 'retained');   // overdue 7 days = within its 7-day gap
chk(Object.assign(base(), { cards: { ['c' + ci]: { box: 3, due: '2026-10-19' } } }), () => X.cardStatus(ci), 'fading');     // overdue 8 days
chk(Object.assign(base(), { cards: { ['c' + ci]: { box: 5, due: '2026-09-10' } } }), () => X.cardStatus(ci), 'fading');
chk(base(), () => X.quizStatus(qi), 'new');
chk(Object.assign(base(), { quiz: { ['q' + qi]: true } }), () => X.quizStatus(qi), 'retained');
chk(Object.assign(base(), { quiz: { ['q' + qi]: true }, miss: { ['q' + qi]: true } }), () => X.quizStatus(qi), 'learning');   // right once, missed later
chk(Object.assign(base(), { miss: { ['q' + qi]: true } }), () => X.quizStatus(qi), 'learning');
/* quiz answers fade 30 days after the last right answer (TODAY = 2026-10-27) */
chk(Object.assign(base(), { quiz: { ['q' + qi]: '2026-10-20' } }), () => X.quizStatus(qi), 'retained');
chk(Object.assign(base(), { quiz: { ['q' + qi]: '2026-09-27' } }), () => X.quizStatus(qi), 'retained');   // exactly 30 days
chk(Object.assign(base(), { quiz: { ['q' + qi]: '2026-09-26' } }), () => X.quizStatus(qi), 'fading');
chk(Object.assign(base(), { quiz: { ['q' + qi]: '2026-08-01' }, miss: { ['q' + qi]: true } }), () => X.quizStatus(qi), 'learning');
/* the four counts always add up, and mastery = retained share */
X.setS(Object.assign(base(), { cards: { ['c' + ci]: { box: 4, due: '2026-11-05' } }, quiz: { ['q' + qi]: true } }));
const st = X.levelStats('linux', 1);
if (st.retained + st.fading + st.learning + st.new !== st.total) fail('stats do not add up', JSON.stringify(st));
if (st.retained !== 2 || X.mastery('linux', 1) !== Math.round(2 / st.total * 100)) fail('mastery should be retained / total', JSON.stringify(st));
X.setS(base()); if (X.mastery('linux', 1) !== 0) fail('fresh start should be 0%');

console.log('cards', CARDS.length, '| linux', CARDS.filter(c => c[0] === 'linux').length, '| topics', used.size, '| problems', bad);
process.exitCode = bad ? 1 : 0;
