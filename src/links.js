/* ===================== HOW IT CONNECTS =====================
   Each lesson links to related lessons with one sentence on how they connect. A fact sticks better when it hooks onto
   something you already know, so every lesson shows these links both ways: the ones listed under it here, and the ones
   other lessons list pointing at it. Keys and targets are skill ids (tests/feature-links.js checks every one exists,
   that no pair is listed twice, and that every lesson ends up with at least two). */
const LESSON_LINKS = {
  /* ---- Linux ---- */
  'quiz:linux:Permissions': [
    ['quiz:sec:Least privilege & access control', 'chmod is least privilege on a single file: each of owner, group and others gets only what its job needs.'],
    ['term:linux:Users, processes & privilege', 'The same r/w/x rules, typed as commands: chmod 640 sets them, ls -l and id show who they apply to.']],
  'quiz:linux:Everyday commands': [
    ['term:linux:Reading & identifying', 'cat, less, head and tail from this lesson are the commands you type in the terminal drills.'],
    ['quiz:linux:Filesystem layout', 'cd and ls are how you move around the folders that lesson maps out.']],
  'quiz:linux:Filesystem layout': [
    ['quiz:sec:Investigation data', '/var/log is where a Linux system keeps much of the log data an investigation starts from.'],
    ['quiz:sec:SSH hardening', 'SSH hardening is an edit to one file in /etc: /etc/ssh/sshd_config.']],
  'quiz:linux:Scheduling (cron)': [
    ['quiz:sec:Automation & orchestration', 'Cron is the simplest kind of automation: a task that runs on a schedule with nobody pressing a button.'],
    ['quiz:sec:Indicators of compromise', 'Attackers use cron for persistence, so an unexpected cron entry is a classic sign of compromise.']],
  'quiz:linux:Admin tools': [
    ['term:linux:Admin', 'The same df, du, free and systemctl tools, typed for real in the terminal drills.'],
    ['quiz:support:Windows tools', 'The Windows versions of the same jobs: Task Manager for top, Event Viewer for the logs, Services for systemctl.']],

  /* ---- Networking ---- */
  'quiz:net:Ports & services': [
    ['quiz:sec:Firewalls', 'Firewall rules are written in ports: allowing 443 means allowing HTTPS, and blocking 23 means blocking Telnet.'],
    ['quiz:cloud:Security groups & NACLs', 'Security groups are cloud firewall rules, and they too are written as ports and sources.']],
  'quiz:net:IP addressing': [
    ['quiz:net:Subnetting', 'Subnetting splits an address range into networks, so it builds directly on how IPv4 addresses are written.'],
    ['term:linux:Networking', 'ping, traceroute and ssh all take an IP address or a name that DNS turns into one.']],
  'quiz:net:Subnetting': [
    ['quiz:sec:Infrastructure security', 'Security zones and segmentation are built from subnets: each zone is its own address range with rules between them.']],
  'quiz:net:DNS records': [
    ['quiz:net:Network attacks', 'DNS poisoning and DNS-based attacks only make sense once you know what an A or MX record is supposed to say.'],
    ['term:linux:Networking', 'dig is how you look up the records this lesson describes.']],
  'quiz:net:Network attacks': [
    ['quiz:sec:Attack types', 'Network attacks are one family inside the wider list of attack types.'],
    ['quiz:net:Network security', 'Each network defense exists because of an attack in this lesson: NAC against rogue devices, port security against MAC flooding.']],
  'quiz:net:Network security': [
    ['quiz:sec:Infrastructure security', 'Hardening, NAC and segmentation are the network layer of infrastructure security.'],
    ['quiz:sec:Firewalls', 'A firewall is the most common network security control, so it gets a lesson of its own.']],

  /* ---- Security ---- */
  'quiz:sec:CIA triad': [
    ['quiz:sec:Cryptography', 'Encryption protects confidentiality and hashing protects integrity: cryptography serves two legs of the triad.'],
    ['quiz:sec:Backups', 'Backups protect availability, the third leg: the data is still there when you need it.']],
  'quiz:sec:Authentication & MFA': [
    ['quiz:offsec:Password attacks & detection', 'MFA exists because passwords alone fall to spraying, stuffing and phishing.'],
    ['quiz:sec:Identity & access management', 'Authentication is one step inside the larger identity life cycle, from proofing to deprovisioning.']],
  'quiz:sec:Cryptography': [
    ['quiz:sec:PKI & encryption', 'PKI is how public keys get trusted: certificates bind a public key to a name.'],
    ['term:linux:Encoding & hashing', 'sha256sum computes a hash and base64 only encodes; telling them apart is the same idea, typed.']],
  'quiz:sec:Least privilege & access control': [
    ['quiz:cloud:IAM & least privilege', 'The same principle in the cloud, written as IAM policies instead of file permissions.'],
    ['quiz:offsec:Access control failures', 'Broken access control is what happens when least privilege is not enforced on the server.']],
  'quiz:sec:Attack types': [
    ['quiz:sec:Security awareness', 'Awareness training targets the social engineering attacks in this lesson.'],
    ['quiz:sec:Indicators of compromise', 'Each attack leaves traces; indicators of compromise are how you spot it afterward.']],
  'quiz:sec:Firewalls': [
    ['quiz:cloud:Security groups & NACLs', 'Security groups and NACLs are cloud firewalls: one stateful, one stateless, both checking rules.'],
    ['quiz:sec:Security controls', 'A firewall is a technical, preventive control.']],
  'quiz:sec:Windows logs': [
    ['quiz:sec:Monitoring & alerting', 'Event IDs like 4625 are what a SIEM alert rule counts and fires on.'],
    ['quiz:offsec:Password attacks & detection', 'A burst of 4625 failed logons, then a 4624 success, is how password spraying shows up in the logs.']],
  'quiz:sec:Vulnerabilities': [
    ['quiz:sec:Vulnerability management', 'CVE and CVSS feed the management cycle: scan, score, prioritize, fix, then verify.'],
    ['quiz:sec:Vulnerability types', 'A CVE names one specific flaw; the types lesson sorts flaws into families.']],
  'quiz:sec:Backups': [
    ['quiz:sec:Incident response', 'Recovery after ransomware depends on a backup the attacker could not reach: offline or immutable.'],
    ['quiz:sec:Acronyms', 'RTO and RPO are the two numbers a backup plan is judged against.']],
  'quiz:sec:Secrets & untrusted code': [
    ['quiz:cloud:Leaked key response', 'A secret committed to code is how many cloud keys leak; that lesson is what you do next.'],
    ['term:linux:Git', 'git log -p shows every old change, which is why a secret removed in a later commit is still in the history.']],
  'quiz:sec:Incident response': [
    ['quiz:sec:Incident response activities', 'The same phases in detail: tabletop exercises, playbooks, root cause analysis and lessons learned.'],
    ['quiz:support:ITIL', 'ITIL incident management restores service; security incident response also contains, investigates and learns.']],
  'quiz:sec:SSH hardening': [
    ['quiz:sec:Authentication & MFA', 'Keys instead of passwords is the "something you have" factor applied to SSH logins.'],
    ['quiz:sec:Mitigations', 'Disabling root login and passwords is hardening, one of the mitigation techniques.']],
  'quiz:sec:Governance & policy': [
    ['quiz:sec:Compliance & audits', 'Policies set the rules; compliance and audits check that they are followed.'],
    ['quiz:sec:Change management', 'Change management is a policy turned into a process that every change goes through.']],
  'quiz:sec:Risk management': [
    ['quiz:sec:Third-party risk', 'Vendors are one source of risk, so third-party risk is risk management applied to suppliers.'],
    ['quiz:sec:Security controls', 'Mitigating a risk means choosing controls; the risk left over after them is residual risk.']],
  'quiz:sec:Third-party risk': [
    ['quiz:cloud:Shared responsibility', 'A cloud provider is a third party; shared responsibility spells out which part is theirs.']],
  'quiz:sec:Compliance & audits': [
    ['quiz:cloud:Audit logging', 'Auditors ask for evidence, and audit logs are much of that evidence.']],
  'quiz:sec:Security awareness': [
    ['quiz:sec:Threat vectors', 'Training covers the human vectors: email, texts, calls and removable media.']],
  'quiz:sec:Security tools by job': [
    ['quiz:sec:Monitoring & alerting', 'A SIEM is the tool that does log aggregation and alerting.'],
    ['quiz:sec:Investigation data', 'Each tool produces a kind of investigation data: packet captures, logs, endpoint records.']],
  'quiz:sec:Threat actors': [
    ['quiz:sec:Threat vectors', 'Actors are who attacks; vectors are the way in they use.'],
    ['quiz:offsec:MITRE ATT&CK & kill chain', 'ATT&CK records what real actor groups actually do, technique by technique.']],
  'quiz:sec:Threat vectors': [
    ['quiz:sec:Attack types', 'A vector is the path in; the attack is what travels down it, such as phishing over email.']],
  'quiz:sec:Vulnerability types': [
    ['quiz:offsec:Injection', 'Injection is one application vulnerability type, explained in depth.'],
    ['quiz:sec:Mitigations', 'Each vulnerability type has a matching mitigation: patching, isolation, configuration.']],
  'quiz:sec:Indicators of compromise': [
    ['quiz:sec:Windows logs', 'Many indicators, like lockouts and odd sign-ins, are read straight out of Windows event logs.']],
  'quiz:sec:AI threats': [
    ['quiz:offsec:Injection', 'Prompt injection works like any injection: untrusted input gets read as instructions.'],
    ['quiz:sec:Secrets & untrusted code', 'Content an AI model reads is untrusted input, just like code you did not write.']],
  'quiz:sec:Change management': [
    ['quiz:sec:Automation & orchestration', 'Automation makes approved changes repeatable, and desired state management keeps systems on the approved baseline.'],
    ['quiz:qa:Testing process', 'The test results a change needs before approval come from a testing process.']],
  'quiz:sec:Architecture models': [
    ['quiz:cloud:Shared responsibility', 'How much you secure yourself depends on the model: more with IaaS, less with SaaS.'],
    ['quiz:sec:Infrastructure security', 'Architecture decides the zones and placement that infrastructure security then protects.']],
  'quiz:sec:Asset management': [
    ['quiz:sec:Vulnerability management', 'You can only scan and patch what is in the asset inventory.'],
    ['quiz:sec:Vulnerability types', 'An unmanaged or rogue device is an asset nobody recorded, which makes it a vulnerability.']],
  'quiz:sec:Automation & orchestration': [
    ['quiz:sec:Identity & access management', 'User provisioning and deprovisioning are the most common automation use cases.']],
  'quiz:sec:Security controls': [
    ['quiz:sec:Mitigations', 'Mitigation techniques are specific controls, each with a category and a type.']],
  'quiz:sec:PKI & encryption': [
    ['quiz:cloud:Encryption & key management', 'The same keys and encryption in the cloud, with a managed key service holding the keys.'],
    ['quiz:code:HTTP & APIs', 'HTTPS is HTTP inside TLS, and TLS trusts the server through its certificate.']],
  'quiz:sec:Infrastructure security': [
    ['quiz:sec:Firewalls', 'Firewalls sit at the boundaries between the zones this lesson draws.']],
  'quiz:sec:Mitigations': [
    ['quiz:sec:Backups', 'A backup is a corrective control: it does not stop ransomware, it gets you back.']],
  'quiz:sec:Vulnerability management': [
    ['quiz:offsec:Engagement types', 'A vulnerability scan and a penetration test are two ways of finding what this cycle then fixes.']],
  'quiz:sec:Monitoring & alerting': [
    ['quiz:cloud:Audit logging', 'Cloud audit logs are one of the sources monitoring collects and alerts on.']],
  'quiz:sec:Identity & access management': [
    ['quiz:support:Microsoft 365 admin', 'Entra ID is where much of this identity life cycle happens in a Microsoft shop.'],
    ['quiz:cloud:IAM & least privilege', 'Cloud IAM is the same identity and access idea with cloud roles and policies.']],
  'quiz:sec:Incident response activities': [
    ['quiz:sec:Investigation data', 'The analysis phase runs on investigation data: logs, captures and endpoint records.']],
  'quiz:sec:Investigation data': [
    ['quiz:code:Logging', 'Good application logging is what turns into useful investigation data later.']],
  'quiz:sec:Acronyms': [
    ['quiz:sec:Security tools by job', 'Many acronyms are tool names: SIEM, EDR, IDS, IPS. Knowing what each tool does makes them easier to keep apart.']],

  /* ---- IT support ---- */
  'quiz:support:Troubleshooting method': [
    ['quiz:support:Ticket priority', 'Priority decides which ticket you troubleshoot first.'],
    ['quiz:qa:Defect life cycle', 'Verify full functionality and document findings, the method\'s last steps, are the same idea as retest and close.']],
  'quiz:support:Windows tools': [
    ['quiz:sec:Windows logs', 'Event Viewer is where the security event IDs live.']],
  'quiz:support:Ticket priority': [
    ['quiz:support:ITIL', 'ITIL incidents get their priority from impact and urgency, exactly as this lesson works it out.'],
    ['quiz:sec:Risk management', 'Impact times urgency is the same shape as likelihood times impact in risk analysis.']],
  'quiz:support:ITIL': [
    ['quiz:sec:Change management', 'ITIL also has a change practice; the Security+ change management steps are the same ideas.']],
  'quiz:support:Microsoft 365 admin': [
    ['quiz:sec:Authentication & MFA', 'Turning on MFA for users is one of the most common jobs in the Entra admin center.']],

  /* ---- Software testing ---- */
  'quiz:qa:Test design': [
    ['quiz:qa:Test types', 'Design decides which inputs to try; types decide at what level, from one function to the whole system.']],
  'quiz:qa:Test types': [
    ['quiz:qa:Testing process', 'Each test type runs at a stage of the testing life cycle.']],
  'quiz:qa:Testing process': [
    ['quiz:qa:Defect life cycle', 'Test execution finds the defects that then move through their own life cycle.']],
  'quiz:qa:Defect life cycle': [
    ['quiz:sec:Vulnerability management', 'A vulnerability is tracked like a defect: found, assigned, fixed, then verified by a rescan.']],
  'quiz:qa:Pre-registration': [
    ['quiz:qa:Holdout data', 'Pre-registration fixes the rules in advance; holdout data is the untouched data you then test them on.'],
    ['quiz:qa:Walk-forward testing', 'Both stop you from fitting rules to results you have already seen.']],
  'quiz:qa:Walk-forward testing': [
    ['quiz:qa:Holdout data', 'Walk-forward tests on the next unseen window over and over; a holdout is one final unseen window.']],
  'quiz:qa:Holdout data': [
    ['quiz:qa:Test design', 'A holdout is test data kept apart from the work, so it can show a fair result.']],

  /* ---- Coding ---- */
  'quiz:code:HTTP & APIs': [
    ['quiz:net:Ports & services', 'HTTP normally runs on port 80 and HTTPS on 443.'],
    ['quiz:offsec:Access control failures', 'A 403 is the server enforcing authorization; broken access control is when it returns 200 instead.']],
  'quiz:code:Python': [
    ['quiz:code:Regex', 'Python\'s re module uses nearly the same patterns, \\d and \\w included.'],
    ['quiz:sec:Automation & orchestration', 'Scripts like these are how much security automation actually gets written.']],
  'quiz:code:Git': [
    ['term:linux:Git', 'The same git commands, typed for real in the terminal drills.'],
    ['quiz:sec:Change management', 'A reviewed pull request is change management for code: an owner, a review and an approval before it merges.']],
  'quiz:code:Regex': [
    ['term:linux:Filtering text', 'grep searches with regex too: grep -E for + and |, and grep -P for \\d.']],
  'quiz:code:Logging': [
    ['quiz:sec:Monitoring & alerting', 'Log levels decide what reaches monitoring: an ERROR line may fire an alert, and a DEBUG line should not.']],

  /* ---- SQL ---- */
  'quiz:sql:Filtering': [
    ['sql:sql:Filtering (WHERE)', 'The same WHERE clauses, written for real in the SQL console.'],
    ['quiz:offsec:Injection', 'SQL injection works by breaking out of the quotes around a WHERE value.']],
  'quiz:sql:Grouping': [
    ['sql:sql:Counting & grouping', 'The same GROUP BY and HAVING, written for real in the SQL console.'],
    ['quiz:sql:Filtering', 'WHERE filters rows before grouping; HAVING filters the groups after.']],
  'quiz:sql:Sorting & limiting': [
    ['sql:sql:Sorting & limiting', 'The same ORDER BY and LIMIT, written for real in the SQL console.'],
    ['quiz:sql:Grouping', 'Sorting grouped counts finds the top group: GROUP BY, then ORDER BY COUNT(*) DESC LIMIT 1.']],
  'quiz:sql:Joins': [
    ['sql:sql:Joins', 'The same JOIN ... ON, written for real in the SQL console.'],
    ['quiz:sec:Investigation data', 'Investigations join sources together, such as sign-in logs matched to the users table.']],

  /* ---- Cloud ---- */
  'quiz:cloud:Shared responsibility': [
    ['quiz:cloud:Misconfigurations', 'Most cloud breaches come from the customer\'s side of the line: settings the customer got wrong.']],
  'quiz:cloud:IAM & least privilege': [
    ['quiz:cloud:Leaked key response', 'Least privilege limits what a leaked key can do before you revoke it.']],
  'quiz:cloud:Audit logging': [
    ['quiz:cloud:Leaked key response', 'CloudTrail records each API call the leaked key made, which tells you what it touched and how far to investigate.']],
  'quiz:cloud:Misconfigurations': [
    ['quiz:cloud:Security groups & NACLs', 'An SSH or RDP port open to 0.0.0.0/0 is a security group misconfiguration.']],
  'quiz:cloud:Security groups & NACLs': [
    ['quiz:net:Subnetting', 'NACLs guard a subnet, and their rules are written as CIDR ranges.']],
  'quiz:cloud:Leaked key response': [
    ['quiz:sec:Incident response', 'Contain, investigate, recover: a leaked key is a small incident with the same phases.']],
  'quiz:cloud:Encryption & key management': [
    ['quiz:sec:CIA triad', 'Encryption at rest and in transit protects confidentiality, and key management keeps it working.']],

  /* ---- Offensive security ---- */
  'quiz:offsec:Scoping & authorization': [
    ['quiz:offsec:Engagement types', 'The scope document says which engagement type you are doing and what it may touch.'],
    ['quiz:sec:Governance & policy', 'Written authorization is governance: someone with authority signs off before the work starts.']],
  'quiz:offsec:Engagement types': [
    ['quiz:offsec:Findings report', 'Every engagement type ends in a report of what was found.']],
  'quiz:offsec:Injection': [
    ['sql:sql:Filtering (WHERE)', 'You need to know how a normal WHERE clause is built to see how injected input changes its meaning.']],
  'quiz:offsec:Access control failures': [
    ['quiz:sec:Authentication & MFA', 'Authentication says who you are; access control failures are when what you may do is not checked.']],
  'quiz:offsec:Password attacks & detection': [
    ['quiz:sec:Cryptography', 'Offline cracking is why passwords are stored with slow hashes like bcrypt or Argon2.']],
  'quiz:offsec:MITRE ATT&CK & kill chain': [
    ['quiz:sec:Indicators of compromise', 'Each kill chain stage leaves its own indicators, from recon scans to data leaving the network.']],
  'quiz:offsec:Findings report': [
    ['quiz:sec:Vulnerabilities', 'Findings are rated by severity, often with CVSS, the same scale CVEs use.']],

  /* ---- Terminal ---- */
  'term:linux:Reading & identifying': [
    ['term:linux:Filtering text', 'Reading a file shows all of it; filtering keeps only the lines you need.']],
  'term:linux:Files & names': [
    ['term:linux:Finding', 'Once you can make and move files, find locates them again by name, size or age.'],
    ['term:linux:Archives', 'tar bundles many files into one, the next step after cp and mv.']],
  'term:linux:Filtering text': [
    ['term:linux:Redirection', 'Filters are chained with pipes: grep | sort | uniq -c is redirection at work.']],
  'term:linux:Finding': [
    ['quiz:sec:Indicators of compromise', 'find -mtime -1 lists files changed in the last day, which is a quick check for an intruder\'s changes.']],
  'term:linux:Users, processes & privilege': [
    ['quiz:linux:Admin tools', 'ps and top show the processes this lesson runs, switches and kills.']],
  'term:linux:Networking': [
    ['quiz:net:Ports & services', 'ss -tulpn lists which ports are open and which program is on each.']],
  'term:linux:Admin': [
    ['term:linux:Users, processes & privilege', 'Most admin commands need sudo, which that lesson covers.']],
  'term:linux:Archives': [
    ['quiz:sec:Backups', 'A tar.gz of a folder is the simplest backup; the 3-2-1 rule says where its copies go.']],
  'term:linux:Encoding & hashing': [
    ['quiz:sec:CIA triad', 'A matching hash proves integrity: the file did not change.']],
  'term:linux:Redirection': [
    ['term:linux:Reading & identifying', 'Redirection sends a command\'s output into a file, and those commands read it back.']],
  'term:linux:Git': [
    ['term:linux:Files & names', 'Git tracks the files you create, move and rename; git mv is an mv that git remembers.']],
  'term:linux:Shell & environment': [
    ['quiz:sec:Secrets & untrusted code', 'Environment variables are where secrets belong, instead of in the code.'],
    ['term:linux:Redirection', 'Both are shell features: they work the same whatever program you run.']],

  /* ---- SQL console ---- */
  'sql:sql:Filtering (WHERE)': [
    ['sql:sql:Searching text (LIKE)', 'LIKE is a WHERE condition for partial matches instead of exact ones.']],
  'sql:sql:Searching text (LIKE)': [
    ['quiz:code:Regex', '% and _ are SQL\'s simpler wildcards; regex is the fuller pattern language.']],
  'sql:sql:Sorting & limiting': [
    ['sql:sql:Counting & grouping', 'Sort the counts with ORDER BY COUNT(*) DESC to find the top group.']],
  'sql:sql:Choosing columns': [
    ['sql:sql:Filtering (WHERE)', 'SELECT picks the columns; WHERE picks the rows.']],
  'sql:sql:Counting & grouping': [
    ['quiz:sec:Monitoring & alerting', 'Counting per group is how an alert rule spots a spike: failed sign-ins GROUP BY user HAVING COUNT(*) > 5.']],
  'sql:sql:Joins': [
    ['sql:sql:Choosing columns', 'With two tables joined, name each column as table.column so it is clear which one you mean.']],
  'sql:sql:Changing data (UPDATE / DELETE)': [
    ['sql:sql:Filtering (WHERE)', 'UPDATE and DELETE use the same WHERE, and without it they change every row.'],
    ['quiz:sec:Backups', 'A DELETE without WHERE is why you keep a backup you can restore from.']]
};
/* every link for a lesson, both directions, without repeats: [[otherId, why], ...] */
function lessonLinks(id){
  const out = (LESSON_LINKS[id] || []).slice();
  for(const k in LESSON_LINKS) for(const [to, why] of LESSON_LINKS[k]) if(to === id && !out.some(x=>x[0] === k)) out.push([k, why]);
  return out;
}
