import { useEffect, useRef } from 'react';
import { DiffSubscribeFn, subscribeToDiffs, unsubscribeToDiffs } from '../store/diffSubscription';
import { IDiff } from '../types/diff';
import { useAppSelector } from './index';

/**
 * Hook pour s'abonner aux notifications de diffs
 * @param callback Fonction à appeler lors de l'application d'un diff
 * @param dependencies Dépendances pour recréer l'abonnement (similaire aux dépendances de useEffect)
 */
export const useDiffSubscription = (
    callback: (state: any, diffs: IDiff[], direction: 'forward' | 'backward') => void,
    dependencies: any[] = []
): void => {
    // Garder une référence à jour du callback
    const callbackRef = useRef(callback);

    // État actuel de l'application
    const state = useAppSelector(state => state);

    // Mettre à jour la référence quand le callback change
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    // Gérer l'abonnement/désabonnement
    useEffect(() => {
        // Wrapper pour utiliser la dernière version du callback
        const subscribeFn: DiffSubscribeFn = (state, diffs, direction) => {
            callbackRef.current(state, diffs, direction);
        };

        // S'abonner aux notifications
        const subscriptionId = subscribeToDiffs(subscribeFn);

        // Se désabonner lors du nettoyage
        return () => {
            unsubscribeToDiffs(subscriptionId);
        };
        // Recréer l'abonnement si les dépendances changent
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, dependencies);
}; 
