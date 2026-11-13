import { useState } from 'react';
import { Modal } from './Modal';
import { useT } from '../lib/text';

/** 3-step welcome tour shown on the first dashboard visit (CLAUDE.md 3.4 step 3). */
export function Tour({ onDone }: { onDone: () => void }) {
  const t = useT();
  const [step, setStep] = useState(1);
  const last = step === 3;
  return (
    <Modal open onClose={onDone} labelledBy="tour-title" className="modal--tour">
      <div className="tour">
        <div className="tour__num" aria-hidden>{step}</div>
        <h2 id="tour-title" className="tour__title">{t('tour.title')}</h2>
        <p className="tour__text" aria-live="polite">{t(`tour.${step}`)}</p>
        <div className="tour__dots" aria-label={t('tour.step', { n: step, total: 3 })}>
          {[1, 2, 3].map((n) => (
            <span key={n} className={`dot${n <= step ? ' dot--on' : ''}`} />
          ))}
        </div>
        <div className="tour__actions">
          <button type="button" className="btn btn--ghost" onClick={onDone}>
            {t('tour.skip')}
          </button>
          <button type="button" className="btn btn--primary" data-autofocus onClick={() => (last ? onDone() : setStep(step + 1))}>
            {last ? t('tour.done') : t('tour.next')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
