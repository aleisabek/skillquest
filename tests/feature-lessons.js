// Lessons: every lesson has the five core sections; lessons in the newer format (with "You'll see this as") also have
// a "Spot the problem" question and explain every acronym the first time; security lessons stay off trading topics.
const fs = require('fs');
const vm = require('vm');
const js = fs.readFileSync(__dirname + '/.tmp/script.js', 'utf8');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(js.split('/* ===================== STATE')[0].split('/* ===================== GENERATORS')[0] + ';globalThis.L = LESSONS;', ctx);
const L = ctx.L;
let bad = 0; const fail = (...a) => { bad++; console.log('FAIL', ...a); };
/* acronyms common enough to need no expansion */
/* (MITRE is an organization's name, not an acronym to expand) */
const COMMON = new Set(['IT', 'IP', 'IPv4', 'IPv6', 'MFA', 'SSH', 'VPN', 'HTTP', 'HTTPS', 'DNS', 'URL', 'API', 'SQL', 'NIST', 'HR', 'US', 'PDF', 'CEO', 'OK', 'PIN', 'USB', 'CPU', 'RAM', 'OS', 'ID', 'AM', 'PM', 'MITRE']);
const text = l => [l.why, l.idea, l.seen, l.example, l.prevent, l.detect, ...(l.mistakes || []), l.say, l.spot && l.spot.q, l.spot && l.spot.a].filter(Boolean).join(' ');
for (const [id, l] of Object.entries(L)) {
  for (const k of ['why', 'idea', 'example', 'say']) if (typeof l[k] !== 'string' || !l[k].trim()) fail(id, 'missing', k);
  if (!Array.isArray(l.mistakes) || !l.mistakes.length) fail(id, 'needs common mistakes');
  if (l.seen === undefined) continue;   /* the checks below apply to the newer lesson format */
  if (!l.spot || !l.spot.q || !l.spot.a) fail(id, 'has "You\'ll see this as" but no "Spot the problem" question');
  const t = text(l).replace(/<pre>[\s\S]*?<\/pre>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/ATT&(amp;)?CK/g, 'ATTCK').replace(/\s+/g, ' ');   /* snippets are real log text, not prose */
  const acrs = new Set((t.match(/\b[A-Z]{2,5}s?\b/g) || []).map(a => a.replace(/s$/, '')));
  for (const a of acrs) {
    if (COMMON.has(a) || /^\d/.test(a)) continue;
    /* the FIRST mention must be the explained one: "ACR (expansion)" or "expansion (ACR)" */
    const i = t.search(new RegExp('\\b' + a + 's?\\b'));
    if (!(t.startsWith(a + ' (', i) || t.startsWith(a + 's (', i) || t[i - 1] === '(')) fail(id, 'acronym not explained at first use:', a);
  }
}
for (const [id, l] of Object.entries(L)) if (id.startsWith('quiz:sec:') && /trading/i.test(text(l))) fail(id, 'security lesson mentions trading');
vm.runInContext('globalThis.SC = CARDS.filter(c => c[0] === "sec");', ctx);
ctx.SC.forEach(c => { if (/trading/i.test(c[2] + c[3])) fail('security card mentions trading:', c[2]); });
console.log('lessons', Object.keys(L).length, '| newer format', Object.values(L).filter(l => l.seen !== undefined).length, '| problems', bad);
process.exitCode = bad ? 1 : 0;
