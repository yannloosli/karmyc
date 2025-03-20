# Guide de résolution des problèmes

Ce document recense les problèmes courants rencontrés lors de la migration du système de mise en page vers l'architecture core, ainsi que leurs solutions.

## Problèmes lors de la migration du module Project

### 1. Intégration des types Composition entre l'ancien et le nouveau système

**Problème** : Les interfaces de composition entre l'ancien système et le nouveau ne sont pas compatibles.

**Solution** : 
- Définir l'interface Composition directement dans le slice Redux plutôt que dans un fichier de types séparé.
- Utiliser cette interface comme référence pour le reste du code.
- Si nécessaire, créer des fonctions utilitaires pour convertir entre les formats.

### 2. Styles CSS et composants

**Problème** : Le système de style est différent entre l'ancien code (qui utilise des classes et des fichiers CSS séparés) et le nouveau (qui utilise des styles inline).

**Solution** :
- Pour la phase de migration, utiliser des styles inline pour la simplicité.
- Dans une étape ultérieure, migrer vers styled-components ou une autre solution de CSS-in-JS qui offre plus de fonctionnalités.
- Éviter de mélanger les deux approches dans le même composant.

### 3. Gestion du menu contextuel

**Problème** : L'ancien système utilise une approche impérative pour le menu contextuel, tandis que le nouveau système est basé sur des actions déclaratives.

**Solution** :
- Créer une API consistante basée sur les hooks qui masque ces différences.
- Utiliser des adaptateurs pour connecter les anciens appels de menu à la nouvelle architecture.
- Documenter clairement les différences d'approche pour les développeurs.

### 4. Fonctionnalités de glisser-déposer

**Problème** : La fonctionnalité de glisser-déposer est étroitement couplée avec l'ancien système.

**Solution** :
- Commencer par implémenter les fonctionnalités de base sans le glisser-déposer.
- Créer une interface abstraite pour la fonctionnalité de glisser-déposer.
- Implémenter cette interface progressivement, en testant chaque étape.

## Autres problèmes communs

### 1. Dépendances circulaires

**Problème** : Des imports circulaires peuvent survenir lors de la refactorisation.

**Solution** :
- Utiliser des interfaces pour briser les dépendances circulaires.
- Réorganiser le code pour créer une hiérarchie claire de dépendances.
- Dans certains cas, utiliser des imports dynamiques peut aider.

### 2. Incompatibilités TypeScript

**Problème** : Des erreurs de type peuvent apparaître lors de la migration.

**Solution** :
- Utiliser des interfaces communes entre l'ancien et le nouveau système.
- Éviter d'utiliser `any` et préférer des types génériques ou unions.
- Si nécessaire, créer des fonctions de conversion explicites pour transformer les données.

### 3. Performances

**Problème** : Les nouveaux composants peuvent avoir des problèmes de performances liés aux re-rendus.

**Solution** :
- Utiliser `React.memo` pour éviter les re-rendus inutiles.
- Utiliser `useCallback` et `useMemo` pour stabiliser les références.
- Optimiser les sélecteurs Redux avec `createSelector`.
