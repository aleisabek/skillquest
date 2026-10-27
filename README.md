# SkillQuest

An offline practice app for entry-level IT jobs: IT support & Microsoft 365, networking, security, Linux, software testing, code/Git/APIs and SQL. It builds into **one HTML file** that runs in any browser with no install and no internet. Progress is saved in the browser.

## Commands

| Command | What it does |
|---|---|
| `npm run build` | Builds `dist/SkillQuest.html` |
| `npm run install-app` | Builds and copies it to `Documents\Job Search\SkillQuest.html`, where the Desktop shortcut points |
| `npm test` | Builds, then runs every check (see below) |

## Phone version

`npm run build` also writes `dist/SkillQuest-phone.html`: the same app with `PHONE = true` (no file downloads or microphone; backups move by copy/paste), shaped for the claude.ai artifact viewer. It is published as a **private** artifact at:

**https://claude.ai/artifact/94UVR69nmwKTGZRyYr7pb2**

Always republish to that same URL so progress saved on the phone survives updates. PC and phone keep separate progress; combine them with Progress → Copy backup on one device and "Merge pasted backup" on the other.

## Layout

```
src/
  shell.html      page skeleton ({{STYLE}} and {{SCRIPT}} are filled in by the build)
  styles.css      hacker theme (matrix / cyber / amber modes)
  content.js      tracks, flashcards, quiz questions, terminal tasks, interview bank, SQL challenges, ticket scenarios
  lessons/*.js    per-skill mini-lessons (loaded after content.js)
  generators.js   random problem generators for quizzes, terminal and SQL
  app.js          state, views and features
tests/            checks run by npm test
assets/           app icon (.ico for the shortcut, .png)
tools/            make_icon.py (redraws the icon; needs Pillow)
build.js          concatenates src/ into one file
```

## Break-and-fix labs (WSL)

`labs/` holds real Linux labs that run in WSL Ubuntu, sandboxed in `~/sq-labs` (no sudo, nothing else touched).

| Command | What it does |
|---|---|
| `wsl bash /mnt/c/Users/User/Documents/SkillQuest/labs/install.sh` | Installs/updates the labs and the `sq-lab` command |
| `wsl bash /mnt/c/Users/User/Documents/SkillQuest/labs/test-labs.sh` | Runs every lab end to end (break → wrong fix caught → right fix passes → reset) in a throwaway home folder |

Each lab is `labs/labs/NAME/lab.sh` with `TITLE`, `LEVEL`, `LESSON`, `HINTS`, and the functions `lab_setup`, `lab_mission`, `lab_check` and optionally `lab_cleanup`. The completion code is the first 6 hex characters of `sha256("skillquest-lab:NAME")`; `src/labs.js` must list the same code (checked by `npm test`).

## Rules that keep saved progress safe

- **Only append** to the arrays `CARDS`, `QUIZ`, `TERM`, `IV`, `SQLT`. Saved progress is keyed by array position. `tests/content-snapshot.json` enforces this; after a deliberate wording fix, refresh it with `node tests/feature-content-order.js --update`.
- Flashcards are `[track, level, front, back, topic]`. Every Linux card needs a topic from `CARD_TOPICS` (Browse filters by it). A PowerShell equivalent goes at the end of the back in `<span class="ps">PowerShell: …</span>`; leave it out when there is no real equivalent.
- Cards teach techniques, never Bandit level answers or passwords (checked by `npm test`).
- Every quiz generator in `GEN[track][level]` needs a matching skill name in `GEN_SKILLS`, in the same order.
- Generated answers must be **computed from the random values** and pass `npm test`.

## Honest mastery

A track level's % is the share of its quiz questions and flashcards that are **retained right now**:

- a card counts while it is at box 3+ and not overdue by more than its own review gap (it shows as *Fading* after that);
- a quiz question counts only if your latest answer to it was right.

Tracks and Progress show the four counts behind it: Retained, Fading, Learning, New. New flashcards are limited to 10 a day across all tracks.

## What the tests check

- Content shape, and that terminal answers accept valid variations and reject wrong commands.
- ~125,000 generated quiz questions, with every computed answer re-derived independently (subnetting, chmod, cron, CVSS, priority, boundaries and more).
- ~50,000 generated terminal and SQL tasks: patterns accept the model answer and reject other values.
- Every SQL model answer run against a real SQLite copy of the practice database, rows compared with what the app shows.
- Flashcards: known topics, no duplicate fronts, escaped HTML, at most one PowerShell line, no Bandit level references, and the retained / fading / learning / new rules above.
- Append-only: every existing item in the five content arrays is still in the same position (`content-snapshot.json`).
