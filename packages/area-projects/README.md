# Karmyc Area Projects

[![npm version](https://img.shields.io/npm/v/@gamesberry/karmyc-area-projects.svg)](https://www.npmjs.com/package/@gamesberry/karmyc-area-projects)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/your-username/karmyc/blob/main/LICENSE)

Project management plugin for Karmyc editor.

## Features

- **Project Management**: Create, open, and save projects
- **Project Explorer**: Browse project files and resources
- **Integration with Karmyc Core**: Seamlessly works with the core layout system
- **Customizable Project Structure**: Adapt to your specific project needs

## Installation

```bash
# Using yarn (recommended)
yarn add @gamesberry/karmyc-area-projects

# Using npm
npm install @gamesberry/karmyc-area-projects
```

## Usage

```tsx
import React from 'react';
import { KarmycProvider, AreaRoot } from '@gamesberry/karmyc-core';
import { ProjectsPlugin, ProjectExplorerArea } from '@gamesberry/karmyc-area-projects';

function App() {
  return (
    <KarmycProvider plugins={[ProjectsPlugin]}>
      {/* Your app components */}
      <AreaRoot />
    </KarmycProvider>
  );
}
```

## Area Types

This package includes the following area types:

- **ProjectExplorerArea**: Displays project files in a tree structure
- **ProjectSettingsArea**: Configure project settings
- **RecentProjectsArea**: View and open recent projects

## API Reference

For detailed documentation on components, hooks, and API usage, please refer to the main [documentation](../../docs/api).

## Related Packages

- [@gamesberry/karmyc-core](../core) - Core layout system
- [@gamesberry/karmyc-shared](../shared) - Shared utilities and components
- [@gamesberry/karmyc-examples](../examples) - Example applications 
