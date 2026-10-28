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
  ['Microsoft Learn', 'https://learn.microsoft.com/training/', 'Free Microsoft 365, Entra ID and Intune training for IT support roles.']]},
 {group:'🗄️ SQL practice', items:[
  ['SQLBolt', 'https://sqlbolt.com', 'Short interactive lessons with exercises in the browser.'],
  ['SQLZoo', 'https://sqlzoo.net', 'More free SQL exercises, from basic SELECT to joins.']]},
 {group:'🎓 Free through school or library', items:[
  ['GitHub Student Developer Pack', 'https://education.github.com/pack', 'Free tools and cloud credits with your UHD student email.'],
  ['Your public library', 'https://www.linkedin.com/learning/', 'Many library cards include LinkedIn Learning for free. Also ask UHD\'s cyber program or club about free TryHackMe / Hack The Box educational access.']]}
];
const ROUTINE = [['Daily','SkillQuest missions, plus one OverTheWire Bandit level'],['2× a week','One Professor Messer video, then drill the matching exam domain in SkillQuest'],['1× a week','One picoCTF or Blue Team Labs challenge, plus one sq-lab lab']];
function vPractice(){
  current = 'practice'; header();
  S.practice = S.practice || {};
  view.innerHTML = '<h1>🆓 Free practice</h1><p class="sub">Outside practice that costs nothing, grouped by goal. Mark what you used; the date is saved so you can see what you\'ve been neglecting.</p>'+
    '<h2>Suggested weekly routine</h2><div class="card">'+ROUTINE.map(r=>'<div class="ritem"><span><b>'+r[0]+'</b></span><span>'+esc(r[1])+'</span></div>').join('')+'</div>'+
    PRACTICE.map(g=>'<h2>'+g.group+'</h2><div class="grid">'+g.items.map(([name,url,note])=>{ const last = S.practice[name];
      return '<div class="card mission"><h3><a href="'+url+'" target="_blank" rel="noopener">'+esc(name)+' ↗</a></h3><p>'+esc(note)+'</p>'+
        '<div class="row"><button data-used="'+esc(name)+'">✓ Used today</button><span class="small">'+(last ? 'Last used: '+esc(last) : 'Not used yet')+'</span></div></div>'; }).join('')+'</div>').join('')+
    '<p class="small">Free tiers change over time. If something here starts charging, tell Claude and swap it for another option.</p>';
  view.querySelectorAll('[data-used]').forEach(b=>b.onclick=()=>{ S.practice[b.dataset.used] = dayStr(); save(); toast('Logged: '+b.dataset.used); vPractice(); });
}
