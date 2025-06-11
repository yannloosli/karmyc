import { THistoryDiff } from '../types/historyTypes';
export interface IStateDiff {
    path: string[];
    oldValue: unknown;
    newValue: unknown;
}
export declare function generateDiff(prevState: any, nextState: any): IStateDiff[];
export declare function getValueAtPath(state: any, path: string[]): unknown;
export declare function applyDiff<T>(state: T, diff: THistoryDiff): T;
export declare function invertDiff(diff: THistoryDiff): THistoryDiff;
