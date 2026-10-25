TITLE="Script edited on Windows won't run"
LEVEL="L1 · Files & scripts"
LESSON="Windows (CRLF) vs Linux (LF) line endings, the 'bad interpreter ^M' error, fixing files with sed."
HINTS=(
  "Run it and read the error closely: ./deploy.sh  The ^M (or \\r) in the message is the clue."
  "See hidden characters with: cat -A deploy.sh   Lines ending in ^M\$ have Windows line endings."
  "Strip the carriage returns: sed -i 's/\\r\$//' deploy.sh   (or: tr -d '\\r' < deploy.sh > tmp && mv tmp deploy.sh, then chmod +x again)"
)
lab_setup() {
  printf '#!/bin/bash\r\necho "deploy OK"\r\n' > "$DIR/deploy.sh"; chmod 755 "$DIR/deploy.sh"
}
lab_mission() {
  echo "A teammate wrote deploy.sh on Windows and copied it to the server."
  echo "It's executable, but ./deploy.sh fails with a strange 'bad interpreter' error."
  echo "Fix the file so ./deploy.sh prints: deploy OK"
}
lab_check() {
  if grep -q $'\r' "$DIR/deploy.sh" 2>/dev/null; then bad "deploy.sh still has Windows line endings (\\r)"; else ok "no Windows line endings left"; fi
  if [ "$("$DIR/deploy.sh" 2>/dev/null)" = "deploy OK" ]; then ok "./deploy.sh prints deploy OK"; else bad "./deploy.sh doesn't print 'deploy OK' yet (is it still executable?)"; fi
}
