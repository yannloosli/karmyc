import { diffFactory } from "~/diff/diffFactory";
import { store } from "../store";
import { DiffParams, ListenerParams, RequestActionCallback, RequestActionParams } from "../types/requestAction";

export const requestAction = (
    options: Record<string, any>,
    callback: RequestActionCallback
): void => {
    const listeners: { [key: string]: ((e: Event) => void)[] } = {
        mousemove: [],
        mouseup: [],
        mousedown: []
    };

    const cleanup = () => {
        Object.entries(listeners).forEach(([eventName, callbacks]) => {
            callbacks.forEach(callback => {
                window.removeEventListener(eventName, callback);
            });
        });
        listeners.mousemove = [];
        listeners.mouseup = [];
        listeners.mousedown = [];
    };

    const addListener: ListenerParams = {
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
            console.log("Added repeated listener for:", eventName);
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
                }
            };
            window.addEventListener(eventName, wrappedHandler);
            if (!listeners[eventName]) {
                listeners[eventName] = [];
            }
            listeners[eventName].push(wrappedHandler);
            console.log("Added one-time listener for:", eventName);
        }
    };

    const diff = options.diff || diffFactory;

    const defaultDiff: DiffParams = {
        resizeAreas: () => {
            store.dispatch({
                type: 'resizeAreas'
            });
        }
    };

    const params: RequestActionParams = {
        dispatch: (action: any) => {
            store.dispatch(action);
        },
        submitAction: (message: string = "") => {
            cleanup();
            console.log("Action submitted:", message);
        },
        cancelAction: () => {
            cleanup();
            console.log("Action cancelled");
        },
        addListener,
        addDiff: (callback: (diff: DiffParams) => void) => {
            callback(options.diff || defaultDiff);
            console.log("Added diff callback");
        },
        performDiff: (callback: (diff: DiffParams) => void) => {
            callback(options.diff || defaultDiff);
            console.log("Performing diff");
        },
    };

    callback(params);
}; 
