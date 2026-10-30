#!/usr/bin/env bash
# test-labs fixture, run inside the lab folder:
#   right | wrong (misses the backdoor key) | broken (disables every key) | alt (right keys, with comments and tabs) | crash (lab files removed)
if [ "$1" = crash ]; then rm -f .ip .bad cloudtrail.json; : > answer.txt; : > disable.txt; exit 0; fi
ip=$(python3 -c 'import json; R=json.load(open("cloudtrail.json"))["Records"]; print([r["sourceIPAddress"] for r in R if r["eventName"]=="StopLogging"][0])')
echo "ip=$ip" > answer.txt
python3 - "$ip" "$1" > disable.txt <<'PY'
import json, sys
ip, mode = sys.argv[1], sys.argv[2]
R = json.load(open('cloudtrail.json'))['Records']
used = {r['userIdentity']['accessKeyId'] for r in R if r['sourceIPAddress'] == ip}
made = {r['responseElements']['accessKey']['accessKeyId'] for r in R if r['eventName'] == 'CreateAccessKey'}
allk = {r['userIdentity']['accessKeyId'] for r in R}
keys = sorted(used | made if mode in ('right', 'alt') else used if mode == 'wrong' else allk | made)
print('\n'.join(k + ('\t# stolen or backdoor' if mode == 'alt' else '') for k in keys))
PY
