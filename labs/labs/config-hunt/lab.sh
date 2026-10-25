TITLE="Find the bad setting"
LEVEL="L1 · Searching & editing"
LESSON="grep -rn to find a setting across many files, sed -i to change it safely."
HINTS=(
  "Search every file for the setting, with line numbers: grep -rn max_connections config/"
  "Only one file has the wrong value. Note its path and line."
  "Change it in place: sed -i 's/max_connections = 5\$/max_connections = 100/' PATH/TO/FILE   then grep again to confirm."
)
lab_setup() {
  mkdir -p "$DIR/config/app" "$DIR/config/db" "$DIR/config/cache" "$DIR/config/web"
  printf 'listen = 8080\nworkers = 4\n' > "$DIR/config/web/server.conf"
  printf 'host = db01\nport = 5432\n# max_connections is set in pool.conf\n' > "$DIR/config/db/database.conf"
  printf 'timeout = 30\nmax_connections = 5\nretry = 3\n' > "$DIR/config/db/pool.conf"
  printf 'size = 512MB\nmax_connections = 100\n' > "$DIR/config/cache/redis.conf"
  printf 'log_level = info\nfeature_x = true\n' > "$DIR/config/app/app.conf"
  (cd "$DIR/config" && find . -type f ! -path ./db/pool.conf -exec md5sum {} + | sort) > "$DIR/.others"
}
lab_mission() {
  echo "The app keeps saying \"too many connections\". Somewhere under ./config, the database pool"
  echo "has max_connections set to 5. It should be 100."
  echo "Find that file and change ONLY that value. Don't touch any other file."
}
lab_check() {
  if grep -qE '^max_connections = 100$' "$DIR/config/db/pool.conf"; then ok "pool.conf now has max_connections = 100"; else bad "the pool's max_connections isn't 100 yet"; fi
  if grep -qE '^timeout = 30$' "$DIR/config/db/pool.conf" && grep -qE '^retry = 3$' "$DIR/config/db/pool.conf"; then ok "other settings in pool.conf intact"; else bad "other lines in pool.conf were changed"; fi
  now=$(cd "$DIR/config" && find . -type f ! -path ./db/pool.conf -exec md5sum {} + | sort)
  if [ "$now" = "$(cat "$DIR/.others")" ]; then ok "no other files touched"; else bad "another config file was changed"; fi
}
