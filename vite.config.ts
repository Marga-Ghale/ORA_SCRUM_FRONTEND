import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

export default defineConfig(({ mode }) => ({
  plugins: [
    react({
      babel: {
        plugins: [
          [
            '@locator/babel-jsx/dist',
            {
              env: mode, // ✅ dynamic (dev / production)
            },
          ],
        ],
      },
    }),
    svgr({
      svgrOptions: {
        icon: true,
        exportType: 'named',
        namedExport: 'ReactComponent',
      },
    }),
  ],

  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return;
        warn(warning);
      },
    },
  },

  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },

    // ✅ controlled by .env
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
}));
