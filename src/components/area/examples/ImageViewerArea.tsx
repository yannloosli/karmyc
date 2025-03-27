import React from 'react';
import { useArea } from '~/hooks/useArea';
import { AreaComponentProps } from '~/types/areaTypes';
import { ImageViewerState } from '~/types/image';
import { useMenuBar } from '../components/MenuBar';
import { useStatusBar } from '../components/StatusBar';
import { useToolbar } from '../components/Toolbar';

export const ImageViewerArea: React.FC<AreaComponentProps<ImageViewerState>> = ({
    id,
    state,
    viewport
}) => {
    const { updateAreaState } = useArea();
    const { registerComponent: registerMenuComponent } = useMenuBar('image-viewer', id);
    const { registerComponent: registerStatusComponent } = useStatusBar('image-viewer', id);
    const {
        registerComponent: registerToolbarComponent,
        registerSlotComponent
    } = useToolbar('image-viewer', id);

    // S'assurer que les propriétés existent
    const image = state?.image || {
        id: Date.now().toString(),
        url: 'https://picsum.photos/300/400',
        caption: '',
        width: 300,
        height: 400
    };
    const zoom = state?.zoom || 1;
    const filter = state?.filter || 'none';

    // Fonction pour changer le zoom
    const handleZoomChange = (newZoom: number) => {
        updateAreaState(id, {
            ...state,
            zoom: Math.max(0.1, Math.min(5, newZoom))
        });
    };

    // Fonction pour charger une nouvelle image
    const reloadImage = () => {
        updateAreaState(id, {
            ...state,
            image: {
                ...image,
                url: `https://picsum.photos/300/400?t=${Date.now()}`
            }
        });
    };

    // Fonction pour changer le filtre
    const handleFilterChange = (newFilter: string) => {
        updateAreaState(id, {
            ...state,
            filter: newFilter
        });
    };

    // Fonction pour changer la légende
    const handleCaptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateAreaState(id, {
            ...state,
            image: {
                ...image,
                caption: e.target.value
            }
        });
    };

    React.useEffect(() => {
        // --- Menu Bar Components ---
        // Sélecteur de filtre
        registerMenuComponent(
            () => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px' }}>Filtre:</span>
                    <select
                        value={filter}
                        onChange={(e) => handleFilterChange(e.target.value)}
                        style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
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
            ),
            { name: 'filterSelector', type: 'menu' },
            { order: 10, width: 'auto' }
        );

        // Bouton de rechargement
        registerMenuComponent(
            () => (
                <button
                    onClick={reloadImage}
                    style={{
                        background: '#1890ff',
                        color: 'white',
                        border: 'none',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        marginLeft: '16px'
                    }}
                >
                    🔄 Nouvelle image
                </button>
            ),
            { name: 'reloadButton', type: 'menu' },
            { order: 20, width: 'auto' }
        );

        // --- Status Bar Components ---
        // Nom de l'image (gauche)
        registerStatusComponent(
            () => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span role="img" aria-label="image">🖼️</span>
                    <span style={{ fontWeight: 'normal' }}>{image.caption || 'Sans titre'}</span>
                </div>
            ),
            { name: 'imageName', type: 'status' },
            { order: 10, alignment: 'left', width: 'auto' }
        );

        // Taille de l'image (centre)
        registerStatusComponent(
            () => (
                <div style={{ textAlign: 'center' }}>
                    300 × 400 px
                </div>
            ),
            { name: 'imageSize', type: 'status' },
            { order: 20, alignment: 'center', width: 'auto' }
        );

        // Zoom (droite)
        registerStatusComponent(
            () => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span role="img" aria-label="zoom">🔍</span>
                    <span>{Math.round(zoom * 100)}%</span>
                </div>
            ),
            { name: 'zoomLevel', type: 'status' },
            { order: 30, alignment: 'right', width: 'auto' }
        );

        // --- Toolbar Components ---
        // Contrôles de zoom
        registerSlotComponent(
            'e',
            () => (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'white',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    border: '1px solid #ccc'
                }}>
                    <button
                        onClick={() => handleZoomChange(zoom * 1.2)}
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
                        onClick={() => handleZoomChange(zoom * 0.8)}
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
            ),
            { name: 'zoomControls', type: 'slot' }
        );

        // --- Slot Components ---
        // Info dans le coin nord-est
        registerSlotComponent(
            'ne',
            () => (
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
            ),
            { name: 'imageInfo', type: 'slot' }
        );

        // Bouton de partage dans le coin sud-ouest
        registerSlotComponent(
            'sw',
            () => (
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
            ),
            { name: 'shareButton', type: 'slot' }
        );

    }, [id, filter, zoom, image.caption, registerMenuComponent, registerStatusComponent, registerToolbarComponent, registerSlotComponent]);

    return (
        <div style={{
            width: viewport.width,
            height: viewport.height,
            padding: '1rem',
            background: '#fff',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
        }}>
            {/* Zone d'affichage de l'image */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden'
            }}>
                <img
                    src={image.url}
                    alt={image.caption}
                    style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        transform: `scale(${zoom})`,
                        filter: filter,
                        pointerEvents: 'none',
                        transition: 'filter 0.3s'
                    }}
                />
            </div>

            {/* Zone de légende */}
            <input
                type="text"
                value={image.caption || ''}
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
