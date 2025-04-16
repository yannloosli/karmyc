# Guide: Working with Drag and Drop

This guide explains how to implement and use the drag and drop system in your application with Karmyc Core.

## Prerequisites

- Install the `@gamesberry/karmyc-core` package in your project
- Configure the `KarmycProvider` in your application

## 1. Basic Drag and Drop Concepts

Karmyc Core's drag and drop system allows users to:

- Move elements between different areas
- Reorganize elements within an area
- Create new elements by drag and drop
- Trigger contextual actions

Here are the main components:

```tsx
import { 
  useDrag, 
  useDrop, 
  DraggableItem, 
  DropTarget 
} from '@gamesberry/karmyc-core';
```

## 2. Making an Element Draggable

To make an element draggable, use the `useDrag` hook:

```tsx
import { useDrag } from '@gamesberry/karmyc-core';

const DraggableComponent = ({ id, type, data }) => {
  const { dragRef, isDragging, dragHandleRef } = useDrag({
    id,              // Unique identifier for the element
    type,            // Element type (used for drop rules)
    data,            // Data associated with the element
    preview: <CustomDragPreview />,  // Custom component for preview
    onDragStart: () => console.log('Drag started'),
    onDragEnd: (result) => console.log('Drag ended', result)
  });

  return (
    <div 
      ref={dragRef}           // Attach drag reference to the element
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move'
      }}
    >
      {/* The entire content is draggable */}
      <h3>Draggable Element</h3>
      <p>Element content...</p>
      
      {/* Or use a specific drag handle */}
      <div ref={dragHandleRef}>
        ⋮⋮ {/* Handle icon */}
      </div>
    </div>
  );
};
```

## 3. Creating a Drop Zone

To create an area where elements can be dropped:

```tsx
import { useDrop } from '@gamesberry/karmyc-core';

const DropZone = ({ onItemDropped }) => {
  const { dropRef, isOver, canDrop } = useDrop({
    accept: ['item-type-1', 'item-type-2'],  // Accepted element types
    drop: (item, monitor) => {
      console.log('Item dropped:', item);
      onItemDropped(item);
      return { success: true };  // Optional return to drag source
    },
    hover: (item, monitor) => {
      // Logic for hover state
    },
    canDrop: (item, monitor) => {
      // Validation logic for drop
      return true; // or false
    }
  });

  // Style the zone based on state
  const style = {
    backgroundColor: isOver ? (canDrop ? '#e6f7ff' : '#fff1f0') : '#ffffff',
    border: '1px dashed #d9d9d9',
    borderColor: isOver ? (canDrop ? '#1890ff' : '#ff4d4f') : '#d9d9d9',
    padding: '20px',
    minHeight: '100px',
    transition: 'all 0.3s'
  };

  return (
    <div ref={dropRef} style={style}>
      {isOver && canDrop ? 'Drop here' : 'Drop Zone'}
    </div>
  );
};
```

## 4. Drag and Drop Between Zones

To implement a system where elements can be moved between different zones:

```tsx
import React, { useState } from 'react';
import { DragDropProvider, DraggableItem, DropZone } from '@gamesberry/karmyc-core';

const DragDropExample = () => {
  const [zone1Items, setZone1Items] = useState([
    { id: '1', content: 'Item 1' },
    { id: '2', content: 'Item 2' }
  ]);
  
  const [zone2Items, setZone2Items] = useState([
    { id: '3', content: 'Item 3' }
  ]);
  
  const handleMoveItem = (itemId, sourceZone, targetZone) => {
    // Logic to move an item from one zone to another
    if (sourceZone === 'zone1' && targetZone === 'zone2') {
      const item = zone1Items.find(item => item.id === itemId);
      setZone1Items(zone1Items.filter(item => item.id !== itemId));
      setZone2Items([...zone2Items, item]);
    } else if (sourceZone === 'zone2' && targetZone === 'zone1') {
      const item = zone2Items.find(item => item.id === itemId);
      setZone2Items(zone2Items.filter(item => item.id !== itemId));
      setZone1Items([...zone1Items, item]);
    }
  };
  
  return (
    <DragDropProvider>
      <div style={{ display: 'flex', gap: '20px' }}>
        <DropZone
          id="zone1"
          onDrop={(item) => handleMoveItem(item.id, item.sourceZone, 'zone1')}
        >
          {zone1Items.map(item => (
            <DraggableItem
              key={item.id}
              id={item.id}
              data={{ ...item, sourceZone: 'zone1' }}
              type="item"
            >
              <div className="item">{item.content}</div>
            </DraggableItem>
          ))}
        </DropZone>
        
        <DropZone
          id="zone2"
          onDrop={(item) => handleMoveItem(item.id, item.sourceZone, 'zone2')}
        >
          {zone2Items.map(item => (
            <DraggableItem
              key={item.id}
              id={item.id}
              data={{ ...item, sourceZone: 'zone2' }}
              type="item"
            >
              <div className="item">{item.content}</div>
            </DraggableItem>
          ))}
        </DropZone>
      </div>
    </DragDropProvider>
  );
};
```

## 5. Sortable Lists with Drag and Drop

To reorganize elements in a list:

```tsx
import { useDragList } from '@gamesberry/karmyc-core';

const SortableList = ({ items, onOrderChange }) => {
  const { listRef, itemRefs } = useDragList({
    items,
    keyExtractor: item => item.id,
    onReorder: (newItems) => {
      console.log('New order:', newItems);
      onOrderChange(newItems);
    }
  });

  return (
    <ul ref={listRef}>
      {items.map((item, index) => (
        <li 
          key={item.id}
          ref={el => itemRefs.current[index] = el}
          className="sortable-item"
        >
          {item.content}
        </li>
      ))}
    </ul>
  );
};
```

## 6. Custom Drag Preview

To create a custom preview during drag:

```tsx
import { useDrag, DragPreview } from '@gamesberry/karmyc-core';

const DraggableWithCustomPreview = ({ id, data }) => {
  const { dragRef, isDragging } = useDrag({
    id,
    type: 'custom-item',
    data,
    previewOptions: {
      // Custom preview options
      component: ({ item }) => (
        <div className="custom-drag-preview">
          <div className="preview-header">{item.title}</div>
          <div className="preview-content">{item.description}</div>
        </div>
      ),
      // or use a separately defined component
      // component: CustomDragPreviewComponent,
      
      // Preview options
      scale: 0.8,  // Preview scale
      opacity: 0.7 // Preview opacity
    }
  });

  return (
    <div ref={dragRef} className={isDragging ? 'dragging' : ''}>
      <h4>{data.title}</h4>
      <p>{data.description}</p>
    </div>
  );
};
```

## 7. Integration with Karmyc Core Areas

Integrate drag and drop with Karmyc Core's area system:

```tsx
import { useArea, useDrag, useDrop } from '@gamesberry/karmyc-core';

const AreaDragDropIntegration = () => {
  const { areas, createArea, moveArea } = useArea();
  
  const handleDropOnCanvas = (item, position) => {
    if (item.type === 'area-template') {
      // Create a new area based on the dropped template
      createArea({
        type: item.areaType,
        position: {
          x: position.x,
          y: position.y
        },
        data: item.defaultData || {}
      });
    } else if (item.type === 'existing-area') {
      // Move an existing area
      moveArea(item.areaId, {
        x: position.x,
        y: position.y
      });
    }
  };

  return (
    <div className="karmyc-workspace">
      <AreaTemplatePanel /> {/* Panel with area templates */}
      
      <DropCanvas 
        onDrop={handleDropOnCanvas}
        accept={['area-template', 'existing-area']}
      >
        {/* Existing areas rendered here */}
        {areas.map(area => (
          <DraggableArea 
            key={area.id} 
            area={area} 
          />
        ))}
      </DropCanvas>
    </div>
  );
};

// Component for a draggable area
const DraggableArea = ({ area }) => {
  const { dragRef, isDragging } = useDrag({
    id: area.id,
    type: 'existing-area',
    data: { areaId: area.id, type: area.type }
  });
  
  // Use the useArea hook for area management
  const { renderArea } = useArea();
  
  return (
    <div 
      ref={dragRef}
      style={{
        position: 'absolute',
        left: area.position.x,
        top: area.position.y,
        opacity: isDragging ? 0.5 : 1
      }}
    >
      {renderArea(area.id)}
    </div>
  );
};
```

## 8. Event Handling and Feedback

To handle events and provide visual feedback:

```tsx
import { useDragDropEvents } from '@gamesberry/karmyc-core';

const DragDropEventHandler = () => {
  useDragDropEvents({
    onDragStart: (item, type) => {
      console.log(`Drag started: ${type}`, item);
      // Update UI or global state
    },
    onDragEnd: (item, result) => {
      console.log('Drag ended:', result);
      // Logic after drop
      if (result.dropped) {
        // Show success notification
      } else {
        // Handle drag cancellation
      }
    },
    onDropSuccess: (item, dropResult, dropTarget) => {
      console.log(`Successfully dropped on ${dropTarget.id}`, dropResult);
      // Specific success logic
    },
    onDropFailure: (item, reason) => {
      console.error('Drop failed:', reason);
      // Display error message
    }
  });
  
  return null; // This component doesn't render anything
};
```

## 9. Best Practices

When using the drag and drop system in Karmyc Core, follow these best practices:

1. **Performance**:
   - Avoid rendering the entire hierarchy during dragging
   - Use memoization for draggable components
   - Optimize drag previews to be lightweight

2. **User Experience**:
   - Provide clear visual feedback on valid drop zones
   - Use animations for drag start/end
   - Add visual cues to indicate where the element will be dropped

3. **Accessibility**:
   - Also implement keyboard controls for drag actions
   - Use appropriate ARIA attributes
   - Ensure actions can be accomplished without drag and drop

4. **Architecture**:
   - Separate drag and drop logic from business logic
   - Use consistent identifiers for elements and zones
   - Properly handle errors and invalid states

By following this guide, you can implement a robust and intuitive drag and drop system in your Karmyc Core application, enhancing user experience and interactivity. 
