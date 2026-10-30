/* Mini-lessons: Security */
Object.assign(LESSONS, {
'quiz:sec:CIA triad': {
  why: `The CIA triad is the vocabulary of security. Interviewers use it to check that you think about what is actually at risk.`,
  idea: `<ul class="clean"><li><b>Confidentiality</b>: only the right people can see the data (encryption, access control).</li><li><b>Integrity</b>: the data is accurate and unchanged (hashes, permissions, audit logs).</li><li><b>Availability</b>: systems work when needed (backups, redundancy, monitoring).</li></ul>`,
  example: `<p>A lost unencrypted laptop with patient files hurts <b>confidentiality</b>. A changed invoice amount hurts <b>integrity</b>. A POS outage during dinner hurts <b>availability</b>.</p>`,
  mistakes: [`Calling every incident a confidentiality problem.`, `Forgetting availability is security too; an outage is a security concern.`],
  say: `I look at which part of CIA is at risk; that tells me whether the fix is about access, accuracy or uptime.`
},
'quiz:sec:Authentication & MFA': {
  why: `Most account compromises start with a stolen password. MFA blocks most of them, and support techs help users set it up every day.`,
  idea: `<ul class="clean"><li><b>Authentication</b> = proving who you are. <b>Authorization</b> = what you're allowed to do.</li><li>Factor types: something you <b>know</b> (password, PIN), <b>have</b> (authenticator app, security key), <b>are</b> (fingerprint, face).</li><li>MFA = two <b>different</b> types. A password plus a PIN is still one type.</li></ul>`,
  example: `<p>Password + code from an authenticator app = know + have = real MFA. Password + security question = know + know = not MFA.</p>`,
  mistakes: [`Thinking two passwords are MFA.`, `Turning MFA off to fix a user's lockout instead of fixing the cause.`],
  say: `MFA combines two different factor types, like a password and an authenticator app, which stops most stolen-password attacks.`
},
'quiz:sec:Cryptography': {
  why: `Knowing when to hash and when to encrypt comes up in security interviews and secure-coding reviews.`,
  idea: `<ul class="clean"><li><b>Hashing</b> is one-way: used to check integrity and store passwords (SHA-256; for passwords bcrypt or Argon2). MD5 and SHA-1 are outdated.</li><li><b>Symmetric encryption</b>: one shared key, fast (AES, ChaCha20).</li><li><b>Asymmetric encryption</b>: a public/private key pair (RSA, ECC), used for key exchange and digital signatures, as in HTTPS.</li></ul>`,
  example: `<p>Storing user passwords: don't encrypt them, <b>hash</b> them with a slow, salted algorithm like bcrypt. Protecting a file you'll need to read later: <b>encrypt</b> it with AES.</p>`,
  mistakes: [`Calling Base64 "encryption." It's just encoding, anyone can reverse it.`, `Using fast hashes like plain SHA-256 for passwords.`],
  say: `Hashing is one-way for integrity and passwords, encryption is two-way for confidentiality; HTTPS uses asymmetric crypto to agree on a symmetric key.`
},
'quiz:sec:Windows logs': {
  why: `SOC analysts and sysadmins read Windows Security logs to investigate sign-in problems and suspicious activity.`,
  idea: `<ul class="clean"><li><b>4624</b> successful logon · <b>4625</b> failed logon · <b>4634</b> logoff</li><li><b>4740</b> account locked out · <b>4720</b> user created · <b>4726</b> user deleted</li><li><b>4672</b> logon with special (admin) privileges</li></ul><p>Find them in Event Viewer → Windows Logs → Security, or in a SIEM.</p>`,
  example: `<p>A user keeps getting locked out. Filter for <b>4740</b> to see when; the event shows the caller computer. Then look at <b>4625</b> failures from that machine, often an old saved password on a phone or mapped drive.</p>`,
  mistakes: [`Mixing up 4624 (success) and 4625 (failure).`, `Looking at one event alone instead of the pattern over time.`],
  say: `For lockouts I filter 4740 to find the source, then the 4625 failures from that device to find the stale credential.`
},
'quiz:sec:Vulnerabilities': {
  why: `Security teams can't patch everything at once. CVSS scores and exposure decide what gets fixed first.`,
  idea: `<ul class="clean"><li>A <b>CVE</b> is a publicly known vulnerability; <b>CVSS</b> scores its severity from 0 to 10.</li><li>Ratings: 0.1–3.9 Low · 4.0–6.9 Medium · 7.0–8.9 High · 9.0–10.0 Critical.</li><li>Real priority also depends on exposure (internet-facing?) and whether it's being actively exploited.</li></ul>`,
  example: `<p>Two findings: CVSS 9.8 on an internal test server, and CVSS 7.5 on the public website with known active exploitation. The public website likely goes first: high severity plus exposure plus active exploitation.</p>`,
  mistakes: [`Sorting purely by score and ignoring exposure.`, `Assuming "Medium" means safe to ignore.`],
  say: `I start from the CVSS rating, then adjust for exposure and active exploitation to decide what to patch first.`
},
'quiz:sec:Backups': {
  why: `Backups are the last line of defense against ransomware, mistakes and hardware failure. Untested backups are a classic hidden risk.`,
  idea: `<ul class="clean"><li><b>3-2-1 rule</b>: 3 copies of the data, on 2 different types of storage, with 1 copy offsite.</li><li>Keep one copy <b>offline or immutable</b> so ransomware can't encrypt it.</li><li><b>Test restores</b> regularly. A backup you can't restore isn't a backup.</li></ul>`,
  example: `<p>A plan with the live data plus one copy on a NAS in the same office has 2 copies, 1 location: it fails 3-2-1. Adding a cloud backup gives 3 copies, 2 storage types, 1 offsite.</p>`,
  mistakes: [`Keeping every copy in the same building.`, `Never testing a restore.`],
  say: `I follow 3-2-1 with one immutable copy, and I test restores, because a backup only counts if it comes back.`
},
'quiz:sec:Secrets & untrusted code': {
  why: `Leaked keys and scripts nobody reviewed are two of the most common ways in. SOC and support roles deal with both.`,
  idea: `<ul class="clean"><li><b>Secrets never live in the code.</b> Keep them in environment variables or a secrets manager, outside the repo.</li><li><b>Catch them before commit</b> with a pre-commit or preflight scan. Git history keeps everything.</li><li><b>Exposed? Revoke and rotate first.</b> Deleting the line doesn't help; someone may already have it.</li><li><b>Untrusted code is read, not run</b>, until it's been reviewed. Quarantine it.</li></ul>`,
  example: `<p>A developer pastes an API key into a config file and pushes it. The pre-commit scan should have stopped it; since it didn't, the key is revoked and a new one issued first, then the file is fixed and the key is moved to a secrets manager. A script downloaded from a forum is read and reviewed in a sandbox before anyone runs it.</p>`,
  mistakes: [`Deleting a leaked key from the file but never revoking it.`, `Running a downloaded script "to see what it does."`],
  say: `I keep secrets out of the repo, scan before every commit, and if one leaks I revoke and rotate it first. Code I didn't write gets read and reviewed before it ever runs.`
},
'quiz:sec:Least privilege & access control': {
  why: `Every breach review asks "why did that account have that access?" Giving just enough access, and checking it, is daily work in IT support, cloud and security roles.`,
  idea: `<ul class="clean"><li><b>Least privilege</b>: each user, service and script gets only the access its job needs, only for as long as it needs it.</li><li><b>Separation of duties</b>: split risky work so one person can't do it alone (one person adds a vendor, another approves its payments).</li><li>Access control models: <b>RBAC</b> (role-based access control) gives permissions by job role; <b>ABAC</b> (attribute-based access control) uses attributes like department, device or time; <b>DAC</b> (discretionary access control) lets the owner decide who can use a file; <b>MAC</b> (mandatory access control) uses labels set by policy that users can't change.</li><li>Review access regularly and remove it when people change roles, or access piles up ("privilege creep").</li><li><b>Accountability</b>: everyone uses their own account and actions are logged, so you can tell who did what. Shared logins break it.</li><li><b>Defense in depth</b>: layer controls (MFA, endpoint protection, firewalls, backups) so one failure isn't fatal.</li></ul>`,
  seen: `<pre>Group: Finance-Approvers   Permission: approve payments over $10,000
Members: j.lee, m.ortiz, temp.contractor7   (contract ended in March)</pre><p>An access review export: a leftover member still sits in a powerful group.</p>`,
  example: `<p>A ticket says: give the new marketing hire "the same access as Sam." Sam has been here six years and collected access to finance shares along the way. Copying Sam grants far more than the job needs. Instead, add the hire to the Marketing role group, which carries exactly what marketing needs.</p>`,
  mistakes: [`Copying another user's access ("make them like Sam").`, `Making everyone a local admin to stop the tickets.`, `Never removing access after someone changes roles.`],
  spot: {q: `A developer keeps permanent admin rights on production servers "in case of emergencies." What's the problem?`, a: `Standing admin rights break least privilege and make that account a prime target. Use just-in-time access instead: elevation that is requested, approved, time-limited and logged.`},
  say: `I grant access by role instead of copying other users, keep admin rights temporary, and review group memberships so access matches the job.`
},
'quiz:sec:Attack types': {
  why: `Recognizing an attack from its symptoms is the first skill in a SOC (security operations center) or help desk role. It tells you what to do first and who to call.`,
  idea: `<ul class="clean"><li><b>Social engineering</b> tricks people: phishing (email), smishing (text message), vishing (voice call), pretexting (a made-up story to get information).</li><li><b>Password attacks</b>: brute force (many passwords against one account), password spraying (one common password against many accounts), credential stuffing (username and password pairs leaked from another site, tried here).</li><li><b>Malware</b>: ransomware encrypts files and demands payment; a trojan pretends to be useful software.</li><li><b>Network and web</b>: a DDoS (distributed denial of service) floods a service from many machines; an on-path attacker (man-in-the-middle) intercepts traffic; SQL injection and XSS (cross-site scripting) abuse input the application didn't check.</li><li>Each has a matching defense: MFA, user training, patching, parameterized queries and output encoding, rate limiting, tested backups.</li><li><b>Telling spraying from stuffing in real logs</b>: logs rarely show the password tried. Stuffing usually hits many usernames that don't exist here, gets a few successes, and comes from many IP addresses; spraying uses real usernames, and identity providers often flag it for you.</li></ul>`,
  seen: `<pre>08:02:11 FAILED login user=alice src=203.0.113.50
08:02:12 FAILED login user=bob   src=203.0.113.50
08:02:13 FAILED login user=chen  src=203.0.113.50
08:02:14 FAILED login user=dana  src=203.0.113.50</pre><p>One source, many accounts, one try each: password spraying <i>or</i> credential stuffing. The password used (same one, or each account's own) tells them apart.</p>`,
  example: `<p>A user's account signs in from another country minutes after their password showed up in a public breach of a shopping site they reused it on. The same addresses also made single failed attempts on dozens of other accounts, each with a different password. That's credential stuffing: reset the affected passwords, make sure MFA is enforced, and block known-breached passwords.</p>`,
  mistakes: [`Looking only at one account's lockouts: spraying stays under per-account limits, so count accounts per source instead.`, `Calling a suspicious email "spam" and deleting it instead of reporting it as phishing.`, `Assuming MFA makes password attacks irrelevant. Still investigate, and watch for repeated MFA prompts the user didn't start.`],
  spot: {q: `200 failed logins hit 200 different accounts, one attempt each, all with the password "Spring2026!". The lockout policy never triggered. What is it?`, a: `Password spraying: one common password against many accounts, kept under the lockout limit. Detect it by counting distinct accounts per source, not failures per account.`},
  say: `I identify the attack from its pattern, like the same password tried across many accounts for spraying, apply the matching defense, and escalate with the evidence.`
},
'quiz:sec:Firewalls': {
  why: `Many "it can't connect" tickets end at a firewall rule, and cloud network filters use the same ideas. Reading rules correctly matters for NOC (network operations center), Linux and cloud roles.`,
  idea: `<ul class="clean"><li>A firewall allows or blocks traffic by rules: source, destination, port and protocol.</li><li>Rules are checked <b>top to bottom and the first match wins</b>. Rule sets end with a deny-all, and good practice assumes an implicit deny: anything not allowed is blocked. (Not every product defaults this way, so check.)</li><li>In the cloud: Amazon Web Services (AWS) network ACLs (access control lists) use numbered, first-match rules ending in a deny; AWS security groups are allow-only and stateful, with no rule order (anything not allowed is dropped).</li><li><b>Stateful</b> firewalls track connections, so replies to allowed traffic come back in automatically. <b>Stateless</b> firewalls (packet filters) judge each packet alone, so return traffic needs its own rule.</li><li>Put specific rules above broad ones, and open only the ports and sources a service needs.</li></ul>`,
  seen: `<pre>#  Action  Source          Port
1  allow   10.0.5.0/24     22
2  deny    any             22
3  allow   any             443
4  deny    any             any</pre><p>The admin subnet can use SSH, everyone else is blocked from it, and HTTPS is open to all.</p>`,
  example: `<p>Using the table above: a packet from 10.0.5.20 to port 22 matches rule 1 and is allowed. The same packet from 198.51.100.7 isn't in 10.0.5.0/24, so it falls to rule 2 and is denied. Swap rules 1 and 2 and the deny comes first, blocking the admins too.</p>`,
  mistakes: [`Adding a broad allow above a specific deny, so the deny never runs.`, `Opening a port to any source "just to test" and forgetting to close it.`, `Forgetting that a stateless filter needs a rule for return traffic.`],
  spot: {q: `Rule 1: allow any source to port 3389. Rule 2: deny 0.0.0.0/0 to port 3389. Is Remote Desktop blocked from the internet?`, a: `No. Rule 1 matches first and allows everyone, so rule 2 never runs. Limit rule 1 to a trusted range, or require a VPN, and keep the deny below it.`},
  say: `I read rules top to bottom with first match wins, keep specific rules above broad ones, and open only the ports and sources a service needs.`
},
'quiz:sec:Incident response': {
  why: `When something goes wrong, a calm, ordered process limits the damage. SOC (security operations center) and IT interviews often ask you to walk through it.`,
  idea: `<ol><li><b>Preparation</b>: plans, contacts, logging and tools ready before anything happens.</li><li><b>Detection</b>: noticing something is wrong (an alert, a user report).</li><li><b>Analysis</b>: confirming it's real, finding the scope, setting severity.</li><li><b>Containment</b>: stopping the spread (isolate the device, disable the account).</li><li><b>Eradication</b>: removing the cause (malware, attacker access, the weakness used).</li><li><b>Recovery</b>: restoring from clean backups and watching for a return.</li><li><b>Lessons learned</b>: what happened and what to change; update the plan.</li></ol><p class="small">These seven steps are how CompTIA Security+ splits NIST's classic four-phase lifecycle: Preparation; Detection and Analysis; Containment, Eradication and Recovery; Post-incident activity (lessons learned). NIST's latest guidance (Special Publication (SP) 800-61 Rev. 3, April 2025) arranges the same work around the NIST Cybersecurity Framework (CSF) 2.0 functions.</p>`,
  seen: `<pre>ALERT  EDR  High  laptop-HR-07  Ransomware behavior: 312 files renamed *.locked in 2 minutes</pre><p>An EDR (endpoint detection and response) alert: detection has happened, so analysis and containment come next.</p>`,
  example: `<p>For the alert above: confirm it's real and check other machines (analysis), isolate laptop-HR-07 from the network in the EDR console (containment), remove the malware and the way it got in (eradication), restore the files from a clean backup (recovery), then write up how it arrived and what would have stopped it (lessons learned).</p>`,
  mistakes: [`Wiping the machine before collecting evidence.`, `Restoring before the cause is removed, so the attacker comes straight back.`, `Skipping lessons learned, so the same incident happens again.`],
  spot: {q: `A tech finds ransomware on a laptop and immediately restores the files from backup while the laptop is still on the network. What's missing?`, a: `Containment and eradication. Isolate the laptop and remove the cause first; restoring onto an infected, connected machine just gets the files encrypted again.`},
  say: `I confirm and scope the incident, contain it first, remove the cause, recover from clean backups, then capture lessons learned so it doesn't repeat.`
},
'quiz:sec:SSH hardening': {
  why: `Every internet-facing Linux server gets password-guessing traffic on SSH within minutes of going online. Locking SSH down is one of the first jobs on any new server, and a classic interview question.`,
  idea: `<ul class="clean"><li>The usual baseline in <code>/etc/ssh/sshd_config</code>: <code>PasswordAuthentication no</code> (keys only), <code>PermitRootLogin no</code> (sign in as yourself, then use sudo), a short <code>AllowUsers</code> list, and a low <code>MaxAuthTries</code>.</li><li><b>The first value wins.</b> sshd keeps the first value it reads for each setting. On Ubuntu, <code>sshd_config</code> starts with <code>Include /etc/ssh/sshd_config.d/*.conf</code>, so those files (in name order) beat anything later in the main file. Cloud images often ship <code>50-cloud-init.conf</code> with passwords switched on.</li><li>Key files must stay private: sshd ignores <code>authorized_keys</code> if group or others can write it, its <code>~/.ssh</code> folder or the home folder. <code>~/.ssh</code> at 700 and <code>authorized_keys</code> at 600 is the safe standard.</li><li>Passwords have a second path: <code>KbdInteractiveAuthentication</code> (keyboard-interactive, often through PAM (pluggable authentication modules)) must be off too.</li><li>Change safely: check the config with <code>sshd -t</code>, keep your current session open, and test a new sign-in before logging out.</li></ul>`,
  seen: `<pre>$ grep -ri passwordauthentication /etc/ssh/sshd_config /etc/ssh/sshd_config.d/
/etc/ssh/sshd_config:PasswordAuthentication no
/etc/ssh/sshd_config.d/50-cloud-init.conf:PasswordAuthentication yes</pre><p>The main file says no, but the drop-in is read first, so passwords are still allowed.</p>`,
  example: `<p>Deploy's key sign-in stopped working, so someone switched passwords back on. The real cause: <code>authorized_keys</code> had been made writable by everyone, so sshd ignored it. The fix: back to the standard, <code>chmod 700 ~/.ssh</code> and <code>chmod 600 ~/.ssh/authorized_keys</code>, then turn passwords off in the drop-in that actually wins. Now it's secure, and deploy can still sign in.</p>`,
  mistakes: [`Editing only the main sshd_config while a drop-in that is read earlier says the opposite.`, `Turning off passwords before checking that key sign-in works, and locking everyone out.`, `Fixing a broken key sign-in by re-enabling passwords instead of fixing the file permissions.`],
  spot: {q: `An admin sets PasswordAuthentication no at the bottom of sshd_config and reloads, but password sign-ins still work. Why?`, a: `A file in sshd_config.d (included at the top) already set PasswordAuthentication yes, and sshd keeps the first value it reads. Change it in that drop-in, or add an earlier-named drop-in.`},
  say: `I harden SSH with keys only, no root login and an allow-list, I check which file's value actually wins because sshd keeps the first one, and I test a new sign-in before closing my session.`
}
});
