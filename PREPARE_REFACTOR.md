# Préparation du Refactoring de Karmyc Core

## Objectifs
- Préserver l'UI actuelle
- Isoler les concepts clés
- Préparer l'infrastructure pour les plugins externes
- Nettoyer le code obsolète

## Concepts Clés
1. **Areas** : Zones de l'interface utilisateur
2. **Spaces** : Zones de stockage de données projet
3. **Tools** : Espaces liés aux areas et aux spaces avec filtres
4. **Screens** : Containers UI isolés
5. **Actions** : Système de gestion des actions

## Nouvelle Structure
```
src/
  ├── core/
  │   ├── ui/           # Interfaces UI communes
  │   ├── data/         # Interfaces de données communes
  │   ├── events/       # Système d'événements
  │   └── plugins/      # Infrastructure pour les plugins externes
  │       ├── types/    # Types et interfaces pour les plugins
  │       ├── registry/ # Système d'enregistrement des plugins
  │       └── hooks/    # Points d'extension pour les plugins
  │
  ├── areas/
  │   ├── components/   # Composants UI
  │   ├── services/     # Logique métier
  │   └── extensions/   # Points d'extension pour les plugins
  │
  ├── tools/
  │   ├── components/   # Composants UI
  │   ├── filters/      # Système de filtres
  │   ├── services/     # Logique métier
  │   └── extensions/   # Points d'extension pour les plugins
  │
  ├── spaces/
  │   ├── storage/      # Gestion du stockage
  │   ├── sync/         # Synchronisation
  │   └── extensions/   # Points d'extension pour les plugins
  │
  ├── actions/
  │   ├── handlers/     # Gestionnaires d'actions
  │   ├── validators/   # Validateurs
  │   └── extensions/   # Points d'extension pour les plugins
  │
  └── garbage/          # Code à archiver
      ├── history/      # Ancien système d'historique
      ├── drawing/      # Ancien système de dessin
      └── ...           # Autres fonctionnalités obsolètes
```

## Points d'Extension pour les Plugins

### Interface de Base des Plugins
```typescript
interface IPlugin {
    id: string;
    name: string;
    version: string;
    dependencies?: string[];
    onRegister?: () => void;
    onUnregister?: () => void;
}
```

### Points d'Extension par Domaine
```typescript
interface IExtensionPoints {
    // Areas
    area: {
        onCreate?: (area: IArea) => void;
        onDestroy?: (areaId: string) => void;
        onUpdate?: (area: IArea) => void;
        extendUI?: (area: IArea) => React.ComponentType;
        extendState?: (area: IArea) => any;
    };

    // Tools
    tool: {
        onCreate?: (tool: ITool) => void;
        onDestroy?: (toolId: string) => void;
        onActivate?: (tool: ITool) => void;
        onDeactivate?: (toolId: string) => void;
        extendUI?: (tool: ITool) => React.ComponentType;
        extendFilters?: (tool: ITool) => ToolFilters;
    };

    // Spaces
    space: {
        onCreate?: (space: ISpace) => void;
        onDestroy?: (spaceId: string) => void;
        onUpdate?: (space: ISpace) => void;
        extendData?: (space: ISpace) => any;
    };

    // Actions
    action: {
        beforeAction?: (action: Action) => void;
        afterAction?: (action: Action) => void;
        validateAction?: (action: Action) => boolean;
    };
}
```

## Étapes du Refactoring

1. **Préparation** => FAIT
   - Déplacer les fichiers et dossiers actuels dans un dossier "OLD"
   - Créer la nouvelle structure de dossiers
   - Déplacer les fichiers vers leur nouvelle destination en commençant par tout ce qui est data et logique métier
   - Déplacer le code obsolète dans le dossier `garbage`
   - Préserver l'UI actuelle en la copiant dans la nouvelle structure

2. **Isolation des Concepts**
   - Séparer les interfaces UI communes dans `core/ui`
   - Isoler les interfaces de données dans `core/data`
   - Mettre en place le système d'événements dans `core/events`

3. **Mise en Place des Extensions**
   - Implémenter l'infrastructure des plugins
   - Créer les points d'extension pour chaque domaine
   - Documenter l'API d'extension

4. **Migration Progressive**
   - Migrer les composants un par un
   - Tester chaque migration
   - Maintenir la compatibilité avec l'UI existante

## Règles de Migration

1. **Préservation de l'UI**
   - Ne pas modifier le comportement visuel
   - Maintenir la compatibilité des props
   - Conserver les styles existants

2. **Isolation du Code**
   - Éviter les dépendances circulaires
   - Utiliser des interfaces claires
   - Documenter les points d'extension

3. **Gestion des Plugins**
   - Pas de plugins internes
   - Infrastructure uniquement pour les plugins externes
   - Documentation claire pour les développeurs de plugins

## Tests et Validation

1. **Tests Unitaires**
   - Tester chaque composant isolé
   - Vérifier les points d'extension
   - Valider la compatibilité des plugins

2. **Tests d'Intégration**
   - Vérifier l'interaction entre les composants
   - Tester les scénarios d'utilisation
   - Valider la préservation de l'UI

3. **Tests de Performance**
   - Mesurer l'impact sur les performances
   - Optimiser si nécessaire
   - Documenter les métriques

## Documentation

1. **Documentation Technique**
   - Architecture du système
   - Points d'extension
   - Guide de migration

2. **Documentation des Plugins**
   - Guide de développement
   - Exemples d'implémentation
   - Bonnes pratiques

3. **Documentation Utilisateur**
   - Guide d'utilisation
   - Exemples de configuration
   - Dépannage 
