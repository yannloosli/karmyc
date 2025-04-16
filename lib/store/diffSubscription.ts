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

// Diff subscribers registry
const diffSubscribers: DiffSubscriber[] = [];

/**
 * Subscribe to diff notifications
 */
export const subscribeToDiffs = (fn: DiffSubscribeFn): string => {
    const id = (Math.max(0, ...diffSubscribers.map(item => parseInt(item.id, 10))) + 1).toString();
    diffSubscribers.push({ id, fn });
    return id;
};

/**
 * Unsubscribe from diff notifications
 */
export const unsubscribeToDiffs = (id: string): void => {
    const index = diffSubscribers.findIndex(subscriber => subscriber.id === id);
    if (index !== -1) {
        diffSubscribers.splice(index, 1);
    }
};

/**
 * Send diff notifications to all subscribers
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
 * Get the current number of subscribers
 * Useful for debugging
 */
export const getSubscribersCount = (): number => {
    return diffSubscribers.length;
}; 
