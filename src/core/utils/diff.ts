
export interface Diff {
  path: string[];
  oldValue: any;
  newValue: any;
  type: 'add' | 'remove' | 'update';
}

export function generateDiff(oldState: any, newState: any): Diff[] {
  const diffs: Diff[] = [];

  function compareValues(path: string[], oldValue: any, newValue: any) {
    if (oldValue === newValue) return;

    if (Array.isArray(oldValue) && Array.isArray(newValue)) {
      // Comparer les tableaux
      const maxLength = Math.max(oldValue.length, newValue.length);
      for (let i = 0; i < maxLength; i++) {
        if (i >= oldValue.length) {
          diffs.push({
            path: [...path, i.toString()],
            oldValue: undefined,
            newValue: newValue[i],
            type: 'add',
          });
          continue;
        }
        if (i >= newValue.length) {
          diffs.push({
            path: [...path, i.toString()],
            oldValue: oldValue[i],
            newValue: undefined,
            type: 'remove',
          });
          continue;
        }
        compareValues([...path, i.toString()], oldValue[i], newValue[i]);
      }
    } else if (typeof oldValue === 'object' && oldValue !== null && 
               typeof newValue === 'object' && newValue !== null) {
      // Comparer les objets
      const allKeys = new Set([...Object.keys(oldValue), ...Object.keys(newValue)]);
      for (const key of allKeys) {
        if (!(key in oldValue)) {
          diffs.push({
            path: [...path, key],
            oldValue: undefined,
            newValue: newValue[key],
            type: 'add',
          });
          continue;
        }
        if (!(key in newValue)) {
          diffs.push({
            path: [...path, key],
            oldValue: oldValue[key],
            newValue: undefined,
            type: 'remove',
          });
          continue;
        }
        compareValues([...path, key], oldValue[key], newValue[key]);
      }
    } else {
      // Comparer les valeurs primitives
      diffs.push({
        path,
        oldValue,
        newValue,
        type: 'update',
      });
    }
  }

  compareValues([], oldState, newState);
  return diffs;
}

export function applyDiff(state: any, diff: Diff): any {
  let current = state;
  for (let i = 0; i < diff.path.length - 1; i++) {
    current = current[diff.path[i]];
    if (current === undefined) {
      current = {};
    }
  }

  const lastKey = diff.path[diff.path.length - 1];
  if (diff.type === 'remove') {
    delete current[lastKey];
  } else {
    current[lastKey] = diff.newValue;
  }

  return state;
} 
