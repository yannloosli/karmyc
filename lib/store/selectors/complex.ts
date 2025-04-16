import { createSelector } from '@reduxjs/toolkit';
import { Area } from '../../types/area';
import { HistoryAction } from '../../types/history';
import { ActionStats, AreaWithMetadata, RootState } from '../../types/store';

/**
 * Selector to get active areas with their metadata
 */
export const selectActiveAreasWithMetadata = createSelector(
    [(state: RootState) => state.area.present.areas, (state: RootState) => state.area.present.activeAreaId],
    (areas: Area[], activeAreaId: string | null): AreaWithMetadata[] => areas.map(area => ({
        ...area,
        isActive: area.id === activeAreaId,
        hasChanges: area.lastModified > Date.now() - 5 * 60 * 1000,
        dependencies: area.dependencies?.map(id => ({ id, name: '' })) || [],
    }))
);

/**
 * Selector to get action usage statistics
 */
export const selectActionUsageStats = createSelector(
    [(state: RootState) => state.history.actions],
    (actions: HistoryAction[]): ActionStats[] => {
        const stats = actions.reduce((acc: Record<string, number>, action: HistoryAction) => {
            acc[action.type] = (acc[action.type] || 0) + 1;
            return acc;
        }, {});

        return Object.entries(stats).map(([type, count]) => ({
            type,
            count,
            percentage: (count / actions.length) * 100,
        }));
    }
);

/**
 * Selector to get areas with their performance metrics
 */
export const selectAreasWithPerformance = createSelector(
    [(state: RootState) => state.area.present.areas, (state: RootState) => state.history.actions],
    (areas: Area[], actions: HistoryAction[]): AreaWithMetadata[] => areas.map(area => {
        const areaActions = actions.filter((a: HistoryAction) => a.metadata?.areaId === area.id);
        const lastAction = areaActions[areaActions.length - 1];

        return {
            ...area,
            isActive: false,
            hasChanges: false,
            dependencies: area.dependencies?.map(id => ({ id, name: '' })) || [],
            performance: {
                actionCount: areaActions.length,
                lastActionTime: lastAction?.timestamp,
                averageActionTime: areaActions.length ?
                    areaActions.reduce((acc: number, a: HistoryAction) => acc + (a.metadata?.duration || 0), 0) / areaActions.length :
                    0,
            },
        };
    })
);
