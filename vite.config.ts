import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// While developing, the pretend Firebase (emulators) is reached through this server,
// so the app also works through a preview link.
const AUTH = 'http://127.0.0.1:9099';
const FIRESTORE = 'http://127.0.0.1:8080';

export default defineConfig({
  plugins: [react()],
  build: { chunkSizeWarningLimit: 1200 }, // most of the size is Firebase itself
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
