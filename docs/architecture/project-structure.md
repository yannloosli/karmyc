# Project Structure

This document outlines the current structure of the Karmyc Core project, explaining the organization of files and directories.

## Overview

Karmyc Core is organized into two main parts:

1. **Core Library** (`lib/`): Contains the main reusable component code
2. **Examples** (`examples/`): Contains example applications that demonstrate usage

```
karmyc/
├── lib/                    # Core library code
├── examples/               # Example applications
├── docs/                   # Documentation
├── assets/                 # Static assets (images, etc.)
├── dist/                   # Built distribution files
└── node_modules/           # Dependencies
```

## Core Library Structure

The `lib/` directory contains the main reusable code of Karmyc Core:

```
lib/
├── actions/                # Action system implementation
├── area/                   # Area-related functionality
├── components/             # React components
├── constants/              # Constants and configuration
├── history/                # History (undo/redo) system
├── hooks/                  # React hooks
├── providers/              # React context providers
├── store/                  # Redux store implementation
│   ├── slices/             # Redux Toolkit slices
│   └── middleware/         # Redux middleware
├── styles/                 # Styling utilities
├── types/                  # TypeScript type definitions
├── utils/                  # Utility functions
└── index.ts                # Main entry point
```

### Key Components

- **Store**: Redux-based state management system
- **Actions**: Modular action system with plugins
- **Components**: Core React components
- **Hooks**: Custom React hooks for accessing functionality

## Examples Structure

The `examples/` directory contains sample applications that demonstrate how to use Karmyc Core:

```
examples/
├── components/             # Example-specific components
├── styles/                 # Example-specific styles
├── static/                 # Static assets for examples
├── public/                 # Public assets
├── App.tsx                 # Main example app component
├── AreaInitializer.tsx     # Example area initialization
├── main.tsx                # Entry point
└── index.html              # HTML template
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

1. Work on the core library in the `lib/` directory
2. Test changes using the examples in the `examples/` directory
3. Build the library for distribution using `yarn bundle`

## Distribution

The built library is output to the `dist/` directory, which contains:

- CommonJS module (`index.js`)
- ES Module (`index.esm.js`)
- TypeScript definitions (`index.d.ts`) 
