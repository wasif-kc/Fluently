// npm run content
// Reads content/IELTS_Grammar_Content_Master.xlsx, checks it, and writes the website's lesson files
// to public/content/grammar/. If anything is wrong it stops and explains which row to fix.

import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  tokenize,
  splitSentences,
  findTokenMatches,
  splitList,
  isBlankToken,
  TOKEN_RE,
} from '../src/lib/engine.js';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARGS = process.argv.slice(2);
const CHECK_ONLY = ARGS.includes('--check');
const WORKBOOK = ARGS.find((a) => !a.startsWith('--')) || path.join(ROOT, 'content', 'IELTS_Grammar_Content_Master.xlsx');
const OUT_DIR = path.join(ROOT, 'public', 'content', 'grammar');
const TEXT_DEFAULTS = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'lib', 'textDefaults.json'), 'utf8'));

const problems = [];
const warnings = [];
const problem = (sheet, row, msg) => problems.push(`${sheet}, row ${row}: ${msg}`);
const warn = (msg) => warnings.push(msg);

// ---------- Read the workbook ----------

if (!fs.existsSync(WORKBOOK)) {
  console.error(`\nCould not find the content file:\n  ${WORKBOOK}\nPut IELTS_Grammar_Content_Master.xlsx in the "content" folder and try again.\n`);
  process.exit(1);
}

const wb = XLSX.readFile(WORKBOOK);

/** Read a sheet as objects keyed by header. Auto (formula) columns are skipped. */
function readSheet(name) {
  const ws = wb.Sheets[name];
  if (!ws) {
    console.error(`\nThe content file has no sheet called "${name}". Please check the sheet names.\n`);
    process.exit(1);
  }
  const grid = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
  const header = (grid[0] || []).map((h) => String(h).trim());
  const rows = [];
  for (let i = 1; i < grid.length; i++) {
    const cells = grid[i];
    if (!cells || cells.every((c) => String(c).trim() === '')) continue;
    const obj = { _row: i + 1 };
    header.forEach((h, j) => {
      if (!h || /\(auto\)/i.test(h)) return; // never read formula columns (CLAUDE.md 2.2)
      const ws_cell = ws[XLSX.utils.encode_cell({ r: i, c: j })];
      if (ws_cell && ws_cell.f) return; // a formula cell: ignore
      obj[h] = String(cells[j] ?? '').replace(/\r\n?/g, '\n').trim();
    });
    rows.push(obj);
  }
  return { header, rows };
}

function requireColumns(sheet, header, cols) {
  for (const c of cols) {
    if (!header.includes(c)) {
      console.error(`\nThe "${sheet}" sheet is missing the column "${c}". Column names must not be changed.\n`);
      process.exit(1);
    }
  }
}

const S = {};
const COLS = {
  Units: ['order', 'tag', 'unit_name', 'summary'],
  Rules: ['block_id', 'unit_tag', 'order', 'section', 'block_type', 'title', 'content', 'status'],
  Flashcards: ['card_id', 'unit_tag', 'card_no', 'front_text', 'options', 'answer', 'why', 'status'],
  Drills: ['drill_id', 'unit_tag', 'drill_no', 'level', 'task_type', 'topic', 'max_errors_label', 'review_note', 'paragraph', 'status'],
  Errors: ['error_id', 'drill_id', 'sentence_no', 'wrong_text', 'accepted_fixes', 'hint', 'explanation', 'error_tag', 'is_review', 'status'],
  Blanks: ['blank_id', 'drill_id', 'token', 'sentence_no', 'accepted_answers', 'first_letter', 'word_class', 'meaning', 'status'],
  FurtherStudy: ['link_id', 'unit_tag', 'order', 'type', 'title', 'url', 'description', 'status'],
  AppText: ['page', 'text_id', 'text'],
};
for (const [name, cols] of Object.entries(COLS)) {
  const { header, rows } = readSheet(name);
  requireColumns(name, header, cols);
  S[name] = rows;
}

const approved = (r) => String(r.status || '').toLowerCase() === 'approved';
const num = (v) => Number(String(v).trim());

// ---------- Check 1: unique IDs that follow the patterns ----------

const ID_RULES = [
  ['Rules', 'block_id', /^[A-Z0-9]+-R\d{3}$/],
  ['Flashcards', 'card_id', /^[A-Z0-9]+-FC\d{2}$/],
  ['Drills', 'drill_id', /^[A-Z0-9]+-\d{2}$/],
  ['Errors', 'error_id', /^[A-Z0-9]+-\d{2}-E\d+$/],
  ['Blanks', 'blank_id', /^[A-Z0-9]+-\d{2}-B\d+$/],
  ['FurtherStudy', 'link_id', /^[A-Z0-9]+-L\d{2}$/],
  ['AppText', 'text_id', /^[a-z0-9_]+(\.[a-z0-9_]+)+$/],
];
for (const [sheet, col, re] of ID_RULES) {
  const seen = new Map();
  for (const r of S[sheet]) {
    const id = r[col];
    if (!id) {
      problem(sheet, r._row, `the ${col} cell is empty.`);
      continue;
    }
    if (!re.test(id)) problem(sheet, r._row, `"${id}" does not follow the ID pattern for this sheet.`);
    if (seen.has(id)) problem(sheet, r._row, `the ID "${id}" is used twice (also on row ${seen.get(id)}).`);
    else seen.set(id, r._row);
  }
}

// ---------- Units ----------

const units = S.Units.map((r) => ({
  order: num(r.order),
  tag: r.tag,
  name: r.unit_name,
  summary: r.summary,
  slug: r.unit_name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, ''),
  _row: r._row,
})).sort((a, b) => a.order - b.order);

const unitByTag = new Map(units.map((u) => [u.tag, u]));
const unitByOrder = new Map(units.map((u) => [u.order, u]));
for (const u of units) {
  if (!u.tag || !u.name) problem('Units', u._row, 'every unit needs a tag and a unit_name.');
}

function checkUnitTag(sheet, r) {
  if (!unitByTag.has(r.unit_tag)) problem(sheet, r._row, `unit_tag "${r.unit_tag}" is not in the Units sheet.`);
}

// Text clean-up so students never see internal tags (CLAUDE.md 2.4).
function cleanHint(text) {
  return text.replace(/Review \(([A-Z0-9]+)\):/g, (m, tag) => {
    const u = unitByTag.get(tag);
    return u ? `Review (${u.name}):` : m;
  });
}
function cleanExplanation(text) {
  return text.replace(/\bUnit (\d+)(?=,)/g, (m, n) => {
    const u = unitByOrder.get(Number(n));
    return u ? u.name : m;
  });
}

// ---------- Rules ----------

const rulesByUnit = new Map();
for (const r of S.Rules) {
  checkUnitTag('Rules', r);
  if (!approved(r)) continue;
  const list = rulesByUnit.get(r.unit_tag) || [];
  list.push(r);
  rulesByUnit.set(r.unit_tag, list);
}

const BLOCK_TYPES = new Set(['heading', 'text', 'key_rule', 'table', 'examples', 'tip', 'steps']);
const lines = (s) => s.split('\n').map((l) => l.trim()).filter(Boolean);

function parseBlock(r) {
  const type = r.block_type;
  const c = r.content || '';
  switch (type) {
    case 'text':
      return { type, title: r.title || undefined, paragraphs: c.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean) };
    case 'key_rule':
    case 'tip':
      return { type, title: r.title || undefined, text: c };
    case 'table': {
      const rows = lines(c).map((l) => l.split(' | ').map((x) => x.trim()));
      const width = rows[0]?.length || 0;
      rows.forEach((row, i) => {
        if (row.length !== width)
          problem('Rules', r._row, `table line ${i + 1} has ${row.length} cells but the header has ${width}. Cells are separated by " | ".`);
      });
      if (rows.length < 2) problem('Rules', r._row, 'a table needs a header line and at least one more line.');
      return { type, title: r.title || undefined, header: rows[0] || [], rows: rows.slice(1) };
    }
    case 'examples': {
      const items = lines(c).map((l, i) => {
        if (!l.startsWith('✓') && !l.startsWith('✗'))
          problem('Rules', r._row, `example line ${i + 1} must start with ✓ or ✗ ("${l.slice(0, 40)}…").`);
        return { ok: !l.startsWith('✗'), text: l.replace(/^[✓✗]\s*/, '') };
      });
      return { type, title: r.title || undefined, items };
    }
    case 'steps':
      return { type, title: r.title || undefined, steps: lines(c).map((l) => l.replace(/^\d+[.)]\s*/, '')) };
    default:
      return null;
  }
}

function buildSections(tag) {
  const blocks = (rulesByUnit.get(tag) || []).slice().sort((a, b) => num(a.order) - num(b.order));
  const sections = [];
  const byName = new Map();
  for (const r of blocks) {
    if (!BLOCK_TYPES.has(r.block_type)) {
      problem('Rules', r._row, `block_type "${r.block_type}" is not one of: ${[...BLOCK_TYPES].join(', ')}.`);
      continue;
    }
    if (!r.section) {
      problem('Rules', r._row, 'the section cell is empty.');
      continue;
    }
    let sec = byName.get(r.section);
    if (!sec) {
      sec = { id: r.section, title: '', label: '', blocks: [] };
      byName.set(r.section, sec);
      sections.push(sec);
    } else if (sections[sections.length - 1] !== sec) {
      problem('Rules', r._row, `section "${r.section}" is split into two parts. Blocks of one section must be next to each other in order.`);
    }
    if (r.block_type === 'heading') {
      if (sec.title) problem('Rules', r._row, `section "${r.section}" has more than one heading.`);
      sec.title = r.title;
      if (!r.title) problem('Rules', r._row, 'a heading block needs a title.');
    } else {
      if (!r.content) problem('Rules', r._row, `this ${r.block_type} block has no content.`);
      const b = parseBlock(r);
      if (b) sec.blocks.push(b);
    }
  }
  sections.forEach((s, i) => {
    if (!s.title) {
      warn(`Rules: section "${s.id}" in ${tag} has no heading block; using the section name as its title.`);
      s.title = s.id;
    }
    s.label = i === 0 ? s.id : s.title;
  });
  return sections;
}

// ---------- Flashcards ----------

const cardsByUnit = new Map();
for (const r of S.Flashcards) {
  checkUnitTag('Flashcards', r);
  if (!approved(r)) continue;
  const gaps = (r.front_text.match(/_{3,}/g) || []).length;
  if (gaps !== 1) problem('Flashcards', r._row, `${r.card_id} must have exactly one ____ gap (found ${gaps}).`);
  const options = r.options.split(' / ').map((o) => o.trim()).filter(Boolean);
  if (!options.some((o) => o.toLowerCase() === r.answer.trim().toLowerCase()))
    problem('Flashcards', r._row, `${r.card_id}: the answer "${r.answer}" is not one of the options (${r.options}).`);
  const list = cardsByUnit.get(r.unit_tag) || [];
  list.push({ no: num(r.card_no), front: r.front_text, options, answer: r.answer, why: r.why });
  cardsByUnit.set(r.unit_tag, list);
}

// ---------- Drills, errors and blanks ----------

const appText = {};
for (const r of S.AppText) if (r.text_id) appText[r.text_id] = r.text;
const t = (id, vars = {}) =>
  (appText[id] ?? TEXT_DEFAULTS[id] ?? id).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));

const drillRows = new Map();
for (const r of S.Drills) {
  checkUnitTag('Drills', r);
  drillRows.set(r.drill_id, r);
}

const errorsByDrill = new Map();
for (const r of S.Errors) {
  if (!drillRows.has(r.drill_id)) problem('Errors', r._row, `${r.error_id}: drill_id "${r.drill_id}" is not in the Drills sheet.`);
  if (!approved(r)) continue;
  const list = errorsByDrill.get(r.drill_id) || [];
  list.push(r);
  errorsByDrill.set(r.drill_id, list);
}
const blanksByDrill = new Map();
for (const r of S.Blanks) {
  if (!drillRows.has(r.drill_id)) problem('Blanks', r._row, `${r.blank_id}: drill_id "${r.drill_id}" is not in the Drills sheet.`);
  if (!approved(r)) continue;
  const list = blanksByDrill.get(r.drill_id) || [];
  list.push(r);
  blanksByDrill.set(r.drill_id, list);
}

const LEVELS = new Set(['Guided', 'Supported', 'Independent']);

/** For each token: 1 if the original text has a space before it, else 0 (keeps "18–30" and "café" as written). */
function spaceFlags(text) {
  const flags = [];
  const re = new RegExp(TOKEN_RE.source, 'g');
  let prevEnd = 0;
  let m;
  while ((m = re.exec(text))) {
    flags.push(flags.length > 0 && /\s/.test(text.slice(prevEnd, m.index)) ? 1 : 0);
    prevEnd = m.index + m[0].length;
  }
  return flags;
}

function buildDrill(r, unit) {
  const no = num(r.drill_no);
  if (!LEVELS.has(r.level)) problem('Drills', r._row, `${r.drill_id}: level "${r.level}" must be Guided, Supported or Independent.`);
  const sentences = splitSentences(r.paragraph).map((s) => ({ no: s.no, text: s.text, tokens: tokenize(s.text), sp: spaceFlags(s.text) }));
  if (sentences.length === 0) problem('Drills', r._row, `${r.drill_id}: the paragraph has no (1) (2) … sentence numbers.`);
  const sentenceByNo = new Map(sentences.map((s) => [s.no, s]));

  // Errors
  const errRows = errorsByDrill.get(r.drill_id) || [];
  const errorSentences = new Map();
  const errors = errRows.map((e) => {
    const sn = num(e.sentence_no);
    const s = sentenceByNo.get(sn);
    let start = -1;
    let end = -1;
    const wrong = tokenize(e.wrong_text);
    if (!s) problem('Errors', e._row, `${e.error_id}: sentence ${e.sentence_no} does not exist in ${r.drill_id}.`);
    else {
      const hits = findTokenMatches(s.tokens, wrong);
      if (hits.length === 0)
        problem('Errors', e._row, `${e.error_id}: the wrong_text "${e.wrong_text}" was not found, as whole words, in sentence ${sn} of ${r.drill_id}. Copy it exactly from the paragraph.`);
      else if (hits.length > 1)
        problem('Errors', e._row, `${e.error_id}: the wrong_text "${e.wrong_text}" appears ${hits.length} times in sentence ${sn}. It must appear exactly once; use a longer piece of text.`);
      else {
        start = hits[0];
        end = start + wrong.length;
      }
    }
    if (wrong.some(isBlankToken)) problem('Errors', e._row, `${e.error_id}: wrong_text must not include a blank.`);
    if (wrong.length > 8) problem('Errors', e._row, `${e.error_id}: wrong_text is ${wrong.length} words long; students can select at most 8.`);
    else if (wrong.length > 6) warn(`Errors row ${e._row}: ${e.error_id} wrong_text is ${wrong.length} tokens (the guide says at most 6).`);
    if (errorSentences.has(sn)) problem('Errors', e._row, `${e.error_id}: sentence ${sn} already has a planted error (${errorSentences.get(sn)}). Only one per sentence.`);
    errorSentences.set(sn, e.error_id);
    const fixes = splitList(e.accepted_fixes);
    if (fixes.length === 0) problem('Errors', e._row, `${e.error_id}: accepted_fixes is empty.`);
    if (!e.hint) problem('Errors', e._row, `${e.error_id}: the hint is empty.`);
    if (!e.explanation) problem('Errors', e._row, `${e.error_id}: the explanation is empty.`);
    const isReview = e.is_review.toUpperCase() === 'Y';
    if (isReview) {
      if (no < 8) problem('Errors', e._row, `${e.error_id}: review errors may only appear in drills 8–10.`);
      const m = e.hint.match(/^Review \(([A-Z0-9]+)\):/);
      const from = m ? unitByTag.get(m[1]) : null;
      if (!m) problem('Errors', e._row, `${e.error_id}: a review error's hint must start with "Review (TAG):".`);
      else if (!from || from.order >= unit.order) problem('Errors', e._row, `${e.error_id}: review errors must come from an earlier unit.`);
    }
    return {
      id: e.error_id,
      sentence: sn,
      start,
      end,
      wrongText: e.wrong_text,
      fixes,
      hint: cleanHint(e.hint),
      explanation: cleanExplanation(e.explanation),
      isReview,
    };
  });
  errors.sort((a, b) => a.sentence - b.sentence || a.start - b.start);

  // Blanks
  const blankRows = blanksByDrill.get(r.drill_id) || [];
  const seenTokens = new Map();
  const blanks = blankRows.map((b) => {
    const sn = num(b.sentence_no);
    const s = sentenceByNo.get(sn);
    const marker = `[[${b.token}]]`;
    if (!/^B\d$/.test(b.token)) problem('Blanks', b._row, `${b.blank_id}: token "${b.token}" must look like B1, B2 or B3.`);
    if (seenTokens.has(b.token)) problem('Blanks', b._row, `${b.blank_id}: ${b.token} already has a Blanks row (${seenTokens.get(b.token)}).`);
    seenTokens.set(b.token, b.blank_id);
    if (!s) problem('Blanks', b._row, `${b.blank_id}: sentence ${b.sentence_no} does not exist in ${r.drill_id}.`);
    else if (!s.tokens.includes(marker)) problem('Blanks', b._row, `${b.blank_id}: ${marker} is not in sentence ${sn} of ${r.drill_id}.`);
    const answers = splitList(b.accepted_answers);
    if (answers.length < 2) problem('Blanks', b._row, `${b.blank_id}: every blank needs at least 2 accepted answers (found ${answers.length}).`);
    const meaningWords = new Set(tokenize(b.meaning.toLowerCase()));
    for (const a of answers) {
      const at = tokenize(a.toLowerCase());
      if (at.length === 1 ? meaningWords.has(at[0]) : findTokenMatches(tokenize(b.meaning.toLowerCase()), at).length > 0)
        problem('Blanks', b._row, `${b.blank_id}: the meaning gives away the answer "${a}".`);
    }
    if (!b.meaning) problem('Blanks', b._row, `${b.blank_id}: meaning is empty.`);
    let hint;
    if (r.level === 'Guided') hint = `first letter: ${b.first_letter} · meaning: ${b.meaning}`;
    else if (r.level === 'Supported') hint = `${b.word_class} · meaning: ${b.meaning}`;
    else hint = `meaning: ${b.meaning}`;
    return { id: b.blank_id, token: b.token, sentence: sn, answers, hint };
  });
  // Every [[B#]] in the paragraph needs exactly one Blanks row.
  for (const s of sentences) {
    for (const tok of s.tokens) {
      if (!isBlankToken(tok)) continue;
      const tk = tok.slice(2, -2);
      const matches = blankRows.filter((b) => b.token === tk);
      if (matches.length === 0) problem('Drills', r._row, `${r.drill_id}: ${tok} in sentence ${s.no} has no row in the Blanks sheet.`);
    }
  }
  const allMarkers = sentences.flatMap((s) => s.tokens.filter(isBlankToken));
  if (new Set(allMarkers).size !== allMarkers.length) problem('Drills', r._row, `${r.drill_id}: a blank marker is used twice in the paragraph.`);
  blanks.sort((a, b) => a.token.localeCompare(b.token));

  const errorCount = errors.length;
  let instruction;
  if (r.level === 'Independent') instruction = t('drill.count_upto', { n: r.max_errors_label || '3' });
  else instruction = errorCount === 1 ? t('drill.count_one') : t('drill.count_many', { n: errorCount });
  if (errorCount < 1 || errorCount > 3) warn(`Drills row ${r._row}: ${r.drill_id} has ${errorCount} errors (expected 1–3).`);
  if (blanks.length < 2 || blanks.length > 3) warn(`Drills row ${r._row}: ${r.drill_id} has ${blanks.length} blanks (expected 2–3).`);

  return {
    no,
    id: r.drill_id,
    title: `Drill ${no} · ${r.topic}`,
    topic: r.topic,
    level: r.level,
    instruction,
    sentences: sentences.map((s) => ({ no: s.no, tokens: s.tokens, sp: s.sp })),
    errors,
    blanks,
  };
}

// ---------- Further study ----------

const linksByUnit = new Map();
for (const r of S.FurtherStudy) {
  checkUnitTag('FurtherStudy', r);
  if (!approved(r) || !r.url) continue;
  if (!/^https?:\/\//.test(r.url)) problem('FurtherStudy', r._row, `${r.link_id}: the url must start with https://`);
  const list = linksByUnit.get(r.unit_tag) || [];
  list.push({ order: num(r.order), type: r.type, title: r.title, url: r.url, description: r.description });
  linksByUnit.set(r.unit_tag, list);
}

// ---------- Build every unit ----------

const unitFiles = [];
for (const u of units) {
  const sections = buildSections(u.tag);
  const cards = (cardsByUnit.get(u.tag) || []).sort((a, b) => a.no - b.no);
  const drills = S.Drills.filter((r) => r.unit_tag === u.tag && approved(r))
    .map((r) => buildDrill(r, u))
    .sort((a, b) => a.no - b.no);
  const furtherStudy = (linksByUnit.get(u.tag) || []).sort((a, b) => a.order - b.order).map(({ order, ...rest }) => rest);
  if (sections.length === 0) warn(`Unit ${u.tag} has no approved rule blocks.`);
  if (cards.length !== 10) warn(`Unit ${u.tag} has ${cards.length} approved flashcards (the warm-up expects 10).`);
  if (drills.length !== 10) warn(`Unit ${u.tag} has ${drills.length} approved drills (expected 10).`);
  drills.forEach((d, i) => {
    if (d.no !== i + 1) warn(`Unit ${u.tag}: drill numbers should run 1, 2, 3 … (found ${d.no} in position ${i + 1}).`);
  });
  unitFiles.push({
    tag: u.tag,
    name: u.name,
    slug: u.slug,
    order: u.order,
    summary: u.summary,
    sections,
    furtherStudy,
    cards,
    drills,
  });
}

// Every text the code uses should exist in AppText (warn and use the built-in default if not).
const missingText = Object.keys(TEXT_DEFAULTS).filter((id) => !(id in appText));
if (missingText.length) {
  warn(`These text_ids are not in the AppText sheet yet, so the built-in wording is used: ${missingText.join(', ')}`);
}

// Students must never see a unit tag in hints or explanations.
const tagRe = new RegExp(`\\((${units.map((u) => u.tag).join('|')})\\)`);
for (const uf of unitFiles)
  for (const d of uf.drills)
    for (const e of d.errors)
      if (tagRe.test(e.hint) || tagRe.test(e.explanation)) warn(`${e.id}: the hint or explanation still shows a unit tag.`);

// ---------- Stop if anything failed ----------

if (warnings.length) {
  console.log('\nNotes (not errors):');
  for (const w of warnings) console.log('  • ' + w);
}

if (problems.length) {
  console.error(`\n✗ The content was NOT updated. Please fix ${problems.length} problem${problems.length === 1 ? '' : 's'} in the Excel file:\n`);
  for (const p of problems) console.error('  • ' + p);
  console.error('\nThen run "npm run content" again.\n');
  process.exit(1);
}

// ---------- Write the files ----------

if (CHECK_ONLY) {
  console.log('\n✓ All checks passed (check only, nothing written).\n');
  process.exit(0);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
for (const f of fs.readdirSync(OUT_DIR)) if (f.endsWith('.json')) fs.unlinkSync(path.join(OUT_DIR, f));

const now = new Date();
const version = now.toISOString().slice(0, 16).replace('T', ' ');

for (const uf of unitFiles) {
  fs.writeFileSync(path.join(OUT_DIR, `${uf.tag}.json`), JSON.stringify({ version, ...uf }));
}

const index = {
  version,
  units: unitFiles.map((uf) => ({
    tag: uf.tag,
    name: uf.name,
    slug: uf.slug,
    order: uf.order,
    summary: uf.summary,
    sectionCount: uf.sections.length,
    cardCount: uf.cards.length,
    errorsTotal: uf.drills.reduce((n, d) => n + d.errors.length, 0),
    drills: uf.drills.map((d) => ({ no: d.no, title: d.title, errors: d.errors.length })),
  })),
  appText,
};
fs.writeFileSync(path.join(OUT_DIR, 'index.json'), JSON.stringify(index));

const totals = unitFiles.reduce(
  (acc, u) => {
    acc.blocks += u.sections.reduce((n, s) => n + s.blocks.length + 1, 0);
    acc.cards += u.cards.length;
    acc.drills += u.drills.length;
    acc.errors += u.drills.reduce((n, d) => n + d.errors.length, 0);
    acc.blanks += u.drills.reduce((n, d) => n + d.blanks.length, 0);
    acc.links += u.furtherStudy.length;
    return acc;
  },
  { blocks: 0, cards: 0, drills: 0, errors: 0, blanks: 0, links: 0 },
);

console.log(`\n✓ Content checked and updated (version ${version}).`);
console.log(
  `  ${unitFiles.length} units · ${totals.blocks} rule blocks · ${totals.cards} cards · ${totals.drills} drills · ${totals.errors} errors · ${totals.blanks} blanks · ${totals.links} links shown`,
);
console.log('  Next: run "npm test", then "npm run deploy" to publish.\n');
