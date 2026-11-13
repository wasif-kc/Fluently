// Checks every answer key in the content against the answer-checking engine (CLAUDE.md 4.6).
// Uses the files written by "npm run content".
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { gradeError, gradeBlank, joinTokens, isBlankToken } from '../src/lib/engine.js';

const DIR = path.resolve('public/content/grammar');
const index = JSON.parse(fs.readFileSync(path.join(DIR, 'index.json'), 'utf8'));
const units = index.units.map((u) => JSON.parse(fs.readFileSync(path.join(DIR, `${u.tag}.json`), 'utf8')));

const allErrors = [];
const allBlanks = [];
for (const u of units)
  for (const d of u.drills) {
    const byNo = new Map(d.sentences.map((s) => [s.no, s.tokens]));
    for (const e of d.errors) allErrors.push({ drill: d.id, tokens: byNo.get(e.sentence), e });
    for (const b of d.blanks) allBlanks.push({ drill: d.id, b });
  }

describe('content files', () => {
  it('has all 12 units, 120 drills, 265 errors and 259 blanks', () => {
    expect(units.length).toBe(12);
    expect(units.reduce((n, u) => n + u.drills.length, 0)).toBe(120);
    expect(allErrors.length).toBe(265);
    expect(allBlanks.length).toBe(259);
  });
});

describe('every planted error', () => {
  it.each(allErrors.map((x) => [x.e.id, x]))('%s', (_id, { tokens, e }) => {
    const a = e.start;
    const b = e.end;
    expect(a).toBeGreaterThanOrEqual(0);
    expect(joinTokens(tokens.slice(a, b))).toBe(joinTokens(e.wrongText.match(/\[\[B\d\]\]|\$?\d+(?:,\d{3})*(?:\.\d+)?%?|[A-Za-z’'\-–]+%?|[^\sA-Za-z\d]/g)));

    // Left untouched: missed.
    expect(gradeError(tokens, e, []).status).toBe('missed');

    // Retyping the original: wrong.
    expect(gradeError(tokens, e, [{ start: a, end: b, text: e.wrongText }]).status).toBe('wrong');

    // A selection one word wider on each side (where possible), extra words retyped unchanged.
    const from = a > 0 && !isBlankToken(tokens[a - 1]) ? a - 1 : a;
    const to = b < tokens.length && !isBlankToken(tokens[b]) ? b + 1 : b;

    for (const fix of e.fixes) {
      // Typed over exactly wrong_text: fixed.
      expect(gradeError(tokens, e, [{ start: a, end: b, text: fix }]).status, `fix "${fix}"`).toBe('fixed');
      const wide = [joinTokens(tokens.slice(from, a)), fix, joinTokens(tokens.slice(b, to))].filter(Boolean).join(' ');
      expect(gradeError(tokens, e, [{ start: from, end: to, text: wide }]).status, `wide fix "${wide}"`).toBe('fixed');
      // Capital letters do not matter.
      expect(gradeError(tokens, e, [{ start: a, end: b, text: fix.toUpperCase() }]).status).toBe('fixed');
    }
  });
});

describe('every blank', () => {
  it.each(allBlanks.map((x) => [x.b.id, x]))('%s', (_id, { b }) => {
    expect(b.answers.length).toBeGreaterThanOrEqual(2);
    for (const ans of b.answers) expect(gradeBlank(ans, b.answers), ans).toBe(true);
    expect(gradeBlank('', b.answers)).toBe(false);
  });
});

describe('students never see unit tags', () => {
  it('hints and explanations use unit names', () => {
    const tags = index.units.map((u) => u.tag).join('|');
    const re = new RegExp(`\\((${tags})\\)|\\bUnit \\d+,`);
    for (const { e } of allErrors) {
      expect(re.test(e.hint), e.id + ' hint').toBe(false);
      expect(re.test(e.explanation), e.id + ' explanation').toBe(false);
    }
  });
});
