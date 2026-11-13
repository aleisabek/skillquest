// Nov 13 council fixes: Security+ first on Today while an exam date is ahead, code always monospace, the lesson
// section list as one row, and the Exams start buttons above the caveats (wording unchanged).
const fs = require('fs');
const js = fs.readFileSync(__dirname + '/.tmp/script.js', 'utf8');
const css = fs.readFileSync(__dirname + '/../src/styles.css', 'utf8');
const examSrc = fs.readFileSync(__dirname + '/../src/exam.js', 'utf8');
const fnLine = n=>{ const i = js.indexOf('function '+n+'('); return js.slice(i, js.indexOf('\n', i)); };
const fnGrab = n=>{ const i = js.indexOf('function '+n+'('); return js.slice(i, js.indexOf('\n}', i) + 2); };
let bad = 0; const expect = (ok, what)=>{ if(!ok){ bad++; console.log('FAIL', what); } };

/* exam-first switch: only for a date today or later */
const dateNum = js.match(/const dateNum = [^\n]+/)[0];
const mk = new Function('S', fnLine('dayStr')+';'+dateNum+';'+fnLine('examDays')+';'+fnLine('secExamFirst')+';return {secExamFirst, dayStr, addDays:(d,n)=>{ const x = new Date(d+"T12:00:00"); x.setDate(x.getDate()+n); return dayStr(x); }};');
const S = {}, f = mk(S), today = f.dayStr();
expect(f.secExamFirst() === false, 'no exam date: Today keeps the normal order');
S.goal = {exam:'', set:today}; expect(f.secExamFirst() === false, 'removed exam date: normal order');
S.goal = {exam:f.addDays(today, 30), set:today}; expect(f.secExamFirst() === true, 'exam date ahead: Security+ first');
S.goal = {exam:today, set:today}; expect(f.secExamFirst() === true, 'exam today: Security+ first');
S.goal = {exam:f.addDays(today, -1), set:today}; expect(f.secExamFirst() === false, 'exam date passed: normal order again');

/* Today: the top card uses the session, and the session is not shown twice */
const today_ = fnGrab('vToday');
expect(/examFirst \? '<div class="card exfirst">'\+sessionCard\(true\)/.test(today_), 'Today puts the session card at the top while the exam is ahead');
expect(/\(next \|\| examFirst \? '' : sessionCard\(\)\)/.test(today_), 'the after-the-loop session card is hidden when it is already at the top');
/* the session reaches Level 2 Security+ skills: no level gate in its skill pick */
expect(!/skillLevel|PATH\.solid/.test(fnGrab('weakSecSkill')), 'the session skill pick has no Level 2 gate');

/* fonts: code, model answers and typed answers are monospace in every look, readable mode included */
const MONO = /"Cascadia Code",Consolas,"JetBrains Mono",ui-monospace,monospace/;
const rule = sel=>{ const m = css.match(new RegExp('(^|\\n)'+sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')+'\\{([^}]*)\\}')); return m ? m[2] : ''; };
expect(MONO.test(rule('code,.mono')), 'code and .mono use the monospace stack (not inherit)');
expect(MONO.test(rule('.model pre,input.typed,html.readable input.typed,html.readable .model pre')), 'model answers and typed answers are monospace, in readable mode too');
expect(!/\ncode,\.mono\{font-family:inherit/.test(css), 'code no longer inherits the body font');

/* lesson section list: one wrapping row, without the header menu's lowercase and "./" */
const ls = rule('.glass .lsteps');
expect(/flex-direction:row/.test(ls) && /flex-wrap:wrap/.test(ls), 'the lesson section list is a wrapping row');
expect(/text-transform:none/.test(rule('.glass .lsteps button')) && /content:none/.test(rule('.glass .lsteps button::before')), 'lesson pills drop the menu styling');

/* Exams: start buttons come before the caveats in each card, wording unchanged */
const card = examSrc.slice(examSrc.indexOf("'<div class=\"card cert\""), examSrc.indexOf('<h2>History</h2>'));
const b = card.indexOf('Quick exam · 20 questions · 20 min'), r = card.indexOf('Real exam: '), d = card.indexOf('unmeasured: no questions yet');
expect(b > 0 && r > 0 && b < r && b < d, 'Exams: the start buttons come before what the exam covers');
expect(card.includes('Longer practice · 45 questions · 45 min'), 'both start buttons are still there');

console.log(bad ? bad+' failure(s)' : 'exam-first, fonts, lesson row and Exams order: all checks passed');
process.exit(bad ? 1 : 0);
