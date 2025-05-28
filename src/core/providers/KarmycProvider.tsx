import React, { useEffect, useRef } from 'react';
import { useKarmycStore } from '../stores/areaStore';
import { IKarmycProviderProps } from '../types/karmyc';
import { KarmycInitializer } from './KarmycInitializer';

/**
 * Main component that provides the global context for the layout system
 * 
 * This component encapsulates:
 * - System initialization with specified options
 * - The context menu provider
 * - URL synchronization for active screen
 */
export const KarmycProvider: React.FC<IKarmycProviderProps> = ({
    children,
    options = {}
}) => {
    const isInitialLoad = useRef(true);
    const isUpdatingUrl = useRef(false);
    const lastActiveScreenId = useRef<string | null>(null);
    const lastScreenCount = useRef<number>(0);
    const lastScreenOrder = useRef<string[]>([]);

    // Effect 1: Read URL on initial load and set active screen
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const screenIdFromUrl = params.get('screen');

        if (screenIdFromUrl) {
            const state = useKarmycStore.getState();
            if (state.screens[screenIdFromUrl]) {
                // Set state directly, effect 2 will handle URL update if needed after init
                useKarmycStore.setState({ activeScreenId: screenIdFromUrl });
                lastActiveScreenId.current = screenIdFromUrl;
            } else {
                console.warn(`[KarmycProvider] Screen ID '${screenIdFromUrl}' from URL not found in store.`);
                // Remove invalid param from URL
                const url = new URL(window.location.href);
                url.searchParams.delete('screen');
                window.history.replaceState({}, '', url.toString());
            }
        }
        // Mark initial load as done *after* potential state set
        const timer = setTimeout(() => {
            isInitialLoad.current = false;
        }, 0);
        return () => clearTimeout(timer);
    }, []); // Run only once on mount

    // Effect 2: Update URL when activeScreenId changes in the store
    const activeScreenId = useKarmycStore(state => state.activeScreenId);
    const screens = useKarmycStore(state => state.screens);
    useEffect(() => {
        // Don't update URL during the very initial load/check phase
        if (isInitialLoad.current || isUpdatingUrl.current) {
            return;
        }

        const state = useKarmycStore.getState();
        const currentScreenCount = Object.keys(state.screens).length;

        // Vérifier si le nombre d'écrans a changé (suppression d'écran)
        if (currentScreenCount !== lastScreenCount.current) {
            const currentScreenOrder = Object.keys(state.screens).sort((a, b) => parseInt(a) - parseInt(b));

            // Si c'est la première fois, initialiser lastScreenOrder
            if (lastScreenOrder.current.length === 0) {
                lastScreenOrder.current = currentScreenOrder;
                lastScreenCount.current = currentScreenCount;
                return;
            }

            // Trouver l'écran supprimé
            const deletedScreenId = lastScreenOrder.current.find(id => !currentScreenOrder.includes(id));
            if (deletedScreenId) {
                const deletedScreenIndex = lastScreenOrder.current.indexOf(deletedScreenId);
                const oldActiveIndex = lastScreenOrder.current.indexOf(activeScreenId);

                // Si l'écran actif était après l'écran supprimé, on doit ajuster son index
                if (oldActiveIndex > deletedScreenIndex) {
                    const newIndex = oldActiveIndex - 1;
                    const newActiveScreenId = currentScreenOrder[newIndex];
                    if (newActiveScreenId) {
                        useKarmycStore.setState({ activeScreenId: newActiveScreenId });
                        lastActiveScreenId.current = newActiveScreenId;
                    }
                }
            }

            lastScreenOrder.current = currentScreenOrder;
            lastScreenCount.current = currentScreenCount;
            return; // Sortir de l'effet après la renumérotation
        }

        // Vérifier si l'écran actif est valide (uniquement si pas de renumérotation)
        if (!state.screens[activeScreenId]) {
            console.warn(`[KarmycProvider] Invalid active screen ID '${activeScreenId}', resetting to '1'`);
            useKarmycStore.setState({ activeScreenId: '1' });
            return;
        }

        // Éviter les mises à jour inutiles
        if (lastActiveScreenId.current === activeScreenId) {
            return;
        }

        const currentUrl = new URL(window.location.href);
        const currentScreenParam = currentUrl.searchParams.get('screen');

        if (activeScreenId !== currentScreenParam) {
            isUpdatingUrl.current = true;
            if (activeScreenId) {
                currentUrl.searchParams.set('screen', activeScreenId);
            } else {
                currentUrl.searchParams.delete('screen');
            }
            // Use replaceState to avoid polluting browser history
            window.history.replaceState({}, '', currentUrl.toString());
            isUpdatingUrl.current = false;
            lastActiveScreenId.current = activeScreenId;
        }
    }, [activeScreenId, screens]); // Re-run when activeScreenId or screens change

    // Effect 3: Listen for localStorage changes to sync space-storage across tabs


    return (
        <>
            <KarmycInitializer options={options} />
            {children}
        </>
    );
}; 
