import { debounce } from 'lodash';
import React from "react";
import { createRoot } from "react-dom/client";
import { KarmycProvider } from "~/providers/KarmycProvider";
import { sendDiffsToSubscribers } from "~/store/diffSubscription";
import { App } from "./App";
import { store } from "./store";
import { getActionState } from "./utils/stateUtils";


// Rendre le store accessible globalement dès le départ pour les raccourcis clavier
if (typeof window !== 'undefined') {
    (window as any).store = store;

    // Intercepter Ctrl+R et Ctrl+S globalement pour s'assurer que nos raccourcis fonctionnent
    window.addEventListener('keydown', (e) => {
        // Vérifier si on doit intercepter cet événement
        if (e.ctrlKey && (e.key === 'r' || e.key === 'R' || e.key === 's' || e.key === 'S')) {
            e.preventDefault();
            e.stopPropagation();

            // Déterminer quelle action exécuter en fonction de la touche
            const key = e.key.toUpperCase();

            // Exécuter l'action correspondante
            executeShortcutAction(key);

            return false;
        }
    }, { capture: true });

    // Fonction pour exécuter l'action de raccourci
    function executeShortcutAction(key: string) {
        try {
            // Récupérer le store
            const store = (window as any).store;
            if (!store || !store.getState) {
                console.error("Store non disponible pour exécuter l'action de raccourci");
                return;
            }

            // Récupérer l'état actuel
            const state = store.getState();
            if (!state.area) {
                console.error("État de l'area non disponible");
                return;
            }

            // Récupérer la zone active
            const activeAreaId = state.area.activeAreaId;
            if (!activeAreaId) {
                console.warn("Aucune zone active pour exécuter le raccourci");
                return;
            }

            // Récupérer le type de la zone active
            const area = state.area.areas[activeAreaId];
            if (!area) {
                console.warn(`Zone active ${activeAreaId} non trouvée`);
                return;
            }

            const areaType = area.type;

            // Exécuter l'action en fonction du type de zone et de la touche
            switch (areaType) {
            case 'text-note':
                if (key === 'S') {
                    alert(`Texte sauvegardé : ${area.state?.content || ''}`);
                }
                break;

            case 'color-picker':
                if (key === 'R') {
                    // Réinitialiser la couleur directement
                    if (store.dispatch) {
                        const defaultColor = '#1890ff';
                        import('./hooks/useArea').then(module => {
                            const { updateAreaState } = module.useArea();
                            if (updateAreaState) {
                                updateAreaState(activeAreaId, { color: defaultColor });
                            } else {
                                // Fallback direct s'il y a un problème avec le hook
                                import('./store/slices/areaSlice').then(({ updateArea }) => {
                                    store.dispatch(updateArea({
                                        id: activeAreaId,
                                        changes: {
                                            state: { ...area.state, color: defaultColor }
                                        }
                                    }));
                                });
                            }
                        }).catch(error => {
                            console.error("Erreur lors de l'importation du module useArea:", error);
                            // Utiliser directement updateArea en cas d'erreur
                            import('./store/slices/areaSlice').then(({ updateArea }) => {
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
                    // Action de rechargement d'image
                    if (store.dispatch) {
                        // Simuler un rechargement en ajoutant un timestamp à l'URL
                        const newUrl = `https://picsum.photos//300/400?t=${Date.now()}`;

                        // Mettre à jour l'URL de l'image
                        import('./store/slices/areaSlice').then(({ updateArea }) => {
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

            default:
                console.log(`Aucune action définie pour le type ${areaType} et la touche ${key}`);
            }
        } catch (error) {
            console.error("Erreur lors de l'exécution de l'action de raccourci:", error);
        }
    }
}

const Root: React.FC = () => {
    return (
        <KarmycProvider>
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
