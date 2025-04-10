import { AnyAction, Dispatch } from "@reduxjs/toolkit";
import { diffFactory } from "../history/diffFactory";
import { DiffType } from "../history/diffs";
import { store } from "../store";
import { sendDiffsToSubscribers } from "../store/diffSubscription";
import { addHistoryEntry } from "../store/slices/historySlice";
import { IDiff } from "../types/diff";
import { DiffParams, ListenHandlers, RequestActionCallback, RequestActionParams } from "../types/requestAction";

/**
 * Type pour la fonction qui détermine si une action doit être ajoutée à l'historique
 */
export type ShouldAddToStackFn = (prevState: any, nextState: any) => boolean;

/**
 * Paramètres disponibles pendant l'exécution d'une action
 */
export interface RequestActionOptions {
    history?: boolean;
    shouldAddToStack?: ShouldAddToStackFn;
    diff?: any;
    isDragAction?: boolean; // Indique que l'action concerne un drag qui nécessite maintenir les listeners
}

// Variable globale pour suivre si une action de drag est en cours
let isDraggingInProgress = false;

/**
 * Implémentation de la fonction requestAction qui est compatible 
 * avec les anciens appels tout en supportant les nouvelles fonctionnalités
 */
export function requestAction(
    options: RequestActionOptions = {},
    callback: RequestActionCallback
): void {
    const { history = true, shouldAddToStack, diff = diffFactory, isDragAction = false } = options;

    // Capturer l'état avant l'action
    const prevState = store.getState();
    let submitted = false;
    let cancelled = false;

    // Tableau pour stocker les diffs générés
    const allDiffs: IDiff[] = [];

    // Si cette action est une opération de drag, la marquer comme telle
    if (isDragAction) {
        isDraggingInProgress = true;
    }

    // Gestion des écouteurs d'événements
    const listeners: { [key: string]: ((e: Event) => void)[] } = {
        mousemove: [],
        mouseup: [],
        mousedown: [],
        keydown: [],
        keyup: []
    };

    const cleanup = () => {
        // Si c'est une action de drag et qu'on a des listeners mousemove/mouseup, ne pas nettoyer automatiquement
        if (isDragAction && (listeners.mousemove.length > 0 || listeners.mouseup.length > 0)) {
            return;
        }

        Object.entries(listeners).forEach(([eventName, callbacks]) => {
            callbacks.forEach(callback => {
                window.removeEventListener(eventName, callback);
            });
        });

        // Réinitialiser tous les tableaux d'écouteurs
        Object.keys(listeners).forEach(key => {
            listeners[key] = [];
        });

        // Réinitialiser l'état de drag lorsque tout est nettoyé
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

                    // Si c'était un mouseup et que c'est une action de drag, terminer l'action de drag
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

    // Créer une fonction dispatch qui log les actions tout en conservant le type correct
    const dispatchWithLog: Dispatch<AnyAction> = ((action: AnyAction) => {
        return store.dispatch(action);
    }) as Dispatch<AnyAction>;

    // Les paramètres passés au callback de l'action
    const params: RequestActionParams = {
        dispatch: dispatchWithLog,
        getState: () => store.getState(),
        submitAction: (name = "Action") => {
            if (cancelled || submitted) {
                return;
            }
            submitted = true;
            cleanup();

            // Capturer l'état après l'action
            const nextState = store.getState();

            // Ajouter à l'historique si nécessaire
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
            // S'assurer que le résultat est un tableau
            const diffsToPerform = Array.isArray(result) ? result : [result];
            // Stocker les diffs
            if (Array.isArray(allDiffs)) {
                allDiffs.push(...diffsToPerform);
            }

            // Convertir les diffs au format core
            const coreDiffs = diffsToPerform.map((diff, index) => ({
                id: `diff-${Date.now()}-${index}`,
                timestamp: Date.now(),
                type: diff && diff.type !== undefined ? DiffType[diff.type] || 'generic' : 'generic',
                changes: [],
                metadata: { original: diff }
            }));

            // Envoyer directement les diffs
            sendDiffsToSubscribers(store.getState(), coreDiffs, 'forward');
        }
    };

    // Exécuter le callback avec les paramètres
    try {
        callback(params);
    } catch (error) {
        console.error("Error in requestAction callback:", error);
        cancelled = true;
        cleanup();
    }

    // Si l'action n'a pas été explicitement soumise ou annulée, la soumettre automatiquement
    // Sauf s'il s'agit d'une action de drag, auquel cas on attend le mouseup
    if (!submitted && !cancelled && !isDraggingInProgress) {
        params.submitAction();
    }
}
