import { useKarmycStore } from '../../src/store/areaStore';
import { AreaRole } from '../../src/types/actions';
import { IArea } from '../../src/types/areaTypes';
import { AreaTypeValue } from '../../src/types/actions';
import { act } from '@testing-library/react';
import { createTestStore, resetStore } from '../__mocks__/store';
import { createTestArea, createTestLayout } from '../__mocks__/testUtils';
import { AreaRowLayout } from '../../src/types/areaTypes';

const karmycStore = createTestStore();

describe('Area Management Actions', () => {
  beforeEach(() => {
    act(() => {
      resetStore(karmycStore);
    });
  });

  describe('Area Operations', () => {
    it('should add a new area', () => {
      const newArea: IArea<AreaTypeValue> = {
        id: 'test-area-1',
        type: 'test-area',
        role: 'LEAD' as AreaRole,
        state: { test: 'value' }
      };

      act(() => {
        const areaId = karmycStore.getState().addArea(newArea);
        const state = karmycStore.getState();
        const areas = state.screens[state.activeScreenId].areas.areas;
        
        expect(Object.keys(areas)).toHaveLength(1);
        expect(areas[areaId].type).toBe('test-area');
        expect(areas[areaId].role).toBe('LEAD');
        expect(areas[areaId].state).toEqual({ test: 'value' });
      });
    });

    it('should remove an area', () => {
      const defaultArea: IArea<AreaTypeValue> = {
        id: 'default-area',
        type: 'default',
        role: 'LEAD' as AreaRole,
        state: {}
      };

      const testArea: IArea<AreaTypeValue> = {
        id: 'test-area-2',
        type: 'test-area',
        role: 'LEAD' as AreaRole,
        state: {}
      };

      act(() => {
        karmycStore.getState().addArea(defaultArea);
        const areaId = karmycStore.getState().addArea(testArea);
        karmycStore.getState().removeArea(areaId);
        
        const state = karmycStore.getState();
        expect(Object.keys(state.screens[state.activeScreenId].areas.areas)).toHaveLength(1);
        expect(state.screens[state.activeScreenId].areas.areas['default-area']).toBeDefined();
      });
    });

    it('should update area state', () => {
      const newArea: IArea<AreaTypeValue> = {
        id: 'test-area-3',
        type: 'test-area',
        role: 'LEAD' as AreaRole,
        state: { initial: 'value' }
      };

      act(() => {
        const areaId = karmycStore.getState().addArea(newArea);
        karmycStore.getState().updateArea({ 
          id: areaId, 
          state: { updated: 'value' },
          type: 'test-area',
          role: 'LEAD' as AreaRole
        });
        
        const state = karmycStore.getState();
        const area = state.screens[state.activeScreenId].areas.areas[areaId];
        expect(area.state).toEqual({ updated: 'value' });
        expect(area.type).toBe('test-area');
        expect(area.role).toBe('LEAD');
      });
    });
  });

  describe('Layout Operations', () => {
    it('should update layout', () => {
      const layout: AreaRowLayout = {
        id: 'test-layout-1',
        type: 'area_row',
        orientation: 'horizontal',
        areas: [{ id: 'test-area-1', size: 1 }]
      };

      act(() => {
        karmycStore.getState().updateLayout(layout);
        
        const state = karmycStore.getState();
        const activeScreenAreas = state.screens[state.activeScreenId].areas;
        expect(activeScreenAreas.layout['test-layout-1']).toBeDefined();
        expect((activeScreenAreas.layout['test-layout-1'] as AreaRowLayout).areas).toHaveLength(1);
      });
    });

    it('should handle area-layout integration', () => {
      const area: IArea<AreaTypeValue> = createTestArea({
        id: 'test-area-1',
        type: 'test-area',
        role: 'LEAD' as AreaRole,
        state: {}
      });

      const layout: AreaRowLayout = {
        id: 'test-layout-1',
        type: 'area_row',
        orientation: 'horizontal',
        areas: [{ id: 'test-area-1', size: 1 }]
      };

      act(() => {
        karmycStore.getState().addArea(area);
        karmycStore.getState().updateLayout(layout);
        
        const state = karmycStore.getState();
        const activeScreenAreas = state.screens[state.activeScreenId].areas;
        
        expect(activeScreenAreas.areas['test-area-1']).toBeDefined();
        expect(activeScreenAreas.layout['test-layout-1']).toBeDefined();
        expect((activeScreenAreas.layout['test-layout-1'] as AreaRowLayout).areas[0].id).toBe('test-area-1');
      });
    });
  });
}); 
