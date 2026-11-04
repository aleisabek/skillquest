# Permissions pilot, step 3: unfamiliar and independent. Same symptom, a different cause than steps 1 and 2. No hints.
TITLE="Still can't read it"
LEVEL="Pilot 3 · on your own"
LESSON="Diagnosing from evidence: ruling a cause out only when an observation shows it, then a least-privilege fix."
PILOT=1; CONTENT_VERSION=1; FAULT=dir-x
source "$LABS_HOME/lib/perm-family.sh"
HINTS=()
lab_setup() { pf_setup; }
lab_mission() { pf_mission; echo "No hints in this one: it records what you can work out on your own."; }
lab_check() { pf_check; }
lab_explain() { pf_explain; }
