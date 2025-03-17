import { RootState } from '../index';
import {
    selectActiveDiff,
    selectDiffById,
    selectDiffs,
    selectFilteredStates,
    selectStateById,
    selectStateMetrics,
    selectStates,
    selectStatesByType,
    selectStateValidation,
    selectStateWithDiffs
} from '../selectors';

// État de test
const mockState: RootState = {
  state: {
    states: {
      'state-1': {
        id: 'state-1',
        type: 'draft',
        data: {
          isComplete: true,
          hasErrors: false,
          updateCount: 5,
          transitionCount: 2
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      },
      'state-2': {
        id: 'state-2',
        type: 'review',
        data: {
          reviewStatus: 'completed',
          reviewResult: 'approved',
          updateCount: 3,
          transitionCount: 1
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      }
    }
  },
  diff: {
    diffs: [
      {
        id: 'diff-1',
        target: 'state-1',
        changes: []
      }
    ],
    activeDiffId: 'diff-1'
  },
  toolbar: {
    items: [],
    activeTool: null
  }
};

describe('Sélecteurs d\'État', () => {
  test('selectStates retourne tous les états', () => {
    const result = selectStates(mockState);
    expect(result).toEqual(mockState.state.states);
  });

  test('selectStateById retourne l\'état spécifique', () => {
    const result = selectStateById(mockState, 'state-1');
    expect(result).toEqual(mockState.state.states['state-1']);
  });

  test('selectStatesByType filtre les états par type', () => {
    const result = selectStatesByType(mockState, 'draft');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('state-1');
  });
});

describe('Sélecteurs de Diff', () => {
  test('selectDiffs retourne toutes les diffs', () => {
    const result = selectDiffs(mockState);
    expect(result).toEqual(mockState.diff.diffs);
  });

  test('selectActiveDiff retourne la diff active', () => {
    const result = selectActiveDiff(mockState);
    expect(result).toEqual(mockState.diff.diffs[0]);
  });

  test('selectDiffById retourne la diff spécifique', () => {
    const result = selectDiffById(mockState, 'diff-1');
    expect(result).toEqual(mockState.diff.diffs[0]);
  });
});

describe('Sélecteurs Composites', () => {
  test('selectStateWithDiffs combine l\'état et ses diffs', () => {
    const result = selectStateWithDiffs(mockState, 'state-1');
    expect(result).toEqual({
      ...mockState.state.states['state-1'],
      diffs: [mockState.diff.diffs[0]]
    });
  });
});

describe('Sélecteurs de Validation', () => {
  test('selectStateValidation valide un état draft valide', () => {
    const result = selectStateValidation(mockState, 'state-1');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('selectStateValidation détecte les erreurs dans un état draft', () => {
    const invalidState = {
      ...mockState,
      state: {
        states: {
          'state-1': {
            ...mockState.state.states['state-1'],
            data: {
              isComplete: false,
              hasErrors: true
            }
          }
        }
      }
    };
    const result = selectStateValidation(invalidState, 'state-1');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Le brouillon n\'est pas complet');
    expect(result.errors).toContain('Le brouillon contient des erreurs');
  });
});

describe('Sélecteurs de Performance', () => {
  test('selectStateMetrics calcule les métriques correctement', () => {
    const result = selectStateMetrics(mockState, 'state-1');
    expect(result).toEqual({
      age: expect.any(Number),
      updateCount: 5,
      lastUpdate: '2024-01-02T00:00:00Z',
      transitionCount: 2
    });
  });
});

describe('Sélecteurs de Filtrage', () => {
  test('selectFilteredStates filtre les états selon les critères', () => {
    const result = selectFilteredStates(mockState, { type: 'draft' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('state-1');
  });

  test('selectFilteredStates retourne un tableau vide si aucun état ne correspond', () => {
    const result = selectFilteredStates(mockState, { type: 'invalid' });
    expect(result).toHaveLength(0);
  });
}); 
