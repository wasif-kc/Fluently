import { Modal } from '../../components/Modal';
import { IconArrowRight, IconCheck, IconInfo, IconX } from '../../components/Icons';
import { sameAnswer, type DrillGrade } from '../../lib/engine';
import type { DrillBlank, DrillError } from '../../lib/content';
import { formatTime } from '../../lib/dates';
import { richT, useT } from '../../lib/text';

interface Props {
  open: boolean;
  title: string;
  grade: DrillGrade<DrillError, DrillBlank>;
  timeSec: number;
  hintsUsed: number;
  nextLabel: string;
  onClose: () => void;
  onReview: () => void;
  onNext: () => void;
}

/** Results pop-up (CLAUDE.md 6.7): one row per error, blank and unneeded change, in reading order. */
export function ResultsModal({ open, title, grade, timeSec, hintsUsed, nextLabel, onClose, onReview, onNext }: Props) {
  const t = useT();
  let errorN = 0;
  let blankN = 0;

  return (
    <Modal open={open} onClose={onClose} labelledBy="results-title" className="modal--results">
      <div className="results">
        <header className="results__head">
          <h2 id="results-title">
            {t('res.heading')} · {title}
          </h2>
          <button type="button" className="icon-btn" aria-label={t('res.close')} onClick={onClose}>
            <IconX size={22} />
          </button>
        </header>
        <div className="results__chips">
          <span className="chip">{richT(t('res.score'), { correct: grade.correct, total: grade.total })}</span>
          <span className="chip">{t('res.time', { time: formatTime(timeSec) })}</span>
          <span className="chip">{t('res.hints', { n: hintsUsed })}</span>
        </div>
        <p className="results__howto">{t('res.howto')}</p>

        <ol className="results__list reading">
          {grade.items.map((it) => {
            if (it.kind === 'error') {
              errorN += 1;
              const r = it.result;
              const ok = r.status === 'fixed';
              return (
                <li key={it.id} className="res-row">
                  <span className={`res-icon ${ok ? 'res-icon--ok' : 'res-icon--bad'}`}>
                    {ok ? <IconCheck size={18} /> : <IconX size={18} />}
                    <span className="sr-only">{ok ? 'Correct' : 'Incorrect'}</span>
                  </span>
                  <div className="res-body">
                    <div className="res-label">{t('res.error_n', { n: errorN })}</div>
                    <div className="res-line">
                      {r.status === 'fixed' && (
                        <>
                          {t('res.you_wrote')} <strong className="good">{r.studentText}</strong>
                        </>
                      )}
                      {r.status === 'wrong' && (
                        <>
                          {t('res.you_wrote')} <del className="bad">{r.studentText}</del> · {t('res.correct')}{' '}
                          <strong className="good">{it.item.fixes[0]}</strong>
                        </>
                      )}
                      {r.status === 'missed' && (
                        <>
                          {t('res.not_changed')} <del className="bad">{it.item.wrongText}</del> · {t('res.correct')}{' '}
                          <strong className="good">{it.item.fixes[0]}</strong>
                        </>
                      )}
                    </div>
                    <div className="res-why">
                      {t('res.why')} {it.item.explanation}
                    </div>
                  </div>
                </li>
              );
            }
            if (it.kind === 'blank') {
              blankN += 1;
              const answers = it.item.answers;
              const others = answers.filter((a) => !sameAnswer(a, it.answer));
              const empty = !it.answer.trim();
              return (
                <li key={it.id} className="res-row">
                  <span className={`res-icon ${it.correct ? 'res-icon--ok' : 'res-icon--bad'}`}>
                    {it.correct ? <IconCheck size={18} /> : <IconX size={18} />}
                    <span className="sr-only">{it.correct ? 'Correct' : 'Incorrect'}</span>
                  </span>
                  <div className="res-body">
                    <div className="res-label">{t('res.blank_n', { n: blankN })}</div>
                    <div className="res-line">
                      {it.correct ? (
                        <>
                          {t('res.you_wrote')} <strong className="good">{it.answer.trim()}</strong>
                          {others.length > 0 && (
                            <>
                              {' '}
                              · {t('res.also')} {others.join(', ')}
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          {empty ? (
                            t('res.left_empty')
                          ) : (
                            <>
                              {t('res.you_wrote')} <del className="bad">{it.answer.trim()}</del>
                            </>
                          )}{' '}
                          · {t('res.correct')} <strong className="good">{answers[0]}</strong>
                          {answers.length > 1 && `, ${answers.slice(1).join(', ')}`}
                        </>
                      )}
                    </div>
                  </div>
                </li>
              );
            }
            return (
              <li key={it.id} className="res-row">
                <span className="res-icon res-icon--extra">
                  <IconInfo size={18} />
                </span>
                <div className="res-body">
                  <div className="res-label">{t('res.extra')}</div>
                  <div className="res-line">
                    {t('res.unneeded', { x: '\u0000' })
                      .split('\u0000')
                      .flatMap((part, i, arr) => (i < arr.length - 1 ? [part, <strong key={i}>{it.original}</strong>] : [part]))}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <footer className="results__foot">
          <button type="button" className="btn btn--outline btn--lg" onClick={onReview}>
            {t('res.review')}
          </button>
          <button type="button" className="btn btn--primary btn--lg" onClick={onNext} data-autofocus>
            {nextLabel} <IconArrowRight size={18} />
          </button>
        </footer>
      </div>
    </Modal>
  );
}
