# SkillQuest

An offline practice app for entry-level IT jobs: IT support & Microsoft 365, networking, security, Linux, software testing, code/Git/APIs and SQL. It builds into **one HTML file** that runs in any browser with no install and no internet. Progress is saved in the browser.

## Commands

| Command | What it does |
|---|---|
| `npm run build` | Builds `dist/SkillQuest.html` |
| `npm run install-app` (or `npm run release`) | One-command release: runs every check and stops on a failure, keeps the old install as `SkillQuest.prev.html`, installs to `Documents\Job Search\SkillQuest.html` (where the Desktop shortcut points), regenerates the public deck and, only if its cards changed, shows the diff and asks before committing and pushing it. Ends with a reminder to republish the phone version. `--yes` publishes without asking; `--no-deck` skips the deck. |
| `npm test` | Builds, then runs every check (see below) |
| `npm run export-deck -- --out C:/Users/User/Desktop/flashcards-project/index.html` | Regenerates the public Linux & Bandit command deck (GitHub Pages: aleisabek/Linux-Cheat-sheet) from the Linux cards. `logo.svg` in that repo is its logo and tab icon. Commit and push that repo to update the live page. |

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

## Progress safety

- Saved data that can't be read is copied to `skillquest-v1.corrupt-<time>` and never saved over; Today asks whether to restore a backup or start fresh.
- If the browser refuses to save (storage full or blocked), Today says so and offers a backup.
- Merge, restore and reset keep a snapshot first, so the last one can be undone from Progress.
- Imported backups are cleaned before use (`sanitizeBackup`): only known fields with the right types are kept, fixed journal questions are re-read from `QUIZ`, and other markup is reduced to safe formatting tags. Old backups still restore.
- A fresh browser or profile shows a "merge a backup" card instead of silently looking like a new start.
- Flashcards not yet due are practice only (no box change, no XP); missed cards are asked once more at the end of the session.
- Merging keeps a quiz miss from either device, and for each card the most recently reviewed record.
- Streak and best streak are recounted from the full-mission days (on load and after every merge), so days done on different devices add up. A recount only ever raises them.
- Job readiness counts only measures that fade (track mastery); tickets, console tasks and interview reps are shown as practice done.

## What the tests check

- Content shape, and that terminal answers accept valid variations and reject wrong commands.
- ~125,000 generated quiz questions, with every computed answer re-derived independently (subnetting, chmod, cron, CVSS, priority, boundaries and more).
- ~330,000 generated terminal and SQL tasks: patterns accept the model answer and reject other values; common alternative answers are accepted too (`feature-terminal-alts`).
- Terminal scenarios (multi-step, each step shows the last one's output) and read-the-output / fix-the-command tasks (`feature-chains`).
- No repeats: Quiz, Terminal, SQL and Exams never show the same question twice in one set (`feature-fresh`).
- Every SQL model answer run against a real SQLite copy of the practice database, rows compared with what the app shows.
- Flashcards: known topics, no duplicate fronts, escaped HTML, at most one PowerShell line, no Bandit level references, and the retained / fading / learning / new rules above.
- Append-only: every existing item in the five content arrays is still in the same position (`content-snapshot.json`).
- Public deck export: every Linux card exported unchanged, the page script parses, the logo is wired in, no job, interview or other-track content is included (the blocklist is read from `JOBS` and the ticket scenarios, so new employers are covered), and re-exporting unchanged cards gives a byte-identical page.
- Progress safety (`feature-safety`): unreadable saves are never overwritten, failed saves are reported, tampered backups are cleaned (no live markup, no crash from unknown exam types, `__proto__` ignored), old backups restore, undo works, and early flashcard review can't raise a box.
- Checks run in parallel (the SQLite check waits for the generator check that writes its cases).
