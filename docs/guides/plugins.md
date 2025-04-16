# Plugins System

This guide explains how to work with the Karmyc plugin system, which allows you to extend core functionality.

## Overview

The plugin system in Karmyc provides extension points that allow you to:

- Add custom behavior to the action system
- Integrate analytics tracking
- Implement validation rules
- Add performance monitoring
- Create custom history management

## Available Built-in Plugins

Karmyc comes with several built-in plugins:

| Plugin Name | Purpose | Description |
|-------------|---------|-------------|
| `historyPlugin` | Undo/Redo | Tracks state changes and enables undo/redo functionality |
| `loggingPlugin` | Debug Output | Logs actions and state changes to the console |
| `analyticsPlugin` | Usage Tracking | Collects anonymous usage data for analytics |
| `performancePlugin` | Performance Monitoring | Measures and reports performance metrics |
| `validationPlugin` | Data Validation | Validates actions and state changes |

## Using Plugins

To use plugins, pass them to the `useKarmyc` hook when setting up your application:

```tsx
import React from 'react';
import { 
  KarmycProvider, 
  useKarmyc, 
  historyPlugin, 
  loggingPlugin 
} from '@gamesberry/karmyc-core';

function App() {
  // Configure Karmyc with plugins
  const config = useKarmyc({
    plugins: [
      historyPlugin,
      loggingPlugin
    ],
    enableLogging: process.env.NODE_ENV === 'development'
  });
  
  return (
    <KarmycProvider options={config}>
      <YourApplication />
    </KarmycProvider>
  );
}

export default App;
```

## The Plugin Structure

Each plugin follows a common structure:

```typescript
interface IActionPlugin {
  // Unique identifier for the plugin
  id: string;
  
  // Priority (higher values execute first)
  priority: number;
  
  // Called before an action is processed
  beforeAction?: (action: AnyAction) => AnyAction | null;
  
  // Called after an action is processed
  afterAction?: (action: AnyAction, prevState: any, nextState: any) => void;
  
  // Called when the plugin is registered
  onRegister?: () => void;
  
  // Called when the plugin is unregistered
  onUnregister?: () => void;
}
```

## Creating a Custom Plugin

You can create custom plugins to extend Karmyc's functionality:

```typescript
import { ActionPriority } from '@gamesberry/karmyc-core';

// Create a custom analytics plugin
const myAnalyticsPlugin = {
  id: 'my-analytics',
  priority: ActionPriority.ANALYTICS, // Use predefined priorities
  
  // Before an action is processed
  beforeAction: (action) => {
    // You can modify the action or return null to cancel it
    console.log(`About to execute: ${action.type}`);
    return action;
  },
  
  // After an action is processed
  afterAction: (action, prevState, nextState) => {
    // Track changes or send analytics
    console.log(`Executed: ${action.type}`);
    
    // Example: Send analytics event
    if (window.analyticsService) {
      window.analyticsService.trackEvent(action.type, {
        actionData: action.payload
      });
    }
  },
  
  // Called when the plugin is registered
  onRegister: () => {
    console.log('Analytics plugin registered');
    // Initialize any resources
  },
  
  // Called when the plugin is unregistered
  onUnregister: () => {
    console.log('Analytics plugin unregistered');
    // Clean up any resources
  }
};

export default myAnalyticsPlugin;
```

## Dynamic Plugin Registration

You can also register plugins dynamically using the `useActions` hook:

```tsx
import { useActions } from '@gamesberry/karmyc-core';
import myCustomPlugin from './plugins/myCustomPlugin';

function PluginManager() {
  const pluginsEnabled = useSelector(state => state.settings.pluginsEnabled);
  
  // Register plugins based on conditions
  useActions(
    pluginsEnabled ? [myCustomPlugin] : [],
    { enableLogging: true }
  );
  
  return null; // This component doesn't render anything
}
```

Or using the action registry directly:

```tsx
import { useEffect } from 'react';
import { actionRegistry } from '@gamesberry/karmyc-core';
import myCustomPlugin from './plugins/myCustomPlugin';

function DynamicPluginRegistration() {
  useEffect(() => {
    // Register the plugin
    actionRegistry.registerPlugin(myCustomPlugin);
    
    // Clean up when component unmounts
    return () => {
      actionRegistry.unregisterPlugin(myCustomPlugin.id);
    };
  }, []);
  
  return null;
}
```

## Plugin Priorities

Plugins execute in order of priority (higher values first). Karmyc defines standard priorities:

```typescript
export enum ActionPriority {
  VALIDATION = 1000,   // Data validation (highest priority)
  ANALYTICS = 800,     // Analytics tracking
  HISTORY = 600,       // History tracking
  LOGGING = 400,       // Action logging
  PERFORMANCE = 200,   // Performance monitoring
  DEFAULT = 0          // Default plugins
}
```

## Example: Complete Plugin Implementation

Here's a complete example of a plugin that tracks time spent in each area:

```typescript
import { ActionPriority } from '@gamesberry/karmyc-core';

const areaUsagePlugin = {
  id: 'area-usage-tracker',
  priority: ActionPriority.ANALYTICS,
  
  // Store for area usage data
  _areaUsage: new Map(),
  _activeAreaId: null,
  _lastAreaActivationTime: null,
  
  beforeAction: (action) => {
    // Track when an area becomes active
    if (action.type === 'area/setActiveArea') {
      const newAreaId = action.payload;
      
      // Record time spent in previous area
      if (this._activeAreaId && this._lastAreaActivationTime) {
        const timeSpent = Date.now() - this._lastAreaActivationTime;
        const currentTotal = this._areaUsage.get(this._activeAreaId) || 0;
        this._areaUsage.set(this._activeAreaId, currentTotal + timeSpent);
      }
      
      // Update active area and time
      this._activeAreaId = newAreaId;
      this._lastAreaActivationTime = Date.now();
    }
    
    return action;
  },
  
  // Initialize when registered
  onRegister: () => {
    console.log('Area usage tracker initialized');
    
    // Add a global method to get area usage statistics
    window.getAreaUsageStats = () => {
      const stats = {};
      this._areaUsage.forEach((timeSpent, areaId) => {
        stats[areaId] = {
          timeSpentMs: timeSpent,
          timeSpentMinutes: Math.round(timeSpent / 60000 * 10) / 10
        };
      });
      return stats;
    };
  },
  
  // Clean up when unregistered
  onUnregister: () => {
    console.log('Area usage tracker shutting down');
    delete window.getAreaUsageStats;
  }
};

export default areaUsagePlugin;
```

## Best Practices

1. **Use unique IDs**: Ensure your plugin IDs don't conflict with built-in plugins
2. **Set appropriate priorities**: Consider when your plugin should run relative to others
3. **Clean up resources**: Always implement `onUnregister` to clean up any resources
4. **Be performance-conscious**: Avoid heavy processing in action handlers
5. **Follow immutability patterns**: Don't mutate state or action objects directly 
