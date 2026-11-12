// Builds SkillQuest into one offline HTML file.
//   node build.js            -> dist/SkillQuest.html
//   node build.js --install  -> also copies it to Documents\Job Search (where the Desktop shortcut points)
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'src');
const OUT = path.join(__dirname, 'dist', 'SkillQuest.html');
const INSTALL = process.env.SKILLQUEST_INSTALL || path.join(require('os').homedir(), 'Documents', 'Job Search', 'SkillQuest.html');

// Script order matters: content, lessons, generators, the learning engine, then the app.
const lessonDir = path.join(SRC, 'lessons');
const lessons = fs.existsSync(lessonDir) ? fs.readdirSync(lessonDir).filter(f => f.endsWith('.js')).sort().map(f => 'lessons/' + f) : [];
// private.js (gitignored) holds the real job list; it's included only on the machine that has it
const priv = fs.existsSync(path.join(SRC, 'private.js')) ? ['private.js'] : [];
const ORDER = ['content.js', 'acronyms.js', ...lessons, 'generators.js', 'scenes.js', 'learning.js', 'journal.js', 'exam.js', 'pbq.js', 'labs.js', 'pilot.js', 'practice.js', 'recorder.js', ...priv, 'app.js'];

const read = f => fs.readFileSync(path.join(SRC, f), 'utf8');
const page = order => read('shell.html').replace('{{STYLE}}', () => read('styles.css')).replace('{{SCRIPT}}', () => order.map(read).join(''));
const html = page(ORDER);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, html);
console.log('built', path.relative(__dirname, OUT), (html.length / 1024).toFixed(0) + ' KB from', ORDER.join(', '));

// Phone version (retired 2026-11-12, built only with --phone): the artifact-viewer shape, PHONE = true, no private.js.
// Kept as code because its private-content guard is the starting point for the later public build.
const PHONE_OUT = path.join(__dirname, 'dist', 'SkillQuest-phone.html');
if (process.argv.includes('--phone')) {
  /* the phone build is shared through claude.ai, so it never carries the private job list (example roles stand in) */
  const phone = page(ORDER.filter(f => f !== 'private.js'));
  if (/function privateJobs\b/.test(phone)) throw new Error('private job list found in the phone build');
  const title = phone.match(/<title>[\s\S]*?<\/title>/)[0];
  const style = phone.match(/<style>[\s\S]*?<\/style>/)[0];
  const body = phone.slice(phone.indexOf('<body>') + 6, phone.lastIndexOf('</body>'));
  if (!body.includes('const PHONE = false;')) throw new Error('PHONE flag not found in app.js');
  fs.writeFileSync(PHONE_OUT, title + '\n' + style + '\n' + body.replace('const PHONE = false;', 'const PHONE = true;'));
  console.log('built', path.relative(__dirname, PHONE_OUT), '(phone version)');
}

if (process.argv.includes('--install')) {
  fs.copyFileSync(OUT, INSTALL);
  console.log('installed to', INSTALL);
}
