// Fluently answer-checking engine (CLAUDE.md section 4).
// Plain JavaScript so the website, the content script and the tests all share one copy.

/** A token is a word, a number, a blank marker or a single punctuation mark (CLAUDE.md 4.1). */
export const TOKEN_RE = /\[\[B\d\]\]|\$?\d+(?:,\d{3})*(?:\.\d+)?%?|[A-Za-z’'\-–]+%?|[^\sA-Za-z\d]/g;

export const BLANK_RE = /^\[\[(B\d)\]\]$/;

/** Split text into tokens. */
export function tokenize(text) {
  return String(text ?? '').match(TOKEN_RE) ?? [];
}

/** True when the token is a blank marker such as [[B1]]. */
export function isBlankToken(tok) {
  return BLANK_RE.test(tok);
}

/** True when the token is punctuation (not a word, number or blank). */
export function isPunctToken(tok) {
  return !isBlankToken(tok) && !/[A-Za-z\d]/.test(tok);
}

const NO_SPACE_BEFORE = new Set([',', '.', ';', ':', '%', ')', '!', '?']);
const NO_SPACE_AFTER = new Set(['(']);

/** True when a space should be shown before token i (normal reading spacing, CLAUDE.md 4.1). */
export function spaceBefore(tokens, i) {
  if (i === 0) return false;
  if (NO_SPACE_BEFORE.has(tokens[i])) return false;
  if (NO_SPACE_AFTER.has(tokens[i - 1])) return false;
  return true;
}

/** Join tokens back into readable text. */
export function joinTokens(tokens) {
  let out = '';
  tokens.forEach((t, i) => {
    out += (spaceBefore(tokens, i) ? ' ' : '') + t;
  });
  return out;
}

/** Clean-up before comparing (CLAUDE.md 4.3). */
export function normalize(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[‘’‛′`]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Comparison key: cleaned-up text, split into tokens and re-joined with single spaces.
 * Capital letters and extra spaces are ignored; punctuation is not.
 */
export function compareKey(text) {
  return tokenize(normalize(text)).join(' ');
}

/** True when two answers match after clean-up. */
export function sameAnswer(a, b) {
  return compareKey(a) === compareKey(b);
}

/** Split an answer list written as "a | b | c". */
export function splitList(value) {
  return String(value ?? '')
    .split('|')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Split a drill paragraph "(1) … (2) …" into sentences.
 * Markers are found in order (1, 2, 3 …) so numbers inside a sentence, such as "(2015)", are safe.
 * Returns [{ no, text }].
 */
export function splitSentences(paragraph) {
  const p = String(paragraph ?? '').trim();
  const starts = [];
  let from = 0;
  for (let n = 1; ; n++) {
    const marker = `(${n})`;
    let idx = -1;
    let search = from;
    while (search <= p.length) {
      const found = p.indexOf(marker, search);
      if (found === -1) break;
      const before = found === 0 ? ' ' : p[found - 1];
      if (/\s/.test(before)) {
        idx = found;
        break;
      }
      search = found + 1;
    }
    if (idx === -1) break;
    starts.push({ no: n, at: idx, len: marker.length });
    from = idx + marker.length;
  }
  return starts.map((s, i) => {
    const end = i + 1 < starts.length ? starts[i + 1].at : p.length;
    return { no: s.no, text: p.slice(s.at + s.len, end).trim() };
  });
}

/** Every start index where `needle` tokens appear, as whole tokens, inside `tokens`. */
export function findTokenMatches(tokens, needle) {
  const hits = [];
  if (needle.length === 0) return hits;
  for (let i = 0; i + needle.length <= tokens.length; i++) {
    let ok = true;
    for (let j = 0; j < needle.length; j++) {
      if (tokens[i + j] !== needle[j]) {
        ok = false;
        break;
      }
    }
    if (ok) hits.push(i);
  }
  return hits;
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Build the text of tokens[from, to) with the student's edits applied.
 * edits: [{ start, end, text }] in this sentence, not overlapping each other.
 */
function regionText(tokens, from, to, edits) {
  const parts = [];
  let i = from;
  const sorted = [...edits].sort((x, y) => x.start - y.start);
  while (i < to) {
    const e = sorted.find((ed) => ed.start === i);
    if (e) {
      if (e.text.trim()) parts.push(e.text);
      i = e.end;
    } else {
      parts.push(tokens[i]);
      i += 1;
    }
  }
  return parts.join(' ');
}

/**
 * Grade one planted error (CLAUDE.md 4.4).
 * tokens: the sentence tokens. error: { start, end, fixes }. edits: the student's edits in that sentence.
 * Returns { status: 'fixed' | 'wrong' | 'missed', studentText, regionStart, regionEnd, edits }.
 */
export function gradeError(tokens, error, edits) {
  const a = error.start;
  const b = error.end;
  const touching = edits.filter((e) => overlaps(e.start, e.end, a, b));
  if (touching.length === 0) {
    return { status: 'missed', studentText: null, regionStart: a, regionEnd: b, edits: [] };
  }
  const from = Math.min(a, ...touching.map((e) => e.start));
  const to = Math.max(b, ...touching.map((e) => e.end));
  const student = regionText(tokens, from, to, touching);
  const studentKey = compareKey(student);
  const fixed = error.fixes.some((fix) => {
    const expected = [...tokens.slice(from, a), fix, ...tokens.slice(b, to)].join(' ');
    return compareKey(expected) === studentKey;
  });
  const studentText = touching
    .sort((x, y) => x.start - y.start)
    .map((e) => e.text.trim())
    .filter(Boolean)
    .join(' … ');
  return { status: fixed ? 'fixed' : 'wrong', studentText, regionStart: from, regionEnd: to, edits: touching };
}

/** Grade one blank (CLAUDE.md 4.5). */
export function gradeBlank(answer, accepted) {
  if (!String(answer ?? '').trim()) return false;
  return accepted.some((acc) => sameAnswer(answer, acc));
}

/**
 * Grade a whole drill.
 * drill: { sentences: [{ no, tokens }], errors: [{ id, sentence, start, end, fixes }], blanks: [{ id, token, sentence, answers }] }
 * state: { edits: [{ sentence, start, end, text }], blanks: { B1: 'answer', … } }
 * Returns { items, correct, total } where items are in reading order.
 */
export function gradeDrill(drill, state) {
  const bySentence = new Map(drill.sentences.map((s) => [s.no, s.tokens]));
  const items = [];
  const usedEdits = new Set();

  for (const err of drill.errors) {
    const tokens = bySentence.get(err.sentence) ?? [];
    const edits = state.edits.filter((e) => e.sentence === err.sentence);
    const g = gradeError(tokens, err, edits);
    g.edits.forEach((e) => usedEdits.add(e));
    items.push({ kind: 'error', id: err.id, sentence: err.sentence, pos: err.start, result: g, item: err });
  }

  for (const bl of drill.blanks) {
    const tokens = bySentence.get(bl.sentence) ?? [];
    const pos = tokens.indexOf(`[[${bl.token}]]`);
    const answer = state.blanks?.[bl.token] ?? '';
    items.push({ kind: 'blank', id: bl.id, sentence: bl.sentence, pos, answer, correct: gradeBlank(answer, bl.answers), item: bl });
  }

  for (const e of state.edits) {
    if (usedEdits.has(e)) continue;
    const tokens = bySentence.get(e.sentence) ?? [];
    const original = joinTokens(tokens.slice(e.start, e.end));
    if (compareKey(original) === compareKey(e.text)) continue; // not really a change
    items.push({ kind: 'unneeded', id: `U-${e.sentence}-${e.start}`, sentence: e.sentence, pos: e.start, original, text: e.text, edit: e });
  }

  items.sort((x, y) => x.sentence - y.sentence || x.pos - y.pos);
  const scored = items.filter((i) => i.kind !== 'unneeded');
  const correct = scored.filter((i) => (i.kind === 'error' ? i.result.status === 'fixed' : i.correct)).length;
  const errorsFixed = items.filter((i) => i.kind === 'error' && i.result.status === 'fixed').length;
  const blanksCorrect = items.filter((i) => i.kind === 'blank' && i.correct).length;
  return {
    items,
    correct,
    total: scored.length,
    errorsFixed,
    errorsTotal: drill.errors.length,
    blanksCorrect,
    blanksTotal: drill.blanks.length,
  };
}

/** The first planted error, in reading order, that is not yet fixed (for the Hint button). */
export function firstUnfixedError(drill, edits) {
  const bySentence = new Map(drill.sentences.map((s) => [s.no, s.tokens]));
  const ordered = [...drill.errors].sort((x, y) => x.sentence - y.sentence || x.start - y.start);
  for (const err of ordered) {
    const g = gradeError(
      bySentence.get(err.sentence) ?? [],
      err,
      edits.filter((e) => e.sentence === err.sentence),
    );
    if (g.status !== 'fixed') return err;
  }
  return null;
}
