# Guide: Working with Context Menus

This guide explains how to create and use context menus in your application with the Karmyc Core system.

## Prerequisites

- Install the `@gamesberry/karmyc-core` package in your project
- Configure the `KarmycProvider` in your application

## 1. Basic Context Menu Usage

The `useContextMenu` hook provides a simple way to create and manage context menus in your application.

```tsx
import { useContextMenu } from '@gamesberry/karmyc-core';

const MyComponent = () => {
    const { openContextMenu, closeContextMenu } = useContextMenu();
    
    const handleRightClick = (e) => {
        // Prevent the default browser context menu
        e.preventDefault();
        
        // Open a context menu at the mouse position
        openContextMenu('my-menu', [
            {
                label: 'Option 1',
                icon: <Icon1 />,
                onClick: () => {
                    console.log('Option 1 clicked');
                    // The menu automatically closes after an option is clicked
                }
            },
            {
                label: 'Option 2',
                icon: <Icon2 />,
                onClick: () => console.log('Option 2 clicked')
            },
            { type: 'separator' },
            {
                label: 'Option 3',
                icon: <Icon3 />,
                disabled: true,
                onClick: () => console.log('Option 3 clicked')
            }
        ], { x: e.clientX, y: e.clientY });
    };
    
    return (
        <div onContextMenu={handleRightClick} style={{ width: '100%', height: '200px', background: '#f0f0f0' }}>
            Right-click me to open the context menu
        </div>
    );
};
```

## 2. Context Menu Options

Context menu options can have the following properties:

```tsx
interface ContextMenuOption {
    label: string;              // Display text for the option
    icon?: React.ReactNode;     // Optional icon
    onClick?: () => void;       // Click handler
    disabled?: boolean;         // Whether the option is disabled
    type?: 'normal' | 'separator'; // Type of menu item
    submenu?: ContextMenuOption[]; // Nested submenu items
    shortcut?: string;          // Keyboard shortcut display text
    className?: string;         // Additional CSS class
}
```

## 3. Custom Context Menu Styling

You can customize the appearance of context menus by providing custom CSS or by using a theme:

```tsx
// In your CSS file
.karmyc-context-menu {
    background-color: #2c2c2c;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.karmyc-context-menu-item {
    color: #f0f0f0;
    padding: 8px 16px;
}

.karmyc-context-menu-item:hover {
    background-color: #3c3c3c;
}

.karmyc-context-menu-item.disabled {
    color: #888;
}

// When initializing your app
const App = () => {
    return (
        <KarmycProvider
            options={{
                theme: 'dark',  // Use a built-in theme
                contextMenu: {
                    className: 'my-custom-context-menu', // Add a custom class
                    animation: 'fade'  // Use a specific animation
                }
            }}
        >
            <YourApplication />
        </KarmycProvider>
    );
};
```

## 4. Area-Specific Context Menus

You can register context menu actions for specific area types using the `useRegisterContextMenuAction` hook:

```tsx
import { useRegisterContextMenuAction } from '@gamesberry/karmyc-core';

const ContextMenuSetup = () => {
    useRegisterContextMenuAction('custom-area', [
        {
            id: 'edit-action',
            label: 'Edit Content',
            icon: <EditIcon />,
            handler: (areaId, event) => {
                console.log(`Edit action for area ${areaId}`);
                // Implement your edit logic here
            }
        },
        {
            id: 'delete-action',
            label: 'Delete Area',
            icon: <DeleteIcon />,
            handler: (areaId, event) => {
                console.log(`Delete action for area ${areaId}`);
                // Implement your delete logic here
            },
            confirmationRequired: true,
            confirmationMessage: 'Are you sure you want to delete this area?'
        }
    ]);
    
    return null;
};
```

## 5. Dynamic Context Menu Content

You can create context menus with content that changes based on the current state:

```tsx
const DynamicContextMenu = () => {
    const { openContextMenu } = useContextMenu();
    const [selection, setSelection] = useState([]);
    
    const handleRightClick = (e, item) => {
        e.preventDefault();
        
        // Create menu options based on current state
        const options = [
            {
                label: `Selected items: ${selection.length}`,
                disabled: true
            }
        ];
        
        if (selection.length > 0) {
            options.push({
                label: 'Clear selection',
                onClick: () => setSelection([])
            });
        }
        
        if (!selection.includes(item.id)) {
            options.push({
                label: 'Add to selection',
                onClick: () => setSelection([...selection, item.id])
            });
        } else {
            options.push({
                label: 'Remove from selection',
                onClick: () => setSelection(selection.filter(id => id !== item.id))
            });
        }
        
        openContextMenu('dynamic-menu', options, { x: e.clientX, y: e.clientY });
    };
    
    // Render your component...
};
```

## 6. Custom Context Menu Components

You can create completely custom context menu components for more complex interactions:

```tsx
import { useContextMenu } from '@gamesberry/karmyc-core';

const CustomMenuComponent = ({ close, data }) => {
    return (
        <div className="custom-menu">
            <h3>{data.title}</h3>
            <input type="text" placeholder="Enter value..." />
            <div className="buttons">
                <button onClick={() => close()}>Cancel</button>
                <button onClick={() => {
                    // Process the data
                    console.log('Submitting data:', data);
                    close();
                }}>Submit</button>
            </div>
        </div>
    );
};

const ComponentWithCustomMenu = () => {
    const { openCustomContextMenu } = useContextMenu();
    
    const handleRightClick = (e) => {
        e.preventDefault();
        
        openCustomContextMenu({
            component: CustomMenuComponent,
            props: {
                data: {
                    title: 'Custom Menu',
                    id: 'custom-1'
                }
            },
            position: { x: e.clientX, y: e.clientY },
            // Alignment options
            alignPosition: 'center'
        });
    };
    
    return (
        <div onContextMenu={handleRightClick}>
            Right-click for custom menu
        </div>
    );
};
```

## 7. Context Menu Events

You can listen to context menu events to perform additional actions:

```tsx
import { useContextMenuEvents } from '@gamesberry/karmyc-core';

const ContextMenuListener = () => {
    useContextMenuEvents({
        onOpen: (menuId, position) => {
            console.log(`Menu ${menuId} opened at`, position);
        },
        onClose: (menuId) => {
            console.log(`Menu ${menuId} closed`);
        },
        onOptionSelect: (menuId, optionId) => {
            console.log(`Option ${optionId} selected from menu ${menuId}`);
        }
    });
    
    return null;
};
```

## 8. Best Practices

When working with context menus in Karmyc Core, follow these best practices:

1. **Accessibility**:
   - Ensure context menus can be navigated with keyboard
   - Provide ARIA labels for menu items
   - Support screen readers

2. **User Experience**:
   - Keep menus simple and focused
   - Group related items
   - Use icons for visual cues
   - Provide keyboard shortcuts where appropriate

3. **Performance**:
   - Avoid complex calculations when opening menus
   - Memoize menu options when possible
   - Use context-specific menus instead of one large menu

4. **Predictability**:
   - Maintain consistent placement and behavior
   - Provide visual feedback for interactions
   - Avoid unexpected menu closures

By following this guide, you can create intuitive and powerful context menus that enhance the user experience of your Karmyc Core application. 
