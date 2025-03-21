import { useCallback, useEffect, useState } from 'react';
import { selectAreasWithPerformance } from '../store/selectors/complex';
import { AreaWithMetadata, PerformanceMetrics } from '../types/store';
import { useAppSelector } from './index';

export function usePerformance() {
    const areasWithPerformance = useAppSelector<AreaWithMetadata[]>(selectAreasWithPerformance);

    const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
        averageActionTime: 0,
        totalActions: 0,
        activeUsers: 0,
    });

    useEffect(() => {
        // Calculer les métriques de performance
        const metrics: PerformanceMetrics = {
            averageActionTime: areasWithPerformance.reduce((acc: number, area: AreaWithMetadata) =>
                acc + (area.performance?.averageActionTime || 0), 0) / areasWithPerformance.length,
            totalActions: areasWithPerformance.reduce((acc: number, area: AreaWithMetadata) =>
                acc + (area.performance?.actionCount || 0), 0),
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
