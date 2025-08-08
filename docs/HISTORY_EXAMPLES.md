# Enhanced History System Usage Examples

This document provides practical examples for using the robust enhanced history system in Karmyc Core.

## Table of Contents

1. [Installation and Configuration](#installation-and-configuration)
2. [Basic Hooks](#basic-hooks)
3. [Simple Actions](#simple-actions)
4. [Actions with Diffs](#actions-with-diffs)
5. [Selection Actions](#selection-actions)
6. [Transform Actions](#transform-actions)
7. [Complex Actions](#complex-actions)
8. [Error Handling](#error-handling)
9. [Migration from Legacy System](#migration-from-legacy-system)
10. [Best Practices](#best-practices)

## Installation and Configuration

### 1. Import Hooks

```typescript
// Basic hook for a specific space
import { useEnhancedHistory } from '../hooks/useEnhancedHistory';

// Hook for active space
import { useActiveSpaceHistory } from '../hooks/useEnhancedHistory';

// Hook for typed actions
import { useActiveSpaceTypedActions } from '../hooks/useEnhancedHistory';
```

### 2. Basic Configuration

```typescript
// In your component
const MyComponent = () => {
    const spaceId = 'my-space-id';
    const {
        isActionInProgress,
        lastAction,
        stats,
        startAction,
        submitAction,
        cancelAction,
        undo,
        redo,
        canUndo,
        canRedo,
    } = useEnhancedHistory(spaceId);

    // Your logic here...
};
```

## Basic Hooks

### useEnhancedHistory

Main hook for managing the history of a specific space.

```typescript
const MyComponent = () => {
    const spaceId = 'my-space-id';
    const history = useEnhancedHistory(spaceId);
    
    return (
        <div>
            <p>Action in progress: {history.isActionInProgress ? 'Yes' : 'No'}</p>
            <p>Can undo: {history.canUndo() ? 'Yes' : 'No'}</p>
            <p>Can redo: {history.canRedo() ? 'Yes' : 'No'}</p>
            <p>Number of actions: {history.getHistoryLength()}</p>
        </div>
    );
};
```

### useActiveSpaceHistory

Hook for using the active space history automatically.

```typescript
const MyComponent = () => {
    const history = useActiveSpaceHistory(); // Uses active space
    
    const handleUndo = () => {
        const result = history.undo();
        if (result.success) {
            console.log('Undo performed:', result.action);
        } else {
            console.error('Undo error:', result.error);
        }
    };
    
    return (
        <button onClick={handleUndo} disabled={!history.canUndo()}>
            Undo
        </button>
    );
};
```

## Simple Actions

### Create a Simple Action

```typescript
const MyComponent = () => {
    const history = useActiveSpaceHistory();
    const [counter, setCounter] = useState(0);
    
    const handleIncrement = () => {
        const result = history.createSimpleAction(
            'INCREMENT_COUNTER',
            [], // no diffs
            false, // no index shift
            ['counter'] // modified keys
        );
        
        if (result.success) {
            setCounter(prev => prev + 1);
        }
    };
    
    return (
        <button onClick={handleIncrement}>
            Increment ({counter})
        </button>
    );
};
```

### Action with Diffs

```typescript
const MyComponent = () => {
    const history = useActiveSpaceHistory();
    const [items, setItems] = useState(['Item 1', 'Item 2']);
    
    const handleEditItem = (index: number) => {
        const oldValue = items[index];
        const newValue = `${oldValue} (modified)`;
        
        const diffs = [{
            type: 'UPDATE',
            path: ['items', index],
            oldValue,
            newValue,
            metadata: {
                allowIndexShift: false,
                modifiedRelated: false,
            }
        }];
        
        const result = history.createSimpleAction(
            'EDIT_ITEM',
            diffs,
            false,
            ['items']
        );
        
        if (result.success) {
            setItems(prev => prev.map((item, i) => 
                i === index ? newValue : item
            ));
        }
    };
    
    return (
        <div>
            {items.map((item, index) => (
                <button key={index} onClick={() => handleEditItem(index)}>
                    {item}
                </button>
            ))}
        </div>
    );
};
```

## Selection Actions

### Selection Management

```typescript
const MyComponent = () => {
    const history = useActiveSpaceHistory();
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    
    const handleSelectItem = (index: number) => {
        const newSelection = selectedItems.includes(index)
            ? selectedItems.filter(i => i !== index)
            : [...selectedItems, index];
        
        const result = history.createSelectionAction(
            'SELECT_ITEM',
            { selectedItems: newSelection },
            [{
                type: 'SELECTION',
                path: ['selectedItems'],
                oldValue: selectedItems,
                newValue: newSelection,
                metadata: {
                    allowIndexShift: true,
                    modifiedRelated: true,
                }
            }]
        );
        
        if (result.success) {
            setSelectedItems(newSelection);
        }
    };
    
    return (
        <div>
            {items.map((item, index) => (
                <button 
                    key={index} 
                    onClick={() => handleSelectItem(index)}
                    style={{
                        backgroundColor: selectedItems.includes(index) ? 'blue' : 'white'
                    }}
                >
                    {item}
                </button>
            ))}
        </div>
    );
};
```

## Transform Actions

### Moving Elements

```typescript
const MyComponent = () => {
    const history = useActiveSpaceHistory();
    const [items, setItems] = useState(['A', 'B', 'C', 'D']);
    
    const handleMoveItem = (fromIndex: number, toIndex: number) => {
        const diffs = [{
            type: 'MOVE',
            path: ['items'],
            oldValue: items,
            newValue: (() => {
                const newItems = [...items];
                const [movedItem] = newItems.splice(fromIndex, 1);
                newItems.splice(toIndex, 0, movedItem);
                return newItems;
            })(),
            metadata: {
                allowIndexShift: true,
                modifiedRelated: false,
            }
        }];
        
        const result = history.createTransformAction(
            'MOVE_ITEM',
            { fromIndex, toIndex },
            diffs
        );
        
        if (result.success) {
            setItems(prev => {
                const newItems = [...prev];
                const [movedItem] = newItems.splice(fromIndex, 1);
                newItems.splice(toIndex, 0, movedItem);
                return newItems;
            });
        }
    };
    
    return (
        <div>
            {items.map((item, index) => (
                <div key={index}>
                    <span>{item}</span>
                    {index > 0 && (
                        <button onClick={() => handleMoveItem(index, index - 1)}>
                            ←
                        </button>
                    )}
                    {index < items.length - 1 && (
                        <button onClick={() => handleMoveItem(index, index + 1)}>
                            →
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
};
```

## Complex Actions

### Action with Start and Submit

```typescript
const MyComponent = () => {
    const history = useActiveSpaceHistory();
    const [isProcessing, setIsProcessing] = useState(false);
    
    const handleComplexAction = async () => {
        const actionId = `COMPLEX_ACTION_${Date.now()}`;
        
        // Start the action
        const startResult = history.startAction(actionId);
        if (!startResult.success) {
            console.error('Start error:', startResult.error);
            return;
        }
        
        setIsProcessing(true);
        
        try {
            // Simulate complex processing
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Submit the action
            const submitResult = history.submitAction(
                'COMPLEX_ACTION',
                [], // diffs
                false,
                ['complexData']
            );
            
            if (submitResult.success) {
                console.log('Complex action completed');
            } else {
                console.error('Submit error:', submitResult.error);
            }
        } catch (error) {
            // Cancel the action on error
            history.cancelAction();
            console.error('Processing error:', error);
        } finally {
            setIsProcessing(false);
        }
    };
    
    return (
        <button 
            onClick={handleComplexAction} 
            disabled={isProcessing || history.isActionInProgress}
        >
            {isProcessing ? 'Processing...' : 'Complex Action'}
        </button>
    );
};
```

## Typed Actions

### Using Predefined Actions

```typescript
const MyComponent = () => {
    const typedActions = useActiveSpaceTypedActions();
    const [items, setItems] = useState(['Item 1', 'Item 2']);
    
    const handleCreate = () => {
        const result = typedActions.create({ type: 'new-item' });
        if (result.success) {
            setItems(prev => [...prev, `Item ${prev.length + 1}`]);
        }
    };
    
    const handleDelete = (index: number) => {
        const result = typedActions.delete({ id: index });
        if (result.success) {
            setItems(prev => prev.filter((_, i) => i !== index));
        }
    };
    
    const handleSelect = (index: number) => {
        const result = typedActions.select({ items: [index] });
        if (result.success) {
            console.log('Item selected:', index);
        }
    };
    
    const handleTransform = (index: number) => {
        const result = typedActions.transform({ scale: 1.5 }, []);
        if (result.success) {
            console.log('Transform applied');
        }
    };
    
    return (
        <div>
            <button onClick={handleCreate}>Create</button>
            {items.map((item, index) => (
                <div key={index}>
                    <span>{item}</span>
                    <button onClick={() => handleSelect(index)}>Select</button>
                    <button onClick={() => handleTransform(index)}>Transform</button>
                    <button onClick={() => handleDelete(index)}>Delete</button>
                </div>
            ))}
        </div>
    );
};
```

## Error Handling

### Robust Error Handling

```typescript
const MyComponent = () => {
    const history = useActiveSpaceHistory();
    const toast = useToast();
    
    const handleActionWithErrorHandling = () => {
        const result = history.createSimpleAction('TEST_ACTION');
        
        if (result.success) {
            toast({
                title: 'Action successful',
                status: 'success',
                duration: 2000,
            });
        } else {
            toast({
                title: 'Error',
                description: result.error,
                status: 'error',
                duration: 5000,
            });
        }
    };
    
    const handleUndoWithErrorHandling = () => {
        if (!history.canUndo()) {
            toast({
                title: 'Cannot undo',
                description: 'No actions to undo',
                status: 'warning',
                duration: 2000,
            });
            return;
        }
        
        const result = history.undo();
        if (result.success) {
            toast({
                title: 'Undo performed',
                status: 'success',
                duration: 2000,
            });
        } else {
            toast({
                title: 'Undo error',
                description: result.error,
                status: 'error',
                duration: 5000,
            });
        }
    };
    
    return (
        <div>
            <button onClick={handleActionWithErrorHandling}>
                Action with Error Handling
            </button>
            <button onClick={handleUndoWithErrorHandling}>
                Undo with Error Handling
            </button>
        </div>
    );
};
```

## Migration from Legacy System

### Before (Legacy System)

```typescript
// ❌ Legacy system
import { useSpaceStore } from '../core/spaceStore';

const MyComponent = () => {
    const { undoSharedState, redoSharedState } = useSpaceStore();
    const spaceId = 'my-space';
    
    const handleUndo = () => {
        undoSharedState(spaceId); // No error handling
    };
    
    const handleRedo = () => {
        redoSharedState(spaceId); // No error handling
    };
    
    return (
        <div>
            <button onClick={handleUndo}>Undo</button>
            <button onClick={handleRedo}>Redo</button>
        </div>
    );
};
```

### After (New System)

```typescript
// ✅ New system
import { useActiveSpaceHistory } from '../hooks/useEnhancedHistory';

const MyComponent = () => {
    const { undo, redo, canUndo, canRedo } = useActiveSpaceHistory();
    
    const handleUndo = () => {
        const result = undo();
        if (result.success) {
            console.log('Undo performed:', result.action);
        } else {
            console.error('Undo error:', result.error);
        }
    };
    
    const handleRedo = () => {
        const result = redo();
        if (result.success) {
            console.log('Redo performed:', result.action);
        } else {
            console.error('Redo error:', result.error);
        }
    };
    
    return (
        <div>
            <button onClick={handleUndo} disabled={!canUndo()}>
                Undo
            </button>
            <button onClick={handleRedo} disabled={!canRedo()}>
                Redo
            </button>
        </div>
    );
};
```

## Best Practices

### 1. Always Check Results

```typescript
// ✅ Good practice
const result = history.createSimpleAction('MY_ACTION');
if (result.success) {
    // Handle success
    console.log('Action created:', result.action);
} else {
    // Handle error
    console.error('Error:', result.error);
}
```

### 2. Use Typed Actions

```typescript
// ✅ Recommended
const typedActions = useActiveSpaceTypedActions();
const result = typedActions.create({ type: 'user' });

// ❌ Avoid
const result = history.createSimpleAction('CREATE_USER');
```

### 3. Handle In-Progress Actions

```typescript
// ✅ Good practice
const MyComponent = () => {
    const history = useActiveSpaceHistory();
    
    useEffect(() => {
        // Clean up in-progress action on unmount
        return () => {
            if (history.isActionInProgress) {
                history.cancelAction();
            }
        };
    }, [history]);
    
    return (
        <button disabled={history.isActionInProgress}>
            {history.isActionInProgress ? 'In progress...' : 'Action'}
        </button>
    );
};
```

### 4. Use Diffs for Granularity

```typescript
// ✅ Recommended - Granular diffs
const handleUpdateUser = (userId: string, changes: any) => {
    const diffs = Object.entries(changes).map(([key, value]) => ({
        type: 'UPDATE',
        path: ['users', userId, key],
        oldValue: currentUser[key],
        newValue: value,
        metadata: {
            allowIndexShift: false,
            modifiedRelated: false,
        }
    }));
    
    const result = history.createSimpleAction('UPDATE_USER', diffs);
};

// ❌ Avoid - Action too broad
const handleUpdateUser = (userId: string, changes: any) => {
    const result = history.createSimpleAction('UPDATE_USER');
    // No granularity
};
```

### 5. Optimize Performance

```typescript
// ✅ Good practice - Batched actions
const handleBulkUpdate = (updates: Array<{id: string, changes: any}>) => {
    const actionId = `BULK_UPDATE_${Date.now()}`;
    history.startAction(actionId);
    
    // Apply all modifications
    updates.forEach(update => {
        // Apply changes
    });
    
    // Submit a single action
    history.submitAction('BULK_UPDATE', [], false, ['users']);
};

// ❌ Avoid - Multiple actions
const handleBulkUpdate = (updates: Array<{id: string, changes: any}>) => {
    updates.forEach(update => {
        history.createSimpleAction('UPDATE_USER'); // Too many actions
    });
};
```

## Conclusion

The new enhanced history system offers superior robustness and flexibility compared to the legacy system. By following these examples and best practices, you can make the most of its features while maintaining clean and maintainable code.

For more information, consult:
- [UPGRADE_UNDO_REDO_PLAN.md](../UPGRADE_UNDO_REDO_PLAN.md)
- [HistoryDemo.tsx](../demo/shared/components/HistoryDemo/HistoryDemo.tsx)
- [useHistory.ts](../src/hooks/useHistory.ts)
