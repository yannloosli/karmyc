export interface IState {
    id: string;
    type: string;
    name: string;
    description?: string;
    data: Record<string, any>;
    metadata?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
    transitions?: string[];
    parentId?: string;
}
export interface IStateConfig {
    maxStates: number;
    autoSave: boolean;
    saveInterval: number;
}
export interface IStateState {
    states: Record<string, Omit<IState, 'id'>>;
    activeStateId: string | null;
    stateConfig: IStateConfig;
    errors: string[];
    loading: {
        [key: string]: boolean;
    };
}
export interface IStateTransition {
    from: string;
    to: string;
    condition?: (state: IState) => boolean;
    action?: (state: IState, data?: any) => void;
}
