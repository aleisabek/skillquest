TITLE="Fix what matters first"
LEVEL="L2 · Vulnerability triage"
GOAL="Deciding which security flaws to fix first, based on real-world risk, and writing them up so a client can act on them."
LESSON="Prioritizing findings: known-exploited (CISA KEV) first, then internet-facing, then CVSS; and writing each finding so a manager can rank it and a developer can fix it."
HINTS=(
  "Read the table: column -s, -t findings.csv | less -S   The rule is in the mission: KEV first, then internet-facing, then higher CVSS."
  "Filter first: which rows say yes in the in_kev column? Those go to the top no matter their score. Then the internet-facing ones, then the rest by CVSS."
  "Let sort apply the whole rule:  (head -1 findings.csv; tail -n +2 findings.csv | sort -t, -k6,6r -k5,5r -k4,4nr) | column -s, -t   The top three rows are your findings; write each up with Asset:, Severity:, Impact: and Fix: lines."
)
lab_setup() {
  python3 -I - "$DIR" <<'PY'
import os, random, sys
d, r = sys.argv[1], random.Random()
issues = [
  ('vpn.example.com', 'Outdated VPN appliance firmware'), ('www.example.com', 'Web server software two major versions behind'),
  ('mail.example.com', 'Mail server software with a published flaw'),('hr-app.internal', 'HR app framework missing security updates'),
  ('files.internal', 'File server with an unsupported operating system'), ('jira.internal', 'Ticketing system plugin with a known flaw'),
  ('shop.example.com', 'Shop platform missing last month\'s security patch'), ('printer-3.internal', 'Printer firmware with a published flaw'),
  ('build.internal', 'Build server agent out of date'), ('api.example.com', 'API gateway with a known request-handling flaw')]
scores = r.sample([4.3, 5.3, 5.9, 6.1, 6.5, 7.2, 7.5, 8.1, 8.6, 8.8, 9.1, 9.8], len(issues))
rows = []
for i, ((asset, issue), c) in enumerate(zip(issues, scores)):
    net = asset.endswith('example.com')
    kev = r.random() < 0.25
    rows.append(('F-%02d' % (i + 1), asset, issue, c, 'yes' if net else 'no', 'yes' if kev else 'no'))
# the KEV rule must always matter: one finding outside the CVSS top three is known-exploited, so sorting by score alone is wrong
by_score = sorted(range(len(rows)), key=lambda i: rows[i][3], reverse=True)
k = r.choice(by_score[3:]); rows[k] = rows[k][:5] + ('yes',)
with open(os.path.join(d, 'findings.csv'), 'w') as f:
    f.write('id,asset,issue,cvss,internet_facing,in_kev\n')
    for x in rows: f.write('%s,%s,%s,%.1f,%s,%s\n' % x)
top = sorted(rows, key=lambda x: (x[5] == 'yes', x[4] == 'yes', x[3]), reverse=True)[:3]
rating = lambda c: 'Critical' if c >= 9 else 'High' if c >= 7 else 'Medium' if c >= 4 else 'Low'
with open(os.path.join(d, '.top'), 'w') as f:
    for x in top: f.write('%s %s\n' % (x[0], rating(x[3])))
PY
}
lab_mission() {
  echo "A scan of example.com produced findings.csv (fictional findings). The team can fix three this week."
  echo "Team rule: anything in CISA's Known Exploited Vulnerabilities (KEV) catalog first, then internet-facing, then higher CVSS."
  echo "Write findings.md for the client:"
  echo "  - '## Executive summary' with a few plain sentences for leadership;"
  echo "  - then exactly three findings, most urgent first, each headed '## F-xx Title' with Asset:, Severity:, Impact: and Fix: lines."
  echo "Severity is the CVSS rating: 9.0+ Critical, 7.0-8.9 High, 4.0-6.9 Medium, below 4.0 Low."
}
lab_check() {
  local f="$DIR/findings.md"
  [ -f "$f" ] || { bad "findings.md is missing"; return; }
  local out
  out=$(python3 -I - "$DIR" <<'PY'
import os, re, sys
d = sys.argv[1]
raw = open(os.path.join(d, 'findings.md'), 'rb').read()
text = raw.decode('utf-16') if raw[:2] in (b'\xff\xfe', b'\xfe\xff') else raw.decode('utf-8-sig', errors='replace')   # PowerShell 5 writes UTF-16
text = text.replace('\r\n', '\n')
want = [l.split() for l in open(os.path.join(d, '.top')) if l.strip()]
secs = re.split(r'^## ', text, flags=re.M)[1:]
summ = [s for s in secs if re.match(r'\W*executive summary', s, re.I)]
words = len(re.findall(r'\w+', summ[0].split('\n', 1)[1])) if summ and '\n' in summ[0] else 0
print(('OK' if words >= 15 else 'BAD') + ' executive summary for leadership (%d words%s)' % (words, '' if words >= 15 else '; write at least a few sentences'))
fid_of = lambda s: re.match(r'\W*(F-\d\d)\b', s).group(1)
found = [s for s in secs if re.match(r'\W*(F-\d\d)\b', s)]
ids = [fid_of(s) for s in found]
print(('OK' if len(found) == 3 else 'BAD') + ' exactly three findings (found %d): the team can only fix three this week' % len(found))
print(('OK' if ids == [w[0] for w in want] else 'BAD') + ' right priority order: ' + (' > '.join(ids) or 'none') + ('' if ids == [w[0] for w in want] else ' (apply the rule: KEV, then internet-facing, then CVSS)'))
field_re = lambda f: re.compile(r'^\s*(?:[-*+]\s+)?\**%s\**\s*:\**\s*(.+)$' % f, re.M | re.I)   # "Asset:", "- **Asset:**", "**Asset**: ..."
for s in found:
    fid = fid_of(s)
    for field in ('Asset', 'Severity', 'Impact', 'Fix'):
        m = field_re(field).search(s)
        if not m or len(m.group(1).strip(' *')) < 3: print('BAD %s needs a %s: line' % (fid, field))
    exp = dict(want).get(fid)
    sev = field_re('Severity').search(s)
    if exp and sev and not re.search(r'\b%s\b' % exp, sev.group(1), re.I): print('BAD %s severity should say %s (from its CVSS score)' % (fid, exp))
if found: print('OK each finding was checked for Asset, Severity, Impact and Fix')
PY
) || bad "couldn't read findings.md (see the error above)"
  while IFS= read -r l; do case "$l" in OK*) ok "${l#OK }";; BAD*) bad "${l#BAD }";; esac; done <<<"$out"
}
