import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { LoadError, Spinner } from '../../components/LoadError';
import { Ring } from '../../components/Ring';
import { ConfirmDialog } from '../../components/Modal';
import {
  IconArrowRight,
  IconBulb,
  IconCheck,
  IconClock,
  IconDoubleLeft,
  IconDoubleRight,
  IconLock,
  IconPlay,
  IconX,
} from '../../components/Icons';
import { NotFound } from '../../pages/NotFound';
import { useUser } from '../../state/user';
import { useT } from '../../lib/text';
import { unitPath } from '../../lib/paths';
import { formatTime } from '../../lib/dates';
import { readLocal, removeLocal, writeLocal } from '../../lib/storage';
import { firstUnfixedError, gradeDrill, type DrillGrade, type Edit } from '../../lib/engine';
import {
  drillUnlocked,
  firstOpenDrill,
  mergeAttempt,
  streakAfterFinish,
  unitStats,
  warmupDone,
  type UnitProgress,
} from '../../lib/progress';
import type { Drill, DrillBlank, DrillError, UnitContent, UnitSummary } from '../../lib/content';
import { useTrackVisit, useUnitContent } from './useUnit';
import { DrillParagraph } from './DrillParagraph';
import { ResultsModal } from './ResultsModal';

const MAX_HINTS = 2;
const PANEL_KEY = 'fluently:drillPanel';

interface Saved {
  edits: Edit[];
  blanks: Record<string, string>;
  elapsed: number;
  hintsUsed: number;
}

const isPhone = () => window.matchMedia('(max-width: 900px)').matches;

// ---------------- Left panel ----------------

function DrillPanel({
  summary,
  progress,
  current,
  onHide,
}: {
  summary: UnitSummary;
  progress: UnitProgress | undefined;
  current: number;
  onHide: () => void;
}) {
  const t = useT();
  const s = unitStats(summary, progress);
  const warm = warmupDone(summary, progress);
  return (
    <div className="dpanel__inner">
      <button type="button" className="dpanel__hide" aria-label={t('drill.hide_panel')} title={t('drill.hide_panel')} onClick={onHide}>
        <IconDoubleLeft size={18} />
      </button>
      <div className="dpanel__ring">
        <Ring percent={s.percent} size={176} stroke={14} label={`${s.bestFixed} of ${s.errorsTotal} ${t('drill.errors_fixed')}`}>
          <span className="dpanel__big">
            {s.bestFixed}/{s.errorsTotal}
          </span>
          <span className="dpanel__small">{t('drill.errors_fixed')}</span>
        </Ring>
      </div>
      <div className="dpanel__unit">{summary.name}</div>
      <div className="dpanel__pct">{t('drill.topic_complete', { n: s.percent })}</div>
      <ol className="dlist">
        {summary.drills.map((d) => {
          const done = Boolean(progress?.drills?.[String(d.no)]?.done);
          const open = drillUnlocked(d.no, warm, progress);
          const isCur = d.no === current;
          const cls = `dlist__item${isCur ? ' dlist__item--current' : ''}${done ? ' dlist__item--done' : ''}${!open ? ' dlist__item--locked' : ''}`;
          if (!open && !isCur)
            return (
              <li key={d.no}>
                <span className={cls} tabIndex={0} aria-disabled="true" data-tip={warm ? t('drill.locked') : t('drill.locked_warmup')}>
                  <span>{d.title}</span>
                  <IconLock size={16} />
                  <span className="sr-only">. {warm ? t('drill.locked') : t('drill.locked_warmup')}</span>
                </span>
              </li>
            );
          return (
            <li key={d.no}>
              <Link to={unitPath(summary.slug, 'drill', d.no)} className={cls} aria-current={isCur ? 'page' : undefined}>
                <span>{d.title}</span>
                {isCur ? <IconPlay size={16} /> : done ? <IconCheck size={16} /> : null}
                {done && <span className="sr-only"> (finished)</span>}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ---------------- The drill itself ----------------

function DrillRunner({ unit, drill, progress }: { unit: UnitContent; drill: Drill; progress: UnitProgress | undefined }) {
  const t = useT();
  const navigate = useNavigate();
  const { uid, data, update } = useUser();
  const key = `fluently:drill:${uid}:${unit.tag}:${drill.no}`;
  const saved = useMemo(() => readLocal<Saved | null>(key, null), [key]);

  const [edits, setEdits] = useState<Edit[]>(saved?.edits ?? []);
  const [blanks, setBlanks] = useState<Record<string, string>>(saved?.blanks ?? {});
  const [hintsUsed, setHintsUsed] = useState(saved?.hintsUsed ?? 0);
  const [elapsed, setElapsed] = useState(saved?.elapsed ?? 0);
  const elapsedRef = useRef(elapsed);
  const [grade, setGrade] = useState<DrillGrade<DrillError, DrillBlank> | null>(null);
  const [checkedTime, setCheckedTime] = useState(0);
  const [checkedHints, setCheckedHints] = useState(0);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);
  const [confirmEmpty, setConfirmEmpty] = useState(0);
  const checked = grade !== null;

  // Unfinished answers stay on this device (CLAUDE.md 3.3).
  const persist = useCallback(
    (patch: Partial<Saved> = {}) => {
      writeLocal(key, { edits, blanks, hintsUsed, elapsed: elapsedRef.current, ...patch });
    },
    [key, edits, blanks, hintsUsed],
  );

  const persistRef = useRef(persist);
  persistRef.current = persist;

  useEffect(() => {
    if (!checked) persist();
  }, [edits, blanks, hintsUsed, checked, persist]);

  // The clock counts up, pausing while the tab is hidden.
  useEffect(() => {
    if (checked) return;
    const id = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
      if (elapsedRef.current % 5 === 0) persistRef.current();
    }, 1000);
    const onHide = () => document.visibilityState === 'hidden' && persistRef.current();
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [checked]);

  const engineDrill = useMemo(() => ({ sentences: drill.sentences, errors: drill.errors, blanks: drill.blanks }), [drill]);
  const isLastDrill = drill.no === unit.drills[unit.drills.length - 1]?.no;
  const nextNo = drill.no + 1;

  const useHint = () => {
    if (hintsUsed >= MAX_HINTS || checked) return;
    const err = firstUnfixedError(engineDrill, edits);
    if (!err) {
      setHint(t('drill.all_fixed')); // does not use up a hint
      return;
    }
    setHint(err.hint);
    setHintsUsed((h) => h + 1);
  };

  const doCheck = () => {
    setConfirmEmpty(0);
    const g = gradeDrill(engineDrill, { edits, blanks });
    const time = elapsedRef.current;
    setGrade(g);
    setCheckedTime(time);
    setCheckedHints(hintsUsed);
    setResultsOpen(true);
    setHint(null);
    removeLocal(key);
    const rec = mergeAttempt(progress?.drills?.[String(drill.no)], {
      errorsFixed: g.errorsFixed,
      errorsTotal: g.errorsTotal,
      blanksCorrect: g.blanksCorrect,
      blanksTotal: g.blanksTotal,
      timeSec: time,
      hintsUsed,
    });
    const resumeDrill = isLastDrill ? drill.no : nextNo;
    update({
      grammar: { [unit.tag]: { drills: { [String(drill.no)]: rec }, lastPage: 'drill', lastDrill: resumeDrill } },
      last: { tool: 'grammar', unit: unit.tag, page: 'drill', drill: resumeDrill },
      streak: streakAfterFinish(data?.streak),
    });
  };

  const onCheck = () => {
    const empty = drill.blanks.filter((b) => !(blanks[b.token] ?? '').trim()).length;
    if (empty > 0) setConfirmEmpty(empty);
    else doCheck();
  };

  const tryAgain = () => {
    elapsedRef.current = 0;
    setElapsed(0);
    setEdits([]);
    setBlanks({});
    setHintsUsed(0);
    setGrade(null);
    setResultsOpen(false);
    setHint(null);
    removeLocal(key);
  };

  const goNext = () => {
    setResultsOpen(false);
    if (isLastDrill) navigate('/');
    else navigate(unitPath(unit.slug, 'drill', nextNo));
  };

  const hintsLeft = MAX_HINTS - hintsUsed;
  const hintLabel = hintsLeft >= 2 ? t('drill.hints_left', { n: hintsLeft }) : hintsLeft === 1 ? t('drill.hint_one') : t('drill.hints_none');
  const nextLabel = isLastDrill ? t('drill.back_dash') : t('drill.next');

  return (
    <div className="drill">
      <div className="drill__head">
        <div>
          <h1 className="drill__title">{drill.title}</h1>
          <span className="chip chip--amber">{drill.instruction}</span>
        </div>
        <div className="drill__tools">
          <div className="clock" aria-label={`${formatTime(checked ? checkedTime : elapsed)} ${t('drill.time_so_far')}`}>
            <IconClock size={22} />
            <span className="clock__time" aria-hidden>
              {formatTime(checked ? checkedTime : elapsed)}
            </span>
            <span className="clock__label" aria-hidden>
              {t('drill.time_so_far')}
            </span>
          </div>
          <span className="exit-wrap" data-tip={t('drill.exit_tip')}>
            <button type="button" className="exit-btn" aria-label={t('drill.exit_tip')} onClick={() => (checked ? navigate('/') : setConfirmExit(true))}>
              <IconX size={22} />
            </button>
          </span>
        </div>
      </div>

      <DrillParagraph
        drill={drill}
        edits={edits}
        blanks={blanks}
        onEdits={setEdits}
        onBlank={(token, value) => setBlanks((b) => ({ ...b, [token]: value }))}
        grade={grade}
      />

      <div className="drill__bottom">
        <div className="drill__center">
          {checked ? (
            <>
              <button type="button" className="btn btn--primary btn--xl" onClick={goNext}>
                {nextLabel} <IconArrowRight size={20} />
              </button>
              <div className="drill__after">
                <button type="button" className="link-btn" onClick={() => setResultsOpen(true)}>
                  {t('drill.see_results')}
                </button>
                <span aria-hidden>·</span>
                <button type="button" className="link-btn" onClick={tryAgain}>
                  {t('drill.try_again')}
                </button>
              </div>
            </>
          ) : (
            <button type="button" className="btn btn--primary btn--xl" onClick={onCheck}>
              {t('drill.check')}
            </button>
          )}
        </div>
        {!checked && (
          <div className="hint">
            {hint && (
              <div className="hint__bubble" role="status">
                <div className="hint__top">
                  <span className="hint__title">{t('drill.hint')}</span>
                  <button type="button" className="icon-btn icon-btn--sm" aria-label={t('drill.hint_close')} onClick={() => setHint(null)}>
                    <IconX size={16} />
                  </button>
                </div>
                <p>{hint}</p>
              </div>
            )}
            <button
              type="button"
              className="hint__btn"
              aria-label={`${t('drill.hint')}. ${hintLabel}`}
              disabled={hintsLeft <= 0}
              onClick={useHint}
            >
              <IconBulb size={30} />
            </button>
            <span className="hint__left">{hintLabel}</span>
          </div>
        )}
      </div>

      {grade && (
        <ResultsModal
          open={resultsOpen}
          title={drill.title}
          grade={grade}
          timeSec={checkedTime}
          hintsUsed={checkedHints}
          nextLabel={nextLabel}
          onClose={() => setResultsOpen(false)}
          onReview={() => setResultsOpen(false)}
          onNext={goNext}
        />
      )}

      <ConfirmDialog
        open={confirmExit}
        message={t('drill.exit_confirm')}
        cancelLabel={t('drill.stay')}
        confirmLabel={t('drill.leave')}
        danger
        onCancel={() => setConfirmExit(false)}
        onConfirm={() => {
          persist();
          navigate('/');
        }}
      />
      <ConfirmDialog
        open={confirmEmpty > 0}
        message={t('drill.empty_blanks', { n: confirmEmpty })}
        cancelLabel={t('drill.go_back')}
        confirmLabel={t('drill.check_anyway')}
        onCancel={() => setConfirmEmpty(0)}
        onConfirm={doCheck}
      />
    </div>
  );
}

// ---------------- Page ----------------

/** Drill page (CLAUDE.md 6.6). */
export function DrillPage() {
  const t = useT();
  const { slug, no: noParam } = useParams();
  const no = Number(noParam);
  const { summary, unit, failed, retry } = useUnitContent(slug);
  const { data } = useUser();
  useTrackVisit(summary, 'drill', no);

  const [panelOpen, setPanelOpen] = useState(() => (isPhone() ? false : readLocal<string>(PANEL_KEY, 'open') !== 'closed'));
  const setPanel = (open: boolean) => {
    setPanelOpen(open);
    if (!isPhone()) writeLocal(PANEL_KEY, open ? 'open' : 'closed');
  };
  // On phones the drawer closes when moving to another drill.
  useEffect(() => {
    if (isPhone()) setPanelOpen(false);
  }, [no]);

  if (!summary || !Number.isInteger(no) || !summary.drills.some((d) => d.no === no)) return <NotFound />;

  const progress = data?.grammar?.[summary.tag];
  const warm = warmupDone(summary, progress);
  const unlocked = drillUnlocked(no, warm, progress);
  const drill = unit?.drills.find((d) => d.no === no);

  let body;
  if (failed) body = <LoadError onRetry={retry} />;
  else if (!unit || !drill) body = <Spinner />;
  else if (!unlocked) {
    const open = firstOpenDrill(
      summary.drills.map((d) => d.no),
      progress,
    );
    body = (
      <div className="locked-card">
        <IconLock size={28} />
        <p>{warm ? t('drill.locked') : t('drill.locked_warmup')}</p>
        {warm ? (
          <Link className="btn btn--primary" to={unitPath(summary.slug, 'drill', open)}>
            {summary.drills.find((d) => d.no === open)?.title} <IconArrowRight size={18} />
          </Link>
        ) : (
          <Link className="btn btn--primary" to={unitPath(summary.slug, 'warmup')}>
            {t('drill.go_warmup')} <IconArrowRight size={18} />
          </Link>
        )}
      </div>
    );
  } else body = <DrillRunner key={`${summary.tag}-${no}`} unit={unit} drill={drill} progress={progress} />;

  return (
    <Layout howto={t('drill.howto')} className="app--drill">
      <div className={`drill-layout${panelOpen ? '' : ' drill-layout--closed'}`}>
        {panelOpen && <div className="dpanel__scrim" onClick={() => setPanel(false)} aria-hidden />}
        <aside className={`dpanel${panelOpen ? ' dpanel--open' : ''}`} aria-label={summary.name} hidden={!panelOpen}>
          <DrillPanel summary={summary} progress={progress} current={no} onHide={() => setPanel(false)} />
        </aside>
        {!panelOpen && (
          <button type="button" className="dpanel__show" aria-label={t('drill.show_panel')} title={t('drill.show_panel')} onClick={() => setPanel(true)}>
            <IconDoubleRight size={18} />
          </button>
        )}
        <div className="drill-main">{body}</div>
      </div>
    </Layout>
  );
}
