// Settle: the looping background effects (drift, stars, planet, comet, orbs, title effects) play for a few seconds
// after the app opens or the screen changes, then hold still, so they don't keep the GPU busy while you read and type.
// Every effect the idle pause stops must also stop when settled, and both the first screen and go() must start the timer.
const fs = require('fs');
const css = fs.readFileSync(__dirname + '/../src/styles.css', 'utf8');
const js = fs.readFileSync(__dirname + '/.tmp/script.js', 'utf8');
let bad = 0; const expect = (ok, what)=>{ if(!ok){ bad++; console.log('FAIL', what); } };

const idleRules = css.split('\n').filter(l => /^html\.idle[^{]*\{animation-play-state:/.test(l));
expect(idleRules.length >= 5, 'expected the idle pause rules, found ' + idleRules.length);
for (const l of idleRules) {
  const sel = l.slice(0, l.indexOf('{')).split(',').map(s => s.trim());
  for (const s of sel.filter(s => s.startsWith('html.idle')))
    expect(sel.includes(s.replace(/^html\.idle/, 'html.still')), 'settled screens also stop: ' + s);
}
/* every endless animation in the glass looks is one the idle/settle rules stop */
for (const name of ['orbs', 'warpdrift', 'spin', 'orbit', 'comet'])
  expect(new RegExp('animation:' + name + ' [^;}]*infinite').test(css), name + ' is still defined (test needs updating if renamed)');
expect(/html\.still #space \*/.test(css) && /html\.still \.orb/.test(css) && /html\.still body::before/.test(css), 'stars, planet, comet, orbs and the drift all settle');
expect(/html\.still #space \.jump\{animation-play-state:running\}|html\.still #space \.jump[,{]/.test(css), 'a warp jump always finishes, even when settled');

const SETTLE = (js.match(/const SETTLE_MS = (\d+)/) || [])[1];
expect(SETTLE && +SETTLE > 0 && +SETTLE <= 10000, 'effects settle within 10 seconds (SETTLE_MS = ' + SETTLE + ')');
expect(/current = tab; stopTimer\(\); header\(\); warpJump\(\); settleSoon\(\);/.test(js), 'every screen change through go() replays the effects briefly');
expect(/wake\(\); settleSoon\(\);/.test(js), 'the first screen settles too');

console.log(bad ? bad + ' failure(s)' : 'settle: ' + idleRules.length + ' pause rules also apply when settled');
process.exit(bad ? 1 : 0);
