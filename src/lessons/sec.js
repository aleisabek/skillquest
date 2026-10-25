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
}
});
