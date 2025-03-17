# Optimisations et Gestion des Erreurs

## Sélecteurs Mémorisés

### Vue d'ensemble

Les sélecteurs mémorisés sont utilisés pour optimiser les performances en évitant les calculs inutiles. Ils ne sont recalculés que lorsque leurs dépendances changent.

### Types de Sélecteurs

1. **Sélecteurs de Base**
   ```typescript
   const selectState = (state: RootState) => state.state;
   const selectDiff = (state: RootState) => state.diff;
   const selectToolbar = (state: RootState) => state.toolbar;
   ```

2. **Sélecteurs d'État**
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

3. **Sélecteurs de Diff**
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

4. **Sélecteurs Composites**
   ```typescript
   export const selectStateWithDiffs = createSelector(
     [selectStateById, selectDiffs],
     (state, diffs) => ({
       ...state,
       diffs: diffs.filter(d => d.target === state.id)
     })
   );
   ```

### Bonnes Pratiques

1. **Composition**
   - Utiliser des sélecteurs de base pour les données simples
   - Composer des sélecteurs complexes à partir des sélecteurs de base
   - Éviter les calculs redondants

2. **Performance**
   - Minimiser le nombre de dépendances
   - Éviter les transformations de données complexes
   - Utiliser des sélecteurs spécifiques plutôt que génériques

3. **Maintenance**
   - Nommer les sélecteurs de manière descriptive
   - Documenter les dépendances
   - Tester les sélecteurs individuellement

## Gestion des Erreurs

### Types d'Erreurs

```typescript
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  TRANSITION = 'TRANSITION',
  DIFF = 'DIFF',
  TOOLBAR = 'TOOLBAR',
  SYSTEM = 'SYSTEM'
}
```

### Structure des Erreurs

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

### Utilisation

1. **Création d'Erreurs**
   ```typescript
   // Erreur de validation
   errorUtils.createValidationError(
     'Données invalides',
     { field: 'name', value: '' }
   );

   // Erreur de transition
   errorUtils.createTransitionError(
     'Transition impossible',
     action,
     { from: 'draft', to: 'review' }
   );
   ```

2. **Gestion des Erreurs**
   ```typescript
   const errorHandler = ErrorHandler.getInstance();

   // Ajouter un écouteur
   const unsubscribe = errorHandler.addListener(error => {
     console.error(error);
   });

   // Obtenir les erreurs récentes
   const recentErrors = errorHandler.getRecentErrors(5);
   ```

3. **Middleware d'Erreurs**
   ```typescript
   export const errorMiddleware = () => (next: any) => (action: AnyAction) => {
     try {
       return next(action);
     } catch (error) {
       const errorHandler = ErrorHandler.getInstance();
       // Gérer l'erreur...
       throw error;
     }
   };
   ```

### Bonnes Pratiques

1. **Création d'Erreurs**
   - Utiliser des messages d'erreur descriptifs
   - Inclure des détails pertinents
   - Associer les erreurs aux actions

2. **Gestion**
   - Centraliser la gestion des erreurs
   - Implémenter des écouteurs pour le logging
   - Nettoyer les erreurs obsolètes

3. **Récupération**
   - Fournir des informations de débogage
   - Permettre la récupération des erreurs
   - Maintenir un historique des erreurs

## Exemples d'Utilisation

### Composant avec Sélecteurs

```typescript
function StateViewer({ id }: { id: string }) {
  const state = useSelector(selectStateById(id));
  const validation = useSelector(selectStateValidation(id));
  const metrics = useSelector(selectStateMetrics(id));

  if (!state) return <div>État non trouvé</div>;

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
        <div>Âge: {metrics.age}ms</div>
        <div>Mises à jour: {metrics.updateCount}</div>
      </div>
    </div>
  );
}
```

### Gestion des Erreurs dans un Composant

```typescript
function StateTransition({ id, transition }: { id: string; transition: string }) {
  const dispatch = useAppDispatch();
  const errorHandler = ErrorHandler.getInstance();

  useEffect(() => {
    const unsubscribe = errorHandler.addListener(error => {
      if (error.type === ErrorType.TRANSITION) {
        // Afficher une notification
        showNotification(error.message, 'error');
      }
    });

    return unsubscribe;
  }, []);

  const handleTransition = () => {
    try {
      dispatch(transitionState({ id, transition }));
    } catch (error) {
      // L'erreur sera gérée par le middleware
    }
  };

  return <button onClick={handleTransition}>Transition</button>;
}
```

## Performance et Monitoring

### Mesures de Performance

1. **Sélecteurs**
   - Temps d'exécution
   - Nombre de recalculs
   - Taille des résultats

2. **Erreurs**
   - Taux d'erreurs par type
   - Temps de résolution
   - Impact sur l'interface

### Outils de Monitoring

1. **Redux DevTools**
   - Suivi des actions
   - Inspection de l'état
   - Profilage des sélecteurs

2. **Logging**
   - Erreurs système
   - Performance des sélecteurs
   - Utilisation mémoire 
