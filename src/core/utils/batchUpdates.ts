import { useKarmycStore } from '../store';

/**
 * Système de batch updates pour optimiser les performances
 * Permet de grouper plusieurs modifications d'état en une seule mise à jour
 */

// Queue des mises à jour en attente
let batchQueue: Array<() => void> = [];
let isBatching = false;
let batchTimeout: NodeJS.Timeout | null = null;

/**
 * Exécute une série de mises à jour en batch
 * @param updates Array de fonctions de mise à jour à exécuter
 */
export const batchUpdate = (updates: Array<() => void>) => {
    if (isBatching) {
        // Si on est déjà en mode batch, on ajoute juste les updates
        batchQueue.push(...updates);
        return;
    }

    // Démarrer le mode batch
    isBatching = true;
    batchQueue = [...updates];

    // Exécuter toutes les updates en une seule fois
    useKarmycStore.setState((state) => {
        // Exécuter toutes les fonctions de mise à jour
        batchQueue.forEach(update => update());
        
        // Réinitialiser le système de batch
        batchQueue = [];
        isBatching = false;
        state.lastUpdated = Date.now();
        
        return state;
    });
};

/**
 * Exécute une mise à jour avec debounce pour éviter les mises à jour trop fréquentes
 * @param updateFn Fonction de mise à jour à exécuter
 * @param delay Délai en ms (défaut: 16ms pour ~60fps)
 */
export const debouncedUpdate = (updateFn: () => void, delay: number = 16) => {
    if (batchTimeout) {
        clearTimeout(batchTimeout);
    }

    batchTimeout = setTimeout(() => {
        updateFn();
        batchTimeout = null;
    }, delay);
};

/**
 * Helper pour créer une fonction de mise à jour qui peut être utilisée dans un batch
 * @param updateFn Fonction de mise à jour originale
 * @returns Fonction qui peut être utilisée dans un batch ou directement
 */
export const createBatchableUpdate = <T extends any[]>(
    updateFn: (...args: T) => void
) => {
    return (...args: T) => {
        if (isBatching) {
            // En mode batch, on ajoute à la queue
            batchQueue.push(() => updateFn(...args));
        } else {
            // Pas en mode batch, on exécute immédiatement
            updateFn(...args);
        }
    };
};

/**
 * Exécute une fonction avec des mises à jour en batch
 * @param fn Fonction à exécuter avec le système de batch
 */
export const withBatchUpdates = (fn: () => void) => {
    const wasBatching = isBatching;
    
    if (!wasBatching) {
        isBatching = true;
        batchQueue = [];
    }

    try {
        fn();
    } finally {
        if (!wasBatching && isBatching) {
            // Exécuter toutes les mises à jour accumulées
            useKarmycStore.setState((state) => {
                batchQueue.forEach(update => update());
                batchQueue = [];
                isBatching = false;
                state.lastUpdated = Date.now();
                return state;
            });
        }
    }
};

/**
 * Optimise une action complexe en la divisant en étapes batchées
 * @param steps Array d'étapes à exécuter
 * @param stepDelay Délai entre chaque étape (défaut: 0ms)
 */
export const executeBatchedSteps = async (
    steps: Array<() => void>, 
    stepDelay: number = 0
) => {
    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        
        if (i === steps.length - 1) {
            // Dernière étape : exécution immédiate
            step();
        } else {
            // Étapes intermédiaires : avec debounce
            debouncedUpdate(step, stepDelay);
        }
    }
}; 
