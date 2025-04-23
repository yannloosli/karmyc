import {
    KarmycProvider,
    store,
    updateArea,
    useKarmyc
} from '@gamesberry/karmyc-core';
import { debounce } from 'lodash';
import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from 'react-redux';
import { persistStore } from 'redux-persist';
import { PersistGate } from 'redux-persist/integration/react';
import { App } from "./App";

// Utilitaires importés depuis le core
const getActionState = () => store.getState().action;
const sendDiffsToSubscribers = (actionState: any, actions: any[]) => {
    // Implémentation simplifiée
    console.log('Diffusion des changements:', actions);
};

// Make the store globally accessible from the start for keyboard shortcuts
if (typeof window !== 'undefined') {
    (window as any).store = store;

    // Intercept Ctrl+R and Ctrl+S globally to ensure our shortcuts work
    window.addEventListener('keydown', (e) => {
        // Check if we should intercept this event
        if (e.ctrlKey && (e.key === 'r' || e.key === 'R' || e.key === 's' || e.key === 'S')) {
            e.preventDefault();
            e.stopPropagation();

            // Determine which action to execute based on the key
            const key = e.key.toUpperCase();

            // Execute the corresponding action
            executeShortcutAction(key);

            return false;
        }
    }, { capture: true });

    // Function to execute shortcut action
    function executeShortcutAction(key: string) {
        try {
            // Get the store
            const store = (window as any).store;
            if (!store || !store.getState) {
                console.error("Store not available to execute shortcut action");
                return;
            }

            // Get the current state
            const state = store.getState();
            if (!state.area) {
                console.error("Area state not available");
                return;
            }

            // Get the active area
            const activeAreaId = state.area.activeAreaId;
            if (!activeAreaId) {
                console.warn("No active area to execute shortcut");
                return;
            }

            // Get the type of the active area
            const area = state.area.areas[activeAreaId];
            if (!area) {
                console.warn(`Active area ${activeAreaId} not found`);
                return;
            }

            const areaType = area.type;

            // Execute the action based on the area type and key
            switch (areaType) {
            case 'text-note':
                if (key === 'S') {
                    alert(`Text saved: ${area.state?.content || ''}`);
                }
                break;

            case 'color-picker':
                if (key === 'R') {
                    // Reset the color directly
                    if (store.dispatch) {
                        const defaultColor = '#1890ff';
                        store.dispatch(updateArea({
                            id: activeAreaId,
                            changes: {
                                state: { ...area.state, color: defaultColor }
                            }
                        }));
                    }
                }
                break;

            case 'image-viewer':
                if (key === 'R') {
                    // Image reload action
                    if (store.dispatch) {
                        // Simulate reload by adding a timestamp to the URL
                        const newUrl = `https://picsum.photos//300/400?t=${Date.now()}`;

                        // Update the image URL
                        store.dispatch(updateArea({
                            id: activeAreaId,
                            changes: {
                                state: { ...area.state, imageUrl: newUrl }
                            }
                        }));
                    }
                }
                break;

            case 'history-drawing':
                if (key === 'R') {
                    // Clear the drawing
                    if (store.dispatch) {
                        store.dispatch(updateArea({
                            id: activeAreaId,
                            changes: {
                                state: { ...area.state, lines: [] }
                            }
                        }));
                    }
                } else if (key === 'S') {
                    // Simulate drawing save
                    alert('Drawing saved');
                }
                break;

            default:
                console.log(`No action defined for type ${areaType} and key ${key}`);
            }
        } catch (error) {
            console.error("Error executing shortcut action:", error);
        }
    }
}

// Create persistor
const persistor = persistStore(store);

const Root: React.FC = () => {
    // Initialiser Karmyc avec la configuration
    const config = useKarmyc({
        enableLogging: true,
        plugins: [],
        initialAreas: [
            { type: 'text-note', state: { content: 'Exemple de note créée avec useKarmyc' } },
            { type: 'color-picker', state: { color: '#52c41a' } },
            { type: 'image-viewer', state: { imageUrl: 'https://picsum.photos/300/400', caption: 'Image créée avec useKarmyc' } }
        ],
        keyboardShortcutsEnabled: true
    });

    return (
        <KarmycProvider options={config}>
            <App />
        </KarmycProvider>
    );
};

const rootElement = document.getElementById("root");

if (rootElement) {
    const root = createRoot(rootElement);
    root.render(
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                <Root />
            </PersistGate>
        </Provider>
    );
}

// Disable right click context menu
document.addEventListener("contextmenu", (e) => e.preventDefault(), false);

const handleResize = debounce(() => {
    requestAnimationFrame(() => {
        sendDiffsToSubscribers(getActionState(), [{
            id: `resize-${Date.now()}`,
            timestamp: Date.now(),
            type: 'ResizeAreas',
            changes: [],
            metadata: {}
        }]);
    });
}, 100);

window.addEventListener("resize", handleResize);
