// @ts-nocheck
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import { terser } from 'rollup-plugin-terser';
import { readFileSync } from 'fs';
import css from 'rollup-plugin-css-only';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

const createRollupConfig = (pkg, options = {}) => {
  return {
    input: options.input || 'src/index.ts',
    output: [
      {
        file: pkg.main,
        format: 'cjs',
        sourcemap: true,
        exports: 'named'
      },
      {
        file: pkg.module,
        format: 'esm',
        sourcemap: true,
        exports: 'named'
      }
    ],
    plugins: [
      peerDepsExternal(),
      resolve(),
      commonjs(),
      css({
        output: 'dist/style.css'
      }),
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
      'react-dom',
      '@szhsin/react-menu'
    ]
  };
};

export default createRollupConfig(pkg);
