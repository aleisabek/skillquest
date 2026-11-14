TITLE="The website is down"
LEVEL="L2 · Services & ports"
GOAL="Troubleshooting a website that's down: test it like a user, see what is actually running, and fix the cause."
LESSON="curl to test, ss -tulpn to see what's listening, reading a start script, running a process in the background."
HINTS=(
  "Test it like a user would: curl http://localhost:8088   Then see what IS listening: ss -tlnp | grep 80"
  "Read the start script: cat start-app.sh   Compare the port it uses with the port the site should be on (8088)."
  "Fix the port in start-app.sh (e.g. with nano or sed -i 's/8080/8088/'), then run it: ./start-app.sh   and test with curl again."
)
lab_setup() {
  mkdir -p "$DIR/site"; echo "SkillQuest app OK" > "$DIR/site/index.html"
  cat > "$DIR/start-app.sh" <<EOF
#!/bin/bash
# Starts the company web app in the background.
cd "$DIR/site"
nohup python3 -m http.server 8080 --bind 127.0.0.1 > "$DIR/app.log" 2>&1 &
echo \$! > "$DIR/.pid"
echo "app started (pid \$!)"
EOF
  chmod 755 "$DIR/start-app.sh"
}
lab_mission() {
  echo "Users say http://localhost:8088 is down. The app should serve a page that says: SkillQuest app OK"
  echo "The app is started with ./start-app.sh. Get the site answering on port 8088."
}
lab_check() {
  body=$(curl -s --max-time 3 http://127.0.0.1:8088/ 2>/dev/null)
  if [ "$body" = "SkillQuest app OK" ]; then ok "http://localhost:8088 answers correctly"; else bad "nothing (or the wrong thing) answers on port 8088"; fi
  if grep -q 8088 "$DIR/start-app.sh"; then ok "start-app.sh uses port 8088, so it survives the next restart"; else bad "start-app.sh still has the wrong port; the fix wouldn't survive a restart"; fi
}
lab_cleanup() {
  mine() { case "$(readlink "/proc/$1/cwd" 2>/dev/null)" in "$DIR"|"$DIR"/*) return 0;; esac; return 1; }   # only servers started from this lab folder
  for p in $(cat "$DIR/.pid" 2>/dev/null) $(pgrep -f "http.server 80(80|88) --bind 127.0.0.1" 2>/dev/null); do mine "$p" && kill "$p" 2>/dev/null; done; true
}
