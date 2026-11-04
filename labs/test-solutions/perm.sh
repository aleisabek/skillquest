#!/usr/bin/env bash
# test-labs fixture for the permissions pilot, run inside the lab folder:
#   right | alt (another least-privilege fix) | wrong (works, but widens access) | broken (doesn't fix it)
#   | copy (reads it by copying the secret out) | tighten (right fix, and also tightens a decoy: still a pass) | crash (deletes the lab's record)
f=$(find . -type f -perm 200 -name '*.ini' 2>/dev/null | head -1)      # file-r instance: the config itself
d=$(find . -type d -perm 600 2>/dev/null | head -1)                    # dir-x instance: the folder on the path
case "$1" in
  right)   [ -n "$f" ] && chmod u+r "$f"; [ -n "$d" ] && chmod u+x "$d";;
  alt)     [ -n "$f" ] && chmod 400 "$f"; [ -n "$d" ] && chmod u=rwx "$d";;
  wrong)   [ -n "$f" ] && chmod +r "$f"; [ -n "$d" ] && chmod 711 "$d";;
  broken)  [ -n "$f" ] && chmod u+w "$f"; [ -n "$d" ] && chmod u+r "$d";;
  copy)    [ -n "$f" ] && chmod u+r "$f"; [ -n "$d" ] && chmod u+x "$d"; cp "$(find . -name '*.ini' | head -1)" ./copy.ini;;
  tighten) [ -n "$f" ] && chmod u+r "$f"; [ -n "$d" ] && chmod u+x "$d"; n=$(find . -name notes.txt | head -1); chmod 600 "$n";;
  crash)   rm -f "$HOME/sq-labs/.evidence/"*.base;;
esac
exit 0
