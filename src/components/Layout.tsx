import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from './Logo';
import { Footer } from './Footer';
import { ProfileMenu } from './ProfileMenu';
import { StreakBadge } from './StreakBadge';
import { IconHome } from './Icons';
import { useUser } from '../state/user';
import { useT } from '../lib/text';
import { streakToShow } from '../lib/progress';

function useOnline() {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}

interface Props {
  howto?: string;
  children: ReactNode;
  wide?: boolean;
  className?: string;
}

/** Top bar + page + footer, shared by every page. */
export function Layout({ howto, children, className }: Props) {
  const t = useT();
  const { status, data } = useUser();
  const { pathname } = useLocation();
  const online = useOnline();
  const signedIn = status === 'ready';
  const onDashboard = pathname === '/';

  return (
    <div className={`app ${className ?? ''}`}>
      <a href="#main" className="skip-link">Skip to content</a>
      <header className="topbar">
        <Logo />
        {signedIn && (
          <nav className="topbar__right" aria-label="Main">
            {!onDashboard && (
              <Link to="/" className="topbar__dash">
                <IconHome size={16} />
                <span>{t('bar.dashboard')}</span>
              </Link>
            )}
            <StreakBadge count={streakToShow(data?.streak)} />
            <ProfileMenu />
          </nav>
        )}
      </header>
      {!online && (
        <div className="offline" role="status">
          {t('err.offline')}
        </div>
      )}
      <main id="main" className="page" tabIndex={-1}>
        {children}
      </main>
      <Footer howto={howto} />
    </div>
  );
}
