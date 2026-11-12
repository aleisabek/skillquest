// One-command release: npm run install-app (or npm run release)
//   1. runs every check (npm test) and stops if anything fails
//   2. keeps the previous installed copy as SkillQuest.prev.html, then installs the new build
//   3. regenerates the public Linux deck; if it changed, shows the diff and asks before committing and pushing that repo
// Options: --yes publishes the deck without asking; --no-deck skips step 3.
// Paths: SKILLQUEST_INSTALL (installed app) and DECK_DIR (flashcards repo) override the defaults.
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const INSTALL = process.env.SKILLQUEST_INSTALL || path.join(require('os').homedir(), 'Documents', 'Job Search', 'SkillQuest.html');
const DECK_DIR = process.env.DECK_DIR || path.join(require('os').homedir(), 'Documents', 'Linux-Cheat-sheet');
const args = process.argv.slice(2);
const step = msg => console.log('\n== ' + msg);
const run = (cmd, a, opts) => spawnSync(cmd, a, Object.assign({ cwd: root, encoding: 'utf8' }, opts));
const git = (...a) => run('git', ['-C', DECK_DIR, ...a]);
const ask = q => new Promise(res => { const rl = readline.createInterface({ input: process.stdin, output: process.stdout }); rl.question(q, a => { rl.close(); res(a.trim().toLowerCase()); }); });

(async () => {
  step('Checks');
  const t = run(process.execPath, [path.join(root, 'tests', 'run-all.js')], { stdio: 'inherit' });
  if (t.status !== 0) { console.log('\nRelease stopped: fix the failing checks first. Nothing was installed.'); process.exit(1); }

  step('Install');
  if (fs.existsSync(INSTALL)) fs.copyFileSync(INSTALL, INSTALL.replace(/\.html$/, '.prev.html'));
  fs.copyFileSync(path.join(root, 'dist', 'SkillQuest.html'), INSTALL);
  console.log('installed to', INSTALL, '(previous copy kept as', path.basename(INSTALL.replace(/\.html$/, '.prev.html')) + ')');

  if (!args.includes('--no-deck')) {
    step('Public deck');
    if (!fs.existsSync(path.join(DECK_DIR, '.git'))) console.log('skipped: no git repo at', DECK_DIR);
    else {
      const e = run(process.execPath, [path.join(__dirname, 'export-deck.js'), '--out', path.join(DECK_DIR, 'index.html')], { stdio: 'inherit' });
      if (e.status !== 0) { console.log('Deck export failed; the app was still installed.'); process.exit(1); }
      // content diff, not `git status`: on Windows a rewrite with different line endings shows as modified with no real change
      const changed = git('diff', '--quiet', '--', 'index.html', 'logo.svg').status !== 0;
      if (!changed) console.log('deck unchanged: nothing to publish');
      else {
        console.log(git('diff', '--stat', '--', 'index.html', 'logo.svg').stdout);
        const yes = args.includes('--yes') || (process.stdin.isTTY && (await ask('Publish the deck (commit + push to GitHub Pages)? [y/N] ')) === 'y');
        if (!yes) console.log('not published. The new page is in ' + DECK_DIR + '; run again in a terminal (or with --yes) to publish.');
        else {
          git('add', '--', 'index.html', 'logo.svg');
          const c = git('commit', '-m', 'Update the deck from SkillQuest');
          const p = c.status === 0 ? git('push') : c;
          console.log(p.status === 0 ? 'published: it goes live on GitHub Pages in a minute or two' : 'publish failed:\n' + (p.stderr || p.stdout));
        }
      }
    }
  }
})();
