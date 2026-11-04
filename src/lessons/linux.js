/* Mini-lessons: Linux (quiz skills) */
Object.assign(LESSONS, {
'quiz:linux:Permissions': {
  why: `"Permission denied" is one of the most common Linux errors. Fixing it safely, without giving everyone full access, is a core admin skill.`,
  idea: `<p>Every file has permissions for three groups: <b>owner</b>, <b>group</b>, <b>others</b>. Each can have <b>r</b> (read), <b>w</b> (write), <b>x</b> (execute).</p>
  <ul class="clean"><li>As numbers: r = 4, w = 2, x = 1. Add them per group: rwx = 7, rw- = 6, r-x = 5, r-- = 4.</li><li><code>chmod 750 file</code> = owner rwx, group r-x, others nothing.</li><li><code>chmod +x script.sh</code> adds execute; <code>chown user:group file</code> changes who owns it.</li></ul>
  <p><b>On a folder, the same letters mean something else:</b></p>
  <ul class="clean"><li><b>r</b>: read the names inside, so <code>ls</code> can list them.</li><li><b>x</b>: pass through it and open an entry by name, if that entry's own permissions allow it. Every folder on a path needs x for you.</li><li><b>w</b> (together with x): create, delete or rename entries inside it. Deleting a file depends on its folder's w, not on the file's own permissions.</li><li><b>r without x</b>: <code>ls</code> shows the names, but you can't open or <code>cd</code> into anything (<code>ls -l</code> shows ? instead of details). <b>x without r</b>: you can open a file whose exact name you know, but <code>ls</code> fails.</li><li>A folder's x is not a file's x: on a file, x means it can run as a program.</li></ul>
  <p>To check: <code>id</code> shows who you are and your groups; <code>ls -l file</code> shows a file; <code>ls -ld dir</code> shows the folder itself (plain <code>ls -l dir</code> shows what's inside); <code>namei -l path</code> shows every folder on the way to a file.</p>`,
  example: `<p>A web app can't read <code>/srv/app/config.yml</code>. <code>ls -l</code> shows <code>-rw------- root root</code>.</p><p>Only root can read it. The app runs as <code>www-data</code>, so give that group read access: <code>sudo chown root:www-data config.yml</code> then <code>sudo chmod 640 config.yml</code> (owner rw, group r, others nothing).</p>`,
  mistakes: [`Using <code>chmod 777</code> to "fix" it. That lets anyone change the file, which is a security hole.`, `Reading the digits in the wrong order. It is always owner, group, others.`, `Treating a folder's x as "list it". r lists the names; x lets you pass through to an entry you name. Opening a file needs x on every folder on its path.`],
  say: `I fix permissions with least privilege: give only the user or group that needs access exactly what it needs, like 640 for a config file, never 777.`
},
'quiz:linux:Everyday commands': {
  why: `Every Linux task starts with moving around, reading files and searching. Being fluent here makes everything else faster.`,
  idea: `<ul class="clean"><li><code>pwd</code> where am I · <code>ls -la</code> list everything · <code>cd</code> move</li><li><code>cat</code>, <code>less</code>, <code>head</code>, <code>tail</code> read files (<code>tail -f</code> follows a live log)</li><li><code>cp</code> copy · <code>mv</code> move or rename · <code>rm</code> delete (no recycle bin!) · <code>mkdir</code> new folder</li><li><code>grep word file</code> search text · <code>wc -l</code> count lines · <code>|</code> sends one command's output into the next</li></ul>`,
  example: `<p>How many failed SSH logins are in today's log?</p><p><code>grep "Failed password" /var/log/auth.log | wc -l</code></p><p>grep keeps only the matching lines; the pipe sends them to <code>wc -l</code>, which counts them.</p>`,
  mistakes: [`Using <code>rm -rf</code> on the wrong path. Double-check with <code>ls</code> first.`, `Opening huge logs with <code>cat</code>. Use <code>less</code> or <code>tail</code>.`, `Forgetting that Linux is case-sensitive: <code>Report.txt</code> and <code>report.txt</code> are different files.`],
  say: `I chain small commands with pipes, like grep into wc -l, to answer questions about logs quickly.`
},
'quiz:linux:Filesystem layout': {
  why: `Knowing where things live means you can find logs, configs and programs on any Linux server, even one you've never seen.`,
  idea: `<ul class="clean"><li><code>/etc</code>: configuration files (e.g. <code>/etc/ssh/sshd_config</code>)</li><li><code>/var/log</code>: logs (syslog, auth.log, app logs)</li><li><code>/home/name</code>: each user's files · <code>/root</code>: the root user's home</li><li><code>/tmp</code>: temporary files, often cleared on reboot</li><li><code>/usr/bin</code>, <code>/bin</code>: programs · <code>/opt</code>: add-on software</li></ul>`,
  example: `<p>Nginx won't start after an edit.</p><p>Its config lives in <code>/etc/nginx/</code>; test it with <code>sudo nginx -t</code>. Its logs live in <code>/var/log/nginx/</code>; check <code>error.log</code> for the line it complains about.</p>`,
  mistakes: [`Looking for logs in <code>/etc</code>, or configs in <code>/var/log</code>.`, `Saving important files in <code>/tmp</code>; they can disappear on reboot.`, `Editing config files without making a backup copy first.`],
  say: `On any Linux box I check /etc for the config and /var/log for the logs; that covers most troubleshooting.`
},
'quiz:linux:Scheduling (cron)': {
  why: `Backups, cleanups and reports run on schedules. You'll need to read and write cron lines, and debug jobs that "didn't run."`,
  idea: `<p>A cron line has five time fields, then the command:</p>
  <p><code>minute hour day-of-month month weekday command</code></p>
  <ul class="clean"><li><code>*</code> means "every." Weekday: 0 = Sunday … 6 = Saturday.</li><li>Edit your jobs with <code>crontab -e</code>; list them with <code>crontab -l</code>.</li></ul>`,
  example: `<p>Run a backup at 2:30 AM every Monday:</p><p><code>30 2 * * 1 /opt/backup.sh</code></p><p>Minute 30, hour 2, any day of month, any month, weekday 1 (Monday).</p>`,
  mistakes: [`Swapping minute and hour (<code>2 30</code> is invalid).`, `Writing <code>* 2 * * *</code>, which runs every minute from 2:00 to 2:59.`, `Assuming the job has your normal environment. Cron runs with a minimal PATH, so use full paths.`],
  say: `Cron fields are minute, hour, day, month, weekday; when a job doesn't run, I check the syntax, use full paths, and look at the cron log.`
},
'quiz:linux:Admin tools': {
  why: `When a server misbehaves you need the right tool fast: disk, memory, ports, services or logs.`,
  idea: `<ul class="clean"><li>Disk: <code>df -h</code> (free space per disk) · <code>du -sh /path/*</code> (what's using it)</li><li>Memory: <code>free -h</code> · Processes: <code>top</code>, <code>ps aux</code></li><li>Ports: <code>ss -tulpn</code> (what is listening, and which program)</li><li>Services: <code>systemctl status|start|stop|restart|enable name</code> · Logs: <code>journalctl -u name</code></li></ul>`,
  example: `<p>"The website is down." Run <code>systemctl status nginx</code>: it's <b>failed</b>. <code>journalctl -u nginx</code> shows "No space left on device." <code>df -h</code> confirms <code>/</code> is 100% full, and <code>du -sh /var/log/*</code> finds a huge log. Free the space, then <code>systemctl restart nginx</code>.</p>`,
  mistakes: [`Restarting a service without reading its log first. You lose the clue.`, `Confusing <code>df</code> (free space) with <code>du</code> (usage by folder).`, `Forgetting <code>enable</code>, so the service doesn't come back after a reboot.`],
  say: `I check the service status, read its log with journalctl, then look at disk, memory and ports to find the root cause before restarting anything.`
}
});
