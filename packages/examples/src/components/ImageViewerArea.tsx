import { useToolsBar } from '@gamesberry/karmyc-core';
import { useAreaStore } from '@gamesberry/karmyc-core';
import { AreaComponentProps } from '@gamesberry/karmyc-core';
import { ImageViewerState } from '@gamesberry/karmyc-core';
import React from 'react';

export const ImageViewerArea: React.FC<AreaComponentProps<ImageViewerState>> = ({
    id,
    state,
    viewport
}) => {
    const updateArea = useAreaStore((s) => s.updateArea);
    const { registerComponent: registerMenuComponent } = useToolsBar('image-viewer', id, 'top-outside');
    const { registerComponent: registerStatusComponent } = useToolsBar('image-viewer', id, 'bottom-outside');
    const { registerComponent: registerToolbarTopInside } = useToolsBar('image-viewer', id, 'top-inside');
    const { registerComponent: registerToolbarBottomInside } = useToolsBar('image-viewer', id, 'bottom-inside');

    // Ensure properties exist
    const image = state?.image || {
        id: Date.now().toString(),
        url: 'https://picsum.photos/300/400',
        caption: '',
        width: 300,
        height: 400
    };
    const zoom = state?.zoom || 1;
    const filter = state?.filter || 'none';

    // Function to change zoom
    const handleZoomChange = (newZoom: number) => {
        updateArea({
            id: id, state: {
                ...state,
                zoom: Math.max(0.1, Math.min(5, newZoom))
            }
        });
    };

    // Function to load a new image
    const reloadImage = () => {
        updateArea({
            id: id, state: {
                ...state,
                image: {
                    ...image,
                    url: `https://picsum.photos/300/400?t=${Date.now()}`
                }
            }
        });
    };

    // Function to change filter
    const handleFilterChange = (newFilter: string) => {
        updateArea({
            id: id, state: {
                ...state,
                filter: newFilter
            }
        });
    };

    // Function to change caption
    const handleCaptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateArea({
            id: id, state: {
                ...state,
                image: {
                    ...image,
                    caption: e.target.value
                }
            }
        });
    };

    React.useEffect(() => {
        // --- Menu Bar Components ---
        // Filter selector
        registerMenuComponent(
            () => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px' }}>Filter:</span>
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
                        <option value="grayscale(100%)">Black & White</option>
                        <option value="sepia(70%)">Sepia</option>
                        <option value="brightness(120%)">Brighten</option>
                        <option value="contrast(150%)">Contrast</option>
                        <option value="hue-rotate(90deg)">Hue</option>
                        <option value="invert(80%)">Invert</option>
                        <option value="blur(2px)">Blur</option>
                    </select>
                </div>
            ),
            { name: 'filterSelector', type: 'menu' },
            { order: 10, width: 'auto' }
        );

        // Reload button
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
                    🔄 New image
                </button>
            ),
            { name: 'reloadButton', type: 'menu' },
            { order: 20, width: 'auto' }
        );

        // --- Status Bar Components ---
        // Image name (left)
        registerStatusComponent(
            () => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span role="img" aria-label="image">🖼️</span>
                    <span style={{ fontWeight: 'normal' }}>{image.caption || 'Untitled'}</span>
                </div>
            ),
            { name: 'imageName', type: 'status' },
            { order: 10, alignment: 'left', width: 'auto' }
        );

        // Image size (center)
        registerStatusComponent(
            () => (
                <div style={{ textAlign: 'center' }}>
                    300 × 400 px
                </div>
            ),
            { name: 'imageSize', type: 'status' },
            { order: 20, alignment: 'center', width: 'auto' }
        );

        // Zoom (right)
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

        // --- Toolbar Components (top-inside) ---
        registerToolbarTopInside(
            () => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleZoomChange(zoom * 1.2)}>Zoom +</button>
                    <button onClick={() => handleZoomChange(1)}>100%</button>
                    <button onClick={() => handleZoomChange(zoom * 0.8)}>Zoom -</button>
                </div>
            ),
            { name: 'zoomControls', type: 'toolbar' },
            { order: 10, alignment: 'center', width: 'auto' }
        );

        // --- Toolbar Components (bottom-inside) ---
        // (exemple, rien par défaut)

    }, [id, filter, zoom, image.caption, registerMenuComponent, registerStatusComponent, registerToolbarTopInside]);

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
            {/* Image display area */}
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

            {/* Caption area */}
            <input
                type="text"
                value={image.caption || ''}
                onChange={handleCaptionChange}
                placeholder="Image caption"
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
