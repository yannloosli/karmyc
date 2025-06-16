import type { RootStateType } from '../../src/core/store';
import { createTestStore } from './store';
import { IArea } from '../../src/types/areaTypes';
import { AreaTypeValue } from '../../src/core/types/actions';

export const waitForStateChange = async (
  store: ReturnType<typeof createTestStore>,
  predicate: (state: RootStateType) => boolean,
  timeout = 2000
) => {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (predicate(store.getState())) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw new Error('Timeout waiting for state change');
};

export const createTestArea = (overrides = {}): IArea<AreaTypeValue> => ({
  id: `test-area-${Math.random().toString(36).substr(2, 9)}`,
  type: 'test-area',
  role: 'LEAD',
  state: {},
  ...overrides
});

export const createTestLayout = (overrides = {}) => ({
  id: `layout-${Math.random().toString(36).substr(2, 9)}`,
  type: 'area_row',
  areas: [],
  ...overrides
}); 
