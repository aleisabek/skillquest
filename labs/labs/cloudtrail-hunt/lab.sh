TITLE="Which key was stolen?"
LEVEL="L2 · Cloud log hunt"
GOAL="Investigating a cloud incident from its audit log: who did it, from where, and which keys to switch off to stop them."
LESSON="Reading CloudTrail records: who (userIdentity), what (eventName), from where (sourceIPAddress); contain stolen keys without breaking the services that still need theirs."
HINTS=(
  "The file is JSON. Pretty-print it and type /StopLogging inside less to search:  python3 -m json.tool cloudtrail.json | less"
  "Summarize every record as IP, key, action: python3 -c \"import json; R=json.load(open('cloudtrail.json'))['Records']; [print(r['sourceIPAddress'], r['userIdentity'].get('accessKeyId','-'), r['eventName']) for r in R]\" | sort | uniq -c | sort -nr"
  "Find the outside IP that turned logging off, and the key it used. Then look at what that IP did next: a CreateAccessKey record's responseElements holds the NEW key it made. Both keys go in disable.txt; the busy internal service keys must keep working."
)
lab_setup() {
  python3 -I - "$DIR" <<'PY'
import json, random, sys, os
d = sys.argv[1]
rnd = random.Random()
def key(tag): return 'AKIAEXAMPLE' + tag + ''.join(rnd.choice('0123456789') for _ in range(6))   # 20 characters, like a real key ID
good = {'build-bot': (key('BLD'), '10.0.4.20'), 'backup-svc': (key('BKP'), '10.0.4.21'), 'report-app': (key('RPT'), '10.0.4.22')}
victim = rnd.choice(['ci-deploy', 'metrics-app'])
vkey, ip = key('CID' if victim == 'ci-deploy' else 'MET'), '203.0.113.%d' % rnd.randint(20, 240)
newuser, newkey = 'support-tmp', key('NEW')
recs = []
def rec(t, user, k, src, ev, **extra):
    r = {'eventTime': '2026-10-12T%s:00Z' % t, 'eventName': ev, 'userIdentity': {'type': 'IAMUser', 'userName': user, 'accessKeyId': k},
         'sourceIPAddress': src, 'awsRegion': 'us-east-1'}
    r.update(extra); recs.append(r)
for _ in range(260):
    u = rnd.choice(list(good)); k, src = good[u]
    rec('%02d:%02d' % (rnd.randint(0, 23), rnd.randint(0, 59)), u, k, src, rnd.choice(['GetObject', 'PutObject', 'ListObjects', 'GetObject']))
for _ in range(12):
    rec('%02d:%02d' % (rnd.randint(0, 23), rnd.randint(0, 59)), victim, vkey, '10.0.4.30', rnd.choice(['GetObject', 'ListObjects']))
h = rnd.randint(1, 4)
rec('%02d:10' % h, victim, vkey, ip, 'GetCallerIdentity')
rec('%02d:11' % h, victim, vkey, ip, 'ListBuckets')
rec('%02d:14' % h, victim, vkey, ip, 'StopLogging')
rec('%02d:16' % h, victim, vkey, ip, 'CreateUser', requestParameters={'userName': newuser})
rec('%02d:17' % h, victim, vkey, ip, 'CreateAccessKey', requestParameters={'userName': newuser},
    responseElements={'accessKey': {'userName': newuser, 'accessKeyId': newkey, 'status': 'Active'}})
rec('%02d:19' % h, victim, vkey, ip, 'AttachUserPolicy', requestParameters={'userName': newuser, 'policyArn': 'arn:aws:iam::aws:policy/AdministratorAccess'})
recs.sort(key=lambda r: r['eventTime'])
json.dump({'Records': recs}, open(os.path.join(d, 'cloudtrail.json'), 'w'), indent=1)
open(os.path.join(d, '.bad'), 'w').write(vkey + '\n' + newkey + '\n')
open(os.path.join(d, '.good'), 'w').write('\n'.join(k for k, _ in good.values()) + '\n')
open(os.path.join(d, '.ip'), 'w').write(ip + '\n')
PY
}
lab_mission() {
  echo "Alert: audit logging was switched off in the AWS account last night."
  echo "cloudtrail.json holds the day's CloudTrail records (example data)."
  echo "  1. Find who switched logging off, and write the outside IP address they used into answer.txt, like:  ip=203.0.113.X"
  echo "  2. List every access key ID that must be deactivated, one per line, in disable.txt."
  echo "Contain the attacker completely, but don't break the other internal services: keys that were never misused must keep working."
  echo "(In real life you'd also turn logging back on with StartLogging and delete anything the attacker created.)"
}
lab_check() {
  # "ip=203.0.113.9" as the mission shows, or just the address; exactly one IP either way
  local ip want; ip=$(grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}' "$DIR/answer.txt" 2>/dev/null | sort -u); want=$(cat "$DIR/.ip" 2>/dev/null)
  [ "$(grep -c . <<<"$ip")" -gt 1 ] && ip="more than one IP"
  if [ -n "$want" ] && [ "$ip" = "$want" ]; then ok "found the outside IP that stopped logging: $ip"; else bad "answer.txt needs ip=... with the IP that called StopLogging"; fi
  [ -f "$DIR/disable.txt" ] && [ -s "$DIR/.bad" ] || { bad "disable.txt is missing (or the lab files were changed: sq-lab start cloudtrail-hunt)"; return; }
  local got; got=$(grep -oE 'AKIA[A-Z0-9]{16}' "$DIR/disable.txt" | sort -u)
  while read -r k; do
    if grep -qx "$k" <<<"$got"; then ok "secure: $k is being deactivated"; else bad "not contained: one key the attacker used or created is still active"; fi
  done < "$DIR/.bad"
  local broke=0; while read -r k; do grep -qx "$k" <<<"$got" && broke=1; done < "$DIR/.good"
  if [ $broke = 0 ]; then ok "still works: the internal service keys stay active"; else bad "too broad: you'd deactivate a key an internal service still needs (check where each key is used from)"; fi
}
