/* ===================== PERFORMANCE-BASED QUESTIONS (PBQs) =====================
   Practice in the style of the hands-on items at the start of the Security+ exam: configure, place, order, read logs,
   calculate. These are SkillQuest's own tasks, not CompTIA's; the real items are different. Every task is built fresh
   with random details, every answer is worked out from those details, and everything is done with dropdowns and number
   fields (no dragging), so a keyboard or screen reader can do all of it. Each item gets partial credit, like the exam. */

/* Each builder returns {title, obj (SY0-801 objectives), skill (an existing skill the result counts toward), html (the
   situation), fields:[{label, options|num, answer, why}], check?(values) for tasks graded as a whole (firewall)} */
const PBQ_ZONES = ['Screened subnet', 'Internal network', 'Management network', 'Guest network'];
const PBQ_BUILDERS = [
  /* 1. Firewall rules: graded by sending test traffic through the rules, first match wins, then the implicit deny */
  function firewall(){
    const web = '10.0.5.'+rnd(10,60), db = '10.0.10.'+rnd(10,60), mgmt = '10.0.99.0/24';
    const dbPort = pick([['1433','Microsoft SQL Server'], ['3306','MySQL'], ['5432','PostgreSQL']]);
    const SRC = ['Any', 'Internet', web, mgmt], DST = [web, db, 'Any'], PORT = ['443', '80', '22', dbPort[0], '3389', 'Any'], ACT = ['Allow', 'Deny'];
    const flows = [
      {d:'A customer on the internet opens the website over HTTPS', src:'Internet', dst:web, port:'443', want:'Allow'},
      {d:'The web server queries the database', src:web, dst:db, port:dbPort[0], want:'Allow'},
      {d:'An admin on the management network connects to the web server with SSH', src:mgmt, dst:web, port:'22', want:'Allow'},
      {d:'Someone on the internet tries SSH to the web server', src:'Internet', dst:web, port:'22', want:'Deny'},
      {d:'Someone on the internet tries to reach the database directly', src:'Internet', dst:db, port:dbPort[0], want:'Deny'},
      {d:'The web server tries remote desktop to the database server', src:web, dst:db, port:'3389', want:'Deny'},
      {d:'Someone on the internet tries plain HTTP to the database server', src:'Internet', dst:db, port:'80', want:'Deny'}
    ];
    const fields = [];
    for(let r=1; r<=4; r++) fields.push(
      {label:'Rule '+r+' action', options:ACT, rule:r, part:'act'}, {label:'Rule '+r+' source', options:SRC, rule:r, part:'src'},
      {label:'Rule '+r+' destination', options:DST, rule:r, part:'dst'}, {label:'Rule '+r+' port', options:PORT, rule:r, part:'port'});
    const hit = (v, x)=>v === 'Any' || v === x;
    return {title:'Firewall rules', obj:['3.2'], skill:'quiz:sec:Firewalls',
      html:'<p>Configure the firewall between the internet, a screened subnet and the internal network. Rules are read top to bottom, the <b>first match wins</b>, and anything that matches no rule is denied (implicit deny).</p>'+
        '<ul class="clean"><li>Web server: <code>'+web+'</code> (screened subnet), serves HTTPS on 443.</li><li>Database server: <code>'+db+'</code> (internal), '+dbPort[1]+' on port '+dbPort[0]+'.</li><li>Management network: <code>'+mgmt+'</code>.</li></ul>'+
        '<p>Requirements: customers reach the website over HTTPS; only the web server may query the database; admins may use SSH to the web server only from the management network. Everything else must be blocked, so use as few "Any" values as the job allows.</p>',
      fields, rows:4,
      check(vals){
        const rules = [1,2,3,4].map(r=>({act:vals['Rule '+r+' action'], src:vals['Rule '+r+' source'], dst:vals['Rule '+r+' destination'], port:vals['Rule '+r+' port']}));
        const res = flows.map(f=>{ const m = rules.find(r=>r.act && r.src && r.dst && r.port && hit(r.src, f.src) && hit(r.dst, f.dst) && hit(r.port, f.port));
          const got = m ? m.act : 'Deny';
          return {ok:got === f.want, text:f.d+': '+(got === 'Allow' ? 'allowed' : 'blocked')+(got === f.want ? '' : ' (should be '+(f.want === 'Allow' ? 'allowed' : 'blocked')+')')}; });
        return {parts:res, model:'One answer: 1 Allow Internet → '+web+' 443 · 2 Allow '+web+' → '+db+' '+dbPort[0]+' · 3 Allow '+mgmt+' → '+web+' 22 · 4 Deny Any → Any Any (the implicit deny would block the rest anyway; an explicit last rule makes it visible and logged). Rule order matters: a broad Allow above a narrow Deny lets the traffic through.'};
      }};
  },
  /* 2. Log analysis: which lines belong to the attack, and what is it? */
  function logs(){
    const kind = pick(['spray', 'brute']), ip = '203.0.113.'+rnd(5,250), t0 = rnd(1,5), users = shuffle(['a.ruiz','j.chen','m.patel','s.okafor','d.kim','l.novak','r.haddad']);
    const lines = [], hh = n=>'02:'+pad2(t0*10+n);
    if(kind === 'spray') users.slice(0,5).forEach((u,i)=>lines.push({t:hh(i)+' sshd: Failed password for '+u+' from '+ip, bad:true}));
    else for(let i=0;i<5;i++) lines.push({t:hh(i)+' sshd: Failed password for '+users[0]+' from '+ip, bad:true});
    lines.push({t:'07:'+pad2(rnd(10,40))+' sshd: Accepted publickey for '+users[5]+' from 10.0.99.'+rnd(5,40), bad:false, why:'an admin signing in with a key from the management network'});
    const pc = '10.0.20.'+rnd(5,90);
    lines.push({t:'08:'+pad2(rnd(10,40))+' sshd: Failed password for '+users[6]+' from '+pc, bad:false, why:'one mistyped password from an internal computer, followed by a successful sign-in: a user, not an attack'});
    lines.push({t:'08:'+pad2(rnd(41,59))+' sshd: Accepted password for '+users[6]+' from '+pc, bad:false, why:'the same user signing in successfully from the same internal computer'});
    const shown = shuffle(lines).sort((a,b)=>a.t.localeCompare(b.t));
    const ATT = ['Password spraying', 'Brute force', 'User enumeration', 'Impossible travel'];
    const ans = kind === 'spray' ? 'Password spraying' : 'Brute force';
    return {title:'Read the log', obj:['2.5'], skill:'quiz:sec:Indicators of compromise',
      html:'<p>An analyst exports these sign-in lines from a Linux server (<code>/var/log/auth.log</code>). Mark each line, then name the attack.</p><pre>'+shown.map(l=>esc(l.t)).join('\n')+'</pre>',
      fields:shown.map((l,i)=>({label:'Line '+(i+1)+': '+l.t.slice(0,5), options:['Normal', 'Part of the attack'], answer:l.bad ? 'Part of the attack' : 'Normal',
        why:l.bad ? 'a failed guess from '+ip+', an outside address, one of a burst within minutes' : l.why}))
        .concat([{label:'Which attack is this?', options:ATT, answer:ans, why:kind === 'spray' ? 'one source tries many different accounts, a few guesses each, to stay under lockout limits' : 'one source tries many passwords against one account'}])};
  },
  /* 3. Place each system in a network zone */
  function zones(){
    const ITEMS = [['Public web server', 'Screened subnet', 'it must be reachable from the internet, so it sits between two firewalls, away from internal systems'],
      ['Customer database', 'Internal network', 'only the app servers need it; it should never be reachable from the internet'],
      ['Domain controller (sign-in server)', 'Internal network', 'it holds every account, so it stays deep inside'],
      ['Jump server admins use to reach servers', 'Management network', 'admin access is separated and tightly controlled'],
      ['Switch and firewall admin interfaces', 'Management network', 'device management should never share a network with users'],
      ['Visitors\' laptops', 'Guest network', 'untrusted devices get internet only, with no path inside'],
      ['Public email relay (mail gateway)', 'Screened subnet', 'it talks to the internet and passes mail to the internal server'],
      ['Employees\' file server', 'Internal network', 'staff need it, the internet doesn\'t']];
    const pickd = shuffle(ITEMS).slice(0,6);
    return {title:'Place each system', obj:['3.2'], skill:'quiz:sec:Firewalls',
      html:'<p>A company is redesigning its network into four zones: a <b>screened subnet</b> (the zone between the internet and the inside, formerly called a DMZ, or demilitarized zone), the <b>internal network</b>, a <b>management network</b> for admin access, and a <b>guest network</b>. Place each system.</p>',
      fields:pickd.map(([s,a,w])=>({label:s, options:PBQ_ZONES, answer:a, why:w}))};
  },
  /* 4. Match each attack to the control that stops it best */
  function controls(){
    const PAIRS = [['Ransomware encrypts the file server', 'Offline, immutable backups', 'you can restore without paying'],
      ['Attackers type SQL code into a search box', 'Input validation and parameterized queries', 'the input can never become code'],
      ['Thousands of password guesses against one account', 'Account lockout', 'guessing stops after a few tries'],
      ['Someone follows an employee through a badge door', 'Access control vestibule', 'only one person can pass at a time'],
      ['An employee copies customer files to a USB drive', 'Data loss prevention (DLP)', 'it spots and blocks sensitive data leaving'],
      ['Traffic on café Wi-Fi is read by someone nearby', 'Encrypted connections (TLS (Transport Layer Security) or a VPN)', 'intercepted traffic is unreadable'],
      ['A stolen password is used to sign in from abroad', 'Multifactor authentication (MFA)', 'the password alone isn\'t enough'],
      ['A laptop with patient records is stolen from a car', 'Full-disk encryption', 'the data is unreadable without the key']];
    const pickd = shuffle(PAIRS).slice(0,6), opts = shuffle(pickd.map(p=>p[1]));
    return {title:'Match controls to attacks', obj:['2.5', '4.1'], skill:'quiz:sec:Attack types',
      html:'<p>Each control is used once. Pick the control that best stops each attack.</p>',
      fields:pickd.map(([s,a,w])=>({label:s, options:opts, answer:a, why:w}))};
  },
  /* 5. Data protection methods */
  function dataProt(){
    const PAIRS = [['A receipt shows the card as **** **** **** 4821', 'Masking', 'part of the value is hidden on display; the real number still exists'],
      ['The store keeps a random stand-in value, and the real card number lives only in a secure vault', 'Tokenization', 'the token is useless if stolen'],
      ['User passwords are stored so that even admins can\'t read them back', 'Hashing', 'one-way: you can check a password, never recover it'],
      ['A laptop\'s whole drive is unreadable without the owner\'s key', 'Encryption', 'two-way with a key: the data comes back with the key'],
      ['Names and birth dates are removed from a research data set', 'Deidentification', 'the records can no longer be tied to a person'],
      ['Access to the HR app is blocked when the device is outside the country', 'Geofencing', 'location decides access']];
    const pickd = shuffle(PAIRS).slice(0,5), opts = shuffle(PAIRS.map(p=>p[1]));
    return {title:'Protect the data', obj:['3.3'], skill:'quiz:sec:Cryptography',
      html:'<p>Pick the method each situation describes. One option is not used.</p>', fields:pickd.map(([s,a,w])=>({label:s, options:opts, answer:a, why:w}))};
  },
  /* 6. Order: incident response */
  function irOrder(){
    const STEPS = [['Preparation', 'playbooks, tools and training ready before anything happens'], ['Identification', 'an alert is confirmed as a real incident'],
      ['Containment', 'isolate the affected systems so it can\'t spread'], ['Eradication/recovery', 'remove the cause, then restore and watch'],
      ['Post-incident (lessons learned)', 'root cause, report and improvements']];
    return pbqOrder('Incident response order', ['4.7'], 'quiz:sec:Incident response', '<p>Put the incident response activities in order.</p>', STEPS);
  },
  /* 7. Order: change management */
  function changeOrder(){
    const STEPS = [['Submit the change request with an owner', 'every change starts as a request with one accountable owner'],
      ['Impact analysis and test results', 'what could break, with proof from testing'], ['Change advisory board (CAB) approval', 'the board reviews the request and approves it'],
      ['Implement in the maintenance window, with the backout plan ready', 'the agreed time slot, with a way back'],
      ['Verify, then update diagrams and procedures', 'check it worked, then fix the documentation']];
    return pbqOrder('Change management order', ['1.2'], 'quiz:sec:Change management', '<p>Put the change management steps in order.</p>', STEPS);
  },
  /* 8. Risk calculation: SLE, ALE */
  function risk(){
    const av = rnd(4,40)*5000, ef = pick([10,20,25,40,50,75]), aro = pick([0.25,0.5,1,2,4]);
    const sle = Math.round(av*ef/100), ale = Math.round(sle*aro);
    return {title:'Calculate the risk', obj:['5.2'], skill:'quiz:sec:Risk management',
      html:'<p>A server and its data are worth <b>'+money(av)+'</b> (asset value). A flood would destroy <b>'+ef+'%</b> of it (exposure factor). Floods are expected <b>'+(aro === 1 ? 'once a year' : aro < 1 ? 'once every '+(1/aro)+' years' : aro+' times a year')+'</b>. Enter whole dollars.</p>',
      fields:[{label:'SLE (single loss expectancy)', num:true, answer:sle, why:'SLE = asset value × exposure factor = '+money(av)+' × '+ef+'% = '+money(sle)},
        {label:'ARO (annualized rate of occurrence)', num:true, answer:aro, why:'ARO is how many times a year: '+aro},
        {label:'ALE (annualized loss expectancy)', num:true, answer:ale, why:'ALE = SLE × ARO = '+money(sle)+' × '+aro+' = '+money(ale)+'. Spend less than this per year on a control and it pays for itself.'}]};
  }
];
/* ordering tasks: each step gets a position dropdown */
function pbqOrder(title, obj, skill, html, STEPS){
  const shown = shuffle(STEPS.map((s,i)=>[...s, i+1])), pos = STEPS.map((_,i)=>String(i+1));
  return {title, obj, skill, html:html+'<p class="small">Give each step its position, 1 = first.</p>',
    fields:shown.map(([s,w,n])=>({label:s, options:pos, answer:String(n), why:w}))};
}

/* Station story: each task kind is a station system to bring back online. The task itself is unchanged; the plain
   skill name stays next to the story name so nothing is hidden behind the theme. While a task is open the screen
   takes a soft red alert tint (no flashing), and it clears when you check your answer. */
const PBQ_STATION = {'Firewall rules':['Shields', '🛡', 'firewall rules'], 'Read the log':['Sensor feed', '📡', 'log reading'],
  'Place each system':['Hull sections', '🧱', 'network zones'], 'Match controls to attacks':['Defense grid', '🔰', 'security controls'],
  'Protect the data':['Cargo vault', '🔐', 'data protection'], 'Incident response order':['Damage control', '🧯', 'incident response'],
  'Change management order':['Flight plan', '🧭', 'change management'], 'Calculate the risk':['Navigation computer', '🧮', 'risk calculation']};
const pbqSys = t=>PBQ_STATION[t.title] || ['Station system', '🛰', t.title.toLowerCase()];
const pbqAlert = on=>document.documentElement.classList.toggle('redalert', on);
let PBQ = null;   /* {list, i, res:[fraction]} */
const PBQ_ROUND = 4;
function vPbq(){
  current = 'pbq'; header(); PBQ = null; pbqAlert(false);
  view.innerHTML = '<h1>Performance-based practice</h1><p class="sub">Hands-on tasks in the style of the first items on the Security+ exam: configure rules, read logs, place systems, put steps in order, calculate risk. These are SkillQuest\'s own tasks, not CompTIA\'s.</p>'+
    '<div class="card"><p>A round is '+PBQ_ROUND+' tasks, no timer. Each item gets partial credit. On the real exam, PBQs come first and take longer: many people flag them and come back after the multiple-choice questions.</p>'+
    '<p class="small">Tasks: '+PBQ_BUILDERS.length+' kinds (firewall rules, log reading, network zones, controls, data protection, incident response order, change management order, risk calculation), with new details every time.</p>'+
    '<p class="small">🛰 Station mode: each task is a station system that has gone down (shields = firewall rules, sensor feed = logs, and so on). Fix it to bring it back online.</p>'+
    '<div class="row"><button class="primary" id="pbqGo">Start a round</button></div></div>';
  $('#pbqGo').onclick = ()=>{ PBQ = {list:shuffle(PBQ_BUILDERS).slice(0, PBQ_ROUND).map(b=>b()), i:0, res:[]}; pbqShow(); };
}
function pbqShow(){
  const t = PBQ.list[PBQ.i], sys = pbqSys(t);
  pbqAlert(true);
  const field = (f, k)=>'<label class="pbq-f"><span>'+esc(f.label)+'</span>'+(f.num
      ? '<input type="number" step="any" inputmode="decimal" data-k="'+k+'" aria-label="'+esc(f.label)+'">'
      : '<select data-k="'+k+'" aria-label="'+esc(f.label)+'"><option value="">Choose…</option>'+f.options.map(o=>'<option>'+esc(o)+'</option>').join('')+'</select>')+'</label>';
  const body = t.rows
    ? '<div class="tw"><table class="res pbq-rules"><thead><tr><th>#</th><th>Action</th><th>Source</th><th>Destination</th><th>Port</th></tr></thead><tbody>'+
      [1,2,3,4].map(r=>'<tr><td>'+r+'</td>'+t.fields.filter(f=>f.rule===r).map(f=>'<td>'+field(f, t.fields.indexOf(f)).replace('<span>'+esc(f.label)+'</span>', '')+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>'
    : '<div class="pbq-fields">'+t.fields.map(field).join('')+'</div>';
  view.innerHTML = '<div class="slim stalert"><b>'+sys[1]+' Station alert: '+esc(sys[0])+' offline</b> <span class="small">Bring it back with '+esc(sys[2])+'.</span></div>'+
    '<div class="progress"><span>Task '+(PBQ.i+1)+' of '+PBQ.list.length+'</span><span>SY0-801 '+esc(t.obj.join(', '))+'</span></div>'+
    '<div class="card"><h2 style="margin-top:4px">'+esc(t.title)+'</h2>'+t.html+body+
    '<div class="row" style="margin-top:14px"><button class="primary" id="pbqCheck">Check</button><button class="quiet" id="pbqShow">Show answer</button></div><div id="after"></div></div>';
  const get = ()=>{ const v = {}; view.querySelectorAll('[data-k]').forEach(el=>{ v[t.fields[+el.dataset.k].label] = el.value; }); return v; };
  const done = (revealed)=>{
    const v = get(); let parts, model = t.model || '';
    if(t.check){ const r = t.check(v); parts = r.parts; model = r.model; }
    else parts = t.fields.map(f=>{ const got = v[f.label], ok = f.num ? got !== '' && Math.abs(Number(got) - f.answer) <= (f.answer >= 100 ? 1 : 0.001) : got === f.answer;
      return {ok, text:f.label+': '+(ok ? '✔ ' : '✘ '+(got ? 'you said '+got+'. ' : 'no answer. '))+'Answer: '+(f.num ? (f.answer >= 100 ? money(f.answer) : f.answer) : f.answer)+' ('+f.why+')'}; });
    const right = parts.filter(p=>p.ok).length, frac = revealed ? 0 : right / parts.length;
    view.querySelectorAll('[data-k],#pbqCheck,#pbqShow').forEach(el=>el.disabled = true);
    if(!revealed){ recordSkill(t.skill, frac === 1, true); if(frac === 1) addXP(15); else if(frac >= 0.5) addXP(5); }
    PBQ.res.push(frac); pbqAlert(false);
    const status = revealed ? '' : frac === 1 ? '✅ '+sys[0]+' back online. ' : frac >= 0.5 ? '❌ '+sys[0]+' partly restored. ' : '❌ '+sys[0]+' still offline. ';
    $('#after').innerHTML = '<div class="explain"><b>'+status+(revealed ? 'Answer shown (no credit).' : right+' of '+parts.length+' right.')+'</b><ul class="clean">'+parts.map(p=>'<li>'+esc(p.text)+'</li>').join('')+'</ul>'+(model ? '<p class="small">'+esc(model)+'</p>' : '')+'</div>'+
      '<div class="row" style="margin-top:10px"><button class="primary" id="pbqNext">'+(PBQ.i+1 < PBQ.list.length ? 'Next task' : 'See results')+'</button></div>';
    $('#pbqNext').onclick = ()=>{ PBQ.i++; PBQ.i < PBQ.list.length ? pbqShow() : pbqEnd(); };
    $('#pbqNext').focus();
  };
  $('#pbqCheck').onclick = ()=>{ const empty = [...view.querySelectorAll('[data-k]')].filter(el=>el.value === '').length;
    if(empty && !t.check) return askConfirm(empty+' item'+(empty === 1 ? ' is' : 's are')+' still empty. Check anyway?', 'Check', ()=>done(false));
    done(false); };
  $('#pbqShow').onclick = ()=>done(true);
  queueMicrotask(enterView);
}
function pbqEnd(){
  pbqAlert(false);
  sessionFlag('sPbq');
  const pct = Math.round(PBQ.res.reduce((a,b)=>a+b, 0) / PBQ.res.length * 100);
  view.innerHTML = '<h1>Station status</h1><div class="card"><p><b>'+pct+'%</b> of items right across '+PBQ.res.length+' tasks (practice score, not an exam score).</p>'+
    '<ul class="clean">'+PBQ.list.map((t,i)=>{ const y = pbqSys(t), r = PBQ.res[i]; return '<li>'+(r === 1 ? '🟢 ' : r >= 0.5 ? '🟡 ' : '🔴 ')+y[1]+' '+esc(y[0])+' ('+esc(t.title)+'): '+Math.round(r*100)+'%'+(r === 1 ? ', online' : r >= 0.5 ? ', partly restored' : ', offline')+'</li>'; }).join('')+'</ul>'+
    '<div class="row"><button class="primary" id="pbqAgain">Another round</button><button id="pbqHome">Back to Today</button></div>'+sessionRow()+'</div>';
  $('#pbqAgain').onclick = vPbq;
  $('#pbqHome').onclick = ()=>go('today');
  if(!sessionWire()) $('#pbqAgain').focus();
}
