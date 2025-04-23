# Plugins API

This document describes the Plugin API for Karmyc, which allows you to extend the core functionality with additional features.

## Official Plugins

Karmyc currently offers the following official plugins:

| Plugin | Package | Description |
|--------|---------|-------------|
| Area Projects | `@gamesberry/karmyc-area-projects` | Project management functionality |

## Using Plugins

To use a plugin, install it from npm and then import its components or hooks:

```bash
# Install the plugin
yarn add @gamesberry/karmyc-area-projects
```

```tsx
// Import and use the plugin
import { ProjectsArea, useProjects } from '@gamesberry/karmyc-area-projects';
import { useRegisterAreaType, KarmycProvider } from '@gamesberry/karmyc-core';

function App() {
  // Register the projects area type
  useRegisterAreaType('projects', ProjectsArea, { /* initial state */ }, {
    displayName: 'Projects',
    defaultSize: { width: 300, height: 400 }
  });

  return (
    <KarmycProvider>
      {/* Your application */}
    </KarmycProvider>
  );
}
```

## Plugin Integration Points

Plugins can extend Karmyc in various ways:

1. **Custom Area Types**: New area types that can be placed in the layout
2. **Custom Hooks**: Hooks for interacting with the plugin's functionality
3. **Store Enhancements**: Additional state and reducers for the Redux store
4. **UI Components**: Reusable components that integrate with the core

## Creating Plugins

To create your own plugin for Karmyc, start with this template:

1. Create a package with the standard structure:

```
my-karmyc-plugin/
├── package.json
├── tsconfig.json
├── rollup.config.js
└── src/
    ├── index.ts
    ├── components/
    │   └── MyArea.tsx
    ├── hooks/
    │   └── useMyFeature.ts
    └── types/
        └── index.ts
```

2. Define your package.json:

```json
{
  "name": "@my-scope/karmyc-my-plugin",
  "version": "0.0.1",
  "main": "dist/index.js",
  "module": "dist/index.esm.js",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "dependencies": {
    "@gamesberry/karmyc-core": "^0.0.1"
  },
  "peerDependencies": {
    "react": "^18.2.0 || ^19.0.0",
    "react-dom": "^18.2.0 || ^19.0.0"
  }
}
```

3. Create your area component:

```tsx
// src/components/MyArea.tsx
import React from 'react';
import { AreaProps } from '@gamesberry/karmyc-core';

export interface MyAreaState {
  data: string;
}

export const MyArea: React.FC<AreaProps<MyAreaState>> = ({ 
  areaState, 
  width, 
  height 
}) => {
  return (
    <div style={{ width, height, padding: 16 }}>
      <h3>My Custom Area</h3>
      <p>{areaState.data}</p>
    </div>
  );
};
```

4. Create a custom hook if needed:

```tsx
// src/hooks/useMyFeature.ts
import { useCallback } from 'react';
import { useArea } from '@gamesberry/karmyc-core';

export function useMyFeature() {
  const { updateActiveArea } = useArea();
  
  const setData = useCallback((data: string) => {
    updateActiveArea((prevState) => ({
      ...prevState,
      data
    }));
  }, [updateActiveArea]);
  
  return { setData };
}
```

5. Export everything in your index.ts:

```tsx
// src/index.ts
export { MyArea } from './components/MyArea';
export type { MyAreaState } from './components/MyArea';
export { useMyFeature } from './hooks/useMyFeature';
```

## Plugin Best Practices

1. **Minimize Dependencies**: Only include dependencies that are absolutely necessary
2. **Clear Documentation**: Document your plugin's API and usage examples
3. **TypeScript Support**: Provide proper TypeScript typings for your API
4. **Respect Core Patterns**: Follow the same patterns as the core library
5. **Versioning**: Use semantic versioning to indicate breaking changes

## Publishing Your Plugin

1. Build your plugin:
```bash
yarn build
```

2. Test it locally:
```bash
yarn link
cd /path/to/your/app
yarn link @my-scope/karmyc-my-plugin
```

3. Publish to npm:
```bash
yarn publish
``` 
