# Intégration avec React

## Utilisation des Sélecteurs

### Hooks Personnalisés

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

### Composants avec Sélecteurs

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
    return <div>Chargement...</div>;
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
        <div>Âge: {metrics.age}ms</div>
        <div>Mises à jour: {metrics.updateCount}</div>
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
      <h3>Diff Active</h3>
      {activeDiff && (
        <div className="active-diff">
          {activeDiff.changes.map(change => (
            <div key={change.path.join('.')} className="change">
              {change.type}: {change.path.join('.')}
            </div>
          ))}
        </div>
      )}

      <h3>Historique des Diffs</h3>
      <div className="diff-history">
        {diffs.map(diff => (
          <div key={diff.id} className="diff-item">
            {diff.timestamp}: {diff.changes.length} changements
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Gestion des Erreurs

### Hook Personnalisé pour les Erreurs

```typescript
// hooks/useErrors.ts
import { useEffect } from 'react';
import { ErrorHandler, ErrorType } from '../store/errorHandling';

export function useErrors() {
  const errorHandler = ErrorHandler.getInstance();

  useEffect(() => {
    const handleError = (error: any) => {
      // Log l'erreur
      console.error(error);
      
      // Affiche une notification
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

### Composants avec Gestion d'Erreurs

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
      // L'erreur sera gérée par le middleware
      // Mais on peut ajouter une gestion locale si nécessaire
      errorUtils.createTransitionError(
        'Échec de la transition',
        { type: transition },
        { id, transition }
      );
    }
  };

  return (
    <button onClick={handleTransition}>
      Passer à {transition}
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
        'Erreur dans le composant',
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
      return (
        <div className="error-boundary">
          <h2>Une erreur est survenue</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Réessayer
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Exemples d'Utilisation

### Application Complète

```typescript
// App.tsx
import React from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { StateViewer } from './components/StateViewer';
import { DiffViewer } from './components/DiffViewer';
import { StateTransition } from './components/StateTransition';
import { useErrors } from './hooks/useErrors';

export function App() {
  useErrors();

  return (
    <ErrorBoundary>
      <div className="app">
        <h1>Système de Layout Karmyc</h1>
        
        <div className="state-section">
          <h2>État Actuel</h2>
          <StateViewer id="current-state" />
          
          <div className="actions">
            <StateTransition
              id="current-state"
              transition="review"
            />
          </div>
        </div>

        <div className="diff-section">
          <h2>Modifications</h2>
          <DiffViewer stateId="current-state" />
        </div>
      </div>
    </ErrorBoundary>
  );
}
```

### Styles CSS

```css
/* styles/components.css */
.state-viewer {
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.errors {
  margin: 1rem 0;
  padding: 0.5rem;
  background-color: #fff3f3;
  border: 1px solid #ffcdd2;
  border-radius: 4px;
}

.error {
  color: #d32f2f;
  margin: 0.25rem 0;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.diff-viewer {
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.active-diff {
  margin: 1rem 0;
  padding: 0.5rem;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.change {
  margin: 0.25rem 0;
  padding: 0.25rem;
  background-color: #fff;
  border-radius: 2px;
}

.error-boundary {
  padding: 2rem;
  text-align: center;
  background-color: #fff3f3;
  border: 1px solid #ffcdd2;
  border-radius: 4px;
  margin: 1rem;
}
```

## Bonnes Pratiques

1. **Performance**
   - Utiliser des sélecteurs mémorisés pour les calculs complexes
   - Éviter les re-rendus inutiles avec `useMemo` et `useCallback`
   - Implémenter la pagination pour les listes longues

2. **Gestion des Erreurs**
   - Utiliser des boundaries d'erreur pour isoler les problèmes
   - Fournir des messages d'erreur clairs aux utilisateurs
   - Implémenter des mécanismes de récupération

3. **Maintenance**
   - Extraire la logique commune dans des hooks personnalisés
   - Documenter les props et les types
   - Tester les composants avec différents états 
