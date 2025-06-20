import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@gamesberry/karmyc-core': path.resolve(__dirname, '../src'),
      '@gamesberry/karmyc-core/style.css': path.resolve(__dirname, '../style.css'),
      '@gamesberry/karmyc-core/assets': path.resolve(__dirname, '../assets'),
      '@core': path.resolve(__dirname, '../src/core'),
      '@components': path.resolve(__dirname, '../src/components'),
      '@hooks': path.resolve(__dirname, '../src/hooks'),
      '@utils': path.resolve(__dirname, '../src/utils'),
      '@assets': path.resolve(__dirname, './assets'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
}); 
