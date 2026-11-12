/* ===================== FREE PRACTICE =====================
   Outside resources that cost nothing, grouped by goal, plus a suggested weekly routine. */
const PRACTICE = [
 {group:'🛡️ Hands-on security practice', items:[
  ['OverTheWire', 'https://overthewire.org/wargames/', 'Bandit (Linux), then Natas (web basics) and Leviathan. Completely free.'],
  ['picoCTF', 'https://picoctf.org', 'Carnegie Mellon\'s beginner capture-the-flag challenges: forensics, crypto, web, Linux.'],
  ['Hack The Box Academy', 'https://academy.hackthebox.com', 'Start with the Fundamentals modules (Linux Fundamentals, Intro to Networking); check which are marked free.'],
  ['TryHackMe free rooms', 'https://tryhackme.com', 'Filter the room search to free rooms. Plenty of beginner rooms, just not in a path.']]},
 {group:'🔵 Defensive / SOC practice', items:[
  ['Blue Team Labs Online', 'https://blueteamlabs.online', 'Free investigations: logs, phishing emails, network captures.'],
  ['CyberDefenders', 'https://cyberdefenders.org', 'Free blue-team labs, close to real SOC analyst work.'],
  ['LetsDefend', 'https://letsdefend.io', 'A simulated SOC alert queue, with a free tier.']]},
 {group:'📚 Courses & certification prep', items:[
  ['Professor Messer', 'https://www.professormesser.com', 'Free full video courses for A+, Network+ and Security+. Pair with Job prep → Exams.'],
  ['Cisco Networking Academy', 'https://www.netacad.com', 'Free: Introduction to Cybersecurity, Networking Basics, Linux Unhatched, plus Packet Tracer.'],
  ['Microsoft Learn', 'https://learn.microsoft.com/training/', 'Free Microsoft 365, Entra ID, Intune and Azure training, including the AZ-900 (Azure fundamentals) and SC-900 (security fundamentals) learning paths.']]},
 {group:'☁️ Cloud security', items:[
  ['AWS Skill Builder', 'https://skillbuilder.aws', 'Free digital courses, including Cloud Practitioner Essentials and security fundamentals.'],
  ['flaws.cloud', 'http://flaws.cloud', 'A free, legal training site built to teach common AWS misconfigurations, level by level.']]},
 {group:'🗡️ Offensive security (legal practice only)', items:[
  ['PortSwigger Web Security Academy', 'https://portswigger.net/web-security', 'Free, legal web security labs with written explanations: injection, access control, authentication.'],
  ['OWASP Juice Shop', 'https://owasp.org/www-project-juice-shop/', 'A deliberately insecure web shop you run on your own machine. Only ever test apps you run yourself or are authorized to test.'],
  ['MITRE ATT&CK', 'https://attack.mitre.org', 'The tactics and techniques knowledge base. Read a few real group profiles and the detections listed for each technique.']]},
 {group:'🗄️ SQL practice', items:[
  ['SQLBolt', 'https://sqlbolt.com', 'Short interactive lessons with exercises in the browser.'],
  ['SQLZoo', 'https://sqlzoo.net', 'More free SQL exercises, from basic SELECT to joins.']]},
 {group:'🎓 Free through school or library', items:[
  ['GitHub Student Developer Pack', 'https://education.github.com/pack', 'Free tools and cloud credits with your UHD student email.'],
  ['Your public library', 'https://www.linkedin.com/learning/', 'Many library cards include LinkedIn Learning for free. Also ask UHD\'s cyber program or club about free TryHackMe / Hack The Box educational access.']]}
];
/* Which free resource helps most with each skill, and what to do there. Matched against today's planned lessons
   (the first lesson counts most); a skill with no entry falls back to its track (LAB_FOR in app.js). Names must be
   resources listed in PRACTICE above; the hints only name sections those sites have. Keys ending in ':' cover a track. */
const RES_FOR = {
  'quiz:linux:':['OverTheWire', 'Play the next Bandit level: every level drills the commands from today\'s Linux lesson.'],
  'term:linux:':['OverTheWire', 'Play the next Bandit level: it is the same kind of command-line task as today\'s Terminal practice.'],
  'term:linux:Git':['OverTheWire', 'Bandit\'s last levels are Git puzzles: clone, log, branches and tags.'],
  'quiz:net:Subnetting':['Cisco Networking Academy', 'In the free Networking Basics course, the IPv4 addressing and subnetting module.'],
  'quiz:net:IP addressing':['Cisco Networking Academy', 'In the free Networking Basics course, the IPv4 addressing module.'],
  'quiz:net:Ports & services':['Professor Messer', 'In the free Network+ course, the video on common ports and protocols.'],
  'quiz:net:DNS records':['Professor Messer', 'In the free Network+ course, the video on DNS record types.'],
  'quiz:net:Network attacks':['Professor Messer', 'In the free Security+ course, the network attacks videos. Then come back for a PBQ round.'],
  'quiz:net:Network security':['Professor Messer', 'In the free Security+ course, the videos on network security and segmentation.'],
  'quiz:sec:Cryptography':['picoCTF', 'In the practice gym, filter to the Cryptography category and do one beginner challenge.'],
  'quiz:sec:Secrets & untrusted code':['picoCTF', 'In the practice gym, the General Skills category: small, safe challenges about files, encodings and code.'],
  'quiz:sec:SSH hardening':['OverTheWire', 'Bandit is played entirely over SSH, and later levels use key files: key-based logins for real.'],
  'quiz:sec:Windows logs':['Blue Team Labs Online', 'Do one free investigation that uses Windows event logs.'],
  'quiz:sec:Indicators of compromise':['Blue Team Labs Online', 'Do one free investigation and list the indicators you find (IPs, hashes, accounts).'],
  'quiz:sec:Attack types':['CyberDefenders', 'Do one free beginner blue-team lab and name the attack type from the evidence.'],
  'quiz:sec:Incident response':['CyberDefenders', 'Do one free beginner lab and note which incident response step each of your actions belongs to.'],
  'quiz:sec:Threat actors':['MITRE ATT&CK', 'Open one real group profile under Groups: who they target, why, and which techniques they use.'],
  'quiz:sec:Threat vectors':['MITRE ATT&CK', 'Read the Initial Access tactic: every technique there is a threat vector.'],
  'quiz:sec:Security tools by job':['TryHackMe free rooms', 'Search the free rooms for one tool from today\'s lesson (for example Nmap or Wireshark).'],
  'quiz:offsec:Injection':['PortSwigger Web Security Academy', 'Read the SQL injection topic and do its first apprentice lab.'],
  'quiz:offsec:Access control failures':['PortSwigger Web Security Academy', 'Read the Access control topic and do its first apprentice lab.'],
  'quiz:offsec:Password attacks & detection':['PortSwigger Web Security Academy', 'Read the Authentication topic and do its first apprentice lab.'],
  'quiz:offsec:MITRE ATT&CK & kill chain':['MITRE ATT&CK', 'Pick one technique and read its Detection section.'],
  'quiz:cloud:Misconfigurations':['flaws.cloud', 'Play the next level: each one is a real AWS (Amazon Web Services) misconfiguration.'],
  'quiz:cloud:Leaked key response':['flaws.cloud', 'Play the next level: several are about leaked or over-powered keys.'],
  'quiz:cloud:Security groups & NACLs':['flaws.cloud', 'Play the next level and note which network or access setting was wrong.'],
  'quiz:cloud:':['AWS Skill Builder', 'In the free Cloud Practitioner Essentials course, the security module.'],
  'quiz:support:Microsoft 365 admin':['Microsoft Learn', 'One module from the free Microsoft 365 or Entra ID (identity) learning paths.'],
  'quiz:support:':['Professor Messer', 'In the free A+ course, the video that matches today\'s support lesson.'],
  'quiz:sql:':['SQLBolt', 'Do the next SQLBolt lesson: short exercises that run in the browser.'],
  'sql:sql:':['SQLBolt', 'Do the next SQLBolt lesson: short exercises that run in the browser.'],
  'sql:sql:Joins':['SQLBolt', 'The SQLBolt lessons on queries across several tables with JOINs.'],
  'quiz:code:Python':['picoCTF', 'The General Skills category: several beginner challenges are solved with a short Python script.'],
  'quiz:sec:':['Professor Messer', 'In the free Security+ course, the video on today\'s lesson topic. Then drill it here.']
};
const ROUTINE = [['Daily','The SkillQuest daily loop, plus one OverTheWire Bandit level'],['2× a week','One Professor Messer video, then drill the matching exam domain in SkillQuest'],['1× a week','One picoCTF or Blue Team Labs challenge, plus one sq-lab lab']];
function vPractice(){
  current = 'practice'; header();
  S.practice = S.practice || {};
  view.innerHTML = '<h1>🆓 Free resources</h1><p class="sub">Outside practice that costs nothing, grouped by goal. Mark what you used; the date is saved so you can see what you\'ve been neglecting.</p>'+
    '<h2>Suggested weekly routine</h2><div class="card">'+ROUTINE.map(r=>'<div class="ritem"><span><b>'+r[0]+'</b></span><span>'+esc(r[1])+'</span></div>').join('')+'</div>'+
    PRACTICE.map(g=>'<h2>'+g.group+'</h2><div class="grid">'+g.items.map(([name,url,note])=>{ const last = S.practice[name];
      return '<div class="card mission"><h3><a href="'+url+'" target="_blank" rel="noopener">'+esc(name)+' ↗</a></h3><p>'+esc(note)+'</p>'+
        '<div class="row"><button data-used="'+esc(name)+'">✓ Used today</button><span class="small">'+(last ? 'Last used: '+esc(last) : 'Not used yet')+'</span></div></div>'; }).join('')+'</div>').join('')+
    '<p class="small">Free tiers change over time. If something here starts charging, tell Claude and swap it for another option.</p>';
  view.querySelectorAll('[data-used]').forEach(b=>b.onclick=()=>{ S.practice[b.dataset.used] = dayStr(); save(); toast('Logged: '+b.dataset.used); vPractice(); });
}
