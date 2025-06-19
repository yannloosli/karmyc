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
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'react-dom',
      '@szhsin/react-menu',
      '@szhsin/react-menu/dist/esm/components/ControlledMenu.mjs',
      '@szhsin/react-menu/dist/esm/components/FocusableItem.mjs',
      '@szhsin/react-menu/dist/esm/components/Menu.mjs',
      '@szhsin/react-menu/dist/esm/components/MenuButton.mjs',
      '@szhsin/react-menu/dist/esm/components/MenuContainer.mjs',
      '@szhsin/react-menu/dist/esm/components/MenuDivider.mjs',
      '@szhsin/react-menu/dist/esm/components/MenuGroup.mjs',
      '@szhsin/react-menu/dist/esm/components/MenuHeader.mjs',
      '@szhsin/react-menu/dist/esm/components/MenuItem.mjs',
      '@szhsin/react-menu/dist/esm/components/MenuList.mjs',
      '@szhsin/react-menu/dist/esm/components/MenuRadioGroup.mjs',
      '@szhsin/react-menu/dist/esm/components/SubMenu.mjs',
      '@szhsin/react-menu/dist/esm/hooks/useBEM.mjs',
      '@szhsin/react-menu/dist/esm/hooks/useClick.mjs',
      '@szhsin/react-menu/dist/esm/hooks/useCombinedRef.mjs',
      '@szhsin/react-menu/dist/esm/hooks/useHover.mjs',
      '@szhsin/react-menu/dist/esm/hooks/useIsomorphicLayoutEffect.mjs',
      '@szhsin/react-menu/dist/esm/hooks/useItemState.mjs',
      '@szhsin/react-menu/dist/esm/hooks/useItems.mjs',
      '@szhsin/react-menu/dist/esm/hooks/useMenuState.mjs',
      '@szhsin/react-menu/dist/esm/hooks/useMenuStateAndFocus.mjs',
      '@szhsin/react-menu/dist/esm/hooks/useMouseOver.mjs',
      '@szhsin/react-menu/dist/esm/utils/constants.mjs',
      '@szhsin/react-menu/dist/esm/utils/utils.mjs',
      '@szhsin/react-menu/dist/esm/utils/withHovering.mjs',
      'react-transition-state',
      'react-transition-state/dist/esm/hooks/useTransitionMap.mjs',
      'react-transition-state/dist/esm/hooks/useTransitionState.mjs'
    ]
  };
};

export default createRollupConfig(pkg);
