# Guide: Creating and Using Custom Areas

This guide explains how to create your own area types and use them in your application with the Karmyc Core system.

## Prerequisites

- Install the `@gamesberry/karmyc-core` package in your project
- Configure the `KarmycProvider` in your application

## 1. Define a Component for Your Custom Area

Start by creating a React component that will represent your area. This component should accept the following properties:

```tsx
interface AreaComponentProps<T = any> {
    id: string;        // Unique identifier for the area
    state: T;          // State specific to the area type
    width?: number;    // Area width (optional)
    height?: number;   // Area height (optional)
    isActive?: boolean; // Indicates if the area is active (optional)
}

// Example of a custom component
const MyCustomArea: React.FC<AreaComponentProps<{ content: string }>> = ({ 
    id, 
    state, 
    width = 300, 
    height = 200,
    isActive = false
}) => {
    return (
        <div 
            style={{ 
                width, 
                height, 
                background: isActive ? '#e6f7ff' : '#f0f0f0',
                border: isActive ? '2px solid #1890ff' : '1px solid #d9d9d9',
                borderRadius: '4px',
                padding: '8px',
                overflow: 'auto'
            }}
        >
            <h3>Custom Area</h3>
            <p>{state.content}</p>
        </div>
    );
};
```

## 2. Register Your Area Type

Use the `useRegisterAreaType` hook to register your component as an area type. This hook should be called at a high level in your application, typically in a component that is a direct child of the `KarmycProvider`.

```tsx
import { useRegisterAreaType } from '@gamesberry/karmyc-core';

const Setup = () => {
    // Register a custom area type
    useRegisterAreaType(
        'custom-area',                   // Area type identifier
        MyCustomArea,                    // React component for the area
        { content: 'Initial content' },  // Initial state
        {
            displayName: 'Custom Area',           // Display name in the UI
            icon: CustomIcon,                     // Optional icon
            defaultSize: { width: 400, height: 300 }, // Default size
            supportedActions: ['edit', 'delete']      // Supported actions
        }
    );
    
    return null;
};

// In your application
const App = () => {
    return (
        <KarmycProvider>
            <Setup />
            <YourApplication />
        </KarmycProvider>
    );
};
```

## 3. Create Instances of Your Area

Use the `useArea` hook to create instances of your custom area:

```tsx
import { useArea } from '@gamesberry/karmyc-core';

const AreaCreator = () => {
    const { createArea } = useArea();
    
    const handleCreateArea = () => {
        createArea(
            'custom-area',                      // Area type
            { content: 'New area created' },    // Initial specific state
            { x: 100, y: 100 }                  // Initial position (optional)
        );
    };
    
    return (
        <button onClick={handleCreateArea}>
            Create Custom Area
        </button>
    );
};
```

## 4. Manage Your Area State

You can update the state of your areas at any time using the functions provided by the `useArea` hook:

```tsx
const AreaManager = () => {
    const { areas, updateAreaState, deleteArea, setActive } = useArea();
    
    // Update an area's state
    const updateContent = (areaId, newContent) => {
        updateAreaState(areaId, { content: newContent });
    };
    
    return (
        <div>
            {areas.map(area => (
                <div key={area.id}>
                    <button onClick={() => setActive(area.id)}>
                        Activate
                    </button>
                    <button onClick={() => updateContent(area.id, 'Updated content')}>
                        Update
                    </button>
                    <button onClick={() => deleteArea(area.id)}>
                        Delete
                    </button>
                </div>
            ))}
        </div>
    );
};
```

## 5. Add Keyboard Shortcuts to Your Area

You can add keyboard shortcuts specific to your area type using the `useAreaKeyboardShortcuts` hook:

```tsx
import { useAreaKeyboardShortcuts } from '@gamesberry/karmyc-core';

const KeyboardShortcutsSetup = () => {
    useAreaKeyboardShortcuts('custom-area', [
        {
            key: 'Delete',
            name: 'Delete area',
            fn: (areaId) => {
                // Logic to delete the area
            }
        },
        {
            key: 'S',
            modifierKeys: ['Control'],
            name: 'Save content',
            fn: (areaId, params) => {
                // Logic to save
            },
            history: true // Will add this action to history (undo/redo)
        }
    ]);
    
    return null;
};
```

## 6. Initialize Your Application with Predefined Areas

You can initialize your application with predefined areas using the `initialAreas` option of the `KarmycProvider`:

```tsx
const App = () => {
    return (
        <KarmycProvider 
            options={{
                initialAreas: [
                    {
                        type: 'custom-area',
                        state: { content: 'Predefined area 1' },
                        position: { x: 50, y: 50 }
                    },
                    {
                        type: 'custom-area',
                        state: { content: 'Predefined area 2' },
                        position: { x: 400, y: 50 }
                    }
                ],
                enableLogging: true
            }}
        >
            <Setup />
            <YourApplication />
        </KarmycProvider>
    );
};
```

## 7. Handling Area Interactions

Your custom area can handle various interactions like mouse events, keyboard events, and more. Here's an example with a more interactive component:

```tsx
const EditableArea: React.FC<AreaComponentProps<{ content: string }>> = ({ 
    id, 
    state, 
    width = 300, 
    height = 200,
    isActive = false
}) => {
    const { updateAreaState } = useArea();
    const [editing, setEditing] = useState(false);
    const [content, setContent] = useState(state.content);
    
    const handleSave = () => {
        updateAreaState(id, { content });
        setEditing(false);
    };
    
    return (
        <div 
            style={{ 
                width, 
                height, 
                background: isActive ? '#e6f7ff' : '#f0f0f0',
                border: isActive ? '2px solid #1890ff' : '1px solid #d9d9d9',
                borderRadius: '4px',
                padding: '8px',
                overflow: 'auto'
            }}
        >
            <h3>Editable Area</h3>
            
            {editing ? (
                <>
                    <textarea 
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        style={{ width: '100%', minHeight: '100px' }}
                    />
                    <button onClick={handleSave}>Save</button>
                    <button onClick={() => setEditing(false)}>Cancel</button>
                </>
            ) : (
                <>
                    <p>{state.content}</p>
                    <button onClick={() => setEditing(true)}>Edit</button>
                </>
            )}
        </div>
    );
};
```

## 8. Best Practices

When working with custom areas in Karmyc Core, follow these best practices:

1. **State Management**:
   - Keep state minimal and focused
   - Use immutable patterns for state updates
   - Separate UI state from content state

2. **Performance**:
   - Memoize event handlers with `useCallback`
   - Optimize rendering with `React.memo`
   - Use `useMemo` for expensive computations

3. **User Experience**:
   - Provide clear visual feedback for interactions
   - Implement consistent keyboard shortcuts
   - Support accessibility features

4. **Error Handling**:
   - Implement error boundaries for areas
   - Validate state before updates
   - Provide fallback content for error states

By following this guide, you can create custom areas that integrate seamlessly with the Karmyc Core system, allowing you to build rich, interactive layouts for your applications. 
