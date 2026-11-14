// Real-browser check of the study flow (see mix.js and vLesson): today's lessons come first, then one mixed practice set
// that hides each question's skill until it is answered and counts each lesson's practice once one of its questions is
// right; a lesson hides its model explanation until you have explained it yourself; a lesson read on an earlier day asks
// what you remember before showing itself; and every lesson shows its "How it connects" links. Same headless Chrome or
// Edge harness as feature-scenes-browser.js. Skips (passing) when no browser is installed, except in CI.
const { spawn, execFileSync } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path'), { pathToFileURL } = require('url');

function findBrowser(){
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  if (process.platform === 'win32') {
    const roots = [process.env['ProgramFiles(x86)'], process.env.ProgramFiles, process.env.LOCALAPPDATA].filter(Boolean);
    for (const r of roots) for (const p of ['Microsoft/Edge/Application/msedge.exe', 'Google/Chrome/Application/chrome.exe'])
      if (fs.existsSync(path.join(r, p))) return path.join(r, p);
    return null;
  }
  for (const n of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge']) {
    try { return execFileSync('which', [n], { encoding: 'utf8' }).trim(); } catch (e) {}
  }
  if (fs.existsSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')) return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  return null;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
let bad = 0; const fail = (...a) => { bad++; console.log('FAIL', ...a); };

async function main(){
  const bin = findBrowser();
  const skip = why => { if (process.env.CI) fail('cannot run in CI:', why); else console.log('study browser checks skipped:', why); };
  if (!bin) return skip('no Chrome or Edge installed');
  if (typeof WebSocket === 'undefined') return skip('this Node has no built-in WebSocket');
  const page = pathToFileURL(path.join(__dirname, '..', 'dist', 'SkillQuest.html')).href;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sq-study-'));
  const args = ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0',
    '--user-data-dir=' + dir, '--window-size=1000,1400', 'about:blank'];
  if (process.platform === 'linux') args.unshift('--no-sandbox', '--disable-dev-shm-usage');   /* CI runners */
  const proc = spawn(bin, args, { stdio: 'ignore' });
  /* on Windows, kill() stops only the first process and leaves the browser's children running: end the whole tree */
  /* Edge also hands work to processes outside that tree, so on Windows any browser still using this run's own profile
     folder is ended too (matched by the folder's unique name). Runs on normal exit and on the timeout. */
  let stopped = false;
  const stop = () => { if (stopped) return; stopped = true;
    try { if (process.platform === 'win32') {
      const cp = require('child_process');
      cp.spawnSync('taskkill', ['/PID', String(proc.pid), '/T', '/F'], { stdio: 'ignore' });
      cp.spawnSync('powershell', ['-NoProfile', '-Command', "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*" + path.basename(dir) + "*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"], { stdio: 'ignore' });
    } else proc.kill(); } catch (e) {} };
  process.on('exit', stop);
  /* never hang CI: the whole check has 90 seconds */
  const guard = setTimeout(() => { fail('timed out after 120s'); stop(); process.exit(1); }, 120000);
  guard.unref();
  let ws;
  try {
    let port = 0;
    for (let i = 0; i < 150 && !port; i++) { await sleep(100); try { port = +fs.readFileSync(path.join(dir, 'DevToolsActivePort'), 'utf8').split('\n')[0]; } catch (e) {} }
    if (!port) throw new Error('browser did not open a DevTools port');
    const target = (await (await fetch('http://127.0.0.1:' + port + '/json/list')).json()).find(t => t.type === 'page');
    ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });
    let seq = 0; const waiting = new Map(), errors = [], events = [];
    ws.onmessage = m => {
      const d = JSON.parse(m.data);
      if (d.id && waiting.has(d.id)) { waiting.get(d.id)(d); waiting.delete(d.id); return; }
      if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails.exception ? d.params.exceptionDetails.exception.description : d.params.exceptionDetails.text);
      if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errors.push(d.params.args.map(a => a.value || a.description).join(' '));
      events.push(d.method);
    };
    const send = (method, params) => new Promise((ok, no) => {
      const id = ++seq; waiting.set(id, ok); ws.send(JSON.stringify({ id, method, params: params || {} }));
      setTimeout(() => { if (waiting.has(id)) { waiting.delete(id); no(new Error(method + ' got no answer in 20s')); } }, 20000);
    });
    const run = async expr => {
      const r = await send('Runtime.evaluate', { expression: '(async()=>{' + expr + '})()', awaitPromise: true, returnByValue: true });
      if (r.result && r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception ? r.result.exceptionDetails.exception.description : r.result.exceptionDetails.text);
      return r.result && r.result.result ? r.result.result.value : undefined;
    };
    const key = async k => { for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: k, code: k, windowsVirtualKeyCode: k === 'ArrowRight' ? 39 : 37 }); };
    await send('Runtime.enable'); await send('Page.enable');
    await send('Page.navigate', { url: page });
    for (let i = 0; i < 100 && !events.includes('Page.loadEventFired'); i++) await sleep(100);
    await sleep(300);
    /* 1. Today: lessons first, then one mixed set. The engines are stood in for here (each records what it was asked
       and answers), so this checks the order, the hidden labels and the crediting; part 2 drives the real engines. */
    const loop = await run(`
      const out = [], txt = sel => (document.querySelector(sel) || {}).textContent || '', lbl = () => ((document.querySelector('#nextUp') || {}).textContent || '');
      go('today'); const plan = dailyPlan();
      if (!/Lesson/.test(lbl())) out.push('the first step should be a lesson, got: ' + lbl());
      S.lessons = S.lessons || {}; plan.ids.forEach(id => S.lessons[id] = dayStr()); save(); go('today');
      if (!/Mixed practice/.test(lbl())) out.push('after the lessons, Next up should be the mixed set, got: ' + lbl());
      const real = {quizStep, termStep, sqlStep};
      const runSet = right => { const seen = [];
        const fake = kind => s => { seen.push({kind, sk:s.sk, n:s.mix && s.mix.n, of:s.mix && s.mix.of, title:!!s.mix}); s.right = right; s.then(s); };
        quizStep = fake('quiz'); termStep = fake('term'); sqlStep = fake('sql');
        try { startMix(); } finally { quizStep = real.quizStep; termStep = real.termStep; sqlStep = real.sqlStep; }
        return seen; };
      /* all wrong: nothing counts, and the end screen says which lessons still need a right answer */
      let seen = runSet(0);
      if (todaySteps().practice.some(Boolean)) out.push('a wrong answer must not count a lesson as practiced');
      if (!/Not counted yet/.test(view.textContent) || !document.querySelector('#mixAgain')) out.push('the end screen should list the lessons not counted yet and offer another set');
      /* all right: every lesson's practice counts */
      seen = runSet(1);
      const per = {}; seen.forEach(x => per[x.sk] = (per[x.sk] || 0) + 1);
      plan.ids.forEach(id => { const n = per[skillById(id).sk] || 0; if (n < 1 || n > PRACTICE_N) out.push(skillById(id).sk + ' should get 1 to ' + PRACTICE_N + ' questions in the set, got ' + n); });
      if (!seen.every(x => x.title && x.of === seen.length)) out.push('every question in the set must know its place in it');
      for (let i = 1; i < seen.length; i++) if (seen[i].sk === seen[i - 1].sk && new Set(seen.map(x => x.sk)).size > 1) { out.push('the same skill came twice in a row: ' + seen[i].sk); break; }
      if (!todaySteps().practiced) out.push('every lesson should count as practiced after a right answer each');
      if (!/Mixed practice done/.test(view.textContent)) out.push('no end screen after the set');
      go('today');
      if (/Mixed practice/.test(lbl())) out.push('the mixed set is still offered after it was done');
      return out;`);
    loop.forEach(m => fail('today:', m));

    /* 2. The real engines inside a mixed set: no skill name until answered, then it is named, then the set goes on */
    const engines = await run(`
      const out = [], txt = sel => (document.querySelector(sel) || {}).textContent || '', h1 = () => document.querySelector('h1').textContent, mix = sk => ({n:2, of:5, sk});
      let back = null; const then = s => { back = s.right; };
      /* quiz */
      const q = allSkills().find(s => s.id === 'quiz:sec:Firewalls'), qi = quizSet(q.tid, 1, 0, q.sk, [])[0];
      quizStep({items:[qi], i:0, right:0, mission:null, sk:q.sk, lv:0, tid:q.tid, endless:true, showChoices:true, then, mix:mix(q.sk)});
      if (!/Mixed practice/.test(h1()) || h1().includes(q.sk)) out.push('quiz: the title must say Mixed practice and not name the skill: ' + h1());
      if (!/Question 2 of 5/.test(view.textContent) || document.querySelector('.signal')) out.push('quiz: should show its place in the set, with no transmission box');
      if (document.querySelector('.mixwas')) out.push('quiz: the skill was named before answering');
      document.querySelector('.opt[data-k="' + qi.d[4] + '"]').click();
      if (!txt('.mixwas').includes(q.sk)) out.push('quiz: the skill should be named after answering');
      document.querySelector('#sure').click();
      if (back !== 1) out.push('quiz: a right answer should hand back to the set with 1 right, got ' + back);
      /* terminal */
      back = null; const t = allSkills().find(s => s.kind === 'term'), ti = termSet(1, 0, t.sk, [])[0];
      termStep({items:[ti], i:0, right:0, mission:null, sk:t.sk, lv:0, lines:[], hinted:false, then, mix:mix(t.sk)});
      if (!/Mixed practice/.test(h1())) out.push('terminal: the title must say Mixed practice: ' + h1());
      const cmd = document.querySelector('#cmd'); cmd.value = ti[2]; cmd.dispatchEvent(new KeyboardEvent('keydown', {key:'Enter', bubbles:true}));
      if (!txt('.mixwas').includes(t.sk)) out.push('terminal: the skill should be named after solving');
      document.querySelector('#tnext').click();
      if (back !== 1) out.push('terminal: solving should hand back to the set with 1 right, got ' + back);
      /* SQL */
      back = null; const sq = allSkills().find(s => s.kind === 'sql'), si = sqlSet(1, 0, sq.sk, [])[0];
      sqlStep({items:[si], i:0, right:0, mission:null, sk:sq.sk, lv:0, hinted:false, then, mix:mix(sq.sk)});
      if (!/Mixed practice/.test(h1())) out.push('SQL: the title must say Mixed practice: ' + h1());
      document.querySelector('#sq').value = si[3]; document.querySelector('#run').click();
      if (!txt('.mixwas').includes(sq.sk)) out.push('SQL: the skill should be named after solving');
      document.querySelector('#nx').click();
      if (back !== 1) out.push('SQL: solving should hand back to the set with 1 right, got ' + back);
      return out;`);
    engines.forEach(m => fail('engines:', m));

    /* 3. Lessons: say it first, recall first when it comes back, and How it connects */
    const lesson = await run(`
      const out = [], txt = sel => (document.querySelector(sel) || {}).textContent || '', id = 'quiz:sec:Firewalls', L = lessonFor(id), say = plainText(L.say).slice(0, 40), vis = sel => { const e = document.querySelector(sel); return !!e && !e.closest('[hidden]'); };
      delete S.lessons[id];
      vLesson(id, 'p0');
      if (document.querySelector('#recallCard')) out.push('a first-time lesson must not ask what you remember');
      if (!vis('#lessonBody') || vis('#sayCard')) out.push('a lesson should open with the lesson shown and the explain card hidden');
      if ([...document.querySelectorAll('#view *')].some(e => !e.closest('[hidden]') && e.children.length === 0 && e.textContent.includes(say))) out.push('the model explanation is visible before you explain it');
      const want = lessonLinks(id).filter(([o]) => skillById(o) && lessonFor(o)).length, got = document.querySelectorAll('details.link').length;
      if (got !== want || got < 2) out.push('How it connects should show ' + want + ' links (at least 2), shows ' + got);
      document.querySelector('#sayGo').click();
      if (vis('#lessonBody') || !vis('#sayCard')) out.push('explaining should hide the lesson and show the explain card');
      document.querySelector('#sayCmp').click();
      if (!document.querySelector('#sayAfter').textContent.includes(say)) out.push('compare should show the model explanation');
      if (!/Continue today/.test(document.querySelector('#sayDone').textContent)) out.push('from the plan, the lesson should go on with today\\'s plan');
      document.querySelector('#sayOpen').click();
      if (!vis('#lessonBody')) out.push('reopen should show the lesson again');
      /* a lesson read on an earlier day: recall first */
      S.lessons[id] = '2026-01-01';
      vLesson(id, null);
      if (!vis('#recallCard') || vis('#lessonBody')) out.push('a returning lesson should ask what you remember before showing the lesson');
      document.querySelector('#recallText').value = 'rules top to bottom, first match wins';
      document.querySelector('#recallGo').click();
      if (!vis('#lessonBody') || document.querySelector('#recallCard')) out.push('Show the lesson should reveal it');
      if (!txt('.recall-said').includes('first match wins')) out.push('what you remembered should stay on screen to compare');
      /* a preview (locked track) still shows the model explanation, since there is nothing to practice */
      vLesson(id, null, {preview:true});
      if (document.querySelector('#sayCard') || !view.textContent.includes(say)) out.push('a preview should show the model explanation and no explain step');
      /* a link opens the other lesson */
      vLesson(id, null); const first = lessonLinks(id)[0][0];
      document.querySelector('[data-link="0"]').click();
      if (!document.querySelector('h1').textContent.includes(skillById(first).sk)) out.push('a link should open ' + first);
      go('today');
      return out;`);
    lesson.forEach(m => fail('lesson:', m));
    await sleep(200);
    errors.filter(e => !/favicon|fonts\.g|net::ERR/i.test(e)).forEach(e => fail('page error:', e));
    console.log('study browser checks | browser', path.basename(bin), '| problems', bad);
  } catch (e) { fail(e.message); }
  finally {
    clearTimeout(guard);
    try { ws && ws.close(); } catch (e) {}
    stop();
    await sleep(300);
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
  }
  process.exitCode = bad ? 1 : 0;
}
main();
