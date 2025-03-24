import React from 'react';
import { useArea } from '~/hooks/useArea';
import { AreaComponentProps } from '~/types/areaTypes';

interface ImageViewerState {
    imageUrl: string;
    caption: string;
    zoom?: number;
    filter?: string;
}

export const ImageViewerArea: React.FC<AreaComponentProps<ImageViewerState>> = ({
    id,
    state,
    viewport
}) => {
    const { updateAreaState } = useArea();

    // S'assurer que les propriétés existent
    const imageUrl = state?.imageUrl || 'https://picsum.photos/300/400';
    const caption = state?.caption || '';
    const zoom = state?.zoom || 1;
    const filter = state?.filter || 'none';

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
            <div style={{
                flex: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden'
            }}>
                <img
                    src={imageUrl}
                    alt={caption}
                    style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        transform: `scale(${zoom})`,
                        filter: filter,
                        transition: 'transform 0.3s, filter 0.3s'
                    }}
                />
            </div>
            <div style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'center'
            }}>
                <input
                    type="text"
                    value={caption}
                    onChange={handleCaptionChange}
                    placeholder="Ajouter une légende..."
                    style={{
                        flex: 1,
                        padding: '0.5rem',
                        border: '1px solid #d9d9d9',
                        borderRadius: '4px'
                    }}
                />
                <button
                    onClick={() => handleZoomChange(zoom - 0.1)}
                    style={{
                        padding: '0.5rem',
                        border: '1px solid #d9d9d9',
                        borderRadius: '4px',
                        background: '#fff',
                        cursor: 'pointer'
                    }}
                >
                    -
                </button>
                <span>{Math.round(zoom * 100)}%</span>
                <button
                    onClick={() => handleZoomChange(zoom + 0.1)}
                    style={{
                        padding: '0.5rem',
                        border: '1px solid #d9d9d9',
                        borderRadius: '4px',
                        background: '#fff',
                        cursor: 'pointer'
                    }}
                >
                    +
                </button>
                <button
                    onClick={reloadImage}
                    style={{
                        padding: '0.5rem',
                        border: '1px solid #d9d9d9',
                        borderRadius: '4px',
                        background: '#fff',
                        cursor: 'pointer'
                    }}
                >
                    🔄
                </button>
            </div>
        </div>
    );
}; 
