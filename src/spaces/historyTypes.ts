export type THistoryDiff = {
    actionType: string;
    timestamp: number;
    payload?: any;
    changes: Record<string, any>;
}; 
