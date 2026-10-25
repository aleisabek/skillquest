/* Mini-lessons: Terminal skills (typing real commands) */
Object.assign(LESSONS, {
'term:linux:Reading files': {
  why: `Most troubleshooting is reading: configs, logs, data files. Picking the right reader saves time and avoids flooding your screen.`,
  idea: `<ul class="clean"><li><code>cat file</code>: print it all (small files)</li><li><code>less file</code>: scroll through big files (q to quit, / to search)</li><li><code>head -n 20 file</code> / <code>tail -n 20 file</code>: first or last 20 lines</li><li><code>wc -l file</code>: count lines</li></ul>`,
  example: `<p>"Show the last 50 lines of app.log": <code>tail -n 50 app.log</code> (or <code>tail -50 app.log</code>).</p>`,
  mistakes: [`Using <code>cat</code> on a 2 GB log.`, `Forgetting <code>-n</code> takes a number: <code>tail -n 50</code>, not <code>tail -50n</code>.`],
  say: `For logs I use tail for the newest lines and less to search through the whole file.`
},
'term:linux:Files & folders': {
  why: `Creating, copying and renaming files safely is daily work, from backups to deploying configs.`,
  idea: `<ul class="clean"><li><code>mkdir name</code> new folder (<code>-p</code> creates parent folders too)</li><li><code>cp source destination</code> copy (<code>-r</code> for folders)</li><li><code>mv old new</code> rename or move</li><li><code>rm file</code> delete, permanently</li></ul>`,
  example: `<p>Back up a config before editing it: <code>cp config.yml config.yml.bak</code>. Then rename old reports: <code>mv report.md old_report.md</code>.</p>`,
  mistakes: [`Overwriting a file with <code>cp</code> or <code>mv</code> without noticing; use <code>-i</code> to be asked first.`, `Forgetting <code>-r</code> when copying a folder.`],
  say: `Before I change a config, I copy it to a .bak file so I can roll back instantly.`
},
'term:linux:Searching': {
  why: `Finding the one error line in thousands, or the one file on a whole server, is a constant need.`,
  idea: `<ul class="clean"><li><code>grep word file</code>: lines containing the word (<code>-i</code> ignore case, <code>-r</code> search folders, <code>-n</code> line numbers)</li><li><code>find where -name "name"</code>: files by name, e.g. <code>find ~ -name "report.pdf"</code></li></ul>`,
  example: `<p>Which config files mention port 8080? <code>grep -rn "8080" /etc/nginx/</code> shows each file and line number.</p>`,
  mistakes: [`Putting the file before the pattern: it's <code>grep PATTERN FILE</code>.`, `Searching from <code>/</code> with find when you know the folder; it's slow and noisy.`],
  say: `I use grep -rn to find which file and line contains a setting, and find to locate files by name.`
},
'term:linux:Permissions & ownership': {
  why: `Scripts that won't run and apps that can't read their files are fixed with chmod and chown.`,
  idea: `<ul class="clean"><li><code>chmod +x script.sh</code>: make a script executable</li><li><code>chmod 640 file</code>: set exact permissions with numbers</li><li><code>chown -R user:group path</code>: change owner and group, for a whole folder with -R</li></ul>`,
  example: `<p>The web server (user www-data) can't write uploads: <code>sudo chown -R www-data:www-data /var/www/uploads</code>.</p>`,
  mistakes: [`Running <code>chmod -R 777</code> on a folder. Never do that.`, `Forgetting <code>sudo</code> when changing files you don't own.`],
  say: `I give the service account ownership of only the folder it needs, instead of opening permissions to everyone.`
},
'term:linux:Networking': {
  why: `Checking whether a server is reachable and connecting to it are the first steps in almost every remote task.`,
  idea: `<ul class="clean"><li><code>ping -c 4 host</code>: is it reachable? (-c sets how many pings on Linux)</li><li><code>ssh user@host</code>: open a secure shell on a remote machine</li><li><code>ip a</code>: show this machine's IP addresses</li></ul>`,
  example: `<p>Check that db01 is up, then log in as admin: <code>ping -c 4 db01.internal</code>, then <code>ssh admin@db01.internal</code>.</p>`,
  mistakes: [`Running ping without -c on Linux; it never stops (Ctrl+C ends it).`, `Assuming "no ping reply" means down; many servers block ping.`],
  say: `I confirm reachability with ping, then connect with SSH keys rather than passwords.`
},
'term:linux:Services & logs': {
  why: `On modern Linux, systemd runs the services. Starting, stopping and reading their logs is core admin work.`,
  idea: `<ul class="clean"><li><code>systemctl status name</code> · <code>start</code> · <code>stop</code> · <code>restart</code> · <code>enable</code> (start at boot)</li><li><code>journalctl -u name</code>: that service's log</li><li><code>tail -f app.log | grep ERROR</code>: watch a log live, only errors</li><li><code>truncate -s 0 app.log</code>: empty a log without deleting it</li></ul>`,
  example: `<p>After changing nginx's config: <code>sudo systemctl restart nginx</code>, then <code>systemctl status nginx</code> to confirm it's "active (running)".</p>`,
  mistakes: [`Deleting a log that's still being written; the space isn't freed until the program restarts. Truncate instead.`, `Starting a service but not enabling it, so it's gone after reboot.`],
  say: `I restart with systemctl, confirm with status, and read journalctl if it fails.`
},
'term:linux:Disk & archives': {
  why: `Full disks take down apps, and archives are how you back up or move folders.`,
  idea: `<ul class="clean"><li><code>du -sh /path/*</code>: size of each item (add <code>| sort -h</code> to sort)</li><li><code>tar -czf name.tar.gz folder/</code>: create a compressed archive (c create, z gzip, f file)</li><li><code>tar -xzf name.tar.gz</code>: extract it</li></ul>`,
  example: `<p>Archive the logs folder before cleaning it: <code>tar -czf logs.tar.gz logs/</code>.</p>`,
  mistakes: [`Mixing up <code>-c</code> (create) and <code>-x</code> (extract), which can overwrite files.`, `Using <code>du</code> without <code>-h</code> and misreading the sizes.`],
  say: `When a disk fills up I use du to find the biggest folders, archive what we need to keep, and then clean up.`
},
'term:linux:Scheduling (cron)': {
  why: `Writing a correct schedule from a plain-English request is a common admin task and interview check.`,
  idea: `<p>Five fields: <code>minute hour day-of-month month weekday</code>. <code>*</code> = every. Sunday = 0 (or 7).</p>`,
  example: `<p>"Every Friday at 18:05" → <code>5 18 * * 5</code>. "Every day at 07:00" → <code>0 7 * * *</code>.</p>`,
  mistakes: [`Writing the hour first.`, `Using 12-hour time; cron hours go 0–23.`],
  say: `I translate the request into minute, hour, day, month, weekday, and double-check it with a cron tool before saving.`
}
});
