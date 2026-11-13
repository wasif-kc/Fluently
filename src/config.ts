import cfg from '../fluently.config.json';

export type ToolStatus = 'live' | 'coming_soon';
export interface ToolInfo {
  id: string;
  name: string;
  status: ToolStatus;
}

/** Tools shown on the dashboard. Add a tool here and the dashboard builds itself (CLAUDE.md 3.6). */
export const TOOLS = cfg.tools as ToolInfo[];

/** Emails that may open /admin. The same list is written into firestore.rules by `npm run rules`. */
export const ADMIN_EMAILS = (cfg.adminEmails as string[]).map((e) => e.toLowerCase());

/** Contact emails for the privacy page and deletion requests. */
export const CONTACT_EMAILS = (cfg.contactEmails as string[]).filter(Boolean);

const realConfig = cfg.firebase;

/**
 * Local test mode: uses the Firebase emulators (a pretend Firebase that runs on this computer).
 * On automatically while developing if no real Firebase project is set yet.
 */
export const USE_EMULATORS =
  import.meta.env.VITE_USE_EMULATORS === 'true' || (import.meta.env.DEV && !realConfig.apiKey);

export const FIREBASE_READY = USE_EMULATORS || Boolean(realConfig.apiKey);

export const firebaseConfig = USE_EMULATORS
  ? { apiKey: 'demo-api-key', authDomain: 'demo-fluently.firebaseapp.com', projectId: 'demo-fluently', appId: 'demo-app' }
  : realConfig;
