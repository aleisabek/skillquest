TITLE="The key is still in the history"
LEVEL="L2 · Secrets & Git"
LESSON="Deleting a leaked secret in a new commit leaves it in history: rewrite history to remove it, ignore the file so it can't come back, and rotate the key, because copies may already exist."
HINTS=(
  "The 'Remove .env' commit didn't erase the earlier one. See where it lives:  cd ~/sq-labs/secret-leak/app && git log --all --stat && git log --all -p -- .env"
  "Rewrite every commit without the file (run it inside app/):  cd ~/sq-labs/secret-leak/app && FILTER_BRANCH_SQUELCH_WARNING=1 git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch .env' --prune-empty -- --all"
  "filter-branch keeps a backup under refs/original, the reflog points at old commits, and old objects stay until garbage collection. Clean up:  cd ~/sq-labs/secret-leak/app && git for-each-ref --format='delete %(refname)' refs/original | git update-ref --stdin && git reflog expire --expire=now --all && git gc --prune=now   Then add .env to .gitignore, and write ROTATION.md with the key ID and the word deactivated."
)
lab_setup() {
  local keyid secret
  keyid="AKIAEXAMPLE$(printf '%06d' $((RANDOM*RANDOM%1000000)))LAB"; keyid=${keyid:0:20}
  secret="sqlab$(head -c 300 /dev/urandom | tr -dc 'A-Za-z0-9' | head -c 35)"
  mkdir -p "$DIR/app"; cd "$DIR/app" || return
  git init -q -b main; git config user.name "Lab Dev"; git config user.email "dev@example.com"
  # this repo's own settings, so a global signing key or secret-scanning hook can't make the setup commits fail
  git config commit.gpgsign false; git config core.hooksPath /dev/null
  cat > app.py <<'PY'
import os, sys
key = os.environ.get("REPORT_API_KEY")
if not key:
    sys.exit("REPORT_API_KEY is not set: export it, or keep it in a local .env file that git ignores")
print("report sent")
PY
  printf '# Report sender\nSends the weekly report.\n' > README.md
  git add app.py README.md; git commit -q -m "Initial report script"
  printf 'REPORT_API_KEY_ID=%s\nREPORT_API_KEY=%s\n' "$keyid" "$secret" > .env
  git add .env; git commit -q -m "Add config for local testing"
  printf '\nRun: REPORT_API_KEY=... python3 app.py\n' >> README.md
  git add README.md; git commit -q -m "Document how to run it"
  git rm -q .env; git commit -q -m "Remove .env"
  echo "$secret" > "$DIR/.secret"; echo "$keyid" > "$DIR/.keyid"
  cd - >/dev/null || true
}
lab_mission() {
  echo "Secret scanning flagged the repository in app/: an API key was committed in .env."
  echo "A developer 'fixed' it with a commit that deletes .env, but the key is still in the history."
  echo "  1. Remove the key from every commit (and the leftovers git keeps), keeping the rest of the history."
  echo "  2. Make sure .env can't be committed again."
  echo "  3. Write app/ROTATION.md saying which key ID was deactivated and replaced (the key itself must be rotated: copies may exist)."
  echo "The app must still work:  cd app && REPORT_API_KEY=test python3 app.py"
}
lab_check() {
  local repo="$DIR/app" secret keyid revs
  secret=$(cat "$DIR/.secret"); keyid=$(cat "$DIR/.keyid")
  if [ ! -d "$repo/.git" ]; then bad "app/ is no longer a git repository"; return; fi
  revs=$(git -C "$repo" rev-list --all --reflog 2>/dev/null)
  if [ -n "$revs" ] && ! git -C "$repo" grep -qF "$secret" $revs -- 2>/dev/null && ! grep -rqF "$secret" "$repo" --exclude-dir=.git; then
    ok "secure: the key is gone from every commit, branch, backup ref and the reflog"
  else bad "the key can still be found (check git log --all -p, refs/original and the reflog)"; fi
  if git -C "$repo" cat-file --batch-all-objects --batch 2>/dev/null | grep -aqF "$secret"; then
    bad "an old object still holds the key: expire the reflog and run git gc --prune=now"
  else ok "secure: no object left in the repository holds the key"; fi
  if git -C "$repo" check-ignore -q .env; then ok "secure: .env is ignored, so it can't be committed again"; else bad ".env isn't in .gitignore yet"; fi
  if [ -f "$repo/ROTATION.md" ] && grep -qF "$keyid" "$repo/ROTATION.md" && grep -qiE 'deactivat|rotat|revok' "$repo/ROTATION.md"; then ok "rotation noted for key ID $keyid"
  else bad "ROTATION.md should name the key ID and say it was deactivated (find the ID in the old .env)"; fi
  local subjects; subjects=$(git -C "$repo" log --format=%s 2>/dev/null)
  if grep -qx "Initial report script" <<<"$subjects" && grep -qx "Document how to run it" <<<"$subjects"; then ok "still works: the project history is kept"
  else bad "the history was lost: rewrite it, don't delete it (the team needs the other commits)"; fi
  if (cd "$repo" && REPORT_API_KEY=test python3 app.py 2>/dev/null | grep -qx "report sent"); then ok "still works: the app runs with the key from the environment"
  else bad "the app no longer runs: REPORT_API_KEY=test python3 app.py should print 'report sent'"; fi
}
