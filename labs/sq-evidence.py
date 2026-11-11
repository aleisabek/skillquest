#!/usr/bin/env python3
"""Attempt records for the SkillQuest pilot labs (evidence schema 2). Called by sq-lab: all JSON is built here, never in bash.

An attempt is started -> checked any number of times (no credit) -> finished once. sq-lab refuses to change a finished
attempt; the app treats the report as an "imported checker report": well formed, not proof that the checks ran.
Records live in ~/sq-labs/.evidence and survive `sq-lab reset`.

  sq-evidence.py new ROOT LAB CONTENT_VERSION FAMILY FAULT   -> prints the new attempt id (abandons an unfinished one)
  sq-evidence.py current ROOT LAB                            -> prints the started attempt id, or nothing
  sq-evidence.py hint ROOT LAB N                             -> records that hint N was viewed
  sq-evidence.py finish ROOT LAB Q1 Q2 NOTE                  -> grades and finalizes; prints the outcome, then reasons
  sq-evidence.py abandon ROOT LAB                            -> finalizes an unfinished attempt as abandoned
  sq-evidence.py report ROOT LAB                             -> prints one line: SQR2 {json} (ASCII only, no colour)
"""
import datetime, glob, hashlib, json, os, re, sys, uuid

SCHEMA = 2
CHECKER = {'name': 'sq-lab', 'version': '2.0'}
# The answer lists sq-lab shows at `finish`, in the same order (numbered from 1). Keep them in step with labs/lib/perm-family.sh.
Q1 = ['file-r', 'dir-x', 'dir-r', 'owner-group', 'other', 'unsure']      # what blocked access?
Q2 = ['file-r', 'dir-x', 'owner-group', 'none', 'unsure']                # which other cause did you rule out?
# A cause counts as ruled out only if it really was fine in this fault type, and the named observation shows that.
# (In a dir-x instance the file's own mode can only be seen after the folder is fixed; that order is accepted.)
RULED_OUT_OK = {'file-r': {'dir-x', 'owner-group'}, 'dir-x': {'file-r', 'owner-group'}}
EXPORT = ['schema_version', 'attempt_id', 'content_id', 'content_version', 'attempt_date', 'finished_at', 'scenario_family',
          'scenario_instance_id', 'fault_type', 'previous_exposure', 'assistance_viewed', 'help_used', 'evidence',
          'checker_results', 'outcome', 'reasoning', 'reflection', 'checker']


def now():
    return datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')


def ev_dir(root):
    d = os.path.join(root, '.evidence')
    os.makedirs(d, exist_ok=True)
    return d


def path_of(root, aid):
    # attempt ids come back from files the learner can edit: only a plain UUID may become part of a path
    if not re.fullmatch(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", str(aid or "")):
        raise ValueError("not an attempt id")
    return os.path.join(ev_dir(root), aid + ".json")


def load(root, aid):
    try:
        with open(path_of(root, aid)) as f:
            return json.load(f)
    except (OSError, ValueError):
        return None


def save(root, rec):
    p = path_of(root, rec['attempt_id'])
    if os.path.exists(p):
        os.chmod(p, 0o600)
    with open(p, 'w') as f:
        json.dump(rec, f, indent=1, sort_keys=True)
    if rec['state'] == 'finalized':
        os.chmod(p, 0o400)      # a reminder, not a lock: the owner can still change it; sq-lab itself never does


def current(root, lab):
    try:
        aid = open(os.path.join(ev_dir(root), 'current-' + lab)).read().strip()
    except OSError:
        return None
    rec = load(root, aid)
    return rec if rec and rec.get('state') == 'started' else None


def clean(s, n):
    s = re.sub(r'\x1b(?:\[[0-?]*[ -/]*[@-~]|\][^\x07\x1b]*(?:\x07|\x1b\\)?|O.|.)?', '', str(s))  # stray arrow keys etc.: drop the whole escape sequence
    s = ''.join(c if c.isprintable() else ' ' for c in s)
    return s[:n]


def finalize(root, rec, outcome):
    rec.setdefault('checker_results', [])
    rec.update(state='finalized', outcome=outcome, finished_at=now())
    save(root, rec)


def cmd_new(root, lab, cver, family, fault):
    old = current(root, lab)
    if old:
        finalize(root, old, 'abandoned')
    seen = set()
    for p in glob.glob(os.path.join(ev_dir(root), '*.json')):
        r = load(root, os.path.basename(p)[:-5])
        if r and r.get('state') == 'finalized' and r.get('outcome') != 'abandoned':
            seen.add((r['content_id'], r['fault_type']))
    aid = str(uuid.uuid4())
    rec = {'schema_version': SCHEMA, 'attempt_id': aid, 'content_id': lab, 'content_version': int(cver), 'lab': lab, 'state': 'started',
           'attempt_date': now(), 'scenario_family': family, 'scenario_instance_id': hashlib.sha256(aid.encode()).hexdigest()[:12],
           'fault_type': fault, 'previous_exposure': [{'content_id': c, 'fault_type': f} for c, f in sorted(seen)],
           'assistance_viewed': [], 'help_used': 'none', 'evidence': 'not recorded', 'checker': CHECKER}
    save(root, rec)
    with open(os.path.join(ev_dir(root), 'current-' + lab), 'w') as f:
        f.write(aid)
    print(aid)


def cmd_hint(root, lab, n):
    rec = current(root, lab)
    if not rec:
        return
    h = 'hint-' + str(int(n))
    if h not in rec['assistance_viewed']:
        rec['assistance_viewed'].append(h)
    rec['help_used'] = max(rec['assistance_viewed'], key=lambda x: int(x.split('-')[1]))
    save(root, rec)


def read_checks(root, aid):
    out = []
    try:
        lines = open(os.path.join(ev_dir(root), aid + '.checks')).read().splitlines()
    except OSError:
        return out
    for line in lines[:20]:
        parts = line.split('\t')
        if len(parts) == 4:
            out.append({'check': clean(parts[0], 80), 'expected': clean(parts[1], 200), 'observed': clean(parts[2], 200), 'pass': parts[3] == 'pass'})
    return out


def cmd_finish(root, lab, q1, q2, note):
    rec = current(root, lab)
    if not rec:
        print('none')
        return
    checks = read_checks(root, rec['attempt_id'])
    a1 = Q1[int(q1) - 1] if q1.isdigit() and 1 <= int(q1) <= len(Q1) else 'unsure'
    a2 = Q2[int(q2) - 1] if q2.isdigit() and 1 <= int(q2) <= len(Q2) else 'unsure'
    fault = rec['fault_type']
    named_ok = a1 == fault
    ruled_ok = a2 in RULED_OUT_OK.get(fault, set())
    fixed = bool(checks) and all(c['pass'] for c in checks)
    rec['checker_results'] = checks
    rec['reasoning'] = {'fault_named': a1, 'ruled_out': a2, 'fault_named_right': named_ok, 'ruled_out_valid': ruled_ok,
                        'provenance': 'learner-reported, compared by sq-lab'}
    note = clean(note, 500).strip()
    if note:
        rec['reflection'] = note
    outcome = 'fail' if not (fixed and named_ok and ruled_ok) else ('hinted-pass' if rec['assistance_viewed'] else 'independent-pass')
    finalize(root, rec, outcome)
    print(outcome)
    print('Fix: passed every check.' if fixed else 'Fix: did not pass every check (see above).')
    print('Cause: right.' if named_ok else 'Cause: the one you named was not the one that blocked access.')
    if ruled_ok:
        print('Ruled out: right.')
    elif a2 == fault:
        print('Ruled out: the cause you ruled out is the one that actually blocked access.')
    elif a2 in ('none', 'unsure'):
        print('Ruled out: missing. A pass needs one other likely cause checked and ruled out with something you saw.')
    else:
        print('Ruled out: that cause could not be ruled out that way in this lab.')
    if not ruled_ok:
        print('  ' + {'dir-x': 'Here you could have ruled out the file\'s own r (ls -l once the folder was fixed) or ownership (ls -l and id -un).',
                      'file-r': 'Here you could have ruled out the folders (namei -l showed x on each) or ownership (ls -l and id -un).'}.get(fault, ''))


def cmd_abandon(root, lab):
    rec = current(root, lab)
    if rec:
        rec['checker_results'] = []
        finalize(root, rec, 'abandoned')


def cmd_report(root, lab):
    rec = None
    try:
        rec = load(root, open(os.path.join(ev_dir(root), 'current-' + lab)).read().strip())
    except OSError:
        pass
    if not rec or rec.get('state') != 'finalized':
        print('No finished attempt for ' + lab + ' yet. Finish one first: sq-lab finish ' + lab, file=sys.stderr)
        sys.exit(1)
    out = {k: rec[k] for k in EXPORT if k in rec}
    print('SQR2 ' + json.dumps(out, ensure_ascii=True, sort_keys=True, separators=(',', ':')))


if __name__ == '__main__':
    a = sys.argv[1:]
    cmds = {'new': cmd_new, 'current': lambda r, l: print((current(r, l) or {}).get('attempt_id', '')),
            'hint': cmd_hint, 'finish': cmd_finish, 'abandon': cmd_abandon, 'report': cmd_report}
    if not a or a[0] not in cmds:
        sys.exit(__doc__)
    cmds[a[0]](*a[1:])
