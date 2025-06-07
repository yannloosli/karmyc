import React, { useEffect, useRef } from 'react';
import { useKarmycStore, initializeKarmycStore } from '../store/areaStore';
import { IKarmycProviderProps } from '../types/karmyc';
import { KarmycInitializer } from './KarmycInitializer';
import { keyboardShortcutRegistry } from '../store/registries/keyboardShortcutRegistry';
import { checkShouldPreventDefault, ModifierKey } from '../utils/keyboard';

import '@szhsin/react-menu/dist/index.css';
import '@szhsin/react-menu/dist/transitions/zoom.css';

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
    console.log('KarmycProvider - options:', options);

    const isInitialLoad = useRef(true);
    const isUpdatingUrl = useRef(false);
    const lastActiveScreenId = useRef<string | null>(null);
    const lastScreenCount = useRef<number>(0);
    const lastScreenOrder = useRef<string[]>([]);

    // Initialiser le store explicitement
    useEffect(() => {
        initializeKarmycStore(options);
    }, [options]);

    useEffect(() => {
        document.addEventListener("contextmenu", (e) => e.preventDefault(), false);
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

    // Effect 4: Initialize keyboard shortcuts system
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignorer les événements de modificateurs seuls
            if (e.key === 'Control' || e.key === 'Alt' || e.key === 'Shift' || e.key === 'Meta') {
                return;
            }

            // Obtenir les modificateurs actifs directement depuis l'événement
            const activeModifiers = new Set<ModifierKey>();
            if (e.ctrlKey) activeModifiers.add('Control');
            if (e.altKey) activeModifiers.add('Alt');
            if (e.shiftKey) activeModifiers.add('Shift');
            if (e.metaKey) activeModifiers.add('Command');

            // Obtenir l'aire active
            const store = useKarmycStore.getState();
            const activeAreaId = store.screens[store.activeScreenId]?.areas.activeAreaId;
            const activeAreaType = activeAreaId ? store.getAreaById(activeAreaId)?.type : null;

            // Vérifier d'abord les raccourcis globaux
            const globalShortcuts = keyboardShortcutRegistry.getAllShortcuts().filter(s => s.isGlobal);

            for (const shortcut of globalShortcuts) {
                if (shortcut.key.toUpperCase() === e.key.toUpperCase()) {
                    const requiredModifiers = new Set(shortcut.modifierKeys || []);
                    let allModifiersMatch = true;

                    // Vérifier les modificateurs requis
                    for (const modKey of requiredModifiers) {
                        if (!activeModifiers.has(modKey as ModifierKey)) {
                            allModifiersMatch = false;
                            break;
                        }
                    }

                    // Vérifier les modificateurs optionnels
                    if (allModifiersMatch) {
                        const optionalModifiers = new Set(shortcut.optionalModifierKeys || []);
                        for (const activeMod of activeModifiers) {
                            if (!requiredModifiers.has(activeMod) && !optionalModifiers.has(activeMod)) {
                                allModifiersMatch = false;
                                break;
                            }
                        }
                    }

                    // Si c'est un raccourci valide, empêcher le comportement par défaut et exécuter
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

            // Si aucune aire n'est active, on s'arrête là
            if (!activeAreaId || !activeAreaType) {
                return;
            }

            // Vérifier les raccourcis spécifiques à l'aire
            const shortcuts = keyboardShortcutRegistry.getShortcuts(activeAreaType);
            
            for (const shortcut of shortcuts) {
                // Ignorer les raccourcis globaux déjà vérifiés
                if (shortcut.isGlobal) continue;

                if (shortcut.key.toUpperCase() === e.key.toUpperCase()) {
                    const requiredModifiers = new Set(shortcut.modifierKeys || []);
                    let allModifiersMatch = true;

                    // Vérifier les modificateurs requis
                    for (const modKey of requiredModifiers) {
                        if (!activeModifiers.has(modKey as ModifierKey)) {
                            allModifiersMatch = false;
                            break;
                        }
                    }

                    // Vérifier les modificateurs optionnels
                    if (allModifiersMatch) {
                        const optionalModifiers = new Set(shortcut.optionalModifierKeys || []);
                        for (const activeMod of activeModifiers) {
                            if (!requiredModifiers.has(activeMod) && !optionalModifiers.has(activeMod)) {
                                allModifiersMatch = false;
                                break;
                            }
                        }
                    }

                    // Si c'est un raccourci valide, empêcher le comportement par défaut et exécuter
                    if (allModifiersMatch) {
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                            shortcut.fn(activeAreaId, {});
                        } catch (error) {
                            console.error(`Error executing area shortcut ${shortcut.name}:`, error);
                        }
                        return;
                    }
                }
            }

            // Vérifier les raccourcis système
            if (checkShouldPreventDefault(e.key, activeModifiers)) {
                e.preventDefault();
                e.stopPropagation();
            }
        };

        // Utiliser capture pour intercepter l'événement avant qu'il ne soit propagé
        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, []);

    return (
        <>
            <KarmycInitializer options={options} />
            {children}
        </>
    );
}; 
