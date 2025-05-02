import React, { useEffect, useRef } from 'react';
import { ContextMenuProvider } from '../components/context-menu/ContextMenuProvider';
import { useKarmycStore } from '../stores/areaStore';
import { useSpaceStore } from '../stores/spaceStore';
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

    // Effect 1: Read URL on initial load and set active screen
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const screenIdFromUrl = params.get('screen');

        if (screenIdFromUrl) {
            const state = useKarmycStore.getState();
            if (state.screens[screenIdFromUrl]) {
                // Set state directly, effect 2 will handle URL update if needed after init
                useKarmycStore.setState({ activeScreenId: screenIdFromUrl });
            } else {
                console.warn(`[KarmycProvider] Screen ID '${screenIdFromUrl}' from URL not found in store.`);
                // Optionally, remove invalid param? Or just let effect 2 correct it?
                // Let effect 2 handle correcting the URL based on the *actual* activeScreenId
            }
        }
        // Mark initial load as done *after* potential state set
        // Use timeout to ensure this runs after the initial render potentially triggered by setState
        const timer = setTimeout(() => {
            isInitialLoad.current = false;
        }, 0);
        return () => clearTimeout(timer);

    }, []); // Run only once on mount

    // Effect 2: Update URL when activeScreenId changes in the store
    const activeScreenId = useKarmycStore(state => state.activeScreenId);
    useEffect(() => {
        // Don't update URL during the very initial load/check phase
        if (isInitialLoad.current) {
            // Wait for the initial load ref to be set to false by effect 1's timeout
            return;
        }

        const currentUrl = new URL(window.location.href);
        const currentScreenParam = currentUrl.searchParams.get('screen');

        if (activeScreenId !== currentScreenParam) {
            if (activeScreenId) {
                currentUrl.searchParams.set('screen', activeScreenId);
            } else {
                // Should not happen, but handle defensively
                currentUrl.searchParams.delete('screen');
            }
            // Use replaceState to avoid polluting browser history
            window.history.replaceState({}, '', currentUrl.toString());
        }
    }, [activeScreenId]); // Re-run only when activeScreenId changes

    // Effect 3: Listen for localStorage changes to sync space-storage across tabs
    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            // Vérifier la clé, la nouvelle valeur et que c'est bien localStorage
            if (event.key === 'space-storage' && event.newValue && event.storageArea === localStorage) {
                // Tenter de réhydrater le store des spaces
                // Cela devrait déclencher la fonction merge définie dans persistConfig
                useSpaceStore.persist.rehydrate();
            }
        };

        window.addEventListener('storage', handleStorageChange);

        // Nettoyer l'écouteur au démontage
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []); // Exécuter une seule fois au montage de chaque instance/onglet

    return (
        <>
            <KarmycInitializer options={options} />
            <ContextMenuProvider>
                {children}
            </ContextMenuProvider>
        </>
    );
}; 
