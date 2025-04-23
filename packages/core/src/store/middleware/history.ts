/**
 * Middleware for managing action history
 * 
 * This middleware is responsible for:
 * 1. Intercepting actions to generate state differences
 * 2. Managing undo/redo history
 * 3. Visualizing state changes
 * 
 * @see docs/StoreReduxDesign.md - Section 4.2 History Middleware
 */
import { Action, Middleware } from '@reduxjs/toolkit';
import { RootState } from '../index';
import { finishAction, HistoryEntry } from '../slices/historySlice';
import { setDrawingLinesForSpace, setDrawingStrokeWidthForSpace } from '../slices/spaceSlice';

export const historyMiddleware: Middleware<{}, RootState> = store => next => (action: unknown) => {
    console.log('MIDDLEWARE HISTORY - Action reçue:', action);

    if (typeof action === 'object' && action !== null && 'type' in action) {
        const actionTyped = action as Action & { payload?: { spaceId?: string } };
        const actionType = actionTyped.type;

        if (actionType === 'history/undo') {
            console.log('Middleware: Action undo détectée');
            const spaceId = actionTyped.payload?.spaceId;
            console.log('Undo pour space:', spaceId);

            if (!spaceId) {
                console.warn("Middleware Undo: spaceId manquant dans le payload.");
                return next(action);
            }

            const result = next(action);

            const state = store.getState();
            const spaceHistory = state.history.spaces[spaceId];

            const entryToRestore: HistoryEntry | undefined = spaceHistory?.future[0];

            if (entryToRestore?.prevState) {
                console.log('Restauration de prevState après undo pour entry:', entryToRestore.name);
                try {
                    if (entryToRestore.prevState.drawingLines !== undefined) {
                        store.dispatch(setDrawingLinesForSpace({
                            spaceId: spaceId,
                            lines: entryToRestore.prevState.drawingLines
                        }));
                    }
                    if (entryToRestore.prevState.drawingStrokeWidth !== undefined) {
                        store.dispatch(setDrawingStrokeWidthForSpace({
                            spaceId: spaceId,
                            width: entryToRestore.prevState.drawingStrokeWidth
                        }));
                    }
                } catch (error) {
                    console.error("Erreur lors de la restauration de prevState (undo):", error);
                } finally {
                    store.dispatch(finishAction({ spaceId }));
                }
            } else {
                console.warn("Middleware Undo: Impossible de trouver l'entrée ou prevState pour restaurer.");
                if (state.history.inProgressSpaceId === spaceId) {
                    store.dispatch(finishAction({ spaceId }));
                }
            }

            return result;
        }

        if (actionType === 'history/redo') {
            console.log('Middleware: Action redo détectée');
            const spaceId = actionTyped.payload?.spaceId;
            console.log('Redo pour space:', spaceId);

            if (!spaceId) {
                console.warn("Middleware Redo: spaceId manquant dans le payload.");
                return next(action);
            }

            const result = next(action);

            const state = store.getState();
            const spaceHistory = state.history.spaces[spaceId];

            const entryToRestore: HistoryEntry | undefined = spaceHistory?.past[spaceHistory.past.length - 1];

            if (entryToRestore?.nextState) {
                console.log('Restauration de nextState après redo pour entry:', entryToRestore.name);
                try {
                    if (entryToRestore.nextState.drawingLines !== undefined) {
                        store.dispatch(setDrawingLinesForSpace({
                            spaceId: spaceId,
                            lines: entryToRestore.nextState.drawingLines
                        }));
                    }
                    if (entryToRestore.nextState.drawingStrokeWidth !== undefined) {
                        store.dispatch(setDrawingStrokeWidthForSpace({
                            spaceId: spaceId,
                            width: entryToRestore.nextState.drawingStrokeWidth
                        }));
                    }
                } catch (error) {
                    console.error("Erreur lors de la restauration de nextState (redo):", error);
                } finally {
                    store.dispatch(finishAction({ spaceId }));
                }
            } else {
                console.warn("Middleware Redo: Impossible de trouver l'entrée ou nextState pour restaurer.");
                if (state.history.inProgressSpaceId === spaceId) {
                    store.dispatch(finishAction({ spaceId }));
                }
            }

            return result;
        }
    }

    return next(action);
}; 
