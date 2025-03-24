import { AREA_BORDER_WIDTH, TOOLBAR_HEIGHT } from "../constants";

interface Rect {
    top: number;
    left: number;
    width: number;
    height: number;
}

// Stockage des dimensions stables du viewport
let stableViewport: Rect | null = null;
let lastAppliedWidth = 0;
let lastAppliedHeight = 0;
let resizeStartTime = 0;
const RESIZE_STABILITY_THRESHOLD = 500; // ms

export const getAreaRootViewport = () => {
    // Calculer les dimensions actuelles de la fenêtre
    const currentViewport: Rect = {
        top: 0,  // Pas de décalage car déjà géré par le flux
        left: 0,
        height: Math.floor(window.innerHeight - (TOOLBAR_HEIGHT * 2)),  // Soustraire MenuBar et StatusBar
        width: Math.floor(window.innerWidth),
    };

    const now = Date.now();

    // Si nous sommes en plein redimensionnement ou division
    if (window.__AREA_RESIZING__) {
        // Mettre à jour le temps de début de redimensionnement
        if (!resizeStartTime) {
            resizeStartTime = now;

            // Conserver les dimensions actuelles lors du premier redimensionnement
            if (!stableViewport) {
                stableViewport = { ...currentViewport };
                lastAppliedWidth = currentViewport.width;
                lastAppliedHeight = currentViewport.height;
            }
        }

        // Utiliser le viewport stable pendant l'opération
        if (stableViewport) {
            return stableViewport;
        }
    } else {
        // Réinitialiser le compteur de redimensionnement si on n'est plus en opération
        // mais seulement après un délai de stabilité
        if (resizeStartTime && (now - resizeStartTime > RESIZE_STABILITY_THRESHOLD)) {
            resizeStartTime = 0;
        }
    }

    // Détection des changements significatifs de dimensions
    const widthChange = Math.abs(currentViewport.width - lastAppliedWidth);
    const heightChange = Math.abs(currentViewport.height - lastAppliedHeight);
    const significantChange = widthChange > 5 || heightChange > 5;

    // Mise à jour des dimensions stables si changement significatif et pas d'opération en cours
    if (!window.__AREA_RESIZING__ && significantChange && !resizeStartTime) {
        stableViewport = { ...currentViewport };
        lastAppliedWidth = currentViewport.width;
        lastAppliedHeight = currentViewport.height;
    }

    // Retourner le viewport stable si disponible, sinon le courant
    return stableViewport || currentViewport;
};

// Fonction pour définir le flag de redimensionnement
export const setAreaResizing = (isResizing: boolean) => {
    window.__AREA_RESIZING__ = isResizing;

    // Réinitialiser le compteur de stabilité si on arrête le redimensionnement
    if (!isResizing) {
        resizeStartTime = 0;
    }
};

let viewportMap: { [key: string]: Rect } = {};

export const _setAreaViewport = (_viewportMap: { [key: string]: Rect }) => {
    viewportMap = _viewportMap;
};

export const getAreaViewport = (areaId: string, _: string): Rect => {
    const viewport = viewportMap[areaId];

    if (!viewport) {
        console.warn(`No viewport found for area ${areaId}`);
        // Retourner un viewport par défaut en cas d'erreur
        return {
            left: AREA_BORDER_WIDTH,
            top: AREA_BORDER_WIDTH,
            width: 100 - AREA_BORDER_WIDTH * 2,
            height: 100 - AREA_BORDER_WIDTH * 2
        };
    }

    const componentViewport: Rect = {
        left: viewport.left + AREA_BORDER_WIDTH,
        top: viewport.top + AREA_BORDER_WIDTH,
        width: viewport.width - AREA_BORDER_WIDTH * 2,
        height: viewport.height - AREA_BORDER_WIDTH * 2,
    };

    return componentViewport;
};

// TypeScript type augmentation pour ajouter la propriété au window
declare global {
    interface Window {
        __AREA_RESIZING__?: boolean;
    }
}
