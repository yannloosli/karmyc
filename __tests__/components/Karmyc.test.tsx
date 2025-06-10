import { render, waitFor } from '@testing-library/react';
import { TestComponent } from '../__mocks__/testWrappers';
import { createTestStore, resetStore } from '../__mocks__/store';

const karmycStore = createTestStore();

describe('Karmyc Component', () => {
  beforeEach(() => {
    resetStore(karmycStore);
  });

  it('should handle empty initial areas', async () => {
    render(<TestComponent initialAreas={[]} />);

    await waitFor(() => {
      const state = karmycStore.getState();
      const activeScreenAreas = state.screens[state.activeScreenId].areas;
      expect(Object.keys(activeScreenAreas.areas)).toHaveLength(0);
    });
  });

}); 
