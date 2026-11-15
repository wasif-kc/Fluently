import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Fonts: Inter is one "variable" file that holds every weight (48 KB).
// The other reading fonts load only the Latin alphabet, and only when a student picks them.
import '@fontsource-variable/inter/wght.css';
import '@fontsource/open-sans/latin-400.css';
import '@fontsource/open-sans/latin-600.css';
import '@fontsource/open-sans/latin-700.css';
import '@fontsource/atkinson-hyperlegible/latin-400.css';
import '@fontsource/atkinson-hyperlegible/latin-700.css';
import './styles/app.css';
import { App } from './App';
import { hasSignedInHint, loadDb } from './firebase';

// A returning student: start downloading the database code now, alongside the rest of the page.
if (hasSignedInHint()) void loadDb().catch(() => {});

// After a new version is published, a tab that was already open may ask for a file that no
// longer exists. Reload once to pick up the new version instead of showing a broken page.
window.addEventListener('vite:preloadError', (event) => {
  if (!navigator.onLine) return; // offline: the page shows "couldn't load" with a Retry button instead
  try {
    const last = Number(sessionStorage.getItem('fluently:reloadedAt') || 0);
    if (Date.now() - last < 10000) return; // already tried just now: avoid a reload loop
    sessionStorage.setItem('fluently:reloadedAt', String(Date.now()));
  } catch {
    /* storage blocked: still reload */
  }
  event.preventDefault();
  window.location.reload();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
