import React, { useEffect, useRef } from 'react';
import { initializeMainStore, useKarmycStore } from '../data/mainStore';
import { IKarmycProviderProps } from '../types/karmyc';
import { KarmycInitializer } from './KarmycInitializer';
import { keyboardShortcutRegistry } from '../data/registries/keyboardShortcutRegistry';
import { checkShouldPreventDefault, ModifierKey } from '../utils/keyboard';
import { setTranslationFunction } from '../data/utils/translation';

import '@szhsin/react-menu/dist/index.css';
import '@szhsin/react-menu/dist/transitions/zoom.css';


const WINDOW_ID = Math.random().toString(36).slice(2);


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
    options = {},
    onError
}) => {
    const isInitialLoad = useRef(true);
    const isUpdatingUrl = useRef(false);
    const lastActiveScreenId = useRef<string | null>(null);
    const lastScreenCount = useRef<number>(0);
    const lastScreenOrder = useRef<string[]>([]);

    const handleInitializationError = (error: Error) => {
        console.error('[KarmycInitializer] Error during initialization:', error);
        onError?.(error);
    };

    // Initialiser le store explicitement
    useEffect(() => {
        initializeMainStore(options);
        // Initialiser le système de traduction
        if (options.t) {
            setTranslationFunction(options.t);
        }
    }, [options]);

    useEffect(() => {
        // Synchronisation inter-fenêtres : ignorer l'event storage si c'est la même fenêtre
        //        if (typeof window !== 'undefined') {
        let syncTimeout: NodeJS.Timeout | null = null;
        const SYNC_DEBOUNCE_MS = 50; // 50ms debounce

        const handleStorage = (event: StorageEvent) => {
            if (event.key === 'karmycStore') {
                const local = localStorage.getItem('karmycStore');
                if (!local) return;
                const parsed = JSON.parse(local);
                if (parsed?.state?.windowId === WINDOW_ID) return;
                // Récupérer l'état actuel du store
                const currentState = useKarmycStore.getState();
                const localScreens = parsed?.state?.screens || {};
                const incomingLastUpdated = parsed?.state?.lastUpdated || 0;
                const localLastUpdated = currentState.lastUpdated || 0;
                const hasChanges = Object.keys(localScreens).some(screenId => {
                    const localScreen = localScreens[screenId];
                    const currentScreen = currentState.screens[screenId];
                    return !currentScreen || JSON.stringify(localScreen) !== JSON.stringify(currentScreen);
                });

                // Annuler le timeout précédent s'il existe
                if (syncTimeout) {
                    clearTimeout(syncTimeout);
                }

                // Créer un nouveau timeout
                syncTimeout = setTimeout(() => {
                    // Ne mettre à jour que si des changements sont détectés ET si la version reçue est plus récente
                    if (hasChanges && incomingLastUpdated > localLastUpdated) {
                        useKarmycStore.setState((state) => ({
                            ...state,
                            screens: localScreens,
                            lastUpdated: incomingLastUpdated
                        }));
                    }
                    syncTimeout = null;
                }, SYNC_DEBOUNCE_MS);
            }
        }
        window.addEventListener('storage', handleStorage);
        document.addEventListener("contextmenu", (e) => e.preventDefault(), false);

        return () => {
            window.removeEventListener('storage', handleStorage);
            document.removeEventListener("contextmenu", (e) => e.preventDefault(), false);
        }
    }, []);

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

    // Check if the number of screens has changed (screen removal)
    if (currentScreenCount !== lastScreenCount.current) {
        const currentScreenOrder = Object.keys(state.screens).sort((a, b) => parseInt(a) - parseInt(b));

        // If it's the first time, initialize lastScreenOrder
        if (lastScreenOrder.current.length === 0) {
            lastScreenOrder.current = currentScreenOrder;
            lastScreenCount.current = currentScreenCount;
            return;
        }

        // Find the removed screen
        const deletedScreenId = lastScreenOrder.current.find(id => !currentScreenOrder.includes(id));
        if (deletedScreenId) {
            const deletedScreenIndex = lastScreenOrder.current.indexOf(deletedScreenId);
            const oldActiveIndex = lastScreenOrder.current.indexOf(activeScreenId);

            // If the active screen was after the removed screen, we need to adjust its index
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
        return; // Exit the effect after renumbering
    }

    // Check if the active screen is valid (only if no renumbering)
    if (!state.screens[activeScreenId]) {
        console.warn(`[KarmycProvider] Invalid active screen ID '${activeScreenId}', resetting to '1'`);
        useKarmycStore.setState({ activeScreenId: '1' });
        return;
    }

    // Avoid unnecessary updates
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

// Effect 4: Initialize keyboard shortcuts system
useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Vérifier si les raccourcis sont activés
        const store = useKarmycStore.getState();
        if (!store.options.keyboardShortcutsEnabled) {
            return;
        }

        // Ignore modifier-only events
        if (e.key === 'Control' || e.key === 'Alt' || e.key === 'Shift' || e.key === 'Meta') {
            return;
        }

        // Get active modifiers directly from the event
        const activeModifiers = new Set<ModifierKey>();
        if (e.ctrlKey) activeModifiers.add('Control');
        if (e.altKey) activeModifiers.add('Alt');
        if (e.shiftKey) activeModifiers.add('Shift');
        if (e.metaKey) activeModifiers.add('Command');

        // Get the active area
        const activeAreaId = store.screens[store.activeScreenId]?.areas.activeAreaId;
        const activeAreaType = activeAreaId ? store.getAreaById(activeAreaId)?.type : null;

        // Check global shortcuts first
        const globalShortcuts = keyboardShortcutRegistry.getAllShortcuts().filter(s => s.isGlobal);

        for (const shortcut of globalShortcuts) {
            if (shortcut.key.toUpperCase() === e.key.toUpperCase()) {
                const requiredModifiers = new Set(shortcut.modifierKeys || []);
                let allModifiersMatch = true;

                // Check required modifiers
                for (const modKey of requiredModifiers) {
                    if (!activeModifiers.has(modKey as ModifierKey)) {
                        allModifiersMatch = false;
                        break;
                    }
                }

                // Check optional modifiers
                if (allModifiersMatch) {
                    const optionalModifiers = new Set(shortcut.optionalModifierKeys || []);
                    for (const activeMod of activeModifiers) {
                        if (!requiredModifiers.has(activeMod) && !optionalModifiers.has(activeMod)) {
                            allModifiersMatch = false;
                            break;
                        }
                    }
                }

                // If it's a valid shortcut, prevent default behavior and execute
                if (allModifiersMatch) {
                    e.preventDefault();
                    e.stopPropagation();
                    try {
                        shortcut.fn(activeAreaId || '', {});
                    } catch (error) {
                        console.error(`Error executing global shortcut ${shortcut.name}:`, error);
                    }
                    return;
                }
            }
        }

        // If no area is active, stop here
        if (!activeAreaId || !activeAreaType) {
            return;
        }

        // Check area-specific shortcuts
        const shortcuts = keyboardShortcutRegistry.getShortcuts(activeAreaType);

        for (const shortcut of shortcuts) {
            // Ignore global shortcuts already checked
            if (shortcut.isGlobal) continue;

            if (shortcut.key.toUpperCase() === e.key.toUpperCase()) {
                const requiredModifiers = new Set(shortcut.modifierKeys || []);
                let allModifiersMatch = true;

                // Check required modifiers
                for (const modKey of requiredModifiers) {
                    if (!activeModifiers.has(modKey as ModifierKey)) {
                        allModifiersMatch = false;
                        break;
                    }
                }

                // Check optional modifiers
                if (allModifiersMatch) {
                    const optionalModifiers = new Set(shortcut.optionalModifierKeys || []);
                    for (const activeMod of activeModifiers) {
                        if (!requiredModifiers.has(activeMod) && !optionalModifiers.has(activeMod)) {
                            allModifiersMatch = false;
                            break;
                        }
                    }
                }

                // If it's a valid shortcut, prevent default behavior and execute
                if (allModifiersMatch) {
                    e.preventDefault();
                    e.stopPropagation();
                    try {
                        shortcut.fn(activeAreaId, {});
                    } catch (error) {
                        console.error(`Error executing shortcut ${shortcut.name}:`, error);
                    }
                    return;
                }
            }
        }

        // Check system shortcuts
        if (checkShouldPreventDefault(e.key, activeModifiers)) {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    // Use capture to intercept the event before it propagates
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
}, []);

return (
    <KarmycInitializer options={options} onError={handleInitializationError}>
        {children}
    </KarmycInitializer>
);
}; 
