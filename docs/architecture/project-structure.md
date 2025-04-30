# Project Structure

This document outlines the current structure of the Karmyc project, explaining the organization of files and directories.

## Overview

Karmyc is organized as a monorepo with multiple packages:

```
karmyc/
├── packages/               # Monorepo packages
│   ├── core/               # Core library code
│   ├── shared/             # Shared utilities
│   ├── area-projects/      # Project management plugin
│   └── examples/           # Example applications
├── docs/                   # Documentation
├── assets/                 # Static assets (images, etc.)
└── node_modules/           # Dependencies
```

## Package Structure

### Core Package

The `packages/core/` directory contains the main functionality of Karmyc:

```
packages/core/
├── src/                    # Source code
│   ├── actions/            # Action system implementation
│   ├── area/               # Area-related functionality
│   ├── components/         # React components
│   │   ├── area/           # Area-specific components
│   │   └── ...             # Other UI components
│   ├── constants/          # Constants and configuration
│   ├── history/            # History (undo/redo) system (Note: custom implementation per store now)
│   ├── hooks/              # React hooks (including usePluginSystem)
│   ├── providers/          # React context providers (if any remain)
│   ├── stores/             # Zustand stores implementation
│   │   ├── useAreaStore.ts
│   │   ├── useSpaceStore.ts
│   │   ├── ... (other store hooks)
│   │   └── middleware/     # Zustand middleware (if separated)
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   └── index.ts            # Main entry point
├── dist/                   # Built distribution files
├── package.json            # Package configuration
└── tsconfig.json           # TypeScript configuration
```

### Shared Package

The `packages/shared/` directory contains utilities shared across packages:

```
packages/shared/
├── src/                    # Source code
│   ├── utils/              # Shared utility functions
│   ├── types/              # Shared TypeScript types
│   └── index.ts            # Main entry point
├── dist/                   # Built distribution files
├── package.json            # Package configuration
└── tsconfig.json           # TypeScript configuration
```

### Area Projects Plugin

The `packages/area-projects/` directory contains the project management plugin:

```
packages/area-projects/
├── src/                    # Source code
│   ├── components/         # Project-related components
│   ├── hooks/              # Project-related hooks
│   └── index.ts            # Main entry point
├── dist/                   # Built distribution files
├── package.json            # Package configuration
└── tsconfig.json           # TypeScript configuration
```

### Examples Package

The `packages/examples/` directory contains sample applications:

```
packages/examples/
├── src/                    # Source code
│   ├── components/         # Example-specific components
│   ├── styles/             # Example-specific styles
│   ├── static/             # Static assets for examples
│   ├── App.tsx             # Main example app component
│   ├── AreaInitializer.tsx # Example area initialization
│   └── main.tsx            # Entry point
├── public/                 # Public assets
├── index.html              # HTML template
├── package.json            # Package configuration
└── tsconfig.json           # TypeScript configuration
```

## Documentation Structure

The `docs/` directory contains the project documentation:

```
docs/
├── api/                    # API reference documentation
├── architecture/           # Architecture documentation
├── guides/                 # User guides
├── reference/              # Reference documentation
└── README.md               # Documentation overview
```

## Development Workflow

For development:

1. Install dependencies at the root: `yarn install`
2. Build all packages: `yarn build`
3. Run the examples application: `yarn dev:examples`
4. Develop specific packages with watch mode:
   - Core: `yarn watch:core`
   - Shared: `yarn watch:shared`
   - Area Projects: `yarn watch:area-projects`
5. Develop all packages simultaneously: `yarn dev:all`

## Distribution

Each package is built and published independently:

```bash
# Build a specific package
yarn workspace @gamesberry/karmyc-core build

# Publish all packages
yarn publish-all
``` 
