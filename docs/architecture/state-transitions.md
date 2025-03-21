# Système de Transitions d'État

## Vue d'ensemble

Le système de transitions d'état permet de gérer les changements d'état de manière contrôlée et prévisible. Il est basé sur un système de transitions prédéfinies avec conditions et actions associées.

## États Prédéfinis

1. **Draft (Brouillon)**
   - État initial d'un élément
   - Modifiable
   - En cours de création

2. **Review (Revue)**
   - En cours de révision
   - Nécessite une validation
   - Peut être approuvé ou rejeté

3. **Approved (Approuvé)**
   - Validé par les relecteurs
   - Prêt pour la publication
   - Peut être publié

4. **Published (Publié)**
   - Disponible publiquement
   - Version finale
   - Peut être archivé

5. **Archived (Archivé)**
   - Plus actif
   - Conservé pour référence
   - État final

## Transitions Disponibles

### Draft → Review
```typescript
{
  from: 'draft',
  to: 'review',
  condition: (state) => state.data.isComplete && !state.data.hasErrors,
  action: (state, data) => {
    state.data.reviewStartedAt = new Date().toISOString();
    state.data.reviewer = data?.reviewer;
  }
}
```

### Review → Approved
```typescript
{
  from: 'review',
  to: 'approved',
  condition: (state) => 
    state.data.reviewStatus === 'completed' && 
    state.data.reviewResult === 'approved',
  action: (state, data) => {
    state.data.approvedAt = new Date().toISOString();
    state.data.approvedBy = data?.approver;
  }
}
```

### Review → Rejected
```typescript
{
  from: 'review',
  to: 'rejected',
  condition: (state) => 
    state.data.reviewStatus === 'completed' && 
    state.data.reviewResult === 'rejected',
  action: (state, data) => {
    state.data.rejectedAt = new Date().toISOString();
    state.data.rejectedBy = data?.rejector;
    state.data.rejectionReason = data?.reason;
  }
}
```

### Approved → Published
```typescript
{
  from: 'approved',
  to: 'published',
  condition: (state) => 
    state.data.isReadyForPublish && 
    !state.data.hasWarnings,
  action: (state, data) => {
    state.data.publishedAt = new Date().toISOString();
    state.data.publishedBy = data?.publisher;
  }
}
```

### Published → Archived
```typescript
{
  from: 'published',
  to: 'archived',
  condition: (state) => state.data.canBeArchived,
  action: (state, data) => {
    state.data.archivedAt = new Date().toISOString();
    state.data.archivedBy = data?.archiver;
  }
}
```

## API

### Enregistrement d'une Transition

```typescript
registerTransition({
  from: 'currentState',
  to: 'newState',
  condition: (state) => boolean,
  action: (state, data) => void
});
```

### Suppression d'une Transition

```typescript
unregisterTransition('currentState', 'newState');
```

### Liste des Transitions Disponibles

```typescript
const availableTransitions = getAvailableTransitions('currentState');
```

### Utilisation dans un Composant

```typescript
import { useAppDispatch } from '../hooks';
import { transitionState } from '../store/slices/stateSlice';

function MyComponent() {
  const dispatch = useAppDispatch();

  const handleTransition = () => {
    dispatch(transitionState({
      id: 'stateId',
      transition: 'review',
      data: { reviewer: 'John Doe' }
    }));
  };

  return <button onClick={handleTransition}>Passer en revue</button>;
}
```

## Bonnes Pratiques

1. **Conditions**
   - Toujours vérifier la validité des données
   - Inclure des messages d'erreur explicites
   - Éviter les conditions complexes

2. **Actions**
   - Mettre à jour les timestamps
   - Enregistrer les métadonnées pertinentes
   - Éviter les effets de bord

3. **Gestion des Erreurs**
   - Valider les données avant la transition
   - Gérer les cas d'erreur
   - Fournir des retours utilisateur

## Exemples d'Utilisation

### Transition Simple

```typescript
// Transition d'un brouillon vers la revue
dispatch(transitionState({
  id: 'document-1',
  transition: 'review',
  data: { reviewer: 'Alice' }
}));
```

### Transition avec Validation

```typescript
// Transition vers l'approbation avec vérification
const state = store.getState().state.states['document-1'];
if (state.data.reviewStatus === 'completed') {
  dispatch(transitionState({
    id: 'document-1',
    transition: 'approved',
    data: { approver: 'Bob' }
  }));
}
```

### Transition avec Données Additionnelles

```typescript
// Transition vers le rejet avec raison
dispatch(transitionState({
  id: 'document-1',
  transition: 'rejected',
  data: {
    rejector: 'Charlie',
    reason: 'Contenu inapproprié'
  }
}));
```

## Sécurité et Validation

1. **Vérifications**
   - Existence de l'état
   - Validité de la transition
   - Droits d'accès

2. **Validation des Données**
   - Format des données
   - Champs requis
   - Types de données

3. **Gestion des Erreurs**
   - Messages d'erreur
   - Logs
   - Notifications 
