# SkillQuest

[![tests](https://github.com/aleisabek/skillquest/actions/workflows/test.yml/badge.svg)](https://github.com/aleisabek/skillquest/actions/workflows/test.yml)

Every push runs the full suite in GitHub Actions: the Node checks (`npm test`) and every WSL lab end to end on Ubuntu (`labs/test-labs.sh`).

An offline practice app for entry-level IT jobs: IT support & Microsoft 365, networking, security, Linux, software testing, code/Git/APIs and SQL. It builds into **one HTML file** that runs in any browser with no install and no internet. Progress is saved in the browser.

## Commands

| Command | What it does |
|---|---|
| `npm run build` | Builds `dist/SkillQuest.html` |
| `npm run install-app` (or `npm run release`) | One-command release: runs every check and stops on a failure, keeps the old install as `SkillQuest.prev.html`, installs to `Documents\Job Search\SkillQuest.html` (where the Desktop shortcut points), regenerates the public deck and, only if its cards changed, shows the diff and asks before committing and pushing it. `--yes` publishes without asking; `--no-deck` skips the deck. |
| `npm test` | Builds, then runs every check (see below) |
| `npm run export-deck -- --out C:/Users/aleis/Documents/Linux-Cheat-sheet/index.html` | Regenerates the public Linux & Bandit command deck (GitHub Pages: aleisabek/Linux-Cheat-sheet) from the Linux cards. `logo.svg` in that repo is its logo and tab icon. Commit and push that repo to update the live page. |

## Phone version

`node build.js --phone` writes `dist/SkillQuest-phone.html` (normal builds no longer do): the same app with `PHONE = true` (no file downloads or microphone; backups move by copy/paste), shaped for the claude.ai artifact viewer, and built without `src/private.js`.

**Retired 2026-11-12:** the published phone artifact was deleted and is no longer updated. The build target stays (opt-in since 2026-11-12, so normal builds skip it) because its private-content guard is the starting point for a later public build.

## Layout

```
src/
  shell.html      page skeleton ({{STYLE}} and {{SCRIPT}} are filled in by the build)
  styles.css      six deep-space glass looks (warp style, one world per look)
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
| `wsl bash /mnt/c/Users/aleis/Documents/skillquest/labs/install.sh` | Installs/updates the labs and the `sq-lab` command |
| `wsl bash /mnt/c/Users/aleis/Documents/skillquest/labs/test-labs.sh` | Runs every lab end to end (break → wrong fix caught → right fix passes → reset) in a throwaway home folder |

Each lab is `labs/labs/NAME/lab.sh` with `TITLE`, `LEVEL`, `LESSON`, `HINTS`, and the functions `lab_setup`, `lab_mission`, `lab_check` and optionally `lab_cleanup`. The completion code is the first 6 hex characters of `sha256("skillquest-lab:NAME")`; `src/labs.js` must list the same code (checked by `npm test`).

Security labs (`cloudtrail-hunt`, `iam-tighten`, `ssh-harden`, `secret-leak`, `vuln-triage`) each practice one lesson: the lab's `lesson` field in `src/labs.js` names it, and that lesson ends with a "Try it for real" link to the lab (PC build only, never in a locked preview). They use python3, git and standard Ubuntu tools only (no jq, no real sshd), and pass only when the fix is **secure and still works**. `labs/test-solutions/NAME.sh` holds the fixtures for each: `right` and `alt` (a different valid fix) must pass; `wrong` (insecure), `broken` (secure but breaks the service) and `crash` (the checker's inputs destroyed) must fail. sq-lab fails closed: a check passes only if nothing failed and at least one check actually ran. `npm test` checks that every lab folder has a run line, every security lab's lesson exists and links back, and that passing labs never changes a full day or the streak. Labs credit only skills on tracks you've opened, so a lab can't unlock a later path stage early.

### Permissions pilot (Labs → Permissions pilot)

One pilot exercise, judged by independent and delayed evidence rather than completion. Current user only: you own every file; no other users, no sudo, no services.

1. **Worked example** (in the app, `pilotScene` in `src/scenes.js`): a config you own won't open. Two prediction pauses; each check says what it establishes and what is still unknown. Viewing it is help, not evidence.
2. **`perm-guided`**: the same fault (the file's own r), new names, up to three hints. Practice, never independent evidence.
3. **`perm-diagnose`**: same symptom, a fault not shown in steps 1–2 (a folder on the path lacks x). No hints. The first finished attempt is the independent evidence; later attempts are practice.
4. **`perm-recheck`**: a fresh instance of the step 3 fault. Counts as the delayed check only 3+ days after an independent pass (the app works that out from the dates). Transfer (4b) is deferred.

Pilot labs set `PILOT=1` and share `labs/lib/perm-family.sh` (each attempt builds its own instance from its id; decoys sit beside the fault; tightening them is fine). An attempt is **started → checked any number of times (no credit) → finished once**: `sq-lab finish NAME` runs the checks, asks what blocked access and which other cause you ruled out (numbered choices, "not sure" allowed; `--q1/--q2/--note` for tests), grades it and prints the explanation. A pass needs the working state *and* the right cause *and* a cause genuinely ruled out by an observation. `sq-lab report NAME | clip.exe` prints one ASCII line, `SQR2 {json}` (evidence schema 2, built by `labs/sq-evidence.py`, never by bash). Records live in `~/sq-labs/.evidence` and survive reset; sq-lab refuses to change a finished attempt (the file itself is yours, so that is a convention, not a lock). Before starting, sq-lab checks that permissions are really enforced (a mode-000 file must be unreadable), so it refuses as root or on a Windows drive.

In the app (`src/pilot.js`) a pasted report is an **imported checker report**: every field is allowlisted with a type and a size limit, unknown fields and future schema versions are refused with a plain reason, and the claims that can be re-derived (the reasoning grade, the outcome) are. Nothing on import is irreversible: the evidence panel, the journal entries (a step 3/4 fail with its retry command; the delayed check, due after 3 days) and "unresolved" are all worked out from `S.evidence` each time. Two different reports with one attempt id are both kept, the attempt is unresolved and counts for nothing until you keep one (the other is marked superseded, with your note). Pilot results never change practice scores. Backups keep the reports (a damaged or newer one is refused and counted in the restore message); merges take the union and give the same result either way. The old completion-code "Permission denied" lab is shown as legacy.

`labs/test-labs.sh` runs each pilot lab through: refusal when permissions aren't enforced (and as real root, where sudo works), finish without a fix, right/alt/tighten fixes pass, wrong (widens access)/broken/copy/crash fail, wrong cause / nothing ruled out / ruling out the real cause fail, hints recorded, one finish only, reset with a folder missing x, records kept, and every report accepted by the app's own validator (`tests/validate-report.js`, needs node). `npm test` adds `feature-pilot` (validation, conflicts, import order, backup, merge both ways, what each step may count) and browser checks of the Labs page.

## Rules that keep saved progress safe

- **Only append** to the arrays `CARDS`, `QUIZ`, `TERM`, `IV`, `SQLT`. Saved progress is keyed by array position. `tests/content-snapshot.json` enforces this; after a deliberate wording fix, refresh it with `node tests/feature-content-order.js --update`.
- Flashcards are `[track, level, front, back, topic]`. Every Linux card needs a topic from `CARD_TOPICS` (Browse filters by it). A PowerShell equivalent goes at the end of the back in `<span class="ps">PowerShell: …</span>`; leave it out when there is no real equivalent.
- Cards teach techniques, never Bandit level answers or passwords (checked by `npm test`).
- Every quiz generator is labelled where it is defined: `sk('Skill name', ()=>{...}, {noType, lookup})`. The app refuses to start with an unlabelled one, and the label must match a lesson (`quiz:track:Skill name`). Skill ids are append-only (`tests/skill-snapshot.json`; refresh with `node tests/feature-skills.js --update` after adding skills).
- Generated answers must be re-derived in `tests/quiz-generators.js`, unless the generator is marked `{lookup:true}` (its answer comes from a fixed table). A computed generator nobody re-checks fails the tests.
- Generated answers must be **computed from the random values** and pass `npm test`.

## Honest mastery

A track level's % is the share of its quiz questions and flashcards that are **retained right now**:

- a card counts while it is at box 3+ and not overdue by more than its own review gap (it shows as *Fading* after that);
- a quiz question counts only once it has been answered right on **two different days** (`S.qfirst` holds the first day of the current run, `S.quiz` the latest; a miss restarts the run, and clearing it in the mistake journal counts as two days), and only while that latest right answer is under 30 days old (it shows as *Fading* after that, and Review offers "Fading quiz questions"). Old `true` values from earlier versions become the day they were first loaded or merged, and answers from before the two-day rule count as one day.

A skill is **Strong** only with a score of 85+ *and* right answers on two different days (`rd`/`lr` on its mastery record); a high score from a single day shows as "Strong once". `feature-twoday` covers answering, misses, the journal, migration, backups and merges.

Tracks and Progress show the four counts behind it: Retained, Fading, Learning, New. New flashcards are limited to 10 a day across all tracks.

## Daily learning loop (Today)

Each day: **Learn** 3 two-minute lessons → **Practice** 4 typed exercises from each of those skills → **Apply** one ticket or interview rep in the main skill's area → **Reviews**. Today shows it as a 4-step checklist with a **Next up** button, the last 14 days, one suggested free lab (matched to today's skills, rotating away from ones used this week) and a one-line tip.

- **Path:** cloud security + red team, foundations first (`PATH` in app.js). Every beginner skill stays; the path only orders them. Per track, Level 1 comes first and Level 2 opens once the track's Level 1 skills average 70%. Weights: Linux, networking, security 3; code, SQL, cloud and offensive security 2; IT support 1; Software Testing is not on the path (still in Study). Cloud Security and Offensive Security are the later stages (see their sections below).
- **Today's 3 skills** (`dailyPlan`, fixed for the day in `S.plan`): two path skills from different tracks (started-but-weak first, then new ones by weight and level) plus one slipping skill you've started (or a third track when none is slipping).
- **Lessons come back** when a skill you've read drops under 50% or you miss 2+ of its exercises in a day (`S.slip`); otherwise a read lesson is skipped as healthy.
- **Day flags:** `p0`–`p2` per practice slot, `practice` when all three are done, `learn` when no needed lesson is left (once something was actually done), `apply`, and `rev`.

## Streak

A day is **full** when the loop (learn, practice, apply) is done **and** reviews are handled; days from before the loop count with the old three missions. Reviews are handled when there is: nothing due (cards, mistake retries, fading quiz questions), or 20 reviewed that day so a backlog can't block it. `S.days[day].rev` records it (`false` = not yet); days saved before this rule have no `rev` and still count. Today shows it as step 4 of the checklist.

What counts as one review: a due flashcard rated (Again or Got it; new, early and second-try cards don't count), the first retry of a mistake each day (a mistake is due from the day after it was made; a missed retry comes back tomorrow), and any answer to a fading quiz question. Reviews count toward the day they're done, so finishing yesterday's reviews after midnight doesn't save yesterday. When devices merge, a day's review count keeps the larger of the two, not the sum.

## Navigation

Six top tabs group the screens, with sub-tabs: Today · Study (Skills, Tracks) · Hands-on (Terminal, SQL, Labs) · Job prep (Interview, Tickets, Exams, Job practice) · Review (Review, Progress) · Guide (How to use, Free resources). Screen keys are unchanged, so `go('sql')` etc. still work; a top tab returns to the sub-tab you last used.

## Progress safety

- Saved data that can't be read is copied to `skillquest-v1.corrupt-<time>` and never saved over; Today asks whether to restore a backup or start fresh.
- If the browser refuses to save (storage full or blocked), Today says so and offers a backup.
- Merge, restore and reset keep a snapshot first, so the last one can be undone from How to use → Backup. If the browser refuses that undo copy, nothing changes; only where storage is blocked outright (so restoring could never work otherwise) does it offer to go ahead, saying it can't be undone, with Cancel as the default; if it refuses the new progress, the old progress and the earlier undo copy are put back and the page says so. Undo uses up its copy only after the restored progress has saved. When storage doesn't work at all, a chosen restore or merge lasts for that session and the page tells you to download a backup.
- Imported backups are cleaned before use (`sanitizeBackup`): only known fields with the right types are kept, fixed journal questions are re-read from `QUIZ`, and other markup is reduced to safe formatting tags. Old backups still restore.
- Automatic sync (How to use → Backup, Chrome and Edge only): progress is written to a file you pick in a cloud folder, as file + this device merged with `mergeProgress`, so neither computer overwrites the other; a file that isn't a readable backup is never written over; the file is merged in only at startup, on Today or on the Backup page (never mid-quiz); Reset everything turns sync off first. The picked file is kept in IndexedDB, not in progress. `feature-sync-browser` checks it in a real browser with a stand-in file.
- A fresh browser or profile shows a "merge a backup" card instead of silently looking like a new start.
- Merging is order-independent: phone into PC gives the same progress as PC into phone (`feature-merge` checks 3,000 random conflicting pairs both ways). For a skill's score the newer record wins, so a recent lapse isn't erased by an older record with more practice, and on the same day the lower score wins. Only this device's view state (today's plan, recently shown items) stays with the device you merge into.
- Flashcards not yet due are practice only (no box change, no XP); missed cards are asked once more at the end of the session.
- Merging keeps a quiz miss from either device, and for each card the most recently reviewed record.
- Streak and best streak are recounted from the full-mission days (on load and after every merge), so days done on different devices add up. A recount only ever raises them.
- Job practice counts only measures that fade (track practice scores); tickets, console tasks and interview reps are shown as practice done.
- Honest labels: a skill's number is a "practice score" (it reflects answers here, including questions seen before), not mastery or readiness. A practice set counts as done with one right answer, and Today says that's practice done, not mastery. Exams are "partial practice": each says which share of the real exam's weight it has questions for, lists unmeasured domains (no questions, never shown as 0%) and thin ones (a few repeating questions), and gives no readiness or booking advice (`feature-trust` checks the wording).

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
- Answer meaning and honest progress (`feature-trust`): quotes that merge words don't pass (`'ls -la'`), grep/rsync flags that change the result (`-v`, `-c`, `-l`, `-q`, `-o`, `-I`, `rsync -n`) are never credited, quoted SQL text keeps its case (`'it'` isn't `'IT'`; LIKE ignores case, as in SQLite), a solved Terminal task is credited once and waits for Next, restore/merge/erase/undo never lose the undo copy or claim a save that failed, and a microphone permission that arrives after you left never records. Each was checked by putting the old bug back and watching the test fail.
- Checks run in parallel (the SQLite check waits for the generator check that writes its cases).
- Permissions pilot (`feature-pilot`): lab reports are validated in full (unknown fields, future versions and self-graded claims refused), never touch practice scores, survive backup → restore, merge the same way in both directions, and conflicting reports for one attempt are both kept and count for nothing until one is chosen. Guided passes never count as independent, a retry is practice, and a delayed check counts only 3+ days after an independent pass.
- Lessons (`feature-lessons`): every lesson has why / idea / example / mistakes / say. Lessons in the newer format also have `seen` ("You'll see this as": a real log line or config) and `spot` ("Spot the problem": `{q, a}`), and must explain every acronym the first time (`ACRONYM (expansion)` or `expansion (ACRONYM)`; a short list of common ones is exempt). Security lessons may not mention trading.

Note on new skills: adding Level 1 skills to a path track lowers that track's Level 1 average until you learn them, so its unstarted Level 2 skills can leave the daily plan for a while (started ones still return in the slipping slot). That's intended: new foundations come first.

## Animated lessons ("Watch it")

`src/scenes.js` holds small animated explainers shown in a lesson between "The core idea" and the worked example. They are SVG drawn from data, not video: a few KB each, offline, crisp at any size, and they follow the three themes.

- A scene is `{els, steps}`: `els` is the drawing, each step changes some elements' class, text or style. `sceneState(scene, n)` applies steps 0..n, so every step is a complete picture; Back, Replay and reduced motion use it, and so do the tests. CSS transitions animate between pictures.
- Never autoplays: it opens paused on step 1 with Back, Play and Next buttons (Play moves on at once, and reads Replay on the last step); ← / → / Space work only while focus is inside the scene, and focus moves to the other button when one is disabled. The buttons sit right under the picture, before the caption in the page order too, so they never move and keyboard order matches what you see; the caption is an `aria-live` region that takes each step's own height; the SVG has its own short description. Elements can be grouped (`parentId`) and a step can set its own time (`ms`).
- Only one scene is live; `go()` and a new lesson destroy it, and its animation loop (`sceneTick`) stops itself once the scene leaves the page or the tab is hidden.
- Colours come only from theme classes; meaning is also carried by shape and label (solid network bits, dashed host bits). Reduced motion turns transitions off but keeps stepping.
- Numbers are computed, never drawn by hand: each scene runs its lesson's own worked example through a small model (`subnetMath`, `permMath`, `fwEval`, `sshdRead`, `iamEval`), and `feature-scenes` checks those models independently and checks the lesson text says the same thing (the firewall table, the sshd files, the IAM statements, the leaked commit and the response order).
- Six scenes: Subnetting, Permissions (chmod 640 vs 777), Firewalls (first match wins), SSH hardening (the first value wins), IAM (an explicit Deny wins) and a leaked key in git history. Each has a Try it panel.
- Predictions: a step can ask before the next one shows the answer (`ask:{options:[[label, right?], ...]}`). Pick a choice or just press Next; Play stops at a question. Choices are never saved or scored: watching stays active without turning into a test. The five newer scenes ask twice each.
- `feature-scenes` checks every scene's data: a real lesson, 3 to 12 steps, captions, known elements, deterministic and changing steps, no hard-coded colours or outside assets, about 15 KB a scene on average, Try it included (the first budget, 60 KB, was set when there was one scene). `feature-scenes-browser` opens each scene in headless Chrome or Edge in all three themes and checks the controls, keys, no autoplay, reduced motion, that labels stay at 12px or more on a 360px screen, real key presses only act inside the scene, and that leaving mid-animation stops it with no errors. It skips when no browser is installed, but must run in CI.

## Cloud Security (path stage)

The `cloud` track opens only when Security and Networking Level 1 each average 70% (`PATH.after`) and stays open once started. Later-stage tracks together take at most one of the day's three lessons (`PATH.gatedMax`); one gets the third slot when nothing has really slipped (under 70), or whenever that track hasn't been practiced in 3 days. Until a track opens, the Skills map and Tracks show it locked with the real distance to unlock, plus a read-only sample lesson that records nothing; Browse, drills and Job readiness practice stay closed. Product names follow 2026 naming (vendor-neutral concepts first); `feature-names` fails on outdated names (e.g. Azure AD) unless written as "formerly …".

## Offensive Security (path stage)

The `offsec` track is the last stage: it opens when Security, Networking, Linux and Code Level 1 all average 70%, and shares the single later-stage slot with Cloud. It teaches how authorized testers think, always defense first: scoping and authorization (first), engagement types, injection, access control failures, password attacks and detection, MITRE ATT&CK and the kill chain, and the findings report (CVSS plus exposure plus CISA KEV). OWASP categories are taught by name, never rank number.

- `feature-offsec-safety` scans every Offensive lesson, card, quiz question, the `scope` ticket and 300 generated exercises per generator for payload strings, attack-tool names and commands, and step-by-step attack phrasing, and proves the scanner catches samples of each.
- Every vulnerability-class lesson (all except the process lessons) must have `prevent` and `detect` sections, shown as "How to prevent it" and "How to detect it".
- Practice it legally: Free resources lists PortSwigger Web Security Academy, OWASP Juice Shop (run it yourself) and MITRE ATT&CK.
