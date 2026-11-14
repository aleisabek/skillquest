TITLE="The backup never runs"
LEVEL="L2 · Scheduling (cron)"
GOAL="How Linux runs jobs on a schedule (cron), and reading a schedule line to see when it really runs."
LESSON="Reading cron fields (minute hour day month weekday) and spotting a swapped schedule."
HINTS=(
  "Read the file: cat backup.cron   The five fields are minute, hour, day-of-month, month, weekday."
  "The first field is the MINUTE. 2:30 AM is minute 30, hour 2. Monday is weekday 1."
  "Edit the line so it starts with: 30 2 * * 1   (nano backup.cron, or sed)"
)
lab_setup() {
  printf '# Nightly database backup (should run at 02:30 every Monday)\n2 30 * * 1 %s/backup.sh\n' "$DIR" > "$DIR/backup.cron"
  printf '#!/bin/bash\necho backup\n' > "$DIR/backup.sh"; chmod 755 "$DIR/backup.sh"
}
lab_mission() {
  echo "backup.cron should run backup.sh at 02:30 every Monday, but the backup never happens."
  echo "Fix the schedule line in backup.cron. (Practice file only: it is not installed into your real crontab.)"
}
lab_check() {
  line=$(grep -v '^\s*#' "$DIR/backup.cron" | grep -v '^\s*$' | head -1)
  # read (not set --) so the * fields are never expanded into file names
  read -r f1 f2 f3 f4 f5 f6 <<< "$line"
  # numbers may be written with a leading zero (02 = 2) and Monday as 1, 01 or mon, any case: cron accepts all of them
  if [[ "${f1:-}" =~ ^0*30$ ]] && [[ "${f2:-}" =~ ^0*2$ ]] && [ "${f3:-}" = '*' ] && [ "${f4:-}" = '*' ] && echo "${f5:-}" | grep -qiE '^(0*1|mon)$'; then ok "schedule is 30 2 * * 1 (02:30 every Monday)"
  else bad "schedule is '${f1:-} ${f2:-} ${f3:-} ${f4:-} ${f5:-}'; it should mean 02:30 every Monday"; fi
  if [ "${f6:-}" = "$DIR/backup.sh" ]; then ok "command still points to backup.sh"; else bad "the command part was changed"; fi
}
