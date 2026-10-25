# SkillQuest

An offline practice app for entry-level IT jobs: IT support & Microsoft 365, networking, security, Linux, software testing, code/Git/APIs and SQL. It builds into **one HTML file** that runs in any browser with no install and no internet. Progress is saved in the browser.

## Commands

| Command | What it does |
|---|---|
| `npm run build` | Builds `dist/SkillQuest.html` |
| `npm run install-app` | Builds and copies it to `Documents\Job Search\SkillQuest.html`, where the Desktop shortcut points |
| `npm test` | Builds, then runs every check (see below) |

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

## Rules that keep saved progress safe

- **Only append** to the arrays `CARDS`, `QUIZ`, `TERM`, `IV`, `SQLT`. Saved progress is keyed by array position.
- Every quiz generator in `GEN[track][level]` needs a matching skill name in `GEN_SKILLS`, in the same order.
- Generated answers must be **computed from the random values** and pass `npm test`.

## What the tests check

- Content shape, and that terminal answers accept valid variations and reject wrong commands.
- ~125,000 generated quiz questions, with every computed answer re-derived independently (subnetting, chmod, cron, CVSS, priority, boundaries and more).
- ~50,000 generated terminal and SQL tasks: patterns accept the model answer and reject other values.
- Every SQL model answer run against a real SQLite copy of the practice database, rows compared with what the app shows.
