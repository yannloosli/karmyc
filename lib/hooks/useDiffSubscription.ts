import { useEffect, useRef } from 'react';
import { DiffSubscribeFn, subscribeToDiffs, unsubscribeToDiffs } from '../store/diffSubscription';
import { IDiff } from '../types/diff';
import { useAppSelector } from './index';

/**
 * Hook to subscribe to diff notifications
 */
export const useDiffSubscription = (
    callback: (state: any, diffs: IDiff[], direction: 'forward' | 'backward') => void,
    dependencies: any[] = []
): void => {
    // Keep an up-to-date reference of the callback
    const callbackRef = useRef(callback);

    // Current application state
    const state = useAppSelector(state => state);

    // Update the reference when the callback changes
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    // Handle subscription/unsubscription
    useEffect(() => {
        // Wrapper to use the latest version of the callback
        const subscribeFn: DiffSubscribeFn = (state, diffs, direction) => {
            callbackRef.current(state, diffs, direction);
        };

        // Subscribe to notifications
        const subscriptionId = subscribeToDiffs(subscribeFn);

        // Unsubscribe during cleanup
        return () => {
            unsubscribeToDiffs(subscriptionId);
        };
        // Recreate the subscription if dependencies change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, dependencies);
}; 
