import { resolve } from 'path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**'],
  },
  // Overrides the core bundle loaders so OXC/Rolldown treats TSX files as compiled JSX
  knip: { skipConfig: true }, // Prevents tool clashes if present
  define: {
    'process.env.NODE_ENV': '"test"',
  }
});