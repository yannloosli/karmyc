import { useMemo } from 'react';
import { TemporalState } from 'zundo'; // Import TemporalState type from zundo
import { shallow } from 'zustand/shallow'; // Import shallow
import { useStoreWithEqualityFn } from 'zustand/traditional'; // Import the specific hook
import { useAreaStore } from '../stores/areaStore';
import { useSpaceStore } from '../stores/spaceStore';

declare global {
    interface Window {
        store: any;
    }
}

// Helper type to represent the temporal slice we select
// Include 'clear' in the selected properties
type SelectedTemporalState = Pick<TemporalState<any>, 'undo' | 'redo' | 'pastStates' | 'futureStates' | 'clear'>;


/**
 * Hook to interact with the temporal (undo/redo) state of both Area and Space stores.
 */
export const useHistory = () => {
    const DEBUG_MODE = import.meta.env.DEV; // Use Vite env variable

    // Select temporal state from Area store
    const areaTemporal = useStoreWithEqualityFn(
        useAreaStore.temporal,
        (state): SelectedTemporalState => ({
            undo: state.undo,
            redo: state.redo,
            pastStates: state.pastStates,
            futureStates: state.futureStates,
            clear: state.clear, // Select clear function
        }),
        shallow // Use shallow equality for comparison
    );

    // Select temporal state from Space store
    const spaceTemporal = useStoreWithEqualityFn(
        useSpaceStore.temporal,
        (state): SelectedTemporalState => ({
            undo: state.undo,
            redo: state.redo,
            pastStates: state.pastStates,
            futureStates: state.futureStates,
            clear: state.clear, // Select clear function
        }),
        shallow // Use shallow equality for comparison
    );

    // --- Logging --- (Conditional)
    if (DEBUG_MODE) {
        console.log('[useHistory] Area Temporal State:', {
            canUndo: (areaTemporal.pastStates?.length ?? 0) > 0,
            canRedo: (areaTemporal.futureStates?.length ?? 0) > 0,
            pastCount: areaTemporal.pastStates?.length ?? 0,
            futureCount: areaTemporal.futureStates?.length ?? 0,
            // pastStates: areaTemporal.pastStates, // Avoid logging potentially large states unless needed
            // futureStates: areaTemporal.futureStates,
        });
        console.log('[useHistory] Space Temporal State:', {
            canUndo: (spaceTemporal.pastStates?.length ?? 0) > 0,
            canRedo: (spaceTemporal.futureStates?.length ?? 0) > 0,
            pastCount: spaceTemporal.pastStates?.length ?? 0,
            futureCount: spaceTemporal.futureStates?.length ?? 0,
            // pastStates: spaceTemporal.pastStates,
            // futureStates: spaceTemporal.futureStates,
        });
    }

    // --- Memoized Actions and State --- 
    const historyState = useMemo(() => ({
        // Area History
        undoArea: () => {
            if (DEBUG_MODE) console.log('[useHistory] Calling undoArea');
            areaTemporal.undo();
        },
        redoArea: () => {
            if (DEBUG_MODE) console.log('[useHistory] Calling redoArea');
            areaTemporal.redo();
        },
        clearAreaHistory: () => {
            if (DEBUG_MODE) console.log('[useHistory] Calling clearAreaHistory');
            areaTemporal.clear(); // Now valid
        },
        canUndoArea: (areaTemporal.pastStates?.length ?? 0) > 0,
        canRedoArea: (areaTemporal.futureStates?.length ?? 0) > 0,
        areaPastStatesCount: areaTemporal.pastStates?.length ?? 0,
        areaFutureStatesCount: areaTemporal.futureStates?.length ?? 0,

        // Space History (assuming you want separate controls)
        undoSpace: () => {
            if (DEBUG_MODE) console.log('[useHistory] Calling undoSpace');
            spaceTemporal.undo();
        },
        redoSpace: () => {
            if (DEBUG_MODE) console.log('[useHistory] Calling redoSpace');
            spaceTemporal.redo();
        },
        clearSpaceHistory: () => {
            if (DEBUG_MODE) console.log('[useHistory] Calling clearSpaceHistory');
            spaceTemporal.clear(); // Now valid
        },
        canUndoSpace: (spaceTemporal.pastStates?.length ?? 0) > 0,
        canRedoSpace: (spaceTemporal.futureStates?.length ?? 0) > 0,
        spacePastStatesCount: spaceTemporal.pastStates?.length ?? 0,
        spaceFutureStatesCount: spaceTemporal.futureStates?.length ?? 0,

    }), [
        DEBUG_MODE,
        areaTemporal, // Use the whole selected object as dependency
        spaceTemporal, // Use the whole selected object as dependency
    ]);

    return historyState;
}; 
