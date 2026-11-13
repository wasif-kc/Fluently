// The content script must stop with a plain message when the Excel has a mistake.
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
const SRC = path.resolve('content/IELTS_Grammar_Content_Master.xlsx');

function runCheck(mutate) {
  const wb = XLSX.readFile(SRC);
  mutate(wb);
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'fluently-')), 'broken.xlsx');
  XLSX.writeFile(wb, file);
  try {
    execFileSync('node', ['scripts/build-content.mjs', file, '--check'], { stdio: 'pipe' });
    return { ok: true, out: '' };
  } catch (e) {
    return { ok: false, out: String(e.stderr) };
  }
}

function setCell(wb, sheet, col, idValue, value) {
  const ws = wb.Sheets[sheet];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
  const c = rows[0].indexOf(col);
  const r = rows.findIndex((row) => row[0] === idValue);
  ws[XLSX.utils.encode_cell({ r, c })] = { t: 's', v: value };
}

describe('content script checks', () => {
  it('passes the real workbook', () => {
    expect(runCheck(() => {}).ok).toBe(true);
  }, 30000);
  it('stops when wrong_text is not in its sentence', () => {
    const r = runCheck((wb) => setCell(wb, 'Errors', 'wrong_text', 'SVA-01-E1', 'have growed'));
    expect(r.ok).toBe(false);
    expect(r.out).toMatch(/Errors, row 2: SVA-01-E1: the wrong_text "have growed" was not found/);
  }, 30000);
  it('stops when a blank has only one accepted answer', () => {
    const r = runCheck((wb) => setCell(wb, 'Blanks', 'accepted_answers', 'SVA-01-B1', 'benefit'));
    expect(r.ok).toBe(false);
    expect(r.out).toMatch(/SVA-01-B1: every blank needs at least 2 accepted answers/);
  }, 30000);
  it('stops when a flashcard answer is not an option', () => {
    const r = runCheck((wb) => setCell(wb, 'Flashcards', 'answer', 'SVA-FC01', 'died'));
    expect(r.ok).toBe(false);
    expect(r.out).toMatch(/SVA-FC01: the answer "died" is not one of the options/);
  }, 30000);
  it('stops when an ID is used twice', () => {
    const r = runCheck((wb) => setCell(wb, 'Errors', 'error_id', 'SVA-01-E2', 'SVA-01-E1'));
    expect(r.ok).toBe(false);
    expect(r.out).toMatch(/the ID "SVA-01-E1" is used twice/);
  }, 30000);
});
