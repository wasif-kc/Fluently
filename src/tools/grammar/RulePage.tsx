import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { LoadError, Spinner } from '../../components/LoadError';
import { RuleBlocks } from '../../components/RuleBlocks';
import { IconArrowLeft, IconArrowRight, IconCheck } from '../../components/Icons';
import { NotFound } from '../../pages/NotFound';
import { useUser } from '../../state/user';
import { useT } from '../../lib/text';
import { unitPath } from '../../lib/paths';
import { useTrackVisit, useUnitContent } from './useUnit';

/** "Rule 2: Two subjects joined by and are plural" → "Two subjects joined by and are plural" */
function shortTitle(title: string): string {
  return title.replace(/^Rule \d+:\s*/, '');
}

/** Rule page: one section at a time, 75/25 with "On this page" (CLAUDE.md 6.4). */
export function RulePage() {
  const t = useT();
  const navigate = useNavigate();
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const { summary, unit, failed, retry } = useUnitContent(slug);
  const { data, update } = useUser();
  useTrackVisit(summary, 'rules');

  const tag = summary?.tag ?? '';
  const progress = data?.grammar?.[tag];
  const read = new Set(progress?.sectionsRead ?? []);
  const sections = unit?.sections ?? [];

  // Which section is open: ?s=n in the address, else the last one viewed, else the first.
  let current = Number(params.get('s')) - 1;
  if (!(current >= 0 && current < sections.length)) {
    const lastIdx = sections.findIndex((s) => s.id === progress?.lastSection);
    current = lastIdx >= 0 ? lastIdx : 0;
  }
  const section = sections[current];
  const isLast = current === sections.length - 1;

  const [fromList, setFromList] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLHeadingElement>(null);

  const markRead = (id: string) => {
    if (!tag || read.has(id)) return;
    const next = [...read, id];
    update({ grammar: { [tag]: { sectionsRead: next, lastSection: id } } });
  };

  const go = (idx: number, opts?: { fromList?: boolean }) => {
    setFromList(Boolean(opts?.fromList));
    setParams({ s: String(idx + 1) });
    const id = sections[idx]?.id;
    if (tag && id) update({ grammar: { [tag]: { lastSection: id } } }, { delayMs: 2000 });
    window.scrollTo({ top: 0 });
    requestAnimationFrame(() => topRef.current?.focus({ preventScroll: true }));
  };

  // A section opened from the list is ticked once its end is reached.
  useEffect(() => {
    if (!fromList || !section || !endRef.current) return;
    const el = endRef.current;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        markRead(section.id);
        io.disconnect();
      }
    });
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromList, section?.id]);

  if (!summary) return <NotFound />;
  if (failed)
    return (
      <Layout howto={t('rules.howto')}>
        <LoadError onRetry={retry} />
      </Layout>
    );
  if (!unit || !section)
    return (
      <Layout howto={t('rules.howto')}>
        <Spinner />
      </Layout>
    );

  const next = sections[current + 1];

  return (
    <Layout howto={t('rules.howto')}>
      <div className="rules">
        <div className="rules__main">
          <div className="crumb">
            {unit.name} · {t('rules.crumb')}
          </div>

          <label className="rules__mobile-nav">
            <span className="sr-only">{t('rules.sections')}</span>
            <select value={current} onChange={(e) => go(Number(e.target.value), { fromList: true })} aria-label={t('rules.sections')}>
              {sections.map((s, i) => (
                <option key={s.id} value={i}>
                  {read.has(s.id) ? '✓ ' : ''}
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <article className="reading rules__content">
            <h1 className="rules__title" ref={topRef} tabIndex={-1}>
              {section.title}
            </h1>
            <RuleBlocks blocks={section.blocks} />

            {isLast && unit.furtherStudy.length > 0 && (
              <section className="further" id="further-study" aria-labelledby="further-title">
                <h2 id="further-title" className="rb-subtitle">{t('rules.further')}</h2>
                <ul>
                  {unit.furtherStudy.map((l) => (
                    <li key={l.url}>
                      <a href={l.url} target="_blank" rel="noopener noreferrer" className="further__link">
                        {l.title}
                      </a>
                      <span className="tag">{l.type}</span>
                      {l.description && <p>{l.description}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <div ref={endRef} aria-hidden className="rules__end" />
          </article>

          <nav className="rules__nav" aria-label={t('rules.sections')}>
            <button type="button" className="btn btn--outline" disabled={current === 0} onClick={() => go(current - 1)}>
              <IconArrowLeft size={18} /> {t('rules.previous')}
            </button>
            <span className="rules__count">{t('rules.section_n', { n: current + 1, total: sections.length })}</span>
            {next ? (
              <button
                type="button"
                className="btn btn--primary btn--lg rules__next"
                onClick={() => {
                  markRead(section.id);
                  go(current + 1);
                }}
              >
                <span>
                  {t('rules.next')}: {shortTitle(next.title)}
                </span>
                <IconArrowRight size={18} />
              </button>
            ) : (
              <button
                type="button"
                className="btn btn--primary btn--lg rules__next"
                onClick={() => {
                  markRead(section.id);
                  navigate(unitPath(unit.slug, 'warmup'));
                }}
              >
                <span>{t('rules.last')}</span>
                <IconArrowRight size={18} />
              </button>
            )}
          </nav>
        </div>

        <aside className="rules__side" aria-labelledby="on-this-page">
          <div className="rules__side-inner">
            <h2 id="on-this-page" className="eyebrow">{t('rules.on_page')}</h2>
            <ol className="toc">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className={`toc__item${i === current ? ' toc__item--current' : ''}${read.has(s.id) ? ' toc__item--read' : ''}`}
                    aria-current={i === current ? 'step' : undefined}
                    onClick={() => go(i, { fromList: true })}
                  >
                    <span>{s.label}</span>
                    {read.has(s.id) && (
                      <>
                        <IconCheck size={16} className="toc__tick" />
                        <span className="sr-only"> (read)</span>
                      </>
                    )}
                  </button>
                </li>
              ))}
              {unit.furtherStudy.length > 0 && (
                <li>
                  <button
                    type="button"
                    className="toc__item toc__item--extra"
                    onClick={() => {
                      go(sections.length - 1, { fromList: true });
                      setTimeout(() => document.getElementById('further-study')?.scrollIntoView({ behavior: 'smooth' }), 50);
                    }}
                  >
                    <span>{t('rules.further')}</span>
                  </button>
                </li>
              )}
            </ol>
          </div>
        </aside>
      </div>
    </Layout>
  );
}
