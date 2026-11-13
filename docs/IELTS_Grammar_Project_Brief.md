# Fluently: Grammar content brief

This file explains the grammar content and the Excel workbook behind it: what is in it, how it was made, how it was checked, and the rules every row follows. Read it together with **CLAUDE.md**, which covers how the app is built. If the two ever disagree, **CLAUDE.md wins**.

---

## 1. What this is

**Fluently** is a free IELTS self-study platform. Grammar is its first tool.

The grammar tool has **12 units**. Each unit has three parts, done in order:
1. A **rule page**: a short, friendly explanation with tables and examples.
2. **10 warm-up flashcards**: the student guesses the missing word, then flips the card.
3. **10 proofreading drills**: a short IELTS-style paragraph in which the student finds and fixes planted grammar errors and fills in vocabulary blanks.

**Who it is for:** IELTS Academic candidates at beginner to intermediate level. The tone is academic but not dry. Examples are everyday and easy to relate to. Difficulty rises gently, and the drills must never feel punishing.

**Owner:** Tonim (IELTS tutor, Sylhet, Bangladesh).
**Developer credit on the site:** Kishoar Wasif Chowdhury.

---

## 2. Status of the content (as of 13 Nov 2026)

- **Final and approved.** Every rule block, flashcard, drill, error and blank is marked `approved`.
- Three rounds of checks have been done:
  1. Automatic checks, listed in section 6.
  2. A full proofread of every corrected paragraph.
  3. A review by an outside grammar expert. Of his 89 suggestions:
     - 73 were applied as suggested, 11 with changes and 3 in part. 2 were not applied, with reasons.
     - 54 further fixes of the same kinds were also made.
     - Rows changed in that review say so in their `notes` column ("Expert review Nov 2026: …").
- **Do not change content rows.** If something looks wrong, tell Tonim and let him decide.
- **Exception:** new rows may be added to the **AppText** sheet for new on-screen wording.

**Spelling:**
- The paragraphs and rule pages are written in **American English** (center, traveled, parking lot).
- **Answer keys accept both British and American spellings** (realised/realized, levelled off/leveled off, maths/math, and so on).

---

## 3. The 12 units, in order

| Order | Tag (internal only) | Unit name (what students see) |
|---|---|---|
| 1 | SVA | Subject–Verb Agreement |
| 2 | ART | Articles |
| 3 | TNS | Tenses |
| 4 | PASS | Passive Voice |
| 5 | CNT | Countable and Uncountable Nouns |
| 6 | PREP | Dependent Prepositions |
| 7 | REL | Relative Clauses |
| 8 | CONJ | Conjunctions |
| 9 | PUNC | Comma Splices and Fragments |
| 10 | WF | Word Form |
| 11 | PAR | Parallel Structure |
| 12 | T1 | Task 1 Data Language |

**Students never see the tags.** The app shows unit names only, and turns "Review (ART):" into "Review (Articles):" and "Unit 2, Rule 4" into "Articles, Rule 4" (see CLAUDE.md 2.4).

**Totals:**

| Item | Count |
|---|---|
| Rule blocks | 557 |
| Flashcards | 120 |
| Drills | 120 (44 of them Task 1) |
| Planted errors | 265 |
| Blanks | 259 |
| Further-study rows | 47 (22 with links; 25 are placeholders and stay hidden) |

---

## 4. The workbook: sheets and columns

**File:** `IELTS_Grammar_Content_Master.xlsx`.

- Columns with dark-blue headers are read by the app. **Do not rename them.**
- Light-blue, italic columns are **auto (formula) columns**. **The app must not read these.** It works the values out itself (CLAUDE.md 2.2).

### README
A short guide for Tonim. Not read by the app.

### Units
- One row per unit: `order`, `tag`, `unit_name`, `summary`.
- The auto count columns and `content_status` are not read by the app.

### Rules
- One row per block, shown in `order` within each unit.
- Columns: `block_id` (e.g. SVA-R016), `unit_tag`, `order`, `section`, `block_type`, `title`, `content`, `status`, `notes`.
- Rows with the same `section` make one step on the rule page.
- Each unit's sections follow the same pattern:
  1. Introduction
  2. Why it matters in IELTS
  3. Any unit-specific warm-up sections
  4. Rule 1 to Rule 8–10
  5. Small notes or IELTS in action, where present
  6. Common mistakes to avoid
  7. Your 3-second check
- `block_type` values:
  - `heading`: section title (in `title`).
  - `text`: paragraphs. A blank line separates paragraphs.
  - `key_rule`: a highlighted one-line rule. `title` is its label, e.g. "The rule in one line".
  - `table`: one row per line, cells separated by ` | `, first line is the header.
  - `examples`: one example per line, starting with `✓ ` or `✗ `.
  - `tip`: a highlighted box. `title` is its label, e.g. "Try this".
  - `steps`: one numbered step per line.

### Flashcards
- 10 per unit. Columns: `card_id` (SVA-FC01), `unit_tag`, `card_no`, `front_text`, `options`, `answer`, `why`, `status`, `notes`.
- `front_text` holds one gap written as `____`.
- `options` look like `has / have`. Options are shown only; the student guesses mentally and flips the card. There is no selecting or scoring.
- The back of the card shows `answer` and `why` only. **No rule name or label.**

### Drills
- 10 per unit. Columns: `drill_id` (SVA-04), `unit_tag`, `drill_no`, `title` (auto), `level`, `task_type`, `topic`, `time_limit_min`, `error_count` (auto), `blank_count` (auto), `show_error_count`, `show_sentence_locations`, `sentence_locations`, `max_errors_label`, `review_note`, `instruction_line` (auto), `paragraph`, `status`, `notes`.
- `paragraph` format:
  - Sentences are numbered `(1) … (2) …`. These numbers are for matching only and are **never shown**.
  - Blanks are written `[[B1]]`, `[[B2]]`, `[[B3]]`.
- Students see the title as **"Drill 4 · Economy"**. `task_type` (Task 1 / Task 2) is internal and never shown.
- **Not used by the app any more:**
  - `time_limit_min`: there is no countdown. The clock only counts up.
  - `show_sentence_locations` and `sentence_locations`: kept for Tonim's reference. They are always N, and sentence locations are never shown.
  - `review_note`: internal only.

### Errors
- One row per planted error. Columns: `error_id` (SVA-04-E1), `drill_id`, `sentence_no`, `wrong_text`, `accepted_fixes`, `hint`, `explanation`, `error_tag`, `is_review`, `status`, `notes`.
- `wrong_text` is the exact words or punctuation to fix. It appears **exactly once**, as whole words, in its sentence.
- `accepted_fixes` lists every correct replacement for `wrong_text`, separated by ` | `. The first one is the main answer, shown as "Correct:" in the results.
- `hint` is shown by the Hint button (one error at a time, at most 2 per drill).
- `explanation` is shown in the results for **every** error, including ones answered correctly. It cites rules as "(Rule 4)" or "(Unit 2, Rule 4)".
- `is_review = Y` marks a review error from an earlier unit. These appear only in drills 8–10, and their hints start with "Review (TAG):".
- No sentence contains more than one planted error. The longest `wrong_text` is 6 tokens (words or punctuation marks).

### Blanks
- One row per `[[B#]]`. Columns: `blank_id` (SVA-04-B1), `drill_id`, `token`, `sentence_no`, `accepted_answers`, `level` (auto), `first_letter`, `word_class`, `meaning`, `display_hint` (auto), `status`, `notes`.
- `accepted_answers` lists every correct answer, separated by ` | `. Every blank has at least 2.
- `first_letter` holds the first letters of the **main** answers, e.g. "r or i or g". It is shown only in drills 1–3. Answers added later can be accepted without widening this hint.
- `meaning` never contains one of its own accepted answers, so the hint never gives the answer away.
- Blanks have **no explanation** in the results, only the student's answer and the other accepted answers.

### FurtherStudy
- Links shown at the end of each rule page. Columns: `link_id`, `unit_tag`, `order`, `type` (Read / Watch / Own content), `title`, `url`, `description`, `status`.
- Rows with status `placeholder` (YouTube picks and Tonim's own future videos) have no link yet and are **hidden** until Tonim adds a link and approves them.

### AppText
- Every heading, button label and instruction line students see. Columns: `page`, `text_id`, `text`, `notes`.
- Placeholders such as `{name}`, `{n}`, `{unit}`, `{correct}`, `{total}` and `{time}` are filled in by the app.
- Add new rows here when new wording is needed.

---

## 5. How the drills get harder (internal levels)

Students never see the level names.

| Drills | Level | Error count shown | Blank hint in the (?) tooltip | Review errors |
|---|---|---|---|---|
| 1–3 | Guided | "2 errors" | first letter + meaning | none |
| 4–7 | Supported | "2 errors" / "3 errors" | word class + meaning | none |
| 8–10 | Independent | "Up to 3 errors" | meaning only | may include 1 from an earlier unit |

**Every drill has:**
- 1–3 planted errors and 2–3 blanks.
- About 4–6 sentences on a real IELTS topic. Task 1 drills describe made-up charts, tables, maps or processes.
- Places named "Country X" or "City A". There are no invented statistics about real countries. The only real facts used are:
  - Bangladesh's 2002 plastic bag ban,
  - the UN projection that about two-thirds of people will live in cities by 2050,
  - Singapore's road charging.

**Blank tooltip format (CLAUDE.md 2.2):**
- Drills 1–3: `first letter: s or f · meaning: …`
- Drills 4–7: `adjective · meaning: …`
- Drills 8–10: `meaning: …`

---

## 6. Content rules that every row follows

The app's content script must check rules 1–6 and stop with a plain message if any fail.

1. IDs are unique and follow the patterns above. Never reuse a deleted ID.
2. Every `wrong_text` appears exactly once, as whole words, in its stated sentence.
3. Every `[[B#]]` in a paragraph has exactly one Blanks row, in the stated sentence.
4. Every blank has at least 2 accepted answers. No accepted answer appears inside its own `meaning`.
5. Every flashcard answer is one of its options. Every card has exactly one `____` gap.
6. Rule tables have the same number of cells in every row. Example lines start with ✓ or ✗.
7. Review errors appear only in drills 8–10, and only from earlier units.
8. When a blank follows "a" or "an", every accepted answer matches that article.
9. Fixes and answers accept both UK and US spellings.
10. Every accepted fix, placed into its sentence, gives a fully correct sentence. This has been checked for all of them.

---

## 7. How Tonim updates content later

1. Edit the Excel. Keep the column names and ID patterns. Set new or changed rows to `approved` when they are ready.
2. Run `npm run content`. This rebuilds the app's content and runs the checks.
3. Run `npm test`. This checks every answer key against the answer-checking engine.
4. Run `npm run deploy` to publish.

**To add a drill:**
1. Drills sheet: add a new `drill_id` and the paragraph, with `(1)` sentence numbers and `[[B#]]` blanks.
2. Errors sheet: add one row per error, copying `wrong_text` exactly from the paragraph.
3. Blanks sheet: add one row per blank.

The new drill unlocks after the one before it, just like the others.

---

## 8. Related files

- **CLAUDE.md:** the full build brief (app design, answer checking, data storage, build order). Always takes priority.
- **IELTS_Grammar_Review_Decisions.xlsx:** the expert-review decision log. For reference only.
- **fluently_1 … fluently_5 PNGs:** the final screen designs (see CLAUDE.md section 1).
