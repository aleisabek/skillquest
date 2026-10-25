"""Runs every SQL model answer against a real SQLite database built from the app's data,
and compares the rows with the result the app shows."""
import json, os, sqlite3
d = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".tmp", "sql_dump.json"), encoding="utf-8"))
con = sqlite3.connect(":memory:")
for name, t in d["db"].items():
    con.execute("CREATE TABLE %s (%s)" % (name, ", ".join(t["cols"])))
    con.executemany("INSERT INTO %s VALUES (%s)" % (name, ",".join("?" * len(t["cols"]))), t["rows"])
bad, seen = 0, set()
for c in d["cases"]:
    if c["q"] in seen:
        continue
    seen.add(c["q"])
    got = [list(r) for r in con.execute(c["q"]).fetchall()]
    exp = c["rows"]
    if not c["ordered"]:
        got, exp = sorted(map(str, got)), sorted(map(str, exp))
    if got != exp:
        bad += 1
        if bad < 10:
            print("MISMATCH", c["q"], "\n  app:", exp, "\n  sqlite:", got)
print("distinct queries run in SQLite:", len(seen), "| mismatches:", bad)
raise SystemExit(1 if bad else 0)
