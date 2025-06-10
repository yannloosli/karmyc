import { act } from '@testing-library/react';
import { useKarmycStore } from '../../src/store/areaStore';
import { useSpaceStore } from '../../src/store/spaceStore';
import { IKarmycOptions } from '../../src/types/karmyc';

export const resetKarmycStore = () => {
  act(() => {
    useKarmycStore.setState({
      screens: {
        main: {
          areas: {
            _id: 0,
            rootId: null,
            errors: [],
            activeAreaId: null,
            joinPreview: null,
            layout: {},
            areas: {},
            viewports: {},
            areaToOpen: null,
            lastSplitResultData: null,
            lastLeadAreaId: null
          }
        }
      },
      activeScreenId: 'main',
      options: {
        resizableAreas: true,
        manageableAreas: true,
        multiScreen: true,
        builtInLayouts: []
      } as IKarmycOptions
    });
  });
};

export const resetSpaceStore = () => {
  act(() => {
    useSpaceStore.setState({
      spaces: {},
      activeSpaceId: null,
      openSpaceIds: [],
      pilotMode: 'MANUAL',
      errors: []
    });
  });
};

export const createTestArea = (overrides = {}) => ({
  type: 'test-area',
  role: 'LEAD',
  state: {},
  ...overrides
});

export const createTestSpace = (overrides = {}) => ({
  name: 'test-space',
  sharedState: { color: '#ff0000' },
  ...overrides
});

export const assertStoreState = (store: any, assertions: Record<string, any>) => {
  Object.entries(assertions).forEach(([path, expectedValue]) => {
    const actualValue = path.split('.').reduce((obj, key) => obj?.[key], store.getState());
    expect(actualValue).toEqual(expectedValue);
  });
}; 
