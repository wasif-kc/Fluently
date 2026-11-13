import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { compareKey, isBlankToken, type DrillGrade, type Edit } from '../../lib/engine';
import type { Drill, DrillBlank, DrillError } from '../../lib/content';
import { useT } from '../../lib/text';
import { IconCheck, IconX } from '../../components/Icons';

const MAX_TOKENS = 8;

/** Punctuation that stands on its own (selected only by stretching across it). */
const HARD_PUNCT = new Set([',', '.', ';', ':', '!', '?', '(', ')', '"', '“', '”', '…', '/']);

interface Selection {
  sentence: number;
  start: number;
  end: number;
  /** true when an existing edit was reopened */
  existing: boolean;
}

/** A clickable piece of a sentence: a word (tokens written with no space between, like "18–30" or "2000s"), a punctuation mark or a blank. */
interface Piece {
  start: number;
  end: number;
  kind: 'word' | 'punct' | 'blank';
}

interface Sentence {
  no: number;
  tokens: string[];
  sp: number[];
  pieces: Piece[];
}

interface Props {
  drill: Drill;
  edits: Edit[];
  blanks: Record<string, string>;
  onEdits: (edits: Edit[]) => void;
  onBlank: (token: string, value: string) => void;
  grade: DrillGrade<DrillError, DrillBlank> | null;
}

function piecesOf(tokens: string[], sp: number[]): Piece[] {
  const out: Piece[] = [];
  let i = 0;
  while (i < tokens.length) {
    const tok = tokens[i];
    if (isBlankToken(tok)) {
      out.push({ start: i, end: i + 1, kind: 'blank' });
      i += 1;
      continue;
    }
    if (HARD_PUNCT.has(tok)) {
      out.push({ start: i, end: i + 1, kind: 'punct' });
      i += 1;
      continue;
    }
    let j = i + 1;
    while (j < tokens.length && !sp[j] && !isBlankToken(tokens[j]) && !HARD_PUNCT.has(tokens[j])) j += 1;
    out.push({ start: i, end: j, kind: 'word' });
    i = j;
  }
  return out;
}

/** tokens[from, to) written as in the original text. */
function joinSp(s: Sentence, from: number, to: number): string {
  let out = '';
  for (let i = from; i < to; i++) out += (i > from && s.sp[i] ? ' ' : '') + s.tokens[i];
  return out;
}

/** tokens[from, to) with the student's edits applied. */
function textWithEdits(s: Sentence, from: number, to: number, edits: { start: number; end: number; text: string }[]): string {
  let out = '';
  let i = from;
  while (i < to) {
    const e = edits.find((x) => x.start === i);
    const piece = e ? e.text.trim() : s.tokens[i];
    out += (i > from && s.sp[i] ? ' ' : '') + piece;
    i = e ? e.end : i + 1;
  }
  return out;
}

/** The drill paragraph: tap words to correct them, fill blanks; after checking, show the marked answers. */
export function DrillParagraph({ drill, edits, blanks, onEdits, onBlank, grade }: Props) {
  const t = useT();
  const para = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [sel, setSel] = useState<Selection | null>(null);
  const [draft, setDraft] = useState('');
  const [dirty, setDirty] = useState(false);
  const [boxPos, setBoxPos] = useState<{ top: number; left: number } | null>(null);
  const [tipFor, setTipFor] = useState<string | null>(null);
  const selectAllNext = useRef(false);
  const readOnly = Boolean(grade);

  const sentences: Sentence[] = useMemo(
    () =>
      drill.sentences.map((s) => {
        const sp = s.sp ?? s.tokens.map((_, i) => (i === 0 ? 0 : 1));
        return { no: s.no, tokens: s.tokens, sp, pieces: piecesOf(s.tokens, sp) };
      }),
    [drill],
  );
  const sentenceOf = useCallback((no: number) => sentences.find((s) => s.no === no)!, [sentences]);
  const editAt = (sentence: number, i: number) => edits.find((e) => e.sentence === sentence && i >= e.start && i < e.end);

  const close = useCallback(() => {
    setSel(null);
    setBoxPos(null);
    setDirty(false);
  }, []);

  // ----- selecting words -----

  const openSelection = (s: Selection) => {
    setTipFor(null);
    setSel(s);
    const existing = s.existing ? edits.find((e) => e.sentence === s.sentence && e.start === s.start) : null;
    setDraft(existing ? existing.text : joinSp(sentenceOf(s.sentence), s.start, s.end));
    setDirty(false);
    selectAllNext.current = true;
  };

  const rangeIsFree = (sentence: number, start: number, end: number) => {
    const toks = sentenceOf(sentence).tokens;
    for (let i = start; i < end; i++) {
      if (isBlankToken(toks[i])) return false;
      if (editAt(sentence, i)) return false;
    }
    return true;
  };

  const clickPiece = (sentence: number, piece: Piece) => {
    if (readOnly || piece.kind === 'blank') return;
    const ex = editAt(sentence, piece.start);
    if (ex) {
      openSelection({ sentence, start: ex.start, end: ex.end, existing: true });
      return;
    }
    // Clicking another word in the same sentence stretches the selection.
    if (sel && !sel.existing && sel.sentence === sentence) {
      const start = Math.min(sel.start, piece.start);
      const end = Math.max(sel.end, piece.end);
      if (end - start <= MAX_TOKENS && rangeIsFree(sentence, start, end)) {
        setSel({ ...sel, start, end });
        if (!dirty) {
          setDraft(joinSp(sentenceOf(sentence), start, end));
          selectAllNext.current = true; // typing then replaces the selected words
        }
        input.current?.focus();
        return;
      }
    }
    if (piece.kind === 'punct') return; // punctuation is only selected by stretching across it
    openSelection({ sentence, start: piece.start, end: piece.end, existing: false });
  };

  const save = () => {
    if (!sel) return;
    const text = draft.trim();
    const s = sentenceOf(sel.sentence);
    const others = edits.filter((e) => !(sel.existing && e.sentence === sel.sentence && e.start === sel.start));
    const unchanged = compareKey(text) === compareKey(joinSp(s, sel.start, sel.end));
    // An empty box (or the same words) removes the edit.
    if (!text || unchanged) onEdits(others);
    else onEdits([...others, { sentence: sel.sentence, start: sel.start, end: sel.end, text }]);
    close();
  };

  // Place the correction box just below the selected words (above if there is no room).
  useLayoutEffect(() => {
    if (!sel || !para.current) return;
    const place = () => {
      const c = para.current;
      const b = box.current;
      if (!c || !b) return;
      const nodes = [...c.querySelectorAll<HTMLElement>(`[data-s="${sel.sentence}"]`)].filter((n) => {
        const i = Number(n.dataset.i);
        const e = Number(n.dataset.e ?? i + 1);
        return i < sel.end && e > sel.start;
      });
      if (!nodes.length) return;
      const cr = c.getBoundingClientRect();
      const rects = nodes.flatMap((n) => [...n.getClientRects()]);
      const top = Math.min(...rects.map((r) => r.top));
      const bottom = Math.max(...rects.map((r) => r.bottom));
      const bw = b.offsetWidth;
      const bh = b.offsetHeight;
      let y = bottom - cr.top + 6;
      const roomBelow = window.innerHeight - bottom;
      if (roomBelow < bh + 16 && top - bh - 16 > 0) y = top - cr.top - bh - 6;
      let x = rects[0].left - cr.left - 12;
      x = Math.max(4, Math.min(x, cr.width - bw - 4));
      setBoxPos({ top: y, left: x });
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [sel, edits]);

  useEffect(() => {
    if (selectAllNext.current && boxPos) {
      selectAllNext.current = false;
      input.current?.focus();
      input.current?.select();
    }
  }, [draft, sel, boxPos]);

  // Escape closes the correction box even when focus is on a word.
  useEffect(() => {
    if (!sel) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [sel, close]);

  // Clicking anywhere else closes the correction box and the (?) tooltip.
  useEffect(() => {
    const onDown = (e: MouseEvent | TouchEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest('.cbox') || el.closest('[data-s]')) return;
      if (sel) close();
    };
    const onClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (!el.closest('.blank__help')) setTipFor(null);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('click', onClick);
    };
  }, [sel, close]);

  const onKey = (e: KeyboardEvent, sentence: number, piece: Piece) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      clickPiece(sentence, piece);
    }
  };

  // ----- rendering -----

  const renderBlank = (sentence: number, i: number, tok: string) => {
    const token = tok.slice(2, -2);
    const b = drill.blanks.find((x) => x.token === token);
    const n = drill.blanks.findIndex((x) => x.token === token) + 1;
    if (grade) {
      const item = grade.items.find((x) => x.kind === 'blank' && x.item.token === token);
      const ok = item?.kind === 'blank' && item.correct;
      const answer = blanks[token] ?? '';
      return (
        <span className={`blank-result ${ok ? 'blank-result--ok' : 'blank-result--bad'}`} data-s={sentence} data-i={i}>
          <span className="sr-only">{ok ? 'Correct blank: ' : 'Blank, correct answer: '}</span>
          {ok ? (
            answer
          ) : (
            <>
              {answer.trim() && (
                <>
                  <del>{answer}</del>{' '}
                </>
              )}
              <ins>{b?.answers[0]}</ins>
            </>
          )}
        </span>
      );
    }
    const value = blanks[token] ?? '';
    const open = tipFor === token;
    return (
      <span className="blank" data-blank={token}>
        <input
          className="blank__input"
          aria-label={t('drill.blank_label', { n })}
          value={value}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          style={{ width: `max(150px, ${value.length + 2}ch)` }}
          onFocus={() => sel && close()}
          onChange={(e) => onBlank(token, e.target.value)}
        />
        <button
          type="button"
          className="blank__help"
          aria-label={`${t('drill.blank_help')} (${t('drill.blank_label', { n })})`}
          aria-expanded={open}
          aria-describedby={open ? `tip-${token}` : undefined}
          onClick={() => {
            if (sel) close();
            setTipFor(open ? null : token);
          }}
        >
          ?
        </button>
        {open && b && (
          <span id={`tip-${token}`} role="tooltip" className="tooltip tooltip--blank">
            {b.hint}
          </span>
        )}
      </span>
    );
  };

  const renderWorking = (s: Sentence) => {
    const out: ReactNode[] = [];
    const inSel = (i: number) => sel !== null && sel.sentence === s.no && i >= sel.start && i < sel.end;
    for (let k = 0; k < s.pieces.length; k++) {
      const p = s.pieces[k];
      const e = edits.find((x) => x.sentence === s.no && x.start === p.start);
      const covered = edits.find((x) => x.sentence === s.no && p.start > x.start && p.start < x.end);
      if (covered) continue;
      if (p.start > 0 && s.sp[p.start]) out.push(<span key={`sp${p.start}`} className={`sp${inSel(p.start - 1) && inSel(p.start) ? ' sel' : ''}`}> </span>);
      if (e) {
        const selected = sel?.existing && sel.sentence === s.no && sel.start === e.start;
        out.push(
          <span
            key={`e${p.start}`}
            className={`tok tok--edit${selected ? ' sel' : ''}`}
            role="button"
            tabIndex={0}
            data-s={s.no}
            data-i={e.start}
            data-e={e.end}
            aria-label={`Your correction: ${e.text}. Original: ${joinSp(s, e.start, e.end)}. Press to change.`}
            onClick={() => clickPiece(s.no, p)}
            onKeyDown={(ev) => onKey(ev, s.no, p)}
          >
            {e.text}
          </span>,
        );
        continue;
      }
      if (p.kind === 'blank') {
        out.push(<Fragment key={`b${p.start}`}>{renderBlank(s.no, p.start, s.tokens[p.start])}</Fragment>);
        continue;
      }
      const text = joinSp(s, p.start, p.end);
      if (p.kind === 'punct') {
        out.push(
          <span key={`p${p.start}`} className={`tok tok--punct${inSel(p.start) ? ' sel' : ''}`} data-s={s.no} data-i={p.start} data-e={p.end} onClick={() => clickPiece(s.no, p)}>
            {text}
          </span>,
        );
        continue;
      }
      out.push(
        <span
          key={`w${p.start}`}
          className={`tok tok--word${inSel(p.start) ? ' sel' : ''}`}
          role="button"
          tabIndex={0}
          data-s={s.no}
          data-i={p.start}
          data-e={p.end}
          onClick={() => clickPiece(s.no, p)}
          onKeyDown={(ev) => onKey(ev, s.no, p)}
        >
          {text}
        </span>,
      );
    }
    return out;
  };

  const renderChecked = (s: Sentence) => {
    if (!grade) return null;
    const marks = grade.items.filter((x) => x.sentence === s.no && x.kind !== 'blank');
    const out: ReactNode[] = [];
    let i = 0;
    while (i < s.tokens.length) {
      if (i > 0 && s.sp[i]) out.push(' ');
      const m = marks.find((x) => (x.kind === 'error' ? x.result.regionStart === i : x.kind === 'unneeded' ? x.edit.start === i : false));
      if (m && m.kind === 'error') {
        const r = m.result;
        const err = m.item;
        if (r.status === 'fixed') {
          out.push(
            <span key={`m${i}`} className="mark mark--ok">
              <span className="sr-only">Fixed: </span>
              {textWithEdits(s, r.regionStart, r.regionEnd, r.edits)}
            </span>,
          );
        } else {
          const before = joinSp(s, r.regionStart, err.start);
          const after = joinSp(s, err.end, r.regionEnd);
          const correct = `${before}${before && s.sp[err.start] ? ' ' : ''}${err.fixes[0]}${after && s.sp[err.end] ? ' ' : ''}${after}`;
          out.push(
            <span key={`m${i}`} className="mark mark--bad">
              <span className="sr-only">{r.status === 'missed' ? 'Missed error: ' : 'Not fixed: '}</span>
              <del>{joinSp(s, r.regionStart, r.regionEnd)}</del> <ins>{correct}</ins>
            </span>,
          );
        }
        i = r.regionEnd;
        continue;
      }
      if (m && m.kind === 'unneeded') {
        out.push(
          <span key={`m${i}`} className="mark mark--extra" title={t('res.unneeded', { x: m.original })}>
            <span className="sr-only">Unneeded change: </span>
            <del>{m.text}</del> {joinSp(s, m.edit.start, m.edit.end)}
          </span>,
        );
        i = m.edit.end;
        continue;
      }
      const tok = s.tokens[i];
      out.push(<Fragment key={`t${i}`}>{isBlankToken(tok) ? renderBlank(s.no, i, tok) : tok}</Fragment>);
      i += 1;
    }
    return out;
  };

  return (
    <div className={`para reading${readOnly ? ' para--checked' : ''}`} ref={para}>
      <p className="para__text">
        {sentences.map((s, idx) => (
          <Fragment key={s.no}>
            {idx > 0 && ' '}
            <span className="sent">{readOnly ? renderChecked(s) : renderWorking(s)}</span>
          </Fragment>
        ))}
      </p>

      {sel && !readOnly && (
        <div
          ref={box}
          className="cbox"
          style={boxPos ? { top: boxPos.top, left: boxPos.left } : { visibility: 'hidden', top: 0, left: 0 }}
          role="dialog"
          aria-label={t('drill.correction')}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <label htmlFor="cbox-input" className="cbox__label">
              {t('drill.correction')}
            </label>
            <input
              id="cbox-input"
              ref={input}
              className="cbox__input"
              value={draft}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              onChange={(e) => {
                setDraft(e.target.value);
                setDirty(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault();
                  close();
                }
              }}
            />
            <button type="submit" className="cbox__btn cbox__btn--ok" aria-label={t('drill.save_fix')}>
              <IconCheck size={18} />
            </button>
            <button type="button" className="cbox__btn cbox__btn--cancel" aria-label={t('drill.cancel_fix')} onClick={close}>
              <IconX size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
