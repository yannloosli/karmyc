import {
    KarmycProvider,
    useKarmyc
} from '@gamesberry/karmyc-core';
import { useAreaStore } from '@gamesberry/karmyc-core/stores/areaStore';
import { debounce } from 'lodash';
import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App"; // Re-enabled App import

// Remplacer l'accès au store Redux par Zustand
const getAreaState = () => useAreaStore.getState();
const sendDiffsToSubscribers = (actionState: any, actions: any[]) => {
    // Implémentation simplifiée
    console.log('Diffusion des changements:', actions);
};

// Make the store globally accessible from the start for keyboard shortcuts
// Note: L'accès global direct au store Zustand n'est pas idéal, mais gardé pour compatibilité temporaire
if (typeof window !== 'undefined') {
    (window as any).areaStore = useAreaStore;

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
            const areaStore = useAreaStore.getState();
            if (!areaStore) {
                console.error("Store Zustand non disponible pour exécuter l'action de raccourci");
                return;
            }

            // Get the current state
            const state = areaStore;
            if (!state.areas) {
                console.error("Area state (Zustand) non disponible");
                return;
            }

            // Get the active area
            const activeAreaId = state.activeAreaId;
            if (!activeAreaId) {
                console.warn("No active area to execute shortcut");
                return;
            }

            // Get the type of the active area
            const area = state.areas[activeAreaId];
            if (!area) {
                console.warn(`Active area ${activeAreaId} not found`);
                return;
            }

            const areaType = area.type;
            const updateAreaAction = areaStore.updateArea;

            // Execute the action based on the area type and key
            switch (areaType) {
            case 'text-note':
                if (key === 'S') {
                    alert(`Text saved: ${area.state?.content || ''}`);
                }
                break;

            case 'color-picker':
                if (key === 'R') {
                    // Reset the color directly using Zustand action
                    const defaultColor = '#1890ff';
                    updateAreaAction({
                        id: activeAreaId,
                        state: { ...area.state, color: defaultColor }
                    });
                }
                break;

            case 'image-viewer':
                if (key === 'R') {
                    // Image reload action using Zustand action
                    const newUrl = `https://picsum.photos//300/400?t=${Date.now()}`;
                    updateAreaAction({
                        id: activeAreaId,
                        state: { ...area.state, imageUrl: newUrl }
                    });
                }
                break;

            case 'history-drawing':
                if (key === 'R') {
                    // Clear the drawing using Zustand action
                    updateAreaAction({
                        id: activeAreaId,
                        state: { ...area.state, lines: [] }
                    });
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

const Root: React.FC = () => {
    // Initialiser Karmyc avec la configuration - Re-enabled
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
        // Remove ThemeProvider and related isolation code
    );
};

const rootElement = document.getElementById("root");

if (rootElement) {
    const root = createRoot(rootElement);
    root.render(
        <Root />
    );
}

// Disable right click context menu
document.addEventListener("contextmenu", (e) => e.preventDefault(), false);

const handleResize = debounce(() => {
    requestAnimationFrame(() => {
        sendDiffsToSubscribers(getAreaState(), [{
            id: `resize-${Date.now()}`,
            timestamp: Date.now(),
            type: 'ResizeAreas',
            changes: [],
            metadata: {}
        }]);
    });
}, 100);

window.addEventListener("resize", handleResize);
