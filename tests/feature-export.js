// Checks the public Linux deck export (tools/export-deck.js): every Linux card, a script that parses, the logo, and nothing personal.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');
const out = path.join(__dirname, '.tmp', 'public', 'index.html');
execFileSync(process.execPath, [path.join(__dirname, '..', 'tools', 'export-deck.js'), '--out', out]);
const html = fs.readFileSync(out, 'utf8');
const js = fs.readFileSync(__dirname + '/.tmp/script.js', 'utf8');
eval(js.split('/* ===================== STATE')[0] + ';global.T={CARDS,SCEN}');
let bad = 0; const fail = (...a) => { bad++; console.log('FAIL', ...a); };

const scripts = html.match(/<script>[\s\S]*?<\/script>/g) || [];
if (scripts.length !== 1) fail('expected one inline script, found', scripts.length);
const code = scripts[0].slice(8, -9);
try { new vm.Script(code); } catch (e) { fail('page script does not parse:', e.message); }
const D = vm.runInNewContext(code.slice(0, code.indexOf('\n', code.indexOf('const D ='))) + ';D');
const linux = T.CARDS.filter(c => c[0] === 'linux');
if (D.cards.length !== linux.length) fail('exported', D.cards.length, 'cards, expected', linux.length);
D.cards.forEach((c, i) => { if (c.f !== linux[i][2] || c.b !== linux[i][3]) fail('card', i, 'differs from SkillQuest'); });
/* only Linux cards are public: no job applications, interview stories or other tracks */
/* the blocklist is built from the app's own data, so a newly added employer or ticket job is covered automatically */
/* employers come from the example roles and, on a machine that has it, the private job list (both are in the built script) */
const employers = [...js.matchAll(/\{name:'((?:[^'\\]|\\.)*?) · /g)].map(m => m[1].replace(/\\'/g, "'")).filter(n => !/^(Future goal|Path goal)$/.test(n));
const blocked = [...new Set([...employers, ...T.SCEN.map(s => s.job), 'Applied ', 'interview', 'skillquest-v1', 'Sabek Carriers'])];
if (employers.length < 3) fail('could not read the employer names from JOBS (found ' + employers.length + ')');
for (const w of blocked) if (html.toLowerCase().includes(w.toLowerCase())) fail('public page mentions', w);
if (!html.includes('rel="icon" href="logo.svg"') || !html.includes('src="logo.svg"')) fail('logo.svg should be the tab icon and the header mark');
/* re-exporting unchanged cards must give a byte-identical page, so publishing never makes empty commits */
execFileSync(process.execPath, [path.join(__dirname, '..', 'tools', 'export-deck.js'), '--out', out]);
if (fs.readFileSync(out, 'utf8') !== html) fail('a second export of the same cards changed the page');

console.log('export', D.cards.length, 'cards,', (html.length / 1024).toFixed(0), 'KB | problems', bad);
process.exitCode = bad ? 1 : 0;
