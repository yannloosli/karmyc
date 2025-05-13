import { useCallback, useEffect, useState } from 'react';
// Import the correct Area type from areaTypes
import { Area } from '../types/areaTypes';
import { AreaWithMetadata, PerformanceMetrics } from '../types/store';
// Import Area store hook
import { useAreaStore } from '../stores/areaStore';
// TODO: Refactor to use performanceMiddleware/performanceMonitor data instead of Redux history

// Type pour les actions de l'historique
interface HistoryAction {
    type: string;
    timestamp?: number;
    metadata?: {
        areaId?: string;
        duration?: number;
    };
}

export function usePerformance() {
    // Get areas directly from the Zustand store
    // Use the correct Area type from areaTypes. Cast to Area<any> for simplicity here.
    const areas = useAreaStore((state) => Object.values(state.areas)) as Area<any>[];

    // TODO: Refactorer pour utiliser les données performanceMiddleware/performanceMonitor au lieu de l'historique Zustand
    const actions: HistoryAction[] = []; // Placeholder - No direct equivalent in Zustand stores found

    // TODO: Remplacer l'accès à l'historique Zustand par les données du moniteur/middleware de performance

    // Calculer les metrics manuellement
    const areasWithPerformance: AreaWithMetadata[] = areas.map((area: Area<any>) => {
        const areaActions = actions.filter((a: HistoryAction) => a.metadata?.areaId === area.id);
        const lastAction = areaActions[areaActions.length - 1];

        return {
            ...area,
            isActive: false,
            name: `Area ${area.id}`,
            lastModified: 0,
            hasChanges: false,
            dependencies: [],
            performance: {
                actionCount: areaActions.length,
                lastActionTime: lastAction?.timestamp,
                averageActionTime: areaActions.length ?
                    areaActions.reduce((acc: number, a: HistoryAction) => acc + (a.metadata?.duration || 0), 0) / areaActions.length :
                    0,
            },
        };
    });

    const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
        averageActionTime: 0,
        totalActions: 0,
        activeUsers: 0,
    });

    useEffect(() => {
        // Calculate performance metrics
        const divisor = areasWithPerformance.length || 1; // Éviter division par zéro
        const metrics: PerformanceMetrics = {
            averageActionTime: areasWithPerformance.reduce((acc: number, area: AreaWithMetadata) =>
                acc + (area.performance?.averageActionTime || 0), 0) / divisor,
            totalActions: areasWithPerformance.reduce((acc: number, area: AreaWithMetadata) =>
                acc + (area.performance?.actionCount || 0), 0),
            activeUsers: areasWithPerformance.filter((area: AreaWithMetadata) => area.isActive).length,
        };

        setPerformanceMetrics(metrics);
    }, [areasWithPerformance]);

    const getAreaPerformance = useCallback((areaId: string) => {
        return areasWithPerformance.find((area: AreaWithMetadata) => area.id === areaId)?.performance;
    }, [areasWithPerformance]);

    return {
        performanceMetrics,
        getAreaPerformance,
    };
} 
