# React Integration

## Using Selectors

### Custom Hooks

```typescript
// hooks/useState.ts
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  selectStateById,
  selectStateValidation,
  selectStateMetrics
} from '../store/selectors';

export function useState(id: string) {
  const state = useSelector((state: RootState) => selectStateById(state, id));
  const validation = useSelector((state: RootState) => 
    selectStateValidation(state, id)
  );
  const metrics = useSelector((state: RootState) => 
    selectStateMetrics(state, id)
  );

  return {
    state,
    validation,
    metrics,
    isLoading: !state,
    hasErrors: !validation.isValid
  };
}

// hooks/useDiffs.ts
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  selectDiffs,
  selectActiveDiff,
  selectDiffById
} from '../store/selectors';

export function useDiffs(stateId: string) {
  const diffs = useSelector((state: RootState) => 
    selectDiffs(state)
  );
  const activeDiff = useSelector((state: RootState) => 
    selectActiveDiff(state)
  );
  const stateDiffs = useSelector((state: RootState) => 
    selectStateWithDiffs(state, stateId)
  );

  return {
    diffs,
    activeDiff,
    stateDiffs
  };
}
```

### Components with Selectors

```typescript
// components/StateViewer.tsx
import React from 'react';
import { useState } from '../hooks/useState';

interface StateViewerProps {
  id: string;
}

export function StateViewer({ id }: StateViewerProps) {
  const { state, validation, metrics, isLoading, hasErrors } = useState(id);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="state-viewer">
      <h2>{state.type}</h2>
      
      {hasErrors && (
        <div className="errors">
          {validation.errors.map(error => (
            <div key={error} className="error">
              {error}
            </div>
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

// components/DiffViewer.tsx
import React from 'react';
import { useDiffs } from '../hooks/useDiffs';

interface DiffViewerProps {
  stateId: string;
}

export function DiffViewer({ stateId }: DiffViewerProps) {
  const { diffs, activeDiff, stateDiffs } = useDiffs(stateId);

  return (
    <div className="diff-viewer">
      <h3>Active Diff</h3>
      {activeDiff && (
        <div className="active-diff">
          {activeDiff.changes.map(change => (
            <div key={change.path.join('.')} className="change">
              {change.type}: {change.path.join('.')}
            </div>
          ))}
        </div>
      )}

      <h3>Diff History</h3>
      <div className="diff-history">
        {diffs.map(diff => (
          <div key={diff.id} className="diff-item">
            {diff.timestamp}: {diff.changes.length} changes
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Error Handling

### Custom Error Hook

```typescript
// hooks/useErrors.ts
import { useEffect } from 'react';
import { ErrorHandler, ErrorType } from '../store/errorHandling';

export function useErrors() {
  const errorHandler = ErrorHandler.getInstance();

  useEffect(() => {
    const handleError = (error: any) => {
      // Log the error
      console.error(error);
      
      // Show a notification
      if (error.type === ErrorType.VALIDATION) {
        showNotification(error.message, 'warning');
      } else if (error.type === ErrorType.SYSTEM) {
        showNotification(error.message, 'error');
      }
    };

    const unsubscribe = errorHandler.addListener(handleError);

    return () => {
      unsubscribe();
    };
  }, []);
}
```

### Components with Error Handling

```typescript
// components/StateTransition.tsx
import React from 'react';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { transitionState } from '../store/slices/stateSlice';
import { errorUtils } from '../store/errorHandling';

interface StateTransitionProps {
  id: string;
  transition: string;
}

export function StateTransition({ id, transition }: StateTransitionProps) {
  const dispatch = useAppDispatch();

  const handleTransition = async () => {
    try {
      await dispatch(transitionState({ id, transition }));
    } catch (error) {
      // The error will be handled by the middleware
      // But we can add local handling if needed
      errorUtils.createTransitionError(
        'Transition failed',
        { type: transition },
        { id, transition }
      );
    }
  };

  return (
    <button onClick={handleTransition}>
      Transition to {transition}
    </button>
  );
}

// components/ErrorBoundary.tsx
import React from 'react';
import { ErrorHandler, errorUtils } from '../store/errorHandling';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorHandler = ErrorHandler.getInstance();
    
    errorHandler.addError(
      errorUtils.createSystemError(
        'Error in component',
        {
          component: errorInfo.componentStack,
          error: error.message,
          stack: error.stack
        }
      )
    );
  }

  render() {
    if (this.state.hasError) {
      return <div className="error-fallback">Something went wrong</div>;
    }

    return this.props.children;
  }
}
```

## Error Middleware

```typescript
// store/middleware/errorMiddleware.ts
import { AnyAction, Middleware } from 'redux';
import { ErrorHandler, errorUtils } from '../errorHandling';

export const errorMiddleware: Middleware = ({ dispatch, getState }) => (next) => (action: AnyAction) => {
  try {
    return next(action);
  } catch (error) {
    const errorHandler = ErrorHandler.getInstance();
    
    // Create a system error and add it to the handler
    const systemError = errorUtils.createSystemError(
      'Error during action dispatch',
      {
        action: action.type,
        payload: action.payload,
        error: error.message,
        stack: error.stack
      }
    );
    
    errorHandler.addError(systemError);
    
    // Log the error
    console.error('Action error:', error);
    
    // Re-throw the error so it can be caught by components
    throw error;
  }
};
```

## Error Types

```typescript
// store/errorHandling/types.ts
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  TRANSITION = 'TRANSITION',
  DIFF = 'DIFF',
  SYSTEM = 'SYSTEM'
}

export interface IError {
  type: ErrorType;
  message: string;
  code: string;
  details?: Record<string, any>;
  timestamp: number;
  action?: AnyAction;
}
```

## Error Utils

```typescript
// store/errorHandling/utils.ts
import { AnyAction } from 'redux';
import { ErrorType, IError } from './types';

export const errorUtils = {
  createValidationError: (
    message: string,
    details?: Record<string, any>,
    action?: AnyAction
  ): IError => ({
    type: ErrorType.VALIDATION,
    message,
    code: 'VALIDATION_ERROR',
    details,
    timestamp: Date.now(),
    action
  }),
  
  createTransitionError: (
    message: string,
    details?: Record<string, any>,
    action?: AnyAction
  ): IError => ({
    type: ErrorType.TRANSITION,
    message,
    code: 'TRANSITION_ERROR',
    details,
    timestamp: Date.now(),
    action
  }),
  
  createSystemError: (
    message: string,
    details?: Record<string, any>,
    action?: AnyAction
  ): IError => ({
    type: ErrorType.SYSTEM,
    message,
    code: 'SYSTEM_ERROR',
    details,
    timestamp: Date.now(),
    action
  })
};
```

## Central Error Handler

```typescript
// store/errorHandling/ErrorHandler.ts
import { IError } from './types';

type ErrorListener = (error: IError) => void;

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errors: IError[] = [];
  private listeners: ErrorListener[] = [];
  
  private constructor() {}
  
  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }
  
  addError(error: IError): void {
    this.errors.push(error);
    this.notifyListeners(error);
  }
  
  getErrors(): IError[] {
    return [...this.errors];
  }
  
  getRecentErrors(count: number): IError[] {
    return this.errors.slice(-count);
  }
  
  clearErrors(): void {
    this.errors = [];
  }
  
  addListener(listener: ErrorListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  private notifyListeners(error: IError): void {
    this.listeners.forEach(listener => {
      try {
        listener(error);
      } catch (e) {
        console.error('Error in error listener:', e);
      }
    });
  }
}
```

## Usage Examples

```tsx
// App.tsx
import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useErrors } from './hooks/useErrors';
import MainComponent from './components/MainComponent';

// Hook to set up global error handling
function ErrorHandler() {
  useErrors();
  return null;
}

function App() {
  return (
    <Provider store={store}>
      <ErrorBoundary>
        <ErrorHandler />
        <MainComponent />
      </ErrorBoundary>
    </Provider>
  );
}

export default App;
```

## Best Practices

1. **Use Custom Hooks**
   - Create reusable hooks for common data access patterns
   - Keep component code clean by moving selector logic to hooks
   - Combine multiple selectors in a single hook for related data

2. **Error Handling**
   - Use a central error handler for consistency
   - Categorize errors by type
   - Provide detailed error information for debugging
   - Create appropriate UI feedback based on error type

3. **Performance**
   - Use memoized selectors with createSelector
   - Minimize the use of useSelector with inline selectors
   - Split complex components into smaller ones with focused selectors

4. **Testing**
   - Test custom hooks with renderHook
   - Mock the Redux store for component tests
   - Test error handling separately from normal operation 
