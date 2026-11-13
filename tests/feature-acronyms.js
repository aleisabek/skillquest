// Acronym game: the deck is clean (unique, complete rows, no answer leaked in its own clue), and the answer checker is
// fair both ways: it accepts the variations a person really types and rejects near-miss wrong words.
// Also checks the deck against the lessons: wherever a lesson writes "ACR (words)" for a deck acronym, the words match.
const fs = require('fs'), path = require('path');
const src = p => fs.readFileSync(path.join(__dirname, '..', 'src', p), 'utf8');
eval(src('acronyms.js') + ';global.A = {ACRONYMS, ACR_801, ACR_GROUPS, acrMatch, acrMatchLetters, acrLookalikes, acrRound, acrConfusers};');
let bad = 0, checked = 0; const fail = (...a) => { bad++; if (bad < 30) console.log('FAIL', ...a); };
const byA = new Map(A.ACRONYMS.map(e => [e.a, e]));

/* 1. the deck */
if (byA.size !== A.ACRONYMS.length) fail('duplicate acronyms in the deck');
const keys = new Set();
for (const e of A.ACRONYMS) {
  const k = e.a.toLowerCase().replace(/[^a-z0-9+]/g, '');
  if (keys.has(k)) fail('two acronyms type the same:', e.a); keys.add(k);
  if (!e.w || !e.d || e.d.length < 15) fail('incomplete row', e.a);
  if (new RegExp('(^|[^A-Za-z])' + e.a.replace(/[+/]/g, '\\$&') + '([^A-Za-z]|$)').test(e.d)) fail('clue gives the answer away:', e.a, e.d);
  for (const f of [e.w, ...e.alt]) { checked++; if (!A.acrMatch(e, f).ok) fail('own wording not accepted:', e.a, f); }
  if (!A.acrMatchLetters(e, e.a) || !A.acrMatchLetters(e, e.a.toLowerCase())) fail('own letters not accepted:', e.a);
}
if (A.ACR_801.length < 100) fail('official list looks short:', A.ACR_801.length);
for (const g of A.ACR_GROUPS) for (const a of g) if (!byA.has(a)) fail('lookalike group names a missing acronym:', a);
for (let i = 0; i < 3000; i++) {
  const e = A.ACRONYMS[i % A.ACRONYMS.length], w = A.acrLookalikes(e, 3);
  if (w.length !== 3 || new Set(w).size !== 3 || w.includes(e)) { fail('bad wrong options for', e.a); break; }
}

/* 1b. learn-first rounds: n unique acronyms from the pool, lookalikes picked together and kept next to each other */
const official = A.ACRONYMS.filter(e => e.src === '801');
let families = 0;
for (let i = 0; i < 2000; i++) {
  const pool = i % 2 ? A.ACRONYMS : official, r = A.acrRound(pool, 10);
  if (r.length !== 10 || new Set(r).size !== 10 || r.some(e => !pool.includes(e))) { fail('bad learn round', r.map(e => e.a).join(' ')); break; }
  const mates = (x, y) => A.ACR_GROUPS.some(g => g.includes(x.a) && g.includes(y.a));
  for (let k = 0; k < r.length; k++) {
    const later = r.slice(k + 1).findIndex(y => mates(r[k], y));
    if (later === 0) families++;
  }
}
if (!families) fail('learn rounds never put lookalikes side by side');
{ const small = official.slice(0, 4), r = A.acrRound(small, 10);
  if (r.length !== 4 || new Set(r).size !== 4) fail('a pool smaller than a round should give each acronym once'); }
{ const ale = byA.get('ALE'), aro = byA.get('ARO'), c = A.acrConfusers(ale, [ale, aro], 2);
  if (c.length !== 2 || c[0] !== aro || c.includes(ale)) fail('"Don\'t mix up with" should list the lookalikes of ALE, the ones in the round first');
  for (const e of A.ACRONYMS) if (A.acrConfusers(e, [], 2).some(x => !x || x === e)) fail('bad lookalike list for', e.a); }

/* 2. the checker: [acronym, typed, should pass] */
const CASES = [
  ['MFA', 'multi-factor authentication', true], ['MFA', 'Multi Factor Authentication', true], ['MFA', 'multifactor authentification', false],
  ['SIEM', 'security information & event management', true], ['SIEM', 'Security Information Event Management', true],
  ['SIEM', 'security infomation and event management', true], ['SIEM', 'security information and event monitoring', false],
  ['SCAP', 'Security Content Automation Protocol', true], ['SCAP', 'Security Context Automation Protocol', false],
  ['CVE', 'common vulnerability and exposure', true], ['CVE', 'Common Vulnerabilities and Exposures.', true],
  ['RTO', 'recovery point objective', false], ['RPO', 'recovery point objective', true], ['RTO', 'recovery tiem objective', false],
  ['DKIM', 'domain keys identified mail', true], ['DMARC', 'domain based message authentication reporting and conformance', true],
  ['SAML', 'Security Assertions Markup Language', true], ['MTTR', 'mean time to recover', true], ['MTTR', 'mean time between failures', false],
  ['DoS', 'denial-of-service', true], ['DDoS', 'denial of service', false], ['CI/CD', 'continuous integration continuous delivery', true],
  ['TACACS+', 'terminal access controller access control system plus', true], ['TACACS+', 'terminal access controller access control system', false],
  ['IDS', 'intrusion prevention system', false], ['AAA', 'authentication authorization accounting', true],
  ['NDA', 'non disclosure agreement', true], ['SLA', 'service level agreements', true], ['SLA', 'service level objective', false],
  ['PKI', 'public key infrastucture', true], ['PKI', 'private key infrastructure', false], ['ALE', '', false], ['ALE', '   ', false]
];
for (const [a, typed, want] of CASES) {
  checked++;
  const e = byA.get(a); if (!e) { fail('test names a missing acronym', a); continue; }
  if (A.acrMatch(e, typed).ok !== want) fail(a, JSON.stringify(typed), want ? 'should be accepted' : 'should be rejected');
}
const LETTERS = [['CI/CD', 'cicd', true], ['CI/CD', 'CI CD', true], ['TACACS+', 'TACACS', false], ['TACACS+', 'tacacs+', true],
  ['gMSA', 'GMSA', true], ['DoS', 'DDoS', false], ['SaaS', '', false]];
for (const [a, typed, want] of LETTERS) { checked++; if (A.acrMatchLetters(byA.get(a), typed) !== want) fail(a, JSON.stringify(typed), 'letters', want ? 'should pass' : 'should fail'); }

/* 3. no other acronym's wording is accepted for an entry (two entries must not read as the same words) */
for (const e of A.ACRONYMS) for (const o of A.ACRONYMS) if (o !== e && A.acrMatch(e, o.w).ok) fail(o.w, 'is accepted for', e.a, 'as well as', o.a);

/* 4. lessons agree with the deck: "ACR (words)" for a deck acronym must be accepted by the checker */
let pairs = 0;
for (const f of fs.readdirSync(path.join(__dirname, '..', 'src', 'lessons'))) {
  const t = src('lessons/' + f).replace(/<[^>]+>/g, ' ');
  for (const m of t.matchAll(/\b([A-Za-z][A-Za-z0-9+/]{1,7})\s\(([a-z][a-z\- ,&/]{4,90})\)/gi)) {
    const e = byA.get(m[1]); if (!e) continue;
    const words = m[2].trim();
    /* only real expansions: the words' first letters spell the acronym (with or without small words like "of") */
    const parts = words.toLowerCase().split(/[\s\-\/,]+/).filter(Boolean), letters = m[1].toLowerCase().replace(/[^a-z0-9]/g, '');
    const init = ps => ps.map(p => p[0]).join('');
    if (init(parts) !== letters && init(parts.filter(p => !/^(of|the|a|an|for|to|and|as)$/.test(p))) !== letters) continue;
    pairs++;
    if (!A.acrMatch(e, words).ok) fail('lesson', f, 'says', m[1], '=', JSON.stringify(words), 'but the deck says', JSON.stringify(e.w));
  }
}
console.log('acronyms', A.ACRONYMS.length, '| official', A.ACR_801.length, '| checker cases', checked, '| lesson pairs', pairs, '| problems', bad);
process.exit(bad ? 1 : 0);
