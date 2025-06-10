import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import type { RootState } from '../../src/store/areaStore';
import { AreaRowLayout } from '../../src/types/areaTypes';
import { IArea } from '../../src/types/areaTypes';
import { AreaTypeValue } from '../../src/types/actions';

export const createTestStore = () => {
  return create<RootState>()(
    immer((set, get) => ({
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
      nextScreenId: 2,
      options: {
        resizableAreas: true,
        manageableAreas: true,
        multiScreen: true,
        builtInLayouts: [],
        keyboardShortcutsEnabled: true,
        validators: []
      },
      lastUpdated: Date.now(),
      layout_preset: [],

      // Actions communes pour les tests
      addArea: (area) => {
        let generatedAreaId = '';
        set((state) => {
          const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
          if (!activeScreenAreas) return;
          const areaId = area.id || uuidv4();
          const areaWithId = {
            ...area,
            id: areaId,
          };
          activeScreenAreas.areas[areaId] = areaWithId;
          activeScreenAreas._id += 1;
          activeScreenAreas.errors = [];
          generatedAreaId = areaId;
          state.lastUpdated = Date.now();
        });
        return generatedAreaId;
      },

      removeArea: (id) => set((state) => {
        const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
        if (!activeScreenAreas) return;
        delete activeScreenAreas.areas[id];
        delete activeScreenAreas.layout[id];
        for (const layoutId in activeScreenAreas.layout) {
          const item = activeScreenAreas.layout[layoutId];
          if (item.type === 'area_row') {
            const row = item as AreaRowLayout;
            const areaIndex = row.areas.findIndex((a: { id: string }) => a.id === id);
            if (areaIndex !== -1) {
              row.areas.splice(areaIndex, 1);
            }
          }
        }
        if (activeScreenAreas.rootId === id) {
          activeScreenAreas.rootId = null;
        }
        if (activeScreenAreas.activeAreaId === id) {
          activeScreenAreas.activeAreaId = null;
        }
        activeScreenAreas.errors = [];
        state.lastUpdated = Date.now();
      }),

      updateLayout: (layoutData) => set((state) => {
        const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
        if (!activeScreenAreas) return;
        const layout = activeScreenAreas.layout[layoutData.id];
        if (layout && layout.type === 'area_row') {
          Object.assign(layout, layoutData);
        } else {
          activeScreenAreas.layout[layoutData.id] = layoutData as AreaRowLayout;
        }
        activeScreenAreas.errors = [];
        state.lastUpdated = Date.now();
      }),

      updateArea: (areaData: Partial<IArea<AreaTypeValue>> & { id: string }) => set((state) => {
        const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
        if (!activeScreenAreas) return;
        const area = activeScreenAreas.areas[areaData.id];
        if (area) {
          activeScreenAreas.areas[areaData.id] = {
            ...area,
            ...areaData
          };
          activeScreenAreas.errors = [];
          state.lastUpdated = Date.now();
        } else {
          activeScreenAreas.errors = [`Area with ID ${areaData.id} not found for update.`];
        }
      }),

      splitArea: () => null,

      // Actions requises par le type RootState
      addScreen: () => {},
      switchScreen: () => {},
      removeScreen: () => {},
      duplicateScreen: () => {},
      detachArea: () => {},
      setActiveArea: () => {},
      setAreaToOpen: () => {},
      updateAreaToOpenPosition: () => {},
      finalizeAreaPlacement: () => {},
      cleanupTemporaryStates: () => {},
      setViewports: () => {},
      setRowSizes: () => {},
      setJoinPreview: () => {},
      joinOrMoveArea: () => {},
      getLastSplitResult: () => null,
      getActiveArea: () => null,
      getAreaById: () => undefined,
      getAllAreas: () => ({}),
      getAreaErrors: () => [],
      findParentRowAndIndices: () => ({ parentRow: null, sourceIndex: -1, targetIndex: -1 })
    }))
  );
};

export const resetStore = (store: ReturnType<typeof createTestStore>) => {
  store.setState({
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
    nextScreenId: 2,
    options: {
      resizableAreas: true,
      manageableAreas: true,
      multiScreen: true,
      builtInLayouts: [],
      keyboardShortcutsEnabled: true,
      validators: []
    },
    lastUpdated: Date.now(),
    layout_preset: []
  });
}; 
