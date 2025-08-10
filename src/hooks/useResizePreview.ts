import { useState, useCallback, useMemo } from 'react';
import { AreaRowLayout, ResizePreviewState } from '../types/areaTypes';

/**
 * Hook pour gérer la preview locale de redimensionnement
 * Garantit une fluidité parfaite en priorisant la preview locale sur le store global
 */
export const useResizePreview = () => {
    const [resizePreview, setResizePreview] = useState<ResizePreviewState | null>(null);

    // Calcul des tailles basé sur la preview locale
    const calculateSizesFromPreview = useCallback((
        row: AreaRowLayout,
        preview: ResizePreviewState
    ): number[] => {
        if (preview.rowId !== row.id) {
            return row.areas.map(area => area.size || 0);
        }

        const { separatorIndex, t } = preview;
        const areaIndex = separatorIndex - 1; // Convertir l'index du séparateur en index d'area

        if (areaIndex < 0 || areaIndex >= row.areas.length - 1) {
            return row.areas.map(area => area.size || 0);
        }

        // Calculer les tailles des deux areas adjacentes
        const area1 = row.areas[areaIndex];
        const area2 = row.areas[areaIndex + 1];
        
        if (!area1 || !area2) {
            return row.areas.map(area => area.size || 0);
        }

        const totalSize = (area1.size || 0) + (area2.size || 0);
        const newSize1 = totalSize * t;
        const newSize2 = totalSize * (1 - t);

        // Construire le tableau des tailles avec les nouvelles valeurs
        return row.areas.map((area, index) => {
            if (index === areaIndex) return newSize1;
            if (index === areaIndex + 1) return newSize2;
            return area.size || 0;
        });
    }, []);

    // Normalisation des tailles
    const normalizeSizes = useCallback((sizes: number[]): number[] => {
        const total = sizes.reduce((sum, size) => sum + size, 0);
        if (total > 0) {
            return sizes.map(size => size / total);
        }
        // Fallback: distribution égale
        return sizes.map(() => 1 / sizes.length);
    }, []);

    // Hook pour obtenir les tailles optimisées (preview locale en priorité)
    const useOptimizedSizes = useCallback((
        row: AreaRowLayout,
        fallbackSizes?: number[]
    ) => {
        return useMemo(() => {
            // Si on a une preview active pour cette row, l'utiliser
            if (resizePreview && resizePreview.rowId === row.id) {
                const previewSizes = calculateSizesFromPreview(row, resizePreview);
                return normalizeSizes(previewSizes);
            }
            
            // Sinon, utiliser les tailles du store (fallback)
            return fallbackSizes || row.areas.map(area => area.size || 0);
        }, [row, resizePreview, fallbackSizes, calculateSizesFromPreview, normalizeSizes]);
    }, [resizePreview, calculateSizesFromPreview, normalizeSizes]);

    // Fonction pour calculer la position du séparateur basée sur la preview
    const getSeparatorPosition = useCallback((
        row: AreaRowLayout,
        separatorIndex: number,
        totalWidth: number,
        isHorizontal: boolean
    ): number => {
        if (!resizePreview || resizePreview.rowId !== row.id || resizePreview.separatorIndex !== separatorIndex) {
            // Calcul normal basé sur les tailles du store
            let position = 0;
            for (let i = 0; i < separatorIndex - 1; i++) {
                position += (row.areas[i]?.size || 0) * totalWidth;
            }
            return position;
        }

        // Calcul basé sur la preview locale
        const { t } = resizePreview;
        const areaIndex = separatorIndex - 1;
        
        if (areaIndex < 0 || areaIndex >= row.areas.length - 1) {
            return 0;
        }

        const area1 = row.areas[areaIndex];
        const area2 = row.areas[areaIndex + 1];
        
        if (!area1 || !area2) {
            return 0;
        }

        // Calculer la position en fonction de la preview
        let position = 0;
        for (let i = 0; i < areaIndex; i++) {
            position += (row.areas[i]?.size || 0) * totalWidth;
        }
        position += (area1.size || 0) * totalWidth * t;
        
        return position;
    }, [resizePreview]);

    return {
        resizePreview,
        setResizePreview,
        useOptimizedSizes,
        getSeparatorPosition,
        calculateSizesFromPreview,
        normalizeSizes
    };
}; 
