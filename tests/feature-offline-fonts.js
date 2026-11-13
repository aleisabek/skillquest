// The built file loads nothing from outside: fonts are embedded as data: URLs (no Google Fonts call when online),
// and the stylesheet has no @import or url() pointing at another site.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'dist', 'SkillQuest.html'), 'utf8');
const style = (html.match(/<style[^>]*>([\s\S]*?)<\/style>/g) || []).join('\n');
let bad = 0; const expect = (ok, what)=>{ if(!ok){ bad++; console.log('FAIL', what); } };

expect(!/fonts\.(googleapis|gstatic)\.com/.test(html), 'no Google Fonts address anywhere in the built file');
expect(!/@import/.test(style), 'the stylesheet has no @import');
const urls = [...style.matchAll(/url\(\s*['"]?([^'")]+)/g)].map(m => m[1]);
const outside = urls.filter(u => !u.startsWith('data:') && !u.startsWith('#'));
expect(!outside.length, 'every url() in the stylesheet is embedded: ' + outside.slice(0, 3).join(', '));
for (const [fam, file] of [['Inter', 'inter'], ['JetBrains Mono', 'jetbrains-mono'], ['Space Grotesk', 'space-grotesk'], ['VT323', 'vt323']]) {
  expect(new RegExp("@font-face\\{font-family:'" + fam + "'[^}]*url\\(data:font/woff2;base64,d09GM").test(style), fam + ' is embedded as a woff2 data: URL');
  expect(fs.existsSync(path.join(root, 'src', 'fonts', file + '.woff2')), fam + ' font file is in src/fonts');
}
const lic = fs.readdirSync(path.join(root, 'src', 'fonts')).filter(f => /^OFL-.*\.txt$/.test(f));
expect(lic.length === 4, 'each embedded font has its OFL license file in src/fonts');

console.log(bad ? bad + ' failure(s)' : 'offline fonts: ' + urls.length + ' embedded url(s), nothing loaded from outside');
process.exit(bad ? 1 : 0);
