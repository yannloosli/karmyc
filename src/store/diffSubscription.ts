import { IDiff } from '../types/diff';

export type DiffSubscribeFn = (
    state: any,
    diffs: IDiff[],
    direction: 'forward' | 'backward'
) => void;

interface DiffSubscriber {
    id: string;
    fn: DiffSubscribeFn;
}

// Registre des abonnés aux diffs
const diffSubscribers: DiffSubscriber[] = [];

/**
 * S'abonne aux notifications de diffs
 * @param fn Fonction à appeler lors de l'application d'un diff
 * @returns ID d'abonnement à utiliser pour se désabonner
 */
export const subscribeToDiffs = (fn: DiffSubscribeFn): string => {
    const id = (Math.max(0, ...diffSubscribers.map(item => parseInt(item.id, 10))) + 1).toString();
    diffSubscribers.push({ id, fn });
    return id;
};

/**
 * Annule l'abonnement aux notifications de diffs
 * @param id ID d'abonnement retourné par subscribeToDiffs
 */
export const unsubscribeToDiffs = (id: string): void => {
    const index = diffSubscribers.findIndex(subscriber => subscriber.id === id);
    if (index !== -1) {
        diffSubscribers.splice(index, 1);
    }
};

/**
 * Envoie des notifications de diffs à tous les abonnés
 * @param state État actuel de l'application
 * @param diffs Liste des diffs à notifier
 * @param direction Direction d'application des diffs ('forward' ou 'backward')
 */
export const sendDiffsToSubscribers = (
    state: any,
    diffs: IDiff[],
    direction: 'forward' | 'backward' = 'forward'
): void => {
    diffSubscribers.forEach(({ fn }) => {
        fn(state, diffs, direction);
    });
};

/**
 * Obtient le nombre d'abonnés actuels
 * Utile pour le debug
 */
export const getSubscribersCount = (): number => {
    return diffSubscribers.length;
}; 
