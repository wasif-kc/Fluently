import { Link } from 'react-router-dom';
import { useT } from '../lib/text';

/** "Fluently · IELTS" with the tagline underneath (CLAUDE.md 1). */
export function Logo({ big }: { big?: boolean }) {
  const t = useT();
  const [main, suffix] = t('bar.brand').split(' · ');
  const head = main.slice(0, -2);
  const tail = main.slice(-2);
  return (
    <Link to="/" className={`logo${big ? ' logo--big' : ''}`} aria-label={`${main}${suffix ? ` ${suffix}` : ''}. ${t('bar.tagline')}`}>
      <span className="logo__line">
        <span className="logo__name">
          {head}
          <span className="logo__accent">{tail}</span>
        </span>
        {suffix && (
          <>
            <span className="logo__dot">·</span>
            <span className="logo__suffix">{suffix}</span>
          </>
        )}
      </span>
      <span className="logo__tagline">{t('bar.tagline')}</span>
    </Link>
  );
}
