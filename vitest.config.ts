import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
    css: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Prevent Vite from trying to load PostCSS/Tailwind config
  // Tests run in Node environment and don't need CSS processing
  css: {
    postcss: {
      plugins: [],
    },
  },
});
