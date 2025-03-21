import { AnyAction } from '@reduxjs/toolkit';
import { THistoryChange, THistoryDiff } from '../types/history';

/**
 * Génère une différence entre deux états
 * @param prevState État précédent
 * @param nextState État suivant
 * @param action Action qui a causé le changement
 * @returns Différence générée
 */
export function generateDiff(
  prevState: Record<string, any>,
  nextState: Record<string, any>,
  action: AnyAction
): THistoryDiff {
  const diff: THistoryDiff = {
    timestamp: Date.now(),
    actionType: action.type,
    changes: [],
  };

  // Fonction récursive pour générer les différences avec chemins
  function generateChanges(
    prev: any,
    next: any,
    currentPath: string[] = []
  ): THistoryChange[] {
    const changes: THistoryChange[] = [];

    if (typeof prev !== typeof next || 
        (typeof prev === 'object' && prev !== null && next !== null)) {
      if (Array.isArray(prev) && Array.isArray(next)) {
        // Gestion des tableaux
        const maxLength = Math.max(prev.length, next.length);
        for (let i = 0; i < maxLength; i++) {
          if (i >= prev.length || i >= next.length) {
            changes.push({
              path: [...currentPath, i.toString()],
              oldValue: i >= prev.length ? undefined : prev[i],
              newValue: i >= next.length ? undefined : next[i],
            });
          } else {
            changes.push(...generateChanges(prev[i], next[i], [...currentPath, i.toString()]));
          }
        }
      } else if (typeof prev === 'object' && prev !== null && next !== null) {
        // Gestion des objets
        const allKeys = new Set([...Object.keys(prev), ...Object.keys(next)]);
        for (const key of allKeys) {
          if (!(key in prev) || !(key in next)) {
            changes.push({
              path: [...currentPath, key],
              oldValue: key in prev ? prev[key] : undefined,
              newValue: key in next ? next[key] : undefined,
            });
          } else {
            changes.push(...generateChanges(prev[key], next[key], [...currentPath, key]));
          }
        }
      } else {
        // Valeurs primitives
        changes.push({
          path: currentPath,
          oldValue: prev,
          newValue: next,
        });
      }
    }

    return changes;
  }

  diff.changes = generateChanges(prevState, nextState);
  return diff;
}

/**
 * Applique une différence à un état
 * @param state État actuel
 * @param diff Différence à appliquer
 * @returns Nouvel état avec la différence appliquée
 */
export function applyDiff(
  state: Record<string, any>,
  diff: THistoryDiff
): Record<string, any> {
  const newState = { ...state };
  
  diff.changes.forEach(change => {
    let current = newState;
    for (let i = 0; i < change.path.length - 1; i++) {
      const key = change.path[i];
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }
    const lastKey = change.path[change.path.length - 1];
    current[lastKey] = change.oldValue;
  });

  return newState;
}

/**
 * Inverse une différence
 * @param diff Différence à inverser
 * @returns Différence inversée
 */
export function invertDiff(diff: THistoryDiff): THistoryDiff {
  return {
    ...diff,
    changes: diff.changes.map(change => ({
      ...change,
      oldValue: change.newValue,
      newValue: change.oldValue,
    })),
  };
} 
