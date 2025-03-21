# Providers Core

Ce dossier contient les providers React qui fournissent le contexte et les fonctionnalités globales à l'application.

## Structure

```
providers/
├── CoreProvider.tsx     # Provider principal qui initialise le core
├── StoreProvider.tsx    # Provider pour le store Redux
├── ThemeProvider.tsx    # Provider pour le thème
└── HistoryProvider.tsx  # Provider pour l'historique
```

## Providers Principaux

### CoreProvider
Provider principal qui initialise et configure le core de l'application.

```typescript
import { CoreProvider } from '@core/providers';

function App() {
  return (
    <CoreProvider
      options={{
        enableHistory: true,
        enablePersistence: true,
        theme: 'light'
      }}
    >
      <MyApp />
    </CoreProvider>
  );
}
```

### StoreProvider
Provider qui configure et fournit le store Redux.

```typescript
import { StoreProvider } from '@core/providers';

function MyApp() {
  return (
    <StoreProvider
      initialState={initialState}
      middleware={[logger, thunk]}
    >
      <AppContent />
    </StoreProvider>
  );
}
```

## Utilisation

```typescript
import { CoreProvider, StoreProvider } from '@core/providers';

function App() {
  return (
    <CoreProvider>
      <StoreProvider>
        <ThemeProvider>
          <HistoryProvider>
            <AppContent />
          </HistoryProvider>
        </ThemeProvider>
      </StoreProvider>
    </CoreProvider>
  );
}
```

## Configuration

### Options du CoreProvider

```typescript
interface ICoreOptions {
  /** Active/désactive la gestion de l'historique */
  enableHistory?: boolean;
  /** Active/désactive la persistance des données */
  enablePersistence?: boolean;
  /** Thème de l'application */
  theme?: 'light' | 'dark';
  /** Configuration personnalisée */
  config?: {
    maxHistorySize?: number;
    autoSaveInterval?: number;
  };
}
```

## Bonnes Pratiques

1. **Ordre des Providers** : Respecter l'ordre de dépendance des providers
2. **Performance** : Éviter les re-rendus inutiles
3. **Erreurs** : Gérer les erreurs d'initialisation
4. **Tests** : Tester chaque provider individuellement
5. **Documentation** : Documenter les options et les effets de bord

## Contribution

1. Créer une branche pour votre fonctionnalité
2. Ajouter des tests pour les nouveaux providers
3. Mettre à jour la documentation
4. Soumettre une pull request

## Questions ?

Pour toute question concernant les providers, consulter la documentation technique dans le dossier `docs/`. 
