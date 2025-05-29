# Spécification du Mode Responsive pour Karmyc

## Objectif
Adapter l'interface de Karmyc pour les appareils mobiles en affichant une seule "Area" à la fois, tout en permettant une navigation facile entre les différentes "Areas" via un overlay.

## Détails Techniques

### 1. Détection du Mode Mobile
- Seuil de largeur d'écran : 768px
- Utilisation d'un hook React personnalisé `useIsMobile` basé sur `window.matchMedia`
- Le mode mobile sera activé automatiquement lorsque la largeur de l'écran est inférieure à 768px

### 2. Gestion de l'Area Active
- Réutilisation de `activeAreaId` existant dans le store Zustand
- En mode mobile, seule l'Area correspondant à `activeAreaId` sera affichée
- L'Area active occupera 100% de la largeur et de la hauteur de l'écran

### 3. Overlay de Navigation
#### Structure
- Icône de navigation : `layout-panel-left` de Lucide React
- Position : coin supérieur droit de l'écran
- L'overlay recouvre et bloque toute interaction avec le contenu en arrière-plan

#### Représentation des Areas
- Utilisation de la logique existante de layout (`computeAreaToViewport`)
- Mise à l'échelle au format 16:9
- Chaque Area est représentée par :
  - Une div avec une bordure
  - Opacité de 0.5
  - Affichage du nom de l'Area
- Conservation de la structure hiérarchique des Areas

#### Navigation
- Pager en bas de l'overlay pour la navigation entre les écrans
- Animation de transition : slide vers l'Area sélectionnée
- Désactivation du glisser-déposer en mode mobile

### 4. Modifications Requises

#### Composants à Modifier
1. `Karmyc.tsx`
   - Ajout de la détection du mode mobile
   - Adaptation du rendu pour n'afficher que l'Area active en mode mobile
   - Intégration de l'icône de navigation

2. Nouveau Composant `MobileOverlay`
   - Gestion de l'overlay de navigation
   - Représentation des Areas
   - Gestion des interactions

3. Nouveau Hook `useIsMobile`
   - Détection du mode mobile
   - Gestion des changements de taille d'écran

#### Store Zustand
- Aucune modification nécessaire de la structure du store
- Réutilisation de `activeAreaId` existant

### 5. Animations et Transitions
- Transition de slide lors du changement d'Area
- Animation d'ouverture/fermeture de l'overlay
- Transitions fluides pour une expérience utilisateur optimale

### 6. Désactivation des Fonctionnalités en Mode Mobile
- Désactivation du redimensionnement des Areas
- Désactivation du glisser-déposer
- Désactivation des séparateurs de lignes

## Plan d'Implémentation

1. Création du hook `useIsMobile`
2. Modification de `Karmyc` pour le mode mobile
3. Création du composant `MobileOverlay`
4. Intégration des animations et transitions
5. Tests et ajustements

## Questions Ouvertes
- Gestion des cas d'erreur (pas d'Area active, etc.)
- Comportement lors du retour en mode desktop
- Optimisation des performances pour les grands layouts 
