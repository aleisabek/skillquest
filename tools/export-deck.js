// Exports SkillQuest's Linux flashcards as a public, self-contained web page (the Linux-Cheat-sheet site).
// SkillQuest stays the only place cards are written; run this after adding cards, then publish the output.
// The look borrows SkillQuest's hacker theme (matrix/cyber/amber, code rain, scanlines, clipped cards).
//   node tools/export-deck.js                 -> dist/linux-deck/index.html
//   node tools/export-deck.js --out <file>    -> writes there instead
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const outArg = process.argv.indexOf('--out');
const out = outArg > 0 ? path.resolve(process.argv[outArg + 1]) : path.join(root, 'dist', 'linux-deck', 'index.html');

const { CARDS, CARD_TOPICS, BANDIT_GUIDE } = vm.runInNewContext(
  fs.readFileSync(path.join(root, 'src', 'content.js'), 'utf8') + ';({CARDS,CARD_TOPICS,BANDIT_GUIDE})', {});

// Linux track only. Card markup is limited to code/b/i/br and span.ps/small (tests/feature-cards.js enforces it).
const cards = CARDS.filter(c => c[0] === 'linux').map(c => ({ f: c[2], b: c[3], t: c[4] }));
const used = Object.keys(CARD_TOPICS).filter(t => cards.some(c => c.t === t));
const data = JSON.stringify({ cards, topics: used.map(t => [t, CARD_TOPICS[t]]), guide: BANDIT_GUIDE }).replace(/</g, '\\u003c');
const today = new Date().toISOString().slice(0, 10);

const html = `<!DOCTYPE html>
<html lang="en" data-theme="matrix">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Linux & Bandit Command Deck</title>
<meta name="description" content="${cards.length} Linux command flashcards for OverTheWire Bandit and everyday admin work, with PowerShell equivalents.">
<link rel="icon" href="logo.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;800&family=VT323&display=swap">
<style>
:root,:root[data-theme="matrix"]{--bg:#030806;--panel:rgba(6,18,12,.9);--panel2:rgba(57,255,136,.07);--text:#c9ffdc;--muted:#6fae86;--line:#1b4a31;--accent:#39ff88;--accent2:#00d1ff;--accent-soft:rgba(57,255,136,.12);--on-accent:#021a0c;--glow:0 0 12px rgba(57,255,136,.45);color-scheme:dark}
:root[data-theme="cyber"]{--bg:#06051a;--panel:rgba(16,12,40,.92);--panel2:rgba(0,229,255,.07);--text:#e7e2ff;--muted:#9a90d6;--line:#33296e;--accent:#00e5ff;--accent2:#ff2bd6;--accent-soft:rgba(0,229,255,.12);--on-accent:#02121a;--glow:0 0 12px rgba(0,229,255,.5)}
:root[data-theme="amber"]{--bg:#0a0600;--panel:rgba(24,15,2,.92);--panel2:rgba(255,176,0,.07);--text:#ffdca6;--muted:#b98c4d;--line:#4d3510;--accent:#ffb000;--accent2:#ff6b3d;--accent-soft:rgba(255,176,0,.12);--on-accent:#1a0f00;--glow:0 0 12px rgba(255,176,0,.45)}
*{box-sizing:border-box}
html{background:var(--bg)}
body{margin:0;background:var(--bg);color:var(--text);font:15px/1.6 "JetBrains Mono","Cascadia Code",Consolas,ui-monospace,monospace;min-height:100vh}
#rain{position:fixed;inset:0;z-index:0;pointer-events:none;opacity:.14}
body::after{content:"";position:fixed;inset:0;pointer-events:none;z-index:30;background:repeating-linear-gradient(to bottom,rgba(255,255,255,.025) 0 1px,transparent 1px 3px),radial-gradient(ellipse at center,transparent 60%,rgba(0,0,0,.55) 100%)}
.wrap{position:relative;z-index:2;max-width:1040px;margin:0 auto;padding-block:20px 64px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
a{color:var(--accent2)}
a:hover{text-shadow:var(--glow)}
code{font-family:inherit;font-size:.92em;background:var(--panel2);color:var(--accent);padding:1px 6px;border:1px solid var(--line);border-radius:3px;overflow-wrap:anywhere}
button{font:inherit;font-size:.85rem;cursor:pointer;border:1px solid var(--line);background:transparent;color:var(--text);border-radius:4px;padding:6px 12px;transition:border-color .15s,box-shadow .15s,color .15s}
button:hover{border-color:var(--accent);color:var(--accent);box-shadow:var(--glow)}
button:focus-visible,input:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
button.primary{background:var(--accent);border-color:var(--accent);color:var(--on-accent);font-weight:800;text-transform:uppercase;letter-spacing:.08em;font-size:.8rem}
button.primary::before{content:"> "}
button.primary:hover{color:var(--on-accent);filter:brightness(1.1)}
.top{display:flex;align-items:center;gap:12px;flex-wrap:wrap;border-bottom:1px solid var(--line);padding-bottom:12px}
.logo{font-family:"VT323",monospace;font-size:2rem;line-height:1;color:var(--accent);text-shadow:var(--glow);text-decoration:none}
.logo small{font-family:"JetBrains Mono",monospace;font-size:.7rem;color:var(--muted);text-shadow:none;margin-left:6px}
.logo .mark{vertical-align:middle;margin-right:10px;filter:drop-shadow(0 0 6px rgba(57,255,136,.35))}
.tools{margin-left:auto;display:flex;gap:6px;flex-wrap:wrap}
.tools button,.tools .btn{padding:4px 10px}
.btn{font-size:.85rem;border:1px solid var(--line);border-radius:4px;color:var(--text);text-decoration:none}
.btn:hover{border-color:var(--accent);color:var(--accent);box-shadow:var(--glow);text-shadow:none}
h1{font-family:"VT323",monospace;font-weight:400;font-size:clamp(2rem,6vw,2.8rem);line-height:1.1;margin:28px 0 8px;color:var(--accent);text-shadow:var(--glow);text-wrap:balance}
h1::before{content:"root@bandit:~# ";color:var(--muted);text-shadow:none;font-size:.6em}
h1::after{content:"█";margin-left:6px;font-size:.8em;animation:blink 1s steps(1) infinite}
@keyframes blink{50%{opacity:0}}
h2{font-size:.9rem;margin:34px 0 12px;color:var(--accent2);text-transform:uppercase;letter-spacing:.12em;font-weight:600}
h2::before{content:"// ";color:var(--muted)}
.sub{color:var(--muted);margin:0;max-width:68ch}
.sub::before{content:"# ";color:var(--accent)}
.pills{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}
.pill{border:1px solid var(--line);border-radius:4px;padding:3px 10px;font-size:.8rem;background:var(--panel);white-space:nowrap}
.pill b{color:var(--accent)}
.card{position:relative;background:var(--panel);border:1px solid var(--line);clip-path:polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px));transition:border-color .2s;min-width:0}
.card::before{content:"";position:absolute;top:0;left:0;width:40px;height:2px;background:var(--accent);box-shadow:var(--glow)}
.card:hover{border-color:var(--accent)}
.guide{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin:0;padding:0;list-style:none;counter-reset:s}
.guide button{width:100%;height:100%;text-align:left;border:0;padding:14px;counter-increment:s;color:var(--text)}
.guide button:hover{box-shadow:none}
.guide button::before{content:"[ step 0" counter(s) " ]";display:block;font-size:.7rem;letter-spacing:.12em;color:var(--accent2);margin-bottom:4px}
.guide .card[data-on=true]{border-color:var(--accent);box-shadow:var(--glow)}
.guide small{display:block;color:var(--muted)}
.note{color:var(--muted);font-size:.85rem;margin:10px 0 0}
.controls{position:sticky;top:0;z-index:5;background:var(--bg);padding-block:12px;border-bottom:1px solid var(--line);display:grid;gap:10px}
.row{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.prompt{flex:1 1 260px;min-width:0;display:flex;align-items:center;gap:8px;background:var(--panel);border:1px solid var(--line);border-radius:4px;padding:0 12px}
.prompt span{color:var(--accent)}
.prompt input{flex:1;min-width:0;background:transparent;border:0;color:var(--text);font:inherit;padding:10px 0;outline:none}
.prompt:focus-within{border-color:var(--accent);box-shadow:var(--glow)}
.chip{font-size:.78rem;padding:3px 10px;color:var(--muted);text-transform:lowercase}
.chip::before{content:"./";opacity:.55}
.chip[aria-pressed=true]{color:var(--accent);border-color:var(--accent);background:var(--accent-soft);box-shadow:var(--glow)}
.toggle{display:inline-flex;gap:6px;align-items:center;color:var(--muted);font-size:.85rem;cursor:pointer;margin-right:10px}
.toggle input{accent-color:var(--accent)}
.count{color:var(--muted);font-size:.8rem;margin:14px 0 10px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px}
.grid button.face{all:unset;cursor:pointer;display:block;padding:18px 18px 12px}
.grid button.face:focus-visible{outline:2px solid var(--accent);outline-offset:-4px}
.tag{font-size:.68rem;text-transform:uppercase;letter-spacing:.14em;color:var(--accent2);margin-bottom:8px}
.tag::before{content:"[ "}.tag::after{content:" ]"}
.f{font-weight:600;overflow-wrap:anywhere}
.hint{color:var(--muted);font-size:.72rem;margin-top:10px}
.hint::before{content:"$ "}
.b{border-top:1px dashed var(--line);margin:0 18px;padding:12px 0 16px;font-size:.9rem;overflow-wrap:anywhere}
.ps{display:block;margin-top:8px;color:var(--muted);font-size:.85rem}
body:not(.show-ps) .ps{display:none}
.small{color:var(--muted)}
.empty{color:var(--muted)}
.drill{position:fixed;inset:0;z-index:20;background:rgba(0,0,0,.82);display:grid;place-items:center;padding:16px}
.drill .card{width:min(620px,100%);border-color:var(--accent);box-shadow:var(--glow)}
.drill .in{padding:22px;display:grid;gap:14px}
.drill .flash{min-height:220px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;font-size:1.1rem;cursor:pointer;user-select:none;padding:16px;border:1px dashed var(--line)}
.drill .flash.back{font-size:.95rem;text-align:left;align-items:flex-start;border-color:var(--accent2)}
.drill .bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:space-between;font-size:.8rem;color:var(--muted)}
footer{margin-top:56px;padding-top:14px;border-top:1px solid var(--line);color:var(--muted);font-size:.8rem}
footer::before{content:"-- ";}
[hidden]{display:none!important}
@media (prefers-reduced-motion:reduce){h1::after{animation:none}#rain{display:none}}
</style>
</head>
<body>
<canvas id="rain" aria-hidden="true"></canvas>
<div class="wrap">
<div class="top">
  <a class="logo" href="https://aleisabek.github.io"><img class="mark" src="logo.svg" alt="" width="44" height="44">bandit.deck<small>v${today}</small></a>
  <div class="tools">
    <button type="button" id="themeBtn" title="Switch color mode">◐ matrix</button>
    <button type="button" id="rainBtn" title="Background code rain on/off">⁂ rain</button>
    <a class="btn" href="https://aleisabek.github.io">← portfolio</a>
  </div>
</div>

<h1>Linux &amp; Bandit command deck</h1>
<p class="sub">The commands I use for OverTheWire's Bandit wargame and everyday Linux admin. Each card asks a question; click it for the command. Where Windows has one, the PowerShell equivalent is on the back.</p>
<div class="pills"><span class="pill"><b>${cards.length}</b> cards</span><span class="pill"><b>${used.length}</b> topics</span><span class="pill">updated <b>${today}</b></span></div>

<h2>Bandit study order</h2>
<ol class="guide" id="guide"></ol>
<p class="note"># Techniques only, no level solutions. OverTheWire asks players not to post them.</p>

<h2>Deck</h2>
<div class="controls">
  <div class="row">
    <label class="prompt"><span>grep&nbsp;-i</span><input type="search" id="q" placeholder="tar, base64, ssh, find -size…" aria-label="Search cards"></label>
    <button type="button" class="primary" id="drillBtn">Drill these</button>
  </div>
  <div class="row" id="chips" role="group" aria-label="Filter by topic"></div>
  <div class="row">
    <label class="toggle"><input type="checkbox" id="reveal"> show all answers</label>
    <label class="toggle"><input type="checkbox" id="ps" checked> PowerShell equivalents</label>
  </div>
</div>
<div class="count" id="count" aria-live="polite"></div>
<div class="grid" id="grid"></div>
<p class="empty" id="empty" hidden># No cards match. Try a shorter search.</p>

<footer>Generated from the deck inside SkillQuest, my offline practice app, so this page and the app never drift apart. Built by Alei Sabek.</footer>
</div>

<div class="drill" id="drill" hidden role="dialog" aria-modal="true" aria-label="Flashcard drill">
  <div class="card"><div class="in">
    <div class="bar"><span id="dPos"></span><button type="button" id="dClose">✕ close</button></div>
    <div class="tag" id="dTag"></div>
    <div class="flash" id="dFlash" tabindex="0"></div>
    <div class="bar"><span>space = flip · → = next · esc = close</span><span class="row"><button type="button" id="dFlip">flip</button><button type="button" class="primary" id="dNext">next</button></span></div>
  </div></div>
</div>

<script>
const D = ${data};
const $ = id => document.getElementById(id);
const store = { get(k, d) { try { return localStorage.getItem(k) || d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
const text = h => h.replace(/<[^>]+>/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').toLowerCase();
const names = Object.fromEntries(D.topics);
let active = new Set(), list = [];

/* color modes, same three as SkillQuest */
const THEMES = ['matrix', 'cyber', 'amber'];
function theme(t) { document.documentElement.dataset.theme = t; $('themeBtn').textContent = '◐ ' + t; store.set('deck-theme', t); }
$('themeBtn').onclick = () => theme(THEMES[(THEMES.indexOf(document.documentElement.dataset.theme) + 1) % 3]);
theme(store.get('deck-theme', 'matrix'));

/* code rain (from SkillQuest) */
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const rain = (function () {
  const cv = $('rain'), ctx = cv.getContext('2d');
  const glyphs = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEF<>/{}$#';
  let cols = [], fs = 16, on = false, last = 0, raf = null;
  function size() { cv.width = innerWidth; cv.height = innerHeight; cols = Array(Math.ceil(cv.width / fs)).fill(0).map(() => Math.random() * -60); }
  function frame(ts) {
    raf = requestAnimationFrame(frame);
    if (ts - last < 55) return; last = ts;
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#39ff88';
    ctx.font = fs + 'px monospace';
    cols.forEach((y, i) => { ctx.fillText(glyphs[Math.floor(Math.random() * glyphs.length)], i * fs, y * fs); cols[i] = (y * fs > cv.height && Math.random() > 0.975) ? 0 : y + 1; });
  }
  addEventListener('resize', () => on && size());
  return {
    set(v) { on = v; $('rainBtn').style.opacity = v ? 1 : .5;
      if (v && !raf) { size(); raf = requestAnimationFrame(frame); }
      if (!v && raf) { cancelAnimationFrame(raf); raf = null; ctx.clearRect(0, 0, cv.width, cv.height); } },
    get on() { return on; }
  };
})();
rain.set(!calm && store.get('deck-rain', 'on') === 'on');
$('rainBtn').onclick = () => { rain.set(!rain.on); store.set('deck-rain', rain.on ? 'on' : 'off'); };

/* study guide + topic chips */
D.cards.forEach(c => c.s = text(c.f + ' ' + c.b));
D.guide.forEach(g => {
  const li = document.createElement('li'), b = document.createElement('button');
  li.className = 'card'; li.dataset.g = g.slice().sort().join(',');
  b.type = 'button';
  b.innerHTML = g.map(t => names[t]).join(' + ') + '<small>' + D.cards.filter(c => g.includes(c.t)).length + ' cards</small>';
  b.onclick = () => { active = new Set(li.dataset.on === 'true' ? [] : g); sync(); };
  li.append(b); $('guide').append(li);
});
D.topics.forEach(([t, n]) => {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'chip'; b.dataset.t = t;
  b.textContent = n + ' ' + D.cards.filter(c => c.t === t).length;
  b.onclick = () => { active.has(t) ? active.delete(t) : active.add(t); sync(); };
  $('chips').append(b);
});

function sync() {
  document.querySelectorAll('.chip').forEach(b => b.setAttribute('aria-pressed', active.has(b.dataset.t)));
  const key = [...active].sort().join(',');
  document.querySelectorAll('.guide li').forEach(li => li.dataset.on = key !== '' && li.dataset.g === key);
  render();
}
function render() {
  const q = $('q').value.trim().toLowerCase(), all = $('reveal').checked;
  list = D.cards.filter(c => (!active.size || active.has(c.t)) && (!q || q.split(/\\s+/).every(w => c.s.includes(w))));
  $('grid').replaceChildren(...list.map(c => {
    const el = document.createElement('article'); el.className = 'card';
    const btn = document.createElement('button'); btn.className = 'face'; btn.setAttribute('aria-expanded', all);
    btn.innerHTML = '<div class="tag">' + names[c.t] + '</div><div class="f">' + c.f + '</div>' + (all ? '' : '<div class="hint">click to reveal</div>');
    const back = document.createElement('div'); back.className = 'b'; back.innerHTML = c.b; back.hidden = !all;
    btn.onclick = () => { back.hidden = !back.hidden; btn.setAttribute('aria-expanded', !back.hidden); const h = btn.querySelector('.hint'); if (h) h.hidden = !back.hidden; };
    el.append(btn, back); return el;
  }));
  $('count').textContent = '> ' + list.length + ' of ' + D.cards.length + ' cards';
  $('empty').hidden = list.length > 0;
  $('drillBtn').disabled = !list.length;
}

/* drill: one card at a time, shuffled from the current filter */
let deck = [], pos = 0, flipped = false;
function show() {
  const c = deck[pos];
  $('dPos').textContent = 'card ' + (pos + 1) + ' / ' + deck.length;
  $('dTag').textContent = names[c.t];
  $('dFlash').className = 'flash' + (flipped ? ' back' : '');
  $('dFlash').innerHTML = flipped ? '<div>' + c.b + '</div>' : '<div class="f">' + c.f + '</div><div class="hint">space to flip</div>';
}
function flip() { flipped = !flipped; show(); }
function next() { pos = (pos + 1) % deck.length; flipped = false; show(); }
function closeDrill() { $('drill').hidden = true; $('drillBtn').focus(); }
$('drillBtn').onclick = () => {
  deck = list.slice(); for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  pos = 0; flipped = false; $('drill').hidden = false; show(); $('dFlash').focus();
};
$('dFlash').onclick = flip; $('dFlip').onclick = flip; $('dNext').onclick = next; $('dClose').onclick = closeDrill;
$('drill').onclick = e => { if (e.target === $('drill')) closeDrill(); };
addEventListener('keydown', e => {
  if ($('drill').hidden) return;
  if (e.key === ' ') { e.preventDefault(); flip(); } else if (e.key === 'ArrowRight') next(); else if (e.key === 'Escape') closeDrill();
});

$('q').oninput = render;
$('reveal').onchange = render;
$('ps').onchange = () => document.body.classList.toggle('show-ps', $('ps').checked);
document.body.classList.add('show-ps');
render();
</script>
</body>
</html>
`;

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log('Exported ' + cards.length + ' Linux cards in ' + used.length + ' topics to ' + out);
