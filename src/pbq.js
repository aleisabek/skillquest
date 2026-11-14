/* ===================== PERFORMANCE-BASED QUESTIONS (PBQs) =====================
   Practice in the style of the hands-on items at the start of the Security+ exam: configure, place, order, read logs,
   calculate. These are SkillQuest's own tasks, not CompTIA's; the real items are different. Every task is built fresh
   with random details, every answer is worked out from those details, and everything is done with dropdowns and number
   fields (no dragging), so a keyboard or screen reader can do all of it. Each item gets partial credit, like the exam. */

/* Each builder returns {title, obj (SY0-801 objectives), skill (an existing skill the result counts toward), goal (what the
   task teaches and why it matters, shown first), html (the situation), task (exactly what to do, shown last),
   fields:[{label, options|num, answer, why}], check?(values) for tasks graded as a whole (firewall)} */
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
      goal:'How a firewall decides what gets through: it checks rules from the top down, the <b>first rule that matches wins</b>, and anything no rule allows is blocked (the implicit deny). You use this to let in only the traffic the business needs.',
      task:'Fill in rules 1 to 4 (action, source, destination, port) so the three allowed connections work and everything else is blocked. Your rules are tested by sending seven connections through them, some that should get through and some that shouldn\'t.',
      html:'<p>You\'re setting up the firewall that sits between the internet, the screened subnet (where the public web server lives) and the internal network.</p>'+
        '<ul class="clean"><li>Web server: <code>'+web+'</code> (screened subnet), serves HTTPS on 443.</li><li>Database server: <code>'+db+'</code> (internal), '+dbPort[1]+' on port '+dbPort[0]+'.</li><li>Management network: <code>'+mgmt+'</code>.</li></ul>'+
        '<p><b>What must work:</b></p><ul class="clean"><li>Customers on the internet reach the website over HTTPS.</li><li>Only the web server may query the database.</li><li>Admins may use SSH to the web server, but only from the management network.</li></ul>'+
        '<p>Everything else must be blocked, so use "Any" only where the job needs it.</p>',
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
      goal:'Spotting an attack in sign-in logs: telling a real attack apart from ordinary mistakes, and naming the attack from its pattern (how many accounts, how many tries, from where).',
      task:'For each line, choose <b>Normal</b> or <b>Part of the attack</b>. Then name the attack. Look at where each attempt comes from and which accounts it targets.',
      html:'<p>You\'re the analyst on duty. These are last night\'s and this morning\'s sign-in lines from a Linux server (<code>/var/log/auth.log</code>). Addresses starting with <code>10.</code> are inside the company; the rest are on the internet.</p><pre>'+shown.map(l=>esc(l.t)).join('\n')+'</pre>',
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
      goal:'Network segmentation: putting each system in the zone that matches who needs to reach it, so an attacker who gets into one zone can\'t reach everything else.',
      task:'Choose the zone for each system. Ask yourself: who needs to reach it, and from where?',
      html:'<p>A company is splitting its network into four zones:</p><ul class="clean">'+
        '<li><b>Screened subnet</b> (formerly called a DMZ): servers the internet must reach, kept apart from the inside.</li>'+
        '<li><b>Internal network</b>: systems only staff use.</li>'+
        '<li><b>Management network</b>: admin access to servers and network devices.</li>'+
        '<li><b>Guest network</b>: visitors\' devices, internet access only.</li></ul>',
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
      goal:'Matching a security control to the attack it actually stops. Many controls are good; the exam asks which one fits this attack best.',
      task:'For each incident, choose the control that best stops it. Each control is used exactly once.',
      html:'<p>Your company had these incidents this year. Your manager asks which control would have stopped each one.</p>',
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
      goal:'The differences between ways of protecting data: hiding part of it (masking), swapping it for a stand-in (tokenization), one-way scrambling (hashing), scrambling you can undo with a key (encryption), and more. The exam often tests masking vs. tokenization and hashing vs. encryption.',
      task:'Name the method each situation describes. There are more methods than situations, so one method is left over.',
      html:'<p>Each situation below is a way a company protects sensitive data.</p>', fields:pickd.map(([s,a,w])=>({label:s, options:opts, answer:a, why:w}))};
  },
  /* 6. Order: incident response */
  function irOrder(){
    const STEPS = [['Preparation: the team already has a ransomware playbook, tools and tested backups', 'preparation happens before anything goes wrong: playbooks, tools and training are ready'],
      ['Identification: confirm the alert is real ransomware, not a false alarm', 'an alert becomes an incident only once it\'s confirmed'],
      ['Containment: disconnect the laptop from the network so it can\'t spread', 'stop the damage from spreading first, before cleaning up'],
      ['Eradication and recovery: wipe the laptop and restore the files from backup', 'remove the cause, then bring things back and watch for a return'],
      ['Lessons learned: find out how it got in and improve the playbook', 'after it\'s over: root cause, report and changes so it doesn\'t happen again']];
    return pbqOrder('Incident response order', ['4.7'], 'quiz:sec:Incident response',
      'The incident response process: the order a team handles an incident in, so the damage is limited, evidence is kept and the same thing doesn\'t happen again.',
      '<p>Your EDR (endpoint detection and response) tool alerts that ransomware is encrypting files on one employee\'s laptop. Think about the whole life of this incident, including what the team did before it happened.</p>',
      'Number the five phases in the order they happen, 1 = first.', STEPS);
  },
  /* 7. Order: change management */
  function changeOrder(){
    const STEPS = [['Submit a change request with one named owner', 'every change starts as a written request with one person accountable for it'],
      ['Analyze the impact and test the update in a lab', 'find out what could break (here, the whole network) and prove the update works before asking for approval'],
      ['Get approval from the change advisory board (CAB)', 'the board reviews the request, the impact and the test results, then approves it'],
      ['Install it in the maintenance window, with a backout plan ready', 'the agreed low-traffic time, with a tested way back to the old firmware if it fails'],
      ['Check that it works, then update the network diagrams and procedures', 'confirm traffic flows and the flaw is fixed, then make the documentation match reality']];
    return pbqOrder('Change management order', ['1.2'], 'quiz:sec:Change management',
      'Change management: the process that makes sure a change is approved, tested and reversible before it touches a live system, so a routine fix doesn\'t cause an outage or open a security hole.',
      '<p>Your team needs to update the company firewall\'s firmware to fix a security flaw. Every connection in the company goes through that firewall, so a bad update could take everyone offline.</p>',
      'Number the steps in the order this change goes through, 1 = first.', STEPS);
  },
  /* 8. Risk calculation: SLE, ALE */
  function risk(){
    const av = rnd(4,40)*5000, ef = pick([10,20,25,40,50,75]), aro = pick([0.25,0.5,1,2,4]);
    const sle = Math.round(av*ef/100), ale = Math.round(sle*aro);
    return {title:'Calculate the risk', obj:['5.2'], skill:'quiz:sec:Risk management',
      goal:'Quantitative risk: putting a dollar figure on a risk, so you can tell whether a control is worth paying for. A control that costs less per year than the ALE pays for itself.',
      task:'Work out the three values. Enter SLE and ALE in whole dollars, and ARO as a number (once every 2 years is 0.5).',
      html:'<p>Your manager wants to know what the flood risk to one server costs the company per year.</p>'+
        '<p>The server and its data are worth <b>'+money(av)+'</b> (asset value). A flood would destroy <b>'+ef+'%</b> of it (exposure factor). Floods are expected <b>'+(aro === 1 ? 'once a year' : aro < 1 ? 'once every '+(1/aro)+' years' : aro+' times a year')+'</b>.</p>'+
        '<details><summary>Need the formulas?</summary><p class="small">SLE (single loss expectancy) = asset value × exposure factor: the cost of one flood.<br>ARO (annualized rate of occurrence) = how many floods a year.<br>ALE (annualized loss expectancy) = SLE × ARO: the cost per year.</p></details>',
      fields:[{label:'SLE (single loss expectancy)', num:true, answer:sle, why:'SLE = asset value × exposure factor = '+money(av)+' × '+ef+'% = '+money(sle)},
        {label:'ARO (annualized rate of occurrence)', num:true, answer:aro, why:'ARO is how many times a year: '+aro},
        {label:'ALE (annualized loss expectancy)', num:true, answer:ale, why:'ALE = SLE × ARO = '+money(sle)+' × '+aro+' = '+money(ale)+'. Spend less than this per year on a control and it pays for itself.'}]};
  }
];
/* a number field's value as a number: $12,500 / 12,500 / 12500 / 40% / 0.5 / .5 all work (null if it isn't a number) */
function pbqNum(v){ const t = String(v).trim().replace(/^\./, '0.').replace(/^-\./, '-0.'); const d = numAns(t); return d === null ? null : Number(d); }
/* ordering tasks: each step gets a position dropdown */
function pbqOrder(title, obj, skill, goal, html, task, STEPS){
  const shown = shuffle(STEPS.map((s,i)=>[...s, i+1])), pos = STEPS.map((_,i)=>String(i+1));
  return {title, obj, skill, goal, html, task,
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
      ? '<input type="text" inputmode="decimal" autocomplete="off" spellcheck="false" data-k="'+k+'" aria-label="'+esc(f.label)+'">'
      : '<select data-k="'+k+'" aria-label="'+esc(f.label)+'"><option value="">Choose…</option>'+f.options.map(o=>'<option>'+esc(o)+'</option>').join('')+'</select>')+'</label>';
  const body = t.rows
    ? '<div class="tw"><table class="res pbq-rules"><thead><tr><th>#</th><th>Action</th><th>Source</th><th>Destination</th><th>Port</th></tr></thead><tbody>'+
      [1,2,3,4].map(r=>'<tr><td>'+r+'</td>'+t.fields.filter(f=>f.rule===r).map(f=>'<td>'+field(f, t.fields.indexOf(f)).replace('<span>'+esc(f.label)+'</span>', '')+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>'
    : '<div class="pbq-fields">'+t.fields.map(field).join('')+'</div>';
  view.innerHTML = '<div class="slim stalert"><b>'+sys[1]+' Station alert: '+esc(sys[0])+' offline</b> <span class="small">Bring it back with '+esc(sys[2])+'.</span></div>'+
    '<div class="progress"><span>Task '+(PBQ.i+1)+' of '+PBQ.list.length+'</span><span>SY0-801 '+esc(t.obj.join(', '))+'</span></div>'+
    '<div class="card"><h2 style="margin-top:4px">'+esc(t.title)+'</h2>'+
    '<p class="pbq-goal"><b>What you\'re practicing:</b> '+t.goal+'</p>'+t.html+'<p class="pbq-task"><b>Your task:</b> '+t.task+'</p>'+body+
    '<div class="row" style="margin-top:14px"><button class="primary" id="pbqCheck">Check</button><button class="quiet" id="pbqShow">Show answer</button></div><div id="after"></div></div>';
  const get = ()=>{ const v = {}; view.querySelectorAll('[data-k]').forEach(el=>{ v[t.fields[+el.dataset.k].label] = el.value; }); return v; };
  const done = (revealed)=>{
    const v = get(); let parts, model = t.model || '';
    if(t.check){ const r = t.check(v); parts = r.parts; model = r.model; }
    else parts = t.fields.map(f=>{ const got = v[f.label], ok = f.num ? pbqNum(got) !== null && Math.abs(pbqNum(got) - f.answer) <= (f.answer >= 100 ? 1 : 0.001) : got === f.answer;
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
