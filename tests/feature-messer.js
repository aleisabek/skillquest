// Professor Messer links: the saved list matches his course page (121 videos, 15 h 11 min), every Security+ lesson has
// matching videos or says why not, every SY0-801 objective is listed with each of his videos placed exactly once, and
// the videos are only ever linked (opened on his site), never embedded or copied.
const fs = require('fs');
const js = fs.readFileSync(__dirname + '/.tmp/script.js', 'utf8');
const src = fs.readFileSync(__dirname + '/../src/messer.js', 'utf8');
const line = name => { const i = js.indexOf('function ' + name + '('); return js.slice(i, js.indexOf('\n', i)); };
eval(js.split('/* ===================== STATE')[0] + ';' + line('shuffle') + ';' + line('esc') +
  ';global.M = {MESSER_VIDEOS, MESSER_FOR, MESSER_801, MESSER_BASE, messerVideo, messerFor, messerLessonHTML, OBJECTIVES, sec: genSkills("sec").map(([sk]) => sk)};');
let bad = 0; const fail = (...a) => { bad++; if (bad < 25) console.log('FAIL', ...a); };

/* 1. the list itself */
const V = M.MESSER_VIDEOS;
if (V.length !== 121) fail('his course page lists 121 videos; the list has', V.length);
const secs = V.reduce((a, v) => { const [m, s] = v[2].split(':').map(Number); return a + m * 60 + s; }, 0);
if (Math.floor(secs / 60) !== 15 * 60 + 11) fail('total length should be 15 h 11 min (his page); the list adds up to', Math.floor(secs / 3600) + ' h ' + Math.floor(secs / 60) % 60 + ' min');
const pages = V.map(v => v[3]);
if (new Set(pages).size !== pages.length) fail('a video page is listed twice');
V.slice(1).forEach(v => { if (!/^[a-z0-9-]+-sy0-701\/$/.test(v[3])) fail('odd page address:', v[3]); if (!/^[1-5]\.\d$/.test(v[0])) fail('odd objective:', v[0], v[1]); });
const keys = new Set(V.map(v => v[3].replace(/-sy0-701\/$/, '').replace(/\/$/, '')));
const known = k => { if (!keys.has(k) || !M.messerVideo(k)) fail('unknown video key:', k); };

/* 2. every Security+ lesson: videos, or a reason there are none */
for (const sk of M.sec) {
  const m = M.MESSER_FOR[sk];
  if (m === undefined) { fail('Security+ lesson has no Messer entry:', sk); continue; }
  if (Array.isArray(m)) { if (!m.length || m.length > 3) fail(sk, 'should link 1 to 3 videos'); m.forEach(known); }
  else if (typeof m !== 'string' || m.length < 30) fail(sk, 'has no videos and needs a short reason why');
  const html = M.messerLessonHTML('quiz:sec:' + sk);
  if (!/SY0-701/.test(html)) fail(sk, 'lesson box must say the videos are for SY0-701');
}
for (const sk of Object.keys(M.MESSER_FOR)) if (!M.sec.includes(sk)) fail('Messer entry for a lesson that does not exist:', sk);
if (M.messerFor('quiz:net:Subnetting').videos.length) fail('non-Security+ lessons should get no Security+ videos');

/* 3. every SY0-801 objective, every video (except the intro) placed exactly once */
const objs = Object.keys(M.OBJECTIVES['SY0-801'].o).sort(), listed = Object.keys(M.MESSER_801).sort();
if (JSON.stringify(objs) !== JSON.stringify(listed)) fail('the by-objective list should have exactly the SY0-801 objectives:', listed.join(' '));
const placed = Object.values(M.MESSER_801).filter(Array.isArray).flat();
placed.forEach(known);
const count = {}; placed.forEach(k => count[k] = (count[k] || 0) + 1);
for (const k of keys) if (k !== 'how-to-pass-your-sy0-701-security-exam' && count[k] !== 1) fail('video placed', count[k] || 0, 'times in the by-objective list:', k);

/* 4. linked, never embedded */
if (/<iframe|<video|<embed|youtube\.com\/embed/i.test(src)) fail('messer.js must only link to his site, never embed');
const sample = M.messerLessonHTML('quiz:sec:Firewalls');
if (!/target="_blank" rel="noopener noreferrer"/.test(sample) || !sample.includes(M.MESSER_BASE)) fail('lesson links must open his site in a new tab');

console.log('messer videos', V.length, '| lessons', M.sec.length, '| objectives', listed.length, '| problems', bad);
process.exit(bad ? 1 : 0);
