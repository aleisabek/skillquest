/* ===================== WSL BREAK-AND-FIX LABS =====================
   The labs themselves live in /labs and run inside WSL Ubuntu (sq-lab command).
   Passing a lab prints a completion code; entering it here marks the lab done and boosts the related skills.
   code = first 6 hex characters of sha256("skillquest-lab:" + id), uppercased (checked by tests). */
const LAB_INSTALL = 'wsl bash /mnt/c/Users/User/Documents/SkillQuest/labs/install.sh';
const LABS = [
 {id:'permissions', title:'Permission denied', level:'L1', code:'758EC9', skills:['term:linux:Users, processes & privilege','quiz:linux:Permissions'],
  summary:'A backup script won\'t run and a secrets file is readable by everyone. Fix both with least privilege.'},
 {id:'config-hunt', title:'Find the bad setting', level:'L1', code:'CE41DB', skills:['term:linux:Filtering text','term:linux:Files & names'],
  summary:'"Too many connections": find the one config file with the wrong value among many, and change only that line.'},
 {id:'crlf', title:'Script edited on Windows won\'t run', level:'L1', code:'844001', skills:['term:linux:Files & names'],
  summary:'A script fails with "bad interpreter". Spot the hidden Windows line endings and fix them.'},
 {id:'disk-hog', title:'Disk filling up', level:'L2', code:'47770F', skills:['term:linux:Admin','quiz:linux:Admin tools'],
  summary:'Find the biggest file and free its space while a running app still has it open, without deleting it.'},
 {id:'log-hunt', title:'Who keeps failing to log in?', level:'L2', code:'34FBE5', skills:['term:linux:Filtering text'],
  summary:'Analyze an SSH log and find the IP with the most failed logins, using a grep | sort | uniq pipeline.'},
 {id:'web-down', title:'The website is down', level:'L2', code:'75E861', skills:['term:linux:Admin','term:linux:Networking'],
  summary:'Users can\'t reach the site. Test with curl, check listening ports, find the wrong port in the start script, bring it back.'},
 {id:'old-logs', title:'Archive old logs', level:'L2', code:'F84D57', skills:['term:linux:Archives','term:linux:Finding'],
  summary:'Archive only the logs older than 7 days into a tar.gz, delete them, and keep everything else.'},
 {id:'cron-fix', title:'The backup never runs', level:'L2', code:'2D0933', skills:['term:linux:Admin','quiz:linux:Scheduling (cron)'],
  summary:'A nightly backup never runs. Read the cron line, find the mistake, fix the schedule.'}
];
function completeLab(lab){
  S.labs = S.labs || {};
  if(S.labs[lab.id]){ toast('Already unlocked'); return; }
  S.labs[lab.id] = dayStr();
  lab.skills.forEach(id=>{ if(skillById(id)){ recordSkill(id, true, true); recordSkill(id, true, true); } });
  addXP(100, 'Lab passed: '+lab.title);
  vLabs();
}
function vLabs(){
  current = 'labs'; header();
  const done = Object.keys(S.labs||{}).length;
  view.innerHTML = '<h1>🧪 Break-and-fix labs</h1><p class="sub">Real problems on a real Linux system (your WSL Ubuntu). Each lab breaks something on purpose inside a sandbox folder, ~/sq-labs. You fix it with real commands, and the lab checks your work. No sudo, and nothing outside that folder is touched.</p>'+
    '<div class="card"><h3 style="margin-top:0">One-time setup</h3><p>Open <b>PowerShell</b> or <b>Windows Terminal</b> and run:</p><div class="model"><code id="inst">'+esc(LAB_INSTALL)+'</code> <button id="copyInst">Copy</button></div>'+
    '<p>Then open <b>Ubuntu</b> and type <code>sq-lab</code> to see the labs. Every lab works the same way:</p>'+
    '<ul class="clean"><li><code>sq-lab start NAME</code>: break it and read the mission</li><li><code>sq-lab hint NAME</code>: one more hint each time you ask</li><li><code>sq-lab check NAME</code>: checks your fix and prints a completion code</li><li><code>sq-lab reset NAME</code>: start over</li></ul>'+
    '<p class="small">Tip: say what you\'re doing out loud as you fix it. That\'s exactly how you\'ll answer "tell me about a time you troubleshot a Linux problem."</p></div>'+
    '<h2>Labs ('+done+' of '+LABS.length+' passed)</h2><div class="grid">'+LABS.map(l=>{ const d = (S.labs||{})[l.id];
      return '<div class="card mission '+(d?'done':'')+'"><div class="tag">'+l.level+' · '+l.skills.map(id=>(skillById(id)||{sk:id}).sk).filter((v,i,a)=>a.indexOf(v)===i).join(', ')+'</div><h3>'+esc(l.title)+'</h3><p>'+esc(l.summary)+'</p>'+
        '<p class="small">In Ubuntu: <code>sq-lab start '+l.id+'</code></p>'+
        (d ? '<p class="small">✔ Passed on '+d+'</p>' : '<div class="row"><input class="typed" style="min-width:120px;font-size:.9rem;padding:6px 10px" data-code="'+l.id+'" placeholder="Completion code" maxlength="6" autocomplete="off"><button data-unlock="'+l.id+'">Unlock</button></div>')+'</div>'; }).join('')+'</div>';
  $('#copyInst').onclick = ()=>{ try{ navigator.clipboard.writeText(LAB_INSTALL); toast('Copied'); }catch(e){ toast('Select the command and copy it'); } };
  const tryUnlock = id=>{ const l = LABS.find(x=>x.id===id), inp = view.querySelector('[data-code="'+id+'"]');
    if(inp.value.trim().toUpperCase() === l.code) completeLab(l); else { inp.classList.add('no'); toast('That code doesn\'t match. Run: sq-lab check '+id); } };
  view.querySelectorAll('[data-unlock]').forEach(b=>b.onclick=()=>tryUnlock(b.dataset.unlock));
  view.querySelectorAll('[data-code]').forEach(i=>i.onkeydown=e=>{ if(e.key==='Enter') tryUnlock(i.dataset.code); });
}
