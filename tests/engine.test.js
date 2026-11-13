// Unit tests for the answer-checking engine (CLAUDE.md section 4).
import { describe, it, expect } from 'vitest';
import {
  tokenize, joinTokens, normalize, compareKey, sameAnswer, splitSentences,
  findTokenMatches, gradeError, gradeBlank, gradeDrill, firstUnfixedError,
} from '../src/lib/engine.js';

describe('tokenize (4.1)', () => {
  it('keeps numbers, money and percentages as one token', () => {
    expect(tokenize('It rose to 5,000 units, $2.5 or 40% more.')).toEqual(
      ['It', 'rose', 'to', '5,000', 'units', ',', '$2.5', 'or', '40%', 'more', '.'],
    );
  });
  it('keeps hyphenated words, apostrophes and blanks together', () => {
    expect(tokenize('Long-term [[B2]] in people’s lives (2015).')).toEqual(
      ['Long-term', '[[B2]]', 'in', 'people’s', 'lives', '(', '2015', ')', '.'],
    );
  });
  it('joins tokens with normal spacing', () => {
    expect(joinTokens(tokenize('rose ( by 40 % ) , then fell .'))).toBe('rose (by 40%), then fell.');
    expect(joinTokens(['hours', '.', 'This'])).toBe('hours. This');
  });
});

describe('comparing answers (4.3)', () => {
  it('ignores capitals, extra spaces, curly quotes and en dashes', () => {
    expect(sameAnswer('  Hours.   this ', 'hours. This')).toBe(true);
    expect(sameAnswer('people’s', "people's")).toBe(true);
    expect(sameAnswer('2010–2015', '2010-2015')).toBe(true);
    expect(normalize('A  B')).toBe('a b');
  });
  it('does not ignore punctuation', () => {
    expect(sameAnswer('hours, this', 'hours. this')).toBe(false);
    expect(compareKey('stress; children')).not.toBe(compareKey('stress children'));
  });
});

describe('splitSentences', () => {
  it('splits on (1) (2) markers in order and ignores years in brackets', () => {
    const s = splitSentences('(1) Sales rose (2015) sharply. (2) Then they fell. (3) End.');
    expect(s).toEqual([
      { no: 1, text: 'Sales rose (2015) sharply.' },
      { no: 2, text: 'Then they fell.' },
      { no: 3, text: 'End.' },
    ]);
  });
});

describe('grading an error (4.4)', () => {
  const tokens = tokenize('A number of developing countries now relies heavily on money.');
  const [a] = findTokenMatches(tokens, ['relies']);
  const err = { start: a, end: a + 1, fixes: ['rely'] };
  it('fixed when the exact words are replaced correctly', () => {
    expect(gradeError(tokens, err, [{ start: a, end: a + 1, text: 'rely' }]).status).toBe('fixed');
  });
  it('fixed when a wider selection keeps the extra words', () => {
    expect(gradeError(tokens, err, [{ start: a - 1, end: a + 2, text: 'now RELY heavily' }]).status).toBe('fixed');
  });
  it('wrong when the extra words are changed', () => {
    expect(gradeError(tokens, err, [{ start: a - 1, end: a + 2, text: 'rely heavily' }]).status).toBe('wrong');
  });
  it('missed when nothing overlaps', () => {
    expect(gradeError(tokens, err, [{ start: 0, end: 1, text: 'The' }]).status).toBe('missed');
  });
  it('wrong when the original is retyped', () => {
    expect(gradeError(tokens, err, [{ start: a, end: a + 1, text: 'relies' }]).status).toBe('wrong');
  });
});

describe('a whole drill', () => {
  const drill = {
    sentences: [
      { no: 1, tokens: tokenize('The price of onions have gone up.') },
      { no: 2, tokens: tokenize('Families feel [[B1]] about it.') },
    ],
    errors: [{ id: 'X-01-E1', sentence: 1, start: 4, end: 5, fixes: ['has'] }],
    blanks: [{ id: 'X-01-B1', token: 'B1', sentence: 2, answers: ['worried', 'anxious'] }],
  };
  it('scores errors and blanks and lists unneeded changes without lowering the score', () => {
    const g = gradeDrill(drill, {
      edits: [
        { sentence: 1, start: 4, end: 5, text: 'has' },
        { sentence: 2, start: 0, end: 1, text: 'Parents' },
      ],
      blanks: { B1: 'Anxious' },
    });
    expect(g.correct).toBe(2);
    expect(g.total).toBe(2);
    expect(g.items.map((i) => i.kind)).toEqual(['error', 'unneeded', 'blank']);
  });
  it('the hint helper finds the first error not yet fixed', () => {
    expect(firstUnfixedError(drill, [])?.id).toBe('X-01-E1');
    expect(firstUnfixedError(drill, [{ sentence: 1, start: 4, end: 5, text: 'has' }])).toBeNull();
  });
  it('an empty blank is wrong', () => {
    expect(gradeBlank('', ['a', 'b'])).toBe(false);
    expect(gradeBlank('   ', ['a', 'b'])).toBe(false);
  });
});
