// Offensive Security stays conceptual and defensive: no payload strings, no attack-tool commands, no step-by-step
// attack phrasing anywhere in its lessons, cards, quiz, ticket or generated exercises. Every vulnerability-class lesson
// also teaches how to prevent and how to detect it.
const js = require('fs').readFileSync(__dirname + '/.tmp/script.js', 'utf8');
const line = name => { const i = js.indexOf('function ' + name + '('); return js.slice(i, js.indexOf('\n', i)); };
const grab = name => { const i = js.indexOf('function ' + name + '('); return js.slice(i, js.indexOf('\n}', i) + 2); };
eval(js.split('/* ===================== STATE')[0] + ';' + line('shuffle') + ';' + line('esc') + ';' + grab('tableHTML') + ';global.T={LESSONS,CARDS,QUIZ,SCEN,GEN,TRACKS,PRACTICE,STAGES,OWASP_CASES,OWASP_ALL,TACTICS,TACTIC_ALL,SCOPE_ACTS,ENGAGE,INJ_FIX,PW_DEF,REPORT_PARTS}');
let bad = 0; const fail = (...a) => { bad++; if (bad < 20) console.log('FAIL', ...a); };
const BANNED = [
  // payload strings
  [/'\s*or\s*'?1'?\s*=\s*'?1/i, 'SQL injection payload'], [/\bunion\s+(all\s+)?select\b/i, 'UNION SELECT payload'], [/\bdrop\s+table\b/i, 'DROP TABLE payload'],
  [/<script\b|&lt;script/i, 'script tag'], [/\bon(error|load)\s*=/i, 'event-handler payload'], [/javascript:/i, 'javascript: URL'],
  [/\.\.\/\.\.\//, 'path traversal string'], [/\$\{jndi:/i, 'JNDI lookup string'], [/\/etc\/(passwd|shadow)/, 'sensitive file path'],
  [/;\s*(rm|cat|wget|curl|nc)\s/i, 'chained shell command'], [/\b(sleep|benchmark)\s*\(\s*\d/i, 'timing payload'], [/\bxp_cmdshell\b/i, 'xp_cmdshell'],
  // attack tools and their invocations
  [/\b(nmap|sqlmap|hydra|hashcat|medusa|msfconsole|msfvenom|metasploit|mimikatz|crackmapexec|netexec|gobuster|ffuf|nikto|impacket|responder\.py)\b/i, 'attack tool name'],
  [/\bjohn( the ripper|\s+-)/i, 'password cracker'], [/\bnc\s+-[a-z]*e\b|\/dev\/tcp\/|\bbash\s+-i\b/i, 'reverse shell'], [/powershell(\.exe)?\s+-(enc|e|nop|w)\b/i, 'encoded PowerShell'],
  // step-by-step attack phrasing
  [/\bstep\s*\d+\s*[:.)]\s*(exploit|inject|crack|dump|bypass|escalate)/i, 'numbered attack steps'], [/\bhow to (exploit|hack|crack|bypass|break into)\b/i, 'how-to attack phrasing'],
  [/\b(payload|exploit code|shellcode)\s*:/i, 'payload listing'], [/\brun (this|the following) (command|script|code)\b/i, 'run-this instruction']
];
const hits = text => BANNED.filter(([re]) => re.test(text)).map(([, what]) => what);
const scan = (where, text) => { for (const what of hits(text)) fail(where, '→', what + ':', text.replace(/\s+/g, ' ').slice(0, 120)); };
let pieces = 0;
const lessons = Object.entries(T.LESSONS).filter(([id]) => id.startsWith('quiz:offsec:'));
if (lessons.length < 7) fail('expected at least 7 Offensive Security lessons, found', lessons.length);
for (const [id, l] of lessons) { pieces++; scan(id, JSON.stringify(l)); }
T.CARDS.filter(c => c[0] === 'offsec').forEach(c => { pieces++; scan('card ' + c[2], c[2] + ' ' + c[3]); });
T.QUIZ.filter(q => q[0] === 'offsec').forEach(q => { pieces++; scan('quiz ' + q[2].slice(0, 40), JSON.stringify(q)); });
T.SCEN.filter(s => s.id === 'scope').forEach(s => { pieces++; scan('ticket ' + s.id, JSON.stringify(s)); });
for (const lv of [1, 2]) (T.GEN.offsec[lv] || []).forEach(g => { for (let k = 0; k < 300; k++) { const r = g(); if (r) { pieces++; scan('generated ' + g.sk, JSON.stringify(r.d)); } } });
/* the scanner itself must catch what it is meant to catch */
for (const p of ["' OR '1'='1", 'UNION SELECT', '<script>', 'nmap -sV', 'run the following command', 'Step 1: exploit']) if (!hits(p).length) fail('scanner misses', p);
/* the track's text outside lessons too: its blurb, Skills map stage, job goal and free resources */
scan('track blurb', JSON.stringify(T.TRACKS.find(t => t.id === 'offsec')));
scan('skills map stage', JSON.stringify(T.STAGES.filter(s => /Offensive/.test(s[0])).map(s => s.slice(0, 2))));
scan('free resources', JSON.stringify(T.PRACTICE.filter(g => /Offensive/.test(g.group))));
/* lookup tables: every answer is one of the offered options, and no stem appears twice */
const tables = [['OWASP_CASES', T.OWASP_CASES, T.OWASP_ALL], ['TACTICS', T.TACTICS, T.TACTIC_ALL]];
for (const [name, rows, all] of tables) {
  rows.forEach(([s, a]) => { if (!all.includes(a)) fail(name, 'answer not among the options:', a); });
  if (new Set(rows.map(r => r[0])).size !== rows.length) fail(name, 'has a repeated stem');
}
for (const [name, rows] of [['SCOPE_ACTS', T.SCOPE_ACTS], ['ENGAGE', T.ENGAGE], ['INJ_FIX', T.INJ_FIX], ['PW_DEF', T.PW_DEF], ['REPORT_PARTS', T.REPORT_PARTS]])
  if (new Set(rows.map(r => r[1])).size !== rows.length || new Set(rows.map(r => r[0])).size !== rows.length) fail(name, 'has a repeated stem or answer (two rows would share a right answer)');
/* every vulnerability-class lesson (all Offensive lessons except the process ones) explains prevention and detection */
const PROCESS = new Set(['Scoping & authorization', 'Engagement types', 'MITRE ATT&CK & kill chain', 'Findings report']);
for (const [id, l] of lessons) {
  if (PROCESS.has(id.slice('quiz:offsec:'.length))) continue;
  for (const k of ['prevent', 'detect']) if (typeof l[k] !== 'string' || l[k].replace(/<[^>]+>/g, '').trim().length < 60) fail(id, 'needs a real "' + k + '" section');
}
/* OWASP categories are taught by name: rank numbers change between editions */
const RANK = /\bA\d{2}(:20\d\d)?\b/;
for (const [id, l] of lessons) if (RANK.test(JSON.stringify(l))) fail(id, 'uses an OWASP rank number');
T.CARDS.concat(T.QUIZ).filter(x => x[0] === 'offsec').forEach(x => { if (RANK.test(JSON.stringify(x))) fail('card/quiz uses an OWASP rank number:', x[2]); });
for (const lv of [1, 2]) (T.GEN.offsec[lv] || []).forEach(g => { for (let k = 0; k < 50; k++) { const r = g(); if (r && RANK.test(JSON.stringify(r.d))) fail('generated question uses an OWASP rank number:', g.sk); } });
console.log('offensive content checked', pieces, '| banned patterns', BANNED.length, '| problems', bad);
process.exitCode = bad ? 1 : 0;
