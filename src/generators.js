/* ===================== PROBLEM GENERATORS =====================
   Each generator builds a brand-new question with random values, and computes the
   correct answer from those values, so you practice the skill instead of memorizing. */
const rnd = (a,b)=>a+Math.floor(Math.random()*(b-a+1));
const pick = arr=>arr[Math.floor(Math.random()*arr.length)];
/* Multiple choice: right answer + distinct wrong answers (needs 3 different wrongs) */
function mcq(track, lv, q, right, wrongs, e){
  const r = String(right);
  const w = shuffle([...new Set(wrongs.map(String))].filter(x=>x!==r)).slice(0,3);
  if(w.length < 3) return null;
  return {gen:true, d:[track, lv, q, [r, ...w], 0, e]};
}
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const pad2 = n=>String(n).padStart(2,'0');
const ipStr = a=>a.join('.');
function maskOf(p){ const m=[]; for(let i=0;i<4;i++){ const b=Math.max(0,Math.min(8,p-i*8)); m.push(256-Math.pow(2,8-b)); } return m.join('.'); }
function permSym(n){ return [4,2,1].map((b,k)=>(n&b)?'rwx'[k]:'-').join(''); }
function permStr(d){ return d.split('').map(x=>permSym(+x)).join(''); }
function privIP(){ return pick([()=>[10,rnd(0,255),rnd(0,255),rnd(1,254)], ()=>[172,rnd(16,31),rnd(0,255),rnd(1,254)], ()=>[192,168,rnd(0,255),rnd(1,254)]])(); }
function pubIP(){ return pick([()=>[pick([8,23,34,52,66,98,104,151,185,203]),rnd(0,255),rnd(0,255),rnd(1,254)], ()=>[172,pick([15,32,33,40]),rnd(0,255),rnd(1,254)], ()=>[192,pick([167,169,170]),rnd(0,255),rnd(1,254)], ()=>[11,rnd(0,255),rnd(0,255),rnd(1,254)]])(); }
const PORTS = [[21,'FTP'],[22,'SSH'],[25,'SMTP'],[53,'DNS'],[67,'DHCP (server)'],[80,'HTTP'],[110,'POP3'],[123,'NTP'],[143,'IMAP'],[161,'SNMP'],[389,'LDAP'],[443,'HTTPS'],[445,'SMB (file sharing)'],[3306,'MySQL'],[3389,'RDP (Remote Desktop)']];
const HTTP = [[200,'OK: the request worked'],[201,'Created: a new item was made'],[204,'No Content: worked, nothing to return'],[301,'Moved Permanently: redirect'],[400,'Bad Request: the input is invalid'],[401,'Unauthorized: not logged in or bad token'],[403,'Forbidden: logged in but not allowed'],[404,'Not Found'],[409,'Conflict: clashes with the current state'],[429,'Too Many Requests: rate limited'],[500,'Internal Server Error'],[502,'Bad Gateway: an upstream server failed'],[503,'Service Unavailable: overloaded or down']];
const DNSR = [['A','Maps a name to an IPv4 address'],['AAAA','Maps a name to an IPv6 address'],['MX','Says which server receives the domain\'s email'],['CNAME','Makes one name an alias of another'],['TXT','Holds text, such as SPF or verification codes'],['PTR','Reverse lookup: IP address back to a name'],['NS','Lists the domain\'s authoritative name servers']];
const FILES = ['notes.txt','app.log','users.csv','report.md','backup.tar','config.yml','access.log','todo.txt'];
const WORDS = ['error','timeout','denied','admin','failed','printer','vpn'];

/* sk(skill, generator, {noType, lookup}): labels a quiz generator with its skill. noType = keep multiple choice even when
   typed answers are on. lookup = its answer comes from a fixed table, not a calculation (tests re-derive every other one). */
function sk(skill, f, o){ f.sk = skill; if(o && o.noType) f.noType = true; if(o && o.lookup) f.lookup = true; return f; }
const GEN = {
 net:{1:[
  sk('Ports & services', ()=>{ const [p,s] = pick(PORTS); return Math.random()<.5
      ? mcq('net',1,'Which service uses port <code>'+p+'</code> by default?', s, PORTS.map(x=>x[1]), 'Port '+p+' = '+s+'.')
      : mcq('net',1,'Which port does <b>'+s+'</b> use by default?', p, PORTS.map(x=>x[0]), s+' = port '+p+'.'); }, {lookup:true}),
  sk('IP addressing', ()=>{ const r = ipStr(privIP()); return mcq('net',1,'Which of these is a <b>private</b> IP address?', r, [ipStr(pubIP()),ipStr(pubIP()),ipStr(pubIP()),ipStr(pubIP())],
      '<code>'+r+'</code> is private. Private ranges: 10.0.0.0/8, 172.16.0.0 to 172.31.255.255, and 192.168.0.0/16. Watch for look-alikes such as 172.32.x.x or 192.169.x.x, which are public.'); }, {noType:true}),
  sk('Subnetting', ()=>{ const p = rnd(22,30), h = Math.pow(2,32-p)-2;
      return mcq('net',1,'How many usable host addresses are in a <code>/'+p+'</code> network?', h, [h+2, Math.pow(2,33-p)-2, Math.pow(2,31-p)-2, h+1],
      'Usable hosts = 2^(32 − '+p+') − 2 = '+(h+2)+' − 2 = '+h+'. The 2 removed are the network and broadcast addresses.'); }),
  sk('Subnetting', ()=>{ const p = rnd(20,30); return mcq('net',1,'Which subnet mask is the same as <code>/'+p+'</code>?', maskOf(p), [maskOf(p-1),maskOf(p+1),maskOf(p+2),maskOf(p-2)],
      '/'+p+' means '+p+' ones in the mask, which is '+maskOf(p)+'.'); }),
  sk('IP addressing', ()=>{ const kinds = [[()=>[127,0,0,rnd(1,9)],'Loopback: the device talking to itself'],[()=>[169,254,rnd(0,255),rnd(1,254)],'APIPA: the device could not reach a DHCP server'],[privIP,'A normal private address on a local network'],[pubIP,'A public address on the internet']];
      const [f,m] = pick(kinds); const ip = ipStr(f());
      return mcq('net',1,'A device shows the address <code>'+ip+'</code>. What does that tell you?', m, kinds.map(k=>k[1]), '<code>'+ip+'</code>: '+m+'.'); }, {lookup:true})
 ],2:[
  sk('Subnetting', ()=>{ const p = rnd(25,29), blk = Math.pow(2,32-p), a=[192,168,rnd(0,255),rnd(1,254)], net = a[3]-a[3]%blk, bc = net+blk-1, wantNet = Math.random()<.5;
      const pre = a.slice(0,3).join('.')+'.'; const right = pre+(wantNet?net:bc);
      return mcq('net',2,'What is the <b>'+(wantNet?'network':'broadcast')+' address</b> of <code>'+ipStr(a)+'/'+p+'</code>?', right,
        [pre+(wantNet?bc:net), pre+((net+blk)%256), pre+Math.max(0,net-blk), pre+(wantNet?net+1:bc-1), pre+a[3]],
        '/'+p+' makes blocks of '+blk+' addresses. '+a[3]+' falls in the block '+net+' to '+bc+', so the network address is '+pre+net+' and the broadcast is '+pre+bc+'.'); }),
  sk('Subnetting', ()=>{ const p = rnd(26,28), blk = Math.pow(2,32-p), c = rnd(0,255), d = rnd(1,254), net = d-d%blk;
      let inSame = d; while(inSame===d) inSame = net + rnd(1, blk-2);
      const others = [];
      for(let s=0;s<256;s+=blk) if(s!==net) others.push(s + rnd(1, blk-2));
      return mcq('net',2,'Which host is in the same subnet as <code>10.1.'+c+'.'+d+'/'+p+'</code>?', '10.1.'+c+'.'+inSame, shuffle(others).slice(0,5).map(x=>'10.1.'+c+'.'+x),
        '/'+p+' makes blocks of '+blk+'. '+d+' is in the block '+net+' to '+(net+blk-1)+', and so is '+inSame+'.'); }, {noType:true}),
  sk('DNS records', ()=>{ const [t,m] = pick(DNSR); return Math.random()<.5
      ? mcq('net',2,'What does a DNS <b>'+t+'</b> record do?', m, DNSR.map(x=>x[1]), t+': '+m+'.')
      : mcq('net',2,'Which DNS record type: "'+m+'"?', t, DNSR.map(x=>x[0]), t+': '+m+'.'); }, {lookup:true})
 ]},
 linux:{1:[
  sk('Permissions', ()=>{ const d = [7,pick([7,5,4,6]),pick([5,4,0,6,1])].join(''), r = permStr(d);
      const wr = [permStr([d[0],d[2],d[1]].join('')), permStr('7'+d[1]+'7'), permStr(String(+d[0]-1 >= 0 ? (+d[0]===7?6:7) : 7)+d.slice(1)), permStr(d[1]+d[0]+d[2]), permStr('6'+d[1]+d[2])];
      return mcq('linux',1,'What permissions does <code>chmod '+d+' file</code> set?', r, wr,
        'Each digit is owner, group, others. r=4, w=2, x=1. '+d.split('').map(x=>x+' = '+permSym(+x)).join(', ')+'.'); }),
  sk('Permissions', ()=>{ const d = [pick([7,6]),pick([5,4,6,0]),pick([4,0,5])].join(''), s = permStr(d);
      return mcq('linux',1,'Which number matches the permissions <code>'+s+'</code>?', d, [d[0]+d[2]+d[1], d[1]+d[0]+d[2], '7'+d.slice(1), d.slice(0,2)+'7', '777'],
        'Add r=4, w=2, x=1 for each group of three: '+[0,1,2].map(i=>s.slice(i*3,i*3+3)+' = '+d[i]).join(', ')+'.'); }),
  sk('Everyday commands', ()=>{ const f = pick(FILES), w = pick(WORDS);
      const T = [['Show the contents of '+f,'cat '+f],['Count the lines in '+f,'wc -l '+f],['Show the first 10 lines of '+f,'head '+f],['Show the last 10 lines of '+f,'tail '+f],['Delete '+f,'rm '+f],['Rename '+f+' to old_'+f,'mv '+f+' old_'+f],['Find lines containing "'+w+'" in '+f,'grep '+w+' '+f],['Copy '+f+' into /tmp','cp '+f+' /tmp/']];
      const [task, ans] = pick(T);
      return mcq('linux',1,'Which command will: <b>'+task+'</b>?', '<code>'+ans+'</code>', T.map(x=>'<code>'+x[1]+'</code>'), '<code>'+ans+'</code>'); }, {lookup:true}),
  sk('Filesystem layout', ()=>{ const P = [['/etc','Configuration files'],['/var/log','Log files'],['/home','Each user\'s personal folder'],['/tmp','Temporary files, often cleared on reboot'],['/usr/bin','Installed programs (commands)'],['/root','The root (admin) user\'s home folder']];
      const [d,m] = pick(P); return Math.random()<.5
      ? mcq('linux',1,'What usually lives in <code>'+d+'</code>?', m, P.map(x=>x[1]), d+': '+m+'.')
      : mcq('linux',1,'Where would you look for: '+m.toLowerCase()+'?', '<code>'+d+'</code>', P.map(x=>'<code>'+x[0]+'</code>'), d+': '+m+'.'); }, {lookup:true})
 ],2:[
  sk('Permissions', ()=>{ const b = pick(['r--','--x','r-x','-wx','rwx','rw-','-w-']), r = b[0]==='r', x = b[2]==='x', w = b[1]==='w' && x;
      const can = (r,x,w)=>!r && !x ? 'Nothing: not list, open or create' : [r ? 'List the names' : 'Not list the names', x ? 'open a file by its name' : 'not open any file', w ? 'create or delete files' : 'not create or delete'].join(', ');
      const all = []; for(const R of [0,1]) for(const X of [0,1]) for(const W of [0,1]) if(!W || X) all.push(can(R,X,W));
      return mcq('linux',2,'You own the folder <code>reports</code>; its owner permissions are <code>'+b+'</code>. The files inside are readable by you. What can you do in it?', can(r,x,w), all,
        'On a folder, r lists the names, x lets you pass through to an entry by name, and w (only together with x) creates or deletes entries. '+b+': '+can(r,x,w).toLowerCase()+'.'); }),
  sk('Scheduling (cron)', ()=>{ const m = rnd(0,59), h = rnd(0,23), dw = Math.random()<.5 ? '*' : rnd(0,6);
      const when = (x,y)=>'At '+pad2(x)+':'+pad2(y)+(dw==='*'?' every day':' every '+DAYS[dw]);
      const line = m+' '+h+' * * '+dw;
      return mcq('linux',2,'When does the cron line <code>'+line+' /opt/job.sh</code> run?', when(h,m),
        [h<60&&m<24?when(m,h):'Every '+m+' minutes', 'Every '+(m||5)+' minutes', when(h,m).replace(dw==='*'?'every day':'every '+DAYS[dw], dw==='*'?'every Monday':'every day'), 'On day '+(h||1)+' of every month at '+pad2(0)+':'+pad2(m), 'At '+pad2((h+12)%24)+':'+pad2(m)+(dw==='*'?' every day':' every '+DAYS[dw])],
        'Cron fields: minute ('+m+'), hour ('+h+'), day of month (*), month (*), weekday ('+dw+(dw==='*'?' = any':' = '+DAYS[dw])+').'); }),
  sk('Admin tools', ()=>{ const T = [['See which filesystem is full','df -h'],['Find which folders use the most space','du -sh /var/* | sort -h'],['Check memory usage','free -h'],['See which programs listen on which ports','ss -tulpn'],['Restart a service','systemctl restart nginx'],['Read a service\'s log','journalctl -u nginx'],['Edit scheduled jobs','crontab -e'],['Change a file\'s owner','chown user:group file']];
      const [t,a] = pick(T); return mcq('linux',2,'Which command would you use to: <b>'+t+'</b>?', '<code>'+a+'</code>', T.map(x=>'<code>'+x[1]+'</code>'), '<code>'+a+'</code>'); }, {lookup:true})
 ]},
 code:{1:[
  sk('HTTP & APIs', ()=>{ const [c,m] = pick(HTTP); return Math.random()<.5
      ? mcq('code',1,'An API returns status <code>'+c+'</code>. What does it mean?', m, HTTP.map(x=>x[1]), c+' = '+m+'. 2xx success, 3xx redirect, 4xx client error, 5xx server error.')
      : mcq('code',1,'Which status code means: "'+m+'"?', c, HTTP.map(x=>x[0]), c+' = '+m+'.'); }, {lookup:true}),
  sk('Python', ()=>{ const kind = rnd(0,3);
      if(kind===0){ const a = rnd(7,40), b = rnd(2,6), r = Math.floor(a/b); return mcq('code',1,'What does Python print? <code>print('+a+' // '+b+')</code>', r, [r+1, r-1, (a/b).toFixed(1), a%b], '// is floor division: '+a+' ÷ '+b+' = '+(a/b).toFixed(2)+', rounded down to '+r+'.'); }
      if(kind===1){ const a = rnd(7,40), b = rnd(2,6), r = a%b; return mcq('code',1,'What does Python print? <code>print('+a+' % '+b+')</code>', r, [Math.floor(a/b), r+1, b-r===r?r+2:b-r, 0, 1], '% gives the remainder: '+a+' = '+b+' × '+Math.floor(a/b)+' + '+r+'.'); }
      if(kind===2){ const xs = shuffle(['web','db','vpn','dns','mail','pos']).slice(0,rnd(3,5)), i = rnd(-1, xs.length-1), r = xs[(i+xs.length)%xs.length];
        return mcq('code',1,'What does this print?<br><code>items = ['+xs.map(x=>'"'+x+'"').join(', ')+']</code><br><code>print(items['+i+'])</code>', r, xs, 'Python counts from 0'+(i<0?', and -1 means the last item':'')+', so items['+i+'] is "'+r+'" and print shows it without quotes.'); }
      const xs = Array.from({length:rnd(2,6)},()=>rnd(1,9)); return mcq('code',1,'What does Python print? <code>print(len(['+xs.join(', ')+']))</code>', xs.length, [xs.length+1, xs.length-1, xs.reduce((s,x)=>s+x,0), Math.max(...xs)], 'len() counts the items: '+xs.length+'.'); }),
  sk('Git', ()=>{ const T = [['Save a snapshot of staged changes','git commit -m "message"'],['Stage every changed file','git add .'],['Send your commits to GitHub','git push'],['Get teammates\' latest commits','git pull'],['See what changed and what is staged','git status'],['Create a branch and switch to it','git switch -c new-feature'],['See commit history in short form','git log --oneline'],['Safely undo a pushed commit','git revert &lt;commit&gt;']];
      const [t,a] = pick(T); return mcq('code',1,'Which Git command: <b>'+t+'</b>?', '<code>'+a+'</code>', T.map(x=>'<code>'+x[1]+'</code>'), '<code>'+a+'</code>'); }, {lookup:true})
 ],2:[
  sk('Regex', ()=>{ const n = rnd(100,999), msg = pick(['disk full','timeout','service stopped','login failed']);
      const P = [
        ['^ERROR', 'ERROR '+msg, ['INFO ERROR '+msg, 'error '+msg, ' ERROR '+msg]],
        ['\\d{3}$', 'code '+n, ['code '+n+' ok', 'code '+(n%100), 'code 12a']],
        ['^\\d{1,3}(\\.\\d{1,3}){3}$', ipStr(privIP()), ['10.0.'+rnd(0,255), 'host 10.0.0.'+rnd(1,254), '192.168.1.x']],
        ['\\.log$', 'app'+rnd(1,9)+'.log', ['app.log.1', 'app_log', 'log.txt']],
        ['^#', '# '+msg, ['echo # '+msg, msg+' #', ' x# '+msg]],
        ['^\\d{4}-\\d{2}-\\d{2}', '2026-10-'+pad2(rnd(10,28))+' '+msg, ['26-10-2026 '+msg, '2026/10/27 '+msg, 'on 2026-10-27 '+msg]],
        ['(failed|denied)', 'login '+pick(['failed','denied'])+' for root', ['login ok for root', 'Failed login', 'ACCESS DENIED']],
        ['^(GET|POST) /', pick(['GET','POST'])+' /login', ['get /login', 'PUT /login', ' GET /login']],
        ['^[A-Z]{3}-\\d{4}$', 'INC-'+rnd(1000,9999), ['inc-'+rnd(1000,9999), 'INC-'+rnd(10000,99999), 'INC '+rnd(1000,9999)]],
        ['\\bport (22|443)\\b', 'open port '+pick([22,443]), ['open port 2222', 'port 4430', 'open port 80']]];
      const [re, ok, bad] = pick(P), R = new RegExp(re);
      if(!R.test(ok) || bad.some(b=>R.test(b))) return null;
      return mcq('code',2,'Which line matches the regex <code>'+esc(re)+'</code>?', '<code>'+esc(ok)+'</code>', bad.map(b=>'<code>'+esc(b)+'</code>'),
        '^ = start of line, $ = end of line, \\d = a digit, {3} = exactly three, \\. = a literal dot.'); }, {lookup:true}),
  sk('Logging', ()=>{ const L = [['Disk is 90% full','WARNING'],['Payment service crashed','ERROR'],['User logged in','INFO'],['Variable x = 42 inside loop','DEBUG'],['Database is unreachable; nothing works','CRITICAL'],
        ['Retrying connection, attempt 2 of 5','WARNING'],['Server started on port 8080','INFO'],['Config file missing; using defaults','WARNING'],
        ['Order 1234 failed to save','ERROR'],['Request headers dumped for troubleshooting','DEBUG'],['Every server in the cluster is down','CRITICAL'],
        ['Nightly backup finished','INFO'],['Disk write failed; file not saved','ERROR'],['Function called with a=1, b=2','DEBUG'],['TLS certificate expires in 7 days','WARNING']];
      const [m,l] = pick(L); return mcq('code',2,'Which logging level fits: "'+m+'"?', l, ['DEBUG','INFO','WARNING','ERROR','CRITICAL'], m+' = '+l+'. DEBUG < INFO < WARNING < ERROR < CRITICAL.'); }, {lookup:true})
 ]},
 sql:{1:[], 2:[]}
};
/* ---- Security, IT Support and Testing generators ---- */
const CIA = [['A website is down for hours','Availability'],['A payroll file is emailed to the wrong person','Confidentiality'],['Someone changes a price in the database without permission','Integrity'],
  ['A server crashes and nobody can work','Availability'],['A customer list is accidentally made public','Confidentiality'],['A backup is corrupted and now holds wrong values','Integrity'],
  ['A laptop with unencrypted patient files is lost','Confidentiality'],['A power outage takes the POS system offline','Availability'],['A report\'s numbers are changed after it was approved','Integrity']];
const FACTORS = {'Something you know':['a password','a PIN','the answer to a security question'],'Something you have':['a code from an authenticator app','a hardware security key','a smart card','a code texted to your phone'],'Something you are':['a fingerprint','a face scan','a voice print']};
const CRYPTO = {hash:['SHA-256','SHA-1','MD5','bcrypt','Argon2'], sym:['AES','ChaCha20','3DES'], asym:['RSA','ECC']};
const EVENTS = [[4624,'A successful logon'],[4625,'A failed logon'],[4634,'A logoff'],[4720,'A user account was created'],[4726,'A user account was deleted'],[4740,'A user account was locked out'],[4672,'A logon with special (admin) privileges']];
const STEPS = ['Identify the problem','Establish a theory of probable cause','Test the theory','Make a plan of action','Implement the fix or escalate','Verify it works and prevent repeats','Document everything'];
const STLC = ['Requirement analysis','Test planning','Test case design','Test environment setup','Test execution','Test closure'];
const BUGFLOW = ['New','Assigned','Open','Fixed','Retest','Verified','Closed'];
const TOOLS = [['See which program is using all the CPU','Task Manager'],['Read system and application error logs','Event Viewer'],['Restart the Print Spooler','Services'],['Update or roll back a driver','Device Manager'],['Clear the DNS cache','ipconfig /flushdns'],['Pull the latest Group Policy now','gpupdate /force'],['Scan for and repair damaged system files','sfc /scannow'],['See drives and partitions','Disk Management']];
const ITIL = [['A laptop will not turn on','Incident'],['Outlook crashes every time it opens','Incident'],['The Wi-Fi is down in the break room','Incident'],['A new hire needs a laptop and accounts','Service request'],['Someone asks for access to a shared mailbox','Service request'],['A user asks to have Adobe Reader installed','Service request'],
  ['Find out why the VPN drops every Monday morning','Problem'],['The same printer fails every week; find the root cause','Problem'],['Upgrade the firewall firmware this weekend, with approval','Change'],['Move email to a new server next month','Change']];
const ADMIN = [['Reset a user\'s password or assign a license','Microsoft 365 admin center'],['Read a user\'s sign-in logs and Conditional Access results','Microsoft Entra admin center'],['Push an app or a policy to company laptops','Microsoft Intune admin center'],['Trace why an email never arrived (message trace)','Exchange admin center'],['Manage Teams policies and meeting settings','Teams admin center'],
  ['Change who outside the company can open SharePoint and OneDrive links','SharePoint admin center'],['Investigate a phishing alert on a user\'s laptop','Microsoft Defender portal'],
  ['Set a data loss prevention (DLP) or retention policy','Microsoft Purview portal'],['Require MFA for everyone with a Conditional Access policy','Microsoft Entra admin center'],
  ['Wipe a lost company phone','Microsoft Intune admin center'],['Add a new user and give them a Microsoft 365 license','Microsoft 365 admin center'],
  ['Create a shared mailbox for the front desk','Exchange admin center'],['See which Windows laptops are missing updates (compliance)','Microsoft Intune admin center']];
const TESTTYPES = [['A quick check that a new build\'s main features work','Smoke testing'],['Re-running existing tests after a change','Regression testing'],['Checking that the app and the payment API work together','Integration testing'],['Business users confirm it meets their needs before go-live','User acceptance testing (UAT)'],['Seeing how the site handles 1,000 users at once','Load / performance testing'],['Testing one function on its own','Unit testing'],['Time-boxed, unscripted testing to find surprises','Exploratory testing'],
  ['Checking that the login page works on Chrome, Safari and Firefox','Cross-browser testing'],['Trying SQL injection and weak passwords against the app','Security testing'],
  ['Checking a screen reader can use every form','Accessibility testing'],['Testing a single calculateTax() function with a test framework','Unit testing'],
  ['Running the full checkout flow end to end on a staging server','System testing'],['After a hotfix, re-running the old test suite to check nothing else broke','Regression testing']];
const LV3 = ['High','Medium','Low'];
GEN.sec = {1:[
  sk('CIA triad', ()=>{ const [s,a] = pick(CIA); return mcq('sec',1,'"'+s+'." Which part of the CIA triad is hurt most?', a, ['Confidentiality','Integrity','Availability','Authentication','Non-repudiation'],
      'Confidentiality = who can see it. Integrity = whether it is accurate and unchanged. Availability = whether it works when needed. Here: '+a+'.'); }, {lookup:true}),
  sk('Authentication & MFA', ()=>{ const types = Object.keys(FACTORS), t = pick(types), item = pick(FACTORS[t]);
      return mcq('sec',1,'Logging in with <b>'+item+'</b> is which type of authentication factor?', t, [...types, 'Somewhere you are'], item+' = '+t.toLowerCase()+'.'); }, {lookup:true}),
  sk('Authentication & MFA', ()=>{ const types = Object.keys(FACTORS), [t1,t2] = shuffle(types).slice(0,2), right = pick(FACTORS[t1])+' + '+pick(FACTORS[t2]);
      const same = ()=>{ const t = pick(types.filter(x=>FACTORS[x].length>1)); const [a,b] = shuffle(FACTORS[t]).slice(0,2); return a+' + '+b; };
      return mcq('sec',1,'Which login combination is true multi-factor authentication (MFA)?', right, [same(), same(), same(), same()],
        'MFA needs two DIFFERENT factor types. '+right+' combines '+t1.toLowerCase()+' and '+t2.toLowerCase()+'. Two of the same type is not MFA.'); }),
  sk('Cryptography', ()=>{ const k = pick(['hash','sym','asym']), right = pick(CRYPTO[k]);
      const others = Object.entries(CRYPTO).filter(([x])=>x!==k).flatMap(([,v])=>v);
      const name = {hash:'a <b>hashing</b> algorithm (one-way)', sym:'<b>symmetric</b> encryption (one shared key)', asym:'<b>asymmetric</b> encryption (public/private key pair)'}[k];
      return mcq('sec',1,'Which of these is '+name+'?', right, others,
        'Hashing: SHA-256, SHA-1, MD5, bcrypt, Argon2. Symmetric: AES, ChaCha20, 3DES. Asymmetric: RSA, ECC.'); }, {noType:true})
 ],2:[
  sk('Windows logs', ()=>{ const [id,m] = pick(EVENTS); return Math.random()<.5
      ? mcq('sec',2,'Windows Security Event ID <code>'+id+'</code> means:', m, EVENTS.map(x=>x[1]), id+' = '+m.toLowerCase()+'.')
      : mcq('sec',2,'Which Windows Event ID records: <b>'+m.toLowerCase()+'</b>?', id, EVENTS.map(x=>x[0]), m+' = '+id+'.'); }, {lookup:true}),
  sk('Vulnerabilities', ()=>{ const s = (rnd(1,100)/10).toFixed(1), v = +s, r = v>=9?'Critical':v>=7?'High':v>=4?'Medium':'Low';
      return mcq('sec',2,'A vulnerability has a CVSS score of <b>'+s+'</b>. What is its severity rating?', r, ['Low','Medium','High','Critical','None'],
        'CVSS ratings: 0.1–3.9 Low, 4.0–6.9 Medium, 7.0–8.9 High, 9.0–10.0 Critical. '+s+' is '+r+'.'); }),
  sk('Backups', ()=>{ const fail = rnd(0,3), copies = fail===1 ? rnd(1,2) : rnd(3,4), media = fail===2 ? 1 : rnd(2,3), off = fail===3 ? 0 : 1;
      const right = ['Yes, it meets 3-2-1','No: it needs at least 3 copies','No: it needs 2 different types of storage','No: it needs 1 copy offsite'][fail];
      return mcq('sec',2,'A backup plan keeps <b>'+copies+'</b> cop'+(copies===1?'y':'ies')+' of the data, on <b>'+media+'</b> type'+(media===1?'':'s')+' of storage, with <b>'+(off?'one copy offsite':'no copy offsite')+'</b>. Does it meet the 3-2-1 rule?', right,
        ['Yes, it meets 3-2-1','No: it needs at least 3 copies','No: it needs 2 different types of storage','No: it needs 1 copy offsite'],
        '3-2-1 = 3 copies, 2 types of storage, 1 offsite. This plan: '+copies+' copies, '+media+' type'+(media===1?'':'s')+', '+(off?'1':'0')+' offsite.'); })
 ]};
GEN.support = {1:[
  sk('Troubleshooting method', ()=>{ const i = rnd(0, STEPS.length-2); return mcq('support',1,'Troubleshooting method: what comes right after "<b>'+STEPS[i]+'</b>"?', STEPS[i+1], STEPS.filter((x,k)=>k!==i),
      'The 7 steps: '+STEPS.map((s,k)=>(k+1)+'. '+s).join(' ')); }),
  sk('Windows tools', ()=>{ const [t,a] = pick(TOOLS); return mcq('support',1,'Which Windows tool or command would you use to: <b>'+t+'</b>?', a, TOOLS.map(x=>x[1]), a+'.'); }, {lookup:true}),
  sk('Ticket priority', ()=>{ const im = rnd(0,2), ur = rnd(0,2), score = (3-im)+(3-ur), p = score>=6?'P1':score===5?'P2':score===4?'P3':'P4';
      const who = ['The whole restaurant (many users)','One team of about 5 people','One user'][im], how = ['Work is completely stopped right now','Work is slowed, but there is a workaround','It can wait; nothing is blocked'][ur];
      return mcq('support',1,'Using a standard impact × urgency matrix, what priority is this ticket?<br>• <b>Who is affected:</b> '+who+'<br>• <b>Urgency:</b> '+how, p, ['P1','P2','P3','P4'],
        'Impact '+LV3[im]+' + urgency '+LV3[ur]+'. High + High = P1. One High and one Medium = P2. Medium + Medium, or High + Low = P3. Lower than that = P4.'); })
 ],2:[
  sk('ITIL', ()=>{ const [s,a] = pick(ITIL); return mcq('support',2,'In ITIL terms, "'+s+'" is:', a, ['Incident','Service request','Problem','Change'],
      'Incident: something broke, restore service. Service request: a standard ask. Problem: find the root cause of repeat incidents. Change: a planned, approved modification.'); }, {lookup:true}),
  sk('Microsoft 365 admin', ()=>{ const [t,a] = pick(ADMIN); return mcq('support',2,'Where would you go to: <b>'+t+'</b>?', a, ADMIN.map(x=>x[1]), a+'.'); }, {lookup:true})
 ]};
GEN.qa = {1:[
  sk('Test design', ()=>{ const lo = rnd(1,50), hi = lo + rnd(5,100), mid = Math.round((lo+hi)/2);
      return mcq('qa',1,'A field accepts whole numbers from <b>'+lo+'</b> to <b>'+hi+'</b>. Which set is the best boundary-value test?', [lo-1,lo,hi,hi+1].join(', '),
        [[lo,hi].join(', '), [lo+1,hi-1].join(', '), String(mid), [lo-1,hi+1].join(', '), [0,mid,1000].join(', ')],
        'Test just outside and just inside each edge: '+(lo-1)+' (invalid), '+lo+' (valid), '+hi+' (valid), '+(hi+1)+' (invalid).'); }),
  sk('Test design', ()=>{ const lo = rnd(10,60), hi = lo + rnd(10,80), grp = pick(['valid','too low','too high']);
      const v = {valid:()=>rnd(lo+1,hi-1), 'too low':()=>rnd(Math.max(0,lo-30),lo-1), 'too high':()=>rnd(hi+1,hi+40)};
      const right = v[grp](), wrongs = Object.keys(v).filter(g=>g!==grp).flatMap(g=>[v[g](), v[g]()]);
      return mcq('qa',1,'A field accepts '+lo+' to '+hi+'. Using equivalence partitioning, which value belongs to the <b>'+grp+'</b> group?', right, wrongs,
        'The groups are: too low (below '+lo+'), valid ('+lo+' to '+hi+'), too high (above '+hi+'). '+right+' is '+grp+'.'); }, {noType:true}),
  sk('Test types', ()=>{ const [s,a] = pick(TESTTYPES); return mcq('qa',1,'"'+s+'" is called:', a, TESTTYPES.map(x=>x[1]), a+'.'); }, {lookup:true})
 ],2:[
  sk('Testing process', ()=>{ const i = rnd(0, STLC.length-2); return mcq('qa',2,'In the Software Testing Life Cycle, what comes right after "<b>'+STLC[i]+'</b>"?', STLC[i+1], STLC.filter((x,k)=>k!==i),
      'STLC order: '+STLC.join(' → ')+'.'); }),
  sk('Defect life cycle', ()=>{ const reopen = Math.random()<.3;
      if(reopen) return mcq('qa',2,'A bug is in <b>Retest</b>, and the retest <b>fails</b>. What happens next?', 'Reopened', ['Closed','Verified','New','Deferred'], 'If the fix does not work, the bug is Reopened and goes back to the developer.');
      const i = rnd(0, BUGFLOW.length-2); return mcq('qa',2,'In the defect life cycle, a bug is in <b>'+BUGFLOW[i]+'</b>. What is the next state (when everything goes well)?', BUGFLOW[i+1], BUGFLOW.filter((x,k)=>k!==i).concat(['Reopened']),
        'Life cycle: '+BUGFLOW.join(' → ')+' (or Reopened if the retest fails).'); }, {lookup:true})
 ]};

/* ---- More question types for skills that had only a few (2026-10-27) ---- */
const CRYPTO_USE = [['Check that a downloaded file was not changed','Hashing'],['Store user passwords so even admins can\'t read them','Hashing'],
  ['Detect whether a log file was tampered with by comparing fingerprints','Hashing'],['Encrypt a whole laptop disk quickly','Symmetric encryption'],
  ['Encrypt a large backup file with one shared secret key','Symmetric encryption'],['Encrypt traffic on a VPN tunnel after the keys are agreed','Symmetric encryption'],
  ['Let a browser and a website agree on a key over the internet','Asymmetric encryption'],['Digitally sign an email so others can prove it came from you','Asymmetric encryption'],
  ['Log in to a server with an SSH key pair','Asymmetric encryption'],['Put binary data inside a JSON field or an email attachment','Encoding (not encryption)']];
const CRYPTO_KIND = {hash:'Hashing (one-way)', sym:'Symmetric encryption', asym:'Asymmetric encryption'};
const STLC_OUT = [['The test plan: scope, schedule and who tests what','Test planning'],['Detailed test cases with steps and expected results','Test case design'],
  ['A requirements traceability matrix','Requirement analysis'],['A list of questions about unclear requirements','Requirement analysis'],
  ['A ready test server with test data loaded','Test environment setup'],['Bug reports from running the tests','Test execution'],
  ['A test summary report and lessons learned','Test closure'],['Pass/fail results recorded against each test case','Test execution']];
const TS_ACTS = [['You ask the user what changed and when the problem started','Identify the problem'],['You check whether others on the same floor have the issue','Identify the problem'],
  ['You reproduce the error on your own account','Identify the problem'],['Only one PC is offline, so you suspect its network cable','Establish a theory of probable cause'],
  ['You think last night\'s Windows update broke the printer driver','Establish a theory of probable cause'],['You swap the cable to see if the PC comes back online','Test the theory'],
  ['You roll the update back on one test PC to check','Test the theory'],['You schedule the server reboot for after closing and warn the users','Make a plan of action'],
  ['You replace the bad switch port, or hand it to the network team','Implement the fix or escalate'],['You confirm the user can print again and add the printer to monitoring','Verify it works and prevent repeats'],
  ['You write the cause and the fix in the ticket','Document everything']];
GEN.sec[1].push(
  sk('Cryptography', ()=>{ const [t,a] = pick(CRYPTO_USE); return mcq('sec',1,'Which fits this job best: <b>'+t+'</b>?', a, ['Hashing','Symmetric encryption','Asymmetric encryption','Encoding (not encryption)'],
      'Hashing = one-way fingerprint (integrity, passwords). Symmetric = one shared key, fast (disks, bulk data). Asymmetric = key pair (key exchange, signatures, SSH). Encoding = format only, no secrecy.'); }, {lookup:true}),
  sk('Cryptography', ()=>{ const k = pick(Object.keys(CRYPTO)), alg = pick(CRYPTO[k]); return mcq('sec',1,'<b>'+alg+'</b> is which kind of algorithm?', CRYPTO_KIND[k], [...Object.values(CRYPTO_KIND), 'Encoding (not encryption)'],
      alg+' is '+CRYPTO_KIND[k].toLowerCase()+'. Hashing: SHA-256, SHA-1, MD5, bcrypt, Argon2. Symmetric: AES, ChaCha20, 3DES. Asymmetric: RSA, ECC.'); }, {lookup:true})
);
GEN.qa[2].push(
  sk('Testing process', ()=>{ const [t,a] = pick(STLC_OUT); return mcq('qa',2,'Which Software Testing Life Cycle phase produces: <b>'+t+'</b>?', a, STLC, t+' comes out of '+a+'. Order: '+STLC.join(' → ')+'.'); }, {lookup:true})
);
GEN.support[1].push(
  sk('Troubleshooting method', ()=>{ const [t,a] = pick(TS_ACTS); return mcq('support',1,'Which troubleshooting step is this: <b>'+t+'</b>?', a, STEPS, 'This is "'+a+'". The 7 steps: '+STEPS.map((x,k)=>(k+1)+'. '+x).join(' ')); }, {lookup:true})
);

/* ---- Research discipline (from the trading research lab) and secrets handling ---- */
const RESEARCH_VERDICTS = ['Sound: rules fixed before results','Moving the goalposts','Cherry-picking','Overfitting'];
const PREREG = [
  ['You write the entry rules and the pass mark, run the test once, and report the result.', 0],
  ['You test 10 variants and publish all 10 results, losers included.', 0],
  ['After seeing the results, you lower the pass mark so the strategy passes.', 1],
  ['The test failed, so you change what "success" means and call it a pass.', 1],
  ['You try 200 settings and only report the best one.', 2],
  ['You drop the worst month from the results because it "looks unusual".', 2],
  ['You keep adjusting the stop-loss until last year\'s results look great.', 3],
  ['You add rules until the strategy wins every trade in your test data.', 3]
];
const HOLDOUT_VERDICTS = ['Still clean','Contaminated: it chose the rules','Contaminated: tested more than once','Contaminated: mixed into training'];
const HOLDOUT = [
  ['Rules are frozen, then the strategy runs once on the sealed months.', 0],
  ['The sealed months stay untouched while you develop on earlier years.', 0],
  ['You glance at the sealed months\' chart, then pick a different moving average.', 1],
  ['You pick the best of 5 strategies by their score on the sealed months.', 1],
  ['It failed on the sealed months, so you tweak it and run them again.', 2],
  ['You add the sealed months to the training data to get more examples.', 3]
];
const SECRET_ACTIONS = ['Revoke and rotate it first, then remove it from the code and history','Read it without running it until it has been reviewed','Keep it outside the repo, in an environment variable or secrets manager','Stop the commit and move the secret out of the file'];
const SECRETS = [
  ['A teammate finds a live API key that was committed to GitHub last week.', 0],
  ['An access token was pasted into a public chat by mistake.', 0],
  ['You download a script from a forum and want to know what it does.', 1],
  ['Someone sends you a "quick fix" script to run on the server.', 1],
  ['Your app needs an API key to run. Where should the key live?', 2],
  ['Where should the production database password be stored?', 2],
  ['A pre-commit scan flags a password in a file you are about to commit.', 3],
  ['Your preflight check finds a .env file with a key staged for commit.', 3]
];
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const monthName = (m,y)=>{ while(m<0){ m+=12; y--; } while(m>11){ m-=12; y++; } return MON[m]+' '+y; };
GEN.qa[2].push(
  sk('Pre-registration', ()=>{ const [s,v] = pick(PREREG); return mcq('qa',2,'A strategy test: "'+s+'" Which describes it?', RESEARCH_VERDICTS[v], RESEARCH_VERDICTS,
      ['Fixing the rules and the pass mark before seeing results, and reporting every run, is what makes a test honest.','Changing the pass mark after seeing results is moving the goalposts: the test can no longer fail.','Reporting only the best run, or removing bad data, is cherry-picking: luck looks like skill.','Tuning rules until the past looks perfect is overfitting: it memorizes history and fails on new data.'][v]); }, {lookup:true}),
  sk('Walk-forward testing', ()=>{ const y0 = rnd(2012,2018), span = rnd(6,10), y1 = y0+span-1, tr = rnd(2,4), folds = span-tr;
      if(Math.random()<.5) return mcq('qa',2,'Walk-forward test on yearly data from <b>'+y0+'</b> to <b>'+y1+'</b>: train on <b>'+tr+'</b> years, test on the <b>next 1</b> year, then roll forward 1 year. How many test years (folds) are there?', folds, [folds-1, folds+1, folds+2, span, tr],
        'The first test year is '+(y0+tr)+', right after '+tr+' training years. Test years run from '+(y0+tr)+' to '+y1+': '+folds+' folds.');
      const k = rnd(1,folds), ts = y0+tr+k-1;
      return mcq('qa',2,'Walk-forward on '+y0+' to '+y1+', training on '+tr+' years and testing on the next 1, rolling forward 1 year. In fold <b>'+k+'</b>, which year is the <b>test</b> year?', ts, [ts-1, ts+1, y0+k-1, y1],
        'Fold '+k+' trains on '+(ts-tr)+' to '+(ts-1)+', then tests on the next unseen year: '+ts+'. A test year is never in its own training data.'); }),
  sk('Holdout data', ()=>{ if(Math.random()<.5){ const [s,v] = pick(HOLDOUT); return mcq('qa',2,'Holdout ("sealed") data: "'+s+'" Is the holdout still a fair test?', HOLDOUT_VERDICTS[v], HOLDOUT_VERDICTS,
        ['Still clean: the holdout is used once, after the rules are frozen.','Looking at the holdout to choose or tweak rules lets it shape the strategy, so it no longer tests anything new.','Re-running the holdout after changes turns it into a second training set.','Data used for training can never be a fair test of the same model.'][v]); }
      const endY = rnd(2023,2026), endM = rnd(0,11), k = rnd(3,9), right = monthName(endM-k+1, endY);
      return mcq('qa',2,'Your data runs through <b>'+MON[endM]+' '+endY+'</b>. You seal the last <b>'+k+' months</b> as a holdout nobody looks at until the rules are frozen. What is the <b>first</b> sealed month?', right,
        [monthName(endM-k, endY), monthName(endM-k+2, endY), monthName(endM-k+1, endY-1), monthName(endM-k-1, endY)],
        'Count back '+k+' months ending in '+MON[endM]+' '+endY+': the sealed period starts in '+right+'. Everything before it is development data.'); }, {lookup:true})
);
GEN.sec[2].push(
  sk('Secrets & untrusted code', ()=>{ const [s,v] = pick(SECRETS); return mcq('sec',2,'"'+s+'" What is the right move?', SECRET_ACTIONS[v], SECRET_ACTIONS,
      ['Once a secret is exposed, deleting it is not enough: anyone may have copied it. Revoke and rotate first, then clean the code and history.','Untrusted code is read and reviewed before it ever runs; running it is how malware gets in.','Secrets live outside the code (environment variables or a secrets manager), so the repo never holds them.','Catch it before it is committed: stop, move the secret out, and only then commit.'][v]); }, {lookup:true})
);

/* ---- Security foundations: access control, attack types, firewalls, incident response ---- */
const ACM = [
  ['Everyone in the "Nurses" group gets the same chart access because of their job.', 'RBAC (role-based)'],
  ['A new hire in Support is added to the Support group and gets the support tools automatically.', 'RBAC (role-based)'],
  ['Payroll can be opened only by Finance staff, on a company laptop, during work hours.', 'ABAC (attribute-based)'],
  ['The HR app allows access only from a managed device located in the US.', 'ABAC (attribute-based)'],
  ['The owner of a shared folder decides who else can open it.', 'DAC (discretionary)'],
  ['You share your own document with a coworker from its Share menu.', 'DAC (discretionary)'],
  ['Files carry labels like Secret and Top Secret; only matching clearances can read them, and users cannot change the labels.', 'MAC (mandatory)']
];
const ACM_ALL = ['RBAC (role-based)','ABAC (attribute-based)','DAC (discretionary)','MAC (mandatory)'];
const PRINC = [
  ['One employee can both add a new vendor and approve payments to it.', 'Separation of duties'],
  ['An admin writes a firewall change and approves it themselves.', 'Separation of duties'],
  ['A new intern gets domain admin "so they won\'t need to ask."', 'Least privilege'],
  ['The backup app\'s service account is a full admin on every server.', 'Least privilege'],
  ['The only protection is the perimeter firewall: no MFA, no endpoint protection, no backups.', 'Defense in depth'],
  ['Five techs share one admin login, so nobody can tell who made a change.', 'Accountability']
];
const PRINC_ALL = ['Least privilege','Separation of duties','Defense in depth','Accountability'];
const ATK = [
  ['A text message says a package is held and links to a fake delivery site.', 'Smishing'],
  ['A caller claiming to be the help desk asks for your MFA code.', 'Vishing'],
  ['An email that looks like it\'s from the CEO urgently asks you to buy gift cards.', 'Phishing'],
  ['Files on a shared drive are renamed *.locked and a note demands payment.', 'Ransomware'],
  ['A website goes down as traffic floods in from thousands of machines at once.', 'DDoS'],
  ['On public Wi-Fi, an attacker relays and reads traffic between a laptop and a website.', 'On-path (man-in-the-middle)'],
  ['A free "PDF converter" download also installs a hidden remote-access tool.', 'Trojan'],
  ['A login form passes user input straight into a database query, so input can change the query.', 'SQL injection'],
  ['A comment box saves text that later runs as script in other visitors\' browsers.', 'Cross-site scripting (XSS)']
];
const ATK_ALL = ATK.map(a=>a[1]).filter((v,i,a)=>a.indexOf(v)===i);
const LOGIN_CAUSE = {brute:'Brute force', spray:'Password spraying', stuff:'Credential stuffing', typo:'A user mistyping their password'};
const LOGIN_WHY = {
  brute:'One account, many passwords: brute force. Defense: account lockout or throttling, MFA, strong passwords.',
  spray:'Many accounts, one password: password spraying. It stays under per-account lockout limits, so count distinct accounts per source.',
  stuff:'Many accounts, each tried once with its own password: credential stuffing with pairs leaked elsewhere. Defense: MFA and blocking breached passwords.',
  typo:'A couple of failures on one account is normal: someone mistyping. No incident, but watch for it repeating.'
};
const ipNum = s=>s.split('.').reduce((a,b)=>a*256 + +b, 0);
function inCidr(ip, cidr){ const [n,b] = cidr.split('/'), m = +b === 0 ? 0 : (0xFFFFFFFF << (32 - +b)) >>> 0; return ((ipNum(ip) & m) >>> 0) === ((ipNum(n) & m) >>> 0); }
const FW_STATEFUL = ['Lets reply traffic back in automatically because it tracks connections.', 'Keeps a table of active connections and checks packets against it.', 'Most cloud security groups: responses to allowed requests return without an extra rule.'];
const FW_STATELESS = ['Judges every packet on its own, so return traffic needs its own rule.', 'A basic router ACL (access control list) that checks only each packet\'s header.', 'An AWS network ACL, which needs rules for traffic in both directions.'];
const IR_STEPS = ['Preparation','Detection','Analysis','Containment','Eradication','Recovery','Lessons learned'];
const IR_ACTS = [
  ['Writing the incident response plan and call list before anything happens', 'Preparation'],
  ['Making sure logging is on and backups are tested', 'Preparation'],
  ['An EDR alert fires for unusual mass file encryption', 'Detection'],
  ['A user reports a pop-up demanding payment', 'Detection'],
  ['Checking whether the alert is real and how many machines are affected', 'Analysis'],
  ['Disconnecting the infected laptop from the network', 'Containment'],
  ['Disabling a compromised account while you investigate', 'Containment'],
  ['Removing the malware and closing the hole it came in through', 'Eradication'],
  ['Restoring files from a clean backup and watching for signs of return', 'Recovery'],
  ['Meeting afterward to decide what to change so it doesn\'t happen again', 'Lessons learned']
];
GEN.sec[1].push(
  sk('Least privilege & access control', ()=>{ const [s,a] = pick(ACM); return mcq('sec',1,'"'+s+'" Which access control model is this?', a, ACM_ALL,
      'RBAC = by job role. ABAC = by attributes (department, device, time, location). DAC = the owner decides. MAC = labels set by policy that users cannot change. Here: '+a+'.'); }, {lookup:true}),
  sk('Least privilege & access control', ()=>{ const [s,a] = pick(PRINC); return mcq('sec',1,'"'+s+'" Which principle does this break?', a, PRINC_ALL,
      {'Separation of duties':'Risky work should need two people, so one person can\'t both do and approve it.', 'Least privilege':'Give only the access the job needs, for as long as it is needed.',
       'Defense in depth':'Layer several controls so one failure isn\'t fatal.', 'Accountability':'Individual accounts and logs show who did what; shared logins hide it.'}[a]); }, {lookup:true, noType:true}),
  sk('Attack types', ()=>{ const [s,a] = pick(ATK); return mcq('sec',1,'"'+s+'" What kind of attack is this?', a, ATK_ALL,
      a+'. Recognizing the attack tells you the first move: report and block phishing, isolate for ransomware, fix input handling for injection.'); }, {lookup:true, noType:true}),
  sk('Attack types', ()=>{ const kind = pick(Object.keys(LOGIN_CAUSE)); let fails, users, pws;
      if(kind==='brute'){ users = 1; fails = rnd(25,90); pws = fails; }
      else if(kind==='spray'){ users = rnd(15,80); fails = users; pws = 1; }
      else if(kind==='stuff'){ users = rnd(15,80); fails = users; pws = users; }
      else { users = 1; fails = rnd(2,3); pws = rnd(1,2); }
      return mcq('sec',1,'In 10 minutes from one IP address: <b>'+fails+'</b> failed logins, across <b>'+users+'</b> account'+(users>1?'s':'')+', using <b>'+pws+'</b> '+(pws>1?'different passwords':'password')+'. What is the most likely cause?',
        LOGIN_CAUSE[kind], Object.values(LOGIN_CAUSE), LOGIN_WHY[kind]); }),
  sk('Firewalls', ()=>{ const admin = '10.'+rnd(0,9)+'.'+rnd(0,255)+'.0/24', svc = pick([22,3389,3306,445]), web = pick([80,443]);
      const rules = [['allow', admin, svc], ['deny', 'any', svc], ['allow', 'any', web], ['deny', 'any', 'any']];
      if(Math.random() < .35){ const t = rules[0]; rules[0] = rules[1]; rules[1] = t; }   /* sometimes the deny sits first and blocks the admins too */
      const insider = admin.replace('.0/24', '.'+rnd(2,250)), outsider = pick(['198.51.100.','203.0.113.'])+rnd(2,250);
      const src = pick([insider, outsider]), port = pick([svc, svc, web, 8080]);
      const hit = rules.findIndex(r=>(r[1]==='any' || inCidr(src, r[1])) && (r[2]==='any' || r[2]===port));
      const say = i=>(rules[i][0]==='allow' ? 'Allowed' : 'Denied')+' by rule '+(i+1);
      return mcq('sec',1,'Firewall rules (checked top to bottom, first match wins):'+tableHTML(['#','Action','Source','Port'], rules.map((r,i)=>[i+1, r[0], r[1], r[2]]))+
        'A packet from <code>'+src+'</code> to port <code>'+port+'</code> arrives. What happens?', say(hit), rules.map((r,i)=>say(i)),
        'Rule '+(hit+1)+' is the first one that matches source '+src+' and port '+port+', so the packet is '+(rules[hit][0]==='allow'?'allowed':'denied')+'. Rules below it never run.'); }),
  sk('Firewalls', ()=>{ const stateful = Math.random() < .5, right = pick(stateful ? FW_STATEFUL : FW_STATELESS);
      return mcq('sec',1,'Which statement describes a <b>'+(stateful?'stateful':'stateless')+'</b> firewall?', right, stateful ? FW_STATELESS : FW_STATEFUL,
        'Stateful firewalls track connections, so replies to allowed traffic come back in. Stateless ones judge each packet alone and need rules for both directions.'); }, {lookup:true})
);
GEN.sec[2].push(
  sk('Incident response', ()=>{ const [s,a] = pick(IR_ACTS); return mcq('sec',2,'"'+s+'." Which incident response step is this?', a, IR_STEPS,
      'Preparation, Detection, Analysis, Containment, Eradication, Recovery, Lessons learned. This one is '+a+'.'); }, {lookup:true}),
  sk('Incident response', ()=>{ const i = rnd(0, IR_STEPS.length-2); return mcq('sec',2,'In incident response, what comes right after "'+IR_STEPS[i]+'"?', IR_STEPS[i+1], IR_STEPS,
      'The order: '+IR_STEPS.join(' → ')+'. Contain before you eradicate, and recover only once the cause is gone.'); })
);
/* SSH hardening (Phase 5, with the ssh-harden lab). OpenSSH uses the FIRST value it reads for a setting; Ubuntu's
   sshd_config includes sshd_config.d/*.conf at the top, in name order, so a drop-in beats the main file. */
const SSH_SETTINGS = [
  ['PermitRootLogin no', 'Nobody can sign in directly as root'],
  ['PasswordAuthentication no', 'Passwords are refused; keys must be used'],
  ['MaxAuthTries 3', 'A connection is dropped after 3 failed attempts'],
  ['AllowUsers deploy admin', 'Only these two accounts may sign in over SSH'],
  ['PubkeyAuthentication yes', 'Signing in with an SSH key is allowed']
];
const SSH_DROPINS = ['10-hardening.conf', '50-cloud-init.conf', '60-admin.conf', '90-local.conf'];
GEN.sec[2].push(
  sk('SSH hardening', ()=>{ const files = shuffle(SSH_DROPINS).slice(0, 3).sort(), lines = {};
      files.forEach(f=>{ lines[f] = Math.random() < .5 ? ['PasswordAuthentication '+pick(['yes','no'])] : ['MaxAuthTries '+pick([3,4,6])]; });
      if(!files.some(f=>lines[f][0].startsWith('Password')) && Math.random() < .5) lines[files[2]] = ['PasswordAuthentication yes'];
      const main = ['Include /etc/ssh/sshd_config.d/*.conf', 'PermitRootLogin no', 'PasswordAuthentication '+pick(['yes','no'])];
      const right = files.find(f=>lines[f][0].startsWith('PasswordAuthentication')) || 'sshd_config';
      const show = files.map(f=>'== sshd_config.d/'+f+' ==\n'+lines[f].join('\n')).join('\n')+'\n== sshd_config ==\n'+main.join('\n');
      return mcq('sec',2,'An Ubuntu server\'s SSH config:<pre>'+show+'</pre>Which file\'s line decides whether passwords are allowed?', right, files.concat('sshd_config'),
        'sshd keeps the first value it reads. The Include at the top pulls in sshd_config.d/*.conf in name order before the rest of sshd_config, so the first drop-in that sets PasswordAuthentication wins.'); }, {noType:true}),
  sk('SSH hardening', ()=>{ const [l, e] = pick(SSH_SETTINGS); return mcq('sec',2,'What does <code>'+l+'</code> do in sshd_config?', e, SSH_SETTINGS.map(x=>x[1]),
      'Typical hardening: keys instead of passwords, no direct root login, a limited list of allowed users, few attempts per connection.'); }, {lookup:true, noType:true})
);

/* ---- Cloud Security (path track; opens once Security and Networking foundations are solid) ---- */
const RESP = [
  ['IaaS (a virtual server you rent)', 'Patching the server\'s operating system', 'You (the customer)'],
  ['IaaS (a virtual server you rent)', 'Physical security of the data center', 'The cloud provider'],
  ['IaaS (a virtual server you rent)', 'Patching the hypervisor the servers run on', 'The cloud provider'],
  ['IaaS (a virtual server you rent)', 'Deciding which ports are open in the firewall rules', 'You (the customer)'],
  ['PaaS (a managed database service)', 'Patching the database engine', 'The cloud provider'],
  ['PaaS (a managed database service)', 'Choosing who is allowed to read the data', 'You (the customer)'],
  ['SaaS (a hosted email service)', 'Patching the email application servers', 'The cloud provider'],
  ['SaaS (a hosted email service)', 'Turning on MFA for your users', 'You (the customer)'],
  ['Any service model', 'Classifying and protecting your own data', 'You (the customer)']
];
const RESP_ALL = ['You (the customer)', 'The cloud provider', 'Neither: the service handles it on its own', 'The internet service provider'];
const IAM_TERMS = [
  ['Temporary credentials that an app or server takes on, instead of a stored key', 'Role'],
  ['The account\'s first, all-powerful login: protect it with MFA and don\'t use it day to day', 'Root user'],
  ['A long-lived ID and secret pair used by scripts; avoid it when a role can be used', 'Access key'],
  ['A JSON document that lists Effect, Action and Resource', 'Policy'],
  ['A collection of users who get the same permissions', 'Group']
];
const IAM_ALL = IAM_TERMS.map(t=>t[1]);
const IAM_RESULTS = ['Allowed', 'Denied: an explicit Deny matches', 'Denied: nothing allows it (implicit deny)', 'It depends on the order of the statements'];
const IAM_ACTIONS = ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'];
const iamMatch = (pattern, value)=>pattern === '*' || (pattern.endsWith('*') ? value.startsWith(pattern.slice(0, -1)) : pattern === value);
const LOG_SOURCES = [
  ['Who deleted a storage bucket yesterday (AWS)', 'AWS CloudTrail'],
  ['Which user signed in from a new country (Microsoft cloud)', 'Microsoft Entra sign-in logs'],
  ['Who deleted a virtual machine (Azure)', 'Azure Activity Log'],
  ['Which IP addresses talked to a server, and on which ports (AWS)', 'VPC Flow Logs']
];
const LOG_ALL = LOG_SOURCES.map(l=>l[1]);
const TRAIL_USERS = ['j.lee', 'm.ortiz', 'build-bot', 'a.khan', 's.patel', 'backup-svc'];
const MISCONF = [
  ['A storage bucket with customer files allows public read.', 'Turn on Block Public Access and remove the public policy'],
  ['SSH (port 22) on a web server is open to 0.0.0.0/0.', 'Limit port 22 to an admin range, or use a managed access tool instead'],
  ['Audit logging (CloudTrail) is turned off in one region.', 'Turn on a multi-region trail for the whole organization'],
  ['Database snapshots are shared publicly.', 'Make the snapshots private and find out who shared them'],
  ['An access key is 400 days old and hasn\'t been used in months.', 'Deactivate and then delete the unused key'],
  ['Disks holding customer data are not encrypted.', 'Turn on encryption by default and move the data to encrypted disks']
];
const MISCONF_ALL = MISCONF.map(m=>m[1]);
const SG_RESULTS = ['Yes: a rule allows it from 0.0.0.0/0', 'No: that port is allowed only from a private range', 'No: no inbound rule allows that port', 'Yes: security groups allow all inbound traffic by default'];
const NACL_FACTS = ['Applies to a whole subnet', 'Stateless: return traffic needs its own rule', 'Rules are numbered and the lowest matching number wins', 'Can have explicit deny rules'];
const SG_FACTS = ['Attached to an individual server\'s network interface', 'Stateful: replies to allowed traffic come back automatically', 'Allow rules only, and every rule is considered', 'Can use another security group as a rule\'s source'];
const KEY_STEPS = ['Deactivate the key and issue a new one', 'Check the audit log for everything the key did', 'Remove the key from the code and its history', 'Turn on secret scanning so it can\'t happen again'];
const KEY_ACTS = [
  ['The key works right now and anyone could use it', 'Deactivate the key and issue a new one'],
  ['You need to know whether someone already used the key', 'Check the audit log for everything the key did'],
  ['The key still sits in an old commit in the repository', 'Remove the key from the code and its history'],
  ['You want the next leaked key caught before it is pushed', 'Turn on secret scanning so it can\'t happen again']
];
const ENC_TERMS = [
  ['Encryption keys created and controlled by you in the provider\'s key service, with your own key policy', 'Customer managed key'],
  ['Encrypting data with a data key, then encrypting that data key with a key held in the key service', 'Envelope encryption'],
  ['Replacing key material on a schedule so one key protects less data over time', 'Key rotation'],
  ['Protecting data as it travels over the network', 'Encryption in transit'],
  ['Protecting data stored on disks, databases and backups', 'Encryption at rest']
];
const ENC_ALL = ENC_TERMS.map(t=>t[1]);
GEN.cloud = {1:[
  sk('Shared responsibility', ()=>{ const [model, task, who] = pick(RESP); return mcq('cloud',1,'<b>'+model+'</b>: who is responsible for <b>'+task.toLowerCase()+'</b>?', who, RESP_ALL,
      'The provider secures the cloud itself (buildings, hardware, the virtualization layer, and more of the stack as you go from IaaS to PaaS to SaaS). You always own your data, your users\' access and your settings.'); }, {lookup:true, noType:true}),
  sk('IAM & least privilege', ()=>{ const [d, t] = pick(IAM_TERMS); return mcq('cloud',1,'"'+d+'." What is this called in cloud IAM?', t, IAM_ALL,
      'Role = temporary credentials. Root user = the all-powerful first login. Access key = a long-lived secret for scripts. Policy = the JSON permission document. Group = users who share permissions.'); }, {lookup:true}),
  sk('IAM & least privilege', ()=>{ const res = ['arn:aws:s3:::reports/*', 'arn:aws:s3:::payroll/*', '*'], acts = ['s3:GetObject', 's3:PutObject', 's3:DeleteObject', 's3:Get*', 's3:*'];
      const n = rnd(1,3), stmts = [];
      for(let i=0;i<n;i++) stmts.push({Effect: i===0 ? 'Allow' : pick(['Allow','Deny']), Action: pick(acts), Resource: pick(res)});
      const action = pick(IAM_ACTIONS), resource = 'arn:aws:s3:::'+pick(['reports/q3.pdf', 'payroll/june.csv']);
      const hits = stmts.filter(s=>iamMatch(s.Action, action) && iamMatch(s.Resource, resource));
      const right = hits.some(s=>s.Effect==='Deny') ? IAM_RESULTS[1] : hits.some(s=>s.Effect==='Allow') ? IAM_RESULTS[0] : IAM_RESULTS[2];
      return mcq('cloud',1,'This is the only policy on a user (same account; no bucket policy, SCP or permissions boundary applies):<pre>'+JSON.stringify({Version:'2012-10-17', Statement:stmts}, null, 1)+'</pre>Request: <code>'+action+'</code> on <code>'+resource+'</code>. What happens?', right, IAM_RESULTS,
        'IAM checks every statement: an explicit Deny that matches always wins; otherwise a matching Allow allows it; if nothing matches, the default is deny. Statement order never matters.'); }, {noType:true}),
  sk('Audit logging', ()=>{ const [q, src] = pick(LOG_SOURCES); return mcq('cloud',1,'Which log answers this: <b>'+q+'</b>?', src, LOG_ALL,
      'CloudTrail and the Azure Activity Log record control-plane actions (who changed what). Entra sign-in logs record sign-ins. VPC Flow Logs record network connections, not who made changes.'); }, {lookup:true, noType:true}),
  sk('Audit logging', ()=>{ const user = pick(TRAIL_USERS), ip = pick(['198.51.100.','203.0.113.'])+rnd(2,250), ev = pick(['DeleteBucket','CreateAccessKey','StopLogging','AttachUserPolicy']);
      const rec = {eventTime:'2026-10-'+pad2(rnd(1,28))+'T'+pad2(rnd(0,23))+':'+pad2(rnd(0,59))+':00Z', eventName:ev, userIdentity:{type:'IAMUser', userName:user}, sourceIPAddress:ip, awsRegion:'us-east-1'};
      /* wrong "who" options come from the record itself, so the answer can't be found by spotting the only familiar name */
      const askWho = Math.random() < .5, others = askWho ? [user, 'IAMUser', ev, 'us-east-1'] : [ip, '10.0.0.'+rnd(2,250), '198.51.100.'+rnd(2,250), '203.0.113.'+rnd(2,250), '192.0.2.'+rnd(2,250)];
      return mcq('cloud',1,'A CloudTrail record:<pre>'+JSON.stringify(rec, null, 1)+'</pre>'+(askWho ? 'Who made this call?' : 'From which IP address was the call made?'), askWho ? user : ip, others,
        'In a CloudTrail record, userIdentity says who made the call, sourceIPAddress where it came from, eventName what they did, and eventTime when.'); }),
  sk('Misconfigurations', ()=>{ const [f, fix] = pick(MISCONF); return mcq('cloud',1,'A posture scan reports: "'+f+'" What is the right fix?', fix, MISCONF_ALL,
      'Misconfigurations are among the most common causes of cloud breaches. Posture tools find them; the fix removes the exposure at its source.'); }, {lookup:true, noType:true}),
  sk('Security groups & NACLs', ()=>{ const port = pick([22, 3389, 443, 3306]), other = pick([80, 8080, 5432].filter(p=>p!==port));
      const kind = pick(['open', 'private', 'none']);
      const rules = [[other===80?'HTTP':'Custom TCP', other, '0.0.0.0/0']];
      if(kind==='open') rules.push(['Custom TCP', port, '0.0.0.0/0']);
      if(kind==='private') rules.push(['Custom TCP', port, '10.'+rnd(0,9)+'.0.0/16']);
      const right = {open:SG_RESULTS[0], private:SG_RESULTS[1], none:SG_RESULTS[2]}[kind];
      return mcq('cloud',1,'A security group\'s inbound rules:'+tableHTML(['Type','Port','Source'], shuffle(rules))+'Does this security group allow inbound traffic from anywhere on the internet to port <code>'+port+'</code>?', right, SG_RESULTS,
        'Security groups deny inbound traffic unless a rule allows it. 0.0.0.0/0 means every IPv4 address; a private range such as 10.x.0.0/16 covers only your own network. (Actually reaching the server also needs a public IP, a route and the network ACL.)'); }),
  sk('Security groups & NACLs', ()=>{ const nacl = Math.random() < .5, right = pick(nacl ? NACL_FACTS : SG_FACTS);
      return mcq('cloud',1,'Which statement is true of an AWS <b>'+(nacl ? 'network ACL' : 'security group')+'</b>?', right, nacl ? SG_FACTS : NACL_FACTS,
        'Security groups: per server, stateful, allow-only, every rule considered. Network ACLs: per subnet, stateless, numbered rules where the lowest match wins, allow and deny.'); }, {lookup:true})
], 2:[
  sk('Leaked key response', ()=>{ const [s, a] = pick(KEY_ACTS); return mcq('cloud',2,'A cloud access key was pushed to a public repository. "'+s+'." Which step handles that?', a, KEY_STEPS,
      'Order: deactivate and replace the key, check the audit log for what it did, clean it out of the code and history, then add secret scanning.'); }, {lookup:true, noType:true}),
  sk('Leaked key response', ()=>{ const i = rnd(0, KEY_STEPS.length-2); return mcq('cloud',2,'After a key leak, what comes right after "'+KEY_STEPS[i]+'"?', KEY_STEPS[i+1], KEY_STEPS,
      'Contain first (deactivate), then investigate (audit log), then clean up (code and history), then prevent (secret scanning).'); }, {noType:true}),
  sk('Encryption & key management', ()=>{ const [d, t] = pick(ENC_TERMS); return mcq('cloud',2,'"'+d+'." What is this called?', t, ENC_ALL,
      'At rest = stored data; in transit = data on the network (TLS). A customer managed key gives you control over its policy and rotation; envelope encryption wraps data keys with a KMS key.'); }, {lookup:true, noType:true})
]};

/* ---- Offensive Security: concepts, authorization and defense only (no payloads or tool commands; see
   tests/feature-offsec-safety.js). OWASP categories by name, never by rank number. ---- */
const ROE_RESULTS = ['Yes: in scope and inside the testing window', 'No: the target is out of scope', 'No: the target is explicitly excluded', 'No: outside the testing window'];
const SCOPE_ACTS = [
  ['The client\'s website runs on a marketing agency\'s server', 'Get the hosting agency\'s own written permission before touching its server'],
  ['A system you are testing starts failing in production', 'Stop and call the emergency contact in the rules of engagement'],
  ['You notice a server outside the agreed address ranges', 'Don\'t test it; note it and tell the client contact'],
  ['The client says "just test whatever you can reach"', 'Turn the verbal OK into a signed scope listing exact targets, exclusions and a window'],
  ['You come across files full of customer personal data', 'Stop viewing them, keep only minimal redacted evidence, and follow the data-handling rules']
];
const ENGAGE = [
  ['An automated tool checks 2,000 servers for missing patches every quarter', 'Vulnerability scan'],
  ['Testers have two weeks to prove which weaknesses in one web app can really be exploited', 'Penetration test'],
  ['A small team spends a month trying to reach payroll data while the defenders aren\'t told', 'Red team exercise'],
  ['Attackers and defenders sit together, run a technique, and tune the alert until it fires', 'Purple team exercise'],
  ['Outside researchers are paid for each valid issue they report under a published policy', 'Bug bounty program']
];
const INJ_FIX = [
  ['User input is joined into the text of a SQL query', 'Use parameterized queries'],
  ['A filename typed by the user is pasted into a shell command the server runs', 'Run the program without a shell, pass arguments as a list, and validate the filename'],
  ['Comments are shown on the page exactly as typed, and some run as script in other users\' browsers', 'Encode output for the page context and add a Content Security Policy'],
  ['An error page shows the full database error to every visitor', 'Show a generic error and log the details on the server']
];
const SQL_STYLES = {concat:'Vulnerable: the input is concatenated into the query text', fstring:'Vulnerable: an f-string builds the query from the input', percent:'Vulnerable: %-formatting puts the input into the query text', param:'Safe: the value is passed separately as a parameter'};
const OWASP_CASES = [
  ['Any logged-in user can open /admin/users by typing the address', 'Broken access control'],
  ['Changing the order number in the URL shows another customer\'s order', 'Broken access control'],
  ['The login form allows unlimited guesses and has no MFA', 'Authentication failures'],
  ['Sessions stay valid after the user logs out', 'Authentication failures'],
  ['Sample apps that ship with the web server were never removed from production', 'Security misconfiguration'],
  ['Comments run as script in other users\' browsers because the page shows them exactly as typed', 'Injection'],
  ['Customer card data is sent over plain HTTP', 'Cryptographic failures']
];
const OWASP_ALL = ['Broken access control', 'Authentication failures', 'Security misconfiguration', 'Cryptographic failures', 'Injection'];
const AC_RESULTS = ['Yes: it is the user\'s own invoice', 'Yes: support admins may view any invoice', 'No: it belongs to another customer', 'Yes: the user is logged in, so any invoice is allowed'];
const PW_DEF = [
  ['Password hashes were stolen and are being guessed offline at full speed', 'Store passwords with a salted, slow hash such as bcrypt or Argon2'],
  ['A user gets 14 MFA push prompts at 2 a.m. and finally taps Approve', 'Turn on number matching and alert on bursts of denied prompts'],
  ['Hundreds of wrong passwords hit one account within a minute', 'Rate-limit sign-ins to that account and alert on the burst'],
  ['Several users\' passwords appear in a public breach list', 'Block breached passwords and make those users reset'],
  ['Users change passwords every 90 days as Spring1, Summer1, Fall1', 'Drop forced rotation; require long passphrases and breached-password checks']
];
const CRACK_TIME = ['Under a minute', 'Under a day', 'Under a year', 'A year or more'];
const TACTICS = [
  ['Researching employees on professional networking sites before an attack', 'Reconnaissance'],
  ['A malicious attachment arrives in a user\'s inbox', 'Initial Access'],
  ['Creating a new local account to keep access later', 'Persistence'],
  ['Listing domain users and groups to find the admins', 'Discovery'],
  ['Copying password hashes out of a computer\'s memory', 'Credential Access'],
  ['Moving from one server to the next with Remote Desktop and stolen admin credentials', 'Lateral Movement'],
  ['Gathering files of interest into one folder before taking them', 'Collection'],
  ['Malware checking in with an outside server every 5 minutes for instructions', 'Command and Control'],
  ['Uploading stolen files to an attacker\'s cloud storage account', 'Exfiltration'],
  ['Encrypting files on every server and leaving a ransom note', 'Impact']
];
/* ATT&CK v19 (April 2026) split Defense Evasion into Stealth and Defense Impairment; those tactics are left out of the
   options here so no question depends on which version a learner studied */
const TACTIC_ALL = ['Reconnaissance', 'Resource Development', 'Initial Access', 'Execution', 'Persistence', 'Privilege Escalation', 'Credential Access', 'Discovery', 'Lateral Movement', 'Collection', 'Command and Control', 'Exfiltration', 'Impact'];
const KILL = ['Reconnaissance', 'Weaponization', 'Delivery', 'Exploitation', 'Installation', 'Command and Control', 'Actions on Objectives'];
const REPORT_PARTS = [
  ['A one-page overview of the results for leadership, with no jargon', 'Executive summary'],
  ['Which hosts were tested, when, how, and what was off-limits', 'Scope and methodology'],
  ['The request and response that prove the issue, with customer data redacted', 'Evidence'],
  ['What the issue would let an attacker do to the business', 'Business impact'],
  ['The specific change that fixes the issue', 'Remediation'],
  ['Confirming the fix works after the client deploys it', 'Retest']
];
GEN.offsec = {1:[
  sk('Scoping & authorization', ()=>{ const third = rnd(0,8), excl = rnd(2,60), start = pick([20,21,22]), end = pick([5,6,7]);
      const kind = pick(['ok','out','excl','time']), inside = ()=>pick([...Array(24-start).keys()].map(h=>h+start).concat([...Array(end).keys()]));
      const ip = kind==='excl' ? '10.20.'+third+'.'+excl : kind==='out' ? '10.20.'+(third+1)+'.'+rnd(2,250) : '10.20.'+third+'.'+rnd(61,250);
      const hour = kind==='time' ? rnd(end, start-1) : inside();
      const roe = 'In scope:  10.20.'+third+'.0/24\nExcluded:  10.20.'+third+'.'+excl+' (production database)\nWindow:    '+pad2(start)+':00-'+pad2(end)+':00 UTC, every night';
      return mcq('offsec',1,'From the rules of engagement:<pre>'+roe+'</pre>May you test <code>'+ip+'</code> at <code>'+pad2(hour)+':30 UTC</code>?', ROE_RESULTS[{ok:0, out:1, excl:2, time:3}[kind]], ROE_RESULTS,
        'Check in order: is the target explicitly excluded, is it inside the scoped range, is it inside the window? A /24 covers only the last number (0 to 255) of that one range. When in doubt, stop and ask in writing.'); }, {noType:true}),
  sk('Scoping & authorization', ()=>{ const [s, a] = pick(SCOPE_ACTS); return mcq('offsec',1,'During a penetration test: <b>'+s+'</b>. What is the right move?', a, SCOPE_ACTS.map(x=>x[1]),
      'Authorization and scope come first: only test what the owner has approved in writing, stop when something breaks, and handle sensitive data minimally.'); }, {lookup:true, noType:true}),
  sk('Engagement types', ()=>{ const [d, t] = pick(ENGAGE); return mcq('offsec',1,'"'+d+'." What kind of assessment is this?', t, ENGAGE.map(x=>x[1]),
      'Scan = automated and broad. Pentest = scoped, time-boxed, proves what can be exploited. Red team = goal-based adversary emulation that also tests detection. Purple team = attack and defense together. Bug bounty = paid outside reports under a policy.'); }, {lookup:true, noType:true}),
  sk('Injection', ()=>{ const [t, c] = pick([['users','name'], ['orders','id'], ['tickets','email']]), style = pick(Object.keys(SQL_STYLES));
      const base = 'SELECT * FROM '+t+' WHERE '+c+' = ';
      const code = {concat:'cur.execute("'+base+'\'" + '+c+' + "\'")', fstring:'cur.execute(f"'+base+'\'{'+c+'}\'")', percent:'cur.execute("'+base+'\'%s\'" % '+c+')',
        param:'cur.execute("'+base+pick(['%s','?'])+'", ('+c+',))'}[style];
      return mcq('offsec',1,'<code>'+c+'</code> comes from a web form. Is this Python database call safe from SQL injection?<pre>'+code+'</pre>', SQL_STYLES[style], Object.values(SQL_STYLES),
        'Only a parameter keeps the input as data: the query text and the value travel separately. Concatenation, f-strings and %-formatting all paste the input into the SQL before the database sees it.'); }, {noType:true}),
  sk('Injection', ()=>{ const [s, f] = pick(INJ_FIX); return mcq('offsec',1,'<b>'+s+'</b>. What is the right fix?', f, INJ_FIX.map(x=>x[1]),
      'Injection is input treated as code. Keep data separate: parameters for SQL, no shell for commands, output encoding for pages. And never show raw errors to visitors.'); }, {lookup:true, noType:true}),
  sk('Access control failures', ()=>{ const name = pick(['alice','omar','mei','dev']), uid = rnd(10,40), role = pick(['customer','customer','support admin']);
      const own = role==='customer' && Math.random() < .5, owner = own ? uid : uid + rnd(1,30), inv = rnd(1000,1999);
      const right = role==='support admin' ? AC_RESULTS[1] : own ? AC_RESULTS[0] : AC_RESULTS[2];
      return mcq('offsec',1,'Policy: customers may see only their own invoices; support admins may see any invoice.<pre>user='+name+' (id '+uid+', role '+role+')  GET /api/invoices/'+inv+'  owner='+owner+'</pre>Should the server return this invoice?', right, AC_RESULTS,
        'Being logged in isn\'t enough: the server must check the role or the ownership of the record on every request. Returning someone else\'s invoice is broken access control (an IDOR).'); }, {noType:true}),
  sk('Access control failures', ()=>{ const [s, c] = pick(OWASP_CASES); return mcq('offsec',1,'Which OWASP Top 10 category fits? <b>'+s+'</b>', c, OWASP_ALL,
      'Broken access control = the server doesn\'t check what this user may reach. Authentication failures = weak login and session handling. Security misconfiguration = unsafe settings. Cryptographic failures = data not properly protected, such as sent unencrypted.'); }, {lookup:true, noType:true})
], 2:[
  sk('Password attacks & detection', ()=>{ const [s, d] = pick(PW_DEF); return mcq('offsec',2,'<b>'+s+'</b>. What is the best defense or detection?', d, PW_DEF.map(x=>x[1]),
      'Online attacks are stopped by MFA, lockouts and monitoring; offline attacks only by strong, slow, salted hashing. Length and breached-password checks beat forced rotation.'); }, {lookup:true, noType:true}),
  sk('Password attacks & detection', ()=>{ const [cs, set] = pick([[26,'lowercase letters only'], [62,'upper- and lowercase letters and digits']]), len = pick([6,8,10,12,14]);
      const [rate, hash] = pick([[1e10,'a fast, unsalted hash (10,000,000,000 guesses a second)'], [1e4,'bcrypt (10,000 guesses a second)']]);
      const secs = Math.pow(cs, len) / rate, right = CRACK_TIME[secs < 60 ? 0 : secs < 86400 ? 1 : secs < 31536000 ? 2 : 3];
      return mcq('offsec',2,'A password hash leaks. It was made with '+hash+'. The password is '+len+' characters of '+set+', chosen at random. About how long would it take to try every possible password?', right, CRACK_TIME,
        'Possible passwords = characters in the set to the power of the length, so each extra character multiplies the work. In this example the slow hash cuts guesses per second by a million; real gaps are often larger.'); }, {noType:true}),
  sk('MITRE ATT&CK & kill chain', ()=>{ const [a, t] = pick(TACTICS); return mcq('offsec',2,'Which MITRE ATT&CK tactic (the attacker\'s goal) fits this? <b>'+a+'</b>', t, TACTIC_ALL,
      'Tactics are the why. Reconnaissance happens before access; Discovery is looking around once inside. Others: Initial Access, Persistence, Credential Access, Lateral Movement, Collection, Command and Control, Exfiltration, Impact. Techniques are the how.'); }, {lookup:true}),
  sk('MITRE ATT&CK & kill chain', ()=>{ const i = rnd(0, KILL.length-2); return mcq('offsec',2,'In the Cyber Kill Chain, what comes right after "'+KILL[i]+'"?', KILL[i+1], KILL,
      'Reconnaissance, Weaponization, Delivery, Exploitation, Installation, Command and Control, Actions on Objectives. Breaking any link stops the attack.'); }),
  sk('Findings report', ()=>{ const scores = shuffle([5.3, 6.5, 7.2, 7.5, 8.1, 8.8, 9.1, 9.8]).slice(0, 4);
      const rows = scores.map((c, i)=>({id:'F-0'+(i+1), c, net:Math.random() < .5, kev:Math.random() < .3}));
      const first = rows.slice().sort((a,b)=>(b.kev - a.kev) || (b.net - a.net) || (b.c - a.c))[0].id;
      return mcq('offsec',2,'Team rule: anything in CISA\'s Known Exploited Vulnerabilities (KEV) catalog first, then internet-facing, then higher CVSS.'+
        tableHTML(['Finding','CVSS','Internet-facing','In KEV'], rows.map(r=>[r.id, r.c.toFixed(1), r.net ? 'Yes' : 'No', r.kev ? 'Yes' : 'No']))+'Which finding gets fixed first?', first, rows.map(r=>r.id),
        'CVSS measures technical severity. Exposure and active exploitation (KEV) decide what is most likely to hurt you first, so a lower score can outrank a higher one.'); }),
  sk('Findings report', ()=>{ const [c, p] = pick(REPORT_PARTS); return mcq('offsec',2,'Which part of a penetration test report holds this? <b>'+c+'</b>', p, REPORT_PARTS.map(x=>x[1]),
      'Executive summary for leaders, scope and methodology for context, then per finding: evidence, business impact, remediation and retest status.'); }, {lookup:true, noType:true})
]};

/* SQL generators use a fresh random tickets table every time */
function randTickets(){
  const n = rnd(5,8), rows = [];
  for(let i=0;i<n;i++) rows.push([201+i, pick(['high','medium','low']), pick(['open','closed','in_progress']), pick([1,2,3,null])]);
  return rows;
}
function miniTable(rows){ return tableHTML(['id','priority','status','assigned_to'], rows); }
function countWrongs(right, n){ return Array.from({length:n+2},(_,i)=>i).filter(x=>x!==right); }
GEN.sql[1].push(
  sk('Filtering', ()=>{ const rows = randTickets(), col = pick([1,2]), val = rows[rnd(0,rows.length-1)][col], name = col===1?'priority':'status', c = rows.filter(r=>r[col]===val).length;
      return mcq('sql',1,'Using this tickets table:'+miniTable(rows)+'How many rows does <code>SELECT * FROM tickets WHERE '+name+' = \''+val+'\';</code> return?', c, countWrongs(c, rows.length), c+' rows have '+name+' = \''+val+'\'.'); }),
  sk('Filtering', ()=>{ const rows = randTickets(), c = rows.filter(r=>r[3]===null).length;
      return mcq('sql',1,'Using this tickets table:'+miniTable(rows)+'How many rows does <code>SELECT * FROM tickets WHERE assigned_to IS NULL;</code> return?', c, countWrongs(c, rows.length), c+' rows have no assignee (NULL).'); }),
  sk('Grouping', ()=>{ const rows = randTickets(), c = new Set(rows.map(r=>r[2])).size;
      return mcq('sql',1,'Using this tickets table:'+miniTable(rows)+'How many rows does <code>SELECT status, COUNT(*) FROM tickets GROUP BY status;</code> return?', c, [1,2,3,4,rows.length], 'GROUP BY makes one row per different status. There are '+c+' different statuses here.'); }),
  sk('Sorting & limiting', ()=>{ const rows = randTickets(), want = pick(['high','low']), f = rows.filter(r=>r[1]===want);
      if(!f.length) return null; const top = Math.max(...f.map(r=>r[0]));
      return mcq('sql',1,'Using this tickets table:'+miniTable(rows)+'What id does <code>SELECT id FROM tickets WHERE priority = \''+want+'\' ORDER BY id DESC LIMIT 1;</code> return?', top, rows.map(r=>r[0]), 'Filter to '+want+' priority, sort ids from biggest to smallest, take the first: '+top+'.'); })
);
GEN.sql[2].push(
  sk('Joins', ()=>{ const rows = randTickets(), left = Math.random()<.5, c = left ? rows.length : rows.filter(r=>r[3]!==null).length;
      return mcq('sql',2,'Using this tickets table (every assigned_to value exists in users):'+miniTable(rows)+'How many rows does <code>SELECT * FROM tickets '+(left?'LEFT ':'')+'JOIN users ON tickets.assigned_to = users.id;</code> return?', c, countWrongs(c, rows.length),
        left ? 'LEFT JOIN keeps every ticket, even unassigned ones: '+c+' rows.' : 'An inner JOIN drops tickets with no assignee: '+c+' rows.'); }),
  sk('Grouping', ()=>{ const rows = randTickets(), counts = {}; rows.forEach(r=>counts[r[2]]=(counts[r[2]]||0)+1);
      const c = Object.values(counts).filter(v=>v>1).length;
      return mcq('sql',2,'Using this tickets table:'+miniTable(rows)+'How many rows does <code>SELECT status, COUNT(*) FROM tickets GROUP BY status HAVING COUNT(*) &gt; 1;</code> return?', c, [0,1,2,3,4],
        'Counts per status: '+Object.entries(counts).map(([k,v])=>k+' = '+v).join(', ')+'. HAVING keeps the ones above 1: '+c+'.'); })
);
/* ---- Randomized Terminal tasks, grouped by skill. Each returns [task, accepted patterns, model answer, hint, level]. ---- */
const reEsc = s=>s.replace(/[.*+?^${}()|[\]\\\/]/g,'\\$&');
const R_ = s=>new RegExp('^'+s+'$');
/* a word in any letter case, as character classes (no /i: that would also accept the wrong case of a flag, like -I) */
const anyCase = w=>w.replace(/[a-z]/gi, c=>'['+c.toLowerCase()+c.toUpperCase()+']');
/* grep flags that still print the matching lines: line numbers, whole words, ignore case (never -v, -c, -l, -q, -o) */
const GREP_OK = '(-[nwi]{1,3} )?';
const SVCS = ['nginx','apache2','ssh','cron','mysql','docker'];
const DIRS = ['logs','backups','reports','scripts','archive'];
const UNAMES = ['deploy','www-data','appuser','alei'];
const LOGF = ['app.log','access.log','error.log'];
const TGEN = [
 {sk:'Reading & identifying', lv:1, f:()=>{ const f = pick(FILES); return ['Print the contents of '+f+'.', [R_('(cat|less|more) '+reEsc(f))], 'cat '+f, 'The command that sounds like an animal.', 1]; }},
 {sk:'Reading & identifying', lv:1, f:()=>{ const f = pick(FILES); return ['Count how many lines are in '+f+'.', [R_('wc -l '+reEsc(f)), R_('cat '+reEsc(f)+' \\| wc -l')], 'wc -l '+f, 'wc = word count; -l counts lines.', 1]; }},
 {sk:'Reading & identifying', lv:1, f:()=>{ const f = pick(FILES), n = rnd(3,50); return ['Show the last '+n+' lines of '+f+'.', [R_('tail -n ?'+n+' '+reEsc(f)), R_('tail -'+n+' '+reEsc(f))], 'tail -n '+n+' '+f, 'tail, with -n and a number.', 1]; }},
 {sk:'Reading & identifying', lv:1, f:()=>{ const f = pick(FILES), n = rnd(3,50); return ['Show the first '+n+' lines of '+f+'.', [R_('head -n ?'+n+' '+reEsc(f)), R_('head -'+n+' '+reEsc(f))], 'head -n '+n+' '+f, 'head, with -n and a number.', 1]; }},
 {sk:'Files & names', lv:1, f:()=>{ const d = pick(DIRS)+rnd(1,9); return ['Make a new folder named '+d+'.', [R_('mkdir '+reEsc(d)+'/?')], 'mkdir '+d, '"make directory"', 1]; }},
 {sk:'Files & names', lv:1, f:()=>{ const f = pick(FILES), d = pick(DIRS); return ['Copy '+f+' into the folder '+d+'.', [R_('cp '+reEsc(f)+' '+reEsc(d)+'/?')], 'cp '+f+' '+d+'/', 'cp SOURCE DESTINATION', 1]; }},
 {sk:'Files & names', lv:1, f:()=>{ const f = pick(FILES), g = 'old_'+f; return ['Rename '+f+' to '+g+'.', [R_('mv '+reEsc(f)+' '+reEsc(g))], 'mv '+f+' '+g, 'Renaming is moving: mv OLD NEW', 1]; }},
 {sk:'Filtering text', lv:1, f:()=>{ const f = pick(FILES), w = pick(WORDS); return ['Show every line containing the word '+w+' in '+f+'.', [R_('grep '+GREP_OK+w+' '+reEsc(f)), R_('cat '+reEsc(f)+' \\| grep '+GREP_OK+w)], 'grep "'+w+'" '+f, 'grep PATTERN FILE', 1]; }},
 {sk:'Finding', lv:1, f:()=>{ const f = pick(FILES); return ['Find every file named '+f+', starting from your home folder.', [R_('find (~|\\$HOME)/? -name '+reEsc(f))], 'find ~ -name "'+f+'"', 'find WHERE -name NAME', 1]; }},
 {sk:'Users, processes & privilege', lv:1, f:()=>{ const s = pick(['deploy','backup','cleanup','report'])+'.sh'; return ['Make '+s+' executable.', [R_('chmod (\\+x|u\\+x|a\\+x|7[0-7][0-7]) '+reEsc(s))], 'chmod +x '+s, 'chmod plus x', 1]; }},
 {sk:'Users, processes & privilege', lv:2, f:()=>{ const u = pick(UNAMES), p = pick(['/var/www','/opt/app','/srv/data']); return ['Make '+u+' the owner and group of '+p+' and everything inside it.', [R_('(sudo )?chown -R '+reEsc(u)+':'+reEsc(u)+' '+reEsc(p)+'/?')], 'sudo chown -R '+u+':'+u+' '+p, 'chown -R USER:GROUP PATH', 2]; }},
 {sk:'Networking', lv:1, f:()=>{ const h = pick(['google.com','10.0.0.'+rnd(1,254),'db01.internal']), n = rnd(2,9); return ['Ping '+h+' exactly '+n+' times.', [R_('ping -c ?'+n+' '+reEsc(h))], 'ping -c '+n+' '+h, 'On Linux, -c sets the count.', 1]; }},
 {sk:'Networking', lv:2, f:()=>{ const u = pick(UNAMES), ip = '10.'+rnd(0,255)+'.'+rnd(0,255)+'.'+rnd(1,254); return ['Connect to '+ip+' as the user '+u+' over SSH.', [R_('ssh '+reEsc(u)+'@'+reEsc(ip)), R_('ssh -l '+reEsc(u)+' '+reEsc(ip))], 'ssh '+u+'@'+ip, 'ssh USER@HOST', 2]; }},
 {sk:'Admin', lv:2, f:()=>{ const s = pick(SVCS), a = pick(['restart','stop','start','status']); return [{restart:'Restart',stop:'Stop',start:'Start',status:'Check the status of'}[a]+' the '+s+' service.', [R_('(sudo )?systemctl '+a+' '+reEsc(s)+'(\\.service)?')], (a==='status'?'':'sudo ')+'systemctl '+a+' '+s, 'systemctl ACTION SERVICE', 2]; }},
 {sk:'Admin', lv:2, f:()=>{ const s = pick(SVCS); return ['Make the '+s+' service start automatically at boot.', [R_('(sudo )?systemctl enable (--now )?'+reEsc(s)+'(\\.service)?')], 'sudo systemctl enable '+s, 'systemctl enable SERVICE', 2]; }},
 {sk:'Admin', lv:2, f:()=>{ const s = pick(SVCS); return ['Show the systemd log for the '+s+' service.', [R_('(sudo )?journalctl -u '+reEsc(s)+'(\\.service)?')], 'journalctl -u '+s, 'journalctl, with -u for "unit"', 2]; }},
 {sk:'Filtering text', lv:2, f:()=>{ const f = pick(LOGF), w = pick(['ERROR','timeout','denied']); return ['Follow '+f+' live and show only lines containing '+w+'.', [R_('tail -f '+reEsc(f)+' \\| grep (-[nw]{1,2} )?'+w), R_('tail -f '+reEsc(f)+' \\| grep -[nw]*i[nwi]* '+anyCase(w))], 'tail -f '+f+' | grep '+w, 'tail -f, piped into grep', 2]; }},
 {sk:'Admin', lv:2, f:()=>{ const f = pick(LOGF); return ['Empty '+f+' without deleting the file.', [R_('(sudo )?truncate -s ?0 '+reEsc(f)), R_(':? ?> ?'+reEsc(f))], 'truncate -s 0 '+f, 'truncate the file to size 0', 2]; }},
 {sk:'Admin', lv:2, f:()=>{ const p = pick(['/var/log','/home','/opt','/srv']); return ['Show the size of each item inside '+p+', human-readable.', [R_('(sudo )?du -(sh|hs) '+reEsc(p)+'/\\*( \\| sort -h)?'), R_('(sudo )?du -h (--max-depth=1|-d ?1) '+reEsc(p)+'/?( \\| sort -h)?')], 'du -sh '+p+'/*', 'du with -s (summary) and -h (human)', 2]; }},
 {sk:'Archives', lv:2, f:()=>{ const d = pick(DIRS); return ['Compress the folder '+d+' into '+d+'.tar.gz.', [R_('tar -?(czf|zcf|czvf|cvzf|zcvf) '+reEsc(d)+'\\.tar\\.gz '+reEsc(d)+'/?')], 'tar -czf '+d+'.tar.gz '+d+'/', 'tar with c (create), z (gzip), f (file name)', 2]; }},
 {sk:'Admin', lv:2, f:()=>{ const m = rnd(0,59), h = rnd(0,23), dw = Math.random()<.5 ? null : rnd(0,6);
     return ['Type just the 5 cron time fields for a job that runs at '+pad2(h)+':'+pad2(m)+(dw===null?' every day':' every '+DAYS[dw])+'.', [R_(m+' '+h+' \\* \\* '+(dw===null?'\\*':'('+dw+(dw===0?'|7':'')+')'))], m+' '+h+' * * '+(dw===null?'*':dw), 'Order: minute hour day-of-month month weekday. Sunday = 0.', 2]; }}
];

/* ---- More Terminal tasks (2026-10-27): every command family in the Linux deck and lessons, grouped by the deck's topics.
   tg(skill, level, () => [task, accepted patterns, model answer, hint]). Answers are checked after termNorm(): quotes removed and spaces collapsed, but a quote that merges words
   (a quoted command name like 'ls -la', or a quoted group of flags) never matches. Accept only flags that keep the
   task's meaning (GREP_OK, never a blanket (-\w+ )?). ---- */
/* A 5th item, if given, is output shown above the prompt (lines of a previous command and its result):
   used by "read the output" and "fix the command" tasks. */
const tg = (sk, lv, f)=>TGEN.push({sk, lv, f:()=>{ const t = f(), out = Array.isArray(t[4]) ? t.splice(4, 1)[0] : null; t.push(lv); if(out) t.out = out; return t; }});
const BIN = ['data.bin','dump.raw','blob.dat','firmware.img'];
const SPACED = ['my notes.txt','q3 report.md','old backup.log','spaces in this filename'];
const FOLDERS = ['inhere','projects','site','logs','scripts'];
const EXT = ['log','conf','sh','txt','csv'];
const PROGS = ['python3','nginx','git','ssh','tar','curl'];
const fileArg = f=>'(\\./)?'+reEsc(f);

/* Files & names */
tg('Files & names', 1, ()=>{ const f = pick(FILES); return ['Create an empty file named '+f+'.', [R_('touch '+fileArg(f)), R_('> ?'+fileArg(f))], 'touch '+f, 'The command that "touches" a file into existence.']; });
tg('Files & names', 1, ()=>{ const f = pick(FILES); return ['Delete the file '+f+'.', [R_('rm (-[fiv]+ )?'+fileArg(f))], 'rm '+f, 'rm = remove. There is no recycle bin.']; });
tg('Files & names', 1, ()=>{ const d = pick(FOLDERS); return ['Delete the folder '+d+' and everything inside it.', [R_('rm -(r|rf|fr|R|Rf|fR|rv|vr) '+fileArg(d)+'/?')], 'rm -r '+d, 'rm needs -r (recursive) for folders.']; });
tg('Files & names', 1, ()=>{ const d = pick(FOLDERS); return ['Copy the whole folder '+d+' to '+d+'_backup.', [R_('cp -(r|R|a|rv|vr) '+fileArg(d)+'/? '+reEsc(d)+'_backup/?')], 'cp -r '+d+' '+d+'_backup', 'cp copies folders only with -r.']; });
tg('Files & names', 1, ()=>{ const n = pad2(rnd(0,9)); return ['Print the file named -file'+n+' (its name starts with a dash).', [R_('cat (\\./-file'+n+'|-- -file'+n+')')], 'cat ./-file'+n, 'Put ./ in front so cat doesn\'t read the dash as an option.']; });
tg('Files & names', 1, ()=>{ const f = pick(SPACED); return ['Print the file named "'+f+'" (the name has spaces).', [R_('cat '+fileArg(f)), R_('cat '+fileArg(f.replace(/ /g,'\\ ')))], 'cat "'+f+'"', 'Wrap the name in quotes, or put a backslash before each space.']; });
tg('Files & names', 1, ()=>['Print the file whose name is just a dash ( - ).', [R_('cat \\./-'), R_('cat < ?-')], 'cat ./-', 'A bare - means "read the keyboard"; ./- makes it a path.']);
tg('Files & names', 2, ()=>{ const t = pick(['/opt/app/current','/etc/nginx/sites-available/site','/var/www/html']), l = pick(['current','site','web']); return ['Create a symbolic link named '+l+' that points to '+t+'.', [R_('ln -s '+reEsc(t)+'/? '+reEsc(l))], 'ln -s '+t+' '+l, 'ln -s TARGET LINKNAME (target first).']; });
tg('Files & names', 2, ()=>{ const p = pick(['projects','backups','site'])+'/'+pick(['2026','archive','old'])+'/'+pick(['jan','logs','tmp']); return ['Create the folder path '+p+', including any parent folders that are missing.', [R_('mkdir -p '+reEsc(p)+'/?'), R_('mkdir --parents '+reEsc(p)+'/?')], 'mkdir -p '+p, 'mkdir with -p (parents).']; });

/* Reading & identifying */
tg('Reading & identifying', 1, ()=>{ const f = pick(BIN.concat(['mystery','file07','-file03'].map(x=>x))); const a = f[0]==='-' ? './'+f : f; return ['Find out what kind of data is in '+f+' (text, gzip, image…).', [R_('file '+(f[0]==='-' ? '(\\./'+reEsc(f)+'|-- '+reEsc(f)+')' : fileArg(f)))], 'file '+a, 'The command is literally called file.']; });
tg('Reading & identifying', 1, ()=>{ const d = pick(FOLDERS); return ['List everything in '+d+', including hidden files, with details.', [R_('ls -(la|al|lA|Al|lah|alh|lha|ahl) '+fileArg(d)+'/?')], 'ls -la '+d, 'ls with -l (long) and -a (all, including dot files).']; });
tg('Reading & identifying', 1, ()=>['Check whether every file in the current folder is text or data, in one command.', [R_('file (\\./)?\\*'), R_('file \\./-?\\*'), R_('file -- \\*')], 'file ./*', 'file accepts many names; ./* means everything here.']);
tg('Reading & identifying', 2, ()=>{ const f = pick(FILES); return ['Show the size, permissions, owner and timestamps of '+f+'.', [R_('stat '+fileArg(f))], 'stat '+f, 'stat shows a file\'s metadata.']; });
tg('Reading & identifying', 2, ()=>{ const f = pick(BIN); return ['Show only the human-readable text hidden inside '+f+'.', [R_('strings '+fileArg(f)), R_('cat '+fileArg(f)+' \\| strings')], 'strings '+f, 'strings pulls readable text out of binary data.']; });
tg('Reading & identifying', 2, ()=>{ const f = pick(FILES), n = rnd(5,40); return ['Print only line '+n+' of '+f+'.', [R_('sed -n '+n+'p '+fileArg(f)), R_('head -n ?'+n+' '+fileArg(f)+' \| tail -n ?1'), R_('head -'+n+' '+fileArg(f)+' \| tail -1'), R_('awk NR==?'+n+' '+fileArg(f))], 'sed -n '+n+'p '+f, 'sed -n NUMp prints just that line (or head then tail -n 1).']; });

/* Finding */
tg('Finding', 1, ()=>{ const d = pick(FOLDERS), e = pick(EXT); return ['Find every .'+e+' file under the folder '+d+'.', [R_('find '+fileArg(d)+'/? -name \\*\\.'+e), R_('find '+fileArg(d)+'/? -type f -name \\*\\.'+e)], 'find '+d+' -name "*.'+e+'"', 'find WHERE -name "*.EXT" (quote the star).']; });
tg('Finding', 1, ()=>{ const p = pick(PROGS); return ['Show the full path of the '+p+' program.', [R_('which '+p), R_('command -v '+p), R_('type -p '+p)], 'which '+p, 'which NAME searches your PATH.']; });
tg('Finding', 2, ()=>{ const d = pick(FOLDERS), n = rnd(100,4096); return ['Find files under '+d+' that are exactly '+n+' bytes.', [R_('find '+fileArg(d)+'/? (-type f )?-size '+n+'c( -type f)?')], 'find '+d+' -size '+n+'c', '-size with c means bytes (k = KB, M = MB).']; });
tg('Finding', 2, ()=>{ const k = rnd(5,9), u = 'bandit'+k, g = 'bandit'+(k-1); return ['Search the whole system for files owned by user '+u+' and group '+g+', hiding "Permission denied" errors.', [R_('find / (-user '+u+' -group '+g+'|-group '+g+' -user '+u+')( -type f)? 2> ?/dev/null')], 'find / -user '+u+' -group '+g+' 2>/dev/null', '-user and -group, then send errors (2>) to /dev/null.']; });
tg('Finding', 2, ()=>{ const d = pick(['/var/log','/home','/etc','/tmp']), n = rnd(1,14); return ['Find files under '+d+' changed in the last '+n+' day'+(n>1?'s':'')+'.', [R_('(sudo )?find '+reEsc(d)+'/? (-type f )?-mtime -'+n)], 'find '+d+' -mtime -'+n, '-mtime -N = modified less than N days ago.']; });
tg('Finding', 2, ()=>{ const d = pick(FOLDERS); return ['Find regular files under '+d+' that are NOT executable.', [R_('find '+fileArg(d)+'/? (-type f (!|-not) -executable|(!|-not) -executable -type f)')], 'find '+d+' -type f ! -executable', '-type f for files; ! (or -not) flips the test after it.']; });

/* Filtering text */
tg('Filtering text', 1, ()=>{ const f = pick(FILES), w = pick(WORDS); return ['Show the lines in '+f+' that do NOT contain '+w+'.', [R_('grep -v '+w+' '+fileArg(f)), R_('cat '+fileArg(f)+' \\| grep -v '+w)], 'grep -v "'+w+'" '+f, 'grep -v inverts the match.']; });
tg('Filtering text', 1, ()=>{ const f = pick(LOGF), w = pick(WORDS); return ['Count how many lines in '+f+' contain '+w+'.', [R_('grep -c '+w+' '+fileArg(f)), R_('grep '+w+' '+fileArg(f)+' \\| wc -l'), R_('cat '+fileArg(f)+' \\| grep -c '+w)], 'grep -c "'+w+'" '+f, 'grep -c counts matching lines.']; });
tg('Filtering text', 1, ()=>{ const f = pick(LOGF), w = pick(WORDS); return ['Show lines in '+f+' containing '+w+', ignoring upper/lower case.', [R_('grep -i '+w+' '+fileArg(f)), R_('cat '+fileArg(f)+' \\| grep -i '+w)], 'grep -i "'+w+'" '+f, '-i = ignore case.']; });
tg('Filtering text', 1, ()=>{ const f = pick(['data.txt','passwords.txt','lines.txt']); return ['Sort '+f+' alphabetically.', [R_('sort '+fileArg(f)), R_('cat '+fileArg(f)+' \\| sort')], 'sort '+f, 'The command is sort.']; });
tg('Filtering text', 2, ()=>{ const d = pick(['/etc/nginx','/etc/ssh','/opt/app','/var/www']), w = pick(['8080','listen','password','PermitRootLogin']); return ['Search every file under '+d+' for '+w+', showing file names and line numbers.', [R_('(sudo )?grep -(rn|nr|Rn|nR|rni|rin|nri|inr) '+w+' '+reEsc(d)+'/?')], 'grep -rn "'+w+'" '+d, 'grep -r searches folders; -n adds line numbers.']; });
tg('Filtering text', 2, ()=>{ const f = pick(['data.txt','passwords.txt','lines.txt']); return ['Show the only line in '+f+' that appears exactly once.', [R_('sort '+fileArg(f)+' \\| uniq -u'), R_('cat '+fileArg(f)+' \\| sort \\| uniq -u')], 'sort '+f+' | uniq -u', 'uniq only compares neighbours, so sort first; -u keeps unique lines.']; });
tg('Filtering text', 2, ()=>{ const f = pick(['ips.txt','users.txt','errors.txt']); return ['Count how many times each line appears in '+f+', most common first.', [R_('sort '+fileArg(f)+' \\| uniq -c \\| sort -(nr|rn|n -r|r -n)'), R_('cat '+fileArg(f)+' \\| sort \\| uniq -c \\| sort -(nr|rn)')], 'sort '+f+' | uniq -c | sort -nr', 'sort | uniq -c counts; sort -nr puts the biggest numbers first.']; });
tg('Filtering text', 2, ()=>{ const n = rnd(1,4); return ['Show only column '+n+' of the comma-separated file users.csv.', [R_('cut -d ?, -f ?'+n+' users\\.csv'), R_('cut -f ?'+n+' -d ?, users\\.csv'), R_('awk -F ?, \\{ ?print \\$'+n+' ?\\} users\\.csv')], 'cut -d, -f'+n+' users.csv', 'cut -d sets the separator, -f picks the field.']; });
tg('Filtering text', 2, ()=>{ const f = pick(LOGF), n = rnd(1,3); return ['Print just the '+['first','second','third'][n-1]+' space-separated word of every line in '+f+'.', [R_('awk \\{ ?print \\$'+n+' ?\\} '+fileArg(f)), R_('cut -d ? -f ?'+n+' '+fileArg(f))], "awk '{print $"+n+"}' "+f, "awk '{print $N}' prints field N."]; });
tg('Filtering text', 2, ()=>{ const f = pick(['config.yml','notes.txt','report.md']), [a,b] = pick([['http','https'],['8080','8443'],['dev','prod'],['old','new']]); return ['Print '+f+' with every "'+a+'" replaced by "'+b+'" (don\'t change the file itself).', [R_('sed s/'+a+'/'+b+'/g '+fileArg(f)), R_('sed -e s/'+a+'/'+b+'/g '+fileArg(f)), R_('cat '+fileArg(f)+' \\| sed s/'+a+'/'+b+'/g')], "sed 's/"+a+"/"+b+"/g' "+f, "sed 's/OLD/NEW/g' FILE; g = every match on the line."]; });

/* Encoding & hashing */
tg('Encoding & hashing', 1, ()=>{ const f = pick(['data.b64','secret.txt','token.b64']); return ['Decode the base64 text in '+f+'.', [R_('base64 (-d|--decode|-D) '+fileArg(f)), R_('cat '+fileArg(f)+' \\| base64 (-d|--decode)')], 'base64 -d '+f, 'base64 with -d (decode).']; });
tg('Encoding & hashing', 1, ()=>{ const f = pick(FILES); return ['Base64-encode '+f+'.', [R_('base64 '+fileArg(f)), R_('cat '+fileArg(f)+' \\| base64')], 'base64 '+f, 'base64 with no option encodes.']; });
tg('Encoding & hashing', 1, ()=>{ const f = pick(['note.txt','data.txt','key.txt']); return ['Show a hex dump of '+f+'.', [R_('xxd '+fileArg(f)), R_('hexdump -C '+fileArg(f)), R_('od -A x -t x1z '+fileArg(f))], 'xxd '+f, 'xxd prints bytes as hex.']; });
tg('Encoding & hashing', 1, ()=>{ const [alg, cmd] = pick([['SHA-256','sha256sum'],['MD5','md5sum'],['SHA-1','sha1sum']]), f = pick(['installer.iso','backup.tar','report.pdf']); return ['Show the '+alg+' hash of '+f+'.', [R_(cmd+' '+fileArg(f))], cmd+' '+f, 'The hash name plus "sum".']; });
tg('Encoding & hashing', 2, ()=>{ const f = pick(['data.txt','rot.txt','secret.txt']); return [f+' is ROT13-encoded (letters shifted 13 places). Decode it with tr.', [R_('cat '+fileArg(f)+' \\| tr A-Za-z N-ZA-Mn-za-m'), R_('tr A-Za-z N-ZA-Mn-za-m < ?'+fileArg(f)), R_('cat '+fileArg(f)+' \\| tr a-zA-Z n-za-mN-ZA-M'), R_('tr a-zA-Z n-za-mN-ZA-M < ?'+fileArg(f))], "cat "+f+" | tr 'A-Za-z' 'N-ZA-Mn-za-m'", "tr maps one set of letters onto another: A-Za-z to N-ZA-Mn-za-m."]; });
tg('Encoding & hashing', 2, ()=>{ const f = pick(['data.txt','dump.hex']), o = pick(['data.bin','out.gz','restored']); return ['Turn the hex dump '+f+' back into the original binary file '+o+'.', [R_('xxd -r '+fileArg(f)+' (> ?)?'+reEsc(o))], 'xxd -r '+f+' > '+o, 'xxd -r reverses a hex dump.']; });
tg('Encoding & hashing', 2, ()=>{ const [alg, cmd] = pick([['SHA-256','sha256sum'],['MD5','md5sum']]); return ['Check every file listed in checksums.txt against its '+alg+' hash.', [R_(cmd+' -c checksums\\.txt'), R_(cmd+' --check checksums\\.txt')], cmd+' -c checksums.txt', 'Add -c (check) and give it the list.']; });

/* Archives */
tg('Archives', 1, ()=>{ const a = pick(DIRS); return ['Extract '+a+'.tar.gz into the current folder.', [R_('tar -?(xzf|zxf|xvzf|xzvf|zxvf|vxzf|xf|xvf) '+reEsc(a)+'\\.tar\\.gz')], 'tar -xzf '+a+'.tar.gz', 'x = extract, z = gzip, f = file.']; });
tg('Archives', 1, ()=>{ const a = pick(DIRS); return ['List what\'s inside '+a+'.tar without extracting it.', [R_('tar -?(tf|tvf|vtf) '+reEsc(a)+'\\.tar')], 'tar -tf '+a+'.tar', 't = list (table of contents).']; });
tg('Archives', 1, ()=>{ const f = pick(['data','app.log','backup','notes']); return ['Decompress '+f+'.gz.', [R_('gunzip '+reEsc(f)+'\\.gz'), R_('gzip -d '+reEsc(f)+'\\.gz')], 'gunzip '+f+'.gz', 'gunzip, or gzip -d.']; });
tg('Archives', 1, ()=>{ const f = pick(['data','archive','dump']); return ['Decompress '+f+'.bz2.', [R_('bunzip2 '+reEsc(f)+'\\.bz2'), R_('bzip2 -d '+reEsc(f)+'\\.bz2')], 'bzip2 -d '+f+'.bz2', 'bzip2 -d (or bunzip2).']; });
tg('Archives', 1, ()=>{ const f = pick(['data','logs','export']); return ['Unzip '+f+'.zip.', [R_('unzip '+reEsc(f)+'\\.zip')], 'unzip '+f+'.zip', 'The opposite of zip.']; });
tg('Archives', 2, ()=>{ const f = pick(['data','image','dump']); return ['Decompress '+f+'.xz.', [R_('unxz '+reEsc(f)+'\\.xz'), R_('xz -d '+reEsc(f)+'\\.xz')], 'xz -d '+f+'.xz', 'xz -d (or unxz).']; });
tg('Archives', 2, ()=>{ const f = pick(LOGF); return ['Read the compressed log '+f+'.gz without unpacking it to disk.', [R_('zcat '+reEsc(f)+'\\.gz'), R_('gzip -dc '+reEsc(f)+'\\.gz'), R_('gunzip -c '+reEsc(f)+'\\.gz'), R_('zless '+reEsc(f)+'\\.gz')], 'zcat '+f+'.gz', 'zcat = cat for .gz files.']; });
tg('Archives', 2, ()=>{ const d = pick(DIRS); return ['Extract '+d+'.tar.bz2.', [R_('tar -?(xjf|jxf|xvjf|xjvf|xf|xvf) '+reEsc(d)+'\\.tar\\.bz2')], 'tar -xjf '+d+'.tar.bz2', 'j = bzip2 (z is gzip, J is xz).']; });
tg('Archives', 2, ()=>['Make a scratch folder with a random name under /tmp and print its path.', [R_('mktemp -d'), R_('mktemp -d -p /tmp'), R_('mktemp -d /tmp/\\S*X{3,}\\S*')], 'mktemp -d', 'mktemp -d makes a unique temporary folder (Bandit uses this a lot).']);

/* Redirection */
tg('Redirection', 1, ()=>{ const c = pick(['ls -la','ps aux','df -h']), f = pick(['listing.txt','out.txt','snapshot.txt']); return ['Save the output of '+c+' into '+f+' (replace whatever is there).', [R_(reEsc(c)+' > ?'+reEsc(f))], c+' > '+f, '> writes (and overwrites).']; });
tg('Redirection', 1, ()=>{ const w = pick(['done','checked','backup ok']), f = pick(['log.txt','notes.txt','todo.txt']); return ['Add the line "'+w+'" to the end of '+f+'.', [R_('echo '+reEsc(w)+' >> ?'+reEsc(f))], 'echo "'+w+'" >> '+f, '>> appends.']; });
tg('Redirection', 1, ()=>['Count how many items are in the current folder, using ls and a pipe.', [R_('ls( -1| -A)? \\| wc -l')], 'ls | wc -l', 'Pipe ls into wc -l.']);
tg('Redirection', 1, ()=>{ const f = pick(['input.txt','names.txt','list.txt']); return ['Feed '+f+' into sort as its input, using a redirect (no pipe, no file argument).', [R_('sort < ?'+reEsc(f))], 'sort < '+f, '< sends a file into a command\'s input.']; });
tg('Redirection', 2, ()=>{ const s = pick(['build','deploy','test']); return ['Run ./'+s+'.sh and save both normal output and errors to '+s+'.log.', [R_('\\./'+s+'\\.sh > ?'+s+'\\.log 2>&1'), R_('\\./'+s+'\\.sh &> ?'+s+'\\.log')], './'+s+'.sh > '+s+'.log 2>&1', '2>&1 sends errors to the same place as output.']; });
tg('Redirection', 2, ()=>{ const s = pick(['build','deploy','backup']); return ['Run ./'+s+'.sh, showing its output on screen and also saving it to '+s+'.log.', [R_('\\./'+s+'\\.sh \\| tee '+s+'\\.log'), R_('\\./'+s+'\\.sh 2>&1 \\| tee '+s+'\\.log')], './'+s+'.sh | tee '+s+'.log', 'tee splits output: screen and file.']; });
tg('Redirection', 2, ()=>{ const c = pick(['./backup.sh','./cleanup.sh','./sync.sh']); return ['Run '+c+' and throw away all of its output, normal and errors.', [R_(reEsc(c)+' > ?/dev/null 2>&1'), R_(reEsc(c)+' &> ?/dev/null')], c+' > /dev/null 2>&1', '/dev/null discards anything written to it.']; });
tg('Redirection', 2, ()=>{ const p = rnd(30000,31000); return ['Send the contents of pass.txt to port '+p+' on localhost with netcat.', [R_('cat pass\\.txt \\| (nc|ncat) (localhost|127\\.0\\.0\\.1) '+p), R_('(nc|ncat) (localhost|127\\.0\\.0\\.1) '+p+' < ?pass\\.txt')], 'nc localhost '+p+' < pass.txt', 'nc HOST PORT, with the file redirected in (or piped in).']; });

/* Networking */
tg('Networking', 1, ()=>{ const n = rnd(1,33); return ['Log in to bandit'+n+' on bandit.labs.overthewire.org, which listens for SSH on port 2220.', [R_('ssh (-p ?2220 )?bandit'+n+'@bandit\\.labs\\.overthewire\\.org( -p ?2220)?'), R_('ssh -p ?2220 -l bandit'+n+' bandit\\.labs\\.overthewire\\.org')], 'ssh bandit'+n+'@bandit.labs.overthewire.org -p 2220', 'ssh USER@HOST -p PORT (SSH normally uses 22).']; });
tg('Networking', 1, ()=>{ const d = pick(['uhd.edu','github.com','acchouston.org','example.com']); return ['Look up the IP address (A record) of '+d+'.', [R_('dig '+reEsc(d)+'( A)?( \\+short)?'), R_('dig \\+short '+reEsc(d)), R_('nslookup '+reEsc(d)), R_('host '+reEsc(d))], 'dig '+d, 'dig (or nslookup / host) asks DNS.']; });
tg('Networking', 1, ()=>{ const u = pick(['https://example.com','https://uhd.edu','http://localhost:8080']); return ['Fetch only the HTTP response headers from '+u+'.', [R_('curl -I '+reEsc(u)+'/?'), R_('curl --head '+reEsc(u)+'/?'), R_('curl -sI '+reEsc(u)+'/?')], 'curl -I '+u, 'curl -I (capital i) = headers only.']; });
tg('Networking', 1, ()=>['Show which TCP and UDP ports are listening, with numbers instead of names.', [R_('(sudo )?ss -(tuln|tunl|ltun|lntu|nltu|tulpn|tunlp|ltunp|tlnu|ulnt|untl|lnut)'), R_('(sudo )?netstat -(tuln|tunl|ltun|tulpn|tunlp|plunt|lntu)')], 'ss -tuln', 'ss: t = TCP, u = UDP, l = listening, n = numbers.']);
tg('Networking', 1, ()=>{ const h = pick(['8.8.8.8','github.com','10.0.0.1']); return ['Show every router hop between you and '+h+'.', [R_('traceroute '+reEsc(h)), R_('tracepath '+reEsc(h)), R_('mtr '+reEsc(h))], 'traceroute '+h, 'traceroute lists each hop.']; });
tg('Networking', 2, ()=>{ const p = rnd(30000,31999); return ['Connect to port '+p+' on localhost and type to it directly.', [R_('(nc|ncat|netcat) (localhost|127\\.0\\.0\\.1) '+p), R_('telnet (localhost|127\\.0\\.0\\.1) '+p)], 'nc localhost '+p, 'nc HOST PORT opens a raw TCP connection.']; });
tg('Networking', 2, ()=>{ const p = rnd(30000,31999); return ['Open an SSL/TLS connection to port '+p+' on localhost.', [R_('openssl s_client (-ign_eof |-quiet )?-connect (localhost|127\\.0\\.0\\.1):'+p+'( -ign_eof| -quiet)?'), R_('(ncat|nc) --ssl (localhost|127\\.0\\.0\\.1) '+p)], 'openssl s_client -connect localhost:'+p, 'openssl s_client -connect HOST:PORT (or ncat --ssl).']; });
tg('Networking', 2, ()=>{ const a = rnd(31000,31500), b = a + rnd(200,500); return ['Scan localhost for open ports from '+a+' to '+b+'.', [R_('(sudo )?nmap (-sV )?-p ?'+a+'-'+b+' (localhost|127\\.0\\.0\\.1)( -sV)?'), R_('(sudo )?nmap (localhost|127\\.0\\.0\\.1) -p ?'+a+'-'+b)], 'nmap -p '+a+'-'+b+' localhost', 'nmap -p FIRST-LAST HOST.']; });
tg('Networking', 2, ()=>{ const p = rnd(30000,31999); return ['Listen for a connection on port '+p+' (you\'ll be the server).', [R_('(nc|ncat|netcat) -(l|lv|vl|lp|lvp|nlvp|lnvp|vlp) ?'+p), R_('(nc|ncat|netcat) -l -p ?'+p)], 'nc -l '+p, 'nc -l = listen mode.']; });
tg('Networking', 2, ()=>{ const n = rnd(13,26), k = pick(['sshkey.private','id_rsa','bandit.key']); return ['Log in to localhost as bandit'+n+' using the private key file '+k+'.', [R_('ssh -i '+fileArg(k)+' bandit'+n+'@(localhost|127\\.0\\.0\\.1)( -p ?2220)?'), R_('ssh bandit'+n+'@(localhost|127\\.0\\.0\\.1) -i '+fileArg(k)+'( -p ?2220)?')], 'ssh -i '+k+' bandit'+n+'@localhost', 'ssh -i KEYFILE USER@HOST.']; });
tg('Networking', 2, ()=>{ const u = pick(UNAMES), h = pick(['10.0.0.'+rnd(2,254),'web01','backup.internal']), f = pick(FILES); return ['Copy '+f+' to the /tmp folder on '+h+', logging in as '+u+'.', [R_('scp '+fileArg(f)+' '+reEsc(u)+'@'+reEsc(h)+':/tmp/?'), R_('rsync (-[avzrhP]{1,6} )?'+fileArg(f)+' '+reEsc(u)+'@'+reEsc(h)+':/tmp/?')], 'scp '+f+' '+u+'@'+h+':/tmp/', 'scp FILE USER@HOST:PATH (note the colon).']; });

/* Users, processes & privilege */
tg('Users, processes & privilege', 1, ()=>['Show your user ID, group ID and every group you belong to.', [R_('id')], 'id', 'A two-letter command.']);
tg('Users, processes & privilege', 1, ()=>['Show which user you are logged in as.', [R_('whoami'), R_('id -un')], 'whoami', 'Ask the system "who am I".']);
tg('Users, processes & privilege', 1, ()=>{ const p = pick(['python3','nginx','node','sshd','cron']); return ['Find the running process(es) for '+p+'.', [R_('ps (aux|-ef|-aux) \\| grep (-i )?'+p), R_('pgrep (-a |-l |-fa |-af )?'+p)], 'ps aux | grep '+p, 'ps aux lists everything; grep narrows it (or use pgrep).']; });
tg('Users, processes & privilege', 1, ()=>{ const n = rnd(1000,9999); return ['Stop the process with ID '+n+'.', [R_('(sudo )?kill (-15 |-TERM |-SIGTERM )?'+n)], 'kill '+n, 'kill PID sends a polite stop signal.']; });
tg('Users, processes & privilege', 1, ()=>{ const [m, d] = pick([['600','only the owner can read and write it; nobody else gets any access'],['644','the owner can read and write, everyone else can only read'],['700','only the owner can read, write and run it'],['755','the owner can do everything, everyone else can read and run it'],['640','the owner can read and write, the group can read, others get nothing']]), f = pick(['notes.txt','deploy.sh','id_rsa','config.yml']); return ['Set the permissions on '+f+' so that '+d+'.', [R_('chmod '+m+' '+fileArg(f))], 'chmod '+m+' '+f, 'r = 4, w = 2, x = 1; add them for owner, group, others.']; });
tg('Users, processes & privilege', 1, ()=>{ const u = 'bandit'+rnd(10,30); return ['Switch to the user '+u+' (you\'ll be asked for '+u+'\'s password).', [R_('su -? ?'+u), R_('su -l '+u)], 'su '+u, 'su = switch user.']; });
tg('Users, processes & privilege', 2, ()=>{ const n = rnd(1000,9999); return ['Process '+n+' ignores a normal kill. Force it to stop.', [R_('(sudo )?kill (-9|-KILL|-SIGKILL|-s KILL|-s 9) '+n)], 'kill -9 '+n, 'Signal 9 (KILL) can\'t be ignored.']; });
tg('Users, processes & privilege', 2, ()=>['List which commands you are allowed to run with sudo.', [R_('sudo -l')], 'sudo -l', 'sudo with -l (list).']);
tg('Users, processes & privilege', 2, ()=>{ const u = pick(['jsmith','intern1','svc_backup','mlopez']); return ['Create the user '+u+' with a home folder.', [R_('sudo useradd -m( -s /bin/bash)? '+u), R_('sudo useradd( -s /bin/bash)? -m '+u), R_('sudo adduser '+u)], 'sudo useradd -m '+u, 'useradd -m creates the home folder (adduser asks questions).']; });
tg('Users, processes & privilege', 2, ()=>{ const u = pick(['deploy','appuser','alei','jsmith']), g = pick(['docker','sudo','www-data','developers']); return ['Add '+u+' to the '+g+' group without removing them from their other groups.', [R_('sudo usermod -(aG|a -G) '+reEsc(g)+' '+reEsc(u)), R_('sudo gpasswd -a '+reEsc(u)+' '+reEsc(g))], 'sudo usermod -aG '+g+' '+u, '-a (append) matters: -G alone replaces their groups.']; });
tg('Users, processes & privilege', 2, ()=>{ const p = pick([80,443,3000,5432,8080]); return ['Show which process is using port '+p+'.', [R_('(sudo )?lsof -i ?(tcp)?:'+p), R_('(sudo )?ss -(ltnp|lntp|tlnp|tulpn|tunlp|ltunp) \\| grep (:)?'+p), R_('(sudo )?fuser '+p+'/tcp')], 'sudo lsof -i :'+p, 'lsof -i :PORT lists the program holding it.']; });
tg('Users, processes & privilege', 2, ()=>{ const f = pick(['/usr/bin/passwd','./bandit20-do','/usr/bin/sudo']); return ['Show the permissions of '+f+' and check for the setuid bit (an s where the owner\'s x would be).', [R_('ls -(l|la|al|lh) '+reEsc(f)), R_('stat '+reEsc(f))], 'ls -l '+f, 'ls -l shows the mode, like -rwsr-xr-x.']; });

/* Git */
tg('Git', 1, ()=>['Show the commit history of this repository, one line per commit.', [R_('git log --oneline( --all| --graph)*'), R_('git log --pretty=oneline')], 'git log --oneline', 'git log, made compact with --oneline.']);
tg('Git', 1, ()=>{ const h = Math.random().toString(16).slice(2,9); return ['Show what changed in commit '+h+'.', [R_('git show '+h)], 'git show '+h, 'git show COMMIT.']; });
tg('Git', 1, ()=>['List all branches, including the ones on the remote.', [R_('git branch (-a|--all)'), R_('git branch -r')], 'git branch -a', 'git branch with -a (all).']);
tg('Git', 1, ()=>{ const b = pick(['dev','feature/login','hotfix','staging']); return ['Switch to the existing branch '+b+'.', [R_('git (checkout|switch) '+reEsc(b))], 'git switch '+b, 'git switch BRANCH (older: git checkout).']; });
tg('Git', 1, ()=>['List the tags in this repository.', [R_('git tag( -l| --list)?'), R_('git show-ref --tags')], 'git tag', 'git tag with no arguments lists them.']);
tg('Git', 1, ()=>['See which files are changed, staged or untracked.', [R_('git status( -s| --short)?')], 'git status', 'The command you run most in git.']);
tg('Git', 2, ()=>{ const n = rnd(27,31), p = 2220; return ['Clone the repository at ssh://bandit'+n+'-git@localhost:'+p+'/home/bandit'+n+'-git/repo.', [R_('git clone ssh://bandit'+n+'-git@localhost:'+p+'/home/bandit'+n+'-git/repo( \\S+)?')], 'git clone ssh://bandit'+n+'-git@localhost:'+p+'/home/bandit'+n+'-git/repo', 'git clone URL (the port goes after the host).']; });
tg('Git', 2, ()=>['Show the commit history along with the actual changes in each commit.', [R_('git log (-p|--patch)'), R_('git log -p --all')], 'git log -p', '-p (patch) shows the diff of each commit.']);
tg('Git', 2, ()=>['List the changes you have stashed away.', [R_('git stash list')], 'git stash list', 'git stash, then list.']);
tg('Git', 2, ()=>{ const f = pick(['README.md','app.py','config.yml']); return ['Show who last changed each line of '+f+'.', [R_('git blame '+reEsc(f))], 'git blame '+f, 'git blame FILE.']; });

/* Shell & environment */
tg('Shell & environment', 1, ()=>{ const v = pick(['HOME','PATH','USER','SHELL']); return ['Print the value of the '+v+' environment variable.', [R_('echo \\$\\{?'+v+'\\}?'), R_('printenv '+v)], 'echo $'+v, 'Variables are read with a $ in front.']; });
tg('Shell & environment', 1, ()=>{ const [v, x] = pick([['EDITOR','nano'],['APP_ENV','prod'],['DEBUG','1'],['LANG','en_US.UTF-8']]); return ['Set '+v+' to '+x+' for this shell and the programs it starts.', [R_('export '+v+'='+reEsc(x))], 'export '+v+'='+x, 'export NAME=VALUE (no spaces around =).']; });
tg('Shell & environment', 1, ()=>{ const [a, c] = pick([['ll','ls -la'],['gs','git status'],['la','ls -A']]); return ['Make '+a+' a shortcut for '+c+'.', [R_('alias '+a+'='+reEsc(c))], "alias "+a+"='"+c+"'", "alias NAME='COMMAND'."]; });
tg('Shell & environment', 1, ()=>['Reload your shell settings from ~/.bashrc without logging out.', [R_('(source|\\.) (~|\\$HOME)/\\.bashrc')], 'source ~/.bashrc', 'source (or a single dot) runs it in this shell.']);
tg('Shell & environment', 1, ()=>{ const c = pick(['find','tar','chmod','grep','ssh']); return ['Open the manual page for '+c+'.', [R_('man '+c)], 'man '+c, 'man = manual.']; });
tg('Shell & environment', 1, ()=>['Show the commands you have run before.', [R_('history( \\| (less|tail))?')], 'history', 'Your shell keeps a history.']);
tg('Shell & environment', 2, ()=>{ const n = rnd(3,12); return ['Use a for loop to print the numbers 1 to '+n+'.', [R_('for (\\w+) in \\{1\\.\\.'+n+'\\} ?; ?do echo \\$\\{?\\1\\}? ?; ?done'), R_('for (\\w+) in \\$\\(seq '+n+'\\) ?; ?do echo \\$\\{?\\1\\}? ?; ?done'), R_('for (\\w+) in \\$\\(seq 1 '+n+'\\) ?; ?do echo \\$\\{?\\1\\}? ?; ?done')], 'for i in {1..'+n+'}; do echo $i; done', 'for VAR in {1..N}; do ...; done']; });
tg('Shell & environment', 2, ()=>{ const [a, b] = pick([['make','./install.sh'],['./build.sh','./deploy.sh'],['npm test','git push']]); return ['Run '+a+', and only if it succeeds, run '+b+'.', [R_(reEsc(a)+' && '+reEsc(b))], a+' && '+b, '&& runs the next command only on success.']; });
tg('Shell & environment', 2, ()=>{ const s = pick(['long_job.sh','sync.sh','train.sh']); return ['Start ./'+s+' so it keeps running after you log out.', [R_('nohup \\./'+reEsc(s)+'( > ?\\S+)?( 2>&1)? ?&'), R_('nohup \\./'+reEsc(s)+'( &)?')], 'nohup ./'+s+' &', 'nohup ignores the hang-up; & puts it in the background.']; });
tg('Shell & environment', 2, ()=>{ const c = pick(['./backup.sh','make','npm test']); return ['Measure how long '+c+' takes to run.', [R_('time '+reEsc(c))], 'time '+c, 'Put time in front of the command.']; });
tg('Shell & environment', 2, ()=>{ const n = rnd(2,5), c = pick(['df -h','free -h','ls -l /tmp']); return ['Re-run '+c+' every '+n+' seconds and watch the output change.', [R_('watch -n ?'+n+' '+reEsc(c))], 'watch -n '+n+' '+c, 'watch -n SECONDS COMMAND.']; });

/* Admin */
tg('Admin', 1, ()=>['Show free disk space on every mounted drive, human-readable.', [R_('df -h( -T|T)?'), R_('df -hT')], 'df -h', 'df = disk free, -h = human sizes.']);
tg('Admin', 1, ()=>['Show memory use, human-readable.', [R_('free -(h|m|mh)')], 'free -h', 'The command is free.']);
tg('Admin', 1, ()=>['Show how long the system has been running and its load.', [R_('uptime( -p)?'), R_('w')], 'uptime', 'up + time.']);
tg('Admin', 1, ()=>['Show the kernel version and system details.', [R_('uname -(a|r|sr|rs)'), R_('hostnamectl')], 'uname -a', 'uname -a (all).']);
tg('Admin', 1, ()=>['Show who is logged in right now.', [R_('who'), R_('w'), R_('users')], 'who', 'who (or w for more detail).']);
tg('Admin', 1, ()=>['Refresh the list of available packages on Ubuntu.', [R_('sudo apt(-get)? update')], 'sudo apt update', 'apt update (before installing).']);
tg('Admin', 2, ()=>{ const p = pick(['nmap','htop','tree','curl','net-tools']); return ['Install the '+p+' package on Ubuntu.', [R_('sudo apt(-get)? install (-y )?'+reEsc(p)+'( -y)?')], 'sudo apt install '+p, 'sudo apt install NAME.']; });
tg('Admin', 2, ()=>{ const p = pick([22,80,443,8080,3306]); return ['Allow incoming traffic on port '+p+' through the Ubuntu firewall.', [R_('sudo ufw allow '+p+'(/tcp)?')], 'sudo ufw allow '+p, 'ufw = uncomplicated firewall.']; });
tg('Admin', 2, ()=>['List your scheduled cron jobs.', [R_('crontab -l')], 'crontab -l', 'crontab with -l (list).']);
tg('Admin', 2, ()=>['Open your cron jobs in an editor to change them.', [R_('crontab -e')], 'crontab -e', 'crontab with -e (edit).']);
tg('Admin', 2, ()=>{ const s = pick(SVCS); return ['Show only the last 50 log lines for the '+s+' service.', [R_('(sudo )?journalctl -u '+reEsc(s)+'(\\.service)? -n ?50'), R_('(sudo )?journalctl -n ?50 -u '+reEsc(s)+'(\\.service)?')], 'journalctl -u '+s+' -n 50', 'journalctl -u UNIT -n LINES.']; });
tg('Admin', 2, ()=>['List the disks and their partitions.', [R_('lsblk( -f)?'), R_('sudo fdisk -l')], 'lsblk', 'lsblk = list block devices.']);
tg('Admin', 2, ()=>{ const n = rnd(10,50); return ['Show the last '+n+' lines of the Ubuntu login log (where sudo and SSH logins are recorded).', [R_('(sudo )?tail -n ?'+n+' /var/log/auth\\.log'), R_('(sudo )?tail -'+n+' /var/log/auth\\.log')], 'sudo tail -n '+n+' /var/log/auth.log', 'Logins are logged in /var/log/auth.log on Ubuntu.']; });

/* ---- Read the output: the task shows what a command printed; your answer uses what you read ---- */
const PIDN = ()=>rnd(1200,9800);
tg('Users, processes & privilege', 2, ()=>{ const port = pick([3000,5000,8000,8080]), a = PIDN(), b = PIDN(), c = PIDN(), prog = pick(['python3','node','java']);
  return ['Stop the program that is listening on port '+port+'.', [R_('(sudo )?kill (-15 |-9 |-TERM |-KILL )?'+b)], 'kill '+b, 'Read the pid= next to port '+port+'.',
  ['$ sudo ss -ltnp', 'State   Local Address:Port   Process', 'LISTEN  0.0.0.0:22           users:(("sshd",pid='+a+',fd=3))', 'LISTEN  0.0.0.0:'+port+'         users:(("'+prog+'",pid='+b+',fd=5))', 'LISTEN  127.0.0.1:5432       users:(("postgres",pid='+c+',fd=7))']]; });
tg('Users, processes & privilege', 2, ()=>{ const a = PIDN(), b = PIDN(), c = PIDN(), hog = pick(['backup.sh','python3 train.py','node server.js']);
  return ['One process is eating the CPU. Stop it.', [R_('(sudo )?kill (-15 |-9 |-TERM |-KILL )?'+b)], 'kill '+b, 'Look at the %CPU column.',
  ['$ ps aux --sort=-%cpu | head -4', 'USER   PID   %CPU %MEM COMMAND', 'alei   '+b+'  98.7  4.1 '+hog, 'root   '+a+'   1.2  0.3 /usr/sbin/sshd', 'alei   '+c+'   0.4  1.0 bash']]; });
tg('Reading & identifying', 1, ()=>{ const n = shuffle([0,1,2,3,4,5,6,7,8,9]).slice(0,5).sort(), hit = pick(n);
  return ['Print the only file here that contains readable text.', [R_('cat (\\./-file0'+hit+'|-- -file0'+hit+')')], 'cat ./-file0'+hit, 'The one that says ASCII text. The name starts with a dash.',
  ['$ file ./*'].concat(n.map(i=>'./-file0'+i+': '+(i===hit ? 'ASCII text' : pick(['data','data','Non-ISO extended-ASCII text','PGP Secret Sub-key']))))]; });
tg('Admin', 2, ()=>{ const mounts = shuffle([['/','78%'],['/var','100%'],['/home','41%'],['/srv','63%']]), full = mounts.find(m=>m[1]==='100%')[0];
  return ['One drive is full. Show the size of each item inside it, human-readable.', [R_('(sudo )?du -(sh|hs) '+reEsc(full)+'/\\*( \\| sort -h)?'), R_('(sudo )?du -h (--max-depth=1|-d ?1) '+reEsc(full)+'/?( \\| sort -h)?')], 'sudo du -sh '+full+'/*', 'Find the 100% line, then du -sh MOUNT/*.',
  ['$ df -h', 'Filesystem  Size  Used Avail Use% Mounted on'].concat(mounts.map((m,i)=>'/dev/sda'+(i+1)+'   50G   ..    ..  '+m[1].padStart(4)+' '+m[0]))]; });
tg('Users, processes & privilege', 1, ()=>{ const f = pick(['deploy.sh','backup.sh','cleanup.sh']);
  return ['Look at the permissions. Make the script runnable.', [R_('chmod (\\+x|u\\+x|a\\+x|7[0-7][0-7]) '+fileArg(f))], 'chmod +x '+f, 'There is no x in -rw-r--r--.',
  ['$ ls -l '+f, '-rw-r--r-- 1 alei alei 812 Oct 27 09:14 '+f]]; });
tg('Networking', 2, ()=>{ const ports = shuffle([rnd(31000,31099), rnd(31100,31299), rnd(31300,31499), rnd(31500,31699), rnd(31700,31999)]).sort((a,b)=>a-b), kinds = shuffle(['echo','ssl/echo','echo','ssl/unknown','echo']), target = ports[kinds.indexOf('ssl/unknown')];
  return ['Two ports speak SSL. Connect with TLS to the one that is NOT just an echo service.', [R_('openssl s_client (-ign_eof |-quiet )?-connect (localhost|127\\.0\\.0\\.1):'+target+'( -ign_eof| -quiet)?'), R_('(ncat|nc) --ssl (localhost|127\\.0\\.0\\.1) '+target)], 'openssl s_client -connect localhost:'+target, 'The ssl/unknown line.',
  ['$ nmap -sV -p 31000-32000 localhost', 'PORT      STATE SERVICE'].concat(ports.map((p,i)=>p+'/tcp open  '+kinds[i]))]; });
tg('Filtering text', 2, ()=>{ const ips = shuffle(['203.0.113.'+rnd(2,99), '198.51.100.'+rnd(2,99), '192.0.2.'+rnd(2,99)]), n = [rnd(150,400), rnd(20,90), rnd(1,15)];
  return ['Block the IP with the most failed logins using the Ubuntu firewall.', [R_('sudo ufw deny from '+reEsc(ips[0])), R_('sudo ufw insert 1 deny from '+reEsc(ips[0]))], 'sudo ufw deny from '+ips[0], 'The biggest count is at the top. ufw deny from IP.',
  ['$ grep "Failed password" /var/log/auth.log | awk \'{print $11}\' | sort | uniq -c | sort -nr', '    '+n[0]+' '+ips[0], '     '+n[1]+' '+ips[1], '      '+n[2]+' '+ips[2]]]; });
tg('Git', 2, ()=>{ const h = ()=>Math.random().toString(16).slice(2,9), hs = [h(),h(),h(),h()], k = rnd(1,2);
  const msgs = ['update README','fix login redirect','add config template','initial commit']; msgs[k] = pick(['remove leaked password','delete API key from config','oops, remove credentials']);
  return ['Show the changes made in the commit that removed the secret.', [R_('git show '+hs[k])], 'git show '+hs[k], 'git show HASH shows what that commit changed, including the removed line.',
  ['$ git log --oneline'].concat(hs.map((x,i)=>x+' '+msgs[i]))]; });
tg('Git', 1, ()=>{ const other = pick(['dev','staging','feature/notes','secret-branch']);
  return ['Switch to the branch that isn\'t master.', [R_('git (checkout|switch) '+reEsc(other)), R_('git checkout (remotes/)?origin/'+reEsc(other))], 'git switch '+other, 'git switch NAME (or git checkout NAME).',
  ['$ git branch -a', '* master', '  remotes/origin/HEAD -> origin/master', '  remotes/origin/master', '  remotes/origin/'+other]]; });
tg('Admin', 2, ()=>{ const script = pick(['/usr/local/bin/backup.sh','/opt/jobs/sync.sh']);
  return ['The cron job never runs. Fix the script so cron can run it.', [R_('(sudo )?chmod (\\+x|u\\+x|a\\+x|7[0-7]5|755) '+reEsc(script))], 'sudo chmod +x '+script, 'Cron can\'t run a file without x.',
  ['$ crontab -l', '*/15 * * * * '+script, '$ ls -l '+script, '-rw-r--r-- 1 root root 1.2K Oct 20 '+script]]; });
tg('Finding', 2, ()=>{ const d = pick(['maybehere0','dir0','box0'])+rnd(0,9), f = pick(['.file2','-file1','.hidden']);
  return ['The find found it. Print that file.', [R_('cat (\\./)?inhere/'+reEsc(d)+'/'+reEsc(f))], 'cat ./inhere/'+d+'/'+f, 'Copy the path find printed.',
  ['$ find inhere -type f -size 1033c ! -executable', './inhere/'+d+'/'+f]]; });
tg('Networking', 1, ()=>{ const ip = '10.0.'+rnd(0,9)+'.'+rnd(2,250), u = pick(UNAMES);
  return ['You found the server\'s address. Log in to it as '+u+'.', [R_('ssh '+reEsc(u)+'@'+reEsc(ip)), R_('ssh -l '+reEsc(u)+' '+reEsc(ip))], 'ssh '+u+'@'+ip, 'ssh USER@ADDRESS.',
  ['$ dig +short db01.internal', ip]]; });

/* ---- Fix the command: it failed; type the version that works ---- */
tg('Files & names', 1, ()=>{ const n = pad2(rnd(0,9));
  return ['That failed. Type the command that prints the file.', [R_('cat (\\./-file'+n+'|-- -file'+n+')')], 'cat ./-file'+n, 'The dash looks like an option. Make it a path.',
  ['$ cat -file'+n, 'cat: invalid option -- \'f\'', 'Try \'cat --help\' for more information.']]; });
tg('Files & names', 1, ()=>{ const f = pick(SPACED), w = f.split(' ');
  return ['That failed. Type the command that prints the file.', [R_('cat '+fileArg(f)), R_('cat '+fileArg(f.replace(/ /g,'\\ ')))], 'cat "'+f+'"', 'The spaces split it into several names. Quote it.',
  ['$ cat '+f].concat(w.map(x=>'cat: '+x+': No such file or directory'))]; });
tg('Files & names', 1, ()=>{ const d = pick(FOLDERS);
  return ['That failed. Copy the folder properly.', [R_('cp -(r|R|a|rv) '+fileArg(d)+'/? '+reEsc(d)+'_backup/?')], 'cp -r '+d+' '+d+'_backup', 'cp needs -r for folders.',
  ['$ cp '+d+' '+d+'_backup', 'cp: -r not specified; omitting directory \''+d+'\'']]; });
tg('Archives', 1, ()=>{ const d = pick(DIRS);
  return ['That failed. Extract the archive with the right compression letter.', [R_('tar -?(xjf|jxf|xvjf|xjvf|xf|xvf) '+reEsc(d)+'\\.tar\\.bz2')], 'tar -xjf '+d+'.tar.bz2', '.bz2 is bzip2: use j instead of z (or let tar detect it with -xf).',
  ['$ tar -xzf '+d+'.tar.bz2', 'gzip: stdin: not in gzip format', 'tar: Child returned status 1', 'tar: Error is not recoverable: exiting now']]; });
tg('Archives', 2, ()=>{ const d = pick(DIRS);
  return ['That failed (the names are in the wrong order). Type it correctly.', [R_('tar -?(czf|zcf|czvf|cvzf) '+reEsc(d)+'\\.tar\\.gz '+reEsc(d)+'/?')], 'tar -czf '+d+'.tar.gz '+d, 'f must be followed by the archive name; the folder comes last.',
  ['$ tar -czf '+d+' '+d+'.tar.gz', 'tar: '+d+'.tar.gz: Cannot stat: No such file or directory', 'tar: Exiting with failure status due to previous errors']]; });
tg('Users, processes & privilege', 1, ()=>{ const f = pick(['deploy.sh','backup.sh','setup.sh']);
  return ['That failed. Make the script runnable (then you could run it).', [R_('chmod (\\+x|u\\+x|a\\+x|7[0-7][0-7]) '+fileArg(f))], 'chmod +x '+f, 'Permission denied on your own script = missing x.',
  ['$ ./'+f, 'bash: ./'+f+': Permission denied']]; });
tg('Users, processes & privilege', 2, ()=>{ const u = pick(['alei','deploy','jsmith']), g = pick(['docker','developers']);
  return ['That removed '+u+' from every other group. Type the safe version.', [R_('sudo usermod -(aG|a -G) '+g+' '+u), R_('sudo gpasswd -a '+u+' '+g)], 'sudo usermod -aG '+g+' '+u, '-a means append.',
  ['$ sudo usermod -G '+g+' '+u, '$ id '+u, 'uid=1001('+u+') gid=1001('+u+') groups=1001('+u+'),998('+g+')']]; });
tg('Admin', 1, ()=>{ const s = pick(SVCS);
  return ['That failed. Restart the service properly.', [R_('sudo systemctl restart '+reEsc(s)+'(\\.service)?')], 'sudo systemctl restart '+s, 'Changing services needs admin rights.',
  ['$ systemctl restart '+s, 'Failed to restart '+s+'.service: Access denied', 'See system logs and \'systemctl status '+s+'.service\' for details.']]; });
tg('Filtering text', 1, ()=>{ const ip = ['10.0.0.5','10.0.0.9','10.0.0.5','10.0.0.9','10.0.0.5'];
  return ['uniq didn\'t group the repeats. Count each IP in ips.txt properly.', [R_('sort (\\./)?ips\\.txt \\| uniq -c( \\| sort -(nr|rn))?'), R_('cat ips\\.txt \\| sort \\| uniq -c( \\| sort -(nr|rn))?')], 'sort ips.txt | uniq -c', 'uniq only merges neighbours: sort first.',
  ['$ uniq -c ips.txt'].concat(ip.map(x=>'      1 '+x))]; });
tg('Encoding & hashing', 1, ()=>{ const f = pick(['secret.b64','data.b64']);
  return ['That encoded it again instead of decoding. Fix it.', [R_('base64 (-d|--decode) '+fileArg(f)), R_('cat '+fileArg(f)+' \\| base64 (-d|--decode)')], 'base64 -d '+f, 'Add -d.',
  ['$ base64 '+f, 'VkdobElIQmhjM04zYjNKa0lHbHpJR2hwWkdSbGJnbz0K']]; });
tg('Shell & environment', 1, ()=>{ const [v, x] = pick([['APP_ENV','prod'],['EDITOR','vim'],['PORT','8080']]);
  return ['That failed. Set the variable correctly.', [R_('export '+v+'='+reEsc(x))], 'export '+v+'='+x, 'No spaces around =.',
  ['$ export '+v+' = '+x, 'bash: export: `=\': not a valid identifier']]; });
tg('Networking', 1, ()=>{ const n = rnd(0,20);
  return ['That failed: the server doesn\'t use the normal SSH port. Bandit uses 2220.', [R_('ssh (-p ?2220 )?bandit'+n+'@bandit\\.labs\\.overthewire\\.org( -p ?2220)?')], 'ssh bandit'+n+'@bandit.labs.overthewire.org -p 2220', 'Add -p 2220.',
  ['$ ssh bandit'+n+'@bandit.labs.overthewire.org', 'ssh: connect to host bandit.labs.overthewire.org port 22: Connection refused']]; });
tg('Networking', 1, ()=>{ const h = pick(['10.0.0.5','db01.internal','8.8.8.8']);
  return ['That ping never stops (you pressed Ctrl+C). Send exactly 4 pings instead.', [R_('ping -c ?4 '+reEsc(h))], 'ping -c 4 '+h, '-c sets the count.',
  ['$ ping '+h, '64 bytes from '+h+': icmp_seq=1 ttl=63 time=0.8 ms', '64 bytes from '+h+': icmp_seq=2 ttl=63 time=0.7 ms', '... (still going) ^C']]; });
tg('Redirection', 1, ()=>{ const f = pick(['log.txt','notes.txt','history.txt']), w = pick(['done','deployed','checked']);
  return ['Oops: that erased everything in '+f+'. What should you have typed to add the line instead?', [R_('echo '+w+' >> ?'+reEsc(f))], 'echo "'+w+'" >> '+f, '>> appends; > overwrites.',
  ['$ echo "'+w+'" > '+f, '$ wc -l '+f, '1 '+f]]; });
tg('Finding', 1, ()=>{ const f = pick(['flag.txt','password.txt','notes.bak']);
  return ['Too much noise. Run the same search but hide the error messages.', [R_('find / -name '+reEsc(f)+' 2> ?/dev/null')], 'find / -name '+f+' 2>/dev/null', 'Errors go to stream 2. Send them to /dev/null.',
  ['$ find / -name '+f, 'find: \'/root\': Permission denied', 'find: \'/proc/1/task\': Permission denied', 'find: \'/etc/ssl/private\': Permission denied', '... 400 more lines ...']]; });
tg('Git', 1, ()=>{ const b = pick(['dev','staging','hotfix']);
  return ['That failed because the branch already exists. Just switch to it.', [R_('git (checkout|switch) '+b)], 'git switch '+b, 'Drop -b (that means "create").',
  ['$ git checkout -b '+b, 'fatal: a branch named \''+b+'\' already exists']]; });
tg('Admin', 2, ()=>{ const p = pick(['nmap','htop','tree']);
  return ['That failed. Install it the right way.', [R_('sudo apt(-get)? install (-y )?'+p+'( -y)?')], 'sudo apt install '+p, 'Installing software needs sudo.',
  ['$ apt install '+p, 'E: Could not open lock file /var/lib/dpkg/lock-frontend - open (13: Permission denied)', 'E: Unable to acquire the dpkg frontend lock, are you root?']]; });

/* ---- Multi-step scenarios (Bandit-style chains). Each step is [task, patterns, model, hint, output it prints];
   the next step shows that output, so you work from what you just "ran". Techniques only, never real level answers. ---- */
const TCHAIN = [];
const tgc = (sk, lv, title, f)=>TCHAIN.push({sk, lv, title, f});
function buildChain(c){
  const steps = c.f(), n = steps.length;
  return steps.map((st, i)=>{
    const t = st.slice(0, 4); t.push(c.lv); t.sk = c.sk; t.chain = {title:c.title, i, n};
    if(i > 0) t.out = ['$ '+steps[i-1][2]].concat(steps[i-1][4] || []);
    return t;
  });
}
const chainKey = steps=>steps[0].chain.title+'|'+steps.map(s=>s[2]).join('|');
function chainSet(n, lv, sk, recent){
  return freshSet(TCHAIN.filter(c=>(!lv || c.lv===lv) && (!sk || c.sk===sk)), n, buildChain, chainKey, recent);
}

tgc('Archives', 2, 'Peel a file compressed many times', ()=>{
  const layers = shuffle([['gzip compressed data','gz','gunzip data.gz','(gunzip|gzip -d) data\\.gz'], ['bzip2 compressed data','bz2','bzip2 -d data.bz2','(bunzip2|bzip2 -d) data\\.bz2'], ['XZ compressed data','xz','xz -d data.xz','(unxz|xz -d) data\\.xz']]).slice(0, 2);
  const steps = [];
  steps.push(['Check what kind of data the file "data" really is.', [R_('file (\\./)?data')], 'file data', 'file NAME', ['data: '+layers[0][0]]]);
  layers.forEach((L, i)=>{
    steps.push(['It\'s '+L[0].split(' ')[0]+'. Rename data to data.'+L[1]+' so the tool accepts it.', [R_('mv (\\./)?data (\\./)?data\\.'+L[1])], 'mv data data.'+L[1], 'mv OLD NEW', []]);
    steps.push(['Decompress data.'+L[1]+'.', [R_(L[3])], L[2], 'The matching tool with -d.', []]);
    steps.push(['Check the type again.', [R_('file (\\./)?data')], 'file data', 'file data', ['data: '+(layers[i+1] ? layers[i+1][0] : 'ASCII text')]]);
  });
  steps.push(['Plain text at last. Print it.', [R_('cat (\\./)?data'), R_('less (\\./)?data')], 'cat data', 'cat data', ['The password is <hidden in practice mode>']]);
  return steps;
});

tgc('Finding', 2, 'Find the one file that matches the clues', ()=>{
  const n = rnd(900,1200), d = 'maybehere'+pad2(rnd(0,19)), f = pick(['.file2','-file1','.hidden']);
  return [
    ['The clue: under inhere there is a regular file of exactly '+n+' bytes that is not executable. Find it.', [R_('find (\\./)?inhere/? (-type f -size '+n+'c (!|-not) -executable|-size '+n+'c -type f (!|-not) -executable|-type f (!|-not) -executable -size '+n+'c|(!|-not) -executable -type f -size '+n+'c|-size '+n+'c (!|-not) -executable -type f)')], 'find inhere -type f -size '+n+'c ! -executable', '-type f, -size Nc, ! -executable', ['inhere/'+d+'/'+f]],
    ['Check it really is human-readable.', [R_('file (\\./)?inhere/'+reEsc(d)+'/'+reEsc(f))], 'file inhere/'+d+'/'+f, 'file PATH', ['inhere/'+d+'/'+f+': ASCII text, with very long lines']],
    ['Print it.', [R_('cat (\\./)?inhere/'+reEsc(d)+'/'+reEsc(f))], 'cat inhere/'+d+'/'+f, 'cat PATH (copy it from the output)', []]
  ];
});

tgc('Filtering text', 2, 'Who is attacking the SSH server?', ()=>{
  const ips = ['203.0.113.'+rnd(2,99), '198.51.100.'+rnd(2,99), '192.0.2.'+rnd(2,99)], c = [rnd(200,500), rnd(30,90), rnd(2,15)];
  return [
    ['Count the failed SSH logins in /var/log/auth.log (lines with "Failed password").', [R_('(sudo )?grep -c Failed password /var/log/auth\\.log'), R_('(sudo )?grep Failed password /var/log/auth\\.log \\| wc -l')], 'grep -c "Failed password" /var/log/auth.log', 'grep -c "TEXT" FILE', [String(c[0]+c[1]+c[2])]],
    ['That\'s a lot. The source IPs are already saved one per line in ips.txt. Count each IP, most common first.', [R_('sort (\\./)?ips\\.txt \\| uniq -c \\| sort -(nr|rn)'), R_('cat ips\\.txt \\| sort \\| uniq -c \\| sort -(nr|rn)')], 'sort ips.txt | uniq -c | sort -nr', 'sort | uniq -c | sort -nr', ['    '+c[0]+' '+ips[0], '     '+c[1]+' '+ips[1], '      '+c[2]+' '+ips[2]]],
    ['Block the top offender with the Ubuntu firewall.', [R_('sudo ufw deny from '+reEsc(ips[0])), R_('sudo ufw insert 1 deny from '+reEsc(ips[0]))], 'sudo ufw deny from '+ips[0], 'sudo ufw deny from IP', ['Rule added']],
    ['Confirm the rule is active.', [R_('sudo ufw status( verbose| numbered)?')], 'sudo ufw status', 'ufw status', []]
  ];
});

tgc('Admin', 2, 'The website is down', ()=>{
  const pid = rnd(1000,9999), other = pick(['apache2','lighttpd']);
  return [
    ['Users say the site is down. Check the nginx service.', [R_('(sudo )?systemctl status nginx(\\.service)?')], 'systemctl status nginx', 'systemctl status NAME', ['● nginx.service - A high performance web server', '     Active: failed (Result: exit-code)']],
    ['It failed. Read the last 20 lines of its log.', [R_('(sudo )?journalctl -u nginx(\\.service)? -n ?20( --no-pager)?'), R_('(sudo )?journalctl -n ?20 -u nginx(\\.service)?')], 'journalctl -u nginx -n 20', 'journalctl -u NAME -n 20', ['nginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)']],
    ['Something else holds port 80. Find out what.', [R_('sudo lsof -i ?(tcp)?:80'), R_('sudo ss -(ltnp|lntp|tlnp) \\| grep :80'), R_('sudo fuser 80/tcp')], 'sudo lsof -i :80', 'lsof -i :PORT', ['COMMAND   PID  USER  FD  TYPE NODE NAME', other.padEnd(9)+' '+pid+' root  4u  IPv4  TCP *:http (LISTEN)']],
    ['It\'s '+other+'. Stop that service.', [R_('sudo systemctl stop '+other+'(\\.service)?')], 'sudo systemctl stop '+other, 'sudo systemctl stop NAME', []],
    ['Stop it from coming back at boot too.', [R_('sudo systemctl disable (--now )?'+other+'(\\.service)?')], 'sudo systemctl disable '+other, 'systemctl disable NAME', []],
    ['Now start nginx.', [R_('sudo systemctl (start|restart) nginx(\\.service)?')], 'sudo systemctl start nginx', 'sudo systemctl start NAME', ['(no output means it worked)']]
  ];
});

tgc('Networking', 2, 'Find the TLS port that answers', ()=>{
  const ports = [rnd(31000,31199), rnd(31200,31399), rnd(31400,31599), rnd(31600,31799), rnd(31800,31999)], kinds = shuffle(['echo','ssl/echo','echo','ssl/unknown','echo']), t = ports[kinds.indexOf('ssl/unknown')];
  return [
    ['Scan localhost ports 31000 to 32000 and identify the services.', [R_('(sudo )?nmap (-sV )?-p ?31000-32000 (localhost|127\\.0\\.0\\.1)( -sV)?'), R_('(sudo )?nmap (localhost|127\\.0\\.0\\.1) (-sV )?-p ?31000-32000( -sV)?')], 'nmap -sV -p 31000-32000 localhost', 'nmap -sV -p FIRST-LAST HOST', ['PORT      STATE SERVICE'].concat(ports.map((p,i)=>p+'/tcp open  '+kinds[i]))],
    ['Connect with TLS to the SSL port that isn\'t a plain echo.', [R_('openssl s_client (-ign_eof |-quiet )?-connect (localhost|127\\.0\\.0\\.1):'+t+'( -ign_eof| -quiet)?'), R_('(ncat|nc) --ssl (localhost|127\\.0\\.0\\.1) '+t)], 'openssl s_client -connect localhost:'+t, 'The ssl/unknown one.', ['CONNECTED(00000003)', '---', '(type the current password and press Enter)']],
    ['It sent back a private key. Save it as key.pem, then lock its permissions so SSH will use it (owner read/write only).', [R_('chmod (600|400) (\\./)?key\\.pem'), R_('chmod (u=rw,go=|go-rwx) (\\./)?key\\.pem')], 'chmod 600 key.pem', 'SSH refuses keys others can read.', []],
    ['Log in to localhost as the next user (call them next) with that key.', [R_('ssh -i (\\./)?key\\.pem next@(localhost|127\\.0\\.0\\.1)( -p ?2220)?'), R_('ssh next@(localhost|127\\.0\\.0\\.1) -i (\\./)?key\\.pem( -p ?2220)?')], 'ssh -i key.pem next@localhost', 'ssh -i KEY USER@HOST', []]
  ];
});

tgc('Git', 2, 'A password was committed to the repo', ()=>{
  const h = ()=>Math.random().toString(16).slice(2,9), hs = [h(),h(),h()], b = pick(['dev','old-config']);
  return [
    ['Look at the commit history, one line each.', [R_('git log --oneline( --all)?')], 'git log --oneline', 'git log --oneline', [hs[0]+' remove password from config', hs[1]+' add config file', hs[2]+' initial commit']],
    ['Show the changes in the commit that removed the password.', [R_('git show '+hs[0])], 'git show '+hs[0], 'git show HASH', ['-db_password=<hidden in practice mode>', '+db_password=CHANGE_ME']],
    ['It\'s still in history. Check the other branches too.', [R_('git branch (-a|--all)')], 'git branch -a', 'git branch -a', ['* master', '  remotes/origin/'+b]],
    ['Switch to '+b+'.', [R_('git (checkout|switch) '+reEsc(b)), R_('git checkout (remotes/)?origin/'+reEsc(b))], 'git switch '+b, 'git switch NAME', []],
    ['Search the whole history with its changes for the word password.', [R_('git log -p( --all)? \\| grep (-i )?password'), R_('git log -p( --all)? -S ?password'), R_('git log (--all )?-p -S ?password')], 'git log -p | grep password', 'git log -p, piped into grep', []]
  ];
});

tgc('Encoding & hashing', 2, 'Unwrap an encoded message', ()=>{
  const f = pick(['message.b64','note.b64']);
  return [
    ['Decode '+f+' from base64 and save the result as step1.txt.', [R_('base64 (-d|--decode) (\\./)?'+reEsc(f)+' > ?step1\\.txt'), R_('cat '+reEsc(f)+' \\| base64 (-d|--decode) > ?step1\\.txt')], 'base64 -d '+f+' > step1.txt', 'base64 -d FILE > OUT', []],
    ['Look at step1.txt.', [R_('cat (\\./)?step1\\.txt')], 'cat step1.txt', 'cat', ['Gur cnffjbeq vf uvqqra va cenpgvpr zbqr']],
    ['The letters are shifted 13 places (ROT13). Decode step1.txt with tr.', [R_('cat (\\./)?step1\\.txt \\| tr A-Za-z N-ZA-Mn-za-m'), R_('tr A-Za-z N-ZA-Mn-za-m < ?(\\./)?step1\\.txt'), R_('cat (\\./)?step1\\.txt \\| tr a-zA-Z n-za-mN-ZA-M'), R_('tr a-zA-Z n-za-mN-ZA-M < ?(\\./)?step1\\.txt')], "tr 'A-Za-z' 'N-ZA-Mn-za-m' < step1.txt", "tr 'A-Za-z' 'N-ZA-Mn-za-m'", ['The password is hidden in practice mode']]
  ];
});

tgc('Users, processes & privilege', 1, 'The script won\'t run', ()=>{
  const f = pick(['backup.sh','report.sh','cleanup.sh']);
  return [
    ['Run ./'+f+'.', [R_('\\./'+reEsc(f)), R_('bash '+reEsc(f))], './'+f, 'Type ./ then the name.', ['bash: ./'+f+': Permission denied']],
    ['Denied. Look at its permissions.', [R_('ls -(l|la|al|lh) (\\./)?'+reEsc(f)), R_('stat (\\./)?'+reEsc(f))], 'ls -l '+f, 'ls -l FILE', ['-rw-r--r-- 1 alei alei 640 Oct 27 08:02 '+f]],
    ['No x anywhere. Make it executable for you.', [R_('chmod (\\+x|u\\+x|a\\+x|7[0-7][0-7]) (\\./)?'+reEsc(f))], 'chmod +x '+f, 'chmod +x', []],
    ['Run it again.', [R_('\\./'+reEsc(f))], './'+f, './'+f, ['Done. Report written to /tmp/out.txt']],
    ['Read what it wrote.', [R_('cat /tmp/out\\.txt'), R_('less /tmp/out\\.txt')], 'cat /tmp/out.txt', 'cat PATH', []]
  ];
});

/* ---- Randomized SQL console challenges, grouped by skill. Each returns [level, task, patterns, model, hint, result()] like SQLT. ---- */
const JT = '(tickets|t)', JU = '(users|u)';
const ON = 'from tickets( as t| t)? (inner )?join users( as u| u)? on ('+JT+'\\.assigned_to='+JU+'\\.id|'+JU+'\\.id='+JT+'\\.assigned_to)';
const both = (a,b)=>'('+a+','+b+'|'+b+','+a+')';
const STAT = ['open','closed','in_progress'], PRIO = ['high','medium','low'];
const SGEN = [
 {sk:'Filtering (WHERE)', lv:1, f:()=>{ const v = pick(STAT); return [1,'Show all tickets whose status is \''+v+'\'.',[R_("select\\*from tickets where status='"+v+"'")],"SELECT * FROM tickets WHERE status = '"+v+"';",'WHERE column = \'value\'',()=>({cols:TK.cols, rows:TK.rows.filter(r=>r[3]===v)})]; }},
 {sk:'Filtering (WHERE)', lv:1, f:()=>{ const v = pick(PRIO); return [1,'Show all tickets with priority \''+v+'\'.',[R_("select\\*from tickets where priority='"+v+"'")],"SELECT * FROM tickets WHERE priority = '"+v+"';",'WHERE column = \'value\'',()=>({cols:TK.cols, rows:TK.rows.filter(r=>r[2]===v)})]; }},
 {sk:'Filtering (WHERE)', lv:1, f:()=>{ const p = pick(PRIO), v = pick(STAT); return [1,'Show tickets with priority \''+p+'\' AND status \''+v+'\'.',[R_("select\\*from tickets where (priority='"+p+"' and status='"+v+"'|status='"+v+"' and priority='"+p+"')")],"SELECT * FROM tickets WHERE priority = '"+p+"' AND status = '"+v+"';",'Join two conditions with AND.',()=>({cols:TK.cols, rows:TK.rows.filter(r=>r[2]===p&&r[3]===v)})]; }},
 {sk:'Filtering (WHERE)', lv:1, f:()=>{ const [c,v] = pick([['department','IT'],['department','Finance'],['department','Operations'],['location','Houston'],['location','Katy']]);
     return [1,'Show all users whose '+c+' is \''+v+'\'.',[R_("select\\*from users where "+c+"='"+v+"'")],"SELECT * FROM users WHERE "+c+" = '"+v+"';",'This one uses the users table.',()=>({cols:US.cols, rows:US.rows.filter(r=>r[col(US,c)]===v)})]; }},
 {sk:'Filtering (WHERE)', lv:1, f:()=>{ const d = pick(TK.rows)[5]; return [1,'Show tickets created on or after '+d+'.',[R_("select\\*from tickets where created_at>='"+d+"'")],"SELECT * FROM tickets WHERE created_at >= '"+d+"';",'Dates compare like text in quotes. "On or after" is >=.',()=>({cols:TK.cols, rows:TK.rows.filter(r=>r[5]>=d)})]; }},
 {sk:'Searching text (LIKE)', lv:1, f:()=>{ const w = pick(['printer','password','pos','vpn','laptop','offline','frozen','setup','jam','reset','hire','terminal']); return [1,'Find tickets with "'+w+'" anywhere in the title.',[R_("select\\*from tickets where title like '%"+w+"%'")],"SELECT * FROM tickets WHERE title LIKE '%"+w+"%';",'LIKE with % on both sides.',()=>({cols:TK.cols, rows:TK.rows.filter(r=>r[1].toLowerCase().includes(w))})]; }},
 {sk:'Searching text (LIKE)', lv:1, f:()=>{ const l = pick(['P','N','V']); return [1,'Find tickets whose title starts with the letter '+l+'.',[R_("select\\*from tickets where title like '"+l.toLowerCase()+"%'")],"SELECT * FROM tickets WHERE title LIKE '"+l+"%';",'% only at the end means "starts with".',()=>({cols:TK.cols, rows:TK.rows.filter(r=>r[1].toLowerCase().startsWith(l.toLowerCase()))})]; }},
 {sk:'Searching text (LIKE)', lv:1, f:()=>{ const w = pick(['reset','frozen','setup','office','connecting']); return [1,'Find tickets whose title ends with "'+w+'".',[R_("select\\*from tickets where title like '%"+w+"'")],"SELECT * FROM tickets WHERE title LIKE '%"+w+"';",'% only at the start means "ends with".',()=>({cols:TK.cols, rows:TK.rows.filter(r=>r[1].toLowerCase().endsWith(w))})]; }},
 {sk:'Sorting & limiting', lv:1, f:()=>{ const n = rnd(1,5), desc = Math.random()<.5;
     return [1,'Show the '+n+' '+(desc?'newest':'oldest')+' ticket'+(n>1?'s':'')+' (by created_at).',[R_('select\\*from tickets order by created_at '+(desc?'desc ':'(asc )?')+'limit '+n)],'SELECT * FROM tickets ORDER BY created_at '+(desc?'DESC ':'')+'LIMIT '+n+';',(desc?'Newest first = DESC':'Oldest first is the default (ASC)')+', then LIMIT.',
       ()=>({cols:TK.cols, rows:TK.rows.slice().sort((a,b)=>desc?b[5].localeCompare(a[5]):a[5].localeCompare(b[5])).slice(0,n)})]; }},
 {sk:'Choosing columns', lv:1, f:()=>{ const [a,b] = shuffle(['title','priority','status','created_at']).slice(0,2);
     return [1,'Show only the '+a+' and '+b+' of every ticket.',[R_('select '+both(a,b)+' from tickets')],'SELECT '+a+', '+b+' FROM tickets;','List the columns, separated by commas.',()=>proj(TK,[a,b],TK.rows)]; }},
 {sk:'Counting & grouping', lv:1, f:()=>{ const v = pick(STAT); return [1,'How many tickets have status \''+v+'\'?',[new RegExp('^select '+CNT+"from tickets where status='"+v+"'$")],"SELECT COUNT(*) FROM tickets WHERE status = '"+v+"';",'COUNT(*) plus a WHERE.',()=>({cols:['count(*)'], rows:[[TK.rows.filter(r=>r[3]===v).length]]})]; }},
 {sk:'Counting & grouping', lv:1, f:()=>{ const v = pick(PRIO); return [1,'How many tickets have priority \''+v+'\'?',[new RegExp('^select '+CNT+"from tickets where priority='"+v+"'$")],"SELECT COUNT(*) FROM tickets WHERE priority = '"+v+"';",'COUNT(*) plus a WHERE.',()=>({cols:['count(*)'], rows:[[TK.rows.filter(r=>r[2]===v).length]]})]; }},
 {sk:'Counting & grouping', lv:1, f:()=>[1,'How many tickets have no one assigned?',[new RegExp('^select '+CNT+'from tickets where assigned_to is null$')],'SELECT COUNT(*) FROM tickets WHERE assigned_to IS NULL;','Empty values are NULL, and you test them with IS NULL (not = NULL).',()=>({cols:['count(*)'], rows:[[TK.rows.filter(r=>r[4]===null).length]]})]},
 {sk:'Counting & grouping', lv:2, f:()=>{ const c = pick(['status','priority']); return [2,'Show each '+c+' with how many tickets have it.',[new RegExp('^select '+c+','+CNT+'from tickets group by '+c+'$')],'SELECT '+c+', COUNT(*) FROM tickets GROUP BY '+c+';','GROUP BY the column, COUNT(*) per group.',()=>{ const m = new Map(); TK.rows.forEach(r=>m.set(r[col(TK,c)], (m.get(r[col(TK,c)])||0)+1)); return {cols:[c,'count(*)'], rows:[...m]}; }]; }},
 {sk:'Counting & grouping', lv:2, f:()=>{ const n = rnd(0,2); return [2,'Show each priority with its ticket count, keeping only priorities with more than '+n+' ticket'+(n===1?'':'s')+'.',[new RegExp('^select priority,'+CNT+'from tickets group by priority having count\\((\\*|id)\\)>'+n+'$')],'SELECT priority, COUNT(*) FROM tickets GROUP BY priority HAVING COUNT(*) > '+n+';','GROUP BY, then HAVING to filter the groups.',()=>({cols:['priority','count(*)'], rows:countBy(TK.rows,2).filter(x=>x[1]>n)})]; }},
 {sk:'Joins', lv:2, f:()=>{ const u = pick(US.rows.filter(r=>TK.rows.some(t=>t[4]===r[0])));
     return [2,'Using a JOIN, show the titles of tickets assigned to '+u[1]+'.',[new RegExp('^select ('+JT+'\\.)?title '+ON+' where ('+JU+'\\.)?name=\''+u[1]+'\'$')],'SELECT tickets.title FROM tickets JOIN users ON tickets.assigned_to = users.id WHERE users.name = \''+u[1]+'\';','JOIN users ON tickets.assigned_to = users.id, then WHERE on the name.',()=>({cols:['title'], rows:TK.rows.filter(t=>t[4]===u[0]).map(t=>[t[1]])})]; }},
 {sk:'Joins', lv:2, f:()=>[2,'Using a JOIN, show each person\'s name with how many tickets are assigned to them.',[new RegExp('^select ('+JU+'\\.)?name,'+CNT+ON+' group by ('+JU+'\\.)?name$')],'SELECT users.name, COUNT(*) FROM tickets JOIN users ON tickets.assigned_to = users.id GROUP BY users.name;','JOIN, then GROUP BY the name and COUNT(*).',
     ()=>{ const m = new Map(); TK.rows.filter(t=>t[4]!==null).forEach(t=>{ const nm = userName(t[4]); m.set(nm, (m.get(nm)||0)+1); }); return {cols:['name','count(*)'], rows:[...m]}; }]},
 {sk:'Joins', lv:2, f:()=>{ const p = pick(['high','low']); return [2,'Show the title and assignee name of every \''+p+'\' priority ticket that has an assignee.',[new RegExp('^select '+JT+'\\.title,'+JU+'\\.name '+ON+' where ('+JT+'\\.)?priority=\''+p+'\'$')],'SELECT tickets.title, users.name FROM tickets JOIN users ON tickets.assigned_to = users.id WHERE tickets.priority = \''+p+'\';','JOIN first, then WHERE tickets.priority.',
     ()=>({cols:['title','name'], rows:TK.rows.filter(t=>t[4]!==null && t[2]===p).map(t=>[t[1], userName(t[4])])})]; }},
 {sk:'Joins', lv:2, f:()=>[2,'Show every ticket\'s title with its assignee\'s name, keeping tickets that have no assignee.',[new RegExp('^select '+JT+'\\.title,'+JU+'\\.name '+ON.replace('(inner )?join','left (outer )?join')+'$')],'SELECT tickets.title, users.name FROM tickets LEFT JOIN users ON tickets.assigned_to = users.id;','LEFT JOIN keeps every row from the first table.',
     ()=>({cols:['title','name'], rows:TK.rows.map(t=>[t[1], userName(t[4])])})]},
 {sk:'Joins', lv:2, f:()=>{ const d = pick(['IT','Finance','Operations']); return [2,'Using a JOIN, show the titles of tickets assigned to people in the '+d+' department.',[new RegExp('^select ('+JT+'\\.)?title '+ON+' where ('+JU+'\\.)?department=\''+d+'\'$')],'SELECT tickets.title FROM tickets JOIN users ON tickets.assigned_to = users.id WHERE users.department = \''+d+'\';','JOIN users, then WHERE users.department.',
     ()=>({cols:['title'], rows:TK.rows.filter(t=>t[4]!==null && US.rows.find(u=>u[0]===t[4])[2]===d).map(t=>[t[1]])})]; }},
 {sk:'Joins', lv:2, f:()=>{ const loc = pick(['Houston','Katy']);
     return [2,'Show each ticket title with its assignee\'s name, only for people located in '+loc+'.',[new RegExp('^select '+JT+'\\.title,'+JU+'\\.name '+ON+' where ('+JU+'\\.)?location=\''+loc+'\'$')],'SELECT tickets.title, users.name FROM tickets JOIN users ON tickets.assigned_to = users.id WHERE users.location = \''+loc+'\';','JOIN first, then filter with WHERE users.location.',
       ()=>({cols:['title','name'], rows:TK.rows.filter(t=>t[4]!==null && US.rows.find(u=>u[0]===t[4])[3]===loc).map(t=>[t[1], userName(t[4])])})]; }},
 {sk:'Changing data (UPDATE / DELETE)', lv:2, f:()=>{ const id = pick(TK.rows)[0], p = pick(PRIO);
     return [2,'Change ticket '+id+'\'s priority to \''+p+'\'.',[R_("update tickets set priority='"+p+"' where id="+id)],"UPDATE tickets SET priority = '"+p+"' WHERE id = "+id+";",'UPDATE table SET column = value WHERE id = ...',()=>({msg:'1 row updated: ticket '+id+' now has priority '+p+'. (Practice only; the database resets.)'})]; }},
 {sk:'Changing data (UPDATE / DELETE)', lv:2, f:()=>{ const id = pick(TK.rows)[0];
     return [2,'Delete ticket '+id+' (and only that ticket).',[R_('delete from tickets where id='+id)],'DELETE FROM tickets WHERE id = '+id+';','DELETE FROM table WHERE ... (never forget the WHERE).',()=>({msg:'1 row deleted: ticket '+id+'. (Practice only; the database resets.)'})]; }}
];
const skillsOf = list=>[...new Set(list.map(g=>g.sk))];
function genTask(list, lv, sk){
  const pool = list.filter(g=>(!lv || g.lv===lv) && (!sk || g.sk===sk)); if(!pool.length) return null;
  const g = pick(pool), t = g.f(); if(t) t.sk = g.sk; return t;
}

/* Every quiz generator is labelled where it is defined with sk(); this only records its level and refuses to start
   with an unlabelled one, so adding or reordering generators can never shift another generator's skill. */
for(const tid in GEN) for(const lv of [1,2]) (GEN[tid][lv]||[]).forEach((f,i)=>{ if(!f.sk) throw new Error('Unlabelled quiz generator '+tid+' L'+lv+' #'+i); f.lv = lv; });
function genFor(tid, lv, sk){ const g = GEN[tid]; if(!g) return []; const all = lv ? (g[lv]||[]) : [...(g[1]||[]), ...(g[2]||[])]; return sk ? all.filter(f=>f.sk===sk) : all; }
function makeGen(tid, lv, sk){
  const gens = genFor(tid, lv, sk);
  for(let t=0;t<20;t++){ const f = pick(gens), q = f(); if(q){ q.sk = f.sk; q.tid = tid; q.noType = !!f.noType; return q; } }
  return null;
}

/* ---- No-repeat sets, shared by Quiz, Terminal and SQL console ----
   Generators take turns (shuffled round-robin), so every template is used before any repeats, and the
   same question never appears twice in one set. Questions seen in recent sessions are avoided while
   there are others to pick. If a skill can't produce n different questions, the set is shorter. */
function freshSet(gens, n, run, keyOf, recent, seen){
  const out = [], old = new Set(recent || []);
  seen = seen || new Set();   /* pass your own Set to keep several calls free of repeats */
  let order = [];
  for(let tries = 0; gens.length && out.length < n && tries < n*40; tries++){
    if(!order.length) order = shuffle(gens);
    const g = order.pop(), it = run(g); if(!it) continue;
    const k = keyOf(it); if(seen.has(k)) continue;
    if(old.has(k) && tries < n*20) continue;
    seen.add(k); out.push(it);
  }
  return out;
}
/* recent: {quiz:[keys], term:[keys], sql:[keys]}, newest last */
function rememberRecent(recent, kind, keys){ recent[kind] = (recent[kind] || []).concat(keys).slice(-80); }
const termKey = t=>t[0]+(t.out ? '|'+t.out.join('|') : ''), sqlKey = t=>t[1], quizKey = q=>q.d[2];
function termSet(n, lv, sk, recent){
  return freshSet(TGEN.filter(g=>(!lv || g.lv===lv) && (!sk || g.sk===sk)), n, g=>{ const t = g.f(); if(t) t.sk = g.sk; return t; }, termKey, recent);
}
function sqlSet(n, lv, sk, recent){
  return freshSet(SGEN.filter(g=>(!lv || g.lv===lv) && (!sk || g.sk===sk)), n, g=>{ const t = g.f(); if(t) t.sk = g.sk; return t; }, sqlKey, recent);
}
function quizSet(tid, n, lv, sk, recent){
  return freshSet(genFor(tid, lv, sk), n, f=>{ const q = f(); if(q){ q.sk = f.sk; q.tid = tid; q.noType = !!f.noType; } return q; }, quizKey, recent);
}
/* Questions with more than one correct answer can't be typed (e.g. "which host is in the same subnet"). */
/* [[skill, [levels]], ...] for one track, in first-seen order */
function genSkills(tid){ const m = new Map(); genFor(tid).forEach(f=>{ if(!m.has(f.sk)) m.set(f.sk, new Set()); m.get(f.sk).add(f.lv); }); return [...m].map(([k,v])=>[k,[...v].sort()]); }

