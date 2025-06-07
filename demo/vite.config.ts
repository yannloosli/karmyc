import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@gamesberry/karmyc-core': path.resolve(__dirname, '../src'),
      '@gamesberry/karmyc-core/style.css': path.resolve(__dirname, '../style.css'),
      '@gamesberry/karmyc-core/assets': path.resolve(__dirname, '../assets'),
    },
  },
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name][extname]',
        chunkFileNames: 'assets/[name].js',
        entryFileNames: 'assets/[name].js',
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
}); 
