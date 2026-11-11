# Permissions pilot, step 4a, round 2: a fresh instance of the round 2 step 3 fault, days later, with no hints.
TITLE="A few days later (round 2)"
LEVEL="Pilot 4 · delayed check, round 2"
LESSON="Whether the diagnosis stuck: a fresh instance with no hints."
PILOT=1; CONTENT_VERSION=1; FAULT=link-r
source "$LABS_HOME/lib/perm-family.sh"
HINTS=()
lab_setup() { pf_setup; }
lab_mission() { pf_mission; echo "No hints in this one: it records what stuck."; }
lab_check() { pf_check; }
lab_explain() { pf_explain; }
