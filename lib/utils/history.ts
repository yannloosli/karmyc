import { RootState } from '../store';

export interface IStateDiff {
    path: string[];
    oldValue: unknown;
    newValue: unknown;
}

export function generateDiff(prevState: RootState, nextState: RootState): IStateDiff[] {
    const diffs: IStateDiff[] = [];

    function compareValues(path: string[], prev: unknown, next: unknown) {
        if (prev === next) return;

        if (typeof prev !== typeof next) {
            diffs.push({ path, oldValue: prev, newValue: next });
            return;
        }

        if (typeof prev === 'object' && prev !== null && next !== null) {
            // Ensure prev and next are non-null objects before using Object.keys
            const prevObj = prev as Record<string, unknown>;
            const nextObj = next as Record<string, unknown>;

            const prevKeys = Object.keys(prevObj);
            const nextKeys = Object.keys(nextObj);

            // Check removed keys
            prevKeys.forEach(key => {
                if (!nextKeys.includes(key)) {
                    diffs.push({
                        path: [...path, key],
                        oldValue: prevObj[key],
                        newValue: undefined,
                    });
                }
            });

            // Check added or modified keys
            nextKeys.forEach(key => {
                if (!prevKeys.includes(key)) {
                    diffs.push({
                        path: [...path, key],
                        oldValue: undefined,
                        newValue: nextObj[key],
                    });
                } else {
                    compareValues(
                        [...path, key],
                        prevObj[key],
                        nextObj[key]
                    );
                }
            });
        } else {
            diffs.push({ path, oldValue: prev, newValue: next });
        }
    }

    compareValues([], prevState, nextState);
    return diffs;
}

export function getValueAtPath(state: RootState, path: string[]): unknown {
    return path.reduce((obj, key) => (obj as Record<string, unknown>)[key], state);
} 
