import { useRef, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { LoadError, Spinner } from '../../components/LoadError';
import { IconArrowLeft, IconChevronLeft, IconChevronRight, IconLock } from '../../components/Icons';
import { NotFound } from '../../pages/NotFound';
import { useUser } from '../../state/user';
import { useT } from '../../lib/text';
import { unitPath } from '../../lib/paths';
import { firstOpenDrill } from '../../lib/progress';
import type { Card } from '../../lib/content';
import { useTrackVisit, useUnitContent } from './useUnit';

/** Shows "____" as a neat gap line. */
function withGap(text: string): ReactNode[] {
  return text.split(/(_{3,})/).map((part, i) =>
    /^_{3,}$/.test(part) ? (
      <span key={i} className="gap" aria-label="gap">
        <span className="sr-only">blank</span>
      </span>
    ) : (
      part
    ),
  );
}

function FlashCard({ card, flipped, onFlip }: { card: Card; flipped: boolean; onFlip: () => void }) {
  const t = useT();
  return (
    <li className="fc-slot">
      <button
        type="button"
        className={`fc${flipped ? ' fc--flipped' : ''}`}
        aria-pressed={flipped}
        aria-label={`${t('warm.card', { n: card.no })}. ${flipped ? `${card.answer}. ${card.why}` : card.front.replace(/_{3,}/, 'blank')}`}
        onClick={onFlip}
      >
        <span className="fc__inner">
          <span className="fc__face fc__front" aria-hidden={flipped}>
            <span className="fc__no">{t('warm.card', { n: card.no })}</span>
            <span className="fc__sentence">{withGap(card.front)}</span>
            <span className="fc__options">{card.options.join(' / ')}</span>
            <span className="fc__tap">{t('warm.tap')}</span>
          </span>
          <span className="fc__face fc__back" aria-hidden={!flipped}>
            <span className="fc__no">{t('warm.card', { n: card.no })}</span>
            <span className="fc__answer">{card.answer}</span>
            <span className="fc__why">{card.why}</span>
            <span className="fc__tap">{t('warm.tap_back')}</span>
          </span>
        </span>
      </button>
    </li>
  );
}

/** Warm-up: 10 flip cards; turning all 10 unlocks the drills (CLAUDE.md 6.5). */
export function WarmupPage() {
  const t = useT();
  const navigate = useNavigate();
  const { slug } = useParams();
  const { summary, unit, failed, retry } = useUnitContent(slug);
  const { data, update } = useUser();
  useTrackVisit(summary, 'warmup');
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const row = useRef<HTMLOListElement>(null);

  if (!summary) return <NotFound />;
  if (failed)
    return (
      <Layout howto={t('warm.howto')}>
        <LoadError onRetry={retry} />
      </Layout>
    );
  if (!unit)
    return (
      <Layout howto={t('warm.howto')}>
        <Spinner />
      </Layout>
    );

  const tag = unit.tag;
  const progress = data?.grammar?.[tag];
  const turned = new Set(progress?.cardsTurned ?? []);
  const total = unit.cards.length;
  const done = turned.size >= total && total > 0;

  const flip = (no: number) => {
    setFlipped((s) => {
      const n = new Set(s);
      if (n.has(no)) n.delete(no);
      else n.add(no);
      return n;
    });
    if (!turned.has(no)) {
      const next = [...turned, no].sort((a, b) => a - b);
      // Several quick turns are saved together after about 2 seconds.
      update({ grammar: { [tag]: { cardsTurned: next } } }, { delayMs: 2000 });
    }
  };

  const scrollBy = (dir: 1 | -1) => {
    const el = row.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.95, behavior: 'smooth' });
  };

  const startDrills = () => {
    const nos = unit.drills.map((d) => d.no);
    navigate(unitPath(unit.slug, 'drill', firstOpenDrill(nos, progress)));
  };

  return (
    <Layout howto={t('warm.howto')}>
      <div className="warm">
        <div className="crumb">
          {unit.name} · {t('warm.crumb')}
        </div>
        <h1 className="warm__heading">{t('warm.heading')}</h1>
        <div className="warm__bar">
          <div className="warm__counter">
            <span className="dots" aria-hidden>
              {unit.cards.map((c) => (
                <span key={c.no} className={`dot${turned.has(c.no) ? ' dot--on' : ''}`} />
              ))}
            </span>
            <span aria-live="polite">{t('warm.counter', { n: turned.size })}</span>
          </div>
          <div className="warm__arrows">
            <button type="button" className="round-btn" aria-label={t('warm.prev')} onClick={() => scrollBy(-1)}>
              <IconChevronLeft size={20} />
            </button>
            <button type="button" className="round-btn" aria-label={t('warm.next_cards')} onClick={() => scrollBy(1)}>
              <IconChevronRight size={20} />
            </button>
          </div>
        </div>

        <ol className="fc-row reading" ref={row}>
          {unit.cards.map((c) => (
            <FlashCard key={c.no} card={c} flipped={flipped.has(c.no)} onFlip={() => flip(c.no)} />
          ))}
        </ol>

        <div className="warm__footer">
          <button type="button" className="btn btn--outline btn--lg" onClick={() => navigate(unitPath(unit.slug, 'rules'))}>
            <IconArrowLeft size={18} /> {t('warm.back')}
          </button>
          <div className="warm__start">
            <button
              type="button"
              className={`btn btn--lg ${done ? 'btn--primary' : 'btn--locked'}`}
              disabled={!done}
              aria-describedby={done ? undefined : 'warm-locked'}
              onClick={startDrills}
            >
              {!done && <IconLock size={18} />} {t('warm.start')}
            </button>
            {!done && (
              <p id="warm-locked" className="warm__locked">
                {t('warm.locked')}
              </p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
