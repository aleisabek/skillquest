# Permissions pilot, step 2: guided. Same problem as the worked example (the file's own r), new names; hints fade.
TITLE="Config won't open (guided)"
LEVEL="Pilot 2 · guided"
LESSON="Checking the file and each folder on its path separately, and fixing with least privilege."
PILOT=1; CONTENT_VERSION=1; FAULT=file-r
source "$LABS_HOME/lib/perm-family.sh"
HINTS=(
  "Check each thing separately: who you are (id), the file (ls -l), and the r and x of every folder on its path (namei -l, or ls -ld on each)."
  "Compare your user name with the owner shown: as the owner, only the first three letters (owner) apply to you. Which of r, w, x is missing there?"
  "The config should end up as -r?------- : you need the first r. Fill in the rest without touching the group or others."
)
lab_setup() { pf_setup; }
lab_mission() { pf_mission; echo "Stuck? sq-lab hint $LAB  (hints are recorded in your report)."; }
lab_check() { pf_check; }
lab_explain() { pf_explain; }
