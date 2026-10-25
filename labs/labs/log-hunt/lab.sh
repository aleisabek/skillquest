TITLE="Who keeps failing to log in?"
LEVEL="L2 · Log analysis"
LESSON="grep + awk/cut + sort | uniq -c | sort -nr: the classic pipeline for counting things in logs."
HINTS=(
  "Only the failures matter: grep 'Failed password' auth.log"
  "The IP comes after the word 'from'. Pull it out with: awk '{for(i=1;i<=NF;i++) if(\$i==\"from\") print \$(i+1)}'"
  "Count and rank: ... | sort | uniq -c | sort -nr | head -1   Then put just the IP in answer.txt: echo 203.0.113.X > answer.txt"
)
lab_setup() {
  local users=(root admin deploy ubuntu test oracle) ips=() top
  for i in $(seq 1 7); do ips+=("203.0.113.$((RANDOM%200+20))"); done
  top=${ips[$((RANDOM%7))]}
  {
    for n in $(seq 1 400); do
      ip=${ips[$((RANDOM%7))]}; [ $((RANDOM%3)) = 0 ] && ip=$top
      u=${users[$((RANDOM%6))]}
      if [ $((RANDOM%5)) = 0 ]; then echo "Oct 25 0$((RANDOM%10)):$((RANDOM%50+10)):$((RANDOM%50+10)) web01 sshd[$((RANDOM+1000))]: Accepted publickey for deploy from 10.0.0.$((RANDOM%50+2)) port $((RANDOM+1024)) ssh2"
      else echo "Oct 25 0$((RANDOM%10)):$((RANDOM%50+10)):$((RANDOM%50+10)) web01 sshd[$((RANDOM+1000))]: Failed password for $u from $ip port $((RANDOM+1024)) ssh2"; fi
    done
  } > "$DIR/auth.log"
  grep 'Failed password' "$DIR/auth.log" | awk '{for(i=1;i<=NF;i++) if($i=="from") print $(i+1)}' | sort | uniq -c | sort -nr | head -1 | awk '{print $2}' > "$DIR/.answer"
}
lab_mission() {
  echo "auth.log is an SSH log from a server. Many logins are failing."
  echo "Find the IP address with the MOST failed password attempts,"
  echo "and write just that IP address into a file named answer.txt in this folder."
  echo "(The IPs are from 203.0.113.0/24, a range reserved for documentation and examples.)"
}
lab_check() {
  want=$(cat "$DIR/.answer"); got=$(tr -d ' \r\n' < "$DIR/answer.txt" 2>/dev/null)
  if [ -z "$got" ]; then bad "answer.txt is missing or empty"
  elif [ "$got" = "$want" ]; then ok "$got is the top source of failed logins"
  else bad "$got isn't the IP with the most failures; count them again"; fi
}
