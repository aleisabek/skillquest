#!/usr/bin/env bash
# Runs every lab end to end in a throwaway HOME: start -> check fails -> wrong fix is caught -> right fix passes -> reset.
# Run from Windows: wsl bash /mnt/c/Users/User/Documents/SkillQuest/labs/test-labs.sh
set -u
SRC="$(cd "$(dirname "$0")" && pwd)"
# Throwaway HOME; refuse to go on unless it really is a fresh folder under /tmp (it is deleted at the end).
T="$(mktemp -d)" || exit 1
case "$T" in /tmp/?*) ;; *) echo "mktemp gave an unexpected path: $T"; exit 1;; esac
export HOME="$T"
bash "$SRC/install.sh" >/dev/null
SQ="$HOME/.skillquest-labs/sq-lab"
fails=0; pass(){ echo "  ok   $*"; }; fail(){ echo "  FAIL $*"; fails=$((fails+1)); }
expect() { # expect pass|fail LAB
  if bash "$SQ" check "$2" >"$T/check.out" 2>&1; then r=pass; else r=fail; fi
  [ "$r" = "$1" ] && pass "$2: check result '$1' as expected" || { fail "$2: expected check result '$1'"; sed 's/^/        /' "$T/check.out"; }
}
run() { local lab=$1 wrong=$2 right=$3 wrong2=${4:-}   # wrong2: a second wrong fix, e.g. secure but broken
  echo "[$lab]"; bash "$SQ" start "$lab" >/dev/null; cd "$HOME/sq-labs/$lab" || return
  expect fail "$lab"
  for w in "$wrong" "$wrong2"; do
    if [ -n "$w" ]; then bash "$SQ" start "$lab" >/dev/null; cd "$HOME/sq-labs/$lab"; eval "$w"; expect fail "$lab"; fi
  done
  if [ -n "$wrong$wrong2" ]; then bash "$SQ" start "$lab" >/dev/null; cd "$HOME/sq-labs/$lab"; fi
  eval "$right"; expect pass "$lab"
  code=$(bash "$SQ" code "$lab"); grep -q "$code" "$T/check.out" && pass "$lab: completion code $code shown" || fail "$lab: completion code missing"
  bash "$SQ" reset "$lab" >/dev/null; [ ! -d "$HOME/sq-labs/$lab" ] && pass "$lab: reset cleans up" || fail "$lab: reset left files"
  cd "$HOME"
}
# try LAB pass|fail MODE: a fresh start, then one fixture mode (alt = a different valid fix; crash = breaks the checker's inputs)
try() { echo "[$1 · $3]"; bash "$SQ" start "$1" >/dev/null; cd "$HOME/sq-labs/$1" || return; bash "$FX/$1.sh" "$3" >/dev/null 2>&1; expect "$2" "$1"; bash "$SQ" reset "$1" >/dev/null; cd "$HOME"; }
run permissions 'chmod 777 backup.sh secrets.conf' 'chmod u+x backup.sh; chmod 600 secrets.conf'
run crlf '' "sed -i 's/\r\$//' deploy.sh"
run disk-hog 'rm var/log/app/payments.log' 'truncate -s 0 var/log/app/payments.log'
run log-hunt 'echo 203.0.113.1 > answer.txt' "grep 'Failed password' auth.log | awk '{for(i=1;i<=NF;i++) if(\$i==\"from\") print \$(i+1)}' | sort | uniq -c | sort -nr | head -1 | awk '{print \$2}' > answer.txt"
run web-down 'nohup python3 -m http.server 8088 --bind 127.0.0.1 --directory site >/dev/null 2>&1 & sleep 1' "sed -i 's/8080/8088/' start-app.sh; ./start-app.sh >/dev/null; sleep 1"
run old-logs 'tar -czf old-logs.tar.gz logs; rm logs/*.log' "tar -czf old-logs.tar.gz \$(find logs -name '*.log' -mtime +7); find logs -name '*.log' -mtime +7 -delete"
run cron-fix "sed -i 's/^2 30 \\* \\* 1/30 2 * * */' backup.cron" "sed -i 's/^2 30 /30 2 /' backup.cron"
run config-hunt "sed -i 's/max_connections = .*/max_connections = 100/' config/*/*.conf; sed -i 's/workers = 4/workers = 8/' config/web/server.conf" "sed -i 's/^max_connections = 5\$/max_connections = 100/' config/db/pool.conf"
# security labs: wrong = insecure fix, last argument = secure but broken fix; both must be caught
FX="$SRC/test-solutions"
run cloudtrail-hunt "bash $FX/cloudtrail-hunt.sh wrong" "bash $FX/cloudtrail-hunt.sh right" "bash $FX/cloudtrail-hunt.sh broken"
run iam-tighten "bash $FX/iam-tighten.sh wrong" "bash $FX/iam-tighten.sh right" "bash $FX/iam-tighten.sh broken"
run ssh-harden "bash $FX/ssh-harden.sh wrong" "bash $FX/ssh-harden.sh right" "bash $FX/ssh-harden.sh broken"
run secret-leak "bash $FX/secret-leak.sh wrong" "bash $FX/secret-leak.sh right" "bash $FX/secret-leak.sh broken"
run vuln-triage "bash $FX/vuln-triage.sh wrong" "bash $FX/vuln-triage.sh right" "bash $FX/vuln-triage.sh broken"
# other valid fixes must pass; a crashed checker must never count as a pass
for lab in cloudtrail-hunt iam-tighten ssh-harden secret-leak vuln-triage; do try "$lab" pass alt; try "$lab" fail crash; done
pkill -f "http.server 8088 --bind 127.0.0.1" 2>/dev/null
echo; bash "$SQ" list | head -3
rm -rf "$T"
echo; [ $fails = 0 ] && echo "All labs passed their end-to-end test" || echo "$fails lab test(s) FAILED"
exit $fails
