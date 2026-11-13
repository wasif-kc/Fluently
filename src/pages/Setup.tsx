import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../state/user';
import { useT } from '../lib/text';
import { Layout } from '../components/Layout';

/** First sign-in only: choose a name and (optionally) agree to emails (CLAUDE.md 3.4 step 2). */
export function Setup() {
  const t = useT();
  const { googleName, createProfile } = useUser();
  const [name, setName] = useState((googleName || '').split(' ')[0].slice(0, 30));
  const [optIn, setOptIn] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <Layout howto={t('setup.howto')}>
      <section className="setup">
        <form
          className="setup__card"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!name.trim()) return;
            setBusy(true);
            await createProfile(name, optIn);
          }}
        >
          <h1 className="setup__title">{t('setup.title')}</h1>
          <label htmlFor="setup-name" className="setup__label">
            {t('setup.name_label')}
          </label>
          <input
            id="setup-name"
            className="input input--lg"
            value={name}
            maxLength={30}
            autoFocus
            autoComplete="given-name"
            onChange={(e) => setName(e.target.value)}
          />
          <label className="checkbox">
            <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} />
            <span>{t('setup.optin')}</span>
          </label>
          <Link to="/privacy" className="setup__privacy">
            {t('setup.privacy')}
          </Link>
          <button type="submit" className="btn btn--primary btn--lg" disabled={!name.trim() || busy}>
            {t('setup.start')}
          </button>
        </form>
      </section>
    </Layout>
  );
}
