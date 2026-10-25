TITLE="Disk filling up"
LEVEL="L2 · Disk & logs"
LESSON="du to find space hogs, why rm on an open log doesn't free space, truncating safely."
HINTS=(
  "Find what's big: du -sh var/* | sort -h   then go deeper into the biggest folder."
  "Something still has the big file open: check with  ls -l /proc/\$(cat .pid)/fd  (or lsof if you have it). Deleting it would NOT free the space."
  "Empty the file in place without deleting it: truncate -s 0 PATH/TO/FILE  (or  : > PATH/TO/FILE)"
)
lab_setup() {
  mkdir -p "$DIR/var/log/app" "$DIR/var/log/nginx" "$DIR/var/cache" "$DIR/var/backups"
  for i in 1 2 3; do head -c 200000 /dev/urandom | base64 > "$DIR/var/log/nginx/access.log.$i"; done
  head -c 300000 /dev/urandom | base64 > "$DIR/var/cache/pkg.cache"
  head -c 500000 /dev/urandom | base64 > "$DIR/var/backups/db-2026-10-01.sql"
  yes "2026-10-25 12:00:01 ERROR payment-service retry failed: upstream timeout" | head -n 400000 > "$DIR/var/log/app/payments.log"
  # A fake app keeps the log open, like a real service would.
  nohup bash -c "exec 3>>'$DIR/var/log/app/payments.log'; while sleep 5; do :; done" >/dev/null 2>&1 &
  echo $! > "$DIR/.pid"; disown 2>/dev/null || true
  du -sb "$DIR/var/backups" | cut -f1 > "$DIR/.backups_size"
}
lab_mission() {
  echo "Monitoring says the server's disk is almost full. In ./var, find the single biggest file."
  echo "It's a log that the running payment app is still writing to (pid $(cat "$DIR/.pid" 2>/dev/null))."
  echo "Free its space WITHOUT deleting the file and without stopping the app."
  echo "Leave the database backup alone."
}
lab_check() {
  f="$DIR/var/log/app/payments.log"
  if [ -f "$f" ]; then ok "payments.log still exists"; else bad "payments.log was deleted; with the app holding it open, the space would NOT be freed"; fi
  s=$(stat -c %s "$f" 2>/dev/null || echo 999999999)
  if [ "$s" -lt 1024 ]; then ok "payments.log emptied ($s bytes)"; else bad "payments.log is still $s bytes"; fi
  pid=$(cat "$DIR/.pid" 2>/dev/null); if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then ok "the app is still running"; else bad "the app (pid $pid) was stopped; you were asked to keep it running"; fi
  if [ "$(du -sb "$DIR/var/backups" | cut -f1)" = "$(cat "$DIR/.backups_size")" ]; then ok "database backup untouched"; else bad "the database backup was changed"; fi
}
lab_cleanup() { pid=$(cat "$DIR/.pid" 2>/dev/null) && kill "$pid" 2>/dev/null; true; }
