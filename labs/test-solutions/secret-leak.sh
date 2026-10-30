#!/usr/bin/env bash
# test-labs fixture, run inside the lab folder:
#   right | wrong (new commit only, key stays in history) | broken (deletes the history)
#   alt (refs packed first, backup refs removed with update-ref, .gitignore left uncommitted) | crash (the lab's answer files removed)
if [ "$1" = crash ]; then rm -f .secret .keyid; exit 0; fi
cd app || exit 1
keyid=$(git log --all -p | grep -o 'AKIA[A-Z0-9]*' | head -1)
purge() { FILTER_BRANCH_SQUELCH_WARNING=1 git filter-branch --force --index-filter 'git rm -q --cached --ignore-unmatch .env' --prune-empty -- --all >/dev/null 2>&1; }
case "$1" in
  right) purge; rm -rf .git/refs/original; git reflog expire --expire=now --all; git gc -q --prune=now;;
  alt)   git pack-refs --all; purge; git pack-refs --all
         git for-each-ref --format='delete %(refname)' refs/original | git update-ref --stdin
         git reflog expire --expire=now --all; git gc -q --prune=now;;
  wrong) :;;
  broken) rm -rf .git; git init -q -b main; git config user.name t; git config user.email t@example.com; git add -A; git commit -q -m "Fresh start";;
esac
echo .env >> .gitignore
[ "$1" = alt ] || { git add .gitignore; git commit -q -m "Ignore .env"; }
printf 'Key %s was deactivated and replaced on 2026-10-29.\n' "$keyid" > ROTATION.md
