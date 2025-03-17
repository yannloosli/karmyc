import { createSelector } from '@reduxjs/toolkit';
import { Area } from '../../types/area';
import { HistoryAction } from '../../types/history';
import { Project } from '../../types/project';
import { ActionStats, AreaWithMetadata, ProjectWithStats, RootState } from '../../types/store';

/**
 * Sélecteur pour obtenir les zones actives avec leurs métadonnées
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
 * Sélecteur pour obtenir les statistiques des projets
 */
export const selectProjectStats = createSelector(
  [(state: RootState) => state.project.projects],
  (projects: Project[]): { totalProjects: number; activeProjects: number; totalAreas: number; averageAreasPerProject: number } => ({
    totalProjects: projects.length,
    activeProjects: projects.filter((p: Project) => p.status === 'active').length,
    totalAreas: projects.reduce((acc: number, p: Project) => acc + p.areas.length, 0),
    averageAreasPerProject: projects.length ? projects.reduce((acc: number, p: Project) => acc + p.areas.length, 0) / projects.length : 0,
  })
);

/**
 * Sélecteur pour obtenir les zones avec leurs dépendances
 */
export const selectAreasWithDependencies = createSelector(
  [(state: RootState) => state.area.present.areas, (state: RootState) => state.project.projects],
  (areas: Area[], projects: Project[]): AreaWithMetadata[] => areas.map(area => ({
    ...area,
    isActive: false,
    hasChanges: false,
    dependencies: projects
      .flatMap((p: Project) => p.areas)
      .filter((a: { id: string; dependencies?: string[] }) => a.dependencies?.includes(area.id))
      .map((a: { id: string; name: string }) => ({ id: a.id, name: a.name })),
  }))
);

/**
 * Sélecteur pour obtenir les statistiques d'utilisation des actions
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
 * Sélecteur pour obtenir les zones avec leurs performances
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

/**
 * Sélecteur pour obtenir les projets avec leurs statistiques d'utilisation
 */
export const selectProjectsWithUsageStats = createSelector(
  [(state: RootState) => state.project.projects, (state: RootState) => state.history.actions],
  (projects: Project[], actions: HistoryAction[]): ProjectWithStats[] => projects.map(project => {
    const projectActions = actions.filter((a: HistoryAction) => a.metadata?.projectId === project.id);
    
    return {
      ...project,
      usageStats: {
        totalActions: projectActions.length,
        uniqueUsers: new Set(projectActions.map((a: HistoryAction) => a.metadata?.userId)).size,
        lastActivity: projectActions[projectActions.length - 1]?.timestamp,
        averageActionsPerDay: projectActions.length ? 
          projectActions.length / ((Date.now() - project.createdAt) / (1000 * 60 * 60 * 24)) : 
          0,
      },
    };
  })
); 
