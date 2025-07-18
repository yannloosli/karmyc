import { IAction } from '../core/types/actions';

// ============================================================================
// TYPES LEGACY (à déprécier progressivement)
// ============================================================================

/**
 * Options for the history system (LEGACY)
 * @deprecated Use EnhancedHistoryOptions instead
 */
export interface IHistoryOptions {
    limit?: number;
    undoType?: string;
    redoType?: string;
    clearHistoryType?: string;
    jumpToFutureType?: string;
    jumpToPastType?: string;
    includeActions?: string[];
    excludeActions?: string[];
    groupBy?: (action: IAction) => string;
}

/**
 * State with history (LEGACY)
 * @deprecated Use EnhancedHistoryState instead
 */
export interface THistoryState<T> {
    past: T[];
    present: T;
    future: T[];
}

/**
 * Représente un changement dans l'historique (LEGACY)
 * @deprecated Use Diff interface instead
 */
export interface THistoryChange {
    path: string[];
    oldValue: any;
    newValue: any;
}

/**
 * Difference between two states (LEGACY)
 * @deprecated Use EnhancedHistoryAction instead
 */
export interface THistoryDiff {
    timestamp: number;
    actionType: string;
    changes: THistoryChange[];
}

/**
 * History action with metadata (LEGACY)
 * @deprecated Use EnhancedHistoryAction instead
 */
export interface THistoryAction {
    id: string;
    type: string;
    timestamp: number;
    diffs: THistoryChange[];
    metadata?: Record<string, any>;
}

/**
 * History system state (LEGACY)
 * @deprecated Use EnhancedHistoryState instead
 */
export interface IHistoryState {
    actions: THistoryAction[];
    currentIndex: number;
    isUndoing: boolean;
    isRedoing: boolean;
}

/**
 * Options for the undoable reducer (LEGACY)
 * @deprecated Use EnhancedHistoryOptions instead
 */
export type TUndoableOptions = Omit<IHistoryOptions, 'groupBy'>;

export interface HistoryAction {
    id: string;
    type: string;
    timestamp: number;
    diffs: Array<{
        path: string[];
        oldValue: any;
        newValue: any;
    }>;
    metadata?: {
        areaId?: string;
        projectId?: string;
        userId?: string;
        duration?: number;
    };
}

export interface HistoryState {
    actions: HistoryAction[];
    currentIndex: number;
    isUndoing: boolean;
    isRedoing: boolean;
}

/**
 * Configuration de l'historique (LEGACY)
 * @deprecated Use EnhancedHistoryConfig instead
 */
export interface HistoryConfig<S = any> {
    maxHistorySize?: number;
    filter?: (action: IAction, currentState: S, previousHistory: any) => boolean;
    groupBy?: (action: IAction) => string;
}

// ============================================================================
// NOUVEAUX TYPES ENHANCED (SYSTÈME ROBUSTE)
// ============================================================================

/**
 * Diff typé pour la granularité fine des actions
 * Inspiré du système de l'éditeur d'animation
 */
export interface Diff {
    type: string;
    path: string[];
    oldValue: any;
    newValue: any;
    metadata?: {
        allowIndexShift?: boolean;
        modifiedRelated?: boolean;
        [key: string]: any;
    };
}

/**
 * Action d'historique améliorée avec capture d'état complet
 * Inspirée du système robuste de l'éditeur d'animation
 */
export interface EnhancedHistoryAction {
    id: string;
    name: string;
    timestamp: number;
    
    // Diffs typés pour granularité fine
    diffs: Diff[];
    
    // État complet capturé pour robustesse
    state: any;
    
    // Support des sélections
    allowIndexShift: boolean;
    modifiedRelated: boolean;
    
    // Métadonnées enrichies
    metadata: {
        actionType: string;
        payload?: Record<string, any>;
        areaId?: string;
        projectId?: string;
        userId?: string;
        duration?: number;
        [key: string]: any;
    };
    
    // Direction pour navigation
    indexDirection: -1 | 1;
}

/**
 * État d'historique amélioré avec gestion des actions en cours
 */
export interface EnhancedHistoryState<T = any> {
    // État actuel pour performance
    current: T;
    
    // Historique robuste
    history: EnhancedHistoryAction[];
    index: number;
    
    // Gestion des actions en cours
    isActionInProgress: boolean;
    currentActionId: string | null;
    
    // Type d'action (normal ou sélection)
    type: 'normal' | 'selection';
    
    // Direction pour navigation
    indexDirection: -1 | 1;
}

/**
 * État partagé d'espace amélioré avec système d'historique robuste
 */
export interface EnhancedSpaceSharedState {
    // État actuel pour performance
    currentState: any;
    
    // Historique robuste
    pastActions: EnhancedHistoryAction[];
    futureActions: EnhancedHistoryAction[];
    
    // Gestion des actions en cours
    isActionInProgress: boolean;
    currentActionId: string | null;
    
    // Métadonnées pour granularité
    actionMetadata: Record<string, any>;
    
    // Support des sélections
    selectionState?: {
        allowIndexShift: boolean;
        modifiedRelated: boolean;
        type: 'normal' | 'selection';
    };
    
    // Notifications de changements
    subscribers: Array<(action: EnhancedHistoryAction) => void>;
}

/**
 * Options pour le système d'historique amélioré
 */
export interface EnhancedHistoryOptions {
    enabled?: boolean;
    maxHistorySize?: number;
    captureState?: boolean;
    enableNotifications?: boolean;
    enableSelections?: boolean;
    filter?: (action: EnhancedHistoryAction) => boolean;
}

/**
 * Configuration pour le système d'historique amélioré
 */
export interface EnhancedHistoryConfig {
    maxHistorySize?: number;
    captureState?: boolean;
    enableNotifications?: boolean;
    enableSelections?: boolean;
    filter?: (action: EnhancedHistoryAction) => boolean;
    groupBy?: (action: EnhancedHistoryAction) => string;
}

/**
 * Callback pour les notifications d'historique
 */
export type HistorySubscriber = (action: EnhancedHistoryAction) => void;

/**
 * Callback pour les filtres d'historique
 */
export type HistoryFilter = (action: EnhancedHistoryAction) => boolean;

/**
 * Callback pour le groupement d'historique
 */
export type HistoryGrouper = (action: EnhancedHistoryAction) => string;

// ============================================================================
// TYPES UTILITAIRES
// ============================================================================

/**
 * Résultat d'une opération d'historique
 */
export interface HistoryResult {
    success: boolean;
    action?: EnhancedHistoryAction;
    error?: string;
    metadata?: Record<string, any>;
}

/**
 * Statistiques d'historique
 */
export interface HistoryStats {
    totalActions: number;
    pastActions: number;
    futureActions: number;
    memoryUsage: number;
    lastActionTime: number;
    averageActionDuration: number;
}

/**
 * Événements d'historique
 */
export type HistoryEvent = 
    | 'action-started'
    | 'action-submitted'
    | 'action-cancelled'
    | 'undo-performed'
    | 'redo-performed'
    | 'history-cleared'
    | 'state-restored';

/**
 * Payload pour les événements d'historique
 */
export interface HistoryEventPayload {
    event: HistoryEvent;
    action?: EnhancedHistoryAction;
    timestamp: number;
    metadata?: Record<string, any>;
}

// ============================================================================
// CONSTANTES
// ============================================================================

/**
 * Types d'actions d'historique prédéfinis
 */
export const HISTORY_ACTION_TYPES = {
    // Actions de base
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    MOVE: 'MOVE',
    COPY: 'COPY',
    PASTE: 'PASTE',
    
    // Actions de sélection
    SELECT: 'SELECT',
    DESELECT: 'DESELECT',
    SELECT_ALL: 'SELECT_ALL',
    DESELECT_ALL: 'DESELECT_ALL',
    
    // Actions de groupe
    GROUP: 'GROUP',
    UNGROUP: 'UNGROUP',
    
    // Actions de transformation
    TRANSFORM: 'TRANSFORM',
    ROTATE: 'ROTATE',
    SCALE: 'SCALE',
    TRANSLATE: 'TRANSLATE',
    
    // Actions de timeline
    TIMELINE_UPDATE: 'TIMELINE_UPDATE',
    KEYFRAME_ADD: 'KEYFRAME_ADD',
    KEYFRAME_REMOVE: 'KEYFRAME_REMOVE',
    KEYFRAME_UPDATE: 'KEYFRAME_UPDATE',
    
    // Actions personnalisées
    CUSTOM: 'CUSTOM',
} as const;

/**
 * Types d'événements d'historique
 */
export const HISTORY_EVENTS = {
    ACTION_STARTED: 'action-started',
    ACTION_SUBMITTED: 'action-submitted',
    ACTION_CANCELLED: 'action-cancelled',
    UNDO_PERFORMED: 'undo-performed',
    REDO_PERFORMED: 'redo-performed',
    HISTORY_CLEARED: 'history-cleared',
    STATE_RESTORED: 'state-restored',
} as const;

/**
 * Configuration par défaut
 */
export const DEFAULT_HISTORY_CONFIG: EnhancedHistoryConfig = {
    maxHistorySize: 100,
    captureState: true,
    enableNotifications: true,
    enableSelections: true,
    filter: () => true,
    groupBy: (action) => action.metadata.actionType,
}; 
