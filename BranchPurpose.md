# Isolate Layout Features - Feuille de Route

## Objectif
L'objectif de cette branche est d'identifier et de créer un système de mise en page central (core layout system) pour l'éditeur d'animation. Ce système sera modulaire, extensible et maintenable.

## Composition actuelle
Le système est actuellement composé des éléments suivants :
- [ ] `area` - Gestion des zones d'affichage
- [ ] `store` - Gestion de l'état global
- [ ] `contextmenu` - Menus contextuels
- [ ] `project` - Gestion des projets
- [ ] `diff` - Système de comparaison
- [ ] `state` - Gestion des états spécifiques
- [ ] `toolbar` - Interface des barres d'outils
- [ ] `util` - Fonctions utilitaires (partiellement)
- [ ] `history` - Gestion de l'historique
- [ ] `listener` - Système d'écoute d'événements

Le but est de les rassembler sous la forme d'un composant unique.

## Stratégie d'implémentation

### Principes fondamentaux
1. **Migration progressive** :
   - Ne jamais mélanger l'ancien et le nouveau store
   - Migrer un composant à la fois
   - Maintenir une compatibilité temporaire si nécessaire
   - Supprimer l'ancien code une fois la migration validée

2. **Réutilisation des composants** :
   - Ne pas réinventer les composants existants
   - Adapter les composants existants au nouveau système
   - Créer des wrappers si nécessaire pour la compatibilité
   - Documenter les modifications apportées

3. **Gestion des actions** :
   - Maintenir un registre central des actions
   - Assurer la compatibilité des types d'actions
   - Migrer les actions une par une
   - Valider chaque action migrée avant de passer à la suivante

### Étapes de migration par composant
1. **Analyse préalable** :
   - Identifier toutes les dépendances
   - Lister les actions utilisées
   - Documenter les états et props
   - Créer un plan de migration détaillé

2. **Migration** :
   - Créer une version temporaire du composant
   - Implémenter les nouvelles interfaces
   - Adapter les actions existantes
   - Tester la compatibilité

3. **Validation** :
   - Vérifier toutes les fonctionnalités
   - Tester les cas limites
   - Valider les performances
   - Documenter les changements

4. **Nettoyage** :
   - Supprimer le code temporaire
   - Mettre à jour la documentation
   - Mettre à jour les tests
   - Valider l'intégration

### Règles de compatibilité
1. **Store** :
   - Maintenir une interface de compatibilité temporaire
   - Documenter les différences entre ancien et nouveau store
   - Planifier la suppression de l'interface de compatibilité

2. **Actions** :
   - Créer un mapping des actions anciennes vers nouvelles
   - Maintenir la compatibilité des types
   - Documenter les changements de signature

3. **Composants** :
   - Adapter progressivement les props
   - Maintenir la compatibilité des événements
   - Documenter les changements d'interface

### Points de contrôle
1. **Avant chaque migration** :
   - Vérifier l'état actuel du système
   - Valider les dépendances
   - Confirmer le plan de migration

2. **Pendant la migration** :
   - Suivre le plan étape par étape
   - Documenter les problèmes rencontrés
   - Valider chaque étape

3. **Après la migration** :
   - Vérifier l'intégration
   - Valider les performances
   - Mettre à jour la documentation

### Gestion des problèmes spécifiques

#### 1. Mélange des stores
- **Problème** : Confusion entre l'ancien et le nouveau store
- **Solution** :
  - Créer une interface de compatibilité temporaire dans `src/core/store/compatibility`
  - Documenter clairement les différences entre les stores
  - Utiliser des types distincts pour chaque store
  - Implémenter un système de migration progressive des composants

#### 2. Réinvention des composants
- **Problème** : Duplication inutile de composants existants
- **Solution** :
  - Créer un système de wrappers dans `src/core/components/wrappers`
  - Adapter les composants existants plutôt que les réinventer
  - Documenter les modifications apportées aux composants originaux
  - Maintenir une liste des composants adaptés vs. réinventés

#### 3. Gestion des actions
- **Problème** : Oubli de récupérer des actions
- **Solution** :
  - Implémenter un système de registre d'actions centralisé
  - Créer des hooks dédiés pour l'enregistrement des actions
  - Mettre en place des validateurs d'actions
  - Documenter toutes les actions disponibles et leurs dépendances

#### 4. Processus de migration par composant
1. **Analyse** :
   - Identifier toutes les actions utilisées
   - Lister les dépendances du store
   - Documenter les props et états
   - Créer un plan de migration détaillé

2. **Adaptation** :
   - Créer un wrapper si nécessaire
   - Adapter les actions au nouveau système
   - Implémenter les nouveaux hooks
   - Tester la compatibilité

3. **Validation** :
   - Vérifier toutes les fonctionnalités
   - Tester les cas limites
   - Valider les performances
   - Documenter les changements

4. **Nettoyage** :
   - Supprimer le code temporaire
   - Mettre à jour la documentation
   - Mettre à jour les tests
   - Valider l'intégration

#### 5. Documentation et suivi
- **Problème** : Manque de documentation et de suivi
- **Solution** :
  - Maintenir un journal des modifications dans CHANGELOG.md
  - Documenter les problèmes dans TROUBLESHOOTING.md
  - Mettre à jour la documentation technique
  - Créer des guides de migration pour chaque type de composant

## Informations complémentaires

### Organisation du projet
- **Équipe** : Développement collaboratif entre l'opérateur humain et l'assistant IA
- **Calendrier** : Pas de contrainte de temps spécifique
- **Gestion de version** : Branche unique avec commits d'étape aux moments clés
- **Revue de code** : Revue continue pendant le développement

### Contraintes techniques supplémentaires
- **Dépendances** : Proposer des solutions et demander validation avant d'ajouter de nouvelles dépendances
- **Compatibilité React** : Maintenir la compatibilité avec React 17 pour cette phase, avec objectif de migration vers React 19 ultérieurement
- **Intégration** : Concevoir une architecture agnostique avec des hooks pour faciliter l'intégration future avec d'autres modules

### Continuité entre les sessions (Instructions pour l'IA)

Pour assurer une reprise efficace du travail entre les sessions, les opérations suivantes doivent être effectuées :

#### En fin de session
- [ ] Résumer le travail accompli et mettre à jour les cases à cocher dans ce document
- [ ] Documenter les décisions techniques prises pendant la session
- [ ] Identifier clairement les points bloquants ou questions en suspens
- [ ] Proposer un commit d'étape si une partie significative du travail a été réalisée
- [ ] Sauvegarder tous les documents de travail en cours


#### En début de session
- [ ] Examiner l'état actuel du projet (fichiers modifiés, structure)
- [ ] Relire les dernières modifications et la documentation produite
- [ ] Réviser les points bloquants identifiés lors de la session précédente
- [ ] Établir les objectifs de la session actuelle
- [ ] Vérifier les dépendances installées et l'état de l'environnement de développement

#### Informations à fournir en début de session (si elles ne sont pas fournies, les demander)
Pour faciliter la reprise du travail, l'opérateur humain doit fournir à l'assistant IA les éléments suivants au début de chaque session :

- [ ] **État d'avancement** : Résumé des dernières tâches accomplies et mise à jour des cases cochées dans ce document
- [ ] **Modifications manuelles** : Description de toute modification effectuée manuellement entre les sessions
- [ ] **Problèmes rencontrés** : Mention des difficultés ou blocages survenus depuis la dernière session
- [ ] **Objectifs de la session** : Définition claire des objectifs pour la session actuelle
- [ ] **Décisions prises** : Information sur les décisions techniques ou architecturales prises hors session
- [ ] **Fichiers pertinents** : Liste des fichiers principaux sur lesquels travailler pour cette session
- [ ] **Contexte technique** : Rappel de l'environnement de développement actuel (dépendances installées, etc.)

#### Suivi de progression
- [ ] Maintenir un journal des modifications dans un fichier CHANGELOG.md
- [ ] Mettre à jour ce document de feuille de route en cochant les tâches terminées
- [ ] Documenter les problèmes rencontrés et leurs solutions dans un fichier TROUBLESHOOTING.md


## Feuille de route détaillée

### 1. Analyse approfondie de l'existant

#### 1.1 Analyse de la structure actuelle
- [x] Examiner en détail les dossiers identifiés
- [x] Documenter les dépendances entre ces dossiers
- [x] Identifier les interfaces et types partagés
- [x] **Documenter les résultats de l'analyse dans un document technique initial**

#### 1.2 Analyse du flux de données
- [x] Cartographier le flux de données entre les composants
- [x] Identifier les points d'entrée et de sortie des données
- [x] Documenter les modèles d'état actuels (state patterns)
- [x] Analyser comment les actions sont actuellement gérées
- [x] **Créer des diagrammes de flux de données et les inclure dans la documentation**

### 2. Conception de la nouvelle architecture

#### 2.1 Structure du dossier 'core'
- [x] Définir une hiérarchie claire pour le dossier 'core'
- [x] Créer un schéma d'organisation des sous-dossiers
- [x] Établir des conventions de nommage cohérentes
- [x] Définir les interfaces publiques vs. privées
- [x] **Documenter la structure proposée avec justifications des choix architecturaux**

#### 2.2 Conception du store Redux
- [x] Définir la structure du store Redux-Toolkit
- [x] Concevoir les slices pour chaque domaine fonctionnel
- [x] Intégrer redux-undo pour la gestion de l'historique des actions
- [x] Configurer redux-persist pour la persistance des données
- [x] Définir une stratégie de sérialisation/désérialisation
- [x] **Créer un document de conception détaillé du store avec diagrammes**

#### 2.3 Système d'actions modulaire
- [x] Concevoir une architecture de plugins pour les actions
- [x] Définir les interfaces pour l'enregistrement des actions
- [x] Créer un système de priorité pour les actions
- [x] Établir un mécanisme de validation des actions
- [x] **Documenter l'API du système d'actions avec exemples d'utilisation**

#### 2.4 API de hooks
- [x] Concevoir les hooks pour l'enregistrement des types de zones
- [x] Créer les hooks pour l'enregistrement des actions
- [x] Développer les hooks pour les actions de menu contextuel
- [x] Définir un hook d'initialisation avec configuration personnalisable
- [x] **Créer une documentation de référence pour chaque hook avec exemples**

### 3. Implémentation

#### 3.1 Refactorisation de la structure
- [x] Créer le dossier 'core' et ses sous-dossiers
- [ ] Migrer les composants existants vers la nouvelle structure
- [ ] Mettre à jour les imports dans tous les fichiers
- [ ] Assurer la compatibilité avec le code existant
- [ ] **Mettre à jour la documentation avec la structure finale implémentée**

#### 3.2 Implémentation du store Redux
- [x] Installer les dépendances nécessaires (redux-toolkit, redux-undo, redux-persist)
- [x] Implémenter les slices Redux pour chaque domaine
  - [x] areaSlice.ts - Gestion des zones d'affichage
  - [x] contextMenuSlice.ts - Gestion des menus contextuels
  - [x] projectSlice.ts - Gestion des projets
  - [x] stateSlice.ts - Gestion des états
  - [x] diffSlice.ts - Système de comparaison
  - [x] toolbarSlice.ts - Interface des barres d'outils
  - [x] notificationSlice.ts - Système de notifications (implémenté en bonus)
- [x] Configurer le middleware et les enhancers
  - [x] Structure des middlewares (middleware/)
  - [x] Structure des enhancers (enhancers/)
  - [x] Système de sérialisation (serialization/)
- [x] Mettre en place les sélecteurs optimisés
  - [x] Sélecteurs globaux (selectors.ts)
  - [x] Sélecteurs spécifiques par domaine (selectors/)
- [x] **Documenter l'implémentation finale du store avec exemples d'utilisation**

#### 3.3 Système d'actions
- [ ] Implémenter le système de plugins pour les actions
- [ ] Créer le registre central des actions
- [ ] Développer les mécanismes de dispatch et d'exécution
- [ ] Intégrer avec le système d'historique (undo/redo)
- [ ] **Mettre à jour la documentation du système d'actions avec le code final**

#### 3.4 Hooks et API publique
- [ ] Implémenter les hooks d'enregistrement
- [ ] Créer les hooks d'initialisation
- [ ] Développer les hooks d'accès aux données
- [ ] Documenter l'API publique
- [ ] **Finaliser la documentation de référence de l'API avec tous les hooks implémentés**

### 4. Tests et documentation

#### 4.1 Tests unitaires
- [ ] Créer des tests pour chaque composant du core
- [ ] Tester les hooks et l'API publique
- [ ] Vérifier la compatibilité avec le code existant
- [ ] **Documenter la couverture des tests et les résultats**

#### 4.2 Documentation finale
- [ ] Consolider la documentation technique créée à chaque étape
- [ ] Rédiger des guides d'utilisation pour les développeurs
- [ ] Documenter les exemples d'intégration
- [ ] Créer des diagrammes explicatifs
- [ ] Réviser et valider la cohérence de la documentation complète

#### 4.3 Exemples d'utilisation
- [ ] Développer des exemples concrets d'utilisation
- [ ] Créer des démos pour les fonctionnalités principales
- [ ] Documenter les cas d'utilisation avancés
- [ ] **Inclure les exemples dans la documentation avec explications détaillées**

### 5. Intégration et déploiement

#### 5.1 Intégration avec le reste de l'application
- [ ] Mettre à jour les composants externes pour utiliser la nouvelle API
- [ ] Assurer la compatibilité avec les fonctionnalités existantes
- [ ] Résoudre les conflits potentiels
- [ ] **Documenter les changements nécessaires pour l'intégration**

#### 5.2 Migration progressive
- [ ] Planifier une stratégie de migration progressive
- [ ] Identifier les étapes intermédiaires
- [ ] Définir des points de contrôle pour valider chaque étape
- [ ] **Créer un guide de migration détaillé pour les développeurs**

### 6. Documentation continue

#### 6.1 Processus de documentation
- [ ] Établir un processus de documentation continue pour chaque nouvelle fonctionnalité
- [ ] Créer des modèles de documentation pour assurer la cohérence
- [ ] Mettre en place un système de revue de la documentation
- [ ] Intégrer la documentation dans le processus de développement

#### 6.2 Maintenance de la documentation
- [ ] Définir un processus de mise à jour de la documentation
- [ ] Établir des responsabilités claires pour la maintenance
- [ ] Mettre en place un système de feedback pour améliorer la documentation
- [ ] Planifier des révisions périodiques de la documentation

#### 6.3 Formation et onboarding
- [ ] Créer des matériaux de formation basés sur la documentation
- [ ] Développer un processus d'onboarding pour les nouveaux développeurs
- [ ] Organiser des sessions de présentation de l'architecture
- [ ] Recueillir les retours pour améliorer la documentation

## Contraintes techniques

- [ ] Utiliser yarn comme gestionnaire de paquets
- [ ] Maintenir la compatibilité avec React 17
- [ ] Conserver le dossier ORIGINAL comme référence pour la logique
- [ ] Respecter la structure TypeScript existante
- [ ] Assurer la compatibilité avec les bibliothèques existantes (pixi.js, etc.)
- [ ] **Documenter chaque étape du développement en temps réel**

## Livrables attendus

1. [ ] Code source refactorisé avec la nouvelle architecture
2. [ ] Documentation technique complète, créée et mise à jour progressivement
3. [ ] Tests unitaires couvrant les fonctionnalités principales
4. [ ] Exemples d'utilisation et démos
5. [ ] Guide de migration pour les développeurs
6. [ ] Processus de documentation continue pour les développements futurs

## Documents de suivi du projet

- **BranchPurpose.md** : Feuille de route principale et suivi des tâches
- **CHANGELOG.md** : Journal des modifications apportées au projet
- [ ] **TROUBLESHOOTING.md** : Documentation des problèmes rencontrés et leurs solutions
