TITLE="Archive old logs"
LEVEL="L2 · Files & archives"
GOAL="Cleaning up by a written policy: picking files by age, archiving them, and deleting only what the policy says."
LESSON="find with -mtime, tar -czf, and checking before you delete."
HINTS=(
  "List files older than 7 days: find logs -name '*.log' -mtime +7"
  "Archive exactly those: tar -czf old-logs.tar.gz \$(find logs -name '*.log' -mtime +7)"
  "Check the archive (tar -tzf old-logs.tar.gz), THEN delete the originals: find logs -name '*.log' -mtime +7 -delete"
)
lab_setup() {
  mkdir -p "$DIR/logs"
  for d in 2 3 5; do echo "recent log $d" > "$DIR/logs/app-recent-$d.log"; touch -d "$d days ago" "$DIR/logs/app-recent-$d.log"; done
  for d in 9 14 30 45; do echo "old log $d" > "$DIR/logs/app-old-$d.log"; touch -d "$d days ago" "$DIR/logs/app-old-$d.log"; done
  echo "keep me" > "$DIR/logs/README.txt"; touch -d "60 days ago" "$DIR/logs/README.txt"
}
lab_mission() {
  echo "The logs folder is growing forever. Company policy:"
  echo "  • Put every .log file older than 7 days into a single archive: old-logs.tar.gz (in this folder)"
  echo "  • Then delete those old .log files"
  echo "  • Keep the recent logs and anything that isn't a .log file"
}
lab_check() {
  a="$DIR/old-logs.tar.gz"
  if [ -f "$a" ] && tar -tzf "$a" >/dev/null 2>&1; then
    n=$(tar -tzf "$a" | grep -c 'app-old-.*\.log$'); r=$(tar -tzf "$a" | grep -c 'recent\|README')
    if [ "$n" = 4 ] && [ "$r" = 0 ]; then ok "archive has exactly the 4 old logs"; else bad "archive should hold the 4 old logs only (found $n old, $r others)"; fi
  else bad "old-logs.tar.gz is missing or not a valid gzip tar archive"; fi
  left=$(ls "$DIR/logs" | grep -c 'app-old'); if [ "$left" = 0 ]; then ok "old logs removed"; else bad "$left old log(s) still in logs/"; fi
  keep=$(ls "$DIR/logs" | grep -c 'recent\|README'); if [ "$keep" = 4 ]; then ok "recent logs and README kept"; else bad "something that should be kept was deleted"; fi
}
