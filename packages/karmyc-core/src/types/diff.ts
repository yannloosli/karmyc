export type DiffType = 'add' | 'remove' | 'update' | 'move' | 'replace' | 'resizeAreas';

export interface IDiffChange {
    path: string[];
    type: DiffType;
    oldValue?: any;
    newValue?: any;
    index?: number;
    newIndex?: number;
}

export interface IDiff {
    id: string;
    timestamp: number;
    type: string;
    changes: IDiffChange[];
    metadata?: Record<string, any>;
    source?: string;
    target?: string;
    resizeAreas?: () => void;
}

export interface IDiffConfig {
    maxHistory: number;
    autoSave: boolean;
    saveInterval: number;
}

export interface IDiffState {
    diffs: IDiff[];
    activeDiffId: string | null;
    diffConfig: IDiffConfig;
    errors: string[];
} 
