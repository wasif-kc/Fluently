import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Ring } from '../components/Ring';
import { Tour } from '../components/Tour';
import { IconArrowRight, IconLock } from '../components/Icons';
import { useUser } from '../state/user';
import { useContent } from '../state/content';
import { useT } from '../lib/text';
import { TOOLS } from '../config';
import { dashboardStats, unitStats, type UnitStats } from '../lib/progress';
import { cardTarget, unitPath } from '../lib/paths';
import type { UnitSummary } from '../lib/content';

function statusLine(t: ReturnType<typeof useT>, s: UnitStats): string {
  switch (s.status) {
    case 'done':
      return t('status.done');
    case 'drills':
      return t('status.drills', { n: s.drillsDone, total: s.drillsTotal });
    case 'unlocked':
      return t('status.unlocked');
    case 'warmup':
      return t('status.warmup');
    default:
      return t('status.start');
  }
}

export function Dashboard() {
  const t = useT();
  const navigate = useNavigate();
  const { data, update } = useUser();
  const { index } = useContent();
  const [firstVisit] = useState(() => !data?.tourDone);
  const [showTour, setShowTour] = useState(() => !data?.tourDone);

  if (!data || !index) return null;
  const units = [...index.units].sort((a, b) => a.order - b.order);
  const stats = dashboardStats(units, data.grammar);
  const firstName = data.name.split(' ')[0] || data.name;

  // "Pick up where you left off"
  const last = data.last;
  const lastUnit = last ? units.find((u) => u.tag === last.unit) : undefined;
  let resumeTo = units[0] ? unitPath(units[0].slug, 'rules') : '/';
  let resumePlace = '';
  if (last && lastUnit) {
    resumeTo = unitPath(lastUnit.slug, last.page, last.drill);
    resumePlace =
      last.page === 'drill'
        ? t('place.drill', { unit: lastUnit.name, n: last.drill ?? 1 })
        : last.page === 'warmup'
          ? t('place.warmup', { unit: lastUnit.name })
          : t('place.rules', { unit: lastUnit.name });
  }

  const finishTour = () => {
    setShowTour(false);
    update({ tourDone: true });
  };

  const live = TOOLS.filter((x) => x.status === 'live');
  const soon = TOOLS.filter((x) => x.status === 'coming_soon');

  const renderUnitCard = (u: UnitSummary) => {
    const p = data.grammar?.[u.tag];
    const s = unitStats(u, p);
    const current = last?.unit === u.tag;
    return (
      <li key={u.tag}>
        <button type="button" className={`topic${current ? ' topic--current' : ''}`} onClick={() => navigate(cardTarget(u, p))}>
          <Ring percent={s.percent} size={64} stroke={7} label={`${s.percent}%`}>
            <span className="topic__pct">{s.percent}%</span>
          </Ring>
          <span className="topic__text">
            <span className="topic__name">{u.name}</span>
            <span className="topic__status">{statusLine(t, s)}</span>
          </span>
        </button>
      </li>
    );
  };

  return (
    <Layout howto={t('dash.howto')}>
      <div className="dash">
        <header className="dash__hello">
          <h1>{t(firstVisit ? 'dash.welcome_new' : 'dash.welcome', { name: firstName })}</h1>
          <p>{t('dash.intro')}</p>
        </header>

        <section className="progress-block" aria-label={t('dash.progress_title')}>
          <div className="progress-block__title">
            <h2>{t('dash.progress_title')}</h2>
            <p>{t('dash.progress_sub')}</p>
          </div>
          <dl className="progress-block__stats">
            <div>
              <dt>{t('dash.stat_drills')}</dt>
              <dd>{stats.drillsCompleted}</dd>
            </div>
            <div>
              <dt>{t('dash.stat_errors')}</dt>
              <dd>{stats.errorsPercent === null ? '—' : `${stats.errorsPercent}%`}</dd>
            </div>
            <div>
              <dt>{t('dash.stat_weakest')}</dt>
              <dd className="progress-block__weak">{stats.weakest ? stats.weakest.name : '—'}</dd>
            </div>
          </dl>
        </section>

        {live.map((tool) => (
          <section key={tool.id} className="dash__tool" aria-labelledby={`tool-${tool.id}`}>
            <h2 id={`tool-${tool.id}`} className="eyebrow">{tool.name}</h2>
            {tool.id === 'grammar' && <ul className="topics">{units.map(renderUnitCard)}</ul>}
          </section>
        ))}

        {soon.length > 0 && (
          <section className="dash__tool" aria-labelledby="coming-soon">
            <h2 id="coming-soon" className="eyebrow">{t('dash.coming_soon')}</h2>
            <ul className="topics">
              {soon.map((tool, i) => {
                const key = `dash.coming_soon_${i + 1}`;
                const label = t(key) === key ? tool.name : t(key);
                return (
                  <li key={tool.id}>
                    <div className="topic topic--soon" aria-disabled="true">
                      <Ring percent={0} size={64} stroke={7} muted label={t('dash.coming_soon_card')}>
                        <IconLock size={20} />
                      </Ring>
                      <span className="topic__text">
                        <span className="topic__name">{label}</span>
                        <span className="topic__status">{t('dash.coming_soon_card')}</span>
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <div className="dash__resume">
          <button type="button" className="btn btn--primary btn--xl" onClick={() => navigate(resumeTo)}>
            <span>{lastUnit ? t('dash.resume') : t('dash.start_first')}</span>
            {resumePlace && <span className="dash__resume-place">· {resumePlace}</span>}
            <IconArrowRight size={20} />
          </button>
        </div>
      </div>
      {showTour && <Tour onDone={finishTour} />}
    </Layout>
  );
}
