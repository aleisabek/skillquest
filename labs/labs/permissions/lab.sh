TITLE="Permission denied"
LEVEL="L1 · Permissions"
LESSON="chmod with numbers and +x, reading ls -l, least privilege."
HINTS=(
  "Look at the permissions first: ls -l"
  "A script needs the execute (x) bit to run with ./backup.sh. chmod u+x adds it for the owner."
  "600 means owner read+write, nobody else anything. chmod 600 secrets.conf"
)
lab_setup() {
  printf '#!/bin/bash\necho "backup complete"\n' > "$DIR/backup.sh"; chmod 644 "$DIR/backup.sh"
  printf 'db_password=Sup3rS3cret!\napi_key=sq_live_example_only\n' > "$DIR/secrets.conf"; chmod 666 "$DIR/secrets.conf"
}
lab_mission() {
  echo "Two problems in this folder:"
  echo "  1. ./backup.sh fails with \"Permission denied\". Make it runnable by you (the owner)."
  echo "  2. secrets.conf holds passwords but anyone on the system can read AND change it."
  echo "     Lock it down so only you (the owner) can read and write it, and nobody else can do anything."
}
lab_check() {
  if [ -x "$DIR/backup.sh" ] && [ "$("$DIR/backup.sh" 2>/dev/null)" = "backup complete" ]; then ok "backup.sh runs"; else bad "backup.sh still can't run (needs the execute bit)"; fi
  p=$(stat -c %a "$DIR/secrets.conf" 2>/dev/null)
  if [ "$p" = 600 ]; then ok "secrets.conf is 600 (owner only)"; else bad "secrets.conf is $p; it should be 600"; fi
  if grep -q Sup3rS3cret "$DIR/secrets.conf" 2>/dev/null; then ok "secrets.conf contents intact"; else bad "secrets.conf was changed or deleted"; fi
}
