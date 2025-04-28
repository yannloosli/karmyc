import { AreaTypeValue } from '../constants';
import { Area, AreaRowLayout } from '../types/areaTypes';
import { AreaState, useAreaStore } from './areaStore';

// Helper to reset the store to a known initial state
// We get the initial state logic directly from the store definition if possible
// or define a clean default state here.
const getInitialState = (): Partial<AreaState> => ({
    _id: 0,
    errors: [],
    activeAreaId: null,
    layout: {},
    areas: {},
    viewports: {},
    joinPreview: null,
    rootId: null,
    areaToOpen: null
});

describe('Area Store', () => {
    beforeEach(() => {
        // Reset the store completely before each test
        useAreaStore.setState(getInitialState(), true /* replace */);
    });

    it('should add an area and set it as root if it is the first', () => {
        const area: Area<AreaTypeValue> = {
            id: 'test-area',
            type: 'test' as AreaTypeValue,
            state: {},
            // position is not part of Area type
        };

        useAreaStore.getState().addArea(area);
        const state = useAreaStore.getState();
        expect(state.areas['test-area']).toBeDefined();
        expect(state.areas['test-area']?.id).toBe('test-area');
        expect(state.areas['test-area']?.type).toBe('test');
        expect(state.rootId).toBe('test-area'); // First area becomes root
        expect(state.layout['test-area']).toEqual({ type: 'area', id: 'test-area' });
    });

    it('should add a second area, creating a root row', () => {
        const area1: Area<AreaTypeValue> = { id: 'area1', type: 'test1' as AreaTypeValue, state: {} };
        const area2: Area<AreaTypeValue> = { id: 'area2', type: 'test2' as AreaTypeValue, state: {} };

        useAreaStore.getState().addArea(area1); // Becomes root initially
        useAreaStore.getState().addArea(area2); // Triggers row creation

        const state = useAreaStore.getState();
        expect(state.areas['area1']).toBeDefined();
        expect(state.areas['area2']).toBeDefined();
        expect(state.rootId).toMatch(/^row-\d+$/); // Root should now be a row ID
        expect(state.layout[state.rootId!]).toBeDefined();
        expect(state.layout[state.rootId!].type).toBe('area_row');
        const rootRow = state.layout[state.rootId!] as AreaRowLayout;
        expect(rootRow.areas).toHaveLength(2);
        expect(rootRow.areas.map(a => a.id)).toContain('area1');
        expect(rootRow.areas.map(a => a.id)).toContain('area2');
        // We could also check sizes if they are predictable
    });

    it('should update an area', () => {
        const area: Area<AreaTypeValue> = { id: 'test-area', type: 'test' as AreaTypeValue, state: { initial: 'value' } };

        useAreaStore.getState().addArea(area);
        useAreaStore.getState().updateArea({ id: 'test-area', type: 'updated' as AreaTypeValue, state: { initial: 'new_value', added: true } });

        const updatedArea = useAreaStore.getState().areas['test-area'];
        expect(updatedArea).toBeDefined();
        expect(updatedArea?.type).toBe('updated');
        expect(updatedArea?.state).toEqual({ initial: 'new_value', added: true });
    });

    it('should remove an area and adjust layout', () => {
        // Setup: Add two areas so a row is created
        const area1: Area<AreaTypeValue> = { id: 'area1', type: 'test1' as AreaTypeValue, state: {} };
        const area2: Area<AreaTypeValue> = { id: 'area2', type: 'test2' as AreaTypeValue, state: {} };
        useAreaStore.getState().addArea(area1);
        useAreaStore.getState().addArea(area2);
        const initialRootId = useAreaStore.getState().rootId;

        // Action: Remove one area
        useAreaStore.getState().removeArea('area2');

        // Assertions
        const state = useAreaStore.getState();
        expect(state.areas['area1']).toBeDefined();
        expect(state.areas['area2']).toBeUndefined();
        expect(state.layout['area2']).toBeUndefined();

        // Check layout adjustment (implementation detail dependent)
        // Assuming removeArea simplifies layout if possible
        // Check if the original row was removed or updated
        expect(state.layout[initialRootId!]).toBeUndefined(); // The row should be gone
        expect(state.rootId).toBe('area1'); // The remaining area should become the root
        expect(state.layout['area1']).toEqual({ type: 'area', id: 'area1' });

    });

    it('should set and get active area', () => {
        const area: Area<AreaTypeValue> = { id: 'active-area', type: 'active' as AreaTypeValue, state: {} };

        useAreaStore.getState().addArea(area);
        useAreaStore.getState().setActiveArea('active-area');

        // Verify activeAreaId is set
        expect(useAreaStore.getState().activeAreaId).toBe('active-area');

        // Verify getActiveArea selector returns the correct area object
        const activeArea = useAreaStore.getState().getActiveArea();
        expect(activeArea).toBeDefined();
        expect(activeArea?.id).toBe('active-area');
        expect(activeArea?.type).toBe('active');

        // Test setting activeArea to null
        useAreaStore.getState().setActiveArea(null);
        expect(useAreaStore.getState().activeAreaId).toBeNull();
        expect(useAreaStore.getState().getActiveArea()).toBeNull();
    });

    it('should get area by id', () => {
        const area: Area<AreaTypeValue> = { id: 'test-area', type: 'test' as AreaTypeValue, state: {} };

        useAreaStore.getState().addArea(area);
        const fetchedArea = useAreaStore.getState().getAreaById('test-area');
        expect(fetchedArea).toBeDefined();
        expect(fetchedArea?.id).toBe('test-area');

        // Test getting non-existent area
        expect(useAreaStore.getState().getAreaById('non-existent')).toBeUndefined();
    });

    it('should get all areas', () => {
        const area1: Area<AreaTypeValue> = { id: 'area1', type: 'test1' as AreaTypeValue, state: {} };
        const area2: Area<AreaTypeValue> = { id: 'area2', type: 'test2' as AreaTypeValue, state: {} };

        useAreaStore.getState().addArea(area1);
        useAreaStore.getState().addArea(area2);

        const allAreas = useAreaStore.getState().getAllAreas();
        expect(Object.keys(allAreas)).toHaveLength(2);
        expect(allAreas['area1']).toBeDefined();
        expect(allAreas['area1']?.id).toBe('area1');
        expect(allAreas['area2']).toBeDefined();
        expect(allAreas['area2']?.id).toBe('area2');
    });
}); 
