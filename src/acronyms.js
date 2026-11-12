/* ===================== ACRONYMS =====================
   The acronym game (Review → Acronyms). Two lists:
   - 801: CompTIA's official SY0-801 acronym list (objectives document v2.0, last pages). The official list has
     a few typos ("Security Assertions Markup Language", "Portable Document Formats"); the standard form is taught
     and CompTIA's spelling is accepted as an alternative.
   - core: acronyms the lessons use that the official list leaves out.
   Each row: [acronym, words as taught, what it does (one line, never containing the acronym itself), alternatives].
   Nothing is saved per acronym yet, but keep rows append-only anyway in case a later version tracks them. */
const ACR_801 = [
  ['AAA', 'Authentication, Authorization, and Accounting', 'Checks who you are, decides what you may do, and records what you did.'],
  ['AI', 'Artificial Intelligence', 'Software that learns patterns from data to predict, classify or generate content.'],
  ['ALE', 'Annualized Loss Expectancy', 'The expected yearly cost of one risk: single loss times yearly rate.'],
  ['AML/CTF', 'Anti-money Laundering/Counter-terrorism Financing', 'Rules that stop criminals from hiding money or funding terrorism through a business.'],
  ['APT', 'Advanced Persistent Threat', 'A skilled, well-funded attacker who stays hidden in a network for a long time.'],
  ['ARO', 'Annualized Rate of Occurrence', 'How many times a year a risk is expected to happen.'],
  ['AUP', 'Acceptable Use Policy', 'The rules users agree to for using company systems.'],
  ['BEC', 'Business Email Compromise', 'A scam that uses a real or faked business mailbox to trick staff into paying or sharing data.'],
  ['BIMI', 'Brand Indicators for Message Identification', 'Shows a company\'s verified logo next to its authenticated email.'],
  ['BIOS', 'Basic Input/Output System', 'Firmware that starts the hardware before the operating system loads.'],
  ['BYOD', 'Bring Your Own Device', 'A policy that lets staff use their personal phones or laptops for work.'],
  ['CAB', 'Change Advisory Board', 'The group that reviews and approves changes before they go live.'],
  ['CAPTCHA', 'Completely Automated Public Turing test to tell Computers and Humans Apart', 'A small challenge that tells people apart from bots.'],
  ['CI/CD', 'Continuous Integration and Continuous Deployment', 'Automatically builds, tests and releases code changes.', ['Continuous Integration and Continuous Delivery']],
  ['CIA', 'Confidentiality, Integrity, and Availability', 'The three goals of security: data kept secret, correct, and reachable.'],
  ['CRL', 'Certificate Revocation List', 'A list, published by a certificate authority, of certificates cancelled before they expired.'],
  ['CSPM', 'Cloud Security Posture Management', 'Scans cloud accounts for risky settings and compliance gaps.'],
  ['CSR', 'Certificate Signing Request', 'What you send a certificate authority, with your public key, to get a certificate.'],
  ['CVE', 'Common Vulnerabilities and Exposures', 'A public ID for one specific known vulnerability, like 2021-44228.'],
  ['CVSS', 'Common Vulnerability Scoring System', 'Rates how severe a vulnerability is, from 0 to 10.'],
  ['CWE', 'Common Weakness Enumeration', 'A catalog of types of software weakness, such as SQL injection.'],
  ['DDoS', 'Distributed Denial of Service', 'Many machines flood one target at once to knock it offline.'],
  ['DHCP', 'Dynamic Host Configuration Protocol', 'Hands out IP addresses and network settings automatically.'],
  ['DKIM', 'DomainKeys Identified Mail', 'Signs outgoing email so receivers can check it came from the domain and was not changed.'],
  ['DLP', 'Data Loss Prevention', 'Spots and blocks sensitive data leaving the organization.'],
  ['DMARC', 'Domain-based Message Authentication, Reporting, and Conformance', 'Tells receivers what to do with mail that fails sender checks, and sends reports back.'],
  ['DNS', 'Domain Name System', 'Turns names like example.com into IP addresses.'],
  ['DoS', 'Denial of Service', 'An attack that makes a system unavailable to its users.'],
  ['EDR', 'Endpoint Detection and Response', 'Watches each computer for attacks and can isolate it.'],
  ['EOI', 'Expression of Interest', 'An early, informal step where vendors say they want to be considered for a contract.'],
  ['GBIC', 'Gigabit Interface Converter', 'An older swappable module that connects a switch port to fiber or copper.'],
  ['gMSA', 'Group Managed Service Account', 'A Windows service account whose password the domain changes automatically.'],
  ['HIDS', 'Host-based Intrusion Detection System', 'Watches one computer for signs of attack and alerts.', ['Host Intrusion Detection System']],
  ['HIPS', 'Host-based Intrusion Prevention System', 'Watches one computer and blocks attacks it detects.', ['Host Intrusion Prevention System']],
  ['HR', 'Human Resources', 'The team that handles hiring, staff records and people leaving.'],
  ['IaC', 'Infrastructure as Code', 'Servers and networks written as code files, so they are built the same way every time.'],
  ['IDS', 'Intrusion Detection System', 'Watches traffic and alerts on attacks, but does not block them.'],
  ['IP', 'Internet Protocol', 'Addresses packets and routes them between networks.'],
  ['IPFIX', 'Internet Protocol Flow Information Export', 'A standard for exporting summaries of network flows: who talked to whom, and how much.'],
  ['IPS', 'Intrusion Prevention System', 'Sits in the traffic path and blocks attacks it detects.'],
  ['IPSec', 'Internet Protocol Security', 'Encrypts and authenticates IP traffic, often for VPN tunnels.'],
  ['LAN', 'Local Area Network', 'A network inside one building or site.'],
  ['LDAP', 'Lightweight Directory Access Protocol', 'Looks up users and groups in a directory such as Active Directory.'],
  ['LLM', 'Large Language Model', 'An AI model trained on huge amounts of text to understand and write language.'],
  ['LMS', 'Learning Management System', 'A platform that delivers and tracks training courses.'],
  ['MDM', 'Mobile Device Management', 'Sets policies on company phones and tablets from one place, and can wipe them.'],
  ['MFA', 'Multifactor Authentication', 'A login that needs two or more kinds of proof, like a password plus a code.'],
  ['MOA', 'Memorandum of Agreement', 'A written agreement that lists each party\'s duties; firmer than a statement of shared intent.'],
  ['MOU', 'Memorandum of Understanding', 'A written statement of shared intent between parties; usually not legally binding.'],
  ['MSA', 'Master Service Agreement', 'The main contract that sets the terms for all future work between two companies.'],
  ['MTBF', 'Mean Time Between Failures', 'The average time a system runs before it breaks.'],
  ['MTTR', 'Mean Time to Repair', 'The average time it takes to fix something after it breaks.', ['Mean Time to Recover', 'Mean Time to Restore']],
  ['NDA', 'Non-disclosure Agreement', 'A contract promising to keep shared information secret.'],
  ['NFC', 'Near-field Communication', 'Very short-range wireless used for tap-to-pay and badges.'],
  ['NIC', 'Network Interface Card', 'The hardware that connects a computer to a network.', ['Network Interface Controller']],
  ['NIDS', 'Network-based Intrusion Detection System', 'Watches traffic across a network segment and alerts.', ['Network Intrusion Detection System']],
  ['NIPS', 'Network-based Intrusion Prevention System', 'Sits inline on a network segment and blocks attacks.', ['Network Intrusion Prevention System']],
  ['NVD', 'National Vulnerability Database', 'The US government database that adds severity scores and details to published vulnerabilities.'],
  ['OAuth', 'Open Authorization', 'Lets an app use your account on another service without getting your password.'],
  ['OCSP', 'Online Certificate Status Protocol', 'Asks in real time whether one certificate has been revoked.'],
  ['OS', 'Operating System', 'The core software that runs a computer, like Windows or Linux.'],
  ['OT', 'Operational Technology', 'Systems that run physical equipment, like factory and utility controllers.'],
  ['OTP', 'One-time Password', 'A code that works only once, often the second step of a login.'],
  ['PDF', 'Portable Document Format', 'A file format that looks the same on every device.', ['Portable Document Formats']],
  ['PIR', 'Post-incident Reporting', 'The write-up after an incident: what happened, and what to change.', ['Post-incident Review']],
  ['PKI', 'Public Key Infrastructure', 'The certificate authorities, certificates and rules that let people trust public keys.'],
  ['QR', 'Quick Response', 'The square barcode a phone camera can scan.', ['Quick Response code']],
  ['RCS', 'Rich Communication Services', 'The modern texting standard with read receipts and media.'],
  ['RF', 'Radio Frequency', 'The wireless signals used by Wi-Fi, Bluetooth and badges.'],
  ['RFC', 'Request for Comments', 'A published internet standard, like 5321 for email.'],
  ['RFI', 'Request for Information', 'Asks vendors for general information before a purchase.'],
  ['RFP', 'Request for Proposal', 'Asks vendors to propose how they would meet a need, and at what price.'],
  ['RFQ', 'Request for Quotation', 'Asks vendors for a price on a clearly defined order.', ['Request for Quote']],
  ['ROI', 'Return on Investment', 'How much benefit you get compared with what you spent.'],
  ['RPO', 'Recovery Point Objective', 'How much data, measured in time, you can afford to lose.'],
  ['RPS', 'Redundant Power Supply', 'A second power supply in the same device that takes over if the first fails.'],
  ['RTF', 'Rich Text Format', 'A simple document format with basic formatting, readable by most word processors.'],
  ['RTO', 'Recovery Time Objective', 'How long a system can be down before it must be working again.'],
  ['SaaS', 'Software as a Service', 'Software you use over the internet, run by the provider.'],
  ['SAML', 'Security Assertion Markup Language', 'Passes signed login statements from an identity provider to an app, for single sign-on.', ['Security Assertions Markup Language']],
  ['SCAP', 'Security Content Automation Protocol', 'Standards for automated vulnerability checks and configuration scans.'],
  ['SELinux', 'Security-Enhanced Linux', 'A Linux add-on that enforces mandatory access control.'],
  ['SFP', 'Small Form-factor Pluggable', 'A small swappable network transceiver for fiber or copper.'],
  ['SIEM', 'Security Information and Event Management', 'Collects logs from many systems and connects related events to spot attacks.'],
  ['SLE', 'Single Loss Expectancy', 'The cost of one occurrence of a risk: asset value times exposure factor.'],
  ['SMS', 'Short Message Service', 'Plain text messaging on phones.'],
  ['SNMP', 'Simple Network Management Protocol', 'Monitors and manages network devices.'],
  ['SOAR', 'Security Orchestration, Automation, and Response', 'Runs playbooks that respond to alerts automatically.'],
  ['SOC', 'Security Operations Center', 'The team that watches for and responds to security alerts.'],
  ['SOP', 'Standard Operating Procedure', 'Written step-by-step instructions for a routine task.'],
  ['SOW', 'Statement of Work', 'Describes the exact work, deliverables and timeline for one project.'],
  ['SPF', 'Sender Policy Framework', 'A DNS record listing which servers may send mail for a domain.'],
  ['SQL', 'Structured Query Language', 'The language for asking a database questions and changing its data.'],
  ['SSE', 'Security Service Edge', 'Cloud-delivered security that filters web, cloud-app and private-app access for users anywhere.'],
  ['SSO', 'Single Sign-on', 'One login gives access to many apps.'],
  ['TLS', 'Transport Layer Security', 'Encrypts data in transit; it is the S in HTTPS.'],
  ['TOC', 'Time-of-check', 'In a race-condition bug, the moment a program checks something.'],
  ['TOU', 'Time-of-use', 'In a race-condition bug, the later moment a program uses what it checked.'],
  ['UPS', 'Uninterruptible Power Supply', 'A battery unit that keeps equipment running through short power cuts.'],
  ['USB', 'Universal Serial Bus', 'The standard port for plugging in keyboards, drives and phones.'],
  ['UTM', 'Unified Threat Management', 'One appliance that combines firewall, intrusion prevention, antivirus and web filtering.'],
  ['VNC', 'Virtual Network Computing', 'Remote desktop that shares a computer\'s screen.'],
  ['VPN', 'Virtual Private Network', 'An encrypted tunnel across an untrusted network.'],
  ['WAF', 'Web Application Firewall', 'Filters web traffic to block attacks like SQL injection and cross-site scripting.'],
  ['WIPS', 'Wireless Intrusion Prevention System', 'Detects and blocks rogue access points and wireless attacks.']
];
const ACR_CORE = [
  ['ABAC', 'Attribute-Based Access Control', 'Grants access by rules about attributes, like department, time or location.'],
  ['ACL', 'Access Control List', 'A list of who or what is allowed or denied, checked in order.'],
  ['AES', 'Advanced Encryption Standard', 'The standard symmetric cipher: one shared key encrypts and decrypts.'],
  ['CA', 'Certificate Authority', 'The trusted organization that signs and issues certificates.'],
  ['DAC', 'Discretionary Access Control', 'The owner of a file decides who else may use it.'],
  ['DMZ', 'Demilitarized Zone', 'A separate network segment for public-facing servers.', ['Screened Subnet']],
  ['HTTPS', 'Hypertext Transfer Protocol Secure', 'Web traffic encrypted with TLS.'],
  ['IAM', 'Identity and Access Management', 'Managing accounts and what each one is allowed to reach.'],
  ['NAT', 'Network Address Translation', 'Lets many private addresses share one public address.'],
  ['RADIUS', 'Remote Authentication Dial-In User Service', 'Central login checking for network access such as Wi-Fi and VPN.'],
  ['RBAC', 'Role-Based Access Control', 'Grants access by job role, not by person.'],
  ['RSA', 'Rivest-Shamir-Adleman', 'A widely used public-key algorithm for encryption and signatures.'],
  ['SHA', 'Secure Hash Algorithm', 'A family of hash functions that fingerprint data.'],
  ['SLA', 'Service Level Agreement', 'A contract stating the service level a provider promises, like 99.9% uptime.'],
  ['SLO', 'Service Level Objective', 'An internal target for one service measure, like response time.'],
  ['SSH', 'Secure Shell', 'An encrypted remote command line.'],
  ['TACACS+', 'Terminal Access Controller Access-Control System Plus', 'Central login checking for network devices, encrypting the whole exchange.'],
  ['TPM', 'Trusted Platform Module', 'A chip on the motherboard that stores keys and checks the boot process.'],
  ['VLAN', 'Virtual Local Area Network', 'Splits one physical switch into separate logical networks.'],
  ['WPA', 'Wi-Fi Protected Access', 'The security standard for Wi-Fi; versions 2 and 3 are current.'],
  ['XSS', 'Cross-Site Scripting', 'An attack that gets a website to run the attacker\'s script in other users\' browsers.']
];
const ACRONYMS = [...ACR_801.map(r=>({a:r[0], w:r[1], d:r[2], alt:r[3] || [], src:'801'})),
                  ...ACR_CORE.map(r=>({a:r[0], w:r[1], d:r[2], alt:r[3] || [], src:'core'}))];
/* Lookalikes: acronyms people mix up. "Which one fits?" draws its wrong options from the same group first. */
const ACR_GROUPS = [['RPO','RTO','MTTR','MTBF'], ['ALE','SLE','ARO','ROI'], ['IDS','IPS','HIDS','HIPS','NIDS','NIPS','WIPS'],
  ['SPF','DKIM','DMARC','BIMI'], ['SAML','OAuth','SSO','LDAP'], ['CRL','OCSP','CSR','PKI','CA'], ['MOU','MOA','MSA','SOW','NDA','SLA'],
  ['RFI','RFP','RFQ','EOI'], ['DoS','DDoS','APT','BEC'], ['SIEM','SOAR','EDR','SOC'], ['CVE','CVSS','CWE','NVD','SCAP'], ['TOC','TOU','OTP'],
  ['RBAC','ABAC','DAC','IAM'], ['AES','RSA','SHA','TPM'], ['RADIUS','TACACS+','AAA','LDAP'], ['UTM','WAF','DLP','SSE','CSPM'],
  ['GBIC','SFP','NIC','RPS','UPS'], ['SMS','RCS','NFC','RF'], ['AUP','SOP','CAB','BYOD','MDM'], ['SLA','SLO','MTTR','RTO']];

/* n wrong options for "Which one fits?": lookalikes from the entry's groups first, then random others */
function acrLookalikes(entry, n){
  const near = [...new Set(ACR_GROUPS.filter(g=>g.includes(entry.a)).flat())].filter(a=>a !== entry.a);
  const mix = a=>a.map(x=>[Math.random(), x]).sort((p,q)=>p[0]-q[0]).map(p=>p[1]);
  const byA = new Map(ACRONYMS.map(e=>[e.a, e]));
  const out = mix(near).slice(0, n).map(a=>byA.get(a));
  for(const e of mix(ACRONYMS)) if(out.length < n && e !== entry && !out.includes(e)) out.push(e);
  return out;
}
/* ---------- the answer checker ----------
   Fair, not picky: case, punctuation, "&" vs "and", hyphens, small filler words (of, the, a, an, for, to, and),
   plurals and joined/split words ("multi factor" = "multifactor") never cost you. One typo in one longer word is
   accepted, unless the typo makes a different real word from the deck ("Context" for "Content" is wrong). */
const ACR_FILLER = new Set(['of','the','a','an','for','to','and']);
function acrSingular(t){ return t.length > 4 && /ies$/.test(t) ? t.slice(0,-3)+'y' : t.length > 3 && /s$/.test(t) && !/ss$/.test(t) ? t.slice(0,-1) : t; }
function acrTokens(s){
  return String(s).toLowerCase().replace(/&/g, ' and ').replace(/[-\/]/g, ' ').replace(/[^a-z0-9+ ]/g, '').replace(/\+/g, ' plus ')
    .split(/\s+/).filter(t=>t && !ACR_FILLER.has(t)).map(acrSingular);
}
/* a typo is only forgiven if it doesn't spell a real word: deck words, plus everyday words one letter away from them */
const ACR_VOCAB = new Set([...ACRONYMS.flatMap(e=>[e.w, ...e.alt].flatMap(acrTokens)),
  'context','contest','consent','contend','sample','signal','rational','passport','disposal','question','police','defect',
  'direct','present','massage','assess','export','record','sector','advice','argument','entity','discovery','directive',
  'republic','simple','service','server','secure','protect','product','project','detect','prevent','preview','review','policy']);
/* edit distance up to 1, counting a swap of two neighbouring letters as one edit */
function acrNear(x, y){
  if(x === y) return true;
  if(Math.abs(x.length - y.length) > 1) return false;
  if(x.length === y.length){
    const d = [...x].map((c,i)=>c!==y[i] ? i : -1).filter(i=>i>=0);
    return d.length === 1 || (d.length === 2 && d[1] === d[0]+1 && x[d[0]] === y[d[1]] && x[d[1]] === y[d[0]]);
  }
  const [s, l] = x.length < y.length ? [x, y] : [y, x];
  for(let i=0; i<l.length; i++) if(l.slice(0,i)+l.slice(i+1) === s) return true;
  return false;
}
/* typed words vs one entry: {ok, exact, form} where form is the accepted official/alternative wording */
function acrMatch(entry, typed){
  const got = acrTokens(typed);
  if(!got.length) return {ok:false};
  for(const form of [entry.w, ...entry.alt]){
    const want = acrTokens(form);
    if(got.join('') === want.join('')) return {ok:true, exact:form === entry.w, form};
  }
  for(const form of [entry.w, ...entry.alt]){
    const want = acrTokens(form);
    if(want.length !== got.length) continue;
    const diff = want.map((w,i)=>w === got[i] ? -1 : i).filter(i=>i>=0);
    if(diff.length !== 1) continue;
    const w = want[diff[0]], g = got[diff[0]];
    if(w.length >= 5 && !ACR_VOCAB.has(g) && acrNear(w, g)) return {ok:true, exact:false, typo:true, form};
  }
  return {ok:false};
}
/* typed acronym vs entry: letters, digits and + only, any case ("ci cd" = "CI/CD", "tacacs" is not "TACACS+") */
const acrKey = s=>String(s).toLowerCase().replace(/[^a-z0-9+]/g, '');
function acrMatchLetters(entry, typed){ return acrKey(typed) !== '' && acrKey(typed) === acrKey(entry.a); }
