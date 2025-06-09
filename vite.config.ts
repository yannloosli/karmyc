import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import markdown from 'vite-plugin-markdown';

export default defineConfig({
  plugins: [
    react(),
    markdown({
      mode: 'html'
    })
  ],
  assetsInclude: ['**/*.md'],
  resolve: {
    alias: {
      '@': '/src'
    }
  }
}); 
