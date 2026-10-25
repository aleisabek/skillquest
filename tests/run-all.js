// npm test: builds the app, then runs every check against the built file.
const { execFileSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
execFileSync(process.execPath, [path.join(root, 'build.js')], { stdio: 'inherit' });

// Pull the script out of the built page and make sure it parses.
const html = fs.readFileSync(path.join(root, 'dist', 'SkillQuest.html'), 'utf8');
const js = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));
fs.mkdirSync(path.join(__dirname, '.tmp'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '.tmp', 'script.js'), js);
new vm.Script(js);
console.log('✔ syntax OK');

const runs = [
  ['content', process.execPath, ['content-check.js']],
  ['quiz generators', process.execPath, ['quiz-generators.js']],
  ['terminal + SQL generators', process.execPath, ['terminal-sql-generators.js']],
  ['SQL answers vs real SQLite', 'python', ['sqlite_check.py']]
];
for (const f of fs.readdirSync(__dirname).filter(f => /^feature-.*\.js$/.test(f)).sort()) runs.push([f.replace(/\.js$/, ''), process.execPath, [f]]);

let failed = 0;
for (const [name, cmd, args] of runs) {
  const r = spawnSync(cmd, args, { cwd: __dirname, encoding: 'utf8' });
  const out = ((r.stdout || '') + (r.stderr || '')).trim();
  if (r.error && name.includes('SQLite')) { console.log('– skipped', name, '(Python not found)'); continue; }
  const ok = r.status === 0;
  if (!ok) failed++;
  console.log((ok ? '✔ ' : '✘ ') + name + '\n   ' + out.split('\n').slice(-3).join('\n   '));
}
console.log(failed ? `\n${failed} check(s) FAILED` : '\nAll checks passed');
process.exitCode = failed ? 1 : 0;
