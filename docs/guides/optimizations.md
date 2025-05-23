# Optimizations and Error Handling

## State Selection and Optimization (Zustand)

### Overview

Zustand provides a flexible way to select state slices within your components. Performance is generally good out-of-the-box, but understanding how selection works helps optimize further.

### Selecting State

Components subscribe to store changes using selectors passed directly to the store hook:

   ```typescript
import { useAreaStore } from '@gamesberry/karmyc-core'; // Adjust path

// Select a single primitive value (re-renders only if this value changes)
const activeAreaId = useAreaStore(state => state.activeAreaId);

// Select an object (might cause re-renders if the object reference changes, even if contents are same)
const activeArea = useAreaStore(state => state.areas[state.activeAreaId]);

// Select multiple values (better to use multiple selectors)
const { areas, layout } = useAreaStore(state => ({ areas: state.areas, layout: state.layout })); // Less optimal

// Prefer multiple individual selectors for atomicity
const areas = useAreaStore(state => state.areas);
const layout = useAreaStore(state => state.layout);
   ```

### Optimization Strategies

1.  **Select Atomic State**: Subscribe only to the specific primitive fields your component needs. This is the most effective optimization.

   ```typescript
    // Good: Component only re-renders if activeAreaId changes.
    const activeAreaId = useAreaStore(state => state.activeAreaId);
    ```

2.  **Shallow Equality Check**: If you need to select multiple values or an object, use Zustand's `shallow` equality function to prevent re-renders if the top-level properties haven't changed.

   ```typescript
    import shallow from 'zustand/shallow';

    // Good: Re-renders only if `areas` or `layout` reference changes.
    const { areas, layout } = useAreaStore(
      state => ({ areas: state.areas, layout: state.layout }),
      shallow
   );
   ```

3.  **Memoizing Complex Selectors**: For selectors that perform expensive computations, use `useMemo` or external memoization libraries like `proxy-memoize` or `reselect` (though less common with Zustand's typical patterns).

   ```typescript
    import { useMemo } from 'react';
    import { useAreaStore } from '@gamesberry/karmyc-core';

    const selectVisibleAreas = (state) => {
      // Potentially expensive calculation
      return Object.values(state.areas).filter(area => area.isVisible);
    };

    function VisibleAreaList() {
      // useMemo recalculates only if state.areas changes
      const visibleAreas = useAreaStore(useMemo(() => selectVisibleAreas, []));
      // ... render list ...
    }
   ```

### Best Practices

1.  **Granularity**: Be as specific as possible in your selectors.
2.  **`shallow`**: Use `shallow` when selecting objects or multiple fields.
3.  **Memoization**: Apply memoization for computationally intensive selections.
4.  **Avoid Derivations in Component**: Perform complex state derivations within the store itself or using memoized selectors, not directly in the component body on every render.

## Error Handling

### Error Types

```typescript
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  TRANSITION = 'TRANSITION',
  DIFF = 'DIFF',
  TOOLBAR = 'TOOLBAR',
  SYSTEM = 'SYSTEM'
}
```

### Error Structure

```typescript
interface IError {
  type: ErrorType;
  message: string;
  code: string;
  details?: Record<string, any>;
  timestamp: number;
  action?: AnyAction;
}
```

### Usage

1. **Creating Errors**
   ```typescript
   // Validation error
   errorUtils.createValidationError(
     'Invalid data',
     { field: 'name', value: '' }
   );

   // Transition error
   errorUtils.createTransitionError(
     'Transition not possible',
     action,
     { from: 'draft', to: 'review' }
   );
   ```

2. **Error Management**
   ```typescript
   const errorHandler = ErrorHandler.getInstance();

   // Add a listener
   const unsubscribe = errorHandler.addListener(error => {
     console.error(error);
   });

   // Get recent errors
   const recentErrors = errorHandler.getRecentErrors(5);
   ```

3. **Error Middleware**
   ```typescript
   export const errorMiddleware = () => (next: any) => (action: AnyAction) => {
     try {
       return next(action);
     } catch (error) {
       const errorHandler = ErrorHandler.getInstance();
       // Handle error...
       throw error;
     }
   };
   ```

### Best Practices

1. **Error Creation**
   - Use descriptive error messages
   - Include relevant details
   - Associate errors with actions

2. **Management**
   - Centralize error handling
   - Implement listeners for logging
   - Clean up obsolete errors

3. **Recovery**
   - Provide debugging information
   - Enable error recovery
   - Maintain an error history

## Usage Examples

### Component with Selectors

```typescript
import { useAreaStore } from '@gamesberry/karmyc-core'; // Adjust path
import shallow from 'zustand/shallow';

function AreaViewer({ id }: { id: string }) {
  // Select only the needed data for this specific area
  const areaData = useAreaStore(state => ({
    type: state.areas[id]?.type,
    // Assuming validation and metrics are part of the area state now?
    // Or potentially fetched from another store using the ID.
    // This needs clarification based on the actual state structure.
    // Example: Assuming they are nested in the area state:
    validation: state.areas[id]?.validation,
    metrics: state.areas[id]?.metrics,
  }), shallow); // Use shallow compare for the selected object

  if (!areaData.type) return <div>Area not found</div>;

  return (
    <div>
      <h2>{areaData.type}</h2>
      {areaData.validation && !areaData.validation.isValid && (
        <div className="errors">
          {areaData.validation.errors.map(error => (
            <div key={error.code || error.message}>{error.message}</div> // Use unique key
          ))}
        </div>
      )}
      {areaData.metrics && (
      <div className="metrics">
          <div>Age: {areaData.metrics.age}ms</div>
          <div>Updates: {areaData.metrics.updateCount}</div>
      </div>
      )}
    </div>
  );
}
```

### Error Handling in a Component

```typescript
import { useSomeStoreWithTransitions } from '@gamesberry/karmyc-core'; // Adjust path to the relevant store
import { ErrorHandler, ErrorType } from '@gamesberry/karmyc-core'; // Adjust path
import { useEffect } from 'react';

// Assume `useSomeStoreWithTransitions` provides a `transitionState` action
// and manages its own errors, potentially reporting them via ErrorHandler.

function StateTransition({ id, transition }: { id: string; transition: string }) {
  const transitionAction = useSomeStoreWithTransitions(state => state.transitionState);
  const isLoading = useSomeStoreWithTransitions(state => state.isLoadingTransition); // Example loading state
  const transitionError = useSomeStoreWithTransitions(state => state.transitionError); // Example error state

  const errorHandler = ErrorHandler.getInstance(); // Can still be used for global handling

  useEffect(() => {
    // Listen to global errors if needed
    const unsubscribe = errorHandler.addListener(error => {
      if (error.type === ErrorType.TRANSITION && error.details?.stateId === id) {
        // Show UI feedback for errors related to this component's transition
        // Potentially redundant if the store handles UI feedback directly
        console.error(`Transition failed: ${error.message}`);
      }
    });
    return unsubscribe;
  }, [id]);

  // Alternatively, react directly to error state from the store:
  useEffect(() => {
    if (transitionError) {
      console.error(`Transition failed: ${transitionError.message}`);
      // Optionally clear the error state in the store
      // useSomeStoreWithTransitions.getState().clearTransitionError();
    }
  }, [transitionError]);

  const handleTransition = () => {
    // Actions now typically handle their own try/catch or report errors
    // No need for manual dispatch or try/catch here usually
    transitionAction(id, transition);
  };

  return (
    <button onClick={handleTransition} disabled={isLoading}>
      {isLoading ? 'Transitioning...' : `Transition to ${transition}`}
    </button>
  );
}
```

## Performance and Monitoring

### Performance Metrics

1. **State Updates**:
   - Frequency of state changes for specific stores/slices.
   - Impact of specific actions on state size.

2. **Component Renders**:
   - Identify components re-rendering unnecessarily using React DevTools Profiler.
   - Correlate re-renders with specific state changes.

3. **Errors**
   - Error rate by type
   - Resolution time
   - Interface impact

### Monitoring Tools

1. **Zustand DevTools (via Redux DevTools Extension)**:
   - Track actions and associated state changes.
   - Inspect the state of different Zustand stores.
   - Time travel debugging (if middleware like `temporal` is used).

2. **React DevTools Profiler**:
   - Analyze component render times and frequency.
   - Identify components affected by specific state updates.

3. **Logging**
   - System errors (using `ErrorHandler`).
   - Performance warnings or custom metrics.
   - Memory usage.

## Debugging Tools

### Browser DevTools

Standard browser developer tools (Console, Network, Performance tabs) are invaluable for debugging React and Zustand applications.

### React DevTools Extension

The [React DevTools](https://reactjs.org/blog/2019/08/15/new-react-devtools.html) browser extension is essential for inspecting component hierarchy, props, and state.

### Zustand DevTools (via Redux DevTools Extension)

Zustand stores can be integrated with the [Redux DevTools Extension](https://github.com/reduxjs/redux-devtools-extension) using the `devtools` middleware. This allows you to inspect state changes, time-travel debug (if applicable), and view dispatched actions (if the store uses named actions).

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface MyStoreState {
  count: number;
  increment: () => void;
}

export const useMyStore = create<MyStoreState>()(
  devtools( // Wrap with devtools
    immer((set) => ({
      count: 0,
      // Name the action for DevTools
      increment: () => set((state) => { state.count += 1; }, false, 'increment'),
    })),
    { name: "MyStore" } // Optional name for the store in DevTools
  )
);
```

Make sure the Redux DevTools Extension is installed in your browser. 
