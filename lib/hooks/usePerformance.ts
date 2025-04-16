import { useCallback, useEffect, useState } from 'react';
import { Area } from '../types/area';
import { AreaWithMetadata, PerformanceMetrics } from '../types/store';
import { useAppSelector } from './index';

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
    // Utiliser any pour éviter les problèmes de type avec l'état
    const areas = useAppSelector<Area[]>((state: any) => {
        // Gérer les différentes structures possibles de l'état
        return state.area?.present?.areas || state.area?.areas || [];
    });

    const actions = useAppSelector<HistoryAction[]>((state: any) => {
        return state.history?.actions || [];
    });

    // Calculer les metrics manuellement
    const areasWithPerformance: AreaWithMetadata[] = areas.map((area: Area) => {
        const areaActions = actions.filter((a: HistoryAction) => a.metadata?.areaId === area.id);
        const lastAction = areaActions[areaActions.length - 1];

        return {
            ...area,
            isActive: false,
            hasChanges: area.lastModified > Date.now() - 5 * 60 * 1000,
            dependencies: area.dependencies?.map((id: string) => ({ id, name: '' })) || [],
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
