import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './state/auth';
import { UserProvider, useUser } from './state/user';
import { ContentProvider, useContent } from './state/content';
import { Layout } from './components/Layout';
import { LoadError, Spinner } from './components/LoadError';
import { PageErrorBoundary } from './components/PageErrorBoundary';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { NotFound } from './pages/NotFound';

// Each of these pages is downloaded only when it is opened, so the first visit stays small.
const Setup = lazy(() => import('./pages/Setup').then((m) => ({ default: m.Setup })));
const Privacy = lazy(() => import('./pages/Privacy').then((m) => ({ default: m.Privacy })));
const RulePage = lazy(() => import('./tools/grammar/RulePage').then((m) => ({ default: m.RulePage })));
const WarmupPage = lazy(() => import('./tools/grammar/WarmupPage').then((m) => ({ default: m.WarmupPage })));
const DrillPage = lazy(() => import('./tools/grammar/DrillPage').then((m) => ({ default: m.DrillPage })));
const Admin = lazy(() => import('./pages/Admin'));

/** Once a signed-in page has loaded, fetch the lesson pages quietly so moving around is instant (and works offline). */
function prefetchLessonPages() {
  const run = () => {
    void import('./tools/grammar/RulePage').catch(() => {});
    void import('./tools/grammar/WarmupPage').catch(() => {});
    void import('./tools/grammar/DrillPage').catch(() => {});
  };
  const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
  if (w.requestIdleCallback) w.requestIdleCallback(run);
  else window.setTimeout(run, 1500);
}

function PageLoading() {
  return (
    <Layout>
      <Spinner />
    </Layout>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppRoutes() {
  const { status } = useUser();
  const { index, failed, retry } = useContent();
  const { pathname } = useLocation();

  useEffect(() => {
    if (status === 'ready') prefetchLessonPages();
  }, [status]);

  if (failed)
    return (
      <Layout>
        <LoadError onRetry={retry} />
      </Layout>
    );
  if (status === 'loading' || !index)
    return (
      <Layout>
        <Spinner />
      </Layout>
    );
  if (status === 'error')
    return (
      <Layout>
        <LoadError onRetry={() => window.location.reload()} />
      </Layout>
    );
  if (status === 'signed-out')
    return (
      <PageErrorBoundary key={pathname}>
        <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<Landing />} />
          </Routes>
        </Suspense>
      </PageErrorBoundary>
    );
  if (status === 'needs-setup')
    return (
      <PageErrorBoundary key={pathname}>
        <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<Setup />} />
          </Routes>
        </Suspense>
      </PageErrorBoundary>
    );
  return (
    <PageErrorBoundary key={pathname}>
      <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/grammar/:slug/rules" element={<RulePage />} />
          <Route path="/grammar/:slug/warmup" element={<WarmupPage />} />
          <Route path="/grammar/:slug/drill/:no" element={<DrillPage />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </PageErrorBoundary>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <ContentProvider>
          <UserProvider>
            <AppRoutes />
          </UserProvider>
        </ContentProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
