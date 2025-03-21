# Providers

Ce dossier contient les providers React qui fournissent le contexte et l'état global à l'application.

## Structure

```
providers/
├── KarmycProvider.tsx     # Provider principal qui initialise Karmyc
├── KarmycInitializer.tsx  # Composant qui initialise le système
└── README.md             # Ce fichier
```

## Providers principaux

Ces providers sont essentiels pour le fonctionnement du système et doivent être intégrés dans l'application.

### KarmycProvider

Le provider principal qui enveloppe l'application et initialise le système de layout.

```typescript
import { KarmycProvider } from '@/providers';

function App() {
  return (
    <KarmycProvider
      options={{
        enableLogging: true,
        plugins: [myCustomPlugin]
      }}
    >
      <MyApplication />
    </KarmycProvider>
  );
}
```

## Providers secondaires (implicitement inclus)

Ces providers sont inclus automatiquement par le KarmycProvider et n'ont pas besoin d'être importés séparément.

### StoreProvider

Provider Redux qui gère l'état global de l'application.

```typescript
import { StoreProvider } from '@/providers';

function MyApp() {
  return (
    <StoreProvider>
      <MyComponent />
    </StoreProvider>
  );
}
```

### Utilisation combinée (non nécessaire)

Le KarmycProvider intègre déjà tous les autres providers, mais voici comment les utiliser manuellement si nécessaire :

```typescript
import { KarmycProvider, StoreProvider } from '@/providers';

function App() {
  return (
    <KarmycProvider>
      <StoreProvider>
        <MyApplication />
      </StoreProvider>
    </KarmycProvider>
  );
}
```

## Options du KarmycProvider

Le KarmycProvider accepte les options suivantes :

| Option | Type | Description |
|--------|------|-------------|
| `enableLogging` | boolean | Active les logs de débogage |
| `plugins` | IActionPlugin[] | Plugins d'action personnalisés |
| `validators` | { actionType: string, validator: Function }[] | Validateurs d'action personnalisés |

Ces options permettent de personnaliser le comportement du système.

## Configuration

### Options du KarmycProvider

```typescript
interface IKarmycOptions {
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
