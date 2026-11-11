# Permissions pilot, step 4a: the delayed check. A new instance of the step 3 fault, days later, with no hints.
# The app decides whether it counts as delayed (at least 3 days after an independent pass); the lab just records the dates.
TITLE="A few days later"
LEVEL="Pilot 4 · delayed check"
LESSON="Whether the diagnosis stuck: a fresh instance with no hints."
PILOT=1; CONTENT_VERSION=2; FAULT=dir-x
source "$LABS_HOME/lib/perm-family.sh"
HINTS=()
lab_setup() { pf_setup; }
lab_mission() { pf_mission; echo "No hints in this one: it records what stuck."; }
lab_check() { pf_check; }
lab_explain() { pf_explain; }
