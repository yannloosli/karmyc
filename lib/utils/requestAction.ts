import { AnyAction, Dispatch } from "@reduxjs/toolkit";
import { diffFactory } from "../history/diffFactory";
import { DiffType } from "../history/diffs";
import { store } from "../store";
import { sendDiffsToSubscribers } from "../store/diffSubscription";
import { addHistoryEntry } from "../store/slices/historySlice";
import { IDiff } from "../types/diff";
import { DiffParams, ListenHandlers, RequestActionCallback, RequestActionParams } from "../types/requestAction";

/**
 * Type for the function that determines if an action should be added to history
 */
export type ShouldAddToStackFn = (prevState: any, nextState: any) => boolean;

/**
 * Parameters available during action execution
 */
export interface RequestActionOptions {
    history?: boolean;
    shouldAddToStack?: ShouldAddToStackFn;
    diff?: any;
    isDragAction?: boolean; // Indicates that the action is a drag that requires maintaining listeners
}

// Global variable to track if a drag action is in progress
let isDraggingInProgress = false;

/**
 * Implementation of the requestAction function that is compatible
 * with old calls while supporting new features
 */
export function requestAction(
    options: RequestActionOptions = {},
    callback: RequestActionCallback
): void {
    const { history = true, shouldAddToStack, diff = diffFactory, isDragAction = false } = options;

    // Capture state before action
    const prevState = store.getState();
    let submitted = false;
    let cancelled = false;

    // Array to store generated diffs
    const allDiffs: IDiff[] = [];

    // If this action is a drag operation, mark it as such
    if (isDragAction) {
        isDraggingInProgress = true;
    }

    // Event listener management
    const listeners: { [key: string]: ((e: Event) => void)[] } = {
        mousemove: [],
        mouseup: [],
        mousedown: [],
        keydown: [],
        keyup: []
    };

    const cleanup = () => {
        // If it's a drag action and we have mousemove/mouseup listeners, don't clean up automatically
        if (isDragAction && (listeners.mousemove.length > 0 || listeners.mouseup.length > 0)) {
            return;
        }

        Object.entries(listeners).forEach(([eventName, callbacks]) => {
            callbacks.forEach(callback => {
                window.removeEventListener(eventName, callback);
            });
        });

        // Reset all listener arrays
        Object.keys(listeners).forEach(key => {
            listeners[key] = [];
        });

        // Reset drag state when everything is cleaned up
        isDraggingInProgress = false;
    };

    const addListener: ListenHandlers = {
        repeated: (eventName: string, handler: (e: MouseEvent) => void) => {
            const wrappedHandler = (e: Event) => {
                if (e instanceof MouseEvent) {
                    handler(e);
                }
            };
            window.addEventListener(eventName, wrappedHandler);
            if (!listeners[eventName]) {
                listeners[eventName] = [];
            }
            listeners[eventName].push(wrappedHandler);
        },
        once: (eventName: string, handler: (e: MouseEvent) => void) => {
            const wrappedHandler = (e: Event) => {
                if (e instanceof MouseEvent) {
                    handler(e);
                    window.removeEventListener(eventName, wrappedHandler);
                    const index = listeners[eventName].indexOf(wrappedHandler);
                    if (index > -1) {
                        listeners[eventName].splice(index, 1);
                    }

                    // If it was a mouseup and it's a drag action, end the drag action
                    if (eventName === 'mouseup' && isDragAction) {
                        isDraggingInProgress = false;
                    }
                }
            };
            window.addEventListener(eventName, wrappedHandler);
            if (!listeners[eventName]) {
                listeners[eventName] = [];
            }
            listeners[eventName].push(wrappedHandler);
        },
        stopPropagation: () => { console.log("stopPropagation called"); },
        preventDefault: () => { console.log("preventDefault called"); }
    };

    const defaultDiff: DiffParams = {
        resizeAreas: () => {
            store.dispatch({
                type: 'resizeAreas'
            });
        }
    };

    // Create a dispatch function that logs actions while maintaining the correct type
    const dispatchWithLog: Dispatch<AnyAction> = ((action: AnyAction) => {
        return store.dispatch(action);
    }) as Dispatch<AnyAction>;

    // Parameters passed to the action callback
    const params: RequestActionParams = {
        dispatch: dispatchWithLog,
        getState: () => store.getState(),
        submitAction: (name = "Action") => {
            if (cancelled || submitted) {
                return;
            }
            submitted = true;
            cleanup();

            // Capture state after action
            const nextState = store.getState();

            // Add to history if needed
            if (history) {
                let shouldAdd = true;

                if (shouldAddToStack) {
                    shouldAdd = shouldAddToStack(prevState, nextState);
                }

                if (shouldAdd) {
                    store.dispatch(addHistoryEntry({
                        name,
                        prevState,
                        nextState
                    }));
                }
            }
        },
        cancelAction: () => {
            cancelled = true;
            cleanup();
        },
        addListener,
        addDiff: (callback: (diff: DiffParams) => void) => {
            callback(diff || defaultDiff);
        },
        performDiff: (fn) => {
            const result = fn(diff);
            // Ensure result is an array
            const diffsToPerform = Array.isArray(result) ? result : [result];
            // Store diffs
            if (Array.isArray(allDiffs)) {
                allDiffs.push(...diffsToPerform);
            }

            // Convert diffs to core format
            const coreDiffs = diffsToPerform.map((diff, index) => ({
                id: `diff-${Date.now()}-${index}`,
                timestamp: Date.now(),
                type: diff && diff.type !== undefined ? DiffType[diff.type] || 'generic' : 'generic',
                changes: [],
                metadata: { original: diff }
            }));

            // Send diffs directly
            sendDiffsToSubscribers(store.getState(), coreDiffs, 'forward');
        }
    };

    // Execute callback with parameters
    try {
        callback(params);
    } catch (error) {
        console.error("Error in requestAction callback:", error);
        cancelled = true;
        cleanup();
    }

    // If the action hasn't been explicitly submitted or cancelled, submit it automatically
    // Unless it's a drag action, in which case we wait for mouseup
    if (!submitted && !cancelled && !isDraggingInProgress) {
        params.submitAction();
    }
}
