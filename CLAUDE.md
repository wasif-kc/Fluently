# Fluently: build brief for Claude Code

**Read this whole file before writing any code.** It holds every decision made during planning (13 Nov 2026). Follow it exactly. If something here is unclear, or a decision seems wrong, ask Tonim before changing it. If Tonim changes a decision, update this file in the same session, so nothing gets lost between sessions.

---

## 0. How to work with Tonim

- Tonim is an IELTS Academic tutor in Sylhet, Bangladesh. **He is not a programmer.**
- Use plain words. If a technical word is needed, explain it in one short sentence.
- Keep replies short and to the point.
- Give one task at a time. When Tonim must do something (click, sign in, paste), give numbered steps and say exactly what he should see.
- After each build stage, start the app and tell him how to view it in his browser. Show screenshots where you can.
- Never ask him to edit code. He edits content only in the Excel file.
- Before any step that could cost money, delete data or publish the site, explain it and ask first.
- Keep a short `PROGRESS.md` file. After each session, record what was done, what is next and any open problems. Read it at the start of every session.

---

## 1. The product

**Fluently** is a free web platform for IELTS self-study.

- **Tool 1 (now):** Grammar.
- **Later tools:** Phrases and Idioms (next), then vocabulary, reading, listening and more. The platform must make adding a tool easy (see 3.6).

**Tonim's goals:**
1. A convenient, self-guided grammar practice that works well.
2. Test whether people want niche, personal practice tools beyond mock tests.
3. Collect student emails, only with clear consent, to share future content and products.
4. Easy for Tonim to update: he edits the Excel and runs one command.

**Branding:**
- Name: **Fluently**.
- Top bar, left side: "Fluently" in large bold type, followed by a smaller "· IELTS". Underneath, a small tagline: **"Prepare for IELTS like never before."**
- Footer of every page, small grey text on the right: **"Developed by Kishoar Wasif Chowdhury"**.
- Colours: navy `#1f3a5f`, teal `#1a9e8f`, light teal `#e8f6f4`, page background `#f6f8fb`, border `#e3e8ef`, muted text `#6b7a8c`, error red `#d93a3a`, success green `#1f9d55`, hint yellow `#ffc94d`.
- Default font: Inter.
- Look: clean, friendly and calm, with rounded cards (12–18px corners) and soft shadows.
- Reference pictures: the five `fluently_*.png` files in this folder show the **final agreed design**:
  1. `fluently_1_dashboard_and_profile_menu.png`: the dashboard, with the profile menu drawn open so its contents are visible. Normally it is closed.
  2. `fluently_2_rule_page.png`: the rule page, 75/25.
  3. `fluently_3_warmup_cards.png`: the warm-up, with no right panel.
  4. `fluently_4_drill.png`: the drill page, showing a correction being typed, a (?) blank tooltip and an open hint bubble. Normally only one pop-up is open at a time.
  5. `fluently_5_results_popup.png`: the results pop-up.

  The welcome tour has no picture; build it from 3.4 and AppText. If a picture and this file ever disagree, **this file wins**.

---

## 2. Content source: the Excel workbook

- **File:** `IELTS_Grammar_Content_Master.xlsx`. It is **final and approved**.
- Do not change the content sheets (Rules, Flashcards, Drills, Errors, Blanks). If something looks wrong, tell Tonim and let him decide.
- You may **add rows** to the AppText sheet for new on-screen wording. Tell Tonim which rows you added.

### 2.1 Sheets and the columns the app uses

**Units**
- Columns: `order`, `tag`, `unit_name`, `summary`.
- `tag` (SVA, ART, TNS…) is for the database and code only. **Students never see a tag.** Show `unit_name`.
- Ignore the count and `content_status` columns.

**Rules**
- Columns: `block_id`, `unit_tag`, `order`, `section`, `block_type`, `title`, `content`, `status`.
- Blocks are shown in `order`.
- `section` groups blocks. Each distinct section is one step in the rule page's quick-access list and one "Next rule" step.
- `block_type` values:
  - `heading`: section title (use `title`).
  - `text`: paragraphs. Blank lines separate paragraphs.
  - `key_rule`: a highlighted box, with `title` as its label.
  - `table`: one row per line, cells separated by ` | `. The first line is the header row.
  - `examples`: one example per line. Lines start with `✓ ` (correct, green) or `✗ ` (incorrect, red).
  - `tip`: a yellow box, with `title` as its label.
  - `steps`: one numbered step per line.

**Flashcards**
- Columns: `card_id`, `unit_tag`, `card_no`, `front_text` (the gap is shown as `____`), `options` (e.g. `has / have`), `answer`, `why`, `status`.

**Drills**
- Columns: `drill_id` (e.g. SVA-04), `unit_tag`, `drill_no`, `level` (Guided / Supported / Independent), `task_type` (internal), `topic`, `max_errors_label`, `review_note`, `paragraph`, `status`.
- In the paragraph, sentences are marked `(1) … (2) …`. These numbers are for matching only. **Never show sentence numbers to students.**
- Blanks are marked `[[B1]]`, `[[B2]]`, `[[B3]]`.

**Errors**
- Columns: `error_id`, `drill_id`, `sentence_no`, `wrong_text`, `accepted_fixes` (separated by ` | `), `hint`, `explanation`, `error_tag`, `is_review`, `status`.

**Blanks**
- Columns: `blank_id`, `drill_id`, `token`, `sentence_no`, `accepted_answers` (separated by ` | `), `first_letter`, `word_class`, `meaning`, `status`.

**FurtherStudy**
- Columns: `link_id`, `unit_tag`, `order`, `type` (Read / Watch / Own content), `title`, `url`, `description`, `status`.
- Show only rows with `status = approved` and a non-empty `url`.

**AppText**
- Columns: `page`, `text_id`, `text`, `notes`.
- **All on-screen wording comes from here.**
- `{name}`, `{n}`, `{unit}`, `{correct}`, `{total}` and `{time}` are filled in by the app.

### 2.2 Light-blue "auto" columns: do NOT read them

The workbook has formula columns: Units counts, Drills `title`, `error_count`, `blank_count` and `instruction_line`, and Blanks `level` and `display_hint`. A file saved by a script may not hold their results. **The content script must work these values out itself:**

- **Drill title:** `Drill {drill_no} · {topic}` (for example "Drill 4 · Economy"). Never show `task_type`.
- **Error count for a drill:** the number of Errors rows with that `drill_id`.
- **Instruction line** (shown under the drill title):
  - Guided or Supported: "1 error", "2 errors" or "3 errors" (the real count).
  - Independent: `Up to {max_errors_label} errors` (normally "Up to 3 errors").
  - **Never** show sentence locations. **Never** show blank counts.
  - Do **not** add the review note to what students see; `review_note` is internal.
- **Blank hint** (shown in the `?` tooltip), by the drill's level:
  - Guided: `first letter: {first_letter} · meaning: {meaning}`
  - Supported: `{word_class} · meaning: {meaning}`
  - Independent: `meaning: {meaning}`

### 2.3 Filters

Only rows with `status = approved` reach the app. All content is approved today. Ignore `notes` columns.

### 2.4 Text clean-up the app must do

These keep internal codes away from students:
- **Error hints:** some start with `Review (ART):`, `Review (SVA):` and so on. Replace the tag with the unit name, e.g. `Review (Articles):`.
- **Explanations:** these cite `Unit 2, Rule 4`. Replace `Unit N` with that unit's name, e.g. `Articles, Rule 4`. Leave `Rule N` alone; it refers to the current unit.

---

## 3. Technical setup (all free)

### 3.1 Stack (decided)

- React + Vite + TypeScript, with plain CSS (CSS variables for colours and themes). No heavy UI library.
- React Router for pages.
- Firebase:
  - **Authentication:** Google sign-in only.
  - **Firestore:** student data only.
  - **Hosting:** the website.
- Stay on the **free Spark plan**. Never enable anything that needs billing. Firebase Analytics is not used.
- Fonts are installed with the project (`@fontsource/inter`, `@fontsource/open-sans`, `@fontsource/atkinson-hyperlegible`). Georgia is a system font: `Georgia, "Times New Roman", serif`.
- The code lives in a GitHub repository. Commit after each stage, with short plain messages.

### 3.2 Content pipeline (Excel → app)

1. A Node script, `scripts/build-content.mjs`, reads the Excel file with the `xlsx` (SheetJS) package. It writes JSON files to `public/content/grammar/`: one `index.json` (units, AppText, overview) and one file per unit (`SVA.json`, …). Students download only the unit they open.
2. Tonim's command to update content is **`npm run content`**. After it, run **`npm run deploy`** to publish.
3. The script **checks the content** and stops with a plain-English message naming the row if any of these fail:
   - Every ID is unique.
   - Every `drill_id` in Errors and Blanks exists in Drills.
   - `wrong_text` appears exactly once, as whole words, in its sentence (the test in 4.1).
   - Every `[[B#]]` in a paragraph has one Blanks row, and every Blanks row has its token in the stated sentence.
   - Every blank has at least 2 accepted answers.
   - Every flashcard `answer` is one of its `options`.
   - Table rows have equal cell counts.
   - Example lines start with ✓ or ✗.
   - Every `text_id` the code uses exists in AppText. If one is missing, warn and use the built-in default.
4. A content `version` (date and time of the build) is written into `index.json`.

### 3.3 Student data (Firestore)

Use **one document per student**, `users/{uid}`, to keep reads and writes low:

```
{
  name, email, createdAt, lastSeenAt,
  emailOptIn: false, emailOptInAt: null,          // consent record
  tourDone: false,
  settings: { font: "inter", textSize: 100, dark: false },
  streak: { count: 0, lastDay: "YYYY-MM-DD" },     // student's local date
  last: { tool: "grammar", unit: "SVA", page: "drill", drill: 4 },
  grammar: {
    SVA: {
      sectionsRead: ["Introduction", "Rule 1", ...],
      cardsTurned: [1, 2, 3, ...],                 // card_no list
      drills: {
        "1": { done: true, bestErrorsFixed: 2, errorsTotal: 2,
               bestBlanksCorrect: 2, blanksTotal: 2,
               attempts: 1, bestTimeSec: 210, lastTimeSec: 210,
               lastHintsUsed: 0, lastDoneAt }
      }
    }, ...
  }
}
```

- Each tool's progress sits under its own key (`grammar`, later `idioms`…).
- **Writes:**
  - Save when the student finishes a rule section, turns a card (wait about 2 seconds and save several turns together), presses Check answers, changes settings, and on sign-out or page close.
  - Do not save on every keystroke.
- **Unfinished drills:** answers and the clock are kept only on the student's device (local storage, per drill), so they survive a page refresh. They are cleared when the drill is checked.
- **Security rules:**
  - A signed-in student can read and write only their own `users/{uid}` document.
  - Students cannot read other students' documents.
  - Only admin emails (see 3.5) can read all users.
  - Write the rules file and test it with the Firebase emulator.

### 3.4 Sign-in and first visit

1. The landing page (not signed in) shows the logo, the tagline, a short 2-line description, a **"Continue with Google"** button and a link to the Privacy page.
2. **On first sign-in only**, a short "Set up your profile" screen appears:
   - "What should we call you?" The name field is pre-filled with the Google first name and can be edited. Maximum 30 characters.
   - Checkbox, **unticked by default**: "Send me new lessons and updates by email." Ticking it records `emailOptIn = true` and the time.
   - A link to the Privacy page.
   - Button: "Let's start".
3. Then the dashboard opens with the **3-step welcome tour** (AppText `tour.title`, `tour.1`–`tour.3`, Skip / Next / "Get started"). Set `tourDone = true` when it is finished or skipped.
4. Use popup sign-in on computers and redirect sign-in on phones. Handle a closed popup gracefully.

### 3.5 Admin page (for Tonim only)

- Address: `/admin`. Visible only to emails in `ADMIN_EMAILS` in the settings file. Ask Tonim for the list; it is probably his Gmail and Kishoar's.
- It shows:
  - Total students.
  - New students per week.
  - Students active in the last 7 and 30 days.
  - Drills completed per unit.
  - Average best score per unit.
  - **The list of opted-in students** (name, email, opt-in date), with a **Download CSV** button.
- Only opted-in students appear in the email list. Never show or export emails of students who did not opt in.
- This page is how Tonim measures the market test.

### 3.6 Built for more tools

- Keep a `tools` list in one settings file, e.g.:
  - `{ id: "grammar", name: "Grammar", status: "live" }`
  - `{ id: "idioms", name: "Phrases and Idioms", status: "coming_soon" }`
- The dashboard builds itself from this list:
  - live tools show their topic cards.
  - coming_soon tools show one greyed-out card under the "Coming Soon" heading.
- Shared parts are separate, reusable components: top bar, footer, profile menu, rule renderer, card deck, results modal, ring.
- Each tool gets its own content folder and its own folder of pages.

### 3.7 Publishing

- Firebase Hosting. Use the free default address (`<project>.web.app`) until Tonim buys a domain. Later, connect the custom domain he chooses.
- Add the hosting address to Firebase Auth's "authorized domains".
- Meta title: "Fluently · IELTS practice". Add a simple description and a favicon (a teal "F").

---

## 4. Answer checking (exact rules)

### 4.1 Splitting sentences into tokens

Split each sentence into **tokens**. A token is a word, a number or a single punctuation mark. Use this pattern (it has been tested against every planted error):

```
/\[\[B\d\]\]|\$?\d+(?:,\d{3})*(?:\.\d+)?%?|[A-Za-z’'\-–]+%?|[^\sA-Za-z\d]/g
```

- Numbers like `5,000`, `$2.5` and `40%` stay as one token.
- Punctuation marks (`, . ; : ( )` …) are separate tokens.
- Every `wrong_text` lines up exactly with whole tokens.
- No sentence has more than one planted error, and the longest error is 6 tokens.

Display words with normal spacing: no space before `, . ; : % )`, and none after `(`.

### 4.2 How a student marks an error

1. Clicking (or tapping) a word **selects** it, with a soft yellow highlight.
2. Clicking more words in the **same sentence** stretches the selection from the first to the last clicked word, including any punctuation between them. Maximum 8 tokens. Clicking a word in another sentence starts a new selection.
3. A small box appears **just below the selected words**, labelled "Correction". It has a text field (focused automatically), a ✓ button to save and a ✕ button to cancel.
   - The box must not cover the line being read. If there is no room below, place it above.
   - Enter saves. Escape cancels.
4. A saved edit shows the student's text in place of the original, underlined in teal. Clicking it reopens the box. Saving an empty box removes the edit.
5. Blank inputs (`[[B#]]`) cannot be part of a selection.
6. Punctuation tokens can be selected by stretching across them. They are not individually highlighted on hover.

### 4.3 Comparing answers

Before comparing, both sides are:
- lower-cased,
- trimmed, with repeated spaces collapsed to one,
- given straight quotes and apostrophes (curly ones converted),
- given a plain dash for en dashes.

Punctuation is **not** ignored. "hours. this" and "hours. This" both count as the same; "hours, this" does not.

### 4.4 Grading an error

For each planted error, with `[a, b)` being the token range of `wrong_text` in its sentence:
1. Find the student's edits in that sentence that overlap `[a, b)`. If there are none, the error was **missed**.
2. Region = the smallest range covering `[a, b)` and all overlapping edits.
3. Student text = the original tokens in that region, with the student's edits applied.
4. For each accepted fix, expected text = the original tokens in that region, with `[a, b)` replaced by the fix.
5. If the student text equals any expected text after clean-up, the error is **fixed**. Otherwise it is **wrong**.
6. Edits that overlap no planted error are **unneeded changes**. They do not lower the score. In the results they are listed as: "You changed **X**, but this part was already correct."

### 4.5 Grading a blank

The blank is correct if the student's answer, after clean-up (4.3), equals any accepted answer. Blank inputs are about 150px wide and grow with the text.

### 4.6 Required automatic tests

These protect the final stage:
- For **every** error in the workbook:
  - each accepted fix, typed over exactly `wrong_text`, grades as fixed;
  - each accepted fix typed over a selection one word wider on each side (with those extra words retyped unchanged) also grades as fixed;
  - leaving it untouched grades as missed;
  - retyping the original `wrong_text` grades as wrong.
- For **every** blank, every accepted answer grades as correct, and an empty answer grades as wrong.
- Run these tests with `npm test`. They must pass before every deploy.

---

## 5. Progress, unlocking, streak and scores

- **All 12 grammar units are open** from the start. There is no locking between units.
- **Rule page:** not locked. A section is ticked as read when the student presses "Next rule" on it, or opens it from the quick-access list and reaches its end.
- **Warm-up:**
  - Open at any time.
  - A card counts as turned the first time it is flipped.
  - Right or wrong does not matter, because there is no answering, only flipping.
- **Drills:**
  - Locked until **all 10 warm-up cards** in that unit have been turned.
  - Drill 1 then opens. Each further drill opens when the one before it is **finished**.
  - Finished means Check answers was pressed, whatever the score.
- **Retakes:** allowed at any time from the drill list. Each drill keeps its **best** score; attempts are counted. A retake starts empty.
- **Unit ring (dashboard card and drill page):** best errors fixed across all drills in the unit ÷ total errors in the unit. **Blanks are not counted.** Show it as a % on the dashboard and as "5/22" plus "errors fixed" on the drill page.
- **Dashboard card status line:**
  - "Start with the rules" (nothing done)
  - "Warm-up next" (some rules read, warm-up not finished)
  - "Drills unlocked" (warm-up finished, no drills done)
  - "{n} of 10 drills" (some drills done)
  - "Completed" (all done)
- **Progress block stats (dashboard):**
  - Drills completed: the number of drills with `done = true`, across all units.
  - Errors fixed %: best errors fixed ÷ errors total, over **finished drills only**. Blanks are not counted.
  - Weakest area: among units with at least one finished drill, the one with the lowest errors-fixed % (finished drills only). If two units tie, the one earlier in the order wins. Show "—" until any drill is finished.
- **Streak:**
  - Count a day when the student **finishes at least one drill** that day, using the student's own local date.
  - Finishing a drill on the day after `lastDay` adds 1. Finishing on the same day changes nothing. A gap of more than one day resets the streak to 1.
  - Show the current count. If the last finished day is before yesterday, show 0.
- **"Pick up where you left off":** opens `last` (the last unit and page visited, and the drill if it was a drill page). For a new student it reads "Start your first topic" and opens Subject–Verb Agreement → Rules.

---

## 6. Pages (final agreed design)

### 6.1 Every page (signed in)

**Top bar:**
- Left: the logo block (section 1).
- Right, in this order:
  1. **Dashboard** link (hidden on the dashboard itself).
  2. **Streak badge:** a fire icon with a gentle flicker animation and the day count, e.g. "🔥 5 day streak". It is styled as a warm orange pill with a soft glow. Hover or tap shows AppText `bar.streak_tip`. Turn the animation off if the device asks for reduced motion.
  3. **Profile:** avatar circle with initial, name and ▼, which opens the profile menu.

**Footer:** an ⓘ icon with the page's how-to line (AppText) on the left, and "Developed by Kishoar Wasif Chowdhury" small on the right.

**Settings:** there is **no settings page and no display panel on any page**. All settings live in the profile menu.

### 6.2 Profile menu (dropdown under the name)

1. Name (bold) and email (grey).
2. **Edit your name.** It edits in place, inside the menu.
3. **Display:**
   - Font: four small buttons: Inter, Open Sans, Georgia, Atkinson. Each name is written in its own font.
   - Text size: `A−`, the current %, `A+`, from 90% to 130% in steps of 10.
   - The font and size apply to the reading content: rules, cards, the drill paragraph and results.
4. **Dark mode** on/off switch.
5. **Email updates** on/off switch: "Send me new lessons and updates by email". Record the time of each change.
6. **Privacy** link.
7. **Sign out** (red text).

All choices save to the student's account and apply on any device. They also stay on the device so the page doesn't flash on load.

### 6.3 Dashboard

Top to bottom:
1. **"Welcome back, {name}"**: large (about 44px), bold, navy, centered. On the very first visit it reads "Welcome, {name}". Under it, the intro line (AppText `dash.intro`), centered and muted.
2. **Progress block:** a full-width navy box with rounded corners, in the style of the earlier design Tonim preferred.
   - Left: "Your progress" (bold, about 22px) with "Errors fixed across all units" under it.
   - Right: three stats, each with a large white number (about 30px) and a small light label: **Drills completed**, **Errors fixed %**, **Weakest area**.
   - **No Continue button. No streak** (the streak is in the top bar). Text is slightly bigger than in the old mock.
3. **"Grammar" heading:** small uppercase grey label. Below it, 12 topic cards, 4 per row (2 on tablet, 1 on phone). Each card has:
   - the ring with %,
   - the unit name in bold (**no tag**),
   - the status line.
   - The unit last worked on gets a teal border.
   - Clicking a card opens that unit's rule page, or the warm-up or drill list if those were where the student last was in that unit.
4. **"Coming Soon" heading:** one card in the same style, greyed out with a dashed border, a lock in the ring, "Phrases and Idioms" and "Coming soon". It cannot be clicked.
5. **"Pick up where you left off"** button: large, teal, centered, showing the place it will open (e.g. "· Subject–Verb Agreement, Drill 4").

### 6.4 Rule page

- **75/25 layout:**
  - Left 75%: the content of the current section.
  - Right 25%: "On this page", the quick-access list of all sections, with ✓ on sections already read and the current one highlighted. The list stays in view while scrolling. On phones it becomes a "Sections" dropdown at the top.
- Breadcrumb above the content: "{Unit name} · Rules".
- One section is shown at a time. Render blocks as described in 2.1:
  - examples in red or green rows,
  - tables with a light header,
  - key rule in a teal box,
  - tip in a yellow box.
- At the bottom of each section:
  - "← Previous" (outlined),
  - "Section n of N" (small, grey),
  - a big teal **"Next rule: {next section title} →"**.
  - On the last section the button reads **"Start warm-up →"**.
- After the last section, show **Further study** links (title, type tag, short description) before the Start warm-up button.
- Footer how-to: AppText `rules.howto`.

### 6.5 Warm-up (flashcards)

- **No right panel.** Full-width content.
- Breadcrumb: "{Unit name} · Warm-up".
- Heading: **"Guess the missing word. Tap the card to check."** There is no subtext under it.
- Counter: 10 small dots (filled when the card has been turned) and "{n} of 10 cards turned".
- **Card row:**
  - 3 cards visible, scrolling sideways with arrows. Swipe on phones.
  - Front: "Card n", the sentence with the gap, the options in teal, and "Tap to see the answer" in small grey.
  - Click flips the card (a smooth 3D flip).
  - Back, on navy: the answer (large, light teal) and the "why" text. There is **no rule name or label on the back**.
  - Clicking again flips back.
- Bottom left: **"← Back to rules"** (outlined).
- Bottom right: **"Start drills"**.
  - Locked (grey, 🔒) until all 10 cards have been turned, with "Turn all 10 cards to unlock the drills." underneath.
  - When unlocked, it turns teal and opens Drill 1, or the first unfinished drill.
- Footer how-to: AppText (warm-up line).

### 6.6 Drill page

Keep this page calm, with as few distractions as possible.

**Left panel** (about 300px):
- The big progress ring ("5/22", "errors fixed").
- The unit name in **bold** under the ring, and "{n}% of this topic complete" under that.
- The drill list: "Drill 1 · Technology" … "Drill 10 · …". Each is marked ✓ (finished, green), ▶ (current, highlighted) or 🔒 (locked, grey). Locked drills show AppText `drill.locked` on hover.
- A small **hide button** (a « icon) at the top right of the panel folds it away; a » tab brings it back. The choice is remembered.
- On phones the panel starts hidden and opens as a drawer.

**Main area:**
- Header row, left:
  - the title **"Drill 4 · Economy"** (large, bold),
  - under it, a small amber chip with the instruction line ("2 errors" / "Up to 3 errors").
- Header row, right:
  - the **clock**, counting up (`mm:ss`, "time so far"). It starts when the drill opens, pauses while the browser tab is hidden and resumes after. There is no countdown and it doesn't affect the score.
  - next to it, a **small red square button with ✕ only** (about 40px, tooltip "Exit drill").
  - Exit opens a small confirm box: "Leave this drill? Your answers so far are saved on this device." with "Stay" and "Leave". **Do not use the browser's built-in alert boxes.**
- **Paragraph card:** white, rounded, large reading text (about 20px), with generous line height (about 2.2) so the correction box fits. **No sentence numbers.**
- **Blanks:** an inline text input with a teal underline, followed by a small round **(?)** button.
  - Clicking (?) shows a simple dark tooltip with that blank's hint (2.2), like normal website tooltips.
  - It closes when the student clicks anywhere else.
  - It is unlimited and does not count as a hint.
- **Bottom row:**
  - Centered: a large teal **"Check answers"** button.
  - Bottom right: the round yellow **Hint button** (light-bulb icon), with "2 hints left" underneath.

**Hint button rules:**
- Each click shows a small hint bubble just above the button, containing the `hint` of **one** planted error that is not yet correctly fixed. Use the first such error in reading order. The app checks this silently with the grading rules.
- The bubble stays until it is closed or another hint is opened.
- **Maximum 2 hints per attempt.** The label counts down "2 hints left" → "1 hint left" → "No hints left", and the button then greys out.
- If every error is already fixed when the student clicks, show "Your corrections look good so far. Check the blanks, then press Check answers." This does not use up a hint.
- Hints never cover blanks. Blanks have their own (?).

**Check answers:**
- If some blanks are empty, show a gentle note: "You have {n} empty blank(s). Check anyway?" with Check / Go back.
- Then grade everything and save the attempt.
- The **results pop-up** opens (6.7), and the bottom button becomes **"Next drill →"**.
- After drill 10, the button reads "Back to dashboard" instead, and the unit shows "Completed".
- **After checking, the paragraph becomes read-only** and is marked:
  - fixed errors in green, showing the student's correction;
  - missed or wrong errors in red, with the original crossed out and the correct form shown;
  - unneeded changes in grey;
  - blanks in green or red.
- A "Try again" link restarts the drill empty.

### 6.7 Results pop-up

- A centered modal over a dimmed page, with ✕ to close.
- Title: "Your results · Drill 4 · Economy".
- Three small chips: "{correct} of {total} correct" (errors plus blanks), "Time taken: mm:ss" and "Hints used: n".
- A line explaining the list (AppText `res.howto`).
- **One row per item**, in reading order. Each row has a green ✓ or red ✕ circle and a small grey label: "Error 1", "Blank 1", and so on.
  - **Errors:**
    - If fixed: "You wrote **rely**" plus the reason.
    - If wrong: "You wrote ~~xyz~~ · Correct: **is**" plus the reason.
    - If missed: "You did not change ~~are~~ · Correct: **is**" plus the reason.
    - The reason is shown as "Why: {explanation}", **for every error, even ones answered correctly**.
    - "Correct" shows the **first** accepted fix.
  - **Blanks:**
    - If correct: "You wrote **vulnerable** · Also correct: exposed, sensitive".
    - If wrong or empty: "You wrote ~~x~~ · Correct: **vulnerable**, exposed, sensitive".
    - **No explanation for blanks.**
  - **Unneeded changes:** "You changed **X**, but this part was already correct."
- Footer:
  - "Review this drill" (outlined): closes the modal and shows the marked paragraph.
  - **"Next drill →"** (teal), or "Back to dashboard" after drill 10.

### 6.8 Privacy page

Plain and short. It covers:
- what is stored: Google name, email and progress;
- why it is stored;
- that emails are used for updates **only if the student opted in**;
- how to opt out (the profile menu switch);
- how to ask for deletion (contact email; ask Tonim which one);
- that no data is sold;
- that the site uses Google Firebase.

Ask Tonim for the contact email and show him the final wording.

### 6.9 Error and empty states

- If content fails to load: "We couldn't load this lesson. Check your internet and try again." with a Retry button.
- Offline: show a small banner. Keep unsaved progress on the device and save it once back online.
- 404 page: a friendly message with a link to the Dashboard.

---

## 7. Look and feel details

- **Dark mode:** navy-black background `#0f1724`, cards `#17212f`, text `#e6edf5`, borders `#263244`. Teal stays. Check that every page is easy to read.
- **Responsive:** must work well from 360px phones up to large screens. Test the drill page carefully on a phone: tap to select, the correction box, blanks, (?) tips, hints and results.
- **Accessibility:**
  - Every action works with the keyboard.
  - Focus outlines are visible.
  - Buttons have labels for screen readers.
  - Text contrast meets WCAG AA.
  - Respect reduced motion.
- **Motion:** gentle only (card flip, ring fill, streak flicker). Nothing flashy.
- **Sizes:** body text 16px. Reading content scales with the text-size setting.

---

## 8. AppText

The sheet already contains rows for the dashboard, top bar, profile menu, rule page, warm-up, drill page, results and welcome tour. Use those `text_id`s.

When new wording is needed (sign-up screen, privacy, errors, confirm boxes, the empty-blanks note, the all-errors-fixed hint message, status lines), **add rows to AppText** with clear `text_id`s, keep a built-in default in the code, and tell Tonim.

---

## 9. Build order (one stage at a time; show Tonim after each)

1. **Setup.** Create the project, connect to GitHub and Firebase (guide Tonim through his parts), get fonts and colours in place, and show an empty page with the top bar and footer.
2. **Content script.** Write `npm run content` with all its checks, plus the grading engine (section 4) and its tests (`npm test`). **Do this early**, before any drill screens.
3. **Sign-in.** Landing page, Google sign-in, the first-visit profile screen with the opt-in, the user document and the security rules.
4. **Dashboard.** Including the progress block, topic cards, Coming Soon card, "Pick up where you left off" button and welcome tour.
5. **Profile menu.** Name, display settings, dark mode, email switch, sign out.
6. **Rule page.**
7. **Warm-up.**
8. **Drill page.** Selection and correction, blanks with (?), hints, clock, exit, check, results pop-up, review mode, retakes, unlocking.
9. **Streak and stats.**
10. **Admin page and Privacy page.**
11. **Full test pass.**
    - Run `npm test`.
    - Run a scripted browser test that signs in with a test account, completes a unit's warm-up and one drill, and checks the results.
    - Check on a phone-sized screen.
    - Check dark mode.
    - Confirm the Firebase free-plan limits are respected.
12. **Publish** with `npm run deploy`. Give Tonim the link, and write a one-page `HOW-TO-UPDATE.md`: edit the Excel → `npm run content` → `npm test` → `npm run deploy`.

---

## 10. Ask Tonim at the start (open items)

1. The admin email addresses for `/admin`.
2. The contact email for the privacy page and deletion requests.
3. Whether he has bought a domain yet (fine to launch on the free `.web.app` address first).
4. A Google account for testing, separate from his own (optional, but helpful).

---

## 11. Decisions already settled (do not reopen unless Tonim asks)

**Dashboard and layout**
- Unit tags (SVA, ART…) are never shown to students.
- No Continue button in the progress block. The streak is in the top bar, not in the block.
- Rule page split is 75/25.
- No display panel on any page; display settings live only in the profile menu.
- No right panel on the warm-up or drill pages.

**Drill page**
- Exit is a small red square ✕ beside the clock.
- The left panel on the drill page can be hidden.
- No sentence numbers, no sentence locations, no blank counts and no Task 1/Task 2 labels are shown.
- The clock counts up only, with no time limit.
- Hints: at most 2 per drill, one error each. Blank (?) tooltips are free and plain.

**Results**
- The results pop-up explains every error, even correct ones. Blanks show answers only.
- Unneeded changes don't lower the score.
- Answer comparison ignores capital letters and extra spaces, but not punctuation.

**Progress**
- Ring, errors-fixed % and weakest area count **errors only**.
- Drills unlock in order after all 10 warm-up cards have been turned. Units are never locked.
- The best score per drill is kept. Retakes are allowed.
- Progress saves automatically, with no Save buttons.

**Content and branding**
- The Excel is the single source of content. All rows are approved; FurtherStudy rows without links stay hidden.
- The Phrases and Idioms card is greyed out under "Coming Soon".
- Branding: "Fluently" with the tagline "Prepare for IELTS like never before." and the footer credit "Developed by Kishoar Wasif Chowdhury".
