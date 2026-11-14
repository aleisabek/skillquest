TITLE="Too much access"
LEVEL="L2 · Cloud IAM"
GOAL="Least privilege in cloud access policies: giving an app exactly the access it needs, and keeping data from being public."
LESSON="Least privilege in IAM: exact actions on exact resources (bucket ARN for ListBucket, bucket/* for objects), an explicit Deny always wins, and no public bucket policies."
HINTS=(
  "The app needs two things only: s3:GetObject on arn:aws:s3:::reports/* (the files) and s3:ListBucket on arn:aws:s3:::reports (the bucket itself). Note the two different resource formats."
  "In policy.json, replace the s3:* on * statement with statements that list those exact actions and resources, with no wildcards in the actions. Check the JSON with:  python3 -m json.tool policy.json"
  "In bucket-policy.json, the statement with \"Principal\": \"*\" makes the bucket public. Remove that statement and keep the one for the report-app role."
)
lab_setup() {
  cat > "$DIR/policy.json" <<'JSON'
{
  "Version": "2012-10-17",
  "Statement": [
    {"Sid": "ReportApp", "Effect": "Allow", "Action": "s3:*", "Resource": "*"}
  ]
}
JSON
  cat > "$DIR/bucket-policy.json" <<'JSON'
{
  "Version": "2012-10-17",
  "Statement": [
    {"Sid": "PublicRead", "Effect": "Allow", "Principal": "*", "Action": "s3:GetObject", "Resource": "arn:aws:s3:::reports/*"},
    {"Sid": "ReportAppRead", "Effect": "Allow", "Principal": {"AWS": "arn:aws:iam::111122223333:role/report-app"}, "Action": ["s3:GetObject", "s3:ListBucket"], "Resource": ["arn:aws:s3:::reports", "arn:aws:s3:::reports/*"]}
  ]
}
JSON
  cat > "$DIR/NEEDS.txt" <<'TXT'
What the report-app role actually does:
  - lists the files in the "reports" bucket        (s3:ListBucket on arn:aws:s3:::reports)
  - downloads report files from that bucket        (s3:GetObject  on arn:aws:s3:::reports/*)
It never uploads, deletes, or touches any other bucket or service. Nobody outside the account should read the bucket.
TXT
}
lab_mission() {
  echo "A review found two problems with the reporting app's access (example account 111122223333):"
  echo "  - policy.json, the app role's policy, allows every storage action on every resource."
  echo "  - bucket-policy.json makes the reports bucket readable by anyone on the internet."
  echo "Read NEEDS.txt, then fix both files: least privilege (exact actions, no wildcards), nothing public, and the app must still do its job."
}
lab_check() {
  local out
  out=$(python3 -I - "$DIR" <<'PY'
import json, sys, os, re
d = sys.argv[1]
def load(f):
    try: p = json.load(open(os.path.join(d, f), encoding='utf-8-sig'))
    except Exception as e: print('BAD %s is not valid JSON (%s)' % (f, e)); sys.exit(0)
    st = p.get('Statement') if isinstance(p, dict) else None
    st = st if isinstance(st, list) else [st] if isinstance(st, dict) else None
    if st is None or not all(isinstance(s, dict) for s in st): print('BAD %s needs a "Statement" list of statement objects' % f); sys.exit(0)
    return st
pol, bpol = load('policy.json'), load('bucket-policy.json')
lst = lambda v: v if isinstance(v, list) else [] if v is None else [v]
def like(p, v, ci=False):   # IAM wildcards: * and ?; action names are case-insensitive, ARNs are not
    return re.fullmatch(re.escape(str(p)).replace(r'\*', '.*').replace(r'\?', '.'), v, re.I if ci else 0) is not None
def matches(s, action, res):
    act = any(like(a, action, True) for a in lst(s.get('Action'))) if 'Action' in s else not any(like(a, action, True) for a in lst(s.get('NotAction')))
    rsc = any(like(r, res) for r in lst(s.get('Resource'))) if 'Resource' in s else not any(like(r, res) for r in lst(s.get('NotResource')))
    return act and rsc
def decide(stmts, action, res):
    hits = [s for s in stmts if matches(s, action, res)]
    if any(s.get('Effect') == 'Deny' for s in hits): return False
    return any(s.get('Effect') == 'Allow' for s in hits)
needed = [('s3:GetObject', 'arn:aws:s3:::reports/q3.pdf'), ('s3:ListBucket', 'arn:aws:s3:::reports')]
forbidden = [('s3:DeleteObject', 'arn:aws:s3:::reports/q3.pdf'), ('s3:PutObject', 'arn:aws:s3:::reports/new.pdf'), ('s3:GetObject', 'arn:aws:s3:::payroll/june.csv'),
             ('s3:ListBucket', 'arn:aws:s3:::payroll'), ('s3:PutBucketPolicy', 'arn:aws:s3:::reports'), ('s3:GetObject', 'arn:aws:s3:::reports-archive/old.pdf'),
             ('s3:GetObjectAcl', 'arn:aws:s3:::reports/q3.pdf'), ('iam:CreateUser', 'arn:aws:iam::111122223333:user/x'), ('ec2:RunInstances', '*')]
for a, r in needed: print(('OK' if decide(pol, a, r) else 'BAD') + ' still works: the role can do %s on %s' % (a, r))
wide = [str(a) for s in pol if s.get('Effect') == 'Allow' for a in lst(s.get('Action')) if '*' in str(a) or '?' in str(a)]
wide += ['NotAction' for s in pol if s.get('Effect') == 'Allow' and 'NotAction' in s]
print(('BAD' if wide else 'OK') + ' exact actions only, no wildcards (' + (', '.join(wide) or 'none') + ')')
for a, r in forbidden: print(('BAD' if decide(pol, a, r) else 'OK') + ' least privilege: %s on %s is not allowed' % (a, r))
anyone = lambda p: p == '*' or (isinstance(p, dict) and '*' in lst(p.get('AWS')))
public = [s for s in bpol if s.get('Effect') == 'Allow' and anyone(s.get('Principal'))]
print(('BAD' if public else 'OK') + ' the bucket policy grants nothing to the whole internet')
role = 'arn:aws:iam::111122223333:role/report-app'
blocked = [s for s in bpol if s.get('Effect') == 'Deny' and 'Condition' not in s   # conditional denies (e.g. TLS only) are fine
           and (anyone(s.get('Principal')) or (isinstance(s.get('Principal'), dict) and role in lst(s['Principal'].get('AWS'))))
           and any(matches(s, a, r) for a, r in needed)]
print(('BAD' if blocked else 'OK') + ' still works: the bucket policy does not deny the report-app role')
PY
) || bad "couldn't read your files (see the error above)"
  while IFS= read -r l; do case "$l" in OK*) ok "${l#OK }";; BAD*) bad "${l#BAD }";; esac; done <<<"$out"
}
