import { IconInfo } from './Icons';
import { useT } from '../lib/text';

/** Splits a how-to line into its sentences: "Do this. Then that." → ["Do this.", "Then that."] */
export function toSteps(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Footer: the page's how-to as short numbered steps on the left, the credit on the right. */
export function Footer({ howto }: { howto?: string }) {
  const t = useT();
  const steps = howto ? toSteps(howto) : [];
  return (
    <footer className="footer">
      {steps.length > 0 && (
        <div className="footer__howto">
          <span className="footer__icon" aria-hidden>
            <IconInfo size={16} />
          </span>
          {steps.length > 1 ? (
            <ol className="howto">
              {steps.map((s, i) => (
                <li key={i}>
                  <span className="howto__n" aria-hidden>
                    {i + 1}
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="howto__one">{steps[0]}</p>
          )}
        </div>
      )}
      <div className="footer__credit">{t('foot.credit')}</div>
    </footer>
  );
}
