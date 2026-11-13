# How to update Fluently

You only ever edit the Excel file. The website is rebuilt from it.

**The website:** https://fluently-b9f39.web.app (admin page: https://fluently-b9f39.web.app/admin)

## The easy way: ask Claude
Upload the new `IELTS_Grammar_Content_Master.xlsx` to a Claude Code session on this project and say "update the content and publish". Claude runs the steps below and tells you if any row needs fixing.

## The 4 steps (on a computer with Node installed)

1. **Edit the Excel** in the `content` folder: `IELTS_Grammar_Content_Master.xlsx`.
   - Keep the column names and the ID patterns (SVA-04, SVA-04-E1 …).
   - Set new or changed rows to `approved`.
2. **Update the content:**
   ```
   npm run content
   ```
   You should see `✓ Content checked and updated`. If you see `✗`, it lists each row to fix (sheet, row number and what is wrong). Fix them and run it again.
3. **Run the tests:**
   ```
   npm test
   ```
   You should see `Tests  … passed`. This checks every answer in the Excel against the answer checker.
4. **Publish:**
   ```
   npm run deploy
   ```
   You should see `✓ Published` and the website address.

## The GitHub button (no installing anything)
1. Put the new Excel file in the `content` folder on GitHub (open the folder, **Add file → Upload files**, then **Commit changes**).
2. Open the **Actions** tab → **Publish Fluently** → **Run workflow** → **Run workflow**.
3. Wait for the green tick (about 2 minutes). The site is updated.

The first time, the button needs a one-off key from Firebase (a "service account" saved as the `FIREBASE_SERVICE_ACCOUNT` secret). Claude will walk you through it.

## Adding a drill
1. **Drills** sheet: add a new `drill_id` and the paragraph, with `(1) (2) …` sentence numbers and `[[B1]]` blanks.
2. **Errors** sheet: one row per error. Copy `wrong_text` exactly from the paragraph.
3. **Blanks** sheet: one row per blank, with at least 2 accepted answers.

It unlocks after the drill before it, like the others.

## Changing on-screen wording
Every heading, button and instruction is in the **AppText** sheet. Change the `text` column only; keep the `text_id`. Words in curly brackets like `{name}` are filled in by the website, so keep them.
