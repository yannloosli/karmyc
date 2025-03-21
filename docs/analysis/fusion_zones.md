# Documentation : Fusion des Zones dans le Core

## Structure des Données

### Zone (Area)
```typescript
interface Area<T extends AreaType> {
    id: string;
    type: T;
    state: any;
    viewport?: Rect;
}
```

### Layout de Zone
```typescript
interface AreaLayout {
    id: string;
    type: "area";
}
```

### Ligne de Zones
```typescript
interface AreaRowLayout {
    type: "area_row";
    id: string;
    areas: Array<{
        id: string;
        size: number;
    }>;
    orientation: "horizontal" | "vertical";
}
```

## Mécanisme de Fusion

### Principe de Base
La fusion de zones dans le système actuel :
- Ne fonctionne qu'entre zones adjacentes dans une même ligne
- Se fait toujours par paires (2 zones à la fois)
- Conserve les propriétés de la zone source
- Additionne les tailles des zones fusionnées

### Processus de Fusion
1. **Identification des Zones**
   ```typescript
   const targetIndex = areaIndex;
   const sourceIndex = areaIndex - mergeInto; // -(-1) = +1 fusion gauche, -(1) = -1 fusion droite
   ```

2. **Calcul de la Nouvelle Taille**
   ```typescript
   const sourceSize = sourceArea.size || 1;
   const targetSize = targetArea.size || 1;
   const newSize = sourceSize + targetSize;
   ```

3. **Cas Particulier : 2 Zones**
   - Si la ligne ne contient que 2 zones
   - Résultat : une seule zone simple (type: "area")
   ```typescript
   if (row.areas.length === 2) {
       return { 
           area: { type: "area", id: sourceArea.id },
           removedAreaId: targetArea.id 
       };
   }
   ```

4. **Cas Général : Plus de 2 Zones**
   - Mise à jour de la liste des zones
   - La zone source prend la position de la cible
   - La position originale de la source est supprimée
   ```typescript
   const resultAreas = [...row.areas];
   resultAreas[targetIndex] = { id: sourceArea.id, size: newSize };
   resultAreas.splice(sourceIndex, 1);
   ```

## Gestion d'État (Redux)

### État Global
```typescript
interface AreaState {
    _id: number;
    rootId: string;
    errors: string[];
    activeAreaId: string | null;
    layout: { [key: string]: AreaRowLayout | AreaLayout };
    areas: { [key: string]: Area<AreaType> };
    viewports: { [key: string]: Rect };
    joinPreview: {
        areaId: string | null;
        movingInDirection: CardinalDirection | null;
        eligibleAreaIds: string[];
    } | null;
}
```

### Processus de Fusion dans le Store
1. **Validation**
   - Vérification de l'existence de la ligne
   - Vérification des indices des zones

2. **Mise à jour du Layout**
   - Suppression des zones fusionnées
   - Mise à jour des relations parent-enfant
   - Gestion du cas particulier de la racine

3. **Mise à jour des Zones**
   - Conservation du type de la zone source
   - Suppression de la zone cible
   - Mise à jour des références

4. **Persistance**
   - Sauvegarde dans le localStorage
   - Validation de l'état avant sauvegarde

## Gestion des Erreurs

Le système gère plusieurs types d'erreurs :
1. Zone non trouvée
2. Ligne invalide pour la fusion
3. Indices de zone invalides
4. Direction de fusion invalide

Les erreurs sont stockées dans `state.errors` et peuvent être consultées/effacées.

## Limitations Actuelles

1. Fusion uniquement entre zones adjacentes
2. Pas de fusion entre lignes différentes
3. Pas de fusion multiple (plus de 2 zones à la fois)
4. Pas de fusion entre zones de types incompatibles
