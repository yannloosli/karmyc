import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AreaToOpenPreview } from '~/components/area/components/AreaToOpenPreview';
import { useArea } from '~/hooks/useArea';
import { RootState } from '~/store';
import { clearAreaToOpen, finalizeAreaPlacement, setAreaToOpen } from '~/store/slices/areaSlice';
import { AreaComponentProps } from '~/types/areaTypes';
import { ImageData, ImagesGalleryState } from '~/types/image';
import { computeAreaToViewport } from '~/utils/areaToViewport';
import { getHoveredAreaId } from '~/utils/areaUtils';
import { getAreaRootViewport } from '~/utils/getAreaViewport';
import { Vec2 } from '~/utils/math/vec2';

// Static registry for gallery components
const galleryComponentRegistry: Record<string, {
    menuComponents: Array<{ component: React.ComponentType<any>; identifier: { name: string; type: string } }>;
    statusComponents: Array<{ component: React.ComponentType<any>; identifier: { name: string; type: string } }>;
    toolbarComponents: Array<{ component: React.ComponentType<any>; identifier: { name: string; type: string } }>;
    slotComponents: Array<{ component: React.ComponentType<any>; identifier: { name: string; type: string } }>;
}> = {};

// Custom hook for gallery
const useGalleryComponents = (areaType: string, areaId: string) => {
    const registryKey = `${areaType}:${areaId}`;

    const registerMenuComponent = useCallback((
        component: React.ComponentType<any>,
        identifier: { name: string; type: string }
    ) => {
        if (!galleryComponentRegistry[registryKey]) {
            galleryComponentRegistry[registryKey] = {
                menuComponents: [],
                statusComponents: [],
                toolbarComponents: [],
                slotComponents: []
            };
        }

        // Clean up existing components with the same identifier
        galleryComponentRegistry[registryKey].menuComponents = galleryComponentRegistry[registryKey].menuComponents.filter(
            item => !(item.identifier.name === identifier.name && item.identifier.type === identifier.type)
        );

        galleryComponentRegistry[registryKey].menuComponents.push({ component, identifier });
    }, [registryKey]);

    const registerStatusComponent = useCallback((
        component: React.ComponentType<any>,
        identifier: { name: string; type: string }
    ) => {
        if (!galleryComponentRegistry[registryKey]) {
            galleryComponentRegistry[registryKey] = {
                menuComponents: [],
                statusComponents: [],
                toolbarComponents: [],
                slotComponents: []
            };
        }

        galleryComponentRegistry[registryKey].statusComponents = galleryComponentRegistry[registryKey].statusComponents.filter(
            item => !(item.identifier.name === identifier.name && item.identifier.type === identifier.type)
        );

        galleryComponentRegistry[registryKey].statusComponents.push({ component, identifier });
    }, [registryKey]);

    const registerToolbarComponent = useCallback((
        component: React.ComponentType<any>,
        identifier: { name: string; type: string }
    ) => {
        if (!galleryComponentRegistry[registryKey]) {
            galleryComponentRegistry[registryKey] = {
                menuComponents: [],
                statusComponents: [],
                toolbarComponents: [],
                slotComponents: []
            };
        }

        galleryComponentRegistry[registryKey].toolbarComponents = galleryComponentRegistry[registryKey].toolbarComponents.filter(
            item => !(item.identifier.name === identifier.name && item.identifier.type === identifier.type)
        );

        galleryComponentRegistry[registryKey].toolbarComponents.push({ component, identifier });
    }, [registryKey]);

    const registerSlotComponent = useCallback((
        slot: string,
        component: React.ComponentType<any>,
        identifier: { name: string; type: string }
    ) => {
        if (!galleryComponentRegistry[registryKey]) {
            galleryComponentRegistry[registryKey] = {
                menuComponents: [],
                statusComponents: [],
                toolbarComponents: [],
                slotComponents: []
            };
        }

        galleryComponentRegistry[registryKey].slotComponents = galleryComponentRegistry[registryKey].slotComponents.filter(
            item => !(item.identifier.name === identifier.name && item.identifier.type === identifier.type)
        );

        galleryComponentRegistry[registryKey].slotComponents.push({ component, identifier });
    }, [registryKey]);

    const getComponents = useCallback(() => {
        return galleryComponentRegistry[registryKey] || {
            menuComponents: [],
            statusComponents: [],
            toolbarComponents: [],
            slotComponents: []
        };
    }, [registryKey]);

    return {
        registerMenuComponent,
        registerStatusComponent,
        registerToolbarComponent,
        registerSlotComponent,
        getComponents
    };
};

export const ImagesGalleryArea: React.FC<AreaComponentProps<ImagesGalleryState>> = ({
    id,
    state,
    viewport
}) => {
    const { updateAreaState } = useArea();
    const { registerMenuComponent, registerStatusComponent, registerToolbarComponent, registerSlotComponent } = useGalleryComponents('images-gallery', id);
    const areaState = useSelector((state: RootState) => state.area);
    const dispatch = useDispatch();

    // Local states
    const [viewMode, setViewMode] = useState<'grid' | 'single'>('grid');
    const dragRef = useRef<{ startX: number; startY: number; image: ImageData | null } | null>(null);
    const lastUpdateRef = useRef<number>(0);
    const UPDATE_INTERVAL = 32; // Reduce to 30fps

    // Ensure properties exist
    const images = state?.images || [];
    const selectedImageId = state?.selectedImageId;
    const zoom = state?.zoom || 1;
    const filter = state?.filter || 'none';
    const sortBy = state?.sortBy || 'default';

    // Find currently selected image
    const selectedImage = images.find(img => img.id === selectedImageId) || images[0];

    // Function to add a new image
    const addImage = () => {
        const newImage: ImageData = {
            id: Date.now().toString(),
            url: `https://picsum.photos/300/400?t=${Date.now()}`,
            caption: '',
            width: 300,
            height: 400
        };

        updateAreaState(id, {
            ...state,
            images: [...images, newImage],
            selectedImageId: newImage.id
        });
    };

    // Function to select an image
    const selectImage = (imageId: string) => {
        updateAreaState(id, {
            ...state,
            selectedImageId: imageId
        });
    };

    // Function to delete an image
    const deleteImage = (imageId: string) => {
        updateAreaState(id, {
            ...state,
            images: images.filter(img => img.id !== imageId),
            selectedImageId: selectedImageId === imageId ? null : selectedImageId
        });
    };

    // Function to update image caption
    const updateCaption = (imageId: string, caption: string) => {
        updateAreaState(id, {
            ...state,
            images: images.map(img =>
                img.id === imageId ? { ...img, caption } : img
            )
        });
    };

    // Function to change zoom
    const changeZoom = (newZoom: number) => {
        updateAreaState(id, {
            ...state,
            zoom: newZoom
        });
    };

    // Function to change view mode
    const toggleViewMode = () => {
        setViewMode(viewMode === 'grid' ? 'single' : 'grid');
    };

    // Function to change filter
    const changeFilter = (newFilter: string) => {
        updateAreaState(id, {
            ...state,
            filter: newFilter
        });
    };

    // Function to sort images
    const sortImages = (sortType: string) => {
        updateAreaState(id, {
            ...state,
            sortBy: sortType
        });
    };

    // Sort images according to selected criteria
    const sortedImages = [...images].sort((a: ImageData, b: ImageData) => {
        if (sortBy === 'title') {
            return (a.caption || '').localeCompare(b.caption || '');
        }
        if (sortBy === 'titleDesc') {
            return (b.caption || '').localeCompare(a.caption || '');
        }
        if (sortBy === 'random') {
            return Math.random() - 0.5;
        }
        return 0;
    });

    // Effect to handle component registration
    useEffect(() => {
        // --- Menu Bar Components ---
        // Filter dropdown (first item)
        registerMenuComponent(
            () => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '36px' }}>
                    <span style={{ fontSize: '12px' }}>Filter:</span>
                    <select
                        value={filter}
                        onChange={(e) => changeFilter(e.target.value)}
                        style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            border: '1px solid #d9d9d9'
                        }}
                    >
                        <option value="none">Normal</option>
                        <option value="grayscale(100%)">Black & White</option>
                        <option value="sepia(70%)">Sepia</option>
                        <option value="brightness(120%)">Bright</option>
                        <option value="contrast(150%)">Contrast</option>
                        <option value="hue-rotate(90deg)">Hue</option>
                        <option value="invert(80%)">Inverted</option>
                        <option value="blur(2px)">Blur</option>
                    </select>
                </div>
            ),
            { name: 'filterSelect', type: 'menu' }
        );

        // Sort selector (second item)
        registerMenuComponent(
            () => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '16px' }}>
                    <span style={{ fontSize: '12px' }}>Sort:</span>
                    <select
                        value={sortBy}
                        onChange={(e) => sortImages(e.target.value)}
                        style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            border: '1px solid #d9d9d9'
                        }}
                    >
                        <option value="default">Default</option>
                        <option value="title">Title ↑</option>
                        <option value="titleDesc">Title ↓</option>
                        <option value="random">Random</option>
                    </select>
                </div>
            ),
            { name: 'sortSelector', type: 'menu' }
        );

        // --- Status Bar Components ---
        // Image name (left)
        registerStatusComponent(
            () => {
                const img = images.find((img: ImageData) => img.id === selectedImageId);
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span role="img" aria-label="image">🖼️</span>
                        <span style={{ fontWeight: 'normal' }}>{img?.caption || 'Untitled'}</span>
                    </div>
                );
            },
            { name: 'imageName', type: 'status' }
        );

        // Image size (center)
        registerStatusComponent(
            () => (
                <div style={{ textAlign: 'center' }}>
                    {selectedImageId ? '300 × 200 px' : ''}
                </div>
            ),
            { name: 'imageSize', type: 'status' }
        );

        // Zoom level (right)
        registerStatusComponent(
            () => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span role="img" aria-label="zoom">🔍</span>
                    <span>{Math.round(zoom * 100)}%</span>
                </div>
            ),
            { name: 'zoomLevel', type: 'status' }
        );

        // --- Toolbar Slots ---
        // Zoom buttons (NE slot)
        registerSlotComponent(
            'ne',
            () => (
                <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                        onClick={() => changeZoom(zoom * 1.2)}
                        style={{
                            background: '#ffffff',
                            border: '1px solid #d9d9d9',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        🔍+
                    </button>
                    <button
                        onClick={() => changeZoom(1)}
                        style={{
                            background: '#ffffff',
                            border: '1px solid #d9d9d9',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        100%
                    </button>
                    <button
                        onClick={() => changeZoom(zoom * 0.8)}
                        style={{
                            background: '#ffffff',
                            border: '1px solid #d9d9d9',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        🔍-
                    </button>
                </div>
            ),
            { name: 'zoomControls', type: 'slot' }
        );

        // Left navigation (W slot)
        registerSlotComponent(
            'w',
            () => (
                <button
                    onClick={() => {
                        const currentIndex = images.findIndex((img: ImageData) => img.id === selectedImageId);
                        const prevIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
                        selectImage(images[prevIndex].id);
                    }}
                    style={{
                        background: '#ffffff',
                        border: '1px solid #d9d9d9',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '16px'
                    }}
                >
                    ◀
                </button>
            ),
            { name: 'prevImage', type: 'slot' }
        );

        // Right navigation (E slot)
        registerSlotComponent(
            'e',
            () => (
                <button
                    onClick={() => {
                        const currentIndex = images.findIndex((img: ImageData) => img.id === selectedImageId);
                        const nextIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
                        selectImage(images[nextIndex].id);
                    }}
                    style={{
                        background: '#ffffff',
                        border: '1px solid #d9d9d9',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '16px'
                    }}
                >
                    ▶
                </button>
            ),
            { name: 'nextImage', type: 'slot' }
        );

        // Add button (SE slot)
        registerSlotComponent(
            'se',
            () => (
                <button
                    onClick={addImage}
                    style={{
                        background: '#1890ff',
                        color: 'white',
                        border: 'none',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                    }}
                >
                    <span role="img" aria-label="add">➕</span> Add
                </button>
            ),
            { name: 'addImage', type: 'slot' }
        );
    }, [
        id,
        selectedImageId,
        registerMenuComponent,
        registerStatusComponent,
        registerToolbarComponent,
        registerSlotComponent,
        addImage,
        sortImages,
        toggleViewMode,
        viewMode,
        sortBy,
        updateAreaState,
        images,
        zoom,
        selectImage,
        changeZoom,
        filter,
        changeFilter
    ]);

    const handleStart = useCallback((e: React.DragEvent) => {
        const imageId = e.currentTarget.getAttribute('data-source-id');
        if (!imageId) {
            console.warn('ImagesGalleryArea - No imageId found');
            return;
        }

        const image = images.find(img => img.id === imageId);
        if (!image) return;

        const rect = e.currentTarget.getBoundingClientRect();
        dragRef.current = {
            startX: e.clientX - rect.left,
            startY: e.clientY - rect.top,
            image
        };

        // Create invisible drag image
        const dragImage = document.createElement('div');
        dragImage.style.width = '1px';
        dragImage.style.height = '1px';
        dragImage.style.position = 'fixed';
        dragImage.style.top = '-1px';
        dragImage.style.left = '-1px';
        dragImage.style.opacity = '0.01';
        document.body.appendChild(dragImage);

        // Set up drag effect
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', JSON.stringify({
            type: 'create-new',
            areaType: 'image-viewer',
            imageId,
            areaId: id
        }));
        e.dataTransfer.setDragImage(dragImage, 0, 0);

        // Clean up drag image after short delay
        setTimeout(() => {
            document.body.removeChild(dragImage);
        }, 0);
    }, [images, id]);

    const handleMove = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';

        if (!dragRef.current || !dragRef.current.image) {
            console.warn('❌ No dragRef or image found');
            return;
        }

        const now = performance.now();
        if (now - lastUpdateRef.current >= UPDATE_INTERVAL) {
            dispatch(setAreaToOpen({
                position: {
                    x: e.clientX - dragRef.current.startX,
                    y: e.clientY - dragRef.current.startY
                },
                area: {
                    type: 'image-viewer',
                    state: { image: dragRef.current.image }
                }
            }));
            lastUpdateRef.current = now;
        }
    }, [dispatch]);

    const handleRelease = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!dragRef.current || !dragRef.current.image) return;

        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        if (data.type !== 'create-new') return;

        // Calculate final position
        const position = {
            x: e.clientX - dragRef.current.startX,
            y: e.clientY - dragRef.current.startY
        };

        // Get target area ID
        const areaToViewport = computeAreaToViewport(
            areaState.layout,
            areaState.rootId || '',
            getAreaRootViewport()
        );
        const targetAreaId = getHoveredAreaId(Vec2.new(position.x, position.y), areaState, areaToViewport);

        if (targetAreaId) {
            // If we have a target area, finalize placement with the image
            dispatch(finalizeAreaPlacement());
        } else {
            // Otherwise cancel
            dispatch(clearAreaToOpen());
        }

        dragRef.current = null;
    }, [dispatch, areaState]);

    return (
        <div
            className={`images-gallery-area ${viewMode === 'grid' ? 'grid-view' : 'list-view'}`}
            style={{
                width: viewport.width,
                height: viewport.height,
                padding: '1rem',
                background: '#fff',
                display: 'grid',
                gridTemplateColumns: '200px 1fr',
                gap: '1rem',
                position: 'relative'
            }}
        >
            {/* Sidebar with image list */}
            <div style={{
                borderRight: '1px solid #d9d9d9',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    overflowY: 'auto'
                }}>
                    {sortedImages.map(img => (
                        <div
                            key={img.id}
                            data-source-id={img.id}
                            draggable
                            onDragStart={handleStart}
                            onDragOver={handleMove}
                            onDragEnd={handleRelease}
                            style={{
                                border: selectedImageId === img.id ? '2px solid #1890ff' : '1px solid #d9d9d9',
                                borderRadius: '4px',
                                padding: '0.5rem',
                                cursor: 'move',
                                backgroundColor: 'transparent',
                                userSelect: 'none',
                                touchAction: 'none',
                                position: 'relative',
                                zIndex: 1,
                                transform: 'scale(1)',
                                transition: 'transform 0.2s ease-out',
                                willChange: 'transform',
                                pointerEvents: 'auto'
                            }}
                            onClick={() => selectImage(img.id)}
                        >
                            <img
                                src={img.url}
                                alt={img.caption}
                                style={{
                                    width: '100%',
                                    height: '100px',
                                    objectFit: 'cover',
                                    borderRadius: '2px',
                                    pointerEvents: 'auto',
                                    userSelect: 'none',
                                    touchAction: 'none',
                                    transform: 'scale(1)',
                                    transition: 'transform 0.2s ease-out',
                                    willChange: 'transform'
                                }}
                            />
                            <div style={{
                                marginTop: '0.5rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span style={{ fontSize: '0.8rem' }}>
                                    {img.caption || 'Untitled'}
                                </span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteImage(img.id);
                                    }}
                                    style={{
                                        border: 'none',
                                        background: 'none',
                                        cursor: 'pointer',
                                        color: '#ff4d4f'
                                    }}
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main display area */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                position: 'relative'
            }}>
                {selectedImageId ? (
                    <>
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            overflow: 'hidden'
                        }}>
                            <img
                                src={selectedImage.url}
                                alt={selectedImage.caption}
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    transform: `scale(${zoom})`,
                                    filter: filter,
                                    transition: 'transform 0.3s, filter 0.3s'
                                }}
                            />
                        </div>
                        <input
                            type="text"
                            value={selectedImage.caption || ''}
                            onChange={(e) => updateCaption(selectedImage.id, e.target.value)}
                            placeholder="Add a caption..."
                            style={{
                                padding: '0.5rem',
                                border: '1px solid #d9d9d9',
                                borderRadius: '4px'
                            }}
                        />
                    </>
                ) : (
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        color: '#999'
                    }}>
                        Select an image to display
                    </div>
                )}
            </div>

            {/* Preview of the area to open */}
            {areaState.areaToOpen && (
                <AreaToOpenPreview areaToViewport={areaState.areaToViewport} />
            )}
        </div>
    );
};
