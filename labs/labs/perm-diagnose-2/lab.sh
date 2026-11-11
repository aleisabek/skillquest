# Permissions pilot, step 3, round 2: a fault used nowhere else in the pilot (the config is a symlink whose target lacks r).
# Added 2026-11-11 because round 1's rule-out question didn't say a rule-out was required, so its step 3 measured the question, not the skill.
TITLE="Still can't read it (round 2)"
LEVEL="Pilot 3 · on your own, round 2"
LESSON="Diagnosing from evidence when the obvious check (ls -l) misleads: ruling a cause out only when an observation shows it, then a least-privilege fix."
PILOT=1; CONTENT_VERSION=1; FAULT=link-r
source "$LABS_HOME/lib/perm-family.sh"
HINTS=()
lab_setup() { pf_setup; }
lab_mission() { pf_mission; echo "No hints in this one: it records what you can work out on your own."; }
lab_check() { pf_check; }
lab_explain() { pf_explain; }
