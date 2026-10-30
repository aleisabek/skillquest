#!/usr/bin/env bash
# test-labs fixture, run inside the lab folder:
#   right | wrong (still s3:*) | broken (forgets ListBucket) | alt (lowercase actions, lists, TLS-only deny) | crash (policy is null)
if [ "$1" = crash ]; then echo null > policy.json; exit 0; fi
case "$1" in
  right)  stmts='{"Effect":"Allow","Action":"s3:GetObject","Resource":"arn:aws:s3:::reports/*"},{"Effect":"Allow","Action":"s3:ListBucket","Resource":"arn:aws:s3:::reports"}';;
  wrong)  stmts='{"Effect":"Allow","Action":"s3:*","Resource":["arn:aws:s3:::reports","arn:aws:s3:::reports/*"]}';;
  broken) stmts='{"Effect":"Allow","Action":"s3:GetObject","Resource":"arn:aws:s3:::reports/*"}';;
  alt)    stmts='{"Sid":"List","Effect":"Allow","Action":["s3:listbucket"],"Resource":["arn:aws:s3:::reports"]},{"Sid":"Read","Effect":"Allow","Action":["s3:getobject"],"Resource":["arn:aws:s3:::reports/*"]}';;
esac
printf '{"Version":"2012-10-17","Statement":[%s]}\n' "$stmts" > policy.json
python3 - "$1" <<'PY'
import json, sys
p = json.load(open('bucket-policy.json'))
p['Statement'] = [s for s in p['Statement'] if s.get('Principal') != '*']
if sys.argv[1] == 'alt':
    p['Statement'].append({'Sid': 'TLSOnly', 'Effect': 'Deny', 'Principal': '*', 'Action': 's3:*', 'Resource': ['arn:aws:s3:::reports', 'arn:aws:s3:::reports/*'],
                           'Condition': {'Bool': {'aws:SecureTransport': 'false'}}})
json.dump(p, open('bucket-policy.json', 'w'), indent=2)
PY
