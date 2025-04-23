import { useMenuBar } from '@gamesberry/karmyc-core/components/area/components/MenuBar';
import { useStatusBar } from '@gamesberry/karmyc-core/components/area/components/StatusBar';
import { useToolbar } from '@gamesberry/karmyc-core/components/area/components/Toolbar';
import { useArea } from '@gamesberry/karmyc-core/hooks/useArea';
import { AreaComponentProps } from '@gamesberry/karmyc-core/types/areaTypes';
import { ImageViewerState } from '@gamesberry/karmyc-core/types/image';
import React from 'react';

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
        updateAreaState(id, {
            ...state,
            zoom: Math.max(0.1, Math.min(5, newZoom))
        });
    };

    // Function to load a new image
    const reloadImage = () => {
        updateAreaState(id, {
            ...state,
            image: {
                ...image,
                url: `https://picsum.photos/300/400?t=${Date.now()}`
            }
        });
    };

    // Function to change filter
    const handleFilterChange = (newFilter: string) => {
        updateAreaState(id, {
            ...state,
            filter: newFilter
        });
    };

    // Function to change caption
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

        // --- Toolbar Components ---
        // Zoom controls
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
        // Info in northeast corner
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
                    <span>Random image</span>
                </div>
            ),
            { name: 'imageInfo', type: 'slot' }
        );

        // Share button in southwest corner
        registerSlotComponent(
            'sw',
            () => (
                <div style={{ padding: '5px' }}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            alert('Image sharing simulated!');
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
                        <span role="img" aria-label="Share">📤</span> Share
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
