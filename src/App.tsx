import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AreaRoot } from "~/components/area/components/AreaRoot";
import { useRegisterContextMenuAction } from "~/hooks";
import { useArea } from "~/hooks/useArea";
import { store } from "~/store";
import { setAreaType } from "~/store/slices/areaSlice";
import { RootState } from '~/store/store';
import { areaRegistry } from './area/registry';
import { AreaInitializer } from './components/area/AreaInitializer';
import { MenuBar } from './components/area/components/MenuBar';
import { StatusBar, useStatusBar } from './components/area/components/StatusBar';
import { useToolbar } from './components/area/components/Toolbar';
import { ImagesGalleryArea } from "./components/area/examples/ImagesGalleryArea";
import { getActiveAreaId } from './store/selectors/areaSelectors';


// Importation du CSS pour les areas
import './styles/area.css';

// Déterminer si une couleur doit avoir un texte clair ou sombre
function getContrastColor(hexColor: string): string {
    // Convertir le code hexadécimal en RGB
    const r = parseInt(hexColor.substring(1, 3), 16);
    const g = parseInt(hexColor.substring(3, 5), 16);
    const b = parseInt(hexColor.substring(5, 7), 16);

    // Calculer la luminosité
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Si la luminosité est élevée (couleur claire), retourner du texte noir, sinon du texte blanc
    return luminance > 0.5 ? '#000000' : '#ffffff';
}

// Composant pour une zone de couleur personnalisée
const ColorPickerArea: React.FC<{ id: string; state: any; isActive?: boolean }> = ({
    id,
    state = {},
    isActive = false
}) => {
    const { updateAreaState } = useArea();

    // S'assurer que state.color existe
    const color = state?.color || '#1890ff';

    const colors = ['#f5222d', '#fa8c16', '#fadb14', '#52c41a', '#1890ff', '#722ed1', '#eb2f96'];

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                background: isActive ? '#e6f7ff' : '#f5f5f5',
                border: isActive ? '2px solid #1890ff' : '1px solid #d9d9d9',
                borderRadius: '4px',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <div style={{
                fontWeight: 'bold',
                marginBottom: '4px',
                padding: '4px',
                background: '#f0f0f0',
                borderRadius: '2px'
            }}>
                Palette de couleurs
            </div>
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{
                    background: color,
                    color: getContrastColor(color),
                    width: '100%',
                    padding: '20px 0',
                    textAlign: 'center',
                    borderRadius: '4px',
                    marginBottom: '10px',
                    fontWeight: 'bold'
                }}>
                    {color}
                </div>
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: '5px'
                }}>
                    {colors.map(c => (
                        <div
                            key={c}
                            style={{
                                width: '30px',
                                height: '30px',
                                background: c,
                                cursor: 'pointer',
                                borderRadius: '4px',
                                border: c === color ? '2px solid #000' : '1px solid #d9d9d9'
                            }}
                            onClick={() => updateAreaState(id, { color: c })}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

// Composant pour une zone d'image personnalisée
const ImageViewerArea: React.FC<{ id: string; state: any; type: string; isActive?: boolean }> = ({
    id,
    state = {},
    type,
    isActive = false
}) => {
    const { updateAreaState } = useArea();
    const { registerComponent: registerMenuComponent } = useMenuBar(type, id);
    const { registerComponent: registerStatusComponent } = useStatusBar(type, id);
    const {
        registerComponent: registerToolbarComponent,
        registerSlotComponent
    } = useToolbar(type, id);

    // S'assurer que les propriétés existent
    const imageUrl = state?.imageUrl || 'https://picsum.photos/300/400';
    const caption = state?.caption || '';
    const zoom = state?.zoom || 1;

    const handleCaptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateAreaState(id, {
            ...state,
            caption: e.target.value
        });
    };

    // Fonction pour changer le zoom
    const handleZoomChange = (newZoom: number) => {
        updateAreaState(id, {
            ...state,
            zoom: newZoom
        });
    };

    // Fonction pour charger une nouvelle image
    const reloadImage = () => {
        updateAreaState(id, {
            ...state,
            imageUrl: `https://picsum.photos/300/400?t=${Date.now()}`
        });
    };

    useEffect(() => {
        // --- Menu Bar Components ---

        // Bouton de rechargement d'image dans la barre de menu
        const reloadButtonId = registerMenuComponent(
            ({ areaId }: { areaId: string }) => (
                <button
                    onClick={() => reloadImage()}
                    style={{
                        background: '#1890ff',
                        color: 'white',
                        border: 'none',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer'
                    }}
                >
                    🔄 Nouvelle image
                </button>
            ),
            { order: 10, width: 'auto' }
        );

        // Sélecteur de filtre d'image
        const filterSelectId = registerMenuComponent(
            ({ areaId, areaState }: { areaId: string; areaState: any }) => {
                const currentFilter = areaState.filter || 'none';
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '12px' }}>Filtre:</span>
                        <select
                            value={currentFilter}
                            onChange={(e) => {
                                updateAreaState(areaId, {
                                    ...areaState,
                                    filter: e.target.value
                                });
                            }}
                            style={{
                                padding: '1px 4px',
                                borderRadius: '2px',
                                border: '1px solid #d9d9d9'
                            }}
                        >
                            <option value="none">Normal</option>
                            <option value="grayscale(100%)">Noir & Blanc</option>
                            <option value="sepia(70%)">Sépia</option>
                            <option value="brightness(120%)">Lumineux</option>
                            <option value="contrast(150%)">Contraste</option>
                            <option value="hue-rotate(90deg)">Teinte</option>
                            <option value="invert(80%)">Inversé</option>
                            <option value="blur(2px)">Flou</option>
                        </select>
                    </div>
                );
            },
            { order: 20, width: 'auto' }
        );

        // --- Status Bar Components ---

        // Information sur l'image côté gauche
        const infoStatusId = registerStatusComponent(
            ({ areaState }) => (
                <div>
                    <span role="img" aria-label="Image">🖼️</span> {areaState.caption || 'Sans titre'}
                </div>
            ),
            { order: 10, alignment: 'left', width: 'auto' }
        );

        // Affichage du zoom à droite
        const zoomStatusId = registerStatusComponent(
            ({ areaState }) => (
                <div>
                    <span role="img" aria-label="Zoom">🔍</span> {Math.round((areaState.zoom || 1) * 100)}%
                </div>
            ),
            { order: 10, alignment: 'right', width: 'auto' }
        );

        // --- Toolbar Components ---

        // Boutons de zoom dans la barre d'outils
        const zoomToolbarId = registerToolbarComponent(
            ({ areaId, areaState }) => {
                const currentZoom = areaState.zoom || 1;
                return (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        background: 'white',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        border: '1px solid #ccc'
                    }}>
                        <button
                            onClick={() => handleZoomChange(currentZoom + 0.1)}
                            style={{
                                background: '#f5f5f5',
                                border: 'none',
                                borderBottom: '1px solid #ccc',
                                padding: '4px 8px',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            🔍+
                        </button>
                        <button
                            onClick={() => handleZoomChange(1)}
                            style={{
                                background: '#f5f5f5',
                                border: 'none',
                                borderBottom: '1px solid #ccc',
                                padding: '4px 8px',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                        >
                            100%
                        </button>
                        <button
                            onClick={() => handleZoomChange(currentZoom - 0.1 > 0.1 ? currentZoom - 0.1 : 0.1)}
                            style={{
                                background: '#f5f5f5',
                                border: 'none',
                                padding: '4px 8px',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            🔍-
                        </button>
                    </div>
                );
            },
            { order: 10 }
        );

        // --- Slot Components ---

        // Slot nord-est pour les infos d'image
        const infoSlotId = registerSlotComponent(
            'ne',
            ({ areaState }) => (
                <div style={{
                    padding: '5px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                }}>
                    <span role="img" aria-label="Information">ℹ️</span>
                    <span>Image aléatoire</span>
                </div>
            )
        );

        // Slot sud-ouest pour les actions rapides
        const shareSlotId = registerSlotComponent(
            'sw',
            ({ areaId }) => (
                <div style={{ padding: '5px' }}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            alert('Partage de l\'image simulé!');
                        }}
                        style={{
                            background: '#52c41a',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            cursor: 'pointer',
                            fontSize: '12px'
                        }}
                    >
                        <span role="img" aria-label="Partager">📤</span> Partager
                    </button>
                </div>
            )
        );

        // Nettoyage lors du démontage
        return () => {
            // On pourrait désinscrire tous les composants ici si nécessaire
        };
    }, [
        id,
        registerMenuComponent,
        registerStatusComponent,
        registerToolbarComponent,
        registerSlotComponent,
        updateAreaState
    ]);

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                background: isActive ? '#e6f7ff' : '#f5f5f5',
                borderRadius: '4px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}
        >
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
            }}>
                <img
                    src={imageUrl}
                    alt={caption}
                    style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                        transform: `scale(${zoom})`,
                        transition: 'transform 0.2s',
                        filter: state.filter || 'none'
                    }}
                />
            </div>
            <input
                type="text"
                value={caption}
                onChange={handleCaptionChange}
                placeholder="Légende de l'image"
                style={{
                    border: '1px solid #d9d9d9',
                    borderRadius: '2px',
                    padding: '4px',
                    margin: '0 8px 8px 8px',
                    fontFamily: 'inherit'
                }}
            />
        </div>
    );
};

const useAreaSetup = () => {
    const dispatch = useDispatch();
    const registerContextMenuAction = useRegisterContextMenuAction();

    useEffect(() => {
        // Enregistrer le composant ColorPickerArea
        if (!areaRegistry.getComponent('color-picker')) {
            areaRegistry.registerComponent('color-picker', ColorPickerArea);
            areaRegistry.registerDisplayName('color-picker', 'Palette de couleurs');
            areaRegistry.registerInitialState('color-picker', {
                color: '#1890ff'
            });
        }

        // Enregistrer le composant ImageViewerArea
        if (!areaRegistry.getComponent('image-viewer')) {
            areaRegistry.registerComponent('image-viewer', ImageViewerArea);
            areaRegistry.registerDisplayName('image-viewer', 'Visionneuse d\'images');
            areaRegistry.registerInitialState('image-viewer', {
                imageUrl: 'https://picsum.photos//300/400',
                caption: '',
                zoom: 1,
                filter: 'none'
            });
        }

        // Enregistrer le composant ImagesGalleryArea
        if (!areaRegistry.getComponent('images-gallery')) {
            areaRegistry.registerComponent('images-gallery', ImagesGalleryArea);
            areaRegistry.registerDisplayName('images-gallery', 'Galerie d\'images');
            areaRegistry.registerInitialState('images-gallery', {
                images: [],
                selectedImageId: null,
                zoom: 1,
                filter: 'none',
                sortBy: 'default'
            });
        }
    }, []); // Enregistrement des composants une seule fois

    useEffect(() => {
        // Définir les gestionnaires d'actions
        const handleColorPicker = (params: any) => {
            const areaId = params.areaId || params.itemMetadata?.areaId;
            if (areaId) {
                dispatch(setAreaType({
                    areaId,
                    type: 'color-picker',
                    initialState: { color: '#1890ff' }
                }));
            }
        };

        const handleImageViewer = (params: any) => {
            const areaId = params.areaId || params.itemMetadata?.areaId;
            if (areaId) {
                dispatch(setAreaType({
                    areaId,
                    type: 'image-viewer',
                    initialState: {
                        imageUrl: 'https://picsum.photos//300/400',
                        caption: '',
                        zoom: 1,
                        filter: 'none'
                    }
                }));
            }
        };

        const handleImagesGallery = (params: any) => {
            const areaId = params.areaId || params.itemMetadata?.areaId;
            if (areaId) {
                dispatch(setAreaType({
                    areaId,
                    type: 'images-gallery',
                    initialState: {
                        images: [],
                        selectedImageId: null,
                        zoom: 1,
                        filter: 'none',
                        sortBy: 'default'
                    }
                }));
            }
        };

        // Enregistrer les actions du menu contextuel
        registerContextMenuAction('area', {
            id: 'create-color-picker',
            label: 'Convertir en palette',
            handler: () => {
                const state = store.getState();
                const activeAreaId = getActiveAreaId(state);
                if (activeAreaId) {
                    handleColorPicker({ areaId: activeAreaId });
                }
            }
        });

        registerContextMenuAction('area', {
            id: 'create-image-viewer',
            label: 'Convertir en image',
            handler: () => {
                const state = store.getState();
                const activeAreaId = getActiveAreaId(state);
                if (activeAreaId) {
                    handleImageViewer({ areaId: activeAreaId });
                }
            }
        });

        registerContextMenuAction('area', {
            id: 'create-images-gallery',
            label: 'Convertir en galerie',
            handler: () => {
                const state = store.getState();
                const activeAreaId = getActiveAreaId(state);
                if (activeAreaId) {
                    handleImagesGallery({ areaId: activeAreaId });
                }
            }
        });

        // Enregistrer les gestionnaires d'actions
        const unregisterHandlers = [
            { action: 'area.create-color-picker', handler: handleColorPicker },
            { action: 'area.create-image-viewer', handler: handleImageViewer },
            { action: 'area.create-images-gallery', handler: handleImagesGallery }
        ].map(({ action, handler }) => {
            const unregister = store.subscribe(() => {
                const state = store.getState();
                if (state.actionRegistry?.[action]) {
                    handler(state.actionRegistry[action]);
                }
            });
            return unregister;
        });

        // Nettoyage lors du démontage
        return () => {
            unregisterHandlers.forEach(unregister => unregister());
        };
    }, [dispatch, registerContextMenuAction]);
};

// Composant pour réinitialiser l'état
const ResetButtonWrapper: React.FC = () => {
    const { updateAreaState } = useArea();
    const areas = useSelector((state: RootState) => state.area.areas);
    const activeAreaId = useSelector((state: RootState) => state.area.activeAreaId);

    const handleReset = () => {
        if (activeAreaId && areas[activeAreaId]) {
            const area = areas[activeAreaId];
            const initialState = areaRegistry.getInitialState(area.type);
            if (initialState) {
                updateAreaState(activeAreaId, initialState);
            }
        }
    };

    return (
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
            <button
                onClick={handleReset}
                style={{
                    background: '#ff4d4f',
                    color: 'white',
                    border: 'none',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                }}
            >
                <span role="img" aria-label="reset">🔄</span>
                Réinitialiser la zone active
            </button>
        </div>
    );
};

// Simplifier AreaSetup pour ne plus créer de boutons de réinitialisation
const AreaSetup: React.FC = () => {
    useAreaSetup();
    return null;
};

export const App: React.FC = () => {
    const { createArea } = useArea();
    const { registerComponent: registerRootStatusComponent } = useStatusBar('app', 'root');

    useEffect(() => {
        registerRootStatusComponent(
            ResetButtonWrapper,
            {
                name: 'resetButton',
                type: 'status'
            },
            {
                order: 999,
                alignment: 'right',
                width: 'auto'
            }
        );
    }, [registerRootStatusComponent]);

    // Créer des zones personnalisées au chargement
    useEffect(() => {
        // Vérifier si les zones existent déjà (pour éviter les doublons au rechargement)
        const state = store.getState();
        if (state && state.area && Object.keys(state.area.areas).length === 0) {
            // Créer une palette de couleurs
            createArea('color-picker', { color: '#52c41a' }, { x: 500, y: 100 });

            // Créer un visualiseur d'image
            createArea('image-viewer', {
                imageUrl: 'https://picsum.photos/300/400',
                caption: 'Une image aléatoire avec la nouvelle structure'
            }, { x: 100, y: 350 });

            // Créer une galerie d'images
            createArea('images-gallery', {
                images: [
                    { id: '1', url: 'https://picsum.photos/id/1/300/200', title: 'Ordinateur portable sur bureau' },
                    { id: '2', url: 'https://picsum.photos/id/24/300/200', title: 'Livre ouvert' },
                    { id: '3', url: 'https://picsum.photos/id/37/300/200', title: 'Fleurs blanches' },
                    { id: '4', url: 'https://picsum.photos/id/48/300/200', title: 'Vieux bâtiment' },
                    { id: '5', url: 'https://picsum.photos/id/96/300/200', title: 'Paysage de montagne' },
                    { id: '6', url: 'https://picsum.photos/id/116/300/200', title: 'Scène urbaine' }
                ],
                selectedImageId: '1',
                zoom: 1,
                filter: 'none',
                sortBy: 'default'
            }, { x: 500, y: 350 });
        }
    }, [createArea]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            width: '100vw',
            overflow: 'hidden'
        }}>
            <AreaSetup />
            <AreaInitializer />
            <MenuBar areaId="root" areaState={{}} areaType="app" />
            <AreaRoot />
            <StatusBar areaId="root" areaState={{}} areaType="app" />
        </div>
    );
};
