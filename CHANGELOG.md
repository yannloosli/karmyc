# Journal des modifications (CHANGELOG)

## [Non publié] - 2023-03-20

### Ajouté
- Implémentation du module Project dans la nouvelle architecture core
  - Création d'un slice Redux pour la gestion des compositions
  - Création de hooks personnalisés pour interagir avec le slice (useProject, useProjectActions)
  - Implémentation du système de menu contextuel pour le projet
  - Création de nouveaux composants UI adaptés à l'architecture core

### Transformé
- Migration des fonctionnalités du module project vers l'architecture core
  - Gestion des compositions
  - Menu contextuel
  - Composants UI (Project, ProjectComp)

### À faire
- Implémenter la fonctionnalité de glisser-déposer des compositions
- Connecter l'interface des compositions avec le store des compositions
- Compléter l'implémentation du menu contextuel pour les paramètres des compositions
- Implémenter les utilitaires pour ouvrir des compositions dans des zones spécifiques

## [Initial] - 2023-03-17

### Ajouté
- Structure initiale du core avec les modules suivants
  - store: Configuration de Redux Toolkit
  - hooks: API de hooks pour utiliser les fonctionnalités du core
  - components: Composants UI réutilisables
  - actions: Système d'actions modulaire
  - types: Types TypeScript partagés
