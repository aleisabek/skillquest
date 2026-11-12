/* ===================== PRACTICE EXAMS =====================
   Timed, exam-style practice mapped to the official CompTIA exam domains, built from SkillQuest content.
   Honest by design: it shows how much of each domain SkillQuest covers, and it is not an official exam. */

/* The CompTIA objectives that generators are tagged with (sk(..., {obj})), checked word for word against CompTIA's own
   exam objectives documents, downloaded from each exam's page on comptia.org on 2026-11-04. Only the objectives SkillQuest
   has tagged questions for are listed; a tag naming anything else fails the tests. */
const OBJECTIVES = {
 'SY0-701':{doc:'CompTIA Security+ SY0-701 V7 exam objectives, document version 7.0', o:{
   '5.1':'Summarize elements of effective security governance.', '5.2':'Explain elements of the risk management process.',
   '5.3':'Explain the processes associated with third-party risk assessment and management.', '5.4':'Summarize elements of effective security compliance.',
   '5.5':'Explain types and purposes of audits and assessments.', '5.6':'Given a scenario, implement security awareness practices.'}},
 'SY0-801':{doc:'CompTIA Security+ SY0-801 V8 exam objectives, document version 2.0', o:{
   '1.2':'Given a scenario, demonstrate the impact of change management processes on security.',
   '2.1':'Explain characteristics of threats and vulnerabilities.', '2.2':'Describe common threat actors and motivations.',
   '2.3':'Describe threat vectors and sources.', '2.4':'Explain types of vulnerabilities and attack surfaces.',
   '2.5':'Given a scenario, analyze indicators of malicious activity.', '2.6':'Summarize threats and vulnerabilities associated with artificial intelligence (AI) usage.',
   '3.1':'Compare and contrast security implications of different architecture models.',
   '3.3':'Summarize concepts and strategies used to protect data.', '3.4':'Explain the importance of resilience and recovery in security architecture.',
   '4.2':'Explain the security implications of proper hardware, software, and data asset management.',
   '4.6':'Given a scenario, apply automation and orchestration solutions to secure operations.',
   '5.1':'Explain the importance of governance, risk, and compliance artifacts.', '5.2':'Explain the impact of risk management processes on the security of the organization.',
   '5.3':'Explain the assessment and management processes associated with third-party risk.', '5.4':'Summarize elements of effective security compliance.',
   '5.5':'Explain concepts associated with audit and assessment activities.', '5.6':'Given a scenario, apply security awareness concepts to improve organizational security.'}},
 'N10-009':{doc:'CompTIA Network+ N10-009 V9 exam objectives, document version 6.0', o:{
   '4.1':'Explain the importance of basic network security concepts.', '4.2':'Summarize various types of attacks and their impact to the network.',
   '4.3':'Given a scenario, apply network security features, defense techniques, and solutions.'}}
};
/* The terms each tagged objective lists, word for word from the same documents (sub-bullets flattened, wrapped lines
   joined). Every scenario answer must match a term of an objective it is tagged with (tests/feature-objectives.js). */
const OBJECTIVE_TERMS = {"SY0-701":{"5.1":["Guidelines","Policies","Acceptable use policy (AUP)","Information security policies","Business continuity","Disaster recovery","Incident response","Software development lifecycle (SDLC)","Change management","Standards","Password","Access control","Physical security","Encryption","Procedures","Onboarding/offboarding","Playbooks","External considerations","Regulatory","Legal","Industry","Local/regional","National","Global","Monitoring and revision","Types of governance structures","Boards","Committees","Government entities","Centralized/decentralized","Roles and responsibilities for systems and data","Owners","Controllers","Processors","Custodians/stewards"],"5.2":["Risk identification","Risk assessment","Ad hoc","Recurring","One-time","Continuous","Risk analysis","Qualitative","Quantitative","Single loss expectancy (SLE)","Annualized loss expectancy (ALE)","Annualized rate of occurrence (ARO)","Probability","Likelihood","Exposure factor","Impact","Risk register","Key risk indicators","Risk owners","Risk threshold","Risk tolerance","Risk appetite","Expansionary","Conservative","Neutral","Risk management strategies","Transfer","Accept","Exemption","Exception","Avoid","Mitigate","Risk reporting","Business impact analysis","Recovery time objective (RTO)","Recovery point objective (RPO)","Mean time to repair (MTTR)","Mean time between failures (MTBF)"],"5.3":["Vendor assessment","Penetration testing","Right-to-audit clause","Evidence of internal audits","Independent assessments","Supply chain analysis","Vendor selection","Due diligence","Conflict of interest","Agreement types","Service-level agreement (SLA)","Memorandum of agreement (MOA)","Memorandum of understanding (MOU)","Master service agreement (MSA)","Work order (WO)/statement of work (SOW)","Non-disclosure agreement (NDA)","Business partners agreement (BPA)","Vendor monitoring","Questionnaires","Rules of engagement"],"5.4":["Compliance reporting","Internal","External","Consequences of non-compliance","Fines","Sanctions","Reputational damage","Loss of license","Contractual impacts","Compliance monitoring","Due diligence/care","Attestation and acknowledgement","Internal and external","Automation","Privacy","Legal implications","Local/regional","National","Global","Data subject","Controller vs. processor","Ownership","Data inventory and retention","Right to be forgotten"],"5.5":["Attestation","Internal","Compliance","Audit committee","Self-assessments","External","Regulatory","Examinations","Assessment","Independent third-party audit","Penetration testing","Physical","Offensive","Defensive","Integrated","Known environment","Partially known environment","Unknown environment","Reconnaissance","Passive","Active"],"5.6":["Phishing","Campaigns","Recognizing a phishing attempt","Responding to reported suspicious messages","Anomalous behavior recognition","Risky","Unexpected","Unintentional","User guidance and training","Policy/handbooks","Situational awareness","Insider threat","Password management","Removable media and cables","Social engineering","Operational security","Hybrid/remote work environments","Reporting and monitoring","Initial","Recurring","Development","Execution"]},"SY0-801":{"1.2":["Business processes impacting security operations","Change advisory board (CAB)","Approval process","Ownership","Stakeholders","Impact analysis","Test results","Backout planning","Fail forward","Maintenance window","Standard operating procedures (SOPs)","Technical implications","Allow lists/deny lists","Restricted activities","Downtime","Service restart","Application restart","Legacy applications","Dependencies","Documentation","Updating diagrams","Updating policies/procedures","Version control"],"2.1":["Threats","Threat feeds","Likelihood","Impact","Intelligence sources","Life cycle","Vulnerabilities","Scoring","Common Vulnerability Scoring System (CVSS)","Prioritization","Vulnerability types","Common Vulnerabilities and Exposures (CVE)"],"2.2":["Threat actors","Crime syndicate/organized crime","Terrorist","Unskilled attacker","Hacktivist","Insider","Accidental/unintentional","Competitor","State-sponsored","Motivations","Financial","Influence","Intellectual property","Notoriety","Espionage","Fear/chaos","Extortion","General curiosity","Revenge","Ideological","Political","Ethical","Attributes of actors","Internal/external","Resources/funding","Level of sophistication/capability"],"2.3":["Advanced persistent threat (APT)","Message-based","Email","Short Message Service (SMS)","Rich Communication Services (RCS)","Instant messaging","Collaboration tools","Image-based","Quick response (QR) codes","Embedded content","Completely Automated Public Turing test to tell Computers and Humans Apart (CAPTCHA)","Attachment-based","Embedded macros","Rich Text Format (RTF) documents","Portable Document Formats (PDFs)","Browser-based","Extensions","JavaScript","Password managers","Cookies","Session tokens","Network-based","Infrastructure devices","Virtualized devices","Session keys","Remote access","Remote desktop","Virtual Network Computing (VNC)","Virtual private network (VPN)","Endpoint-based","Mobile devices","Workstations","Servers","Tablets","Trusted devices","Built-in tools","Living-off-the-land tools","Supply chain-based","Third-party providers","Managed service providers","Logistic providers","Software as a service (SaaS) providers","External media-based","Malicious Universal Serial Bus (USB)","Human-based","Impersonation","Contractor","Visitor","Biometric","Watering hole","Internet of Things (IoT)-based","Cameras","Sensors","Printers","Operational technology (OT)-based","Physical-based","Lock and key","Access vestibule","Access passes","Signal-based","Bluetooth","Radio frequency (RF)","Near-field communications (NFC)"],"2.4":["Unsupported products","Unpatched systems","Obsolete systems","Unmanaged systems","Ports and services","Applications","Race conditions","Time-of-check (TOC)","Time-of-use (TOU)","Malicious update","Code","Hardcoded secrets","Unsafe exception handling","Operating system (OS)-based","Virtualization","Zero-day","Cryptographic vulnerabilities","Unmanaged/stale credentials","Rogue devices","Shadow IT","Wireless and low-powered communications","Large language models (LLMs)","Identity providers","Mobile devices","Misconfiguration","Public repositories","Public object storage"],"2.5":["Malware attacks","Ransomware","Trojan","Worm","Spyware","Adware","Virus","Rootkit","Keylogger","Logic bomb","Fileless malware","Physical attacks","Tailgating","Shoulder surfing","Skimming","Forced entry","Network attacks","Distributed denial of service (DDoS)","Protocol downgrade","Rogue","Sniffing","Spoofing","On-path","Domain Name System (DNS) attacks","Cache poisoning","Social engineering attacks","Smishing","Vishing","Phishing","Whaling","Spear phishing","Quishing","Impersonation","Deepfake","Indicators of compromise","Hash","Internet Protocol (IP) address","Domain","Malicious processes","File system artifacts","Timestamp","Log manipulation","Excessive resource consumption","Plaintext strings","Account lockout","Impossible travel","Concurrent sessions","Application attacks","Injection","Buffer overflow","Replay","Privilege escalation","Forgery","Directory traversal","Credential attacks","Password spraying","Brute force","User enumeration","Replay","Multifactor authentication (MFA) bypass"],"2.6":["Model manipulation","Poisoning","Prompt injection","Data loss","Bias","Explainability","Hallucinations","Jailbreaking","Evasion","Privacy","Ethical considerations","Session hijacking","Code execution"],"3.1":["Architecture and infrastructure concepts","Cloud","Serverless","Multicloud","Deployment models","Hybrid","Private","Public","Community","Infrastructure as Code (IaC)","OT","On-premises infrastructure","Air-gapped network","Microservices","Logical segmentation","Physical segmentation","Technical considerations","Availability","Resilience","Proprietary vs. open source","Usability","Responsibility","Compute","Power requirements","Ease of recovery","Business considerations","Data sovereignty","Data classification","Cost","Ownership","Environmental requirements","Scalability","Risk"],"3.3":["Data types","Structured","Unstructured","Data states","Data at rest","Data in use","Data in transit","Data classifications","Sensitive","Secret","Critical","Confidential","Public","Top secret","Restricted","Methods used to secure data","Masking","Hashing","Filtering","Tokenization","Encryption","Data transpose","Deidentification","Obfuscation","Data protection roles","Data owner","Data custodian","Data steward","Data operator","Data controller","Data subprocessor","Data handling","Endpoints","Marking and labeling","Geofencing","Data location","Data placement","Data management life cycle","Creation","Management","Distribution","Retention","Disposal","Data compliance","Standards","Health data","Personal information","Financial","Child/minor data","Intellectual property","Legal data"],"3.4":["Site considerations","Hot","Cold","Warm","Environmental","Platform diversity","Vendor platform","Hardware","Virtualization","Redundancy strategies and solutions","Load balancing","Clustering","Autoscaling","High availability","Multicloud systems","Power","Uninterruptible power supply (UPS)","Redundant power supply (RPS)","Power generator","Surge protector","Storage","Backups","Retention","Immutability","Scope","Restoration testing","Testing","Failover","Simulation","Parallel processing","Disaster recovery","Business continuity","Capacity planning","Recovery metrics","Recovery time objective (RTO)","Recovery point objective (RPO)","Mean time to repair (MTTR)","Mean time between failures (MTBF)"],"4.2":["Asset management life cycle","Planning/scoping","Acquisition/procurement process","Assignment/accounting","Monitoring/asset tracking","Disposal/decommissioning"],"4.6":["Use cases of automation and scripting","User provisioning","Resource provisioning","Desired state management","Anomaly detection","Ticket management","Considerations","Guardrails","Automation logic","Process engineering","Complexity","Financial","Process risks","Deployment","AI","Capabilities","Agentic","Chatbot","Predictive analysis","AI-augmented baselines","Intended outcomes","Efficiency/time saving","Enforcing baselines","Continuous improvements","Productivity improvements","Reduced downtime","Increased proactivity","SecOps","Continuous integration and continuous deployment (CI/CD)","Workflows","Automation","Integrations"],"5.1":["Guidelines","Benchmarks","Advisories","Implementation guides","Reference architecture","Standards","Baselines","Passwords","Physical security","Request for comments (RFC)","Encryption","Procedures","Standard operating procedure (SOP)","Runbooks","Plans","Business continuity","Disaster recovery","Policies","Bring your own device (BYOD)","Acceptable use policy (AUP)","Clean desk","Information security","Incident response","Data classification and retention","Access control","Data disposal","Vulnerability disclosure","Privacy"],"5.2":["Risk identification","Asset identification","Stakeholder ownership","Risk assessment","Scoring","Categorization","Risk analysis","Impact","Likelihood/probability","Owner","Current mitigations","Qualitative vs. quantitative","Risk register","Communication","Reviews","Risk treatment","Transferring","Accepting","Avoiding","Mitigating","Business-level considerations","Business impact analysis","Risk appetite","Residual risk","Stakeholder involvement","Management oversight","Regulatory","Legal","Single loss expectancy (SLE)","Annualized loss expectancy (ALE)","Annualized rate of occurrence (ARO)"],"5.3":["Vendor selection","Request for proposal (RFP)","Request for information (RFI)","Request for quote (RFQ)","Expression of interest (EOI)","Due diligence","Conflict of interest","Agreement types","Service-level agreement (SLA)","Service-level objective (SLO)","Memorandum of understanding (MOU)","Memorandum of agreement (MOA)","Non-disclosure agreement (NDA)","Master services agreement (MSA)","Statement of work (SOW)","Vendor monitoring","Right to audit","Service-level monitoring","Vendor registry","Vendor assessment","Compliance attestation","Penetration testing","Limitations/constraints","Staffing limitations","Resource availability","Environment","Legal and regulatory factors","Geography/jurisdiction","Financial/return on investment (ROI)","Vendor lock-in","Assurance mechanisms","Rules of engagement"],"5.4":["Compliance training","Data handling","Anti-money laundering/counter-terrorism financing (AML/CTF)","Anti-bribery","Compliance monitoring","Attestations","Acknowledgements","Consequences of non-compliance","Reputational damage","Financial","Legal","Contractual","Sanctions","Loss of license","Privacy","Right to be forgotten","Opt-in or opt-out","Data correction","Processing restrictions","Processing prevention","Controller vs. processor","Ownership","Legal compliance","Legal hold","Legal orders","Data retention requirements"],"5.5":["Data gathering","Sampling","Questionnaires/surveys","Interviews","Assertion","Reference sources","MITRE ATT&CK","Cyber Kill Chain","Diamond Model of Intrusion Analysis","Scoping","Audit charter","Frequency","Engagement types","Gap analysis","Internal","Compliance","Audit committee","Self-assessments","External","Examinations","Assessments","Regulatory","Independent third-party audits","Benchmarking","Penetration testing","Known environment","Unknown environment","Partially known environment","Physical","Offensive","Defensive","Integrated","Reconnaissance","Passive","Active","Frameworks and standards","Industry-based standards","International standards","Region-specific standards","Functional testing","Behavioral testing"],"5.6":["Types of training","Initial/onboarding","Ongoing","Targeted","Corrective","Delivery mechanisms","Learning management system (LMS)","Self-service portals","One-to-one","One-to-many","Reporting and monitoring of effectiveness","Metrics","Managerial reports","Personnel behavior risk scoring","Common training topics","Social engineering","Emerging security topics","Password and credential management","Remote work/teleworking/hybrid","Bring your own device (BYOD)","Business email compromise (BEC)","Removable media and cables","Situational awareness","Operational security"]},"N10-009":{"4.1":["Logical security","Encryption","Data in transit","Data at rest","Certificates","Public key infrastructure (PKI)","Self-signed","Identity and access management (IAM)","Authentication","Multifactor authentication (MFA)","Single sign-on (SSO)","Remote Authentication Dial-in User Service (RADIUS)","LDAP","Security Assertion Markup Language (SAML)","Terminal Access Controller Access Control System Plus (TACACS+)","Time-based authentication","Authorization","Least privilege","Role-based access control","Geofencing","Physical security","Camera","Locks","Deception technologies","Honeypot","Honeynet","Common security terminology","Risk","Vulnerability","Exploit","Threat","Confidentiality, Integrity, and Availability (CIA) triad","Audits and regulatory compliance","Data locality","Payment Card Industry Data Security Standards (PCI DSS)","General Data Protection Regulation (GDPR)","Network segmentation enforcement","Internet of Things (IoT) and Industrial Internet of Things (IIoT)","Supervisory control and data acquisition (SCADA), industrial control System (ICS), operational technology (OT)","Guest","Bring your own device (BYOD)"],"4.2":["Denial-of-service (DoS)/distributed denial-of-service (DDoS)","VLAN hopping","Media Access Control (MAC) flooding","Address Resolution Protocol (ARP) poisoning","ARP spoofing","DNS poisoning","DNS spoofing","Rogue devices and services","DHCP","AP","Evil twin","On-path attack","Social engineering","Phishing","Dumpster diving","Shoulder surfing","Tailgating","Malware"],"4.3":["Device hardening","Disable unused ports and services","Change default passwords","Network access control (NAC)","Port security","802.1X","MAC filtering","Key management","Security rules","Access control list (ACL)","Uniform Resource Locator (URL) filtering","Content filtering","Zones","Trusted vs. untrusted","Screened subnet"]}};

/* Each domain: official name, weight (share of the real exam), fixed QUIZ question indexes, and generator skills [track, skill].
   Generators tagged with one of the domain's objectives join it too (d.tagged, filled in below). */
const CERTS = [
 /* SY0-801: domain names and weights from comptia.org/en-us/certifications/security/v8/ and the objectives document v2.0
    (checked 2026-11-12). Each fixed question sits in the domain whose objective lists its topic in that document:
    CIA, AAA and least privilege are 1.1; hashing, salting and asymmetric keys 1.3; phishing and ransomware 2.5;
    segmentation and VPN 3.1/3.2; backups 3.4; input validation, SPF and DMARC 4.1 (mitigations moved to domain 4);
    vulnerability prioritization 4.3; SIEM and alerting 4.4; MFA factors 4.5; incident response 4.7; logs 4.8.
    Attack types (vishing, trojans, brute force...) are 2.5 indicators. Generators that mix domains (access control models
    4.5 with principles 1.1; firewall rule order 4.1 with stateful/stateless, which 801 doesn't list) are left out on purpose. */
 /*
    A new id (not 'secplus'), so SY0-701 scores in the exam history are never read as SY0-801 ones. */
 {id:'secplus8', name:'CompTIA Security+', code:'SY0-801', real:'Up to 90 questions in 90 minutes, multiple-choice and performance-based; passing score 750 on a 100–900 scale.',
  note:'This practice follows SY0-801 (launch date November 17, 2026). It covers some topics from every domain, not the full objective list. Performance-based practice is on its own tab (Job prep → PBQs).',
  domains:[
   {n:1, name:'General Security Concepts', w:16, qs:[20,22,24,27,29], gens:[['sec','CIA triad'],['sec','Cryptography']]},
   {n:2, name:'Threats, Vulnerabilities, and Attacks', w:24, qs:[23,25], gens:[['sec','Vulnerabilities'],['sec','Attack types']]},
   {n:3, name:'Security Architecture', w:19, qs:[79,83,90], gens:[['sec','Backups']]},
   {n:4, name:'Security Operations', w:27, qs:[21,26,28,84,85,86,87,88,89,91], gens:[['sec','Authentication & MFA'],['sec','Windows logs'],['sec','Incident response']]},
   {n:5, name:'Security Program Management and Oversight', w:14, qs:[], gens:[]}
  ]},
 {id:'secplus', name:'CompTIA Security+', code:'SY0-701', real:'Up to 90 questions in 90 minutes; passing score 750 on a 100–900 scale.',
  /* dates from comptia.org, checked 2026-11-04: certifications/security/v7/ ("Retirement: English – June 11, 2027") and
     certifications/security/v8/ ("Launch date: November 17, 2026") */
  note:'This practice follows SY0-701, which CompTIA retires on June 11, 2027 (English). Its successor, SY0-801, launches on November 17, 2026 with different domain weights and has its own practice exam here. The governance questions also record their SY0-801 objectives.',
  domains:[
   {n:1, name:'General Security Concepts', w:12, qs:[20,21,22,27,29], gens:[['sec','CIA triad'],['sec','Authentication & MFA'],['sec','Cryptography']]},
   {n:2, name:'Threats, Vulnerabilities & Mitigations', w:22, qs:[23,25,26,89], gens:[['sec','Vulnerabilities']]},
   {n:3, name:'Security Architecture', w:18, qs:[79,83,90], gens:[['sec','Backups']]},
   {n:4, name:'Security Operations', w:28, qs:[24,28,84,85,86,87,88,91], gens:[['sec','Windows logs']]},
   {n:5, name:'Security Program Management & Oversight', w:20, qs:[], gens:[]}
  ]},
 {id:'netplus', name:'CompTIA Network+', code:'N10-009', real:'Up to 90 questions in 90 minutes; passing score 720 on a 100–900 scale.',
  domains:[
   {n:1, name:'Networking Concepts', w:23, qs:[10,12,14,17,18,77], gens:[['net','Ports & services'],['net','DNS records']]},
   {n:2, name:'Network Implementation', w:20, qs:[13,15,16,76,79,81], gens:[['net','IP addressing'],['net','Subnetting']]},
   {n:3, name:'Network Operations', w:19, qs:[78,82], gens:[]},
   {n:4, name:'Network Security', w:14, qs:[83], gens:[]},
   {n:5, name:'Network Troubleshooting', w:24, qs:[11,19,80], gens:[['support','Troubleshooting method']]}
  ]}
];
for(const c of CERTS) for(const d of c.domains)
  d.tagged = Object.keys(GEN).flatMap(tid=>genFor(tid, 0).filter(f=>((f.obj || {})[c.code] || []).some(o=>+o.split('.')[0] === d.n)).map(f=>({f, tid, sk:f.sk})));
const domGen = d=>d.gens.length > 0 || (d.tagged || []).length > 0;
const domCovered = d=>d.qs.length > 0 || domGen(d);
/* A domain with a few fixed questions and no generators repeats them: measured, but thinly. */
const domThin = d=>domCovered(d) && !domGen(d) && d.qs.length <= 3;
/* What a practice exam can and can't measure: the share of the real exam's weight it has questions for, and what is missing */
function examCoverage(cert){
  const on = cert.domains.filter(domCovered), w = on.reduce((a, d)=>a + d.w, 0);
  return {n:on.length, of:cert.domains.length, w, missing:cert.domains.filter(d=>!domCovered(d)), thin:cert.domains.filter(domThin)};
}
function coverageLine(cert){
  const c = examCoverage(cert);
  /* "100% of the real exam by weight" would read as full coverage, so a fully covered list says what it really means */
  return (c.n === c.of ? 'Has questions in all '+c.of+' domains, but each from only a few topics, not the full objective list.'
    : 'Has questions in '+c.n+' of '+c.of+' domains ('+c.w+'% of the real exam by weight), each from only a few topics, not the full objective list.')+(c.missing.length ? ' Unmeasured: '+c.missing.map(d=>esc(d.name)).join(', ')+'.' : '')+
    (c.thin.length ? ' Thin (a few repeating questions): '+c.thin.map(d=>esc(d.name)).join(', ')+'.' : '');
}
/* How many questions of a domain an exam can hold: fixed ones once each, generated ones without limit. */
const domCap = d=>domGen(d) ? Infinity : d.qs.length;

/* Split n questions across covered domains by weight; domains that run out pass their share to the others. */
function examPlan(cert, n){
  const doms = cert.domains.filter(domCovered), totalW = doms.reduce((a,d)=>a+d.w, 0);
  const plan = new Map(doms.map(d=>[d, Math.min(domCap(d), Math.round(n*d.w/totalW))]));
  let left = n - [...plan.values()].reduce((a,b)=>a+b, 0);
  const growable = doms.filter(d=>domCap(d)===Infinity).sort((a,b)=>b.w-a.w);
  for(let i=0; left>0 && growable.length; i++, left--) plan.set(growable[i%growable.length], plan.get(growable[i%growable.length])+1);
  for(const d of doms){ while(left<0 && plan.get(d)>1){ plan.set(d, plan.get(d)-1); left++; } }
  return plan;
}
function buildExam(cert, n){
  const items = [], seen = new Set();
  const gensOf = d=>{ const all = d.gens.flatMap(([tid, sk])=>genFor(tid, 0, sk).map(f=>({f, tid, sk})));
    for(const g of d.tagged || []) if(!all.some(x=>x.f === g.f)) all.push(g);
    return all; };
  const run = g=>{ const q = g.f(); if(q){ q.tid = g.tid; q.sk = g.sk; } return q; };
  for(const [d, k] of examPlan(cert, n)){
    const qs = shuffle(d.qs), fixed = qs.slice(0, domGen(d) ? Math.ceil(k/2) : k);
    /* generated questions: no repeats inside one exam (same picker as Quiz, Terminal and SQL) */
    const made = freshSet(gensOf(d), k - fixed.length, run, quizKey, null, seen);
    /* if the generators run out of different questions, top up with more fixed ones */
    fixed.push(...qs.slice(fixed.length, fixed.length + (k - fixed.length - made.length)));
    fixed.forEach(i=>items.push({d:QUIZ[i], qi:i, dom:d.n}));
    made.forEach(g=>items.push({d:g.d, sid:skillIdFor('quiz', g.tid, g.sk), dom:d.n}));
  }
  /* still short (a domain ran out of different questions): top up from the other domains, heaviest first */
  for(const d of cert.domains.filter(d=>domCovered(d) && domGen(d)).sort((a,b)=>b.w-a.w)){
    if(items.length >= n) break;
    freshSet(gensOf(d), n - items.length, run, quizKey, null, seen).forEach(g=>items.push({d:g.d, sid:skillIdFor('quiz', g.tid, g.sk), dom:d.n}));
  }
  return shuffle(items).map(it=>Object.assign(it, {order:shuffle([0,1,2,3]), pick:null, flag:false}));
}

let EX = null, exTimer = null;
function stopExamTimer(){ if(exTimer){ clearInterval(exTimer); exTimer = null; } }
function startExam(certId, n){
  const cert = CERTS.find(c=>c.id===certId);
  EX = {cert, items:buildExam(cert, n), i:0, secs:n*60, start:Date.now()};
  current = 'exams'; header(); stopExamTimer();
  exTimer = setInterval(()=>{ if(!EX) return stopExamTimer(); const left = EX.secs - Math.floor((Date.now()-EX.start)/1000);
    const el = $('#exClock'); if(el){ el.textContent = Math.floor(Math.max(0,left)/60)+':'+String(Math.max(0,left)%60).padStart(2,'0'); el.classList.toggle('low', left<=60); }
    if(left <= 0){ toast('Time is up'); submitExam(); } }, 1000);
  examStep();
}
function examStep(){
  const it = EX.items[EX.i], q = it.d, answered = EX.items.filter(x=>x.pick!==null).length;
  view.innerHTML = '<h1>📝 '+esc(EX.cert.name)+' practice</h1>'+
    '<div class="row" style="justify-content:space-between"><span class="small">Question '+(EX.i+1)+' of '+EX.items.length+' · '+answered+' answered · no feedback until you submit</span><span class="timer" id="exClock">--:--</span></div>'+
    '<div class="card" style="margin-top:10px"><div class="q">'+q[2]+'</div><div class="opts">'+
      it.order.map(k=>'<button class="opt" data-k="'+k+'" style="'+(it.pick===k?'border-color:var(--accent);background:var(--accent-soft);color:var(--text)':'')+'">'+q[3][k]+'</button>').join('')+'</div>'+
    '<div class="row" style="margin-top:14px"><button id="prev" '+(EX.i?'':'disabled')+'>◀ Prev</button><button id="flag">'+(it.flag?'🚩 Flagged':'⚐ Flag as unsure')+'</button><button id="nxt" '+(EX.i<EX.items.length-1?'':'disabled')+'>Next ▶</button><button class="primary" id="sub">Submit exam</button></div></div>'+
    '<div class="chips" style="margin-top:14px">'+EX.items.map((x,j)=>'<button class="chip" data-j="'+j+'" style="'+(j===EX.i?'border-color:var(--accent);color:var(--accent);':'')+(x.pick!==null?'border-style:solid;':'')+'">'+(j+1)+(x.flag?'🚩':'')+'</button>').join('')+'</div>'+
    '<p class="small">Solid chips = answered. Flag questions you are unsure about; they count as guesses in the skill\'s practice score.</p>';
  view.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{ it.pick = +b.dataset.k; if(EX.i < EX.items.length-1) EX.i++; examStep(); });
  view.querySelectorAll('[data-j]').forEach(b=>b.onclick=()=>{ EX.i = +b.dataset.j; examStep(); });
  $('#prev').onclick = ()=>{ EX.i--; examStep(); };
  $('#nxt').onclick = ()=>{ EX.i++; examStep(); };
  $('#flag').onclick = ()=>{ it.flag = !it.flag; examStep(); };
  $('#sub').onclick = ()=>{ const blank = EX.items.length - answered; if(!blank) submitExam(); else askConfirm(blank+' question'+(blank===1?' is':'s are')+' unanswered. Submit anyway?', 'Submit exam', submitExam); };
}
function submitExam(){
  stopExamTimer(); if(!EX) return;
  const ex = EX; EX = null;
  const used = Math.min(ex.secs, Math.round((Date.now()-ex.start)/1000));
  const byDom = {}; let right = 0;
  ex.items.forEach(it=>{
    it.ok = it.pick === it.d[4]; if(it.ok) right++;
    const b = byDom[it.dom] = byDom[it.dom] || {r:0, t:0}; b.t++; if(it.ok) b.r++;
    if(it.sid) recordSkill(it.sid, it.ok, !it.flag);
    if(!it.ok) addMistake(it.d, {kind:'quiz', your: it.pick===null ? '(no answer)' : plainText(it.d[3][it.pick]), sid: it.sid, qi: it.qi==null ? null : it.qi});
  });
  const pct = Math.round(right/ex.items.length*100);
  S.exams = S.exams || []; S.exams.unshift({cert:ex.cert.id, date:dayStr(), n:ex.items.length, pct, secs:used, doms:Object.fromEntries(Object.entries(byDom).map(([k,v])=>[k, Math.round(v.r/v.t*100)])),
    qn:Object.fromEntries(Object.entries(byDom).map(([k,v])=>[k, v.t]))});   /* qn: how many questions each domain's % rests on (saved from 2026-11-12) */
  S.exams.length = Math.min(S.exams.length, 50);
  addXP(Math.round(right*3), 'Exam submitted');
  save();
  const weakest = Object.entries(byDom).map(([k,v])=>[+k, v.r/v.t]).sort((a,b)=>a[1]-b[1])[0];
  /* the lowest-scoring skill in the weakest domain, so the result screen can send you straight to it */
  const weakDom = weakest && ex.cert.domains.find(d=>d.n===weakest[0]);
  const weakDrill = weakDom ? [...new Set(weakDom.gens.map(g=>'quiz:'+g[0]+':'+g[1]).concat((weakDom.tagged||[]).map(g=>'quiz:'+g.tid+':'+g.sk)))]
    .map(skillById).filter(Boolean).sort((a,b)=>skillScore(a.id) - skillScore(b.id))[0] : null;
  view.innerHTML = '<h1>📝 Partial practice results</h1><div class="card"><p class="q">'+right+' / '+ex.items.length+' ('+pct+'%) on what this practice covers</p>'+
    '<p class="small">'+coverageLine(ex.cert)+'</p>'+
    '<p>'+(pct>=85 ? 'Strong on what was tested.' : pct>=75 ? 'Good on what was tested. Drill your weakest domain below.' : 'Keep building. Read the lessons for your weakest domain and drill it before the next attempt.')+
    ' <span class="small">(This measures only the covered domains, with questions you may have seen before, and no performance-based questions. It doesn\'t predict a CompTIA score: check the unmeasured domains elsewhere.)</span></p>'+
    '<p class="small">Time used: '+Math.floor(used/60)+' min '+(used%60)+' s of '+Math.round(ex.secs/60)+' min.</p>'+
    '<h2>By domain</h2>'+ex.cert.domains.map(d=>{ const b = byDom[d.n];
      return '<div class="ritem"><span>'+d.n+'. '+esc(d.name)+' <span class="small">('+d.w+'% of real exam)</span></span>'+
        (b ? '<div class="meter"><i style="width:'+Math.round(b.r/b.t*100)+'%"></i></div><span class="small" style="width:70px;text-align:right">'+b.r+'/'+b.t+(domThin(d) ? ' · thin' : '')+'</span>' : '<span class="small">unmeasured: no questions yet</span>')+'</div>'; }).join('')+
    (weakest ? '<p class="small" style="margin-top:10px">👉 Weakest domain: <b>'+esc(ex.cert.domains.find(d=>d.n===weakest[0]).name)+'</b>. Your misses are saved in the mistake journal.</p>' : '')+
    '<div class="row" style="margin-top:12px">'+(weakDrill ? '<button class="primary" id="drillWeak">Drill '+esc(weakDrill.sk)+' (weakest domain)</button>' : '')+'<button id="rev">Review answers</button><button id="again">New exam</button><button id="home">Back to Today</button></div>'+sessionRow()+'</div><div id="review"></div>';
  $('#again').onclick = ()=>vExams();
  $('#home').onclick = ()=>go('today');
  if(weakDrill) $('#drillWeak').onclick = ()=>startSkill(weakDrill, 6, null);
  sessionWire();
  $('#rev').onclick = ()=>{ $('#review').innerHTML = '<h2>All answers</h2>'+ex.items.map((it,j)=>'<details class="card" style="margin:8px 0" '+(it.ok?'':'open')+'><summary>'+(it.ok?'✅':'❌')+' '+(j+1)+'. '+it.d[2].replace(/<table[\s\S]*?<\/table>/g,' [table] ')+(it.flag?' 🚩':'')+'</summary>'+
      '<p>You: <b>'+(it.pick===null?'(no answer)':it.d[3][it.pick])+'</b><br>Right: <b>'+it.d[3][it.d[4]]+'</b></p><div class="explain">'+it.d[5]+'</div></details>').join(''); $('#rev').disabled = true; };
}
function vExams(){
  current = 'exams'; header(); stopExamTimer();
  if(EX){ examStep(); askConfirm('Leave the exam in progress? Your answers will be lost.', 'Leave exam', ()=>{ stopExamTimer(); EX = null; vExams(); }); return; }
  const hist = S.exams || [];
  /* questions you have answered per domain across saved exams (only exams from 2026-11-12 on record the count) */
  const answered = (cid, n)=>hist.filter(h=>h.cert===cid && h.qn).reduce((a,h)=>a + (Number(h.qn[n])||0), 0);
  view.innerHTML = '<h1>📝 Partial practice exams</h1><p class="sub">Timed, exam-style practice on the CompTIA domains SkillQuest has questions for. No feedback until you submit. Each one covers only part of the real exam (listed below), may repeat questions you have seen, and has no performance-based questions: a score here measures this practice, not exam readiness.</p>'+
    CERTS.map(c=>{ const mine = hist.filter(h=>h.cert===c.id), best = mine.length ? Math.max(...mine.map(h=>h.pct)) : null;
      return '<div class="card cert" style="margin-bottom:14px"><div class="row" style="justify-content:space-between"><h3 style="margin:0">'+esc(c.name)+' <span class="small">'+c.code+'</span></h3>'+(best!==null?'<span class="pill">best '+best+'% on covered domains · '+mine.length+' tries</span>':'')+'</div>'+
        '<p class="small">Real exam: '+esc(c.real)+'</p>'+(c.note ? '<p class="small">'+esc(c.note)+'</p>' : '')+'<p class="small"><b>'+coverageLine(c)+'</b></p>'+
        '<div class="doms">'+c.domains.map(d=>'<div class="ritem dom'+(domCovered(d) ? '' : ' unmeasured')+'"><i class="wbar" style="--w:'+d.w+'" aria-hidden="true"></i><span>'+d.n+'. '+esc(d.name)+' <span class="small">'+d.w+'%</span></span><span class="small">'+(answered(c.id, d.n) ? '<b>'+answered(c.id, d.n)+' answered</b> · ' : '')+
          (!domCovered(d) ? '⚠ unmeasured: no questions yet' : (domThin(d) ? '⚠ thin: ' : '')+(d.qs.length+' fixed question'+(d.qs.length === 1 ? '' : 's')+(domGen(d)?' + generated variants, some repeat ('+[...new Set(d.gens.map(g=>g[1]).concat((d.tagged || []).map(g=>g.sk)))].join(', ')+')':'')))+'</span></div>').join('')+'</div>'+
        '<div class="row" style="margin-top:10px"><button class="primary" data-ex="'+c.id+'" data-n="20">Quick exam · 20 questions · 20 min</button><button data-ex="'+c.id+'" data-n="45">Longer practice · 45 questions · 45 min</button></div></div>'; }).join('')+
    (hist.length ? '<h2>History</h2><div class="card">'+hist.slice(0,10).map(h=>{ const pct = Math.round(Number(h.pct)||0), c = CERTS.find(c=>c.id===h.cert); return '<div class="ritem"><span>'+esc(h.date)+' · '+esc(c ? c.name : h.cert)+' · '+esc(h.n)+' Q</span><div class="meter"><i style="width:'+pct+'%"></i></div><span class="small" style="width:50px;text-align:right">'+pct+'%</span></div>'; }).join('')+'</div>' : '')+
    '<p class="small">Domains marked "unmeasured" have no questions here, so they are left out and listed in your results: study them elsewhere (Professor Messer\'s free videos cover every domain). A domain with zero questions is unmeasured, never 0%.</p>';
  view.querySelectorAll('[data-ex]').forEach(b=>b.onclick=()=>startExam(b.dataset.ex, +b.dataset.n));
}
