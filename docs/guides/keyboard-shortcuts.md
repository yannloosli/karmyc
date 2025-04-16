# Keyboard Shortcuts

## Overview

The keyboard shortcuts system in Karmyc allows you to define and use keyboard combinations to trigger actions in your application. Each area type can have its own set of shortcuts, making the interface more efficient and user-friendly.

## Keyboard Shortcut Structure

Each keyboard shortcut is defined with the following properties:

```typescript
interface KeyboardShortcut {
    key: string;            // The main key (e.g., "S", "Delete")
    name: string;           // Descriptive name of the shortcut
    fn: (areaId: string, params: any) => void; // Function to execute
    modifierKeys?: string[];   // Required modifier keys (Ctrl, Alt, etc.)
    optionalModifierKeys?: string[]; // Optional modifiers
    history?: boolean;      // If true, the action will be added to history
    shouldAddToStack?: (areaId: string, prevState: any, nextState: any) => boolean;
}
```

## Using Area-Specific Shortcuts

Each area type can have its own set of keyboard shortcuts. Use the `useAreaKeyboardShortcuts` hook to register shortcuts for a specific area type:

```typescript
// In your component
import { useAreaKeyboardShortcuts } from '@gamesberry/karmyc-core';

function SetupShortcuts() {
    useAreaKeyboardShortcuts('editor', [
        {
            key: 'S',
            modifierKeys: ['Control'],
            name: 'Save',
            fn: (areaId) => {
                // Code to save
            },
            history: true  // Adds to history for undo/redo
        },
        {
            key: 'Delete',
            name: 'Delete',
            fn: (areaId) => {
                // Code to delete
            }
        }
    ]);
    
    return null;
}
```

## Global Shortcuts

For shortcuts that are not tied to a specific area type, you can use the `keyboardShortcutRegistry`:

```typescript
import { keyboardShortcutRegistry } from '@gamesberry/karmyc-core';

// Register a global shortcut
const shortcutId = keyboardShortcutRegistry.register({
    key: 'Z',
    modifierKeys: ['Control'],
    name: 'Undo',
    fn: () => {
        // Undo code
    }
});

// Remove a shortcut
keyboardShortcutRegistry.remove(shortcutId);
```

## Supported Modifier Keys

The following modifier keys are supported:
- `Command` (⌘ key on Mac)
- `Alt` (Option key on Mac)
- `Shift`
- `Control` (Ctrl key)

## History Integration

When the `history` property is set to `true`, the action will be added to the undo/redo history stack. This allows users to undo or redo the action:

```typescript
{
    key: 'A',
    modifierKeys: ['Control'],
    name: 'Select All',
    fn: (areaId) => {
        // Code to select all
    },
    history: true  // Will be added to history
}
```

For more control over which actions are added to history, you can use the `shouldAddToStack` function:

```typescript
{
    key: 'M',
    name: 'Move Item',
    fn: (areaId, params) => {
        // Code to move an item
    },
    history: true,
    shouldAddToStack: (areaId, prevState, nextState) => {
        // Only add to history if the position has actually changed
        return prevState.position.x !== nextState.position.x ||
               prevState.position.y !== nextState.position.y;
    }
}
```

## Complete Example

Here's a complete example showing how to set up shortcuts for a canvas area:

```typescript
import { useAreaKeyboardShortcuts } from '@gamesberry/karmyc-core';

function CanvasShortcuts() {
    useAreaKeyboardShortcuts('canvas', [
        // Copy (Ctrl+C)
        {
            key: 'C',
            modifierKeys: ['Control'],
            name: 'Copy',
            fn: (areaId) => {
                console.log(`Copy in area ${areaId}`);
                // Copy implementation
            }
        },
        // Paste (Ctrl+V)
        {
            key: 'V',
            modifierKeys: ['Control'],
            name: 'Paste',
            fn: (areaId) => {
                console.log(`Paste in area ${areaId}`);
                // Paste implementation
            }
        },
        // Delete (Delete key)
        {
            key: 'Delete',
            name: 'Delete',
            fn: (areaId) => {
                console.log(`Delete in area ${areaId}`);
                // Delete implementation
            }
        },
        // Save (Ctrl+S)
        {
            key: 'S',
            modifierKeys: ['Control'],
            name: 'Save',
            fn: (areaId) => {
                console.log(`Save in area ${areaId}`);
                // Save implementation
            },
            history: true
        }
    ]);
    
    return null;
}

export default CanvasShortcuts;
```

## Best Practices

1. **Use descriptive names**: Choose clear, descriptive names for your shortcuts to make them easier to understand.
2. **Be consistent**: Use consistent shortcuts across different parts of your application.
3. **Avoid conflicts**: Be careful not to override browser default shortcuts unless necessary.
4. **Document shortcuts**: Make sure your shortcuts are documented and discoverable by users.
5. **Consider platform differences**: Remember that Command is used on Mac instead of Control for many common operations.

## Debugging Shortcuts

You can enable logging for keyboard events by adding this to your application:

```typescript
// Enable keyboard debug logging
window.debugKeyboard = true;
```

This will log keyboard events to the console, making it easier to debug keyboard shortcut issues. 
