import { StateWithHistory } from 'redux-undo';
import { AreaState } from './area';
import { ContextMenuState } from './contextMenu';
import { HistoryState } from './history';
import { ProjectState } from './project';

/**
 * Interface de base pour tous les slices
 */
export interface IBaseSlice {
  // Propriétés communes à tous les slices
}

/**
 * État racine de l'application
 */
export interface IRootState {
  area: AreaState & IBaseSlice;
  contextMenu: ContextMenuState & IBaseSlice;
  history: HistoryState & IBaseSlice;
  [key: string]: IBaseSlice;
  // Autres slices à ajouter ici
}

/**
 * Options pour la création du store
 */
export interface IStoreOptions {
  preloadedState?: Partial<IRootState>;
  enablePersistence?: boolean;
  persistenceKey?: string;
  enableHistory?: boolean;
  maxHistorySize?: number;
  devTools?: boolean;
}

/**
 * Type pour le dispatch de l'application
 */
export type AppDispatch = any; // Sera remplacé par le type réel une fois le store implémenté

export interface RootState {
  area: StateWithHistory<AreaState>;
  project: ProjectState;
  contextMenu: ContextMenuState;
  history: HistoryState;
  _persist?: {
    rehydrated: boolean;
  };
}

export interface AreaWithMetadata {
  id: string;
  name: string;
  lastModified: number;
  isActive: boolean;
  hasChanges: boolean;
  dependencies?: Array<{ id: string; name: string }>;
  performance?: {
    actionCount: number;
    lastActionTime?: number;
    averageActionTime: number;
  };
}

export interface ProjectWithStats {
  id: string;
  name: string;
  status: 'active' | 'archived';
  areas: Array<{ id: string; name: string }>;
  createdAt: number;
  usageStats: {
    totalActions: number;
    uniqueUsers: number;
    lastActivity?: number;
    averageActionsPerDay: number;
  };
}

export interface ActionStats {
  type: string;
  count: number;
  percentage: number;
}

export interface PerformanceMetrics {
  averageActionTime: number;
  totalActions: number;
  activeUsers: number;
} 
