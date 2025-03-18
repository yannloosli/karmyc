
export interface DiffParams {
    resizeAreas: () => void;
}

export interface ListenerParams {
    repeated: (eventName: string, callback: (e: MouseEvent) => void) => void;
    once: (eventName: string, callback: (e: MouseEvent) => void) => void;
}

export interface RequestActionParams {
    dispatch: (action: any) => void;
    submitAction: (description: string) => void;
    cancelAction: () => void;
    addListener: ListenerParams;
    addDiff: (callback: (diff: DiffParams) => void) => void;
    performDiff: (callback: (diff: DiffParams) => void) => void;
}

export type RequestActionCallback = (params: RequestActionParams) => void; 
