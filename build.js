// Builds SkillQuest into one offline HTML file.
//   node build.js            -> dist/SkillQuest.html
//   node build.js --install  -> also copies it to Documents\Job Search (where the Desktop shortcut points)
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'src');
const OUT = path.join(__dirname, 'dist', 'SkillQuest.html');
const INSTALL = process.env.SKILLQUEST_INSTALL || 'C:/Users/User/Documents/Job Search/SkillQuest.html';

// Script order matters: content, lessons, generators, the learning engine, then the app.
const lessonDir = path.join(SRC, 'lessons');
const lessons = fs.existsSync(lessonDir) ? fs.readdirSync(lessonDir).filter(f => f.endsWith('.js')).sort().map(f => 'lessons/' + f) : [];
// private.js (gitignored) holds the real job list; it's included only on the machine that has it
const priv = fs.existsSync(path.join(SRC, 'private.js')) ? ['private.js'] : [];
const ORDER = ['content.js', ...lessons, 'generators.js', 'scenes.js', 'learning.js', 'journal.js', 'exam.js', 'labs.js', 'practice.js', 'recorder.js', ...priv, 'app.js'];

const read = f => fs.readFileSync(path.join(SRC, f), 'utf8');
const js = ORDER.map(read).join('');
const html = read('shell.html').replace('{{STYLE}}', () => read('styles.css')).replace('{{SCRIPT}}', () => js);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, html);
console.log('built', path.relative(__dirname, OUT), (html.length / 1024).toFixed(0) + ' KB from', ORDER.join(', '));

// Phone version: published as a private claude.ai artifact. The artifact viewer supplies its own
// <html>/<head>/<body>, so the file holds just the title, styles and page content, with PHONE = true.
const PHONE_OUT = path.join(__dirname, 'dist', 'SkillQuest-phone.html');
{
  const title = html.match(/<title>[\s\S]*?<\/title>/)[0];
  const style = html.match(/<style>[\s\S]*?<\/style>/)[0];
  const body = html.slice(html.indexOf('<body>') + 6, html.lastIndexOf('</body>'));
  if (!body.includes('const PHONE = false;')) throw new Error('PHONE flag not found in app.js');
  fs.writeFileSync(PHONE_OUT, title + '\n' + style + '\n' + body.replace('const PHONE = false;', 'const PHONE = true;'));
  console.log('built', path.relative(__dirname, PHONE_OUT), '(phone version)');
}

if (process.argv.includes('--install')) {
  fs.copyFileSync(OUT, INSTALL);
  console.log('installed to', INSTALL);
}
