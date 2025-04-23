# Monorepo Structure

Karmyc uses a monorepo approach to organize its codebase. This document explains the structure, workflows, and best practices for working with the Karmyc monorepo.

## Overview

A monorepo is a version-controlled code repository that holds multiple related projects, with well-defined relationships. Karmyc's monorepo uses Yarn Workspaces to manage the various packages.

## Packages

The Karmyc monorepo contains the following packages:

### Core Package

`@gamesberry/karmyc-core` - The main layout engine with all the core functionality.

- Location: `/packages/core`
- Description: Contains the layout system, area management, drag-and-drop, and all fundamental features.
- Main exports: Components, hooks, and utilities for creating modular interfaces.

### Shared Package

`@gamesberry/karmyc-shared` - Common utilities and shared code.

- Location: `/packages/shared`
- Description: Contains helper functions, common types, and utilities used across all packages.
- Main exports: Utility functions, shared interfaces, and common hooks.

### Area Projects Plugin

`@gamesberry/karmyc-area-projects` - Project management plugin.

- Location: `/packages/area-projects`
- Description: Adds project management capabilities to Karmyc.
- Main exports: Components and hooks for project management areas.

### Examples Package

`@gamesberry/karmyc-examples` - Demo applications and usage examples.

- Location: `/packages/examples`
- Description: Contains example applications and demos showing how to use Karmyc.
- Purpose: For development and documentation, not intended for distribution.

## Dependency Structure

```
              ┌─────────────┐
              │   shared    │
              └─────┬───────┘
                    │
                    ▼
              ┌─────────────┐
              └─────┬───────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
┌───────────────┐ ┌─────────────────┐ ┌─────────────┐
│ area-projects │ │    examples     │ │ future pkgs │
└───────────────┘ └─────────────────┘ └─────────────┘
```

All packages depend on `shared`, and `area-projects` and `examples` depend on `core`.

## Development Workflow

### Installation

```bash
# Clone the repository
git clone https://github.com/gamesberry/karmyc.git
cd karmyc

# Install dependencies for all packages
yarn install
```

### Building

```bash
# Build all packages
yarn build

# Build a specific package
yarn workspace @gamesberry/karmyc-core build
```

### Development Mode

```bash
# Watch mode for all packages
yarn dev:all

# Watch a specific package
yarn watch:core
yarn watch:shared
yarn watch:area-projects

# Run examples application
yarn dev:examples
```

### Testing

```bash
# Run tests for all packages
yarn test

# Test a specific package
yarn workspace @gamesberry/karmyc-core test
```

## Adding a New Package

1. Create a new directory in `/packages/`
2. Initialize the package with `package.json`:
   ```json
   {
     "name": "@gamesberry/karmyc-my-package",
     "version": "0.0.1",
     "main": "dist/index.js",
     "module": "dist/index.esm.js",
     "types": "dist/index.d.ts",
     "files": ["dist"],
     "scripts": {
       "dev": "vite build --watch",
       "build": "vite build",
       "bundle": "rollup -c",
       "prepublishOnly": "yarn bundle",
       "lint": "eslint . --ext .ts,.tsx",
       "test": "jest"
     },
     "dependencies": {
       "@gamesberry/karmyc-shared": "0.0.1"
     },
     "peerDependencies": {
       "react": "^18.2.0 || ^19.0.0",
       "react-dom": "^18.2.0 || ^19.0.0"
     }
   }
   ```
3. Create `tsconfig.json` in your package:
   ```json
   {
     "extends": "../../tsconfig.base.json",
     "compilerOptions": {
       "outDir": "dist",
       "rootDir": "src",
       "composite": true
     },
     "include": ["src/**/*"],
     "references": [
       { "path": "../shared" }
     ]
   }
   ```
4. Create a `rollup.config.js` file:
   ```js
   import { createRollupConfig } from '../../rollup.base';
   import pkg from './package.json';

   export default createRollupConfig(pkg, {
     external: ['@gamesberry/karmyc-shared']
   });
   ```
5. Update the root `package.json` scripts to include your new package.

## Publishing

Each package can be published independently:

```bash
# Publish a specific package
yarn workspace @gamesberry/karmyc-core publish

# Publish all packages
yarn publish-all
```

## Versioning

The packages follow semantic versioning (SemVer):

- Major version: Breaking changes
- Minor version: New features, no breaking changes
- Patch version: Bug fixes, no breaking changes

## Best Practices

1. **Import from Published Package Names**: Always use the full package name in imports:
   ```typescript
   // Good
   import { utility } from '@gamesberry/karmyc-shared';
   
   // Bad
   import { utility } from '../../shared/src/utility';
   ```

2. **Clearly Define Dependencies**: Make sure each package has its dependencies explicitly defined.

3. **Minimize Cross-Package Dependencies**: Keep dependencies minimal and well-justified.

4. **Keep Shared Code in Shared Package**: Any utilities used by multiple packages should live in the shared package.

5. **Testing in Isolation**: Each package should have its own tests and be testable independently.

6. **Documentation**: Document the public API of each package. 
