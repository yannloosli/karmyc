# Karmyc Shared

[![npm version](https://img.shields.io/npm/v/@gamesberry/karmyc-shared.svg)](https://www.npmjs.com/package/@gamesberry/karmyc-shared)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/your-username/karmyc/blob/main/LICENSE)

Shared utilities and components used across Karmyc packages.

## Overview

This package contains common utilities, hooks, types, and helper functions that are shared between other Karmyc packages. It provides reusable code to maintain consistency and avoid duplication.

## Installation

```bash
# Using yarn (recommended)
yarn add @gamesberry/karmyc-shared

# Using npm
npm install @gamesberry/karmyc-shared
```

## Usage

```tsx
import { useDebounce, formatTime, generateId } from '@gamesberry/karmyc-shared';

// Use shared hooks
function Component() {
  const debouncedValue = useDebounce(value, 300);
  // ...
}

// Use shared utilities
const id = generateId();
const formattedTime = formatTime(timeInMs);
```

## Contents

The package includes:

- **Utility Functions**: Common helper functions for string manipulation, data transformation, etc.
- **React Hooks**: Reusable custom hooks
- **TypeScript Types**: Shared type definitions
- **Constants**: Common constants used across packages

## Related Packages

- [@gamesberry/karmyc-core](../core) - Core layout system
- [@gamesberry/karmyc-area-projects](../area-projects) - Project management plugin
- [@gamesberry/karmyc-examples](../examples) - Example applications 
