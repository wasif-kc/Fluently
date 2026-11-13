import { useNavigate } from 'react-router-dom';
import { useT } from '../lib/text';
import { Layout } from '../components/Layout';
import { CONTACT_EMAIL } from '../config';
import { IconArrowLeft } from '../components/Icons';

const PARTS = ['what', 'why', 'email', 'optout', 'delete', 'sell', 'firebase'];

/** Plain, short privacy page (CLAUDE.md 6.8). All wording is in AppText. */
export function Privacy() {
  const t = useT();
  const navigate = useNavigate();
  const email = CONTACT_EMAIL || '[contact email]';
  return (
    <Layout howto={t('privacy.howto')}>
      <article className="privacy reading">
        <button type="button" className="btn btn--outline btn--sm" onClick={() => (history.length > 1 ? navigate(-1) : navigate('/'))}>
          <IconArrowLeft size={16} /> {t('privacy.back')}
        </button>
        <h1>{t('privacy.title')}</h1>
        <p className="privacy__intro">{t('privacy.intro')}</p>
        {PARTS.map((p) => (
          <section key={p}>
            <h2>{t(`privacy.${p}_h`)}</h2>
            <p>
              {t(`privacy.${p}`, { email })
                .split(email)
                .flatMap((chunk, i, arr) =>
                  i < arr.length - 1 ? [chunk, <a key={i} href={`mailto:${email}`}>{email}</a>] : [chunk],
                )}
            </p>
          </section>
        ))}
      </article>
    </Layout>
  );
}
