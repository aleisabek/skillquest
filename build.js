// Builds SkillQuest into one offline HTML file.
//   node build.js            -> dist/SkillQuest.html
//   node build.js --install  -> also copies it to Documents\Job Search (where the Desktop shortcut points)
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'src');
const OUT = path.join(__dirname, 'dist', 'SkillQuest.html');
const INSTALL = process.env.SKILLQUEST_INSTALL || 'C:/Users/User/Documents/Job Search/SkillQuest.html';

// Script order matters: content first, then lessons, then generators, then the app.
const lessonDir = path.join(SRC, 'lessons');
const lessons = fs.existsSync(lessonDir) ? fs.readdirSync(lessonDir).filter(f => f.endsWith('.js')).sort().map(f => 'lessons/' + f) : [];
const ORDER = ['content.js', ...lessons, 'generators.js', 'app.js'];

const read = f => fs.readFileSync(path.join(SRC, f), 'utf8');
const js = ORDER.map(read).join('');
const html = read('shell.html').replace('{{STYLE}}', () => read('styles.css')).replace('{{SCRIPT}}', () => js);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, html);
console.log('built', path.relative(__dirname, OUT), (html.length / 1024).toFixed(0) + ' KB from', ORDER.join(', '));

if (process.argv.includes('--install')) {
  fs.copyFileSync(OUT, INSTALL);
  console.log('installed to', INSTALL);
}
