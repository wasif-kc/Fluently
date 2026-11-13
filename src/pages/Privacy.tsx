import { useNavigate } from 'react-router-dom';
import { useT } from '../lib/text';
import { Layout } from '../components/Layout';
import { Fragment } from 'react';
import { CONTACT_EMAILS } from '../config';
import { IconArrowLeft } from '../components/Icons';

const PARTS = ['what', 'why', 'email', 'optout', 'delete', 'sell', 'firebase'];

/** Plain, short privacy page (CLAUDE.md 6.8). All wording is in AppText. */
export function Privacy() {
  const t = useT();
  const navigate = useNavigate();
  // The contact emails as links: "a@x.com or b@y.com".
  const emails = CONTACT_EMAILS.map((e, i) => (
    <Fragment key={e}>
      {i > 0 && ` ${t('privacy.or')} `}
      <a href={`mailto:${e}`}>{e}</a>
    </Fragment>
  ));
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
              {t(`privacy.${p}`)
                .split('{email}')
                .map((chunk, i) => (
                  <Fragment key={i}>
                    {i > 0 && emails}
                    {chunk}
                  </Fragment>
                ))}
            </p>
          </section>
        ))}
      </article>
    </Layout>
  );
}
