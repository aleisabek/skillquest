// Automatic sync in a real browser (no npm dependencies, same launcher as feature-scenes-browser): drives the built page
// over the DevTools protocol with a stand-in for the picked file (a real file needs a person to pick it), and checks that
// sync writes progress to an empty file, merges the other computer's progress in, never writes over a file that isn't a
// backup, waits for permission, writes nothing when nothing changed, shows Resume on Today when paused, and that Reset
// everything turns sync off. Skips (passing) when no browser is installed, except in CI.
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
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sq-sync-'));
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
  const guard = setTimeout(() => { fail('timed out after 90s'); stop(); process.exit(1); }, 90000);
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
    await send('Runtime.enable'); await send('Page.enable');
    await send('Page.navigate', { url: page });
    for (let i = 0; i < 100 && !events.includes('Page.loadEventFired'); i++) await sleep(100);
    await sleep(300);

    /* a stand-in for the picked file: its text, how often it was read and written, and the permission it answers */
    await run(`window.FAKE = (data, perm) => { const f = { name: 'SkillQuest-sync.json', data, perm: perm || 'granted', reads: 0, writes: 0,
        queryPermission: async () => f.perm, requestPermission: async () => f.perm,
        getFile: async () => { f.reads++; return { text: async () => f.data }; },
        createWritable: async () => { let buf = ''; return { write: async x => { buf += x; }, close: async () => { f.data = buf; f.writes++; } }; } };
      return f; };`);
    const r = await run(`
      const out = {};
      out.supported = syncSupported();
      /* 1. an empty file gets this device's progress */
      S.xp = 120; save();
      let f = FAKE(''); SYNC.h = f; SYNC.state = 'on';
      out.empty = await syncRun(); out.emptyXp = JSON.parse(f.data).xp;
      /* 2. nothing changed: no second write */
      const w = f.writes; out.same = await syncRun(); out.sameWrites = f.writes - w;
      /* 3. the other computer's progress: pushing alone leaves this device as it is but the file gets both */
      f = FAKE(JSON.stringify(Object.assign(JSON.parse(JSON.stringify(DEFAULT)), { xp: 900, best: 7 }))); SYNC.h = f;
      out.push = await syncRun(); out.pushHereXp = S.xp; out.pushFile = JSON.parse(f.data).xp + '/' + JSON.parse(f.data).best;
      /* 4. pulling merges it in here */
      out.pull = await syncRun({ pull: true }); out.pullHereXp = S.xp + '/' + S.best;
      /* 5. a file that isn't a backup is left alone */
      f = FAKE('my shopping list'); SYNC.h = f; SYNC.state = 'on';
      out.bad = await syncRun({ pull: true }); out.badData = f.data; out.badWrites = f.writes;
      /* 6. no permission: paused, the file isn't even read */
      f = FAKE('', 'prompt'); SYNC.h = f; SYNC.state = 'on';
      out.paused = await syncRun(); out.pausedReads = f.reads;
      go('today'); await new Promise(r => setTimeout(r, 200));
      out.todayResume = !!document.querySelector('#syncResume');
      /* 7. the Backup page shows the sync section; Reset everything turns sync off */
      f.perm = 'granted'; SYNC.state = 'on';
      go('backup'); await new Promise(r => setTimeout(r, 200));
      out.backupBox = !!document.querySelector('#syncBox') && /Syncing with/.test(document.querySelector('#syncBox').textContent);
      document.querySelector('#reset').click(); await new Promise(r => setTimeout(r, 50));
      out.resetWarns = /Sync will be turned off/.test(document.querySelector('#ask').textContent);
      document.querySelector('#askYes').click(); await new Promise(r => setTimeout(r, 300));
      out.resetOff = SYNC.h === null && SYNC.state === 'off'; out.resetXp = S.xp;
      return out;`);
    const want = { supported: true, empty: 'ok', emptyXp: 120, same: 'ok', sameWrites: 0, push: 'ok', pushHereXp: 120, pushFile: '900/7',
      pull: 'pulled', pullHereXp: '900/7', bad: 'bad', badData: 'my shopping list', badWrites: 0, paused: 'paused', pausedReads: 0,
      todayResume: true, backupBox: true, resetWarns: true, resetOff: true, resetXp: 0 };
    for (const [k, v] of Object.entries(want)) if (r[k] !== v) fail(k, 'expected', JSON.stringify(v), 'got', JSON.stringify(r[k]));
    for (const e of errors) fail('page error:', e);
    console.log('sync browser checks', Object.keys(want).length, '| browser', path.basename(bin), '| problems', bad);
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
