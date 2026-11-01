import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const sharedDir = fileURLToPath(new URL('../shared', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': sharedDir,
    },
  },
  server: {
    // The extension content script matches localhost only; keep the port stable.
    port: 5173,
    strictPort: true,
    fs: {
      // Allow importing shared/ which lives outside the web root.
      allow: [fileURLToPath(new URL('..', import.meta.url))],
    },
  },
});
