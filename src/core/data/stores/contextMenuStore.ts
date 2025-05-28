import { validatePosition } from '../utils/validation';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
    ContextMenuItem,
    IContextMenuPosition,
} from '../types/contextMenu'; // Assuming types are correctly located
import { validateContextMenuItem } from '../utils/validation'; // Assuming validation utils are correctly located

interface ContextMenuState {
    isVisible: boolean;
    position: IContextMenuPosition;
    items: ContextMenuItem[];
    errors: string[];
    targetId?: string;
    metadata?: Record<string, any>;

    // Actions
    openContextMenu: (payload: {
        position: IContextMenuPosition;
        items: ContextMenuItem[];
        targetId?: string;
        metadata?: Record<string, any>;
    }) => void;
    closeContextMenu: () => void;
    updateContextMenuPosition: (position: IContextMenuPosition) => void;
    updateContextMenuItems: (items: ContextMenuItem[]) => void;
    clearErrors: () => void;
}

const initialState = {
    isVisible: false,
    position: { x: 0, y: 0 },
    items: [],
    errors: [],
    customContextMenu: null,
    targetId: undefined,
    metadata: undefined,
};

export const useContextMenuStore = create<ContextMenuState>()(
    immer((set) => ({
        ...initialState,

        openContextMenu: (payload) =>
            set((state) => {
                const { position, items, targetId, metadata } = payload;

                // Validation
                const positionValidation = validatePosition(position);
                if (!positionValidation.isValid) {
                    console.warn('Position validation failed:', positionValidation.errors);
                    state.errors = positionValidation.errors;
                    return;
                }

                const itemsValidation = items.map((item) => validateContextMenuItem(item));
                const invalidItems = itemsValidation.filter((validation) => !validation.isValid);
                if (invalidItems.length > 0) {
                    console.warn('Items validation failed:', invalidItems);
                    // Type assertion needed if validation result doesn't explicitly have errors property
                    state.errors = invalidItems.flatMap(
                        (validation: any) => validation.errors || ['Unknown item validation error']
                    );
                    return;
                }

                // Update state
                state.isVisible = true;
                state.position = position;
                state.items = items;
                state.targetId = targetId;
                state.metadata = metadata;
                state.errors = [];
            }),

        openCustomContextMenu: (options) =>
            set((state) => {
                state.isVisible = true;
                state.items = []; // Reset standard items
                state.targetId = undefined;
                state.metadata = undefined;
                state.errors = [];
            }),

        closeContextMenu: () =>
            set((state) => {
                Object.assign(state, initialState); // Reset to initial state
            }),

        updateContextMenuPosition: (position) =>
            set((state) => {
                const validation = validatePosition(position);
                if (!validation.isValid) {
                    state.errors = validation.errors;
                    return;
                }
                state.position = position;
                state.errors = []; // Clear errors on successful update
            }),

        updateContextMenuItems: (items) =>
            set((state) => {
                const itemsValidation = items.map((item) => validateContextMenuItem(item));
                const invalidItems = itemsValidation.filter((validation) => !validation.isValid);
                if (invalidItems.length > 0) {
                    // Type assertion needed if validation result doesn't explicitly have errors property
                    state.errors = invalidItems.flatMap(
                        (validation: any) => validation.errors || ['Unknown item validation error']
                    );
                    return;
                }
                state.items = items;
                state.errors = []; // Clear errors on successful update
            }),

        clearErrors: () =>
            set((state) => {
                state.errors = [];
            }),
    }))
);

// Selectors can be used directly from the hook, e.g.:
// const isVisible = useContextMenuStore(state => state.isVisible);
// const position = useContextMenuStore(state => state.position); 
