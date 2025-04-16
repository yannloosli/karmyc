import { debounce } from 'lodash';
import React from "react";
import { createRoot } from "react-dom/client";
import { sendDiffsToSubscribers } from "~/store/diffSubscription";
import { getActionState } from "~/utils/stateUtils";
import { KarmycProvider, store, useKarmyc } from "../lib";
import { App } from "./App";


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
                        import('../lib/hooks/useArea').then(module => {
                            const { updateAreaState } = module.useArea();
                            if (updateAreaState) {
                                updateAreaState(activeAreaId, { color: defaultColor });
                            } else {
                                // Direct fallback if there's a problem with the hook
                                import('../lib/store/slices/areaSlice').then(({ updateArea }) => {
                                    store.dispatch(updateArea({
                                        id: activeAreaId,
                                        changes: {
                                            state: { ...area.state, color: defaultColor }
                                        }
                                    }));
                                });
                            }
                        }).catch(error => {
                            console.error("Error importing useArea module:", error);
                            // Use updateArea directly in case of error
                            import('../lib/store/slices/areaSlice').then(({ updateArea }) => {
                                store.dispatch(updateArea({
                                    id: activeAreaId,
                                    changes: {
                                        state: { ...area.state, color: '#1890ff' }
                                    }
                                }));
                            });
                        });
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
                        import('../lib/store/slices/areaSlice').then(({ updateArea }) => {
                            store.dispatch(updateArea({
                                id: activeAreaId,
                                changes: {
                                    state: { ...area.state, imageUrl: newUrl }
                                }
                            }));
                        });
                    }
                }
                break;

            case 'history-drawing':
                if (key === 'R') {
                    // Clear the drawing
                    if (store.dispatch) {
                        import('../lib/store/slices/areaSlice').then(({ updateArea }) => {
                            store.dispatch(updateArea({
                                id: activeAreaId,
                                changes: {
                                    state: { ...area.state, lines: [] }
                                }
                            }));
                        });
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
    root.render(<Root />);
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
