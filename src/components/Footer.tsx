import { IconInfo } from './Icons';
import { useT } from '../lib/text';

export function Footer({ howto }: { howto?: string }) {
  const t = useT();
  return (
    <footer className="footer">
      <div className="footer__howto">
        {howto && (
          <>
            <span className="footer__icon"><IconInfo size={16} /></span>
            <span>{howto}</span>
          </>
        )}
      </div>
      <div className="footer__credit">{t('foot.credit')}</div>
    </footer>
  );
}
