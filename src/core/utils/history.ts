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
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next);

      // Vérifier les clés supprimées
      prevKeys.forEach(key => {
        if (!nextKeys.includes(key)) {
          diffs.push({
            path: [...path, key],
            oldValue: (prev as Record<string, unknown>)[key],
            newValue: undefined,
          });
        }
      });

      // Vérifier les clés ajoutées ou modifiées
      nextKeys.forEach(key => {
        if (!prevKeys.includes(key)) {
          diffs.push({
            path: [...path, key],
            oldValue: undefined,
            newValue: (next as Record<string, unknown>)[key],
          });
        } else {
          compareValues(
            [...path, key],
            (prev as Record<string, unknown>)[key],
            (next as Record<string, unknown>)[key]
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
