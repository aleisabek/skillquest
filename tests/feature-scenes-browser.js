// Real-browser check of the animated scenes, with no npm dependencies: starts headless Chrome or Edge, drives it over
// the DevTools protocol (Node's built-in WebSocket) and, for each theme, opens every scene's lesson, steps through it,
// checks it never autoplays, keeps focus and keys inside the scene, honours reduced motion, stays legible at 360px,
// and stops cleanly with no errors when you leave mid-animation. Skips (passing) when no browser is installed,
// except in CI, where it must run.
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
  const skip = why => { if (process.env.CI) fail('cannot run in CI:', why); else console.log('scene browser checks skipped:', why); };
  if (!bin) return skip('no Chrome or Edge installed');
  if (typeof WebSocket === 'undefined') return skip('this Node has no built-in WebSocket');
  const page = pathToFileURL(path.join(__dirname, '..', 'dist', 'SkillQuest.html')).href;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sq-scenes-'));
  const args = ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0',
    '--user-data-dir=' + dir, '--window-size=1000,1400', 'about:blank'];
  if (process.platform === 'linux') args.unshift('--no-sandbox', '--disable-dev-shm-usage');   /* CI runners */
  const proc = spawn(bin, args, { stdio: 'ignore' });
  /* never hang CI: the whole check has 90 seconds */
  const guard = setTimeout(() => { fail('timed out after 150s'); try { proc.kill(); } catch (e) {} process.exit(1); }, 150000);
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

    const lessons = await run('return Object.keys(SCENES);');
    const fills = {};
    for (const theme of ['matrix', 'cyber', 'amber']) for (const id of lessons) {
      const r = await run(`
        const out = [], sleep = ms => new Promise(r => setTimeout(r, ms)), sc = SCENES[${JSON.stringify(id)}];
        document.documentElement.dataset.theme = ${JSON.stringify(theme)};
        vLesson(${JSON.stringify(id)});
        const host = document.querySelector('#scene'), svg = host && host.querySelector('svg');
        if (!svg) return {out: ['no scene on the lesson page']};
        const box = svg.getBoundingClientRect(); if (!(box.width > 200 && box.height > 100)) out.push('scene too small: ' + box.width + 'x' + box.height);
        const cap = host.querySelector('.scene-cap'), b = a => host.querySelector('[data-a="' + a + '"]');
        if (cap.getAttribute('aria-live') !== 'polite' || !svg.getAttribute('aria-label')) out.push('caption or picture is not wired for screen readers');
        const capH = host.querySelector('.scene-capbox').getBoundingClientRect().height;
        await sleep(700);
        if (SCENE_LIVE.playing || SCENE_LIVE.step !== 0) out.push('scene must not autoplay');
        if (!b('back').disabled) out.push('Back should be disabled on step 1');
        b('next').focus();
        for (let i = 0; i < sc.steps.length; i++) {
          if (cap.textContent !== sc.steps[i].say) out.push('step ' + (i + 1) + ' caption mismatch');
          if (Math.abs(host.querySelector('.scene-capbox').getBoundingClientRect().height - capH) > 1) out.push('caption box changed height on step ' + (i + 1));
          if (i < sc.steps.length - 1) b('next').click();
        }
        if (!b('next').disabled) out.push('Next should be disabled on the last step');
        if (!host.contains(document.activeElement) || document.activeElement === document.body) out.push('focus was lost at the last step');
        if (b('play').textContent !== 'Replay') out.push('Play should read "Replay" on the last step');
        b('play').click(); await sleep(50);
        if (SCENE_LIVE.step !== 0 && SCENE_LIVE.step !== 1) out.push('Replay should start over');
        b('play').click();   /* pause */
        while (SCENE_LIVE.step > 0) b('back').click();
        if (!host.contains(document.activeElement)) out.push('focus was lost at the first step');
        b('play').click();
        if (SCENE_LIVE.step !== 1 || !SCENE_LIVE.playing) out.push('Play should move on straight away and keep playing');
        b('play').click();
        /* theme colour of the scene's highlighted shapes (on any step), read with transitions off */
        const st = document.createElement('style'); st.textContent = '.scene .sc{transition:none!important}'; document.head.appendChild(st);
        let netCell = null;
        for (let i = 0; i < sc.steps.length && !netCell; i++) { SCENE_LIVE.show(i); netCell = svg.querySelector('.sc-cell.net, .sc-box.hit, .sc-box.ok, .sc-box.bad, .sc-node.bad, text.ok'); }
        const fill = netCell ? getComputedStyle(netCell).fill : '';
        st.remove();
        /* play, then leave the lesson mid-animation: the loop must have run, then stop, and nothing may throw */
        let ticks = 0; const raf0 = window.requestAnimationFrame;
        window.requestAnimationFrame = f => { if (f && f.name === 'sceneTick') ticks++; return raf0.call(window, f); };
        SCENE_LIVE.show(0); b('play').click(); await sleep(400);
        if (!SCENE_LIVE.playing) out.push('Play did not start');
        go('today'); const at = ticks; await sleep(700);
        window.requestAnimationFrame = raf0;
        if (!at) out.push('the animation loop never ran');
        if (SCENE_LIVE !== null) out.push('leaving the lesson must destroy the scene');
        if (ticks - at > 1) out.push('animation kept running after leaving the lesson (' + (ticks - at) + ' frames)');
        return {out, fill};`);
      (r.out || []).forEach(e => fail(theme, id, e));
      (fills[id] = fills[id] || new Set()).add(r.fill);
    }
    for (const id of lessons) if (fills[id].size !== 3) fail(id, 'network cells should take each theme\'s colour, got', [...fills[id]].join(' | '));

    /* real key presses: arrows act only while focus is inside the scene */
    const id0 = JSON.stringify(lessons[0]);
    await run(`vLesson(${id0}); document.activeElement.blur(); document.body.focus();`);
    await key('ArrowRight');
    if (await run('return SCENE_LIVE.step;') !== 0) fail('ArrowRight with focus outside the scene must do nothing');
    await run(`document.querySelector('#scene [data-a="next"]').focus();`);
    await key('ArrowRight');
    if (await run('return SCENE_LIVE.step;') !== 1) fail('ArrowRight inside the scene should step forward');
    await key('ArrowLeft');
    if (await run('return SCENE_LIVE.step;') !== 0) fail('ArrowLeft inside the scene should step back');

    /* Try it: typing an address and moving the prefix updates the answers live; a bad address gets a clear message */
    const tr = await run(`vLesson('quiz:net:Subnetting'); const box = document.querySelector('#scene .scene-try');
      if (!box) return {err: 'no Try it panel'};
      const ip = box.querySelector('[data-k="ip"]'), p = box.querySelector('[data-k="p"]');
      ip.value = '10.0.0.200'; p.value = '26'; p.dispatchEvent(new Event('input', {bubbles: true}));
      const good = box.querySelector('[data-k="out"]').textContent;
      ip.value = '10.0.0.300'; ip.dispatchEvent(new Event('input', {bubbles: true}));
      const msg = box.querySelector('[data-k="msg"]').textContent, empty = box.querySelector('[data-k="out"]').textContent;
      go('today'); return {good, msg, empty};`);
    if (tr.err) fail(tr.err);
    else {
      for (const want of ['10.0.0.192', '10.0.0.255', '10.0.0.193', '10.0.0.254', '62', '255.255.255.192', '11001000', '11000000'])
        if (!tr.good.includes(want)) fail('Try it for 10.0.0.200/26 should show', want);
      if (!/0 to 255/.test(tr.msg) || tr.empty) fail('Try it should explain a bad address and clear the answers');
    }

    /* predictions: choices show, a pick is marked and answered, Play stops at a question, Next still works without
       picking; and every scene's Try it panel draws something */
    for (const id of lessons) {
      const pr = await run(`vLesson(${JSON.stringify(id)}); const sc = SCENES[${JSON.stringify(id)}], host = document.querySelector('#scene'), out = [];
        const q = sc.steps.findIndex(s => s.ask), b = a => host.querySelector('[data-a="' + a + '"]');
        const tryBox = host.querySelector('.scene-try'); if (sc.tryIt && !(tryBox && tryBox.textContent.trim().length > 20)) out.push('Try it panel is empty');
        if (q < 0) { go('today'); return out; }
        SCENE_LIVE.show(q - 1); b('play').click();
        if (SCENE_LIVE.step !== q || SCENE_LIVE.playing) out.push('Play should stop at the question');
        const choices = [...host.querySelectorAll('.scene-live .scene-opts button')];
        if (choices.length !== sc.steps[q].ask.options.length) out.push('the question shows ' + choices.length + ' choices');
        const wrong = sc.steps[q].ask.options.findIndex(o => !o[1]), right = sc.steps[q].ask.options.findIndex(o => o[1]);
        choices[wrong].click();
        const reply = host.querySelector('.scene-live .scene-verdict').textContent;
        if (!/^Not quite/.test(reply) || choices[wrong].getAttribute('aria-pressed') !== 'true') out.push('a wrong pick should be marked and answered: ' + reply);
        if (document.activeElement !== b('next')) out.push('after a pick, focus should move to Next');
        host.querySelectorAll('.scene-live .scene-opts button')[right].click();
        if (!/^Right/.test(host.querySelector('.scene-live .scene-verdict').textContent)) out.push('a right pick should say Right');
        b('next').click();
        if (SCENE_LIVE.step !== q + 1 || host.querySelector('.scene-live .scene-opts button')) out.push('Next should reveal the answer step');
        SCENE_LIVE.show(q); if (SCENE_LIVE.step !== q || !host.querySelector('.scene-live [aria-pressed="true"]')) out.push('going back should keep your pick');
        go('today'); return out;`);
      (pr || []).forEach(e => fail(id, e));
    }

    /* phone: at a 360px screen no label in the picture renders below 12px */
    await send('Emulation.setDeviceMetricsOverride', { width: 360, height: 800, deviceScaleFactor: 1, mobile: true });
    for (const id of lessons) {
      const small = await run(`vLesson(${JSON.stringify(id)}); await new Promise(r => setTimeout(r, 100));
        const svg = document.querySelector('#scene svg'), k = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
        const sw = document.documentElement.scrollWidth;
        const tiny = [...svg.querySelectorAll('text')].map(t => parseFloat(getComputedStyle(t).fontSize) * k).filter(px => px < 11.95);
        go('today'); return {tiny: tiny.map(px => px.toFixed(1)), sw};`);
      if (small.tiny.length) fail(id, 'labels below 12px at 360px wide:', [...new Set(small.tiny)].join(', '));
      if (small.sw > 360) fail(id, 'the page scrolls sideways at 360px (' + small.sw + 'px)');
    }
    await send('Emulation.clearDeviceMetricsOverride');

    /* reduced motion: transitions off, stepping still works */
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    const rm = await run(`vLesson(${id0}); const el = document.querySelector('#scene .sc');
      const d = getComputedStyle(el).transitionDuration; document.querySelector('#scene [data-a="next"]').click();
      const s = SCENE_LIVE.step; go('today'); return {d, s};`);
    if (!/^0s(, 0s)*$/.test(rm.d)) fail('reduced motion should switch transitions off, got', rm.d);
    if (rm.s !== 1) fail('stepping should still work with reduced motion');
    await sleep(200);
    errors.filter(e => !/favicon|fonts\.g|net::ERR/i.test(e)).forEach(e => fail('page error:', e));
    console.log('scene browser checks | scenes', lessons.length, '| themes 3 | browser', path.basename(bin), '| problems', bad);
  } catch (e) { fail(e.message); }
  finally {
    clearTimeout(guard);
    try { ws && ws.close(); } catch (e) {}
    proc.kill();
    await sleep(300);
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
  }
  process.exitCode = bad ? 1 : 0;
}
main();
