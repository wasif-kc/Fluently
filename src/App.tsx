import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './state/auth';
import { UserProvider, useUser } from './state/user';
import { ContentProvider, useContent } from './state/content';
import { Layout } from './components/Layout';
import { LoadError, Spinner } from './components/LoadError';
import { Landing } from './pages/Landing';
import { Setup } from './pages/Setup';
import { Dashboard } from './pages/Dashboard';
import { Privacy } from './pages/Privacy';
import { NotFound } from './pages/NotFound';
import { RulePage } from './tools/grammar/RulePage';
import { WarmupPage } from './tools/grammar/WarmupPage';
import { DrillPage } from './tools/grammar/DrillPage';

const Admin = lazy(() => import('./pages/Admin'));

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
      <Routes>
        <Route path="/privacy" element={<Privacy />} />
        <Route path="*" element={<Landing />} />
      </Routes>
    );
  if (status === 'needs-setup')
    return (
      <Routes>
        <Route path="/privacy" element={<Privacy />} />
        <Route path="*" element={<Setup />} />
      </Routes>
    );
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/grammar/:slug/rules" element={<RulePage />} />
      <Route path="/grammar/:slug/warmup" element={<WarmupPage />} />
      <Route path="/grammar/:slug/drill/:no" element={<DrillPage />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route
        path="/admin"
        element={
          <Suspense
            fallback={
              <Layout>
                <Spinner />
              </Layout>
            }
          >
            <Admin />
          </Suspense>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
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
