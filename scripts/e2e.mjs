// npm run test:browser
// A scripted browser test against the local pretend Firebase (emulators):
// signs in with a test account, reads rules, finishes the warm-up and one drill, checks the results,
// then checks a phone-sized screen and dark mode. Screenshots go to test-results/.
//
// It needs the emulators running (npm run test:browser starts them for you).

import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'test-results');
fs.mkdirSync(OUT, { recursive: true });

const require = createRequire(import.meta.url);
let playwright;
try {
  playwright = require('playwright');
} catch {
  playwright = require('/opt/node-tools/node_modules/playwright');
}
const { chromium, devices } = playwright;

const PORT = 5174;
const BASE = process.env.E2E_URL || `http://localhost:${PORT}`;

let failures = 0;
function check(ok, msg) {
  console.log(`${ok ? '  ✓' : '  ✗'} ${msg}`);
  if (!ok) failures += 1;
}

async function waitForServer(url, ms = 60000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`The website did not start at ${url}`);
}

const unit = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/content/grammar/SVA.json'), 'utf8'));
const drill1 = unit.drills[0];

let server;
if (!process.env.E2E_URL) {
  server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: 'ignore', env: { ...process.env, VITE_USE_EMULATORS: 'true' } });
}

const browser = await chromium.launch();
const errors = [];
try {
  await waitForServer(BASE);
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(e.message));

  console.log('\nSign-in and first visit');
  await page.goto(BASE + '/');
  await page.waitForSelector('.btn--google');
  check(await page.isVisible('text=Continue with Google'), 'landing page shows "Continue with Google"');
  const email = `e2e-${Date.now()}@example.com`;
  await page.evaluate((em) => window.__fluentlyTestSignIn(em, 'Esha Test'), email);
  await page.waitForSelector('.setup__card');
  check((await page.inputValue('#setup-name')) === 'Esha', 'name is pre-filled with the Google first name');
  check(!(await page.isChecked('.checkbox input')), 'email box is unticked by default');
  await page.check('.checkbox input');
  await page.click('.setup__card button[type=submit]');
  await page.waitForSelector('.tour');
  check(await page.isVisible('text=Welcome to Fluently'), 'welcome tour appears');
  await page.click('.tour .btn--primary');
  await page.click('.tour .btn--primary');
  check(await page.isVisible('text=Get started'), 'tour reaches its last step');
  await page.click('.tour .btn--primary');
  check(await page.isVisible('h1:has-text("Welcome, Esha")'), 'first visit says "Welcome, Esha"');
  check((await page.locator('.topic').count()) === 13, '12 topic cards plus the Coming Soon card');
  check(!(await page.content()).includes('>SVA<'), 'unit tags are not shown');
  await page.screenshot({ path: path.join(OUT, '01-dashboard.png'), fullPage: true });

  console.log('\nRule page');
  await page.locator('.topic').first().click();
  await page.waitForSelector('.rules__title');
  check((await page.textContent('.rules__title')) === 'Subject–Verb Agreement', 'rule page opens on the Introduction');
  await page.click('.rules__next');
  await page.waitForTimeout(200);
  check(await page.isVisible('.toc__item--read'), 'Introduction is ticked after pressing Next rule');
  await page.screenshot({ path: path.join(OUT, '02-rules.png') });

  console.log('\nWarm-up');
  await page.goto(BASE + '/grammar/subject-verb-agreement/warmup');
  await page.waitForSelector('.fc');
  check(await page.isDisabled('.warm__start .btn'), 'Start drills is locked at first');
  const cards = page.locator('.fc');
  for (let i = 0; i < 10; i++) await cards.nth(i).click();
  await page.waitForTimeout(300);
  check(await page.isVisible('text=10 of 10 cards turned'), 'counter shows 10 of 10');
  check(!(await page.isDisabled('.warm__start .btn')), 'Start drills unlocks after all 10 cards');
  await page.screenshot({ path: path.join(OUT, '03-warmup.png') });
  await page.click('.warm__start .btn');
  await page.waitForURL('**/drill/1');

  console.log('\nDrill 1');
  await page.waitForSelector('.para');
  const [e1, e2] = drill1.errors;
  const s1 = drill1.sentences.find((s) => s.no === e1.sentence);
  // Select the wrong words by clicking the first and last word.
  await page.click(`[data-s="${e1.sentence}"][data-i="${e1.start}"]`);
  if (e1.end - 1 > e1.start) await page.click(`[data-s="${e1.sentence}"][data-i="${e1.end - 1}"]`);
  check(await page.isVisible('.cbox'), 'correction box opens under the selected words');
  await page.keyboard.type(e1.fixes[0]);
  await page.screenshot({ path: path.join(OUT, '04-drill-correction.png') });
  await page.keyboard.press('Enter');
  check((await page.textContent('.tok--edit')) === e1.fixes[0], `the saved edit shows "${e1.fixes[0]}"`);
  await page.locator('.blank__input').first().fill(drill1.blanks[0].answers[0]);
  await page.locator('.blank__help').first().click();
  check((await page.textContent('.tooltip--blank'))?.startsWith('first letter:'), 'the (?) tip shows the guided hint');
  await page.click('.hint__btn');
  check((await page.textContent('.hint__bubble p')) === e2.hint, 'the hint is for the first error not yet fixed');
  check(await page.isVisible('text=1 hint left'), 'hint counter goes down to 1');
  const clock1 = await page.textContent('.clock__time');
  await page.waitForTimeout(2200);
  check((await page.textContent('.clock__time')) !== clock1, 'the clock counts up');
  await page.screenshot({ path: path.join(OUT, '05-drill-hint.png') });
  await page.click('.drill__center .btn');
  check(await page.isVisible('text=You have 1 empty blank(s). Check anyway?'), 'empty-blank note appears');
  await page.click('.confirm__actions .btn--primary');
  await page.waitForSelector('.results');
  check(await page.isVisible('.results .chip:has-text("2 of 4 correct")'), 'results show 2 of 4 correct');
  check((await page.locator('.res-row').count()) === 4, 'one results row per error and blank');
  check((await page.locator('.res-why').count()) === 2, 'every error has a "Why" line');
  check(await page.isVisible(`.res-line:has-text("You did not change")`), 'the missed error is explained');
  void s1;
  await page.waitForTimeout(400); // let the pop-up finish fading in
  await page.screenshot({ path: path.join(OUT, '06-results.png') });
  await page.click('.results__foot .btn--outline');
  check(await page.isVisible('.mark--ok') && await page.isVisible('.mark--bad'), 'review shows fixed (green) and missed (red) errors');
  check(await page.isVisible('text=Next drill'), 'the button becomes Next drill');
  await page.screenshot({ path: path.join(OUT, '07-review.png') });

  console.log('\nSaved progress');
  await page.goto(BASE + '/');
  await page.waitForSelector('.progress-block');
  await page.reload();
  await page.waitForSelector('.progress-block');
  const stats = await page.locator('.progress-block dd').allTextContents();
  check(stats[0] === '1', 'Drills completed is 1 after a reload');
  check(stats[1] === '50%', 'Errors fixed is 50% (1 of 2)');
  check(stats[2] === 'Subject–Verb Agreement', 'Weakest area is Subject–Verb Agreement');
  check((await page.textContent('.streak__n')) === '1', 'streak shows 1');
  check(await page.isVisible('.topic--current:has-text("1 of 10 drills")'), 'the unit card shows "1 of 10 drills" with a teal border');
  check(await page.isVisible('text=Subject–Verb Agreement, Drill 2'), '"Pick up where you left off" points to Drill 2');

  console.log('\nDark mode and profile menu');
  await page.click('.profile__trigger');
  await page.click('#menu-dark');
  check((await page.getAttribute('html', 'data-theme')) === 'dark', 'dark mode switches on');
  await page.click('.font-btn:has-text("Georgia")');
  check((await page.getAttribute('html', 'data-font')) === 'georgia', 'reading font changes');
  await page.click('.size-btn >> nth=1');
  check(await page.isVisible('text=Text size 110%'), 'text size goes up to 110%');
  await page.screenshot({ path: path.join(OUT, '08-dark-menu.png') });
  await page.keyboard.press('Escape');
  await page.screenshot({ path: path.join(OUT, '09-dark-dashboard.png'), fullPage: true });
  await page.goto(BASE + '/grammar/subject-verb-agreement/drill/1');
  await page.waitForSelector('.para');
  await page.screenshot({ path: path.join(OUT, '10-dark-drill.png') });

  console.log('\nPhone size');
  const phone = await browser.newContext({ ...devices['iPhone 13'], storageState: await ctx.storageState() });
  const p2 = await phone.newPage();
  p2.on('pageerror', (e) => errors.push(e.message));
  // Signed-in state is kept in IndexedDB, so sign in again on the phone.
  await p2.goto(BASE + '/');
  await p2.waitForSelector('.btn--google, .dash');
  if (await p2.isVisible('.btn--google')) await p2.evaluate((em) => window.__fluentlyTestSignIn(em, 'Esha Test'), email);
  await p2.waitForSelector('.dash');
  await p2.screenshot({ path: path.join(OUT, '11-phone-dashboard.png'), fullPage: true });
  await p2.goto(BASE + '/grammar/subject-verb-agreement/drill/2');
  await p2.waitForSelector('.para');
  check(!(await p2.isVisible('.dpanel')), 'drill list starts hidden on phones');
  const d2 = unit.drills[1];
  await p2.tap(`[data-s="${d2.errors[0].sentence}"][data-i="${d2.errors[0].start}"]`);
  const box = await p2.locator('.cbox').boundingBox();
  const vw = p2.viewportSize().width;
  check(box && box.x >= 0 && box.x + box.width <= vw, 'correction box fits on a phone screen');
  await p2.screenshot({ path: path.join(OUT, '12-phone-drill.png') });
  const hasHScroll = await p2.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  check(!hasHScroll, 'no sideways scrolling on the phone');
  await p2.click('.dpanel__show');
  check(await p2.isVisible('.dpanel'), 'drill list opens as a drawer');
  await p2.screenshot({ path: path.join(OUT, '13-phone-drawer.png') });
  await p2.goto(BASE + '/grammar/subject-verb-agreement/rules');
  await p2.waitForSelector('.rules__title');
  check(await p2.isVisible('.rules__mobile-nav select'), 'rule page shows a Sections dropdown on phones');
  await p2.screenshot({ path: path.join(OUT, '14-phone-rules.png') });

  console.log('\nSign out');
  await page.goto(BASE + '/');
  await page.waitForSelector('.dash');
  await page.click('.profile__trigger');
  await page.click('.menu__signout');
  await page.waitForSelector('.btn--google');
  check(true, 'signing out returns to the landing page');

  check(errors.length === 0, `no page errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
} catch (e) {
  console.error('\nThe browser test stopped early:', e.message);
  failures += 1;
} finally {
  await browser.close();
  server?.kill();
}

console.log(failures ? `\n✗ ${failures} check(s) failed. Screenshots are in test-results/.\n` : '\n✓ All browser checks passed. Screenshots are in test-results/.\n');
process.exit(failures ? 1 : 0);
