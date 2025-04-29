import { AreaToOpenPreview } from '@gamesberry/karmyc-core/components/area/components/AreaToOpenPreview';
import { useAreaStore } from '@gamesberry/karmyc-core/stores/areaStore';
import { AreaComponentProps } from '@gamesberry/karmyc-core/types/areaTypes';
import { ImageData, ImagesGalleryState } from '@gamesberry/karmyc-core/types/image';
import { computeAreaToViewport } from '@gamesberry/karmyc-core/utils/areaToViewport';
import { getHoveredAreaId } from '@gamesberry/karmyc-core/utils/areaUtils';
import { getAreaRootViewport } from '@gamesberry/karmyc-core/utils/getAreaViewport';
import { Vec2 } from '@gamesberry/karmyc-shared';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
    const { registerMenuComponent, registerStatusComponent, registerToolbarComponent, registerSlotComponent } = useGalleryComponents('images-gallery', id);

    // Obtenir les actions et l'état nécessaires depuis useAreaStore (appels séparés)
    const updateArea = useAreaStore(s => s.updateArea);
    const setAreaToOpen = useAreaStore(s => s.setAreaToOpen);
    const clearAreaToOpen = useAreaStore(s => s.cleanupTemporaryStates);
    const finalizeAreaPlacement = useAreaStore(s => s.finalizeAreaPlacement);

    // Sélectionner les parties de l'état nécessaires séparément
    const layout = useAreaStore(s => s.layout);
    const rootId = useAreaStore(s => s.rootId);
    const areaToOpen = useAreaStore(s => s.areaToOpen);
    // const joinPreview = useAreaStore(s => s.joinPreview); // Toujours commenté car non utilisé

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
    const addImage = useCallback(() => {
        const newImage: ImageData = {
            id: Date.now().toString(),
            url: `https://picsum.photos/300/400?t=${Date.now()}`,
            caption: '',
            width: 300,
            height: 400
        };

        // Utiliser updateArea du store
        updateArea({
            id: id, // ID de l'aire actuelle
            state: { // Le nouveau contenu de la propriété `state` de l'aire
                ...state,
                images: [...images, newImage],
                selectedImageId: newImage.id
            }
        });
    }, [id, state, images, updateArea]);

    // Function to select an image
    const selectImage = useCallback((imageId: string) => {
        // Utiliser updateArea du store
        updateArea({
            id: id,
            state: {
                ...state,
                selectedImageId: imageId
            }
        });
    }, [id, state, updateArea]);

    // Function to delete an image
    const deleteImage = useCallback((imageId: string) => {
        // Utiliser updateArea du store
        updateArea({
            id: id,
            state: {
                ...state,
                images: images.filter(img => img.id !== imageId),
                selectedImageId: selectedImageId === imageId ? null : selectedImageId
            }
        });
    }, [id, state, images, selectedImageId, updateArea]);

    // Function to update image caption
    const updateCaption = useCallback((imageId: string, caption: string) => {
        // Utiliser updateArea du store
        updateArea({
            id: id,
            state: {
                ...state,
                images: images.map(img =>
                    img.id === imageId ? { ...img, caption } : img
                )
            }
        });
    }, [id, state, images, updateArea]);

    // Function to change zoom
    const changeZoom = useCallback((newZoom: number) => {
        // Utiliser updateArea du store
        updateArea({
            id: id,
            state: {
                ...state,
                zoom: newZoom
            }
        });
    }, [id, state, updateArea]);

    // Function to change view mode
    const toggleViewMode = useCallback(() => {
        setViewMode(prev => prev === 'grid' ? 'single' : 'grid');
    }, []);

    // Function to change filter
    const changeFilter = useCallback((newFilter: string) => {
        // Utiliser updateArea du store
        updateArea({
            id: id,
            state: {
                ...state,
                filter: newFilter
            }
        });
    }, [id, state, updateArea]);

    // Function to sort images
    const sortImages = useCallback((sortType: string) => {
        // Utiliser updateArea du store
        updateArea({
            id: id,
            state: {
                ...state,
                sortBy: sortType
            }
        });
    }, [id, state, updateArea]);

    // Sort images according to selected criteria
    const sortedImages = useMemo(() => {
        const imagesToSort = state?.images || [];
        const currentSortBy = state?.sortBy || 'default';
        return [...imagesToSort].sort((a: ImageData, b: ImageData) => {
            if (currentSortBy === 'title') {
                return (a.caption || '').localeCompare(b.caption || '');
            }
            if (currentSortBy === 'titleDesc') {
                return (b.caption || '').localeCompare(a.caption || '');
            }
            if (currentSortBy === 'random') {
                return Math.random() - 0.5;
            }
            return 0;
        });
    }, [state?.images, state?.sortBy]);

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
        images,
        zoom,
        selectImage,
        changeZoom,
        filter,
        changeFilter
    ]);

    // --- Callbacks pour Drag & Drop ---
    // Les dépendances de useMemo sont correctes car layout et rootId sont maintenant
    // des variables stables obtenues via des hooks séparés.
    const areaToViewportMap = useMemo(() => {
        if (!rootId) return {};
        // Attention: getAreaRootViewport() peut être coûteux, idéalement il faudrait le mémoizer
        // ou le passer en prop s'il dépend du DOM extérieur.
        return computeAreaToViewport(layout, rootId, getAreaRootViewport());
    }, [layout, rootId]);


    const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, image: ImageData) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const startX = e.clientX - rect.left;
        const startY = e.clientY - rect.top;
        dragRef.current = { startX, startY, image };

        // Utiliser l'action Zustand directement
        setAreaToOpen({
            position: { x: e.clientX, y: e.clientY },
            area: {
                type: 'image-viewer', // Type de l'aire à créer/ouvrir
                state: { imageUrl: image.url, caption: image.caption, sourceAreaId: id } // État initial
            }
        });

        // Créer une image fantôme (identique à avant)
        const dragImage = document.createElement('div');
        dragImage.style.cssText = `width: 1px; height: 1px; position: fixed; top: -1px; left: -1px; opacity: 0.01; pointer-events: none;`;
        document.body.appendChild(dragImage);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'image-gallery-item', imageId: image.id, sourceAreaId: id }));
        e.dataTransfer.setDragImage(dragImage, 0, 0);
        requestAnimationFrame(() => { document.body.removeChild(dragImage); });

    }, [id, setAreaToOpen]); // Dépendance à setAreaToOpen


    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const now = Date.now();
        if (now - lastUpdateRef.current < UPDATE_INTERVAL) {
            return; // Limiter la fréquence
        }
        lastUpdateRef.current = now;

        // Obtenir le layout actuel directement du store si nécessaire, mais areaToViewportMap devrait être suffisant
        // car il est déjà basé sur le layout/rootId du store.
        const hoveredId = getHoveredAreaId(Vec2.new(e.clientX, e.clientY), { layout, rootId } as any, areaToViewportMap); // Forcer le type pour l'instant

        // Pas besoin de setAreaToOpen ici, AreaToOpenPreview s'en charge via son propre useAreaStore

        e.dataTransfer.dropEffect = 'move'; // Indiquer l'effet possible

    }, [id, areaToViewportMap, layout, rootId]); // Ajouter layout et rootId comme dépendances car utilisés dans getHoveredAreaId

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        const dropPosition = Vec2.new(e.clientX, e.clientY);
        // Utiliser le layout et rootId obtenus via les hooks
        const hoveredId = getHoveredAreaId(dropPosition, { layout, rootId } as any, areaToViewportMap); // Forcer le type pour l'instant

        if (hoveredId && hoveredId !== id) {
            console.log(`Image dropped onto area ${hoveredId}`);
            // Logique pour finaliser le drop sur une autre aire
            // (potentiellement déclencher une action pour ajouter l'image à l'autre aire, ou déplacer ?)
            // Pour l'instant, on assume que finalizeAreaPlacement gère la création d'une nouvelle aire si nécessaire.
            finalizeAreaPlacement();
        } else {
            // Drop sur soi-même ou en dehors d'une aire valide
            clearAreaToOpen(); // Nettoyer l'état areaToOpen
        }
        dragRef.current = null;

    }, [id, areaToViewportMap, finalizeAreaPlacement, clearAreaToOpen, layout, rootId]); // Ajouter layout et rootId comme dépendances

    return (
        <div className={`images-gallery-area ${viewMode === 'grid' ? 'grid-view' : 'list-view'}`} style={{
            width: viewport.width,
            height: viewport.height,
            padding: '1rem',
            background: '#fff',
            display: 'grid',
            gridTemplateColumns: '200px 1fr',
            gap: '1rem',
            position: 'relative'
        }} onDragOver={handleDragOver} onDrop={handleDrop}>
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
                            onDragStart={(e) => handleDragStart(e, img)}
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
                {selectedImage ? (
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
                        {images.length > 0 ? 'No image selected' : 'No images available'}
                    </div>
                )}
            </div>

            {/* Preview of the area to open */}
            <AreaToOpenPreview areaToViewport={areaToViewportMap} />
        </div>
    );
};
