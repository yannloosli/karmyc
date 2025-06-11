import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import markdown, { Mode } from 'vite-plugin-markdown';

export default defineConfig({
  plugins: [
    react(),
    markdown({
      mode: [Mode.HTML]
    })
  ],
  assetsInclude: ['**/*.md'],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  build: {
    outDir: 'dist',
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'esm' : 'cjs'}.js`
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      },
      input: {
        index: 'src/index.ts'
      }
    }
  }
}); 
