#!/usr/bin/env bash
# test-labs fixture, run inside the lab folder:
#   right | wrong (ranks by CVSS only) | broken (lists every finding) | alt (bullets, bold, BOM, CRLF) | crash (answer file gone, empty report)
if [ "$1" = crash ]; then rm -f .top; : > findings.md; exit 0; fi
python3 - "$1" <<'PY'
import csv, sys
mode = sys.argv[1]
rows = list(csv.DictReader(open('findings.csv')))
rate = lambda c: 'Critical' if c >= 9 else 'High' if c >= 7 else 'Medium' if c >= 4 else 'Low'
if mode == 'wrong': rows.sort(key=lambda r: float(r['cvss']), reverse=True)
else: rows.sort(key=lambda r: (r['in_kev'] == 'yes', r['internet_facing'] == 'yes', float(r['cvss'])), reverse=True)
pick = rows if mode == 'broken' else rows[:3]
summary = 'Three issues need fixing this week. Two face the internet, and attackers are known to exploit the most urgent one. Fixing them removes the biggest risks first.'
if mode == 'alt':
    out = ['# Findings', '', '## **Executive summary**', summary, '']
    for r in pick:
        c = float(r['cvss'])
        out += ['## **%s** %s' % (r['id'], r['issue']), '- **Asset:** ' + r['asset'], '- **Severity:** %s (CVSS %.1f)' % (rate(c), c),
                '- **Impact:** could expose the service or its data.', '- **Fix:** apply the vendor update and verify.', '']
    open('findings.md', 'w', encoding='utf-8-sig', newline='\r\n').write('\n'.join(out))
else:
    out = ['# Findings', '', '## Executive summary', summary, '']
    for r in pick:
        c = float(r['cvss'])
        out += ['## %s %s' % (r['id'], r['issue']), 'Asset: ' + r['asset'], 'Severity: %s (CVSS %.1f)' % (rate(c), c), 'Impact: could expose the service or its data.', 'Fix: apply the vendor update and verify.', '']
    open('findings.md', 'w').write('\n'.join(out))
PY
