// The Terminal's near-miss notes: each common slip gets its own note, and a plainly wrong answer gets none.
const fs = require('fs');
const js = fs.readFileSync(__dirname + '/.tmp/script.js', 'utf8');
const fnLine = n=>{ const i = js.indexOf('function '+n+'('); return js.slice(i, js.indexOf('\n', i)); };
const fnGrab = n=>{ const i = js.indexOf('function '+n+'('); return js.slice(i, js.indexOf('\n}', i) + 2); };
const {termNorm, termSlip} = new Function(fnLine('norm')+';'+fnGrab('termNorm')+';'+fnGrab('termSlip')+';return {termNorm, termSlip};')();
const R = s=>new RegExp('^'+s+'$');
let bad = 0;
const check = (typed, pats, model, want)=>{
  const got = termSlip(termNorm(typed), pats, model);
  if(want === '' ? got !== '' : !got.includes(want)){ console.log('FAIL', JSON.stringify(typed), '->', JSON.stringify(got), 'wanted', JSON.stringify(want)); bad++; }
};
const LN = [R('ln -s /var/www/html/? site')], ln = 'ln -s /var/www/html site';
check('In -s /var/www/html site', LN, ln, 'lowercase L');
check('in -s /var/www/html site', LN, ln, 'lowercase L');
check('LN -S /var/www/html site', LN, ln, 'upper and lowercase');
check('ln -s \\var\\www\\html site', LN, ln, 'forward slashes');
check('ln -s/var/www/html site', LN, ln, 'check the spaces');
check('ln -s site /var/www/html', LN, ln, 'wrong order');
check('lnn -s /var/www/html site', LN, ln, 'the command name');
check('ln -s /var/ww/html site', LN, ln, '"/var/ww/html"');
check('cp /var/www/html site', LN, ln, '');            // a different command is just wrong
check('ln /var/www/html site', LN, ln, '');            // a missing flag is not a typo
const PING = [R('ping -c ?4 example.com')], ping = 'ping -c 4 example.com';
check('ping -c 5 example.com', PING, ping, '');        // a different number is a different answer
check('ping -c 4 examp1e.com', PING, ping, 'spelling');
const LS = [R('ls -l')];
check('ls -a', LS, 'ls -l', '');                       // a different flag is a different answer
check('ls -O', [R('ls -0')], 'ls -0', 'zeros');
console.log('term slips: ' + (bad ? bad + ' problems' : 'all notes right'));
process.exitCode = bad ? 1 : 0;
