import { useT } from '../lib/text';

export function LoadError({ onRetry }: { onRetry: () => void }) {
  const t = useT();
  return (
    <div className="load-error" role="alert">
      <p>{t('err.load')}</p>
      <button type="button" className="btn btn--primary" onClick={onRetry}>
        {t('err.retry')}
      </button>
    </div>
  );
}

export function Spinner() {
  return (
    <div className="spinner-wrap" aria-busy="true" aria-label="Loading">
      <div className="spinner" />
    </div>
  );
}
