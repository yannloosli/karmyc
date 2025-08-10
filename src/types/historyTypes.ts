// Legacy history types removed as part of hard clean.

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
 * History configuration (LEGACY)
 * @deprecated Use EnhancedHistoryConfig instead
 */
export interface HistoryConfig<S = any> {
    maxHistorySize?: number;
    filter?: (action: IAction, currentState: S, previousHistory: any) => boolean;
    groupBy?: (action: IAction) => string;
}

// ============================================================================
// NEW ENHANCED TYPES (ROBUST SYSTEM)
// ============================================================================

/**
 * Typed diff for fine-grained actions
 * Inspired by the animation editor system
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
 * Enhanced history action with full state capture
 * Inspired by the robust animation editor system
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
 * Enhanced history state with in-progress action management
 */
export interface EnhancedHistoryState<T = any> {
     // Current state for performance
    current: T;
    
     // Robust history
    history: EnhancedHistoryAction[];
    index: number;
    
     // In-progress action management
    isActionInProgress: boolean;
    currentActionId: string | null;
    
     // Action type (normal or selection)
    type: 'normal' | 'selection';
    
     // Navigation direction
    indexDirection: -1 | 1;
}

/**
 * Enhanced space shared state with robust history system
 */
export interface EnhancedSpaceSharedState {
     // Current state for performance
    currentState: any;
    
     // Robust history
    pastActions: EnhancedHistoryAction[];
    futureActions: EnhancedHistoryAction[];
    
     // In-progress action management
    isActionInProgress: boolean;
    currentActionId: string | null;
    
     // Metadata for granularity
    actionMetadata: Record<string, any>;
    
     // Selections support
    selectionState?: {
        allowIndexShift: boolean;
        modifiedRelated: boolean;
        type: 'normal' | 'selection';
    };
    
     // Change notifications
    subscribers: Array<(action: EnhancedHistoryAction) => void>;
}

/**
 * Options for the enhanced history system
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
 * Configuration for the enhanced history system
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
 * Callback for history notifications
 */
export type HistorySubscriber = (action: EnhancedHistoryAction) => void;

/**
 * Callback for history filters
 */
export type HistoryFilter = (action: EnhancedHistoryAction) => boolean;

/**
 * Callback for history grouping
 */
export type HistoryGrouper = (action: EnhancedHistoryAction) => string;

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Result of a history operation
 */
export interface HistoryResult {
    success: boolean;
    action?: EnhancedHistoryAction;
    error?: string;
    metadata?: Record<string, any>;
}

/**
 * History statistics
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
 * History events
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
 * Payload for history events
 */
export interface HistoryEventPayload {
    event: HistoryEvent;
    action?: EnhancedHistoryAction;
    timestamp: number;
    metadata?: Record<string, any>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Predefined history action types
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
 * History event types
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
 * Default configuration
 */
export const DEFAULT_HISTORY_CONFIG: EnhancedHistoryConfig = {
    maxHistorySize: 100,
    captureState: true,
    enableNotifications: true,
    enableSelections: true,
    filter: () => true,
    groupBy: (action) => action.metadata.actionType,
}; 
