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

const GEN = {
 net:{1:[
  ()=>{ const [p,s] = pick(PORTS); return Math.random()<.5
      ? mcq('net',1,'Which service uses port <code>'+p+'</code> by default?', s, PORTS.map(x=>x[1]), 'Port '+p+' = '+s+'.')
      : mcq('net',1,'Which port does <b>'+s+'</b> use by default?', p, PORTS.map(x=>x[0]), s+' = port '+p+'.'); },
  ()=>{ const r = ipStr(privIP()); return mcq('net',1,'Which of these is a <b>private</b> IP address?', r, [ipStr(pubIP()),ipStr(pubIP()),ipStr(pubIP()),ipStr(pubIP())],
      '<code>'+r+'</code> is private. Private ranges: 10.0.0.0/8, 172.16.0.0 to 172.31.255.255, and 192.168.0.0/16. Watch for look-alikes such as 172.32.x.x or 192.169.x.x, which are public.'); },
  ()=>{ const p = rnd(22,30), h = Math.pow(2,32-p)-2;
      return mcq('net',1,'How many usable host addresses are in a <code>/'+p+'</code> network?', h, [h+2, Math.pow(2,33-p)-2, Math.pow(2,31-p)-2, h+1],
      'Usable hosts = 2^(32 − '+p+') − 2 = '+(h+2)+' − 2 = '+h+'. The 2 removed are the network and broadcast addresses.'); },
  ()=>{ const p = rnd(20,30); return mcq('net',1,'Which subnet mask is the same as <code>/'+p+'</code>?', maskOf(p), [maskOf(p-1),maskOf(p+1),maskOf(p+2),maskOf(p-2)],
      '/'+p+' means '+p+' ones in the mask, which is '+maskOf(p)+'.'); },
  ()=>{ const kinds = [[()=>[127,0,0,rnd(1,9)],'Loopback: the device talking to itself'],[()=>[169,254,rnd(0,255),rnd(1,254)],'APIPA: the device could not reach a DHCP server'],[privIP,'A normal private address on a local network'],[pubIP,'A public address on the internet']];
      const [f,m] = pick(kinds); const ip = ipStr(f());
      return mcq('net',1,'A device shows the address <code>'+ip+'</code>. What does that tell you?', m, kinds.map(k=>k[1]), '<code>'+ip+'</code>: '+m+'.'); }
 ],2:[
  ()=>{ const p = rnd(25,29), blk = Math.pow(2,32-p), a=[192,168,rnd(0,255),rnd(1,254)], net = a[3]-a[3]%blk, bc = net+blk-1, wantNet = Math.random()<.5;
      const pre = a.slice(0,3).join('.')+'.'; const right = pre+(wantNet?net:bc);
      return mcq('net',2,'What is the <b>'+(wantNet?'network':'broadcast')+' address</b> of <code>'+ipStr(a)+'/'+p+'</code>?', right,
        [pre+(wantNet?bc:net), pre+((net+blk)%256), pre+Math.max(0,net-blk), pre+(wantNet?net+1:bc-1), pre+a[3]],
        '/'+p+' makes blocks of '+blk+' addresses. '+a[3]+' falls in the block '+net+' to '+bc+', so the network address is '+pre+net+' and the broadcast is '+pre+bc+'.'); },
  ()=>{ const p = rnd(26,28), blk = Math.pow(2,32-p), c = rnd(0,255), d = rnd(1,254), net = d-d%blk;
      let inSame = d; while(inSame===d) inSame = net + rnd(1, blk-2);
      const others = [];
      for(let s=0;s<256;s+=blk) if(s!==net) others.push(s + rnd(1, blk-2));
      return mcq('net',2,'Which host is in the same subnet as <code>10.1.'+c+'.'+d+'/'+p+'</code>?', '10.1.'+c+'.'+inSame, shuffle(others).slice(0,5).map(x=>'10.1.'+c+'.'+x),
        '/'+p+' makes blocks of '+blk+'. '+d+' is in the block '+net+' to '+(net+blk-1)+', and so is '+inSame+'.'); },
  ()=>{ const [t,m] = pick(DNSR); return Math.random()<.5
      ? mcq('net',2,'What does a DNS <b>'+t+'</b> record do?', m, DNSR.map(x=>x[1]), t+': '+m+'.')
      : mcq('net',2,'Which DNS record type: "'+m+'"?', t, DNSR.map(x=>x[0]), t+': '+m+'.'); }
 ]},
 linux:{1:[
  ()=>{ const d = [7,pick([7,5,4,6]),pick([5,4,0,6,1])].join(''), r = permStr(d);
      const wr = [permStr([d[0],d[2],d[1]].join('')), permStr('7'+d[1]+'7'), permStr(String(+d[0]-1 >= 0 ? (+d[0]===7?6:7) : 7)+d.slice(1)), permStr(d[1]+d[0]+d[2]), permStr('6'+d[1]+d[2])];
      return mcq('linux',1,'What permissions does <code>chmod '+d+' file</code> set?', r, wr,
        'Each digit is owner, group, others. r=4, w=2, x=1. '+d.split('').map(x=>x+' = '+permSym(+x)).join(', ')+'.'); },
  ()=>{ const d = [pick([7,6]),pick([5,4,6,0]),pick([4,0,5])].join(''), s = permStr(d);
      return mcq('linux',1,'Which number matches the permissions <code>'+s+'</code>?', d, [d[0]+d[2]+d[1], d[1]+d[0]+d[2], '7'+d.slice(1), d.slice(0,2)+'7', '777'],
        'Add r=4, w=2, x=1 for each group of three: '+[0,1,2].map(i=>s.slice(i*3,i*3+3)+' = '+d[i]).join(', ')+'.'); },
  ()=>{ const f = pick(FILES), w = pick(WORDS);
      const T = [['Show the contents of '+f,'cat '+f],['Count the lines in '+f,'wc -l '+f],['Show the first 10 lines of '+f,'head '+f],['Show the last 10 lines of '+f,'tail '+f],['Delete '+f,'rm '+f],['Rename '+f+' to old_'+f,'mv '+f+' old_'+f],['Find lines containing "'+w+'" in '+f,'grep '+w+' '+f],['Copy '+f+' into /tmp','cp '+f+' /tmp/']];
      const [task, ans] = pick(T);
      return mcq('linux',1,'Which command will: <b>'+task+'</b>?', '<code>'+ans+'</code>', T.map(x=>'<code>'+x[1]+'</code>'), '<code>'+ans+'</code>'); },
  ()=>{ const P = [['/etc','Configuration files'],['/var/log','Log files'],['/home','Each user\'s personal folder'],['/tmp','Temporary files, often cleared on reboot'],['/usr/bin','Installed programs (commands)'],['/root','The root (admin) user\'s home folder']];
      const [d,m] = pick(P); return Math.random()<.5
      ? mcq('linux',1,'What usually lives in <code>'+d+'</code>?', m, P.map(x=>x[1]), d+': '+m+'.')
      : mcq('linux',1,'Where would you look for: '+m.toLowerCase()+'?', '<code>'+d+'</code>', P.map(x=>'<code>'+x[0]+'</code>'), d+': '+m+'.'); }
 ],2:[
  ()=>{ const m = rnd(0,59), h = rnd(0,23), dw = Math.random()<.5 ? '*' : rnd(0,6);
      const when = (x,y)=>'At '+pad2(x)+':'+pad2(y)+(dw==='*'?' every day':' every '+DAYS[dw]);
      const line = m+' '+h+' * * '+dw;
      return mcq('linux',2,'When does the cron line <code>'+line+' /opt/job.sh</code> run?', when(h,m),
        [h<60&&m<24?when(m,h):'Every '+m+' minutes', 'Every '+(m||5)+' minutes', when(h,m).replace(dw==='*'?'every day':'every '+DAYS[dw], dw==='*'?'every Monday':'every day'), 'On day '+(h||1)+' of every month at '+pad2(0)+':'+pad2(m), 'At '+pad2((h+12)%24)+':'+pad2(m)+(dw==='*'?' every day':' every '+DAYS[dw])],
        'Cron fields: minute ('+m+'), hour ('+h+'), day of month (*), month (*), weekday ('+dw+(dw==='*'?' = any':' = '+DAYS[dw])+').'); },
  ()=>{ const T = [['See which filesystem is full','df -h'],['Find which folders use the most space','du -sh /var/* | sort -h'],['Check memory usage','free -h'],['See which programs listen on which ports','ss -tulpn'],['Restart a service','systemctl restart nginx'],['Read a service\'s log','journalctl -u nginx'],['Edit scheduled jobs','crontab -e'],['Change a file\'s owner','chown user:group file']];
      const [t,a] = pick(T); return mcq('linux',2,'Which command would you use to: <b>'+t+'</b>?', '<code>'+a+'</code>', T.map(x=>'<code>'+x[1]+'</code>'), '<code>'+a+'</code>'); }
 ]},
 code:{1:[
  ()=>{ const [c,m] = pick(HTTP); return Math.random()<.5
      ? mcq('code',1,'An API returns status <code>'+c+'</code>. What does it mean?', m, HTTP.map(x=>x[1]), c+' = '+m+'. 2xx success, 3xx redirect, 4xx client error, 5xx server error.')
      : mcq('code',1,'Which status code means: "'+m+'"?', c, HTTP.map(x=>x[0]), c+' = '+m+'.'); },
  ()=>{ const kind = rnd(0,3);
      if(kind===0){ const a = rnd(7,40), b = rnd(2,6), r = Math.floor(a/b); return mcq('code',1,'What does Python print? <code>print('+a+' // '+b+')</code>', r, [r+1, r-1, (a/b).toFixed(1), a%b], '// is floor division: '+a+' ÷ '+b+' = '+(a/b).toFixed(2)+', rounded down to '+r+'.'); }
      if(kind===1){ const a = rnd(7,40), b = rnd(2,6), r = a%b; return mcq('code',1,'What does Python print? <code>print('+a+' % '+b+')</code>', r, [Math.floor(a/b), r+1, b-r===r?r+2:b-r, 0, 1], '% gives the remainder: '+a+' = '+b+' × '+Math.floor(a/b)+' + '+r+'.'); }
      if(kind===2){ const xs = shuffle(['web','db','vpn','dns','mail','pos']).slice(0,rnd(3,5)), i = rnd(-1, xs.length-1), r = xs[(i+xs.length)%xs.length];
        return mcq('code',1,'What does this print?<br><code>items = ['+xs.map(x=>'"'+x+'"').join(', ')+']</code><br><code>print(items['+i+'])</code>', r, xs, 'Python counts from 0'+(i<0?', and -1 means the last item':'')+', so items['+i+'] is "'+r+'" and print shows it without quotes.'); }
      const xs = Array.from({length:rnd(2,6)},()=>rnd(1,9)); return mcq('code',1,'What does Python print? <code>print(len(['+xs.join(', ')+']))</code>', xs.length, [xs.length+1, xs.length-1, xs.reduce((s,x)=>s+x,0), Math.max(...xs)], 'len() counts the items: '+xs.length+'.'); },
  ()=>{ const T = [['Save a snapshot of staged changes','git commit -m "message"'],['Stage every changed file','git add .'],['Send your commits to GitHub','git push'],['Get teammates\' latest commits','git pull'],['See what changed and what is staged','git status'],['Create a branch and switch to it','git switch -c new-feature'],['See commit history in short form','git log --oneline'],['Safely undo a pushed commit','git revert &lt;commit&gt;']];
      const [t,a] = pick(T); return mcq('code',1,'Which Git command: <b>'+t+'</b>?', '<code>'+a+'</code>', T.map(x=>'<code>'+x[1]+'</code>'), '<code>'+a+'</code>'); }
 ],2:[
  ()=>{ const n = rnd(100,999), msg = pick(['disk full','timeout','service stopped','login failed']);
      const P = [
        ['^ERROR', 'ERROR '+msg, ['INFO ERROR '+msg, 'error '+msg, ' ERROR '+msg]],
        ['\\d{3}$', 'code '+n, ['code '+n+' ok', 'code '+(n%100), 'code 12a']],
        ['^\\d{1,3}(\\.\\d{1,3}){3}$', ipStr(privIP()), ['10.0.'+rnd(0,255), 'host 10.0.0.'+rnd(1,254), '192.168.1.x']]];
      const [re, ok, bad] = pick(P), R = new RegExp(re);
      if(!R.test(ok) || bad.some(b=>R.test(b))) return null;
      return mcq('code',2,'Which line matches the regex <code>'+esc(re)+'</code>?', '<code>'+esc(ok)+'</code>', bad.map(b=>'<code>'+esc(b)+'</code>'),
        '^ = start of line, $ = end of line, \\d = a digit, {3} = exactly three, \\. = a literal dot.'); },
  ()=>{ const L = [['Disk is 90% full','WARNING'],['Payment service crashed','ERROR'],['User logged in','INFO'],['Variable x = 42 inside loop','DEBUG'],['Database is unreachable; nothing works','CRITICAL']];
      const [m,l] = pick(L); return mcq('code',2,'Which logging level fits: "'+m+'"?', l, ['DEBUG','INFO','WARNING','ERROR','CRITICAL'], m+' = '+l+'. DEBUG < INFO < WARNING < ERROR < CRITICAL.'); }
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
const ADMIN = [['Reset a user\'s password or assign a license','Microsoft 365 admin center'],['Read a user\'s sign-in logs and Conditional Access results','Microsoft Entra admin center'],['Push an app or a policy to company laptops','Microsoft Intune admin center'],['Trace why an email never arrived (message trace)','Exchange admin center'],['Manage Teams policies and meeting settings','Teams admin center']];
const TESTTYPES = [['A quick check that a new build\'s main features work','Smoke testing'],['Re-running existing tests after a change','Regression testing'],['Checking that the app and the payment API work together','Integration testing'],['Business users confirm it meets their needs before go-live','User acceptance testing (UAT)'],['Seeing how the site handles 1,000 users at once','Load / performance testing'],['Testing one function on its own','Unit testing'],['Time-boxed, unscripted testing to find surprises','Exploratory testing']];
const LV3 = ['High','Medium','Low'];
GEN.sec = {1:[
  ()=>{ const [s,a] = pick(CIA); return mcq('sec',1,'"'+s+'." Which part of the CIA triad is hurt most?', a, ['Confidentiality','Integrity','Availability','Authentication','Non-repudiation'],
      'Confidentiality = who can see it. Integrity = whether it is accurate and unchanged. Availability = whether it works when needed. Here: '+a+'.'); },
  ()=>{ const types = Object.keys(FACTORS), t = pick(types), item = pick(FACTORS[t]);
      return mcq('sec',1,'Logging in with <b>'+item+'</b> is which type of authentication factor?', t, [...types, 'Somewhere you are'], item+' = '+t.toLowerCase()+'.'); },
  ()=>{ const types = Object.keys(FACTORS), [t1,t2] = shuffle(types).slice(0,2), right = pick(FACTORS[t1])+' + '+pick(FACTORS[t2]);
      const same = ()=>{ const t = pick(types.filter(x=>FACTORS[x].length>1)); const [a,b] = shuffle(FACTORS[t]).slice(0,2); return a+' + '+b; };
      return mcq('sec',1,'Which login combination is true multi-factor authentication (MFA)?', right, [same(), same(), same(), same()],
        'MFA needs two DIFFERENT factor types. '+right+' combines '+t1.toLowerCase()+' and '+t2.toLowerCase()+'. Two of the same type is not MFA.'); },
  ()=>{ const k = pick(['hash','sym','asym']), right = pick(CRYPTO[k]);
      const others = Object.entries(CRYPTO).filter(([x])=>x!==k).flatMap(([,v])=>v);
      const name = {hash:'a <b>hashing</b> algorithm (one-way)', sym:'<b>symmetric</b> encryption (one shared key)', asym:'<b>asymmetric</b> encryption (public/private key pair)'}[k];
      return mcq('sec',1,'Which of these is '+name+'?', right, others,
        'Hashing: SHA-256, SHA-1, MD5, bcrypt, Argon2. Symmetric: AES, ChaCha20, 3DES. Asymmetric: RSA, ECC.'); }
 ],2:[
  ()=>{ const [id,m] = pick(EVENTS); return Math.random()<.5
      ? mcq('sec',2,'Windows Security Event ID <code>'+id+'</code> means:', m, EVENTS.map(x=>x[1]), id+' = '+m.toLowerCase()+'.')
      : mcq('sec',2,'Which Windows Event ID records: <b>'+m.toLowerCase()+'</b>?', id, EVENTS.map(x=>x[0]), m+' = '+id+'.'); },
  ()=>{ const s = (rnd(1,100)/10).toFixed(1), v = +s, r = v>=9?'Critical':v>=7?'High':v>=4?'Medium':'Low';
      return mcq('sec',2,'A vulnerability has a CVSS score of <b>'+s+'</b>. What is its severity rating?', r, ['Low','Medium','High','Critical','None'],
        'CVSS ratings: 0.1–3.9 Low, 4.0–6.9 Medium, 7.0–8.9 High, 9.0–10.0 Critical. '+s+' is '+r+'.'); },
  ()=>{ const fail = rnd(0,3), copies = fail===1 ? rnd(1,2) : rnd(3,4), media = fail===2 ? 1 : rnd(2,3), off = fail===3 ? 0 : 1;
      const right = ['Yes, it meets 3-2-1','No: it needs at least 3 copies','No: it needs 2 different types of storage','No: it needs 1 copy offsite'][fail];
      return mcq('sec',2,'A backup plan keeps <b>'+copies+'</b> cop'+(copies===1?'y':'ies')+' of the data, on <b>'+media+'</b> type'+(media===1?'':'s')+' of storage, with <b>'+(off?'one copy offsite':'no copy offsite')+'</b>. Does it meet the 3-2-1 rule?', right,
        ['Yes, it meets 3-2-1','No: it needs at least 3 copies','No: it needs 2 different types of storage','No: it needs 1 copy offsite'],
        '3-2-1 = 3 copies, 2 types of storage, 1 offsite. This plan: '+copies+' copies, '+media+' type'+(media===1?'':'s')+', '+(off?'1':'0')+' offsite.'); }
 ]};
GEN.support = {1:[
  ()=>{ const i = rnd(0, STEPS.length-2); return mcq('support',1,'Troubleshooting method: what comes right after "<b>'+STEPS[i]+'</b>"?', STEPS[i+1], STEPS.filter((x,k)=>k!==i),
      'The 7 steps: '+STEPS.map((s,k)=>(k+1)+'. '+s).join(' ')); },
  ()=>{ const [t,a] = pick(TOOLS); return mcq('support',1,'Which Windows tool or command would you use to: <b>'+t+'</b>?', a, TOOLS.map(x=>x[1]), a+'.'); },
  ()=>{ const im = rnd(0,2), ur = rnd(0,2), score = (3-im)+(3-ur), p = score>=6?'P1':score===5?'P2':score===4?'P3':'P4';
      const who = ['The whole restaurant (many users)','One team of about 5 people','One user'][im], how = ['Work is completely stopped right now','Work is slowed, but there is a workaround','It can wait; nothing is blocked'][ur];
      return mcq('support',1,'Using a standard impact × urgency matrix, what priority is this ticket?<br>• <b>Who is affected:</b> '+who+'<br>• <b>Urgency:</b> '+how, p, ['P1','P2','P3','P4'],
        'Impact '+LV3[im]+' + urgency '+LV3[ur]+'. High + High = P1. One High and one Medium = P2. Medium + Medium, or High + Low = P3. Lower than that = P4.'); }
 ],2:[
  ()=>{ const [s,a] = pick(ITIL); return mcq('support',2,'In ITIL terms, "'+s+'" is:', a, ['Incident','Service request','Problem','Change'],
      'Incident: something broke, restore service. Service request: a standard ask. Problem: find the root cause of repeat incidents. Change: a planned, approved modification.'); },
  ()=>{ const [t,a] = pick(ADMIN); return mcq('support',2,'Where would you go to: <b>'+t+'</b>?', a, ADMIN.map(x=>x[1]), a+'.'); }
 ]};
GEN.qa = {1:[
  ()=>{ const lo = rnd(1,50), hi = lo + rnd(5,100), mid = Math.round((lo+hi)/2);
      return mcq('qa',1,'A field accepts whole numbers from <b>'+lo+'</b> to <b>'+hi+'</b>. Which set is the best boundary-value test?', [lo-1,lo,hi,hi+1].join(', '),
        [[lo,hi].join(', '), [lo+1,hi-1].join(', '), String(mid), [lo-1,hi+1].join(', '), [0,mid,1000].join(', ')],
        'Test just outside and just inside each edge: '+(lo-1)+' (invalid), '+lo+' (valid), '+hi+' (valid), '+(hi+1)+' (invalid).'); },
  ()=>{ const lo = rnd(10,60), hi = lo + rnd(10,80), grp = pick(['valid','too low','too high']);
      const v = {valid:()=>rnd(lo+1,hi-1), 'too low':()=>rnd(Math.max(0,lo-30),lo-1), 'too high':()=>rnd(hi+1,hi+40)};
      const right = v[grp](), wrongs = Object.keys(v).filter(g=>g!==grp).flatMap(g=>[v[g](), v[g]()]);
      return mcq('qa',1,'A field accepts '+lo+' to '+hi+'. Using equivalence partitioning, which value belongs to the <b>'+grp+'</b> group?', right, wrongs,
        'The groups are: too low (below '+lo+'), valid ('+lo+' to '+hi+'), too high (above '+hi+'). '+right+' is '+grp+'.'); },
  ()=>{ const [s,a] = pick(TESTTYPES); return mcq('qa',1,'"'+s+'" is called:', a, TESTTYPES.map(x=>x[1]), a+'.'); }
 ],2:[
  ()=>{ const i = rnd(0, STLC.length-2); return mcq('qa',2,'In the Software Testing Life Cycle, what comes right after "<b>'+STLC[i]+'</b>"?', STLC[i+1], STLC.filter((x,k)=>k!==i),
      'STLC order: '+STLC.join(' → ')+'.'); },
  ()=>{ const reopen = Math.random()<.3;
      if(reopen) return mcq('qa',2,'A bug is in <b>Retest</b>, and the retest <b>fails</b>. What happens next?', 'Reopened', ['Closed','Verified','New','Deferred'], 'If the fix does not work, the bug is Reopened and goes back to the developer.');
      const i = rnd(0, BUGFLOW.length-2); return mcq('qa',2,'In the defect life cycle, a bug is in <b>'+BUGFLOW[i]+'</b>. What is the next state (when everything goes well)?', BUGFLOW[i+1], BUGFLOW.filter((x,k)=>k!==i).concat(['Reopened']),
        'Life cycle: '+BUGFLOW.join(' → ')+' (or Reopened if the retest fails).'); }
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
  ()=>{ const rows = randTickets(), col = pick([1,2]), val = rows[rnd(0,rows.length-1)][col], name = col===1?'priority':'status', c = rows.filter(r=>r[col]===val).length;
      return mcq('sql',1,'Using this tickets table:'+miniTable(rows)+'How many rows does <code>SELECT * FROM tickets WHERE '+name+' = \''+val+'\';</code> return?', c, countWrongs(c, rows.length), c+' rows have '+name+' = \''+val+'\'.'); },
  ()=>{ const rows = randTickets(), c = rows.filter(r=>r[3]===null).length;
      return mcq('sql',1,'Using this tickets table:'+miniTable(rows)+'How many rows does <code>SELECT * FROM tickets WHERE assigned_to IS NULL;</code> return?', c, countWrongs(c, rows.length), c+' rows have no assignee (NULL).'); },
  ()=>{ const rows = randTickets(), c = new Set(rows.map(r=>r[2])).size;
      return mcq('sql',1,'Using this tickets table:'+miniTable(rows)+'How many rows does <code>SELECT status, COUNT(*) FROM tickets GROUP BY status;</code> return?', c, [1,2,3,4,rows.length], 'GROUP BY makes one row per different status. There are '+c+' different statuses here.'); },
  ()=>{ const rows = randTickets(), want = pick(['high','low']), f = rows.filter(r=>r[1]===want);
      if(!f.length) return null; const top = Math.max(...f.map(r=>r[0]));
      return mcq('sql',1,'Using this tickets table:'+miniTable(rows)+'What id does <code>SELECT id FROM tickets WHERE priority = \''+want+'\' ORDER BY id DESC LIMIT 1;</code> return?', top, rows.map(r=>r[0]), 'Filter to '+want+' priority, sort ids from biggest to smallest, take the first: '+top+'.'); }
);
GEN.sql[2].push(
  ()=>{ const rows = randTickets(), left = Math.random()<.5, c = left ? rows.length : rows.filter(r=>r[3]!==null).length;
      return mcq('sql',2,'Using this tickets table (every assigned_to value exists in users):'+miniTable(rows)+'How many rows does <code>SELECT * FROM tickets '+(left?'LEFT ':'')+'JOIN users ON tickets.assigned_to = users.id;</code> return?', c, countWrongs(c, rows.length),
        left ? 'LEFT JOIN keeps every ticket, even unassigned ones: '+c+' rows.' : 'An inner JOIN drops tickets with no assignee: '+c+' rows.'); },
  ()=>{ const rows = randTickets(), counts = {}; rows.forEach(r=>counts[r[2]]=(counts[r[2]]||0)+1);
      const c = Object.values(counts).filter(v=>v>1).length;
      return mcq('sql',2,'Using this tickets table:'+miniTable(rows)+'How many rows does <code>SELECT status, COUNT(*) FROM tickets GROUP BY status HAVING COUNT(*) &gt; 1;</code> return?', c, [0,1,2,3,4],
        'Counts per status: '+Object.entries(counts).map(([k,v])=>k+' = '+v).join(', ')+'. HAVING keeps the ones above 1: '+c+'.'); }
);
/* ---- Randomized Terminal tasks, grouped by skill. Each returns [task, accepted patterns, model answer, hint, level]. ---- */
const reEsc = s=>s.replace(/[.*+?^${}()|[\]\\\/]/g,'\\$&');
const R_ = s=>new RegExp('^'+s+'$');
const SVCS = ['nginx','apache2','ssh','cron','mysql','docker'];
const DIRS = ['logs','backups','reports','scripts','archive'];
const UNAMES = ['deploy','www-data','appuser','alei'];
const LOGF = ['app.log','access.log','error.log'];
const TGEN = [
 {sk:'Reading files', lv:1, f:()=>{ const f = pick(FILES); return ['Print the contents of '+f+'.', [R_('(cat|less|more) '+reEsc(f))], 'cat '+f, 'The command that sounds like an animal.', 1]; }},
 {sk:'Reading files', lv:1, f:()=>{ const f = pick(FILES); return ['Count how many lines are in '+f+'.', [R_('wc -l '+reEsc(f)), R_('cat '+reEsc(f)+' \\| wc -l')], 'wc -l '+f, 'wc = word count; -l counts lines.', 1]; }},
 {sk:'Reading files', lv:1, f:()=>{ const f = pick(FILES), n = rnd(3,50); return ['Show the last '+n+' lines of '+f+'.', [R_('tail -n ?'+n+' '+reEsc(f)), R_('tail -'+n+' '+reEsc(f))], 'tail -n '+n+' '+f, 'tail, with -n and a number.', 1]; }},
 {sk:'Reading files', lv:1, f:()=>{ const f = pick(FILES), n = rnd(3,50); return ['Show the first '+n+' lines of '+f+'.', [R_('head -n ?'+n+' '+reEsc(f)), R_('head -'+n+' '+reEsc(f))], 'head -n '+n+' '+f, 'head, with -n and a number.', 1]; }},
 {sk:'Files & folders', lv:1, f:()=>{ const d = pick(DIRS)+rnd(1,9); return ['Make a new folder named '+d+'.', [R_('mkdir '+reEsc(d)+'/?')], 'mkdir '+d, '"make directory"', 1]; }},
 {sk:'Files & folders', lv:1, f:()=>{ const f = pick(FILES), d = pick(DIRS); return ['Copy '+f+' into the folder '+d+'.', [R_('cp '+reEsc(f)+' '+reEsc(d)+'/?')], 'cp '+f+' '+d+'/', 'cp SOURCE DESTINATION', 1]; }},
 {sk:'Files & folders', lv:1, f:()=>{ const f = pick(FILES), g = 'old_'+f; return ['Rename '+f+' to '+g+'.', [R_('mv '+reEsc(f)+' '+reEsc(g))], 'mv '+f+' '+g, 'Renaming is moving: mv OLD NEW', 1]; }},
 {sk:'Searching', lv:1, f:()=>{ const f = pick(FILES), w = pick(WORDS); return ['Show every line containing the word '+w+' in '+f+'.', [R_('grep (-\\w+ )?'+w+' '+reEsc(f)), R_('cat '+reEsc(f)+' \\| grep (-\\w+ )?'+w)], 'grep "'+w+'" '+f, 'grep PATTERN FILE', 1]; }},
 {sk:'Searching', lv:1, f:()=>{ const f = pick(FILES); return ['Find every file named '+f+', starting from your home folder.', [R_('find (~|\\$HOME)/? -name '+reEsc(f))], 'find ~ -name "'+f+'"', 'find WHERE -name NAME', 1]; }},
 {sk:'Permissions & ownership', lv:1, f:()=>{ const s = pick(['deploy','backup','cleanup','report'])+'.sh'; return ['Make '+s+' executable.', [R_('chmod (\\+x|u\\+x|a\\+x|7[0-7][0-7]) '+reEsc(s))], 'chmod +x '+s, 'chmod plus x', 1]; }},
 {sk:'Permissions & ownership', lv:2, f:()=>{ const u = pick(UNAMES), p = pick(['/var/www','/opt/app','/srv/data']); return ['Make '+u+' the owner and group of '+p+' and everything inside it.', [R_('(sudo )?chown -R '+reEsc(u)+':'+reEsc(u)+' '+reEsc(p)+'/?')], 'sudo chown -R '+u+':'+u+' '+p, 'chown -R USER:GROUP PATH', 2]; }},
 {sk:'Networking', lv:1, f:()=>{ const h = pick(['google.com','10.0.0.'+rnd(1,254),'db01.internal']), n = rnd(2,9); return ['Ping '+h+' exactly '+n+' times.', [R_('ping -c ?'+n+' '+reEsc(h))], 'ping -c '+n+' '+h, 'On Linux, -c sets the count.', 1]; }},
 {sk:'Networking', lv:2, f:()=>{ const u = pick(UNAMES), ip = '10.'+rnd(0,255)+'.'+rnd(0,255)+'.'+rnd(1,254); return ['Connect to '+ip+' as the user '+u+' over SSH.', [R_('ssh '+reEsc(u)+'@'+reEsc(ip)), R_('ssh -l '+reEsc(u)+' '+reEsc(ip))], 'ssh '+u+'@'+ip, 'ssh USER@HOST', 2]; }},
 {sk:'Services & logs', lv:2, f:()=>{ const s = pick(SVCS), a = pick(['restart','stop','start','status']); return [{restart:'Restart',stop:'Stop',start:'Start',status:'Check the status of'}[a]+' the '+s+' service.', [R_('(sudo )?systemctl '+a+' '+reEsc(s)+'(\\.service)?')], (a==='status'?'':'sudo ')+'systemctl '+a+' '+s, 'systemctl ACTION SERVICE', 2]; }},
 {sk:'Services & logs', lv:2, f:()=>{ const s = pick(SVCS); return ['Make the '+s+' service start automatically at boot.', [R_('(sudo )?systemctl enable (--now )?'+reEsc(s)+'(\\.service)?')], 'sudo systemctl enable '+s, 'systemctl enable SERVICE', 2]; }},
 {sk:'Services & logs', lv:2, f:()=>{ const s = pick(SVCS); return ['Show the systemd log for the '+s+' service.', [R_('(sudo )?journalctl -u '+reEsc(s)+'(\\.service)?')], 'journalctl -u '+s, 'journalctl, with -u for "unit"', 2]; }},
 {sk:'Services & logs', lv:2, f:()=>{ const f = pick(LOGF), w = pick(['ERROR','timeout','denied']); return ['Follow '+f+' live and show only lines containing '+w+'.', [new RegExp('^tail -f '+reEsc(f)+' \\| grep (-\\w+ )?'+w+'$','i')], 'tail -f '+f+' | grep '+w, 'tail -f, piped into grep', 2]; }},
 {sk:'Services & logs', lv:2, f:()=>{ const f = pick(LOGF); return ['Empty '+f+' without deleting the file.', [R_('(sudo )?truncate -s ?0 '+reEsc(f)), R_(':? ?> ?'+reEsc(f))], 'truncate -s 0 '+f, 'truncate the file to size 0', 2]; }},
 {sk:'Disk & archives', lv:2, f:()=>{ const p = pick(['/var/log','/home','/opt','/srv']); return ['Show the size of each item inside '+p+', human-readable.', [R_('(sudo )?du -(sh|hs) '+reEsc(p)+'/\\*( \\| sort -h)?'), R_('(sudo )?du -h (--max-depth=1|-d ?1) '+reEsc(p)+'/?( \\| sort -h)?')], 'du -sh '+p+'/*', 'du with -s (summary) and -h (human)', 2]; }},
 {sk:'Disk & archives', lv:2, f:()=>{ const d = pick(DIRS); return ['Compress the folder '+d+' into '+d+'.tar.gz.', [R_('tar -?(czf|zcf|czvf|cvzf|zcvf) '+reEsc(d)+'\\.tar\\.gz '+reEsc(d)+'/?')], 'tar -czf '+d+'.tar.gz '+d+'/', 'tar with c (create), z (gzip), f (file name)', 2]; }},
 {sk:'Scheduling (cron)', lv:2, f:()=>{ const m = rnd(0,59), h = rnd(0,23), dw = Math.random()<.5 ? null : rnd(0,6);
     return ['Type just the 5 cron time fields for a job that runs at '+pad2(h)+':'+pad2(m)+(dw===null?' every day':' every '+DAYS[dw])+'.', [R_(m+' '+h+' \\* \\* '+(dw===null?'\\*':'('+dw+(dw===0?'|7':'')+')'))], m+' '+h+' * * '+(dw===null?'*':dw), 'Order: minute hour day-of-month month weekday. Sunday = 0.', 2]; }}
];

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
     return [1,'Show all users whose '+c+' is \''+v+'\'.',[R_("select\\*from users where "+c+"='"+v.toLowerCase()+"'")],"SELECT * FROM users WHERE "+c+" = '"+v+"';",'This one uses the users table.',()=>({cols:US.cols, rows:US.rows.filter(r=>r[col(US,c)]===v)})]; }},
 {sk:'Filtering (WHERE)', lv:1, f:()=>{ const d = pick(TK.rows)[5]; return [1,'Show tickets created on or after '+d+'.',[R_("select\\*from tickets where created_at>='"+d+"'")],"SELECT * FROM tickets WHERE created_at >= '"+d+"';",'Dates compare like text in quotes. "On or after" is >=.',()=>({cols:TK.cols, rows:TK.rows.filter(r=>r[5]>=d)})]; }},
 {sk:'Searching text (LIKE)', lv:1, f:()=>{ const w = pick(['printer','password','pos','vpn','laptop']); return [1,'Find tickets with "'+w+'" anywhere in the title.',[R_("select\\*from tickets where title like '%"+w+"%'")],"SELECT * FROM tickets WHERE title LIKE '%"+w+"%';",'LIKE with % on both sides.',()=>({cols:TK.cols, rows:TK.rows.filter(r=>r[1].toLowerCase().includes(w))})]; }},
 {sk:'Sorting & limiting', lv:1, f:()=>{ const n = rnd(1,5), desc = Math.random()<.5;
     return [1,'Show the '+n+' '+(desc?'newest':'oldest')+' ticket'+(n>1?'s':'')+' (by created_at).',[R_('select\\*from tickets order by created_at '+(desc?'desc ':'(asc )?')+'limit '+n)],'SELECT * FROM tickets ORDER BY created_at '+(desc?'DESC ':'')+'LIMIT '+n+';',(desc?'Newest first = DESC':'Oldest first is the default (ASC)')+', then LIMIT.',
       ()=>({cols:TK.cols, rows:TK.rows.slice().sort((a,b)=>desc?b[5].localeCompare(a[5]):a[5].localeCompare(b[5])).slice(0,n)})]; }},
 {sk:'Choosing columns', lv:1, f:()=>{ const [a,b] = shuffle(['title','priority','status','created_at']).slice(0,2);
     return [1,'Show only the '+a+' and '+b+' of every ticket.',[R_('select '+both(a,b)+' from tickets')],'SELECT '+a+', '+b+' FROM tickets;','List the columns, separated by commas.',()=>proj(TK,[a,b],TK.rows)]; }},
 {sk:'Counting & grouping', lv:1, f:()=>{ const v = pick(STAT); return [1,'How many tickets have status \''+v+'\'?',[new RegExp('^select '+CNT+"from tickets where status='"+v+"'$")],"SELECT COUNT(*) FROM tickets WHERE status = '"+v+"';",'COUNT(*) plus a WHERE.',()=>({cols:['count(*)'], rows:[[TK.rows.filter(r=>r[3]===v).length]]})]; }},
 {sk:'Counting & grouping', lv:2, f:()=>{ const n = rnd(0,2); return [2,'Show each priority with its ticket count, keeping only priorities with more than '+n+' ticket'+(n===1?'':'s')+'.',[new RegExp('^select priority,'+CNT+'from tickets group by priority having count\\((\\*|id)\\)>'+n+'$')],'SELECT priority, COUNT(*) FROM tickets GROUP BY priority HAVING COUNT(*) > '+n+';','GROUP BY, then HAVING to filter the groups.',()=>({cols:['priority','count(*)'], rows:countBy(TK.rows,2).filter(x=>x[1]>n)})]; }},
 {sk:'Joins', lv:2, f:()=>{ const u = pick(US.rows.filter(r=>TK.rows.some(t=>t[4]===r[0])));
     return [2,'Using a JOIN, show the titles of tickets assigned to '+u[1]+'.',[new RegExp('^select ('+JT+'\\.)?title '+ON+' where ('+JU+'\\.)?name=\''+u[1].toLowerCase()+'\'$')],'SELECT tickets.title FROM tickets JOIN users ON tickets.assigned_to = users.id WHERE users.name = \''+u[1]+'\';','JOIN users ON tickets.assigned_to = users.id, then WHERE on the name.',()=>({cols:['title'], rows:TK.rows.filter(t=>t[4]===u[0]).map(t=>[t[1]])})]; }},
 {sk:'Joins', lv:2, f:()=>{ const loc = pick(['Houston','Katy']);
     return [2,'Show each ticket title with its assignee\'s name, only for people located in '+loc+'.',[new RegExp('^select '+JT+'\\.title,'+JU+'\\.name '+ON+' where ('+JU+'\\.)?location=\''+loc.toLowerCase()+'\'$')],'SELECT tickets.title, users.name FROM tickets JOIN users ON tickets.assigned_to = users.id WHERE users.location = \''+loc+'\';','JOIN first, then filter with WHERE users.location.',
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

/* Skill name for each quiz generator, in the same order as GEN[track][level] */
const GEN_SKILLS = {
  net:{1:['Ports & services','IP addressing','Subnetting','Subnetting','IP addressing'], 2:['Subnetting','Subnetting','DNS records']},
  linux:{1:['Permissions','Permissions','Everyday commands','Filesystem layout'], 2:['Scheduling (cron)','Admin tools']},
  code:{1:['HTTP & APIs','Python','Git'], 2:['Regex','Logging']},
  sql:{1:['Filtering','Filtering','Grouping','Sorting & limiting'], 2:['Joins','Grouping']},
  sec:{1:['CIA triad','Authentication & MFA','Authentication & MFA','Cryptography'], 2:['Windows logs','Vulnerabilities','Backups']},
  support:{1:['Troubleshooting method','Windows tools','Ticket priority'], 2:['ITIL','Microsoft 365 admin']},
  qa:{1:['Test design','Test design','Test types'], 2:['Testing process','Defect life cycle']}
};
for(const tid in GEN) for(const lv of [1,2]) (GEN[tid][lv]||[]).forEach((f,i)=>{ f.sk = GEN_SKILLS[tid][lv][i]; f.lv = lv; });
function genFor(tid, lv, sk){ const g = GEN[tid]; if(!g) return []; const all = lv ? (g[lv]||[]) : [...(g[1]||[]), ...(g[2]||[])]; return sk ? all.filter(f=>f.sk===sk) : all; }
function makeGen(tid, lv, sk){
  const gens = genFor(tid, lv, sk);
  for(let t=0;t<20;t++){ const f = pick(gens), q = f(); if(q){ q.sk = f.sk; q.tid = tid; q.noType = !!f.noType; return q; } }
  return null;
}
/* Questions with more than one correct answer can't be typed (e.g. "which host is in the same subnet"). */
const NO_TYPE = {net:{1:[1], 2:[1]}, qa:{1:[1]}, sec:{1:[3]}};
for(const tid in NO_TYPE) for(const lv in NO_TYPE[tid]) NO_TYPE[tid][lv].forEach(i=>{ GEN[tid][lv][i].noType = true; });
/* [[skill, [levels]], ...] for one track, in first-seen order */
function genSkills(tid){ const m = new Map(); genFor(tid).forEach(f=>{ if(!m.has(f.sk)) m.set(f.sk, new Set()); m.get(f.sk).add(f.lv); }); return [...m].map(([k,v])=>[k,[...v].sort()]); }

