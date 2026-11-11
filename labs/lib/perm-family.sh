# Pilot fault family "perm-read-own-file": you can't read a config file you own. Sourced by the pilot labs' lab.sh.
# Everything is owned by the current user; exactly one permission bit is missing:
#   file-r  the config itself lacks the owner's r
#   dir-x   the config is fine, but one folder on its path lacks the owner's x
#   link-r  the config is a symlink (always shown lrwxrwxrwx); the file it points to lacks the owner's r
# Each attempt gets its own instance (names, depth, which folder), picked from the attempt id, so the same id
# always rebuilds the same lab. Decoys with odd but harmless permissions sit beside it; tightening them is fine.

FAMILY="perm-read-own-file"
# The answer lists for `sq-lab finish`; keep them in the same order as Q1 and Q2 in labs/sq-evidence.py.
Q1_TEXT=("the config file's own r" "the x of a folder on its path" "the r of a folder on its path" "the r of the file a symlink points to" "ownership or group (you weren't the owner, or not in its group)" "something else" "not sure")
Q2_TEXT=("the file's own r: ls -l showed r for the owner (if a folder was blocking, you can only see this after fixing the folder)" "a folder's x: namei -l (or ls -ld on each folder) showed x for the owner on every folder on the path" "ownership: ls -l showed you as the owner, the same name id -un prints" "I didn't check another cause (this can't pass: a diagnosis needs one)" "not sure")

pf_pick() { local h; h=$(printf '%s:%s' "$SEED" "$1" | sha256sum | cut -c1-8); echo $(( 16#$h % $2 )); }
pf_vars() {
  local apps=(billing ledger intake roster metrics invoices tickets payroll) confs=(settings app service database)
  APP=${apps[$(pf_pick app ${#apps[@]})]}; CONF=${confs[$(pf_pick conf ${#confs[@]})]}.ini
  if [ "$(pf_pick depth 2)" = 1 ]; then REL="$APP/conf/live/$CONF"; else REL="$APP/conf/$CONF"; fi
  local dirs=("$APP" "$APP/conf"); [ "$REL" = "$APP/conf/live/$CONF" ] && dirs+=("$APP/conf/live")
  BADDIR=${dirs[$(pf_pick bad ${#dirs[@]})]}
  # link-r: the real file lives in $APP/shared and the config path is a relative symlink to it
  TARGET="$APP/shared/$CONF"
  if [ "$REL" = "$APP/conf/live/$CONF" ]; then LINKTO="../../shared/$CONF"; else LINKTO="../shared/$CONF"; fi
  MARK="SQMARK-${SEED:0:12}"
  BASE="$EV/$ATTEMPT.base"
}

pf_setup() {
  pf_vars
  mkdir -p "$DIR/$(dirname "$REL")" "$DIR/$APP/logs" "$DIR/$APP/cache"
  if [ "$FAULT" = link-r ]; then
    mkdir -p "$DIR/$APP/shared"
    printf '# %s config\nport=%s\ntoken=%s\n' "$APP" $((8000 + $(pf_pick port 900))) "$MARK" > "$DIR/$TARGET"
    ln -s "$LINKTO" "$DIR/$REL"
  else
    printf '# %s config\nport=%s\ntoken=%s\n' "$APP" $((8000 + $(pf_pick port 900))) "$MARK" > "$DIR/$REL"
  fi
  printf 'Deploy notes: restart the app after config changes.\n' > "$DIR/$APP/notes.txt"
  printf '2026-11-01 started\n' > "$DIR/$APP/logs/old.log"
  printf '#!/bin/bash\necho cache cleared\n' > "$DIR/$APP/cache/clear.sh"
  find "$DIR" -type d -exec chmod 700 {} +
  chmod 755 "$DIR/$APP/cache"; chmod 644 "$DIR/$APP/notes.txt"; chmod 640 "$DIR/$APP/cache/clear.sh"
  chmod 600 "$DIR/$REL" "$DIR/$APP/logs/old.log"
  # the starting state (path, mode, type) and the config's hash, recorded before the fault (a folder without x can't be listed)
  ( cd "$DIR" && find . -mindepth 1 -printf '%P\t%m\t%y\n' ) > "$BASE"
  sha256sum < "$DIR/$REL" | cut -c1-64 > "$BASE.hash"
  local p=$REL m=200
  case "$FAULT" in dir-x) p=$BADDIR; m=600;; link-r) p=$TARGET; m=200;; esac
  chmod "$m" "$DIR/$p"
  awk -F'\t' -v p="$p" -v m="$m" 'BEGIN{OFS="\t"} $1==p{$2=m} {print}' "$BASE" > "$BASE.tmp" && mv "$BASE.tmp" "$BASE"
}

pf_mission() {
  pf_vars
  echo "The $APP app can't read its config:"
  echo "    cat $REL   ->   Permission denied"
  echo "You (the current user) own every file and folder in this lab. Make the config readable by you again."
  echo "Rules: don't give the group or others any more access than they have now, and don't move, copy or delete anything."
  echo "Check as often as you like: sq-lab check $LAB  (checking awards nothing)."
  echo "When you're done: sq-lab finish $LAB. It asks two questions, and a pass needs a working fix plus both answers:"
  echo "    1. what blocked access"
  echo "    2. one other likely cause you checked and ruled out, and the command output that showed it"
  echo "So note what each check shows as you go, not only the fix."
}

pf_check() {
  pf_vars
  local f="$DIR/$REL" out obs p mode t now wid=() miss=() tip=""
  # fail closed: without the starting record nothing below could be judged
  if [ ! -s "$BASE" ] || [ ! -s "$BASE.hash" ]; then bad "the lab's starting record is missing; run sq-lab start $LAB again"; return; fi
  if out=$(cat -- "$f" 2>&1) && [[ "$out" == *"$MARK"* ]]; then obs=opens; else obs=$(printf '%s' "$out" | head -1 | head -c 160); obs=${obs//"$HOME"/\~}; fi
  chk "config opens with cat" opens "$obs"
  local opened=0; [ "$obs" = opens ] && opened=1
  if [ "$obs" = opens ]; then
    [ "$(sha256sum < "$f" | cut -c1-64)" = "$(cat "$BASE.hash")" ] && obs=unchanged || obs=changed
  else obs="can't read it yet"; fi
  chk "config contents unchanged" unchanged "$obs"
  while IFS=$'\t' read -r p mode t; do
    if [ ! -e "$DIR/$p" ] && [ ! -L "$DIR/$p" ]; then miss+=("$p"); continue; fi
    # a symlink must stay a symlink (replacing it with a copy of the file is a copy, not a fix)
    if [ "$t" = l ]; then [ -L "$DIR/$p" ] || miss+=("$p (no longer a symlink)"); continue; fi
    now=$(stat -c %a "$DIR/$p")
    if (( (8#$now & 8#077) & ~(8#$mode & 8#077) )); then
      wid+=("$p (now $now)")
      { [ "$p" = "$REL" ] || [ "$p" = "$TARGET" ]; } && (( (8#$now & 8#044) == 8#044 )) && tip="chmod +r adds r for the group and others too (the usual umask 022); chmod u+r adds it for you only"
    fi
  done < "$BASE"
  # Until the config opens, these two aren't judged: listing what can't be reached would point at the broken folder.
  if [ "$opened" = 1 ]; then
    [ ${#miss[@]} = 0 ] && obs="all in place" || obs="missing or unreachable: ${miss[*]}"
    chk "every file and folder still in place" "all in place" "$obs"
    [ ${#wid[@]} = 0 ] && obs=none || obs="wider access on: ${wid[*]}"
    chk "nobody else gained access" none "$obs" "$tip"
  else
    chk "every file and folder still in place" "all in place" "not judged until the config opens"
    chk "nobody else gained access" none "not judged until the config opens"
  fi
  out=$(grep -rlF -- "$MARK" "$DIR" 2>/dev/null | grep -vxF -e "$f" -e "$DIR/$TARGET" | sed "s|^$DIR/||" | head -5 | tr '\n' ' ')
  chk "no copies of the config's secret" none "${out:-none}"
}

pf_explain() {
  pf_vars
  case "$FAULT" in
    file-r) echo "${B}What was wrong:${N} the config's own mode was --w------- (200), so even you, its owner, had no r."
            echo "Every folder on the path had x for you, so the path was never the problem (namei -l $REL shows each one)."
            echo "${B}Least-privilege fix:${N} chmod u+r $REL (or chmod 600). Plain chmod +r would also give the group and others r."
            echo "${B}Ruling out other causes here:${N} namei -l showed x for you on every folder (so not a folder), and ls -l showed you as the owner, matching id -un (so not ownership).";;
    dir-x)  echo "${B}What was wrong:${N} the config itself was fine (-rw-------), but the folder $BADDIR was drw------- (600)."
            echo "Without x on a folder you can't pass through it to open anything inside, even with r (ls lists names but shows ? for details)."
            echo "ls -l couldn't even show the file's mode until that folder was fixed; namei -l $REL shows every folder on the way."
            echo "${B}Least-privilege fix:${N} chmod u+x $BADDIR (or chmod 700). 711 or 755 would let others pass through too."
            echo "x on a folder is called search (or traverse) permission. It isn't elevation: no sudo is needed, only x for you, the owner."
            echo "${B}Ruling out other causes here:${N} once the folder was fixed, ls -l showed the file as -rw------- (so its own r was fine); ls -l and id -un showed you as the owner (so not ownership).";;
    link-r) echo "${B}What was wrong:${N} $REL is a symlink to $TARGET, and that file's mode was --w------- (200), so even you, its owner, had no r."
            echo "A symlink's own permissions always show as lrwxrwxrwx and are never checked: what counts is the file it points to. ls -lL $REL or namei -l $REL shows it."
            echo "${B}Least-privilege fix:${N} chmod u+r $TARGET (chmod on the link changes the file it points to). Plain chmod +r would also give the group and others r."
            echo "${B}Ruling out other causes here:${N} namei -l showed x for you on every folder on the way, including $APP/shared (so not a folder), and ls -l showed you as the owner, matching id -un (so not ownership). ls -l on the link itself proves nothing.";;
  esac
}
