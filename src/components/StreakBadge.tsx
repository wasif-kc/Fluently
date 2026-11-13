import { useState } from 'react';
import { IconFlame } from './Icons';
import { useT } from '../lib/text';

/** Warm orange pill with a gently flickering flame. Hover or tap shows the tip. */
export function StreakBadge({ count }: { count: number }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <div className="streak-wrap">
      <button
        type="button"
        className="streak"
        aria-describedby={open ? 'streak-tip' : undefined}
        aria-label={`${t('bar.streak', { n: count })}. ${t('bar.streak_tip')}`}
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onBlur={() => setOpen(false)}
      >
        <span className="streak__flame"><IconFlame size={20} /></span>
        <strong className="streak__n">{count}</strong>
        <span className="streak__label">{t('bar.streak', { n: count }).replace(String(count), '').trim()}</span>
      </button>
      {open && (
        <div id="streak-tip" role="tooltip" className="tooltip tooltip--below">
          {t('bar.streak_tip')}
        </div>
      )}
    </div>
  );
}
