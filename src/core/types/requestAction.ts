import { AnyAction, Dispatch } from "@reduxjs/toolkit";
import { RootState } from "../store";

export interface DiffParams {
    resizeAreas: () => void;
}

/**
 * Interface pour les gestionnaires d'écouteurs d'événements
 */
export interface ListenHandlers {
    repeated: (eventName: string, callback: (e: MouseEvent) => void) => void;
    once: (eventName: string, callback: (e: MouseEvent) => void) => void;
    stopPropagation: () => void;
    preventDefault: () => void;
}

/**
 * Interface pour les paramètres des actions
 */
export interface RequestActionParams {
    /**
     * Fonction pour dispatcher des actions
     */
    dispatch: Dispatch<AnyAction>;

    /**
     * Fonction pour obtenir l'état actuel du store
     */
    getState: () => RootState;

    /**
     * Soumet l'action et l'ajoute à l'historique
     */
    submitAction: (name?: string) => void;

    /**
     * Annule l'action en cours
     */
    cancelAction: () => void;

    /**
     * Gestionnaire d'écouteurs d'événements
     */
    addListener: ListenHandlers;

    /**
     * Ajoute une fonction de diff à l'action
     */
    addDiff: (fn: (params: DiffParams) => void) => void;

    /**
     * Exécute une fonction de diff
     */
    performDiff: (fn: (params: DiffParams) => void) => void;
}

/**
 * Type pour la fonction de callback d'une action
 */
export type RequestActionCallback = (params: RequestActionParams) => void;

export interface DiffParams {
    // Définir les paramètres nécessaires pour les diff
} 
