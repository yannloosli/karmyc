// @ts-nocheck
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';
import { readFileSync } from 'fs';
import css from 'rollup-plugin-css-only';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

const createRollupConfig = (pkg, options = {}) => {
  return {
    input: options.input || 'src/index.ts',
    output: [
      {
        file: 'dist/index.cjs.js',
        format: 'cjs',
        sourcemap: true,
        exports: 'named'
      },
      {
        file: 'dist/index.esm.js',
        format: 'esm',
        sourcemap: true,
        exports: 'named'
      }
    ],
    plugins: [
      resolve(),
      commonjs(),
      css(),
      typescript({
        tsconfig: options.tsconfig || './tsconfig.json',
        declaration: true,
        declarationDir: 'dist',
        noEmit: false
      }),
      terser()
    ],
    external: [
      ...(options.external || []),
      'react',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'react-dom',
      '@szhsin/react-menu'
    ]
  };
};

export default createRollupConfig(pkg);
