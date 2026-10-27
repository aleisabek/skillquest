/* Mini-lessons: Terminal skills (typing real commands). One per topic of the Linux flashcard deck. */
Object.assign(LESSONS, {
'term:linux:Files & names': {
  why: `Creating, copying, renaming and deleting files is daily work, and odd file names (a dash, spaces) are exactly what Bandit uses to trip you up.`,
  idea: `<ul class="clean"><li><code>touch f</code> new empty file · <code>mkdir -p a/b/c</code> folders, parents included</li><li><code>cp src dst</code> copy (<code>-r</code> for folders) · <code>mv old new</code> rename or move · <code>rm f</code> delete (<code>-r</code> for folders)</li><li>Name starts with a dash: <code>cat ./-file07</code> or <code>cat -- -file07</code></li><li>Name has spaces: <code>cat "my notes.txt"</code> or <code>cat my\\ notes.txt</code></li><li><code>ln -s TARGET LINK</code>: a shortcut (symbolic link)</li></ul>`,
  example: `<p>Back up a config before editing it: <code>cp config.yml config.yml.bak</code>. A file named just <code>-</code> is read with <code>cat ./-</code>.</p>`,
  mistakes: [`<code>rm -r</code> has no undo; check the path first.`, `Forgetting <code>-r</code> when copying or deleting a folder.`, `Typing <code>cat -file07</code>: the dash makes it look like an option.`],
  say: `Before I change a config I copy it to a .bak file, so I can roll back instantly.`
},
'term:linux:Reading & identifying': {
  why: `Most troubleshooting is reading: configs, logs, mystery files. Knowing what a file is before opening it saves time and your terminal.`,
  idea: `<ul class="clean"><li><code>cat</code> whole file · <code>less</code> scroll (q quits, / searches) · <code>head -n 20</code> / <code>tail -n 20</code> first or last lines</li><li><code>wc -l f</code> count lines · <code>sed -n 14p f</code> just line 14</li><li><code>file f</code> what kind of data it is · <code>file ./*</code> check everything here</li><li><code>ls -la</code> hidden files and details · <code>stat f</code> size, owner, times</li><li><code>strings f</code> readable text inside binary data</li></ul>`,
  example: `<p>Ten files in <code>inhere</code> and only one is text: <code>file ./*</code> shows "ASCII text" next to the right one.</p>`,
  mistakes: [`Running <code>cat</code> on a 2 GB log or a binary file.`, `Forgetting <code>-a</code>, so dot files stay hidden.`],
  say: `I check a file's type with file before opening it, and use tail or less for big logs.`
},
'term:linux:Finding': {
  why: `Finding the one file on a whole server, by name, size, owner or age, is a constant need in IT and in Bandit.`,
  idea: `<ul class="clean"><li><code>find DIR -name "*.log"</code> by name (quote the star)</li><li><code>-type f</code> files only · <code>-size 1033c</code> exact bytes · <code>-mtime -7</code> changed in the last 7 days</li><li><code>-user NAME -group NAME</code> by owner · <code>! -executable</code> not executable</li><li><code>2&gt;/dev/null</code> hides "Permission denied" noise</li><li><code>which nginx</code> where a program lives</li></ul>`,
  example: `<p>A human-readable file of exactly 1033 bytes that isn't executable: <code>find . -type f -size 1033c ! -executable</code>.</p>`,
  mistakes: [`Forgetting the <code>c</code>: <code>-size 1033</code> means 1033 blocks of 512 bytes.`, `Searching from <code>/</code> without <code>2&gt;/dev/null</code> and drowning in errors.`],
  say: `I narrow find with type, size, owner and age, and hide permission errors so the real result stands out.`
},
'term:linux:Filtering text': {
  why: `Logs have thousands of lines. Filtering down to the few that matter is the core skill of log analysis and SOC work.`,
  idea: `<ul class="clean"><li><code>grep WORD f</code> matching lines · <code>-i</code> any case · <code>-v</code> NOT matching · <code>-c</code> count · <code>-rn</code> whole folder with line numbers</li><li><code>sort f | uniq -u</code> lines that appear once · <code>sort | uniq -c | sort -nr</code> most common first</li><li><code>cut -d, -f2</code> a column · <code>awk '{print $1}'</code> a field</li><li><code>sed 's/old/new/g'</code> replace text in the output</li><li><code>tail -f log | grep ERROR</code> watch live</li></ul>`,
  example: `<p>Which IP fails to log in most? <code>grep "Failed password" auth.log | awk '{print $11}' | sort | uniq -c | sort -nr | head</code>.</p>`,
  mistakes: [`<code>uniq</code> without <code>sort</code>: it only compares neighbouring lines.`, `Putting the file before the pattern: it's <code>grep PATTERN FILE</code>.`],
  say: `I chain grep, sort, uniq and awk to turn a huge log into a short ranked list.`
},
'term:linux:Encoding & hashing': {
  why: `Encoded data shows up everywhere: base64 in emails and tokens, hex in dumps, hashes to prove a download wasn't tampered with.`,
  idea: `<ul class="clean"><li><code>base64 -d f</code> decode · <code>base64 f</code> encode</li><li><code>xxd f</code> hex dump · <code>xxd -r dump &gt; out</code> back to binary</li><li>ROT13: <code>tr 'A-Za-z' 'N-ZA-Mn-za-m'</code></li><li><code>sha256sum f</code> fingerprint · <code>sha256sum -c list</code> verify many</li></ul>`,
  example: `<p>Verify an ISO: compare <code>sha256sum ubuntu.iso</code> with the hash on the download page. One different character means a different file.</p>`,
  mistakes: [`Calling base64 "encryption". It's encoding: anyone can decode it.`, `Using MD5 to prove integrity against attackers; it's broken, use SHA-256.`],
  say: `Encoding isn't security. For integrity I check a SHA-256 hash against the publisher's.`
},
'term:linux:Archives': {
  why: `Backups, log rotation and file transfers all use archives, and some puzzles hide a file under many layers of compression.`,
  idea: `<ul class="clean"><li><code>tar -czf out.tar.gz dir/</code> create · <code>tar -xzf f.tar.gz</code> extract · <code>tar -tf f.tar</code> list</li><li>Letters: c create, x extract, t list, f file; z gzip, j bzip2, J xz</li><li><code>gunzip</code> / <code>bzip2 -d</code> / <code>xz -d</code> / <code>unzip</code></li><li><code>zcat f.gz</code> read without unpacking · <code>mktemp -d</code> a safe scratch folder</li></ul>`,
  example: `<p>An unknown file: run <code>file data</code>, rename it to the extension it reports, decompress, and repeat until <code>file</code> says ASCII text. Do it inside <code>mktemp -d</code>.</p>`,
  mistakes: [`Mixing up <code>-c</code> and <code>-x</code>.`, `Guessing the format from the name instead of checking with <code>file</code>.`],
  say: `I check the real format with file, then use the matching tool: tar, gzip, bzip2 or xz.`
},
'term:linux:Networking': {
  why: `Reaching servers, checking ports and talking to services are the first steps in nearly every remote or security task.`,
  idea: `<ul class="clean"><li><code>ping -c 4 host</code> reachable? · <code>traceroute host</code> each hop · <code>dig name</code> DNS lookup</li><li><code>ssh user@host -p 2220</code> log in · <code>ssh -i key user@host</code> with a key · <code>scp f user@host:/tmp/</code> copy</li><li><code>ss -tuln</code> listening ports · <code>nmap -p 1-1000 host</code> scan</li><li><code>nc host port</code> raw connection · <code>nc -l port</code> listen · <code>openssl s_client -connect host:port</code> TLS</li><li><code>curl -I url</code> HTTP headers</li></ul>`,
  example: `<p>Which local port in a range speaks TLS? <code>nmap -p 31000-32000 localhost</code> lists the open ones; <code>openssl s_client -connect localhost:PORT</code> tests each.</p>`,
  mistakes: [`Running ping without -c on Linux; it never stops (Ctrl+C).`, `Assuming "no ping reply" means down; many servers block ping.`, `Scanning hosts you don't own or have permission to test.`],
  say: `I go layer by layer: ping, DNS with dig, then the port with ss, nc or curl.`
},
'term:linux:Users, processes & privilege': {
  why: `Who you are, what's running and what you're allowed to do decide almost every "permission denied" and "it's hung" ticket.`,
  idea: `<ul class="clean"><li><code>id</code> / <code>whoami</code> who am I · <code>su user</code> switch · <code>sudo -l</code> what I may run as root</li><li><code>chmod 640 f</code> exact permissions (r4 w2 x1) · <code>chmod +x</code> executable · <code>chown -R u:g dir</code> owner</li><li><code>ps aux | grep name</code> or <code>pgrep</code> find a process · <code>kill PID</code>, <code>kill -9 PID</code> force</li><li><code>lsof -i :443</code> who holds a port · <code>useradd -m</code>, <code>usermod -aG group user</code></li><li>An <code>s</code> in <code>-rwsr-xr-x</code> is setuid: it runs as its owner</li></ul>`,
  example: `<p>The web app can't write uploads: <code>sudo chown -R www-data:www-data /var/www/uploads</code>, not <code>chmod 777</code>.</p>`,
  mistakes: [`<code>chmod -R 777</code>: never.`, `<code>usermod -G</code> without <code>-a</code> removes the user's other groups.`, `Reaching for <code>kill -9</code> first; try a normal kill so the app can clean up.`],
  say: `I give each account only the access it needs, and find the process before I kill it.`
},
'term:linux:Git': {
  why: `Every dev, DevOps and security team uses git, and secrets often hide in a repository's history, branches and tags.`,
  idea: `<ul class="clean"><li><code>git status</code> · <code>git log --oneline</code> · <code>git log -p</code> history with changes · <code>git show HASH</code></li><li><code>git branch -a</code> all branches · <code>git switch NAME</code> · <code>git tag</code></li><li><code>git stash list</code> · <code>git blame f</code> who changed each line</li><li><code>git clone ssh://user@host:PORT/path</code></li></ul>`,
  example: `<p>A secret was "removed" in a later commit: <code>git log -p</code> still shows the old line. That's why you rotate leaked keys, not just delete them.</p>`,
  mistakes: [`Thinking a deleted file is gone from git; it's still in history.`, `Only looking at the current branch; check <code>branch -a</code> and tags too.`],
  say: `If a secret is committed I treat it as leaked and rotate it, because history keeps it.`
},
'term:linux:Shell & environment': {
  why: `Variables, aliases and small loops turn a ten-minute repetitive job into one line, and explain why a command works for you but not in a script.`,
  idea: `<ul class="clean"><li><code>echo $HOME</code> read a variable · <code>export NAME=value</code> set it for child programs</li><li><code>alias ll='ls -la'</code> · <code>source ~/.bashrc</code> reload settings · <code>man cmd</code> · <code>history</code></li><li><code>a &amp;&amp; b</code> run b only if a worked</li><li><code>for i in {1..5}; do echo $i; done</code></li><li><code>nohup job &amp;</code> survive logout · <code>time cmd</code> · <code>watch -n 2 cmd</code></li></ul>`,
  example: `<p>Push only after the tests pass: <code>npm test &amp;&amp; git push</code>.</p>`,
  mistakes: [`Spaces around <code>=</code>: <code>export A = 1</code> fails.`, `Setting a variable without <code>export</code>, then wondering why a script can't see it.`],
  say: `I chain steps with && so a failed step stops the rest, and loop instead of repeating commands by hand.`
},
'term:linux:Redirection': {
  why: `Redirects decide where output goes: a file, another command, or nowhere. Scripts, cron jobs and Bandit all depend on them.`,
  idea: `<ul class="clean"><li><code>&gt;</code> write (overwrite) · <code>&gt;&gt;</code> append · <code>&lt;</code> read a file as input</li><li><code>|</code> pipe output into the next command · <code>| tee f</code> screen and file</li><li><code>2&gt;/dev/null</code> hide errors · <code>&gt; f 2&gt;&amp;1</code> output and errors to one file</li><li><code>nc localhost 30000 &lt; pass.txt</code> send a file to a port</li></ul>`,
  example: `<p>A cron job that keeps a log of everything: <code>./backup.sh &gt;&gt; backup.log 2&gt;&amp;1</code>.</p>`,
  mistakes: [`<code>&gt;</code> when you meant <code>&gt;&gt;</code>; the old content is gone.`, `Writing <code>2&gt;&amp;1 &gt; f</code>; order matters, put <code>2&gt;&amp;1</code> last.`],
  say: `I send errors and output to a log with >> file 2>&1 so failed scheduled jobs leave evidence.`
},
'term:linux:Admin': {
  why: `Keeping a server healthy means checking disk, memory and services, installing software, and scheduling jobs.`,
  idea: `<ul class="clean"><li><code>df -h</code> disk free · <code>du -sh /path/*</code> what uses it · <code>free -h</code> memory · <code>uptime</code> · <code>uname -a</code> · <code>lsblk</code></li><li><code>systemctl status|start|stop|restart|enable name</code> · <code>journalctl -u name -n 50</code></li><li><code>sudo apt update</code> then <code>sudo apt install name</code> · <code>sudo ufw allow 443</code></li><li>cron: <code>crontab -e</code> / <code>-l</code>; fields <code>minute hour day month weekday</code></li><li><code>truncate -s 0 app.log</code> empty a live log · logins are in <code>/var/log/auth.log</code></li></ul>`,
  example: `<p>Disk at 100%: <code>df -h</code> shows which drive, <code>du -sh /var/log/* | sort -h</code> shows the culprit, truncate or archive it, then check the app with <code>systemctl status</code>.</p>`,
  mistakes: [`Deleting a log that's still open; the space isn't freed until the program restarts. Truncate it.`, `Starting a service but not enabling it, so it's gone after reboot.`, `Writing the cron hour first, or using 12-hour time.`],
  say: `I check df and du first, fix the cause, and confirm with systemctl status and the journal.`
}
});
