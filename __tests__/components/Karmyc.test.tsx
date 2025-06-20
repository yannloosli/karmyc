import { render, waitFor } from '@testing-library/react';
import { TestComponent } from '../__mocks__/testWrappers';
import { useKarmycStore } from '../../src/core/store';
import React from 'react';

describe('Karmyc Component', () => {
  it('should handle empty initial areas', async () => {
    render(<TestComponent initialAreas={[]} />);

    await waitFor(() => {
      const state = useKarmycStore.getState();
      const activeScreenAreas = state.screens[state.activeScreenId].areas;
      expect(Object.keys(activeScreenAreas.areas)).toHaveLength(0);
    });
  });

}); 
