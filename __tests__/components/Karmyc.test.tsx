import React, { useContext } from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { Karmyc } from '../../src/components/Karmyc';
import { useKarmycStore, initializeKarmycStore } from '../../src/store/areaStore';
import { TestWrapper, TestComponent } from '../__mocks__/testWrappers';
import { createTestStore, resetStore } from '../__mocks__/store';
import { createTestArea } from '../__mocks__/testUtils';
import { useRegisterAreaType } from '../../src/hooks/useRegisterAreaType';
import { AREA_ROLE } from '../../src/types/actions';
import { KarmycContext } from '../../src/providers/KarmycProvider';

const TestAreaComponent: React.FC = () => {
  return <div data-testid="test-area">Test Area</div>;
};

const TestAreaInitializer: React.FC = () => {
  useRegisterAreaType(
    'test-area',
    TestAreaComponent,
    {},
    {
      displayName: 'Test Area',
      defaultSize: { width: 300, height: 200 },
      role: AREA_ROLE.LEAD
    }
  );
  return null;
};

const TestContextConsumer: React.FC = () => {
  const context = useContext(KarmycContext);
  return <div data-testid="context-consumer">{context ? 'Context available' : 'Context not available'}</div>;
};

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
