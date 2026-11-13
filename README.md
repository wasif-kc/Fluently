# Fluently

A free IELTS self-study platform. Tool 1: Grammar (12 units: rules, warm-up cards and proofreading drills).

- **Build brief:** [CLAUDE.md](CLAUDE.md) (always wins) and [docs/IELTS_Grammar_Project_Brief.md](docs/IELTS_Grammar_Project_Brief.md)
- **Progress notes:** [PROGRESS.md](PROGRESS.md)
- **Updating content:** [HOW-TO-UPDATE.md](HOW-TO-UPDATE.md)
- **Content source:** `content/IELTS_Grammar_Content_Master.xlsx`
- **Design pictures:** `design/`

## Commands

| Command | What it does |
|---|---|
| `npm install` | Installs everything (once). |
| `npm run dev` | Starts the site on this computer with a pretend Firebase (emulators). Needs Java. |
| `npm run content` | Checks the Excel and rebuilds `public/content/grammar/`. |
| `npm test` | Answer-checking and progress tests. |
| `npm run test:rules` | Security-rules tests (emulator). |
| `npm run test:browser` | Full browser walk-through (emulator). Screenshots in `test-results/`. |
| `npm run deploy` | Content → tests → build → publish to Firebase Hosting. |

Developed by Kishoar Wasif Chowdhury.
