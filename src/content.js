
/* ===================== CONTENT ===================== */
const TRACKS = [
  {id:'linux', name:'Linux', icon:'🐧', blurb:'The command line every IT, security and DevOps job expects.'},
  {id:'net', name:'Networking', icon:'🌐', blurb:'How devices find and talk to each other. Half of all tickets live here.'},
  {id:'sec', name:'Security', icon:'🛡️', blurb:'Core ideas behind every security job, from help desk to SOC.'},
  {id:'support', name:'IT Support & M365', icon:'🖥️', blurb:'Troubleshooting, tickets, Microsoft 365, Entra ID and Intune.'},
  {id:'qa', name:'Software Testing', icon:'🧪', blurb:'How testers think: test cases, bugs, and the testing life cycle.'},
  {id:'code', name:'Code, Git & APIs', icon:'🐍', blurb:'Git, Python, APIs and tests: the tools behind your projects.'},
  {id:'sql', name:'SQL & Data', icon:'🗄️', blurb:'Asking databases questions. Healthcare billing and many IT jobs list it.'}
];
const LEVELS = [
  {n:1, name:'Foundations', desc:'The words and basics every interviewer assumes you know.'},
  {n:2, name:'Junior / Job-ready', desc:'What you would actually do in your first weeks on the job: real tickets, logs, SQL and scripting.'},
  {n:3, name:'Mid-level', desc:'Owning systems: automation, incident response, test frameworks. Coming in Phase 3.'},
  {n:4, name:'Senior', desc:'Design, risk, threat modeling, mentoring, postmortems. Coming in Phase 3.'}
];

/* Flashcards: [track, level, front, back] */
const CARDS = [
 ['linux',1,'<code>pwd</code>','Print working directory: shows the full path of the folder you are in.'],
 ['linux',1,'<code>ls -la</code>','List <b>all</b> files (including hidden ones that start with a dot) in <b>long</b> format: permissions, owner, size, date.'],
 ['linux',1,'<code>cd ..</code> and <code>cd ~</code>','<code>..</code> goes up one folder. <code>~</code> is your home folder. <code>cd</code> by itself also goes home.'],
 ['linux',1,'<code>cat</code>, <code>less</code>, <code>head</code>, <code>tail</code>','cat prints a whole file. less pages through it. head / tail show the first / last 10 lines. <code>tail -f</code> follows a log as it grows.'],
 ['linux',1,'<code>grep -i "error" app.log</code>','Show lines in app.log containing "error", ignoring upper/lower case. Add <code>-r</code> to search whole folders.'],
 ['linux',1,'The pipe <code>|</code>','Sends one command\'s output into the next: <code>ps aux | grep python</code> lists processes, then keeps only lines with "python".'],
 ['linux',1,'<code>&gt;</code> vs <code>&gt;&gt;</code>','<code>&gt;</code> writes output to a file and <b>overwrites</b> it. <code>&gt;&gt;</code> <b>appends</b> to the end.'],
 ['linux',1,'Permissions <code>rwxr-xr--</code>','Owner: read, write, execute. Group: read, execute. Others: read only. As a number: 754 (r=4, w=2, x=1, add them up).'],
 ['linux',1,'<code>sudo</code>','Run a single command as root (the admin account). On Ubuntu, sudo use is logged in <code>/var/log/auth.log</code>.'],
 ['linux',1,'<code>chmod +x script.sh</code>','Make a script executable. Then run it with <code>./script.sh</code>.'],
 ['linux',1,'<code>ps aux</code>, <code>top</code>, <code>kill</code>','ps aux lists running processes. top shows them live. <code>kill 1234</code> stops process ID 1234.'],
 ['linux',1,'<code>/etc</code>, <code>/var/log</code>, <code>/home</code>','/etc holds configuration files. /var/log holds logs. /home holds each user\'s personal folder.'],

 ['net',1,'IP address','A logical address for a device on a network, like <code>192.168.1.20</code>. Routers use it to deliver traffic.'],
 ['net',1,'MAC address','A hardware address on a network card, like <code>3C:52:82:1A:2B:4D</code>. Switches use it inside a local network.'],
 ['net',1,'DNS (port 53)','Turns names (<code>google.com</code>) into IP addresses. "It\'s always DNS" is a real help-desk saying.'],
 ['net',1,'DHCP','Automatically gives a device its IP address, subnet mask, default gateway and DNS server.'],
 ['net',1,'Default gateway','The router a device sends traffic to when the destination is outside its own network.'],
 ['net',1,'Subnet mask /24','Same as 255.255.255.0. The first three numbers are the network. Gives 254 usable host addresses.'],
 ['net',1,'Private IP ranges','10.0.0.0/8, 172.16.0.0/12 (172.16 to 172.31), 192.168.0.0/16. Not used on the public internet; NAT translates them.'],
 ['net',1,'TCP vs UDP','TCP: sets up a connection, guarantees delivery and order (web, email). UDP: no handshake, faster, no guarantee (DNS lookups, video calls, games).'],
 ['net',1,'Common ports','22 SSH, 25 SMTP, 53 DNS, 80 HTTP, 443 HTTPS, 3389 RDP.'],
 ['net',1,'OSI model','7 Application, 6 Presentation, 5 Session, 4 Transport, 3 Network, 2 Data Link, 1 Physical. Top to bottom: "All People Seem To Need Data Processing."'],
 ['net',1,'169.254.x.x address','APIPA: the device could not reach a DHCP server, so it gave itself an address. Check the cable, Wi-Fi, or DHCP server.'],
 ['net',1,'Windows network commands','<code>ipconfig /all</code>, <code>ping</code>, <code>tracert</code>, <code>nslookup</code>, <code>ipconfig /flushdns</code>, <code>ipconfig /release</code> then <code>/renew</code>.'],

 ['sec',1,'CIA triad','<b>C</b>onfidentiality: only the right people see it. <b>I</b>ntegrity: it is not changed without permission. <b>A</b>vailability: it works when needed.'],
 ['sec',1,'Authentication vs authorization','Authentication = proving who you are (logging in). Authorization = what you are allowed to do once you are in.'],
 ['sec',1,'MFA factors','Something you <b>know</b> (password), <b>have</b> (phone, security key), <b>are</b> (fingerprint). Two of the same type is not MFA.'],
 ['sec',1,'Least privilege','Give people and programs only the access they need to do their job, nothing more.'],
 ['sec',1,'Hashing vs encryption','Hashing is one-way: used to store passwords and check files (SHA-256, bcrypt). Encryption is two-way with a key (AES, RSA).'],
 ['sec',1,'Symmetric vs asymmetric','Symmetric: one shared key, fast (AES). Asymmetric: a public/private key pair (RSA, ECC), used to swap keys safely and to sign things.'],
 ['sec',1,'Phishing','Fake messages that trick people into clicking a link, opening an attachment or typing their password. The most common way attackers get in.'],
 ['sec',1,'Vulnerability, threat, risk','Vulnerability: a weakness. Threat: something that could use that weakness. Risk: how likely that is times how bad it would be.'],
 ['sec',1,'Malware types','Virus (attaches to files), worm (spreads by itself), trojan (pretends to be legit), ransomware (encrypts files, demands payment), spyware.'],
 ['sec',1,'Firewall','Allows or blocks network traffic based on rules: IP address, port, protocol or application.'],
 ['sec',1,'SQL injection','Attacker types SQL code into an input to read or change the database. Prevented with parameterized queries (prepared statements).'],
 ['sec',1,'XSS and CSRF (on your resume)','XSS: an attacker\'s script runs in another user\'s browser. CSRF: tricks a logged-in user\'s browser into sending a request they did not mean to; blocked with CSRF tokens and SameSite cookies.'],
 ['sec',1,'SIEM','Security Information and Event Management: collects logs from everywhere and raises alerts (Splunk, Microsoft Sentinel). SOC analysts work in it all day.'],

 ['support',1,'Troubleshooting steps (CompTIA)','1 Identify the problem. 2 Theory of probable cause. 3 Test the theory. 4 Plan of action. 5 Implement or escalate. 6 Verify it works and prevent repeats. 7 Document.'],
 ['support',1,'First questions on any ticket','What exactly happens? Any error message? When did it start? What changed? Is anyone else affected?'],
 ['support',1,'Printer will not print','Check power, paper and error lights. Right printer selected? Clear the print queue, restart the <b>Print Spooler</b> service, check its network/IP, reinstall the driver.'],
 ['support',1,'Entra ID','Microsoft\'s cloud identity service (formerly Azure Active Directory): user accounts, groups, MFA, sign-in logs.'],
 ['support',1,'Intune','Microsoft\'s device management: enroll laptops and phones, push apps and settings, wipe a lost device.'],
 ['support',1,'Microsoft 365 admin center','Where you create users, reset passwords, assign licenses and set up shared mailboxes.'],
 ['support',1,'Account lockout','Too many bad sign-ins. Check sign-in logs, unlock, reset if needed. Common cause: an old password saved on a phone that keeps retrying.'],
 ['support',1,'Escalation tiers','Tier 1: first contact, common fixes. Tier 2: deeper technical problems. Tier 3: engineers or vendors. Always escalate with notes on what you already tried.'],
 ['support',1,'Handy Windows tools','Task Manager (<code>Ctrl+Shift+Esc</code>), Event Viewer, Services, Device Manager, <code>gpupdate /force</code>, <code>sfc /scannow</code>.'],
 ['support',1,'New hire onboarding','Create the account, assign license and groups, set up MFA, prepare and enroll the device, grant mailbox/Teams access, send login details securely, document it.'],
 ['support',1,'Ticket priority','Impact (how many people) plus urgency (how fast it hurts the business). A POS down during dinner service beats a slow laptop.'],
 ['support',1,'Good ticket notes','Who, what, when, error messages, steps tried, result, next step. The next tech should be able to continue without calling the user.'],

 ['qa',1,'STLC (Software Testing Life Cycle)','Requirement analysis, test planning, test case design, environment setup, test execution, test closure.'],
 ['qa',1,'Parts of a test case','ID, title, preconditions, test data, steps, expected result, actual result, pass/fail.'],
 ['qa',1,'A good bug report','Clear title, steps to reproduce, expected vs actual result, environment (browser, OS, version), severity, screenshots or logs.'],
 ['qa',1,'Severity vs priority','Severity: how badly it breaks things. Priority: how soon it must be fixed. A typo in the company logo is low severity, high priority.'],
 ['qa',1,'Smoke vs regression','Smoke: a quick check that the main features work on a new build. Regression: re-test existing features to be sure a change did not break them.'],
 ['qa',1,'Boundary value analysis','Test the edges. If age must be 18 to 65, test 17, 18, 65 and 66.'],
 ['qa',1,'Equivalence partitioning','Group inputs that should behave the same and test one from each group: valid, too low, too high.'],
 ['qa',1,'Positive vs negative testing','Positive: valid input works. Negative: bad input is handled gracefully, with a clear error and no crash.'],
 ['qa',1,'Defect life cycle','New, Assigned, Open, Fixed, Retest, then Verified/Closed, or Reopened if it still fails.'],
 ['qa',1,'Black box vs white box','Black box: test behavior without seeing the code. White box: test using knowledge of the code (paths, branches).'],
 ['qa',1,'Mocking (MSW on your resume)','Faking a dependency, such as an API, so tests are fast and repeatable. MSW (Mock Service Worker) intercepts network requests during tests.'],
 ['qa',1,'Verification vs validation','Verification: are we building it right (matches the spec)? Validation: are we building the right thing (meets user needs)?'],

 ['code',1,'Git everyday commands','<code>git status</code>, <code>git add .</code>, <code>git commit -m "message"</code>, <code>git push</code>, <code>git pull</code>.'],
 ['code',1,'Branch','A separate line of work. <code>git switch -c fix/login</code> creates one and moves to it, keeping main stable.'],
 ['code',1,'Pull request','A request to merge your branch into main. Teammates review the changes and comment before it is merged.'],
 ['code',1,'Merge conflict','Two changes touched the same lines. Edit the file to keep the right version, remove the conflict markers, then add and commit.'],
 ['code',1,'API','A defined way for programs to talk to each other. A web API takes HTTP requests and returns data, usually JSON.'],
 ['code',1,'HTTP methods','GET reads, POST creates, PUT/PATCH update, DELETE removes.'],
 ['code',1,'HTTP status codes','200 OK, 201 Created, 400 Bad Request, 401 not logged in, 403 logged in but not allowed, 404 Not Found, 500 server error.'],
 ['code',1,'JSON','A text format for data: <code>{"name": "Alei", "skills": ["Python", "Linux"]}</code>.'],
 ['code',1,'Python building blocks','List <code>[1, 2, 3]</code>, dict <code>{"key": "value"}</code>, loop <code>for x in items:</code>, function <code>def add(a, b): return a + b</code>.'],
 ['code',1,'Virtual environment','<code>python -m venv .venv</code> keeps each project\'s packages separate. Install them with <code>pip install -r requirements.txt</code>.'],
 ['code',1,'Docker image vs container','Image: the packaged blueprint. Container: a running copy of that image.'],
 ['code',1,'Unit test','Tests one small piece of code on its own. Python uses pytest, JavaScript uses Vitest or Jest: <code>assert add(2, 3) == 5</code>.'],
 ['code',1,'Backtesting (your bot)','Running a strategy on past data to see how it would have done. Watch for look-ahead bias (using future data) and overfitting.'],

 /* ---- Phase 2: SQL Level 1 ---- */
 ['sql',1,'<code>SELECT</code> and <code>FROM</code>','Choose columns from a table: <code>SELECT name, department FROM users;</code> <code>*</code> means all columns.'],
 ['sql',1,'<code>WHERE</code>','Filters rows: <code>WHERE status = \'open\'</code>. Text goes in single quotes. Combine conditions with AND / OR.'],
 ['sql',1,'<code>ORDER BY</code> and <code>LIMIT</code>','Sorts results: <code>ORDER BY created_at DESC</code> puts newest first. <code>LIMIT 5</code> returns only 5 rows (SQL Server uses <code>TOP 5</code>).'],
 ['sql',1,'Aggregate functions','<code>COUNT(*)</code>, <code>SUM()</code>, <code>AVG()</code>, <code>MIN()</code>, <code>MAX()</code> turn many rows into one number.'],
 ['sql',1,'<code>GROUP BY</code>','One result row per group: <code>SELECT status, COUNT(*) FROM tickets GROUP BY status;</code> counts tickets per status.'],
 ['sql',1,'<code>LIKE</code> wildcards','<code>%</code> = any number of characters, <code>_</code> = exactly one. <code>WHERE title LIKE \'%printer%\'</code> finds "printer" anywhere in the title.'],
 ['sql',1,'<code>NULL</code>','Means "no value." Test it with <code>IS NULL</code> or <code>IS NOT NULL</code>, never <code>= NULL</code>.'],
 ['sql',1,'<code>DISTINCT</code>','Removes duplicate rows: <code>SELECT DISTINCT location FROM users;</code>'],
 ['sql',1,'Primary key','A column that uniquely identifies each row, like <code>id</code>. It is never empty and never repeats.'],
 ['sql',1,'Foreign key','A column that points to another table\'s primary key, like <code>tickets.assigned_to</code> pointing to <code>users.id</code>.'],

 /* ---- Phase 2: Level 2 (job-ready) ---- */
 ['linux',2,'<code>systemctl</code>','Controls services: <code>systemctl status nginx</code>, <code>restart</code>, <code>stop</code>, <code>start</code>. <code>enable</code> makes it start at boot.'],
 ['linux',2,'<code>journalctl -u nginx</code>','Shows the systemd log for one service. Add <code>--since "1 hour ago"</code> or <code>-f</code> to follow live.'],
 ['linux',2,'<code>df -h</code> vs <code>du -sh</code>','df shows free space per filesystem. du shows how much space folders use: <code>du -sh /var/* | sort -h</code> lists the biggest last.'],
 ['linux',2,'<code>chown user:group file</code>','Changes who owns a file. <code>-R</code> applies it to a whole folder.'],
 ['linux',2,'SSH keys','<code>ssh-keygen</code> makes a key pair. The public key goes on the server (<code>ssh-copy-id</code>). The private key never leaves your machine.'],
 ['linux',2,'Package managers','Debian/Ubuntu: <code>sudo apt update &amp;&amp; sudo apt upgrade</code>. Red Hat/Rocky: <code>sudo dnf update</code>. This is how servers get patched.'],
 ['linux',2,'cron','Scheduled jobs. Edit with <code>crontab -e</code>. Fields: minute hour day month weekday. <code>0 2 * * * /opt/backup.sh</code> runs at 2:00 AM daily.'],
 ['linux',2,'<code>ss -tulpn</code>','Lists listening ports and which program owns them (the modern replacement for netstat).'],
 ['linux',2,'Login logs','Ubuntu: <code>/var/log/auth.log</code>. Red Hat: <code>/var/log/secure</code>. <code>grep "Failed password"</code> finds SSH guessing attempts.'],
 ['linux',2,'Bash script basics','Start with <code>#!/bin/bash</code>. Variables: <code>NAME=web1</code>, use <code>$NAME</code>. <code>if [ -f file ]; then ... fi</code>. Exit code <code>$?</code>: 0 = success.'],
 ['linux',2,'<code>tar</code>','<code>tar -czf logs.tar.gz logs/</code> compresses a folder. <code>tar -xzf logs.tar.gz</code> extracts it.'],
 ['linux',2,'Deleting an open log file','If a program still has the file open, <code>rm</code> does not free the space until the program restarts. Use <code>truncate -s 0 file</code> instead, then set up logrotate.'],

 ['net',2,'Subnet /26','255.255.255.192: 64 addresses, 62 usable. Blocks start at .0, .64, .128, .192.'],
 ['net',2,'VLAN','Splits one physical switch into separate logical networks, such as POS, office, and guest Wi-Fi. Traffic between them must pass through a router or firewall.'],
 ['net',2,'NAT / PAT','Lets many private IPs share one public IP. The router tracks each connection by port.'],
 ['net',2,'ARP','Finds the MAC address that belongs to an IP on the local network. See the table with <code>arp -a</code>.'],
 ['net',2,'<code>tracert</code> / <code>traceroute</code>','Shows every router hop on the way to a destination, so you can see where delay or failure starts.'],
 ['net',2,'DNS record types','A: name to IPv4. AAAA: name to IPv6. CNAME: alias. MX: mail server. TXT: SPF/DKIM/verification. PTR: IP back to name.'],
 ['net',2,'DHCP "DORA"','Discover, Offer, Request, Acknowledge: the four steps a device uses to get an address.'],
 ['net',2,'Wi-Fi bands','2.4 GHz: longer range, more interference. 5 GHz: faster, shorter range. 6 GHz: Wi-Fi 6E. Use WPA2 or WPA3 security.'],
 ['net',2,'VPN','An encrypted tunnel to the company network over the internet. Full tunnel sends all traffic through the company; split tunnel sends only company traffic.'],
 ['net',2,'Latency, jitter, packet loss','Latency: delay. Jitter: how much the delay varies (ruins calls). Packet loss: data that never arrives.'],
 ['net',2,'SNMP and monitoring','Network devices report their status with SNMP (UDP 161/162). NOC tools poll devices and alert when one goes down.'],
 ['net',2,'Load balancer','Spreads traffic across several servers and stops sending to any server that fails its health check.'],

 ['sec',2,'Windows logon event IDs','4624 successful logon. 4625 failed logon. 4740 account locked out. 4720 user created. 4672 logon with admin privileges.'],
 ['sec',2,'Brute force vs password spraying','Brute force: many passwords against one account. Spraying: one common password against many accounts, to avoid lockouts.'],
 ['sec',2,'Indicators of compromise (IOCs)','Evidence of an attack: bad IPs or domains, malicious file hashes, strange processes, new mailbox forwarding rules.'],
 ['sec',2,'Incident response phases (NIST)','Preparation. Detection and Analysis. Containment, Eradication and Recovery. Post-incident activity (lessons learned).'],
 ['sec',2,'Reading email headers','Compare From with Return-Path and Reply-To, check the SPF/DKIM/DMARC results, and find the real sending server.'],
 ['sec',2,'SPF, DKIM, DMARC','SPF: which servers may send for a domain. DKIM: a digital signature on the email. DMARC: what to do when those fail, plus reports.'],
 ['sec',2,'Alert triage','Is it real (true or false positive)? Which user or device? How severe? Any related alerts? Then escalate, or close with notes.'],
 ['sec',2,'Vulnerabilities and CVSS','Scanners (Nessus, Qualys) find known CVEs. CVSS scores severity from 0 to 10. Patch by risk: high score plus exposed to the internet goes first.'],
 ['sec',2,'Defense in depth','Several layers so one failure is not fatal: MFA, EDR, firewall, email filtering, backups, training.'],
 ['sec',2,'EDR','Endpoint Detection and Response (Microsoft Defender for Endpoint, CrowdStrike): watches device behavior and can isolate an infected machine.'],
 ['sec',2,'3-2-1 backups','3 copies of data, on 2 types of storage, 1 offsite. Keep one offline or immutable so ransomware cannot encrypt it.'],
 ['sec',2,'Checking a suspicious file','Get its SHA-256 hash and look it up on VirusTotal, without running the file.'],

 ['support',2,'ITIL basics','Incident: something broke, restore it fast. Service request: a standard ask, like a new laptop. Problem: the root cause behind repeat incidents. Change: a planned, approved modification.'],
 ['support',2,'SLA','The promised response and fix time for each priority, e.g. P1 response within 15 minutes. Watch ticket age.'],
 ['support',2,'Group Policy vs Intune','Group Policy pushes settings to domain-joined PCs. Intune does the same for cloud-managed devices. <code>gpresult /r</code> shows which policies applied.'],
 ['support',2,'Conditional Access (Entra)','Rules that decide sign-ins: require MFA, block risky locations, require a compliant device.'],
 ['support',2,'Shared mailbox','One mailbox several people use, like orders@. Usually no license needed (under 50 GB). Grant Full Access and Send As.'],
 ['support',2,'OneDrive not syncing','Check the user is signed in, storage is not full, and file names or paths are not too long or invalid. Pause and resume, then reset OneDrive if needed.'],
 ['support',2,'Outlook troubleshooting','Try Outlook on the web first: if it works there, the problem is the desktop app. Then safe mode (<code>outlook.exe /safe</code>), a new profile, or an Office repair.'],
 ['support',2,'Remote support etiquette','Ask before taking control, explain what you are doing, and never ask for the user\'s password.'],
 ['support',2,'Windows Autopilot','Sets up a new laptop from the cloud: the user signs in, then Intune installs apps and policies automatically.'],
 ['support',2,'BitLocker','Full-disk encryption. If a PC asks for the recovery key, find it in the device record in Entra ID or Intune.'],
 ['support',2,'Asset inventory','Track serial number, user, location, purchase and warranty dates. Update it at every onboarding and offboarding.'],
 ['support',2,'Offboarding order','Block sign-in and revoke sessions first. Then handle the mailbox (convert to shared or forward), transfer OneDrive files, remove licenses, collect and wipe the device, document.'],

 ['qa',2,'Test plan','Scope (in and out), approach, environments, entry and exit criteria, schedule, roles, risks, deliverables.'],
 ['qa',2,'Entry and exit criteria','Entry: when testing can start (build deployed, smoke test passed). Exit: when it is done (planned tests run, no open critical bugs).'],
 ['qa',2,'Traceability matrix','A table linking each requirement to its test cases, so nothing goes untested.'],
 ['qa',2,'API testing','Send requests with Postman or curl and check the status code, response body, headers, error handling and authentication.'],
 ['qa',2,'Test data','Use realistic but fake or anonymized data. Never use real patient or customer data. Healthcare data is protected by HIPAA.'],
 ['qa',2,'Exploratory testing','Learning, designing and running tests at the same time, time-boxed with a goal (a "charter").'],
 ['qa',2,'Test automation pyramid','Many fast unit tests, fewer integration/API tests, and only a few slow end-to-end UI tests.'],
 ['qa',2,'Flaky test','Passes and fails with no code change, usually from timing or shared data. Fix it or quarantine it; never just ignore it.'],
 ['qa',2,'Defect triage','The team reviews new bugs together: confirm each one, set severity and priority, then assign it or defer it.'],
 ['qa',2,'Choosing regression tests','After a change, run tests for the changed area, risky shared areas, and the smoke suite.'],
 ['qa',2,'Root cause analysis','Keep asking "why?" until you reach the real cause (the 5 Whys). Note it in the bug.'],
 ['qa',2,'Healthcare billing words (Healthcare billing)','Claim: a bill sent to insurance. Denial: insurer refuses to pay. EDI 837: the claim file. EDI 835: the payment/remittance file.'],

 ['code',2,'Reading a file in Python','<code>with open("app.log") as f:</code> then <code>for line in f:</code>. The file closes automatically, even on errors.'],
 ['code',2,'try / except','Handles errors instead of crashing: <code>try: ... except FileNotFoundError: ...</code>'],
 ['code',2,'Calling an API in Python','<code>r = requests.get(url, timeout=10)</code>, <code>r.raise_for_status()</code>, <code>data = r.json()</code>.'],
 ['code',2,'PowerShell basics','<code>Get-Service</code>, <code>Get-Process</code>, and piping objects: <code>Get-Service | Where-Object Status -eq \'Stopped\'</code>.'],
 ['code',2,'Secrets','Keep API keys in environment variables or a <code>.env</code> file listed in <code>.gitignore</code>. Never put them in code or Git.'],
 ['code',2,'Merge vs rebase','Merge joins branches with a merge commit. Rebase replays your commits on top for a straight history. Do not rebase branches others are using.'],
 ['code',2,'Undoing in Git','<code>git log --oneline</code> shows history. <code>git diff</code> shows changes. <code>git revert &lt;commit&gt;</code> safely undoes a commit that is already pushed.'],
 ['code',2,'CI/CD','CI runs the tests on every push or pull request. CD deploys automatically when they pass (for example, GitHub Actions).'],
 ['code',2,'API authentication','API keys, or Bearer tokens (OAuth, JWT) sent in the <code>Authorization</code> header.'],
 ['code',2,'Regular expressions','Text patterns: <code>\\d+</code> one or more digits, <code>^</code> start of line, <code>$</code> end of line. Used in grep and Python\'s <code>re</code>.'],
 ['code',2,'Logging vs print','Logging adds levels (DEBUG, INFO, WARNING, ERROR) and timestamps. Real applications log; they do not print.'],
 ['code',2,'Code review checklist','Is it correct? Is it tested? Is it readable? Is it secure (input checked, no secrets)?'],

 ['sql',2,'<code>INNER JOIN</code>','Combines two tables, keeping only rows that match in both: <code>FROM tickets JOIN users ON tickets.assigned_to = users.id</code>.'],
 ['sql',2,'<code>LEFT JOIN</code>','Keeps every row from the left table, even with no match (missing values become NULL). Good for "including unassigned tickets."'],
 ['sql',2,'<code>WHERE</code> vs <code>HAVING</code>','WHERE filters rows before grouping. HAVING filters groups after: <code>HAVING COUNT(*) &gt; 1</code>.'],
 ['sql',2,'<code>UPDATE</code> and <code>DELETE</code>','Always include WHERE. Run the same WHERE as a SELECT first to see exactly which rows you will change.'],
 ['sql',2,'Transactions','<code>BEGIN;</code> ... <code>COMMIT;</code> saves all changes together. <code>ROLLBACK;</code> undoes them. All or nothing.'],
 ['sql',2,'Index','Speeds up searches on a column, like a book index. Costs a little extra storage and slower writes.'],
 ['sql',2,'Subquery','A query inside a query: <code>WHERE assigned_to IN (SELECT id FROM users WHERE location = \'Katy\')</code>.'],
 ['sql',2,'<code>CASE</code>','If/else inside SQL: <code>CASE WHEN priority = \'high\' THEN 1 ELSE 2 END</code>.'],
 ['sql',2,'Finding duplicates','<code>SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*) &gt; 1;</code>'],
 ['sql',2,'Parameterized queries','The app sends the SQL and the values separately, so user input can never become code. This is the defense against SQL injection.']
];

/* Quiz: [track, level, question, options, correctIndex, explanation] */
const QUIZ = [
 ['linux',1,'Which command shows the folder you are currently in?',['pwd','ls','cd','whoami'],0,'<code>pwd</code> = print working directory. <code>whoami</code> shows your username, not your location.'],
 ['linux',1,'Hidden files on Linux are files whose names...',['start with a dot','end in .hidden','live in /hidden','are owned by root'],0,'Any file starting with a dot, like <code>.bashrc</code>, is hidden. Use <code>ls -a</code> to see them.'],
 ['linux',1,'What does <code>chmod 644 report.txt</code> do?',['Owner can read and write; group and others can only read','Everyone can read and write','Only the owner can do anything','Makes the file executable'],0,'6 = 4+2 (read+write) for the owner; 4 = read for group and others.'],
 ['linux',1,'You run <code>echo hi &gt; notes.txt</code> twice. What is in notes.txt?',['hi (once)','hi (twice)','Nothing','An error'],0,'<code>&gt;</code> overwrites the file each time. <code>&gt;&gt;</code> would append and give two lines.'],
 ['linux',1,'Best way to watch a log file as new lines arrive?',['tail -f app.log','cat -f app.log','head -f app.log','less -x app.log'],0,'<code>tail -f</code> keeps the file open and prints new lines live. Press Ctrl+C to stop.'],
 ['linux',1,'What does <code>ps aux | grep nginx</code> do?',['Lists processes, keeping only lines that mention nginx','Installs nginx','Stops nginx','Searches every file for nginx'],0,'The pipe sends ps output into grep, which filters it.'],
 ['linux',1,'Where are most system logs kept?',['/var/log','/etc','/usr/bin','/tmp'],0,'/var/log holds logs such as syslog and auth.log. /etc holds configuration.'],
 ['linux',1,'Which file lists user accounts but not their password hashes?',['/etc/passwd','/etc/shadow','/etc/hosts','/var/users'],0,'Password hashes live in /etc/shadow, which only root can read.'],
 ['linux',1,'Why is <code>rm -rf</code> dangerous?',['It deletes files and folders recursively without asking','It renames everything','It reformats the disk','It logs you out'],0,'-r = recursive, -f = force. There is no recycle bin. Double-check the path first.'],
 ['linux',1,'<code>sudo</code> lets you...',['Run one command with root privileges','Open the graphical desktop','Update only the kernel','Create a new user automatically'],0,'sudo = "superuser do". It asks for your own password and is logged.'],

 ['net',1,'Which protocol turns a website name into an IP address?',['DNS','DHCP','ARP','FTP'],0,'DNS resolves names to IPs. DHCP hands out IP addresses. ARP maps IPs to MAC addresses.'],
 ['net',1,'A laptop shows IP <code>169.254.10.4</code>. Most likely cause?',['It could not get an address from DHCP','DNS is down','The website is blocked','It has a static IP'],0,'169.254.x.x is APIPA, a self-assigned address when no DHCP server answers.'],
 ['net',1,'HTTPS uses which port by default?',['443','80','22','3389'],0,'80 is plain HTTP, 22 is SSH, 3389 is Remote Desktop.'],
 ['net',1,'Which one is a private IP address?',['172.20.5.9','8.8.8.8','54.12.3.1','1.1.1.1'],0,'172.16.0.0 to 172.31.255.255 is private. 8.8.8.8 and 1.1.1.1 are public DNS servers.'],
 ['net',1,'The TCP three-way handshake is:',['SYN, SYN-ACK, ACK','ACK, SYN, FIN','HELLO, ACK, DONE','GET, POST, PUT'],0,'The client sends SYN, the server answers SYN-ACK, the client confirms with ACK.'],
 ['net',1,'How many usable host addresses are in a /24 network?',['254','256','255','24'],0,'256 total, minus the network address and the broadcast address.'],
 ['net',1,'Which device forwards traffic between different networks using IP addresses?',['Router','Switch','Hub','Patch panel'],0,'Routers work at Layer 3 (IP). Switches work at Layer 2 (MAC addresses).'],
 ['net',1,'<code>ping</code> uses which protocol?',['ICMP','TCP','UDP','HTTP'],0,'ping sends ICMP echo requests. Some firewalls block ICMP, so no reply does not always mean the host is down.'],
 ['net',1,'Which OSI layer handles IP addresses and routing?',['Layer 3, Network','Layer 2, Data Link','Layer 4, Transport','Layer 7, Application'],0,'Layer 3 = IP and routing. Layer 4 = TCP/UDP and ports.'],
 ['net',1,'A user can ping 8.8.8.8 but cannot open google.com. What is most likely broken?',['DNS','The network cable','The router\'s power','The keyboard'],0,'Reaching an IP proves the connection works, so name resolution (DNS) is the suspect. Try <code>nslookup google.com</code>.'],

 ['sec',1,'An attacker changes the amount on an invoice while it is being sent. Which part of CIA is hurt?',['Integrity','Confidentiality','Availability','Authentication'],0,'Integrity means data is not changed without permission.'],
 ['sec',1,'Password plus a code from an authenticator app counts as MFA because it is...',['Something you know plus something you have','Two passwords','Two things you are','Sent over the internet'],0,'Two different factor types. Two passwords would be the same type.'],
 ['sec',1,'Best way to store user passwords?',['A slow salted hash such as bcrypt or Argon2','AES encryption with the key on the same server','Plain text in a locked database','Base64 encoding'],0,'Hashing is one-way, and slow hashes resist cracking. Base64 is just encoding, not security.'],
 ['sec',1,'"Your mailbox is full, log in here to keep your email" with an odd link is most likely:',['Phishing','A worm','A DDoS attack','A normal IT notice'],0,'Urgency plus a login link is the classic phishing pattern. Report it; do not click.'],
 ['sec',1,'Giving a new help-desk hire full domain admin "just in case" breaks which principle?',['Least privilege','Defense in depth','Non-repudiation','Availability'],0,'Only give the access needed for the job.'],
 ['sec',1,'Ransomware mainly attacks:',['Availability, and often confidentiality too','Nothing, it is harmless','Only Linux servers','Only integrity'],0,'It locks you out of your data (availability). Many gangs also steal the data first and threaten to leak it.'],
 ['sec',1,'What best prevents SQL injection?',['Parameterized queries (prepared statements)','Hiding error messages','Using HTTPS','Longer passwords'],0,'Parameterized queries treat input as data, never as code.'],
 ['sec',1,'Authentication answers which question?',['Who are you?','What are you allowed to do?','When did you log in?','Where is the server?'],0,'Authorization answers "what can you do?"'],
 ['sec',1,'A SIEM is used to:',['Collect and correlate logs to detect threats','Encrypt hard drives','Replace firewalls','Write code'],0,'Examples: Splunk, Microsoft Sentinel. Entry-level SOC jobs triage SIEM alerts.'],
 ['sec',1,'Which one is asymmetric encryption?',['RSA','AES','SHA-256','MD5'],0,'AES is symmetric. SHA-256 and MD5 are hashes, not encryption.'],

 ['support',1,'What is the FIRST step of the troubleshooting method?',['Identify the problem','Reboot the computer','Escalate','Reinstall Windows'],0,'Ask questions and reproduce the issue first. Rebooting first can erase clues.'],
 ['support',1,'A user keeps getting locked out right after a password change. A common hidden cause?',['Their phone still has the old password saved and keeps retrying','The monitor is off','DNS','A printer driver'],0,'Phones, mapped drives and saved sessions keep trying the old password and trigger lockouts.'],
 ['support',1,'Where do you assign a Microsoft 365 license to a new hire?',['Microsoft 365 admin center (or Entra)','Control Panel','Task Manager','Outlook settings'],0,'Licenses are assigned on the user in the admin center or through group-based licensing in Entra.'],
 ['support',1,'Intune is used to:',['Manage and secure devices','Filter email','Bill customers','Write scripts'],0,'Enroll devices, push apps and policies, and remotely wipe lost devices.'],
 ['support',1,'Documents are stuck in the print queue. Which Windows service do you restart?',['Print Spooler','DHCP Client','Windows Update','DNS Client'],0,'Restarting the Print Spooler clears most stuck jobs.'],
 ['support',1,'Which ticket gets worked first?',['A restaurant\'s POS is down during dinner service','A user wants a new wallpaper','A request for a second monitor','A password that expires next week'],0,'High impact plus high urgency: the business is losing money right now.'],
 ['support',1,'Entra ID used to be called:',['Azure Active Directory','Exchange Online','Intune','Windows Server'],0,'Microsoft renamed Azure AD to Microsoft Entra ID in 2023.'],
 ['support',1,'You fixed the issue. Before closing the ticket you should:',['Confirm with the user that it works, then document the fix','Delete your notes','Escalate it anyway','Reboot again'],0,'Verify and document are steps 6 and 7 of the method.'],
 ['support',1,'Keyboard shortcut that opens Task Manager directly:',['Ctrl+Shift+Esc','Ctrl+Alt+T','Win+R','Alt+F4'],0,'Ctrl+Alt+Del also gets you there, with one extra click.'],
 ['support',1,'When should Tier 1 escalate?',['When it is beyond their access, skill or policy, with notes on what they tried','Never','On every ticket','Only at the end of the day'],0,'Good escalations save the next tech from repeating your steps.'],

 ['qa',1,'A field accepts 1 to 100. The best boundary values to test are:',['0, 1, 100, 101','Only 50','1 and 100','-1000 and 1000'],0,'Test just inside and just outside each edge.'],
 ['qa',1,'The company logo is misspelled on the homepage. Severity and priority?',['Low severity, high priority','High severity, high priority','High severity, low priority','Low severity, low priority'],0,'Nothing is broken, but everyone sees it, so fix it fast.'],
 ['qa',1,'A quick check that the critical features work on a new build is called:',['Smoke testing','Regression testing','Load testing','User acceptance testing'],0,'If the smoke test fails, the build goes back before deeper testing.'],
 ['qa',1,'What must a bug report include so a developer can fix it?',['Steps to reproduce, plus expected vs actual result','Only a screenshot','The tester\'s opinion','The release date'],0,'If a developer cannot reproduce it, they cannot fix it.'],
 ['qa',1,'After a fix, re-testing OTHER features to be sure nothing broke is:',['Regression testing','Smoke testing','Unit testing','Exploratory testing'],0,'Regression = making sure old features did not "regress."'],
 ['qa',1,'Typing letters into a phone-number field to check the error message is:',['Negative testing','Positive testing','Performance testing','Integration testing'],0,'Negative tests check that bad input is handled gracefully.'],
 ['qa',1,'Testing an app without looking at its code is:',['Black box testing','White box testing','Static analysis','Unit testing'],0,'Most manual QA is black box: you test behavior like a user.'],
 ['qa',1,'In the STLC, what comes first?',['Requirement analysis','Test execution','Test closure','Environment setup'],0,'You need to understand what should happen before you can test it.'],
 ['qa',1,'A developer marks your bug "Fixed." Your next step?',['Retest it, then close it or reopen it','Close it right away','Delete it','Escalate it'],0,'Trust, but verify. Testers own the retest.'],
 ['qa',1,'Why mock an API in tests (for example with MSW)?',['So tests are fast, repeatable and do not depend on the real server','To hack the API','To slow tests down','Because it is required by law'],0,'Mocks give you the exact responses you need, including errors, every time.'],

 ['code',1,'You changed files and want to save a snapshot and share it. Which order?',['git add, git commit, git push','git push, git add, git commit','git commit, git add, git pull','git pull, git push, git add'],0,'Stage with add, record with commit, share with push.'],
 ['code',1,'An API returns <b>401</b>. What does it mean?',['You are not authenticated (not logged in or bad token)','Not found','Server crashed','Success'],0,'401 = who are you? 403 = I know who you are, but no.'],
 ['code',1,'What is the difference between 403 and 401?',['403: you are logged in but not allowed','They are the same','403 means not found','403 means success'],0,'Think: 401 authentication, 403 authorization.'],
 ['code',1,'Which HTTP method should create a new record?',['POST','GET','DELETE','HEAD'],0,'GET should only read; it should never change data.'],
 ['code',1,'A pull request is:',['A request for teammates to review and merge your branch','Downloading code','Deleting a branch','A Git error'],0,'You did this on the ACC website project.'],
 ['code',1,'Which one is a Python dictionary?',['{"name": "Alei"}','[1, 2, 3]','("a", "b")','"dict"'],0,'Curly braces with key: value pairs. Square brackets make a list; parentheses make a tuple.'],
 ['code',1,'A merge conflict happens when:',['Two changes edit the same lines and Git cannot combine them','The server is down','A test fails','You enter the wrong password'],0,'Git asks a human to choose which version to keep.'],
 ['code',1,'A Docker container is:',['A running instance of an image','The blueprint itself','A full virtual machine with its own kernel','A Python package'],0,'Containers share the host\'s kernel, which is why they start fast.'],
 ['code',1,'Look-ahead bias in a backtest means:',['Using data the strategy could not have known at that moment','Trading too slowly','Testing too far in the future','Buying before other traders'],0,'Example: deciding with a candle\'s closing price before that candle has closed. It makes results look better than reality.'],
 ['code',1,'Why use a virtual environment in Python?',['To keep each project\'s packages separate','To make Python run faster','Git requires it','To encrypt your code'],0,'Two projects can then use different versions of the same package.'],

 /* ---- Phase 2: SQL Level 1 ---- */
 ['sql',1,'Which query returns only high-priority tickets?',['SELECT * FROM tickets WHERE priority = \'high\';','SELECT * FROM tickets ORDER BY priority;','SELECT high FROM tickets;','SELECT * FROM tickets GROUP BY \'high\';'],0,'WHERE filters rows. ORDER BY only sorts them.'],
 ['sql',1,'How do you find tickets with no one assigned?',['WHERE assigned_to IS NULL','WHERE assigned_to = NULL','WHERE assigned_to = 0','WHERE assigned_to = \'\''],0,'NULL is "no value," so it never equals anything. Always use IS NULL.'],
 ['sql',1,'<code>ORDER BY created_at DESC</code> shows:',['Newest first','Oldest first','Only today\'s rows','Random order'],0,'DESC = descending (biggest or latest first). ASC is the default.'],
 ['sql',1,'<code>SELECT COUNT(*) FROM tickets;</code> returns:',['The number of rows in tickets','Every ticket','The highest ticket ID','The number of columns'],0,'COUNT(*) counts rows.'],
 ['sql',1,'<code>WHERE title LIKE \'POS%\'</code> matches titles that:',['Start with POS','End with POS','Contain POS anywhere','Are exactly POS'],0,'% after the text means "anything can follow." \'%POS%\' would match anywhere.'],
 ['sql',1,'A primary key must be:',['Unique and never empty','A number over 100','The first column alphabetically','A link to another table'],0,'A link to another table is a foreign key.'],
 ['sql',1,'<code>SELECT status, COUNT(*) FROM tickets GROUP BY status;</code> gives:',['One row per status with how many tickets have it','Every ticket sorted by status','Only the most common status','An error'],0,'GROUP BY makes one row per group; COUNT(*) counts each group.'],
 ['sql',1,'In SQL, text values like a status go in:',['Single quotes: \'open\'','Square brackets: [open]','Nothing: open','Curly braces: {open}'],0,'Without quotes, SQL treats the word as a column name.'],

 /* ---- Phase 2: Level 2 (job-ready) ---- */
 ['linux',2,'Which command shows which folders use the most disk space?',['du -sh /var/* | sort -h','df -h','free -h','ls -s'],0,'df shows free space per disk; du shows what is using it.'],
 ['linux',2,'The cron line <code>30 2 * * 1</code> runs:',['At 2:30 AM every Monday','Every 30 minutes','At 1:30 on the 2nd','At 2:30 PM daily'],0,'Fields: minute (30), hour (2), day of month (*), month (*), weekday (1 = Monday).'],
 ['linux',2,'Restart nginx and make sure it starts after a reboot:',['systemctl restart nginx, then systemctl enable nginx','systemctl start nginx --forever','reboot nginx','service nginx boot'],0,'restart acts now; enable sets it to start at boot.'],
 ['linux',2,'Which command lists listening ports and the program using each?',['ss -tulpn','ps aux','ip a','lsblk'],0,'ip a shows addresses, lsblk shows disks, ps shows processes but not ports.'],
 ['linux',2,'You delete a 20 GB log the app is writing to, but <code>df</code> still shows the disk full. Why?',['The app still has the file open, so the space is freed only when it closes or restarts','The trash must be emptied','df is cached for an hour','The file was copied to /tmp'],0,'Truncate the file instead of deleting it (truncate -s 0), or restart the app.'],
 ['linux',2,'On Ubuntu, where do you check SSH login attempts?',['/var/log/auth.log','/etc/ssh/users','/home/logins','/var/www/log'],0,'On Red Hat-based systems it is /var/log/secure.'],
 ['linux',2,'After a command runs, <code>echo $?</code> prints 0. That means:',['The command succeeded','The command failed','No output','Zero files changed'],0,'Exit code 0 = success. Anything else = an error. Scripts use this to decide what to do next.'],
 ['linux',2,'The safest common setup for SSH on a server is:',['Key-based login, with password login and direct root login turned off','Password login for everyone','Root login with a long password','A shared key for the whole team'],0,'Each person gets their own key; root works through sudo.'],

 ['net',2,'How many usable host addresses does a /26 have?',['62','64','30','126'],0,'/26 = 64 addresses, minus network and broadcast = 62.'],
 ['net',2,'Which DNS record says where a domain\'s email should be delivered?',['MX','A','CNAME','PTR'],0,'MX = mail exchanger.'],
 ['net',2,'The DHCP steps in order are:',['Discover, Offer, Request, Acknowledge','Request, Offer, Accept, Done','Offer, Discover, Acknowledge, Request','Ping, Reply, Assign, Confirm'],0,'Remember "DORA."'],
 ['net',2,'POS terminals and guest Wi-Fi share one switch but must be kept apart. Use:',['VLANs','A bigger switch','DNS','A longer cable'],0,'VLANs split one switch into separate networks; a firewall controls traffic between them.'],
 ['net',2,'Video calls are choppy, but a speed test looks fine. Most likely cause?',['Jitter or packet loss','Not enough storage','Wrong DNS server','The monitor resolution'],0,'Speed tests measure bandwidth. Calls need steady, low-variation delivery.'],
 ['net',2,'Which address is in the same /24 network as 192.168.10.25?',['192.168.10.200','192.168.11.25','192.169.10.25','10.168.10.25'],0,'In a /24, the first three numbers must match.'],
 ['net',2,'A NOC usually learns that a network device went down through:',['Monitoring that polls it with ping or SNMP','The device emailing the CEO','Customers only','Weekly reports'],0,'Good monitoring catches outages before customers call.'],
 ['net',2,'With a full-tunnel VPN:',['All of the user\'s internet traffic goes through the company network','Only company traffic goes through the VPN','Traffic is not encrypted','The VPN only works in the office'],0,'Split tunnel sends only company traffic through the VPN.'],

 ['sec',2,'Windows Event ID 4625 means:',['A failed logon','A successful logon','An account was locked out','A user was created'],0,'4624 = success, 4740 = lockout, 4720 = user created.'],
 ['sec',2,'You confirm a laptop is infected with ransomware. First action?',['Isolate it from the network','Pay the ransom','Turn off the antivirus','Email the user a warning'],0,'Containment first, so it cannot spread. EDR tools can isolate a device with one click.'],
 ['sec',2,'An email claims to be from "IT Support," but SPF fails and the reply-to address is an outside domain. Most likely:',['It is spoofed. Treat it as phishing','It is a normal IT message','It is a server error','It is spam from a coworker'],0,'Header checks like SPF and mismatched reply-to addresses are key phishing clues.'],
 ['sec',2,'What does DMARC do?',['Tells receiving mail servers what to do when SPF/DKIM checks fail, and sends reports','Encrypts email','Blocks all attachments','Scans for viruses'],0,'SPF and DKIM do the checking; DMARC sets the policy.'],
 ['sec',2,'An alert fires, but you find it was a planned admin task. This alert is a:',['False positive','True positive','False negative','Zero-day'],0,'Close it with notes. If it keeps happening, ask for the rule to be tuned.'],
 ['sec',2,'A CVSS 9.8 vulnerability is on an internet-facing server. What should happen?',['Patch or mitigate it urgently','Wait for the next quarterly patch','Ignore it if no one complained','Turn off logging'],0,'High score plus internet exposure = top risk.'],
 ['sec',2,'The 3-2-1 backup rule means:',['3 copies, 2 types of storage, 1 offsite','3 backups per day for 2 weeks','3 passwords, 2 admins, 1 server','Back up every 3 hours'],0,'Keep one copy offline or immutable so ransomware cannot reach it.'],
 ['sec',2,'"Lessons learned" belongs to which incident response phase?',['Post-incident activity','Preparation','Detection and analysis','Containment'],0,'Afterwards, the team reviews what happened and improves.'],

 ['support',2,'The same restaurant printer fails every week, and you fix it each time. In ITIL terms you should:',['Open a Problem record to find the root cause','Keep closing the incidents','Buy a new printer immediately','Ignore it'],0,'Incidents restore service; Problems stop repeats.'],
 ['support',2,'A user can sign in at the office but not at home, and the error mentions device compliance. Likely cause?',['A Conditional Access policy','A printer driver','A full mailbox','DNS'],0,'Conditional Access can require a compliant (Intune-managed) device.'],
 ['support',2,'Outlook desktop will not load mail, but Outlook on the web works fine. That points to:',['The desktop app or its profile','The user\'s account','The mail server','The internet connection'],0,'The account and server work, so focus on the local app: safe mode, new profile, repair.'],
 ['support',2,'An employee leaves the company today. First step?',['Block sign-in and revoke active sessions','Delete their mailbox','Wait until Friday','Change their display name'],0,'Cut access first, then handle data and devices.'],
 ['support',2,'A PC boots to a BitLocker recovery screen. Where do you find the key?',['The device record in Entra ID or Intune','The user\'s sticky note','The BIOS','Windows Update'],0,'Verify the user before giving the key out.'],
 ['support',2,'Which command shows the Group Policies applied to a PC?',['gpresult /r','ipconfig /all','sfc /scannow','netstat -an'],0,'Run gpupdate /force first to pull the latest policies.'],
 ['support',2,'A P1 ticket must get a response within 15 minutes. You are 12 minutes in and stuck. What do you do?',['Update the ticket and escalate now, per the SLA','Keep trying quietly','Lower the priority','Close it and reopen it'],0,'Missing an SLA silently is worse than escalating.'],
 ['support',2,'Before taking remote control of a user\'s computer, you should:',['Ask their permission and explain what you will do','Just connect','Ask for their password','Turn off their antivirus'],0,'Respect and trust matter. Never ask for passwords.'],

 ['qa',2,'A document linking every requirement to its test cases is a:',['Traceability matrix','Test plan','Bug report','Release note'],0,'It proves every requirement has been tested.'],
 ['qa',2,'According to the testing pyramid, most automated tests should be:',['Unit tests','End-to-end UI tests','Manual tests','Load tests'],0,'Unit tests are fast and cheap, so you can have many.'],
 ['qa',2,'A test sometimes passes and sometimes fails with no code change. It is:',['Flaky','Regression','Smoke','Exploratory'],0,'Usually a timing or shared-data problem. Fix it or quarantine it.'],
 ['qa',2,'An API returns status 200 with an error message in the body for bad input. Is that a bug?',['Yes. It should return a 4xx status such as 400','No, 200 is fine','Only if the page crashes','Only on Fridays'],0,'Status codes tell other programs what happened. Clients rely on them.'],
 ['qa',2,'A good exit criterion for a test cycle is:',['Planned tests run, and no open critical or high-severity bugs','The tester is tired','The deadline arrived','All bugs are deleted'],0,'Exit criteria are agreed in the test plan before testing starts.'],
 ['qa',2,'Testing a healthcare billing app, you should use:',['Synthetic or anonymized test data','Real patient records','Your own medical records','Data copied from production without changes'],0,'Real patient data is protected health information under HIPAA.'],
 ['qa',2,'A change touched tax calculation. Your regression scope should be:',['Tax features, everything that uses totals (invoices, reports, exports), plus the smoke suite','Only the login page','The whole app, manually, from scratch','Nothing, if the developer tested it'],0,'Target the changed area and anything that depends on it.'],
 ['qa',2,'In healthcare EDI, an 837 is:',['A claim sent to an insurer','A payment (remittance) file','A patient record','An error code'],0,'837 = claim. 835 = payment/remittance.'],

 ['code',2,'Where should an API key live?',['In an environment variable or .env file that is in .gitignore','Hard-coded in the script','In the README','In a public Git repository'],0,'Leaked keys in Git repos are one of the most common security mistakes.'],
 ['code',2,'How do you safely undo a commit that is already pushed to shared main?',['git revert &lt;commit&gt;','Delete the repository','git reset --hard and force-push','Edit the file by hand and tell nobody'],0,'revert adds a new commit that undoes the old one without rewriting shared history.'],
 ['code',2,'What does CI do?',['Automatically builds and tests every push or pull request','Writes the code for you','Deploys only on Fridays','Reviews code for style'],0,'CI catches broken changes before they reach main.'],
 ['code',2,'PowerShell to list services that are stopped:',['Get-Service | Where-Object Status -eq \'Stopped\'','ls services --stopped','net view stopped','Get-Process -Stopped'],0,'PowerShell pipes objects, so you can filter on properties like Status.'],
 ['code',2,'What is the benefit of <code>with open(...)</code> in Python?',['The file closes automatically, even if an error happens','It makes the file read-only','It encrypts the file','It runs faster'],0,'Leaving files open can lock them or lose data.'],
 ['code',2,'The regex <code>^ERROR</code> matches lines that:',['Start with ERROR','End with ERROR','Contain ERROR anywhere','Do not contain ERROR'],0,'^ = start of line, $ = end of line.'],
 ['code',2,'Where does a Bearer token usually go in an API request?',['The Authorization header','The URL','The request body','A cookie named token'],0,'Putting tokens in URLs can leak them into logs.'],
 ['code',2,'Which logging level fits "disk is 90% full"?',['WARNING','DEBUG','INFO','CRITICAL'],0,'Not broken yet, but needs attention soon.'],

 ['sql',2,'To list every ticket, including unassigned ones, with the assignee\'s name, use:',['LEFT JOIN users','INNER JOIN users','CROSS JOIN users','UNION users'],0,'INNER JOIN would drop tickets with no matching user.'],
 ['sql',2,'To keep only groups with more than 5 rows, use:',['HAVING COUNT(*) &gt; 5','WHERE COUNT(*) &gt; 5','LIMIT 5','ORDER BY 5'],0,'WHERE runs before grouping; HAVING runs after.'],
 ['sql',2,'What does <code>UPDATE tickets SET status = \'closed\';</code> do?',['Closes EVERY ticket','Closes the newest ticket','Nothing without a WHERE','Asks for confirmation'],0,'Always add WHERE, and test the WHERE with a SELECT first.'],
 ['sql',2,'Which query finds duplicate emails?',['SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*) &gt; 1;','SELECT DISTINCT email FROM users;','SELECT * FROM users WHERE email = email;','SELECT COUNT(email) FROM users;'],0,'Group by the value, then keep groups that appear more than once.'],
 ['sql',2,'<code>ROLLBACK</code> does what?',['Undoes the changes made in the current transaction','Deletes the table','Restores last week\'s backup','Repeats the last query'],0,'COMMIT saves; ROLLBACK cancels.'],
 ['sql',2,'An index on a column mainly:',['Makes searches on that column faster','Encrypts the column','Prevents duplicates in every case','Deletes old rows'],0,'Only a UNIQUE index blocks duplicates. Indexes cost a little storage and write speed.'],
 ['sql',2,'An INNER JOIN of tickets to users on assigned_to = id leaves out:',['Tickets with no assigned user','Users with tickets','All high-priority tickets','Nothing'],0,'Rows without a match on both sides are dropped.'],
 ['sql',2,'A safe habit before running a DELETE is to:',['Run the same WHERE as a SELECT and check the rows','Delete everything and restore later','Remove the WHERE to be thorough','Run it twice'],0,'Seeing exactly what will be removed prevents disasters.']
];

/* Terminal challenges: task, accepted patterns (after normalizing), model answer, hint */
const TERM = [
 ['List ALL files, including hidden ones, in long format.',[/^ls -(la|al)$/,/^ls -l -a$/,/^ls -a -l$/],'ls -la','ls with two flags: one for "all," one for "long."'],
 ['Go to your home directory.',[/^cd$/,/^cd ~\/?$/,/^cd \$HOME$/],'cd ~','The tilde is a shortcut for home.'],
 ['Show which folder you are in right now.',[/^pwd$/],'pwd','Three letters: print working directory.'],
 ['Make a new folder named logs.',[/^mkdir logs\/?$/],'mkdir logs','"make directory"'],
 ['Print the contents of notes.txt to the screen.',[/^(cat|less|more) notes\.txt$/],'cat notes.txt','The command sounds like an animal.'],
 ['Find every line containing the word failed in auth.log.',[/^grep (-\w+ )?failed auth\.log$/,/^cat auth\.log \| grep (-\w+ )?failed$/],'grep "failed" auth.log','grep PATTERN FILE'],
 ['Show the last 20 lines of app.log.',[/^tail -n ?20 app\.log$/,/^tail -20 app\.log$/],'tail -n 20 app.log','The opposite of head.'],
 ['Count how many lines are in users.txt.',[/^wc -l users\.txt$/,/^cat users\.txt \| wc -l$/],'wc -l users.txt','wc = word count, and -l counts lines.'],
 ['Make backup.sh executable.',[/^chmod (\+x|u\+x|a\+x|7[0-7][0-7]) backup\.sh$/],'chmod +x backup.sh','chmod plus x'],
 ['Copy config.yml to a new file named config.yml.bak.',[/^cp config\.yml config\.yml\.bak$/],'cp config.yml config.yml.bak','cp SOURCE DESTINATION'],
 ['Check which user you are logged in as.',[/^whoami$/,/^id( -un)?$/],'whoami','Ask the computer the question, all in one word.'],
 ['Show all running processes.',[/^ps (aux|-ef|-aux)$/,/^h?top$/],'ps aux','ps plus the letters a, u, x.'],
 ['Check free disk space in human-readable sizes (GB, MB).',[/^df -h$/],'df -h','df = disk free; -h = human.'],
 ['Find every file named report.pdf, starting from your home folder.',[/^find (~|\$HOME)\/? -name report\.pdf$/],'find ~ -name "report.pdf"','find WHERE -name NAME'],
 ['Test whether google.com answers, sending exactly 4 packets.',[/^ping -c ?4 google\.com$/],'ping -c 4 google.com','On Linux, -c sets the count.'],
 ['Run the script deploy.sh that is in the current folder.',[/^\.\/deploy\.sh$/,/^(ba)?sh deploy\.sh$/],'./deploy.sh','Start with a dot and a slash.'],
 /* ---- Phase 2: Level 2 (5th item = level) ---- */
 ['Restart the nginx service.',[/^(sudo )?systemctl restart nginx(\.service)?$/],'sudo systemctl restart nginx','systemctl ACTION SERVICE',2],
 ['Check the status of the ssh service.',[/^(sudo )?systemctl status sshd?(\.service)?$/],'systemctl status ssh','systemctl status SERVICE',2],
 ['Show the systemd log for the nginx service.',[/^(sudo )?journalctl -u nginx(\.service)?$/],'journalctl -u nginx','journalctl, with -u for "unit"',2],
 ['Show the size of each item inside /var/log, human-readable.',[/^(sudo )?du -(sh|hs) \/var\/log\/\*( \| sort -h)?$/,/^(sudo )?du -h (--max-depth=1|-d ?1) \/var\/log\/?( \| sort -h)?$/],'du -sh /var/log/*','du with -s (summary) and -h (human)',2],
 ['List listening ports and the program using each one.',[/^(sudo )?(ss|netstat) -(?=[tulpn]*l)(?=[tulpn]*p)[tulpn]{3,5}$/],'sudo ss -tulpn','ss with the letters t, u, l, p, n',2],
 ['Show lines containing "error" (any capitalization) in /var/log/syslog.',[/^(sudo )?grep -i error \/var\/log\/syslog$/i],'grep -i "error" /var/log/syslog','grep with -i to ignore case',2],
 ['Open your scheduled cron jobs for editing.',[/^crontab -e$/],'crontab -e','crontab, with -e for edit',2],
 ['Connect to the server 10.0.0.5 as the user admin over SSH.',[/^ssh admin@10\.0\.0\.5$/,/^ssh -l admin 10\.0\.0\.5$/],'ssh admin@10.0.0.5','ssh USER@HOST',2],
 ['Compress the folder logs into logs.tar.gz.',[/^tar -?(czf|zcf|czvf|cvzf|zcvf) logs\.tar\.gz logs\/?$/],'tar -czf logs.tar.gz logs/','tar with c (create), z (gzip), f (file name)',2],
 ['Make www-data the owner and group of /var/www and everything inside it.',[/^(sudo )?chown -R www-data:www-data \/var\/www\/?$/],'sudo chown -R www-data:www-data /var/www','chown -R USER:GROUP PATH',2],
 ['Empty app.log without deleting the file.',[/^(sudo )?truncate -s ?0 app\.log$/,/^:? ?> ?app\.log$/],'truncate -s 0 app.log','truncate the file to size 0',2],
 ['Show memory usage in human-readable form.',[/^free -h$/],'free -h','free, with -h',2],
 ['Follow app.log live and show only lines with ERROR.',[/^tail -f app\.log \| grep (-\w+ )?error$/i],'tail -f app.log | grep ERROR','tail -f, piped into grep',2],
 ['Show this server\'s IP addresses.',[/^ip (a|addr)( show)?$/,/^hostname -I$/,/^ifconfig$/],'ip a','The ip command, with a for address',2]
];

/* Interview bank. model text uses Alei's confirmed facts; [brackets] = fill in your own story. */
const IV = [
 {c:'resume', q:'Tell me about yourself.', tip:'60 to 90 seconds. Present, then past, then future, then why this job.',
  model:'"I\'m a cybersecurity student at the University of Houston–Downtown. Right now I volunteer on the website for the Arab American Cultural and Community Center, working in React and TypeScript with GitHub reviews, and I built a Python backtesting tool for trading strategies with automated tests. Before that I managed garage operations for Sabek Carriers: a four-person crew and about 50 vehicles a week moving to and from the port. I\'m looking for a role where I can do hands-on [IT support / testing / security] work, and this one stood out because [specific reason from the posting]."',
  points:['Under 90 seconds','Started with what you do now','Mentioned one technical project with a detail','Mentioned the garage leadership','Ended with why THIS job']},
 {c:'resume', q:'Walk me through your trading bot project.', tip:'Problem, your role, tools, how you tested it, result, lesson.',
  model:'"I built a Python research environment to test trading strategies on historical market data before risking any money. It has data-quality checks, risk guards, and automated tests for the signal and strategy logic, and it runs in Docker. The most useful part was the auditing: I checked results trade by trade against the rules, and the strategies we tested did not pass, so we did not trade them. I wrote plain-language reports so a non-technical stakeholder could follow the decision. The lesson: a test that says no is still a success, because it saved real money."',
  points:['Said what problem it solves','Named the tools (Python, tests, Docker)','Explained how you tested it','Was honest about the result','Gave a lesson learned']},
 {c:'resume', q:'How did you test the bot? What would you test first?', tip:'Show tester thinking: known inputs, edge cases, and "is the simulation honest?"',
  model:'"First I tested the signal logic with small, known inputs where I could calculate the right answer by hand. Then edge cases: missing candles, gaps in data, zero volume. The most important check was look-ahead bias, making sure an indicator only used data available at that moment. I also included trading fees, because ignoring them makes results look better than reality. Finally I compared a sample of simulated trades against the written rules, hour by hour."',
  points:['Known inputs and expected outputs','Edge cases','Look-ahead bias','Fees / realistic costs','Manual check of sample trades']},
 {c:'resume', q:'What did you do on the ACC website?', tip:'Be specific and honest about your part.',
  model:'"It\'s the public website for a Houston nonprofit, built with React and TypeScript, with content in Sanity CMS. I work on English and Arabic translation, open pull requests that teammates review, publish content through the CMS, and check translated pages before they go live, fixing what I find. I use AI coding assistants, but I review, test and understand every change before it goes in."',
  points:['Named the stack','Described your own part','Mentioned code review / pull requests','Mentioned checking before publishing','Was honest about tools you use']},
 {c:'resume', q:'Tell me about managing the garage at Sabek Carriers.', tip:'Use STAR: Situation, Task, Action, Result.',
  model:'"Situation: a trucking company moving about 50 vehicles a week to and from the port. Task: I ran the garage and a four-person crew so vehicles were ready on time. Action: I assigned daily work, tracked arrivals and departures, and re-planned when schedules changed. Result: [your result, e.g. the port schedule kept moving / fewer late vehicles]. It taught me prioritizing and keeping accurate records under pressure, which is most of IT support."',
  points:['Gave the scale (4 people, ~50 vehicles/week)','Clear about your actions','Had a result','Linked it to the job you want']},
 {c:'resume', q:'Your resume mentions CSRF. Explain it.', tip:'Plain words first, then the fix.',
  model:'"Cross-Site Request Forgery tricks a logged-in user\'s browser into sending a request they did not intend, like changing their email, because the browser automatically sends their cookies. Defenses are CSRF tokens, random values the attacker cannot guess, and SameSite cookie settings so cookies are not sent on cross-site requests."',
  points:['Explained the attack simply','Mentioned cookies being sent automatically','Named CSRF tokens','Named SameSite cookies']},
 {c:'resume', q:'What is your biggest weakness?', tip:'Real, not fatal, and show what you are doing about it.',
  model:'"I don\'t have professional IT experience yet. I\'m closing that gap on purpose: I do hands-on labs every day on TryHackMe and OverTheWire, I\'m studying for Security+, and I build real projects like my backtesting tool and the ACC website so I practice on real problems, not just coursework."',
  points:['Named a real weakness','Showed concrete actions','Stayed positive and short']},
 {c:'resume', q:'How would you balance this job with your classes?', tip:'Be clear and proactive.',
  model:'"My classes are Tuesday and Thursday from 10 to 4. I\'m available the rest of the week, including evenings, and I plan around exams early so the team always knows my availability in advance."',
  points:['Gave exact schedule','Showed flexibility','Promised early communication']},

 {c:'behavioral', q:'Tell me about a time you solved a problem under pressure.', tip:'STAR. Garage or restaurant stories work well.',
  model:'"[Situation: e.g. a busy Friday at the garage when several vehicles had to leave for the port at once.] [Task: what you were responsible for.] [Action: 2 or 3 specific steps YOU took.] [Result: what happened, with a number if you have one.] What I took from it: [one lesson]."',
  points:['Situation was clear','Your own actions, said with "I"','A result','A lesson']},
 {c:'behavioral', q:'Tell me about a mistake you made.', tip:'Own it, fix it, show what changed.',
  model:'"[What went wrong, in one sentence, owning your part.] [How you noticed and fixed it.] [What you changed so it does not happen again.] Example from your projects: an early bot test counted stop events instead of whole trades. I caught it, sent a corrected report the same night, and now I check my counts against the raw data before reporting."',
  points:['Took ownership','Fixed it','Changed a habit']},
 {c:'behavioral', q:'Describe explaining something technical to a non-technical person.', tip:'Shows you can support real users.',
  model:'"For my backtesting project I reported results to a non-technical stakeholder. Instead of indicator jargon I wrote a simple version and a technical version of each report: one page in plain words, like \'the strategy made money in 1 of 6 periods, so it did not pass,\' with the details attached for anyone who wanted them."',
  points:['Knew the audience','Used plain language','Gave a concrete example']},
 {c:'behavioral', q:'How do you prioritize when everything is urgent?', tip:'Impact plus urgency, then communicate.',
  model:'"I look at impact and urgency: how many people are affected, and how much it is hurting the business right now. Something stopping sales or service goes first. Then I tell people where their request stands, so nobody is left guessing. At the garage that meant vehicles due at the port first, then routine work."',
  points:['Impact and urgency','Communicates status','A real example']},
 {c:'behavioral', q:'Tell me about a time you disagreed with someone.', tip:'Calm, data-driven, focused on the outcome.',
  model:'"[Situation.] I asked questions to understand their view, then shared mine with facts, [e.g. test results]. We agreed to [decision], and [result]. I care more about getting it right than being right."',
  points:['Stayed respectful','Used facts','Reached a decision']},

 {c:'technical', q:'A user says "the internet is down." Walk me through it.', tip:'Narrow it down step by step, from the user outward.',
  model:'"First, scope: is it just them or everyone, and is it one site or all sites? Then: is Wi-Fi or the cable connected? Run ipconfig: a 169.254 address means DHCP failed. Ping the gateway, then 8.8.8.8, then google.com. If the IP works but the name does not, it is DNS, so try nslookup and ipconfig /flushdns. If many users are affected, escalate it as an outage. Document everything in the ticket."',
  points:['Asked about scope first','Checked physical / Wi-Fi','ipconfig / APIPA','Ping gateway, then IP, then name','DNS check','Escalate if widespread, and document']},
 {c:'technical', q:'A user cannot print. What do you do?', tip:'Simple to complex.',
  model:'"Check the printer itself first: power, paper, errors, and whether others can print to it. Check the user picked the right printer. Clear the stuck queue and restart the Print Spooler service. Check the printer\'s network connection. Reinstall or update the driver. If it is hardware, open a vendor case. Then confirm with the user and document."',
  points:['Is it everyone or one user?','Right printer selected','Print Spooler','Network / driver','Verify and document']},
 {c:'technical', q:'What happens when you type a website address into a browser?', tip:'A classic. Keep it in order.',
  model:'"The browser asks DNS to turn the name into an IP address. It opens a TCP connection, a three-way handshake, to port 443, then a TLS handshake sets up encryption. It sends an HTTP GET request, the server returns a response with a status code and HTML, and the browser renders the page and fetches images, CSS and JavaScript."',
  points:['DNS lookup','TCP handshake','TLS / HTTPS','HTTP request and response','Rendering']},
 {c:'technical', q:'How would you write test cases for a login page?', tip:'Positive, negative, boundaries, security.',
  model:'"Positive: valid username and password logs in. Negative: wrong password, unknown user, empty fields, each with a clear error. Boundaries: maximum length fields, special characters. Security: account lockout after too many tries, the password field is masked, no SQL injection, the error does not reveal which part was wrong. Also: \'remember me,\' logout, and the session expiring."',
  points:['Positive case','Negative cases','Boundaries','Security cases','Session / logout']},
 {c:'technical', q:'A user reports a suspicious email. What do you do?', tip:'Protect first, then investigate.',
  model:'"Tell them not to click anything and thank them for reporting. Have them use the report-phishing button, or forward it as an attachment. Check the sender, headers and links safely without opening them. If it is malicious, search for and remove the same email from other mailboxes and block the sender. If anyone clicked or entered a password, reset it, revoke sessions and check sign-in logs. Document and escalate to security."',
  points:['Do not click','Report it properly','Check sender / links safely','Remove from other mailboxes','Reset if someone clicked','Document / escalate']},
 {c:'technical', q:'How do you reset a user\'s Microsoft 365 password?', tip:'The trap: verifying identity first.',
  model:'"First verify the person is who they say they are, using the company\'s verification process, because password resets are a favorite social-engineering trick. Then in the Microsoft 365 admin center go to Users, Active users, select the user and choose Reset password, requiring a change at next sign-in. Check MFA is working, and document the ticket."',
  points:['Verified identity FIRST','Admin center steps','Force change at next sign-in','Checked MFA','Documented']},
 {c:'technical', q:'Explain the difference between TCP and UDP.', tip:'Short, with examples.',
  model:'"TCP sets up a connection and guarantees data arrives complete and in order; web pages and email use it. UDP just sends packets with no handshake or guarantee, which makes it faster; DNS lookups, video calls and games use it."',
  points:['Connection vs no connection','Reliable vs fast','An example of each']},

 {c:'ask', q:'Practice asking: "What does a great first 90 days look like in this role?"', tip:'Always have 2 or 3 questions ready for the end of an interview.',
  model:'Good questions to ask: "What does a great first 90 days look like?" / "What are the most common issues the team handles?" / "How does the team learn new skills; is there training or certification support?" / "What is the next step in the hiring process?"',
  points:['Have at least 2 questions','Ask about the work, not only pay','Ask about next steps']},

 /* ---- Phase 2: job-ready (Level 2) ---- */
 {c:'jobready', q:'What is the difference between an incident and a problem?', tip:'An ITIL basic that IT support interviews love.',
  model:'"An incident is something broken right now, and the goal is to restore service fast. A problem is the root cause behind one or more incidents, and the goal is to fix it permanently. For example, a restaurant printer going offline every week is a string of incidents; the failing network port causing it is the problem."',
  points:['Incident = restore service fast','Problem = root cause, permanent fix','Gave an example']},
 {c:'jobready', q:'Walk me through offboarding an employee who leaves today.', tip:'Order matters: access first.',
  model:'"First, block sign-in and revoke active sessions so access ends immediately. Then, following the manager\'s instructions, convert the mailbox to shared or set up forwarding, and move OneDrive files to the right person. Remove them from groups and apps, remove licenses once the data is handled, collect the laptop and wipe it through Intune, update the asset inventory, and document everything in the ticket."',
  points:['Blocked access first','Handled mailbox and files','Removed licenses and groups','Collected and wiped the device','Documented it']},
 {c:'jobready', q:'A Linux server alert says the disk is 95% full. What do you do?', tip:'Confirm, find, fix safely, prevent.',
  model:'"I confirm with df -h to see which filesystem is full. Then du -sh on that path, sorted, to find what is using the space, usually logs. If a log is still being written, I truncate it rather than delete it, because deleting an open file does not free the space. Then I set up logrotate and an alert at 80%, and I document the change."',
  points:['df -h to confirm','du to find the cause','Truncate, not delete, open files','Prevent with logrotate and alerts','Documented the change']},
 {c:'jobready', q:'How would you write a SQL query to find duplicate email addresses?', tip:'GROUP BY plus HAVING.',
  model:'"SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*) > 1; Grouping by email makes one row per address, and HAVING keeps only the addresses that appear more than once."',
  points:['GROUP BY email','COUNT(*)','HAVING COUNT(*) > 1','Explained why it works']},
 {c:'jobready', q:'How would you test a new "export claims to CSV" feature?', tip:'Healthcare billing-style question. Think like a tester.',
  model:'"I start from the requirements: which columns, which filters, who can export. Positive tests: the export matches the screen and the row count matches a SQL count. Negative and edge tests: no data, a very large export, commas or quotes inside fields, special characters, dates in the right format. Permissions: only the right roles can export, since claims contain protected health information. I test with fake data, and finally run regression on related reports."',
  points:['Started from requirements','Positive tests with a data check','Edge cases (empty, large, special characters)','Permissions and privacy','Regression on related features']},
 {c:'jobready', q:'What does a NOC admin do when several sites go down at once?', tip:'Look for the common cause, organize, communicate.',
  model:'"I look for what the sites share: the same ISP, region, or upstream device, or a maintenance window. I open one master incident and link the site tickets to it, open a case with the provider, and send customers updates on a schedule that meets the SLA, escalating per the matrix. After it is fixed, I confirm every site is up, close the tickets with notes, and write the timeline for a root-cause review."',
  points:['Looked for a common cause','One master incident','Updates on a schedule / SLA','Verified and documented','Root-cause review']},
 {c:'jobready', q:'It\'s Monday morning and there are 20 open tickets. How do you decide what to do first?', tip:'Impact, urgency, SLA, and quick wins.',
  model:'"I sort by impact and urgency first: anything stopping the business, like a POS or an outage, goes to the top. Then I check SLA deadlines so nothing is about to breach. I knock out a few quick wins, like password resets, so users are not waiting on five-minute fixes, and I send short status updates on anything that will take longer."',
  points:['Impact and urgency first','Checked SLA deadlines','Quick wins','Kept users updated']}
];

const STRATEGIES = [
 ['Explain it out loud','After each card, say the answer in your own words as if teaching a friend. If you cannot, you do not know it yet.'],
 ['Do before you read','Try the lab or terminal task first, then read the answer. Struggling first makes it stick.'],
 ['Spaced review','The Review tab brings back cards right before you would forget them. A few minutes daily beats hours once a week.'],
 ['STAR answers','Situation, Task, Action, Result. 60 to 90 seconds. Say "I," not "we."'],
 ['Connect it to your resume','For every concept, ask: where did I use this? Interviewers love "I ran into this when..."'],
 ['Real labs too','Pair today\'s track with a real lab: TryHackMe (security), OverTheWire Bandit (Linux), SQLBolt (SQL), Microsoft Learn (M365).'],
 ['Record yourself','Record one interview answer on your phone. Listen once. Cut filler words like "um" and "basically."']
];

/* SQL console: a small help-desk database. Results are computed from this data, so they are always consistent. */
const DB = {
  users:{cols:['id','name','department','location'], rows:[
    [1,'Maria Lopez','IT','Houston'],[2,'James Carter','IT','Katy'],[3,'Priya Shah','Finance','Houston'],[4,'Omar Haddad','Operations','Katy']]},
  tickets:{cols:['id','title','priority','status','assigned_to','created_at'], rows:[
    [101,'Printer offline at front desk','high','open',1,'2026-10-20'],
    [102,'Password reset','low','closed',2,'2026-10-18'],
    [103,'POS terminal frozen','high','open',2,'2026-10-22'],
    [104,'New hire laptop setup','high','in_progress',1,'2026-10-21'],
    [105,'Printer jam in office','low','open',null,'2026-10-23'],
    [106,'VPN not connecting','medium','open',null,'2026-10-19']]}
};
const TK = DB.tickets, US = DB.users;
const col = (t,name)=>t.cols.indexOf(name);
const proj = (t,names,rows)=>({cols:names, rows:rows.map(r=>names.map(n=>r[col(t,n)]))});
const newest = ()=>TK.rows.slice().sort((a,b)=>b[5].localeCompare(a[5]));
const userName = id=>{ const u = US.rows.find(r=>r[0]===id); return u ? u[1] : null; };
function countBy(rows, idx){ const m = new Map(); rows.forEach(r=>m.set(r[idx], (m.get(r[idx])||0)+1)); return [...m.entries()]; }
function joinRe(kind){
  const T='(tickets|t)', U='(users|u)';
  return new RegExp('^select '+T+'\\.title,'+U+'\\.name from tickets( as t| t)? '+kind+'join users( as u| u)? on ('+T+'\\.assigned_to='+U+'\\.id|'+U+'\\.id='+T+'\\.assigned_to)$');
}
const CNT = 'count\\((\\*|id)\\)(as \\w+ )?';
/* [level, task, accepted patterns (after sqlNorm), model answer, hint, result()] */
const SQLT = [
 [1,'Show every column of every ticket.',[/^select\*from tickets$/],'SELECT * FROM tickets;','* means "all columns."',()=>({cols:TK.cols, rows:TK.rows})],
 [1,'Show only the title and status of each ticket.',[/^select title,status from tickets$/],'SELECT title, status FROM tickets;','List the columns you want, separated by commas.',()=>proj(TK,['title','status'],TK.rows)],
 [1,'Show all tickets whose status is \'open\'.',[/^select\*from tickets where status='open'$/],'SELECT * FROM tickets WHERE status = \'open\';','WHERE column = \'value\'. Text goes in single quotes.',()=>({cols:TK.cols, rows:TK.rows.filter(r=>r[3]==='open')})],
 [1,'Show tickets that are both high priority AND open.',[/^select\*from tickets where (priority='high' and status='open'|status='open' and priority='high')$/],'SELECT * FROM tickets WHERE priority = \'high\' AND status = \'open\';','Join two conditions with AND.',()=>({cols:TK.cols, rows:TK.rows.filter(r=>r[2]==='high'&&r[3]==='open')})],
 [1,'Show all tickets, newest first (by created_at).',[/^select\*from tickets order by created_at desc$/],'SELECT * FROM tickets ORDER BY created_at DESC;','ORDER BY column, then DESC for newest first.',()=>({cols:TK.cols, rows:newest()})],
 [1,'How many tickets are there in total?',[new RegExp('^select '+CNT+'from tickets$')],'SELECT COUNT(*) FROM tickets;','COUNT(*) counts rows.',()=>({cols:['count(*)'], rows:[[TK.rows.length]]})],
 [1,'Count how many tickets have each status.',[new RegExp('^select status,'+CNT+'from tickets group by status$')],'SELECT status, COUNT(*) FROM tickets GROUP BY status;','Select the status and COUNT(*), then GROUP BY status.',()=>({cols:['status','count(*)'], rows:countBy(TK.rows,3)})],
 [1,'Show all users in the IT department (the value is \'IT\').',[/^select\*from users where department='it'$/],'SELECT * FROM users WHERE department = \'IT\';','The table is users this time.',()=>({cols:US.cols, rows:US.rows.filter(r=>r[2]==='IT')})],
 [1,'Find tickets with "printer" anywhere in the title.',[/^select\*from tickets where title like '%printer%'$/],'SELECT * FROM tickets WHERE title LIKE \'%printer%\';','LIKE with % on both sides.',()=>({cols:TK.cols, rows:TK.rows.filter(r=>/printer/i.test(r[1]))})],
 [1,'Show only the 5 newest tickets.',[/^select\*from tickets order by created_at desc limit 5$/],'SELECT * FROM tickets ORDER BY created_at DESC LIMIT 5;','Sort newest first, then LIMIT.',()=>({cols:TK.cols, rows:newest().slice(0,5)})],
 [1,'Show tickets that nobody is assigned to.',[/^select\*from tickets where assigned_to is null$/],'SELECT * FROM tickets WHERE assigned_to IS NULL;','Empty values need IS NULL, not = NULL.',()=>({cols:TK.cols, rows:TK.rows.filter(r=>r[4]===null)})],
 [1,'List each location from the users table once, with no repeats.',[/^select distinct location from users$/],'SELECT DISTINCT location FROM users;','DISTINCT removes duplicates.',()=>({cols:['location'], rows:[...new Set(US.rows.map(r=>r[3]))].map(x=>[x])})],
 [2,'Show each ticket\'s title with the NAME of the person assigned (tickets.assigned_to matches users.id).',[joinRe('(inner )?')],'SELECT tickets.title, users.name FROM tickets JOIN users ON tickets.assigned_to = users.id;','JOIN users ON tickets.assigned_to = users.id. Write columns as table.column.',()=>({cols:['title','name'], rows:TK.rows.filter(r=>r[4]!==null).map(r=>[r[1],userName(r[4])])})],
 [2,'Same as before, but include unassigned tickets too (their name will be empty).',[joinRe('left (outer )?')],'SELECT tickets.title, users.name FROM tickets LEFT JOIN users ON tickets.assigned_to = users.id;','Which join keeps every row from the left table?',()=>({cols:['title','name'], rows:TK.rows.map(r=>[r[1],userName(r[4])])})],
 [2,'Show only the statuses that have more than 1 ticket, with their counts.',[new RegExp('^select status,'+CNT+'from tickets group by status having count\\((\\*|id)\\)(>1|>=2)$')],'SELECT status, COUNT(*) FROM tickets GROUP BY status HAVING COUNT(*) > 1;','Filter groups with HAVING, after GROUP BY.',()=>({cols:['status','count(*)'], rows:countBy(TK.rows,3).filter(x=>x[1]>1)})],
 [2,'Count tickets per priority, with the biggest count first.',[new RegExp('^select priority,'+CNT+'from tickets group by priority order by (count\\((\\*|id)\\)|\\w+ )desc$')],'SELECT priority, COUNT(*) AS total FROM tickets GROUP BY priority ORDER BY total DESC;','GROUP BY priority, then ORDER BY the count, DESC.',()=>({cols:['priority','total'], rows:countBy(TK.rows,2).sort((a,b)=>b[1]-a[1])})],
 [2,'Close ticket 105: set its status to \'closed\'.',[/^update tickets set status='closed' where id=105$/],'UPDATE tickets SET status = \'closed\' WHERE id = 105;','UPDATE table SET column = value WHERE ... Never forget the WHERE.',()=>({msg:'1 row updated. Ticket 105 is now closed. (This practice database resets each time, so nothing is really changed.)'})]
];

/* Ticket simulator: each step has choices [text, points 0-10, feedback]. 10 = what a strong tech does. */
const SCEN = [
 {id:'pos', title:'POS down during dinner', role:'IT support for a restaurant group', job:'Restaurant IT support', steps:[
  {s:'6:45 PM. A restaurant manager calls: "The POS isn\'t working!" What is your first move?', c:[
   ['Ask: is it one terminal or all of them? Any error on screen? When did it start?',10,'Scope first. One terminal and the whole store are completely different problems.'],
   ['Remotely reboot the store\'s router right away.',2,'During dinner that could knock out every terminal and the phones. Find out the scope first.'],
   ['Tell them to call the POS vendor.',0,'You own this ticket. Vendors come in after you have narrowed it down.'],
   ['Log a ticket and promise a callback.',3,'A POS down during service is top priority. It needs action now.']]},
  {s:'Only terminal 3 is frozen. The other four work. What next?', c:[
   ['Have staff restart terminal 3 and check that its network cable is plugged in firmly.',10,'The fastest, cheapest fix, touching only the broken device.'],
   ['Restart all five terminals to be safe.',2,'That interrupts four working terminals in the middle of service.'],
   ['Reinstall the POS software on terminal 3.',3,'Too big a step this early. Try the simple fixes first.'],
   ['Escalate to the Director of Technology immediately.',4,'Escalation may come later, but one frozen terminal is a Tier 1 fix first.']]},
  {s:'After the restart, terminal 3 shows "Cannot reach server." The others still work. Most likely cause?', c:[
   ['A network problem at that one terminal: loose cable, bad switch port, or no IP address.',10,'The others reach the server, so the server and internet are fine. Focus on terminal 3\'s connection.'],
   ['The POS vendor\'s cloud is down.',2,'Then every terminal would fail, not just one.'],
   ['The store\'s DNS is broken.',3,'A DNS problem would affect all the terminals.'],
   ['The staff are using it wrong.',0,'The error points to the network, not the user.']]},
  {s:'Reseating the cable fixed it. What do you do before closing the ticket?', c:[
   ['Confirm a test transaction works, document the cause (loose cable at terminal 3), and flag it if it happens again.',10,'Verify, document, prevent: steps 6 and 7 of the troubleshooting method.'],
   ['Close it. It works now.',3,'No verification and no notes means the next tech starts from zero.'],
   ['Order a new terminal.',1,'The hardware is fine. It was the cable.'],
   ['Tell the manager to stop touching cables.',0,'Blame fixes nothing. Document it and consider a cable clip.']]}
 ]},
 {id:'lockout', title:'Locked out again', role:'IT support with Microsoft 365 access', job:'Restaurant IT support', steps:[
  {s:'A caller says: "I\'m Dana from accounting. I\'m locked out. Can you reset my password?"', c:[
   ['Verify her identity with the company\'s process first (for example, call back on the number on file or confirm with her manager).',10,'Always verify before a reset. It protects Dana\'s account.'],
   ['Reset it right away. She sounds stressed.',1,'Skipping verification is how accounts get taken over.'],
   ['Email the new password to her work email.',1,'She cannot read work email while locked out, and you still have not verified her.'],
   ['Ask her to tell you her old password to prove it\'s her.',0,'Never ask anyone for a password.']]},
  {s:'Identity confirmed. Dana says this is her third lockout this week, always right after changing her password. Where do you look?', c:[
   ['The Entra ID sign-in logs, to see which app or device keeps failing.',10,'The logs show where the bad sign-ins come from.'],
   ['Her browser history.',1,'Not related to account lockouts.'],
   ['The printer queue.',0,'Unrelated.'],
   ['Just raise the lockout limit.',2,'That weakens security without finding the cause.']]},
  {s:'The failed sign-ins all come from the mail app on her iPhone, every few minutes. What is happening?', c:[
   ['Her phone still has the old password saved and keeps retrying it.',10,'A classic cause. Update the password on the phone or re-add the account.'],
   ['Her phone needs a new SIM card.',0,'Not related to sign-ins.'],
   ['The email server is broken.',2,'Then many users would be affected, not just Dana.'],
   ['She is typing it wrong on purpose.',0,'The logs show an app retrying automatically.']]},
  {s:'Dana asks you to "just turn off MFA so this stops." What do you do?', c:[
   ['Keep MFA on, explain it protects her account, fix the password saved on the phone, and document the fix.',10,'Fix the real cause; never weaken security for convenience.'],
   ['Turn MFA off for a week.',0,'That removes key protection and likely breaks company policy.'],
   ['Turn it off but tell no one.',0,'Never.'],
   ['Escalate to your manager without fixing anything.',3,'You already know the fix. Solve it, then document it.']]}
 ]},
 {id:'regression', title:'Totals are wrong after release', role:'Software tester on a healthcare billing app', job:'Healthcare billing Software Tester', steps:[
  {s:'After Tuesday\'s release, a user says "the claim totals look wrong." What do you do first?', c:[
   ['Get specifics (which screen, which claim IDs, expected vs. actual amount) and try to reproduce it.',10,'You cannot report what you cannot reproduce.'],
   ['Tell the developers the release is broken.',2,'Too vague for anyone to act on.'],
   ['Roll back the release yourself.',0,'Not a tester\'s decision, and there is no evidence yet.'],
   ['Wait and see if more users complain.',1,'Billing errors cost money. Investigate now.']]},
  {s:'You reproduce it: claims with more than 10 line items show the wrong total. Which bug title is best?', c:[
   ['"Claim total incorrect when a claim has more than 10 line items (Claim Summary page)"',10,'Specific: what, when, and where.'],
   ['"Totals broken"',1,'Too vague.'],
   ['"URGENT!!! Billing is wrong"',0,'Emotion is not information.'],
   ['"Bug in release"',0,'Says nothing useful.']]},
  {s:'Wrong totals on claims going to insurance companies. Severity and priority?', c:[
   ['High severity, high priority: wrong financial results on real claims.',10,'Money and compliance are at stake, right now.'],
   ['Low severity, low priority.',0,'Wrong billing amounts are serious.'],
   ['Low severity, high priority.',3,'The data itself is wrong, so severity is high too.'],
   ['High severity, low priority.',3,'It affects live claims today, so it is urgent.']]},
  {s:'The developer marks it Fixed. What do you test?', c:[
   ['Retest the failing case, test the boundaries (9, 10, 11 line items), then run regression on everything that uses totals: invoices, reports, exports.',10,'Retest, boundaries, then regression around the change.'],
   ['Only the exact claim from the report.',4,'A good start, but the boundaries and related features could still be broken.'],
   ['Close it. The developer said it is fixed.',0,'Testers verify.'],
   ['Manually retest the whole app from scratch.',3,'Too broad and slow. Target the risky areas.']]}
 ]},
 {id:'noc', title:'Five sites down at once', role:'NOC admin', job:'NOC employer NOC Admin', steps:[
  {s:'Monitoring shows 5 customer sites went down within 2 minutes. What first?', c:[
   ['Look for what they share: same ISP, same region, same upstream device, or a planned maintenance window.',10,'Many alerts at once usually means one shared cause.'],
   ['Open 5 separate tickets and work them one by one.',3,'You would solve the same problem five times.'],
   ['Wait 30 minutes to see if they come back.',0,'SLA clocks are already running.'],
   ['Restart the monitoring server.',1,'The alerts are probably real.']]},
  {s:'All 5 sites use the same ISP. How do you organize the tickets?', c:[
   ['Open one master incident, link the 5 site tickets to it, and open a case with the ISP.',10,'One place for updates, and no duplicated work.'],
   ['Close 4 tickets as duplicates without telling anyone.',2,'Each customer still needs updates on their own ticket.'],
   ['Keep 5 separate, unlinked tickets.',3,'Updates get lost and the team duplicates work.'],
   ['Move everything into an email thread.',1,'Email is not a ticketing system.']]},
  {s:'This is a P1 with a 15-minute customer-update SLA. What do you do?', c:[
   ['Send a short update now (what is affected, what you are doing, when the next update comes) and follow the escalation matrix.',10,'Regular, scheduled updates build trust even before the fix.'],
   ['Say nothing until it is fixed.',0,'Silence breaks the SLA and frustrates customers.'],
   ['Tell customers it is the ISP\'s fault and leave it there.',2,'Blame without a plan is not communication.'],
   ['Post about it on social media.',0,'Use the official channels.']]},
  {s:'Service is restored after 50 minutes. What is left to do?', c:[
   ['Confirm each site is really up, close the linked tickets with notes, write the incident timeline, and schedule a root-cause review with the ISP.',10,'Verify, document, learn.'],
   ['Close everything and take a break.',1,'No verification and no timeline.'],
   ['Delete the alerts.',0,'You need them for the review.'],
   ['Move every customer to a new ISP.',0,'Not your decision, and not based on one incident.']]}
 ]},
 {id:'disk', title:'Server disk full', role:'Junior Linux admin', job:'Energy company Jr Linux', steps:[
  {s:'An app on a Linux server stopped saving data. The alert says "disk 100%." First command?', c:[
   ['<code>df -h</code> to see which filesystem is full.',10,'Confirm the alert and find the full mount point.'],
   ['<code>rm -rf /tmp/*</code> right away.',2,'Deleting blindly can break running apps, and /tmp may not even be the full disk.'],
   ['Reboot the server.',1,'It may not free any space, and it causes an outage.'],
   ['<code>top</code>',3,'Shows CPU and memory, not disk.']]},
  {s:'<code>/var</code> is 100% full. How do you find what is using the space?', c:[
   ['<code>sudo du -sh /var/* | sort -h</code>, then drill into the biggest folder.',10,'du shows usage per folder; sort -h puts the biggest last.'],
   ['<code>ls -la /var</code>',3,'Shows files in one folder, but not folder totals.'],
   ['<code>df -h /var</code> again.',2,'You already know it is full. You need to know what is inside.'],
   ['Assume it is logs and delete /var/log.',0,'Never delete whole log folders.']]},
  {s:'The culprit is <code>/var/log/app/app.log</code> at 40 GB, and the app is still writing to it. Best way to free space?', c:[
   ['Save any part you need, then <code>sudo truncate -s 0 app.log</code>, and set up logrotate.',10,'Truncating frees the space immediately, even while the app has the file open.'],
   ['<code>rm app.log</code>',3,'The app still holds the file open, so the space is not freed until it restarts. A classic trap.'],
   ['Move it to your home folder.',1,'Your home folder is probably on the same full disk.'],
   ['Leave it and tell users to wait.',0,'The app is down.']]},
  {s:'Space is back. How do you stop this from happening again?', c:[
   ['Configure logrotate (rotate, compress, keep N days), add a disk alert at 80%, and record the change.',10,'Prevent, monitor, document.'],
   ['Check it by hand every morning.',3,'Not reliable. Automate it.'],
   ['Buy a bigger disk.',4,'Might help for a while, but without rotation the log fills that one too.'],
   ['Turn off the app\'s logging completely.',1,'You lose the information you need for troubleshooting.']]}
 ]}
];

const RANKS = [[0,'Intern'],[150,'Help Desk Rookie'],[400,'Tier 1 Tech'],[800,'Junior Analyst'],[1500,'Analyst'],[2500,'Engineer'],[4000,'Senior Engineer'],[6000,'Architect']];
const BOX_DAYS = [0,1,3,7,14,30];

