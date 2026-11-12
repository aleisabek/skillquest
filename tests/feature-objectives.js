// CompTIA objective tags: every generator's {obj} names an objective that is in OBJECTIVES (checked against CompTIA's own
// documents), every listed objective has questions, the practice exams pick tagged questions into the right domain, and the
// scenario tables never offer two defensible answers (an answer's "not" list never appears beside it).
const fs = require('fs');
const js = fs.readFileSync(__dirname + '/.tmp/script.js', 'utf8');
const line = n => { const i = js.indexOf('function ' + n + '('); return js.slice(i, js.indexOf('\n', i)); };
const grab = n => { const i = js.indexOf('function ' + n + '('); return js.slice(i, js.indexOf('\n}', i) + 2); };
const dayStr = () => '2026-11-04', save = () => {}, toast = () => {}, quizId = i => 'q' + i;
let S = { mastery: {}, lessons: {}, quiz: {}, miss: {}, journal: [] };
eval(js.split('/* ===================== STATE')[0] + ';' + line('shuffle') + ';' + line('esc') + ';' + grab('tableHTML') +
  ';global.T = {GEN, OBJECTIVES, OBJECTIVE_TERMS, CERTS, buildExam, domCovered, domThin, genFor, LESSONS,' +
  'TABLES: {GOV_DOCS:[GOV_DOCS, GOV_ALL], DATA_ROLES:[DATA_ROLES, ROLE_ALL], CUSTODY:[CUSTODY, ROLE_ALL], TREAT:[TREAT, TREAT_ALL], RISK_TERMS:[RISK_TERMS, RISK_TERMS_ALL],' +
  'RECOVERY:[RECOVERY, RECOVERY_ALL], AGREE:[AGREE, AGREE_ALL], VENDOR:[VENDOR, VENDOR_ALL], CONSEQ:[CONSEQ, CONSEQ_ALL], AUDIT:[AUDIT, AUDIT_ALL], PENTEST:[PENTEST, PENTEST_ALL],' +
  'NET_ATK:[NET_ATK, NET_ATK_ALL], NET_DEF:[NET_DEF, NET_DEF_ALL], AAA:[AAA, AAA_ALL], REGS:[REGS, REGS_ALL],' +
  'ACTORS:[ACTORS, ACTORS_ALL], MOTIVES:[MOTIVES, MOTIVES_ALL], VECTORS:[VECTORS, VECTORS_ALL], VULNS:[VULNS, VULNS_ALL], INTEL:[INTEL, INTEL_ALL], IOC:[IOC, IOC_ALL], AI_T:[AI_T, AI_ALL], CHANGE_T:[CHANGE_T, CHANGE_ALL], ARCH_T:[ARCH_T, ARCH_ALL], ASSET_T:[ASSET_T, ASSET_ALL], AUTO_T:[AUTO_T, AUTO_ALL]}, AWARE,' +
  'DEFS:{ACTORS:[ACTORS, ACTORS_DEF], MOTIVES:[MOTIVES, MOTIVES_DEF], VECTORS:[VECTORS, VECTORS_DEF], VULNS:[VULNS, VULNS_DEF], INTEL:[INTEL, INTEL_DEF], IOC:[IOC, IOC_DEF], AI_T:[AI_T, AI_DEF], CHANGE_T:[CHANGE_T, CHANGE_DEF], ARCH_T:[ARCH_T, ARCH_DEF], ASSET_T:[ASSET_T, ASSET_DEF], AUTO_T:[AUTO_T, AUTO_DEF]}};');
let bad = 0; const fail = (...a) => { bad++; if (bad < 25) console.log('FAIL', ...a); };
const strip = s => String(s).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&');
const all = Object.keys(T.GEN).flatMap(tid => T.genFor(tid, 0).map(f => ({ f, tid })));
const tagged = all.filter(g => g.f.obj);

/* 1. every tag names a listed objective; every listed objective has at least one tagged generator */
const used = new Set();
for (const { f, tid } of tagged) for (const [code, list] of Object.entries(f.obj)) {
  if (!T.OBJECTIVES[code]) { fail('unknown exam code', code, 'on', tid, f.sk); continue; }
  if (!Array.isArray(list) || !list.length) fail('empty objective list', code, 'on', tid, f.sk);
  for (const o of list) { if (!T.OBJECTIVES[code].o[o]) fail('objective not in OBJECTIVES:', code, o, 'on', tid, f.sk); used.add(code + ' ' + o); }
}
for (const [code, e] of Object.entries(T.OBJECTIVES)) {
  if (!/document version \d/.test(e.doc)) fail(code, 'has no document version');
  for (const o of Object.keys(e.o)) if (!used.has(code + ' ' + o)) fail('listed objective has no questions:', code, o);
}
/* term level: every answer a scenario generator gives must be a term that each tagged objective (in that exam version)
   actually lists. Terms are compared word by word, ignoring plurals and -ing endings ("Mitigate" = "Mitigating"), and a
   term's abbreviation counts as the term ("SLA" for "Service-level agreement (SLA)"). Security awareness answers are
   actions, not terms, so they are checked by hand instead. */
for (const [code, objs] of Object.entries(T.OBJECTIVES)) for (const o of Object.keys(objs.o))
  if (!(T.OBJECTIVE_TERMS[code] || {})[o] || !T.OBJECTIVE_TERMS[code][o].length) fail('no term list for', code, o);
const STOP = new Set(['and', 'of', 'the', 'to', 'a', 'vs']);
const toks = s => (s.toLowerCase().match(/[a-z0-9+]+/g) || []).map(w => w.replace(/ies$/, 'y').replace(/s$/, '')).filter(w => !STOP.has(w));
const alts = term => term.split(/\/| vs\. /).flatMap(p => { const m = p.match(/^(.*?)\s*\(([^)]*)\)\s*(.*)$/); return m ? [(m[1] + ' ' + m[3]).trim(), (m[2] + ' ' + m[3]).trim()] : [p]; });
const pre = (a, b) => { let i = 0; while (i < a.length && a[i] === b[i]) i++; return i; };
const same = (a, b) => a === b || (pre(a, b) >= 5 && pre(a, b) >= Math.min(a.length, b.length) - 1);
const within = (A, B) => A.length > 0 && A.every(a => B.some(b => same(a, b)));
const isTerm = (label, term) => alts(term).some(t => { const Tt = toks(t), L = toks(label); return within(Tt, L) || within(L, Tt); });
let termChecked = 0;
for (const { f, tid } of tagged.filter(g => g.f.lookup && g.f.sk !== 'Security awareness')) {
  const answers = new Set(); for (let k = 0; k < 400; k++) { const q = f(); if (q) answers.add(strip(q.d[3][0])); }
  for (const [code, list] of Object.entries(f.obj)) {
    const terms = list.flatMap(o => (T.OBJECTIVE_TERMS[code] || {})[o] || []);
    for (const a of answers) { termChecked++; if (!terms.some(t => isTerm(a, t))) fail('answer is not a term of its tagged objective:', '"' + a + '"', code, list.join('+'), '(' + tid + ' ' + f.sk + ')'); }
  }
}

/* every tagged skill has a lesson (the lesson test checks its format) */
for (const { f, tid } of tagged) if (!T.LESSONS['quiz:' + tid + ':' + f.sk]) fail('tagged skill has no lesson', tid, f.sk);

/* 2. the gaps are filled: Security+ domain 5 and Network+ domain 4 are measured, with generated questions, not thin */
const cert = id => T.CERTS.find(c => c.id === id);
for (const [id, n] of [['secplus8', 5], ['secplus', 5], ['netplus', 4]]) {
  const d = cert(id).domains.find(x => x.n === n);
  if (!T.domCovered(d)) fail(id, 'domain', n, 'is still unmeasured');
  if (T.domThin(d)) fail(id, 'domain', n, 'is still thin');
  if (!(d.tagged || []).length) fail(id, 'domain', n, 'has no tagged generators');
}
/* a tagged generator joins exactly the domains its objectives belong to */
for (const c of T.CERTS) for (const d of c.domains) for (const g of d.tagged || [])
  if (!(g.f.obj[c.code] || []).some(o => +o.split('.')[0] === d.n)) fail('generator in the wrong domain', c.code, d.n, g.sk);
for (const { f } of tagged) for (const c of T.CERTS) for (const o of f.obj[c.code] || [])
  if (!c.domains.find(d => d.n === +o.split('.')[0]).tagged.some(g => g.f === f)) fail('tagged generator missing from its domain', c.code, o, f.sk);
/* the exams really serve them, credited to a real skill */
for (const [id, n] of [['secplus8', 5], ['secplus', 5], ['netplus', 4]]) for (let k = 0; k < 30; k++) {
  const items = T.buildExam(cert(id), 45), mine = items.filter(it => it.dom === n);
  if (!mine.length) { fail(id, 'exam has no domain', n, 'questions'); break; }
  for (const it of mine) if (!it.qi && it.qi !== 0 && !/^quiz:(sec|net):/.test(it.sid || '')) { fail(id, 'domain', n, 'item without a skill', it.sid); break; }
}

/* 3. scenario tables: answers are in the option list, "not" lists name real options, no repeated situations,
      and every answer still has 3 wrong options left once its "not" list is removed */
for (const [name, [rows, ALL]] of Object.entries(T.TABLES)) {
  const seen = new Set();
  for (const [s, a, not] of rows) {
    if (seen.has(s)) fail(name, 'repeats a situation:', s.slice(0, 60)); seen.add(s);
    if (!ALL.includes(a)) fail(name, 'answer not among the options:', a);
    for (const x of not || []) if (!ALL.includes(x)) fail(name, '"not" names something that is never offered:', x);
    if (ALL.filter(x => x !== a && !(not || []).includes(x)).length < 3) fail(name, 'too few safe wrong options for', a);
  }
}
/* SY0-801 domain 2 tables explain every option: each answer has a definition and its own reason, so the explanation can say
   what every wrong option on screen means */
for (const [name, [rows, DEF]] of Object.entries(T.DEFS)) {
  for (const [s, a, , why] of rows) if (!DEF[a] || !why || why.length < 15) fail(name, 'answer without a definition or a reason:', a);
  for (const k of Object.keys(DEF)) if (!T.TABLES[name][1].includes(k)) fail(name, 'definition for an option that is never offered:', k);
}
for (const [s, a, w] of T.AWARE) { if (w.length !== 3 || w.includes(a) || new Set(w).size !== 3) fail('AWARE options', s.slice(0, 50)); }
/* generated questions never put an answer's "not" list beside it */
const notOf = new Map(); for (const [rows] of Object.values(T.TABLES)) for (const [s, a, not] of rows) notOf.set(strip(s), new Set(not || []));
let sampled = 0;
for (const { f } of tagged.filter(g => g.f.lookup)) for (let k = 0; k < 2000; k++) {
  const q = f(); if (!q) continue; sampled++;
  const Q = strip(q.d[2]), opts = q.d[3].map(strip);
  if (opts.length !== 4 || new Set(opts).size !== 4) { fail('options', Q.slice(0, 60)); continue; }
  for (const [s, not] of notOf) if (Q.includes(s)) for (const o of opts.slice(1)) if (not.has(o)) fail('defensible second answer offered:', o, '|', s.slice(0, 60));
}
/* an independent list (not read from the tables, so deleting a "not" entry there is caught): [right answer, an option that
   would also be defensible beside it]. Plus options that must never be offered at all, because they overlap too much. */
const NEVER_BESIDE = [
  ['ARP poisoning (spoofing)', 'On-path attack'], ['DNS poisoning (spoofing)', 'On-path attack'], ['Rogue DHCP server', 'On-path attack'], ['Evil twin', 'On-path attack'],
  ['On-path attack', 'ARP poisoning (spoofing)'], ['On-path attack', 'DNS poisoning (spoofing)'], ['On-path attack', 'Evil twin'], ['On-path attack', 'Rogue DHCP server'],
  ['Rogue DHCP server', 'ARP poisoning (spoofing)'], ['Evil twin', 'Rogue access point (AP)'], ['Rogue access point (AP)', 'Evil twin'], ['Rogue access point (AP)', 'Rogue DHCP server'],
  ['External audit', 'Attestation'], ['Disable unused ports', 'Network segmentation'],
  ['Disable unused ports', 'Port security'], ['Disable unused ports', '802.1X'], ['Disable unused ports', 'MAC filtering'],
  ['802.1X', 'Port security'], ['802.1X', 'MAC filtering'], ['Port security', 'MAC filtering'], ['Port security', '802.1X'], ['MAC filtering', 'Port security'], ['MAC filtering', '802.1X'],
  ['Screened subnet', 'Network segmentation'], ['Screened subnet', 'ACL (access control list)'], ['Network segmentation', 'Screened subnet'], ['Network segmentation', 'ACL (access control list)'],
  ['ACL (access control list)', 'Network segmentation'], ['ACL (access control list)', 'Screened subnet']];
const NEVER_OFFERED = ['Sanctions', 'Content filtering', 'MOA (memorandum of agreement)', 'ARP spoofing', 'DNS spoofing'];
for (const { f } of tagged.filter(g => g.f.lookup)) for (let k = 0; k < 2000; k++) {
  const q = f(); if (!q) continue; const opts = q.d[3].map(strip);
  for (const [a, b] of NEVER_BESIDE) if (opts[0] === a && opts.includes(b)) fail('"' + b + '" offered beside the answer "' + a + '"');
  for (const x of NEVER_OFFERED) if (opts.includes(x)) fail('"' + x + '" should never be offered (it overlaps another option)');
}
console.log('tagged generators', tagged.length, '| objectives', used.size, '| answers checked against objective terms', termChecked, '| scenario questions sampled', sampled, '| problems', bad);
process.exitCode = bad ? 1 : 0;
