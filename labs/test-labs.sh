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
# Permissions pilot: started -> checked (no credit) -> finished once; the report line is the evidence.
rep() { bash "$SQ" report "$1" 2>/dev/null | python3 -c 'import sys,json; l=sys.stdin.read(); print(json.loads(l[5:]).get(sys.argv[1], "") if l.startswith("SQR2 ") else "none")' "$2"; }
pilot() { # pilot LAB RIGHT_Q1 RIGHT_Q2 THE_FAULTS_Q2_NUMBER
  local lab=$1 q1=$2 q2=$3 qf=$4 m o
  echo "[$lab]"
  fresh() { cd "$HOME"; bash "$SQ" start "$lab" >/dev/null; cd "$HOME/sq-labs/$lab"; }
  fin() { bash "$SQ" finish "$lab" --q1 "$1" --q2 "$2" </dev/null >"$T/fin.out" 2>&1; rep "$lab" outcome; }
  is() { [ "$2" = "$3" ] && pass "$lab: $1 -> $3" || { fail "$lab: $1: expected $3, got $2"; sed 's/^/        /' "$T/fin.out" 2>/dev/null | head -12; }; }
  appok() { if command -v node >/dev/null 2>&1; then bash "$SQ" report "$lab" | node "$SRC/../tests/validate-report.js" >"$T/val.out" 2>&1 && pass "$lab: the app accepts the $1 report" || { fail "$lab: the app refuses the $1 report"; cat "$T/val.out"; }
    else echo "  skip $lab: node isn't installed here, so the $1 report isn't cross-checked (CI does it)"; fi; }
  SQ_FORCE_NOPERM=1 bash "$SQ" start "$lab" >/dev/null 2>&1 && fail "$lab: started although permissions aren't enforced" || pass "$lab: refuses when permissions aren't enforced"
  if sudo -n true 2>/dev/null; then sudo env HOME="$HOME" SQ_LABS_HOME="$HOME/.skillquest-labs" bash "$SQ" start "$lab" >/dev/null 2>&1 && fail "$lab: started as root" || pass "$lab: refuses to run as root"; fi
  fresh; bash "$SQ" check "$lab" >"$T/chk.out" 2>&1
  grep -q "unreachable\|wider access on" "$T/chk.out" && fail "$lab: check names paths before the config opens (gives the answer away)" || pass "$lab: check gives nothing away before the fix"
  is "finish without a fix" "$(fin "$q1" "$q2")" fail
  appok failed
  fresh; bash "$SQ" check "$lab" >/dev/null; bash "$FX/perm.sh" right; bash "$SQ" check "$lab" >/dev/null; bash "$SQ" check "$lab" >/dev/null
  is "report before finishing" "$(rep "$lab" outcome)" none
  is "right fix, right reasoning, checked 3 times" "$(fin "$q1" "$q2")" independent-pass
  is "checker results recorded once" "$(rep "$lab" checker_results | grep -o "'check'" | wc -l)" 5
  appok passing
  o=$(bash "$SQ" report "$lab"); bash "$SQ" finish "$lab" --q1 "$q1" --q2 "$q2" </dev/null >/dev/null 2>&1 && fail "$lab: finished twice" || pass "$lab: a finished attempt can't be finished again"
  [ "$o" = "$(bash "$SQ" report "$lab")" ] && pass "$lab: report unchanged after the refused finish" || fail "$lab: report changed"
  for m in alt tighten; do fresh; bash "$FX/perm.sh" $m; is "$m fix" "$(fin "$q1" "$q2")" independent-pass; done
  for m in wrong broken copy crash; do fresh; bash "$FX/perm.sh" $m; is "$m fix" "$(fin "$q1" "$q2")" fail; done
  fresh; bash "$FX/perm.sh" right; is "right fix, wrong cause named" "$(fin 6 "$q2")" fail
  fresh; bash "$FX/perm.sh" right; is "right fix, nothing ruled out" "$(fin "$q1" 4)" fail
  fresh; bash "$FX/perm.sh" right; is "right fix, ruled out the real cause" "$(fin "$q1" "$qf")" fail
  fresh; bash "$SQ" hint "$lab" >/dev/null; bash "$FX/perm.sh" right
  if [ "$lab" = perm-guided ]; then is "right fix after a hint" "$(fin "$q1" "$q2")" hinted-pass; is "hint recorded" "$(rep "$lab" help_used)" hint-1; appok hinted
  else is "no hints offered" "$(fin "$q1" "$q2")" independent-pass; fi
  fresh; cd "$HOME"; bash "$SQ" reset "$lab" >/dev/null
  [ ! -e "$HOME/sq-labs/$lab" ] && pass "$lab: reset removes the broken lab" || fail "$lab: reset left files"
  is "attempt left by reset" "$(rep "$lab" outcome)" abandoned
  appok abandoned
  [ "$(ls "$HOME/sq-labs/.evidence"/*.json | wc -l)" -gt 10 ] && pass "$lab: reset keeps the attempt records" || fail "$lab: records lost"
  cd "$HOME"
}
pilot perm-guided 1 2 1
pilot perm-diagnose 2 1 2
pilot perm-recheck 2 3 2
pkill -f "http.server 8088 --bind 127.0.0.1" 2>/dev/null
echo; bash "$SQ" list | head -3
rm -rf "$T"
echo; [ $fails = 0 ] && echo "All labs passed their end-to-end test" || echo "$fails lab test(s) FAILED"
exit $fails
