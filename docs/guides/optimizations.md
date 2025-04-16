# Optimizations and Error Handling

## Memoized Selectors

### Overview

Memoized selectors are used to optimize performance by avoiding unnecessary calculations. They are only recalculated when their dependencies change.

### Types of Selectors

1. **Basic Selectors**
   ```typescript
   const selectState = (state: RootState) => state.state;
   const selectDiff = (state: RootState) => state.diff;
   const selectToolbar = (state: RootState) => state.toolbar;
   ```

2. **State Selectors**
   ```typescript
   export const selectStates = createSelector(
     selectState,
     (state) => state.states
   );

   export const selectStateById = createSelector(
     [selectStates, (_, id: string) => id],
     (states, id) => states[id]
   );
   ```

3. **Diff Selectors**
   ```typescript
   export const selectDiffs = createSelector(
     selectDiff,
     (diff) => diff.diffs
   );

   export const selectActiveDiff = createSelector(
     selectDiff,
     (diff) => diff.diffs.find(d => d.id === diff.activeDiffId)
   );
   ```

4. **Composite Selectors**
   ```typescript
   export const selectStateWithDiffs = createSelector(
     [selectStateById, selectDiffs],
     (state, diffs) => ({
       ...state,
       diffs: diffs.filter(d => d.target === state.id)
     })
   );
   ```

### Best Practices

1. **Composition**
   - Use basic selectors for simple data
   - Compose complex selectors from basic selectors
   - Avoid redundant calculations

2. **Performance**
   - Minimize the number of dependencies
   - Avoid complex data transformations
   - Use specific selectors rather than generic ones

3. **Maintenance**
   - Name selectors descriptively
   - Document dependencies
   - Test selectors individually

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
function StateViewer({ id }: { id: string }) {
  const state = useSelector(selectStateById(id));
  const validation = useSelector(selectStateValidation(id));
  const metrics = useSelector(selectStateMetrics(id));

  if (!state) return <div>State not found</div>;

  return (
    <div>
      <h2>{state.type}</h2>
      {!validation.isValid && (
        <div className="errors">
          {validation.errors.map(error => (
            <div key={error}>{error}</div>
          ))}
        </div>
      )}
      <div className="metrics">
        <div>Age: {metrics.age}ms</div>
        <div>Updates: {metrics.updateCount}</div>
      </div>
    </div>
  );
}
```

### Error Handling in a Component

```typescript
function StateTransition({ id, transition }: { id: string; transition: string }) {
  const dispatch = useAppDispatch();
  const errorHandler = ErrorHandler.getInstance();

  useEffect(() => {
    const unsubscribe = errorHandler.addListener(error => {
      if (error.type === ErrorType.TRANSITION) {
        // Show notification
        showNotification(error.message, 'error');
      }
    });

    return unsubscribe;
  }, []);

  const handleTransition = () => {
    try {
      dispatch(transitionState({ id, transition }));
    } catch (error) {
      // Error will be handled by middleware
    }
  };

  return <button onClick={handleTransition}>Transition</button>;
}
```

## Performance and Monitoring

### Performance Metrics

1. **Selectors**
   - Execution time
   - Number of recalculations
   - Result size

2. **Errors**
   - Error rate by type
   - Resolution time
   - Interface impact

### Monitoring Tools

1. **Redux DevTools**
   - Action tracking
   - State inspection
   - Selector profiling

2. **Logging**
   - System errors
   - Selector performance
   - Memory usage 
