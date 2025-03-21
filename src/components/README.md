# Composants Core

Ce dossier contient les composants React réutilisables qui forment la base de l'interface utilisateur de l'éditeur d'animation.

## Structure

```
components/
├── Area.tsx              # Composant de base pour les zones interactives
├── ContextMenu.tsx       # Menu contextuel personnalisable
├── toolbar/             # Composants de la barre d'outils
├── project/             # Composants liés à la gestion des projets
├── icons/               # Icônes réutilisables
├── history-panel/       # Composants du panneau d'historique
├── context-menu/        # Composants du menu contextuel
└── area/                # Composants spécifiques aux zones
```

## Composants Principaux

### Area
Composant de base pour les zones interactives. Permet de créer des zones redimensionnables et déplaçables.

### ContextMenu
Menu contextuel personnalisable qui peut être attaché à n'importe quel élément.

## Utilisation

```tsx
import { Area, ContextMenu } from '@core/components';

// Exemple d'utilisation d'une zone
<Area
  area={{ id: '1', x: 0, y: 0, width: 100, height: 100 }}
  isActive={true}
  onSelect={(area) => console.log('Zone sélectionnée:', area)}
>
  Contenu de la zone
</Area>

// Exemple d'utilisation du menu contextuel
<ContextMenu
  items={[
    { label: 'Copier', action: () => console.log('Copier') },
    { label: 'Coller', action: () => console.log('Coller') }
  ]}
>
  <div>Cliquez droit ici</div>
</ContextMenu>
```

## Dépendances

- React
- @emotion/styled
- @reduxjs/toolkit

## Bonnes Pratiques

1. **Composants Atomiques** : Chaque composant doit avoir une responsabilité unique
2. **Props Typées** : Utiliser TypeScript pour toutes les props
3. **Documentation** : Inclure des commentaires JSDoc pour chaque composant
4. **Tests** : Maintenir une couverture de tests suffisante
5. **Performance** : Optimiser les re-rendus avec React.memo quand nécessaire

## Contribution

1. Créer une branche pour votre fonctionnalité
2. Ajouter des tests pour les nouveaux composants
3. Mettre à jour la documentation
4. Soumettre une pull request

## Questions ?

Pour toute question concernant les composants, consulter la documentation technique dans le dossier `docs/`. 
