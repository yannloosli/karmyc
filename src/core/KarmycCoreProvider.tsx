import React, { useEffect, useRef, useState } from 'react';
import { useKarmycStore } from './store';
import { IKarmycCoreProviderProps } from './types/karmyc';
import { keyboardShortcutRegistry } from './registries/keyboardShortcutRegistry';
import { checkShouldPreventDefault, ModifierKey } from '../utils/keyboard';

const WINDOW_ID = Math.random().toString(36).slice(2);

/**
 * Composant principal qui fournit le contexte global pour le système de layout
 * 
 * Ce composant gère :
 * - La synchronisation entre les onglets
 * - Les raccourcis clavier
 * - La synchronisation de l'URL
 */
export const KarmycCoreProvider: React.FC<IKarmycCoreProviderProps> = ({
    children,
    onError
}) => {
    const isInitialLoad = useRef(true);
    const isUpdatingUrl = useRef(false);
    const lastActiveScreenId = useRef<string | null>(null);
    const lastScreenCount = useRef<number>(0);
    const lastScreenOrder = useRef<string[]>([]);
    const [isMounted, setIsMounted] = useState(false);

    // S'assurer que le composant est monté avant d'utiliser les hooks
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Effect 1: Read URL on initial load and set active screen
    useEffect(() => {
        if (!isMounted) return;

        const params = new URLSearchParams(window.location.search);
        const screenIdFromUrl = params.get('screen');

        if (screenIdFromUrl) {
            const state = useKarmycStore.getState();
            if (state.screens[screenIdFromUrl]) {
                useKarmycStore.setState({ activeScreenId: screenIdFromUrl });
                lastActiveScreenId.current = screenIdFromUrl;
            } else {
                console.warn(`[KarmycCoreProvider] Screen ID '${screenIdFromUrl}' from URL not found in store.`);
                const url = new URL(window.location.href);
                url.searchParams.delete('screen');
                window.history.replaceState({}, '', url.toString());
            }
        }
        const timer = setTimeout(() => {
            isInitialLoad.current = false;
        }, 0);
        return () => clearTimeout(timer);
    }, [isMounted]);

    // Effect 2: Update URL when activeScreenId changes
    const activeScreenId = useKarmycStore(state => state.activeScreenId);
    const screens = useKarmycStore(state => state.screens);
    useEffect(() => {
        if (!isMounted || isInitialLoad.current || isUpdatingUrl.current) {
            return;
        }

        const state = useKarmycStore.getState();
        const currentScreenCount = Object.keys(state.screens).length;

        if (currentScreenCount !== lastScreenCount.current) {
            const currentScreenOrder = Object.keys(state.screens).sort((a, b) => parseInt(a) - parseInt(b));

            if (lastScreenOrder.current.length === 0) {
                lastScreenOrder.current = currentScreenOrder;
                lastScreenCount.current = currentScreenCount;
                return;
            }

            const deletedScreenId = lastScreenOrder.current.find(id => !currentScreenOrder.includes(id));
            if (deletedScreenId) {
                const deletedScreenIndex = lastScreenOrder.current.indexOf(deletedScreenId);
                const oldActiveIndex = lastScreenOrder.current.indexOf(activeScreenId);

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
            return;
        }

        if (!state.screens[activeScreenId]) {
            console.warn(`[KarmycCoreProvider] Invalid active screen ID '${activeScreenId}', resetting to '1'`);
            useKarmycStore.setState({ activeScreenId: '1' });
            return;
        }

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
            window.history.replaceState({}, '', currentUrl.toString());
            isUpdatingUrl.current = false;
            lastActiveScreenId.current = activeScreenId;
        }
    }, [isMounted, activeScreenId, screens]);

    // Effect 3: Sync between tabs
    useEffect(() => {
        if (!isMounted) return;

        let syncTimeout: NodeJS.Timeout | null = null;
        const SYNC_DEBOUNCE_MS = 50;

        const handleStorage = (event: StorageEvent) => {
            if (event.key === 'karmyc-store') {
                const local = localStorage.getItem('karmyc-store');
                if (!local) return;
                const parsed = JSON.parse(local);
                if (parsed?.state?.windowId === WINDOW_ID) return;

                const currentState = useKarmycStore.getState();
                const localScreens = parsed?.state?.screens || {};
                const incomingLastUpdated = parsed?.state?.lastUpdated || 0;
                const localLastUpdated = currentState.lastUpdated || 0;
                const hasChanges = Object.keys(localScreens).some(screenId => {
                    const localScreen = localScreens[screenId];
                    const currentScreen = currentState.screens[screenId];
                    return !currentScreen || JSON.stringify(localScreen) !== JSON.stringify(currentScreen);
                });

                if (syncTimeout) {
                    clearTimeout(syncTimeout);
                }

                syncTimeout = setTimeout(() => {
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
    }, [isMounted]);

    // Effect 4: Keyboard shortcuts
    useEffect(() => {
        if (!isMounted) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const store = useKarmycStore.getState();
            if (!store.options.keyboardShortcutsEnabled) {
                return;
            }

            if (e.key === 'Control' || e.key === 'Alt' || e.key === 'Shift' || e.key === 'Meta') {
                return;
            }

            const activeModifiers = new Set<ModifierKey>();
            if (e.ctrlKey) activeModifiers.add('Control');
            if (e.altKey) activeModifiers.add('Alt');
            if (e.shiftKey) activeModifiers.add('Shift');
            if (e.metaKey) activeModifiers.add('Command');

            const activeAreaId = store.screens[store.activeScreenId]?.areas.activeAreaId;
            const activeAreaType = activeAreaId ? store.getAreaById(activeAreaId)?.type : null;

            const globalShortcuts = keyboardShortcutRegistry.getAllShortcuts().filter(s => s.isGlobal);

            for (const shortcut of globalShortcuts) {
                if (shortcut.key.toUpperCase() === e.key.toUpperCase()) {
                    const requiredModifiers = new Set(shortcut.modifierKeys || []);
                    let allModifiersMatch = true;

                    for (const modKey of requiredModifiers) {
                        if (!activeModifiers.has(modKey as ModifierKey)) {
                            allModifiersMatch = false;
                            break;
                        }
                    }

                    if (allModifiersMatch) {
                        const optionalModifiers = new Set(shortcut.optionalModifierKeys || []);
                        for (const activeMod of activeModifiers) {
                            if (!requiredModifiers.has(activeMod) && !optionalModifiers.has(activeMod)) {
                                allModifiersMatch = false;
                                break;
                            }
                        }
                    }

                    if (allModifiersMatch) {
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                            shortcut.fn(activeAreaId || '', {});
                        } catch (error) {
                            console.error(`Error executing global shortcut ${shortcut.name}:`, error);
                            onError?.(error instanceof Error ? error : new Error(String(error)));
                        }
                        return;
                    }
                }
            }

            if (!activeAreaId || !activeAreaType) {
                return;
            }

            const shortcuts = keyboardShortcutRegistry.getShortcuts(activeAreaType);

            for (const shortcut of shortcuts) {
                if (shortcut.isGlobal) continue;

                if (shortcut.key.toUpperCase() === e.key.toUpperCase()) {
                    const requiredModifiers = new Set(shortcut.modifierKeys || []);
                    let allModifiersMatch = true;

                    for (const modKey of requiredModifiers) {
                        if (!activeModifiers.has(modKey as ModifierKey)) {
                            allModifiersMatch = false;
                            break;
                        }
                    }

                    if (allModifiersMatch) {
                        const optionalModifiers = new Set(shortcut.optionalModifierKeys || []);
                        for (const activeMod of activeModifiers) {
                            if (!requiredModifiers.has(activeMod) && !optionalModifiers.has(activeMod)) {
                                allModifiersMatch = false;
                                break;
                            }
                        }
                    }

                    if (allModifiersMatch) {
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                            shortcut.fn(activeAreaId, {});
                        } catch (error) {
                            console.error(`Error executing shortcut ${shortcut.name}:`, error);
                            onError?.(error instanceof Error ? error : new Error(String(error)));
                        }
                        return;
                    }
                }
            }

            if (checkShouldPreventDefault(e.key, activeModifiers)) {
                e.preventDefault();
                e.stopPropagation();
            }
        };

        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [isMounted, onError]);

    return (
        <>
            {children}
        </>
    );
}; 
