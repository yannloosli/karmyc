/**
 * Utilitaire pour bloquer les événements de pointeur pendant le redimensionnement
 */

let isPointerEventsBlocked = false;
let originalPointerEvents: string | null = null;

/**
 * Bloque tous les événements de pointeur sur les fenêtres
 */
export const blockPointerEvents = () => {
    if (isPointerEventsBlocked) return;
    
    isPointerEventsBlocked = true;
    
    // Sauvegarder l'état actuel
    if (typeof document !== 'undefined') {
        originalPointerEvents = document.body.style.pointerEvents;
        
        // Bloquer tous les événements de pointeur
        document.body.style.pointerEvents = 'none';
        
        // Bloquer aussi sur tous les éléments avec la classe 'area'
        const areaElements = document.querySelectorAll('.area');
        areaElements.forEach(element => {
            (element as HTMLElement).style.pointerEvents = 'none';
        });
        
        // Bloquer sur les toolbars et autres éléments d'interface
        const interfaceElements = document.querySelectorAll('.tools-container, .area-preview, .area-separator');
        interfaceElements.forEach(element => {
            (element as HTMLElement).style.pointerEvents = 'none';
        });
    }
};

/**
 * Restaure les événements de pointeur
 */
export const restorePointerEvents = () => {
    if (!isPointerEventsBlocked) return;
    
    isPointerEventsBlocked = false;
    
    if (typeof document !== 'undefined') {
        // Restaurer l'état original du body
        if (originalPointerEvents !== null) {
            document.body.style.pointerEvents = originalPointerEvents;
        } else {
            document.body.style.pointerEvents = '';
        }
        
        // Restaurer les événements sur les éléments avec la classe 'area'
        const areaElements = document.querySelectorAll('.area');
        areaElements.forEach(element => {
            (element as HTMLElement).style.pointerEvents = '';
        });
        
        // Restaurer sur les toolbars et autres éléments d'interface
        const interfaceElements = document.querySelectorAll('.tools-container, .area-preview, .area-separator');
        interfaceElements.forEach(element => {
            (element as HTMLElement).style.pointerEvents = '';
        });
        
        originalPointerEvents = null;
    }
};

/**
 * Vérifie si les événements de pointeur sont actuellement bloqués
 */
export const isPointerEventsBlockedState = () => isPointerEventsBlocked; 
