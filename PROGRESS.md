# Fluently: progress notes

Read this at the start of every session (CLAUDE.md section 0).

## Session 1 (13 Nov 2026)

### Done
Build stages 1–11 are built and tested on the local "pretend Firebase" (the emulators). Nothing is published yet.

| Stage | Status |
|---|---|
| 1 Setup | React + Vite + TypeScript, fonts, colours, top bar, footer, settings file (`fluently.config.json`). |
| 2 Content script + answer checker | `npm run content` with all checks; engine in `src/lib/engine.js`; `npm test` (554 tests: every error, every blank, broken-Excel checks, progress rules). |
| 3 Sign-in | Landing page, Google sign-in (popup on computers, redirect on phones), first-visit profile screen with unticked email box, user document, security rules + 10 rules tests (`npm run test:rules`). |
| 4 Dashboard | Welcome line, progress block, 12 topic cards, Coming Soon card, "Pick up where you left off", 3-step tour. |
| 5 Profile menu | Name edit, 4 fonts, text size 90–130%, dark mode, email switch (time recorded), Privacy, Sign out. |
| 6 Rule page | 75/25 with "On this page", Sections dropdown on phones, Next rule / Start warm-up, Further study links. |
| 7 Warm-up | 10 flip cards, dots + counter, arrows and swipe, Start drills locked until all 10 turned. |
| 8 Drill page | Tap/stretch selection, correction box, blanks with (?) tips, 2 hints, clock, exit confirm, check, results pop-up, review mode, retakes, unlocking, hideable drill list (drawer on phones). |
| 9 Streak and stats | Streak by local date, errors-only stats, weakest area. |
| 10 Admin + Privacy | `/admin` (totals, new per week, active 7/30 days, per-unit stats, opted-in list + CSV). Privacy page wording is in AppText. |
| 11 Test pass | `npm test`, `npm run test:rules`, `npm run test:browser` (signs in, rules, warm-up, a drill, results, saved progress, dark mode, phone size) all pass. |

### AppText rows added (120 rows, at the bottom of the AppText sheet)
No other cell in the workbook was changed. New rows by page:
- Top bar (2): bar.tagline, bar.streak
- Landing page (5): land.*
- First visit (10): setup.*, tour.skip/next/done/step
- Dashboard (15): dash.progress_*, dash.stat_*, dash.start_first, dash.coming_soon_card, status.* (card status lines), place.* (resume button)
- Profile menu (10): menu.*
- Rule page (6), Warm-up (7, including warm.howto for the footer), Drill page (28), Results pop-up (12)
- Errors and empty states (7): err.*
- Privacy page (18): privacy.* (the whole privacy text; `{email}` is filled from the settings file)

### Next
1. Tonim creates the Firebase project (free Spark plan) and sends the web-app config. Then Claude puts it in `fluently.config.json` (set `authDomain` to `<project>.web.app` so phone sign-in works).
2. Answers to the open questions: admin emails, contact email, domain, test account (CLAUDE.md section 10).
3. Tonim reads and approves the privacy wording (AppText rows privacy.*).
4. Publish (stage 12): either `npm run deploy` on a computer with Node, or the "Publish Fluently" button on GitHub (needs a `FIREBASE_SERVICE_ACCOUNT` secret). Ask Tonim before publishing.
5. Add the hosting address to Firebase Auth → Settings → Authorized domains (`.web.app` is usually there already).

### Notes for the next session (how things were built)
- Addresses use unit names, not tags: `/grammar/subject-verb-agreement/drill/4`.
- Extra fields in `users/{uid}` beyond CLAUDE.md 3.3: `grammar.{TAG}.lastPage`, `lastSection`, `lastDrill` (so a topic card reopens where the student was). Times are stored as numbers (milliseconds).
- After a drill is checked, "Pick up where you left off" points to the next drill.
- The content files keep each sentence's original spacing (`sp`), so "18–30" and "café" display as written; words written together (like "2000s") are selected as one piece.
- Saving the box with the same words as the original removes the edit (it is not a change).
- The security rules are generated from `fluently.config.json` by `npm run rules` (the admin list lives in one place).
- On this cloud machine the emulator cannot reload rules while running (proxy quirk): restart it after changing admin emails.
- The JS bundle is about 280 KB compressed, mostly Firebase.

### Open problems
- None blocking. Waiting for Tonim's Firebase project and answers.
