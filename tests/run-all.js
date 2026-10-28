// npm test: builds the app, then runs every check against the built file.
const { execFileSync, spawn } = require('child_process');
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

// Checks run in parallel; results print in the order above. The SQLite check reads the cases the
// terminal + SQL generator check writes, so it waits for that one.
const run = ([name, cmd, args]) => new Promise(done => {
  let out = '';
  const p = spawn(cmd, args, { cwd: __dirname });
  p.stdout.on('data', d => out += d); p.stderr.on('data', d => out += d);
  p.on('error', error => done({ name, error, out }));
  p.on('close', status => done({ name, status, out }));
});
const sqlGen = runs.find(r => r[0].startsWith('terminal')), sqlite = runs.find(r => r[0].includes('SQLite'));
const jobs = new Map(runs.filter(r => r !== sqlGen && r !== sqlite).map(r => [r, run(r)]));
const chained = run(sqlGen);
jobs.set(sqlGen, chained);
jobs.set(sqlite, chained.then(() => run(sqlite)));

(async () => {
  let failed = 0;
  for (const r of runs) {
    const { name, status, error, out } = await jobs.get(r);
    if (error && name.includes('SQLite')) { console.log('– skipped', name, '(Python not found)'); continue; }
    const ok = !error && status === 0;
    if (!ok) failed++;
    console.log((ok ? '✔ ' : '✘ ') + name + '\n   ' + (out || String(error || '')).trim().split('\n').slice(-3).join('\n   '));
  }
  console.log(failed ? `\n${failed} check(s) FAILED` : '\nAll checks passed');
  process.exitCode = failed ? 1 : 0;
})();
