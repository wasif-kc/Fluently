import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// While developing, the pretend Firebase (emulators) is reached through this server,
// so the app also works through a preview link.
const AUTH = 'http://127.0.0.1:9099';
const FIRESTORE = 'http://127.0.0.1:8080';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
      output: {
        // Libraries go in their own files. They rarely change, so browsers keep them cached
        // across updates of the site. The database (Firestore) code stays separate and is
        // downloaded only after sign-in (see src/firebase.ts).
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler|cookie|set-cookie-parser)[\\/]/, priority: 20 },
            { name: 'firebase-auth', test: /node_modules[\\/](@firebase[\\/](app|auth|util|component|logger)|firebase[\\/](app|auth)|idb|tslib)[\\/]/, priority: 10 },
          ],
        },
      },
    },
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/identitytoolkit.googleapis.com': AUTH,
      '/securetoken.googleapis.com': AUTH,
      '/emulator/auth': AUTH,
      '/google.firestore.v1.Firestore': { target: FIRESTORE, changeOrigin: true },
    },
  },
});
