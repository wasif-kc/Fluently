import { Link } from 'react-router-dom';
import { useT } from '../lib/text';
import { Layout } from '../components/Layout';

export function NotFound() {
  const t = useT();
  return (
    <Layout>
      <section className="notfound">
        <h1>{t('err.notfound_title')}</h1>
        <p>{t('err.notfound_text')}</p>
        <Link to="/" className="btn btn--primary">
          {t('err.notfound_link')}
        </Link>
      </section>
    </Layout>
  );
}
