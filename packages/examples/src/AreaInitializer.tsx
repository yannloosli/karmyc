import React, { useEffect } from 'react';

import {
    actionRegistryWithHandlers as actionRegistry,
    areaRegistry,
    useArea,
    useRegisterAreaType,
    useSyncContextMenuActions,
    useToolsBar,
} from '../../karmyc-core/src';
import { AREA_ROLE } from '../../karmyc-core/src/constants';
import { useAreaStore } from '../../karmyc-core/src/stores/areaStore'; // Importer directement

import '../../karmyc-layer-area-color-demo';
import LayerAreaManager from '../../karmyc-layer-area-manager';
import { TilesetArea, TilesetAreaState } from '../../karmyc-layer-area-tilemap';
import { ColorPickerArea } from './components/ColorPickerArea';
import { HistoryDrawingArea } from './components/HistoryDrawingArea';
import { ImageViewerArea } from './components/ImageViewerArea';
import { ImagesGalleryArea } from './components/ImagesGalleryArea';
import { PerformanceExample } from './components/PerformanceExample';
import { ResetButtonWrapper } from './components/ResetButtonWrapper';
import { SpaceManager } from './components/SpaceManager';
import { TextNoteArea } from './components/TextNoteArea';
import { WorkspaceArea } from './components/WorkspaceArea';

export const AreaInitializer: React.FC = () => {
    // Récupérer l'action Zustand
    const { updateArea } = useAreaStore.getState();
    const { createArea } = useArea();
    const { registerComponent: registerRootStatusComponent } = useToolsBar('app', 'root', 'bottom-outside', false);

    // Synchronize context menu actions
    useSyncContextMenuActions();

    // Set up reset button
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

    // Register all area types
    useRegisterAreaType(
        'workspace',
        WorkspaceArea,
        { content: '' },
        {
            displayName: 'Workspace',
            defaultSize: { width: 300, height: 200 },
            role: AREA_ROLE.LEAD
        }
    );

    useRegisterAreaType(
        'text-note',
        TextNoteArea,
        { content: '' },
        {
            displayName: 'Note',
            defaultSize: { width: 300, height: 200 },
            role: AREA_ROLE.LEAD
        }
    );

    useRegisterAreaType(
        'color-picker',
        ColorPickerArea,
        { color: '#1890ff' },
        {
            displayName: 'Palette',
            defaultSize: { width: 300, height: 250 },
            role: AREA_ROLE.FOLLOW
        }
    );

    useRegisterAreaType(
        'image-viewer',
        ImageViewerArea,
        { imageUrl: 'https://picsum.photos/300/400', caption: '' },
        {
            displayName: 'Image',
            defaultSize: { width: 350, height: 300 },
            role: AREA_ROLE.SELF
        }
    );

    useRegisterAreaType(
        'images-gallery',
        ImagesGalleryArea,
        {
            images: [],
            selectedImageId: null,
            zoom: 1,
            filter: 'none',
            sortBy: 'default'
        },
        {
            displayName: 'Gallery',
            defaultSize: { width: 800, height: 600 },
            role: AREA_ROLE.SELF
        }
    );

    // Register performance example area
    useRegisterAreaType(
        'performance-example',
        PerformanceExample,
        {},
        {
            displayName: 'Performance',
            defaultSize: { width: 700, height: 600 },
            supportedActions: ['run', 'monitor', 'clear', 'delete', 'move', 'resize'],
            role: AREA_ROLE.SELF
        }
    );

    // Register history drawing area
    useRegisterAreaType(
        'history-drawing',
        HistoryDrawingArea,
        {
            lines: [],
            color: '#000000',
            strokeWidth: 3
        },
        {
            displayName: 'Dessin',
            defaultSize: { width: 600, height: 400 },
            supportedActions: ['draw', 'clear', 'delete', 'move', 'resize'],
            role: AREA_ROLE.LEAD
        }
    );

    // Register space manager
    useRegisterAreaType(
        'space-manager',
        SpaceManager,
        {},
        {
            displayName: 'Espaces',
            defaultSize: { width: 400, height: 500 },
            supportedActions: ['delete', 'move', 'resize'],
            role: AREA_ROLE.SELF
        }
    );

    // Enregistrement du type d'area 'layer-demo'
    useRegisterAreaType(
        'layer-demo',
        LayerAreaManager,
        {
            layers: [
                {
                    id: "layer-blue",
                    type: "color-demo",
                    color: "#3498db",
                    opacity: 0.8,
                    zIndex: 1,
                    visible: true,
                    enabled: true,
                    locked: false,
                },
                {
                    id: "layer-red",
                    type: "color-demo",
                    color: "#e74c3c",
                    opacity: 0.5,
                    zIndex: 2,
                    visible: true,
                    enabled: true,
                    locked: false,
                },
            ]
        },
        {
            displayName: 'Layer Demo',
            defaultSize: { width: 400, height: 300 },
            role: AREA_ROLE.FOLLOW
        }
    );

    // Register tileset area
    useRegisterAreaType(
        'tileset',
        TilesetArea,
        {
            tileset: {
                image: null, // ou une URL de tileset de démo
                tileWidth: 32,
                tileHeight: 32,
                columns: 8,
                rows: 8,
            },
            selectedTile: 0,
            id: 'tileset-1',
            type: 'tileset',
            zIndex: 1,
            opacity: 1,
            visible: true,
            enabled: true,
            locked: false,
        } as TilesetAreaState,
        {
            displayName: 'Tileset',
            defaultSize: { width: 320, height: 320 },
            role: AREA_ROLE.FOLLOW
        }
    );

    // Action handlers for area creation (utilisation de updateArea Zustand)
    const handleWorkspace = (params: any) => {
        const areaId = params.areaId || params.itemMetadata?.areaId;
        if (areaId) {
            updateArea({
                id: areaId,
                type: 'workspace',
                state: { content: '' }
            });
        }
    };

    const handleTextNote = (params: any) => {
        const areaId = params.areaId || params.itemMetadata?.areaId;
        if (areaId) {
            updateArea({
                id: areaId,
                type: 'text-note',
                state: { content: '' }
            });
        }
    };

    const handleColorPicker = (params: any) => {
        const areaId = params.areaId || params.itemMetadata?.areaId;
        if (areaId) {
            updateArea({
                id: areaId,
                type: 'color-picker',
                state: { color: '#1890ff' }
            });
        }
    };

    const handleImageViewer = (params: any) => {
        const areaId = params.areaId || params.itemMetadata?.areaId;
        if (areaId) {
            updateArea({
                id: areaId,
                type: 'image-viewer',
                state: { imageUrl: 'https://picsum.photos/300/400', caption: '' }
            });
        }
    };

    const handleImagesGallery = (params: any) => {
        const areaId = params.areaId || params.itemMetadata?.areaId;
        if (areaId) {
            updateArea({
                id: areaId,
                type: 'images-gallery',
                state: {
                    images: [],
                    selectedImageId: null,
                    zoom: 1,
                    filter: 'none',
                    sortBy: 'default'
                }
            });
        }
    };


    const handlePerformanceExample = (params: any) => {
        const areaId = params.areaId || params.itemMetadata?.areaId;
        if (areaId) {
            updateArea({
                id: areaId,
                type: 'performance-example',
                state: {}
            });
        }
    };

    const handleHistoryDrawing = (params: any) => {
        const areaId = params.areaId || params.itemMetadata?.areaId;
        if (areaId) {
            updateArea({
                id: areaId,
                type: 'history-drawing',
                state: {
                    lines: [],
                    color: '#000000',
                    strokeWidth: 3
                }
            });
        }
    };

    const handleSpaceManager = (params: any) => {
        const areaId = params.areaId || params.itemMetadata?.areaId;
        if (areaId) {
            updateArea({
                id: areaId,
                type: 'space-manager',
                state: {}
            });
        }
    };

    // Handler pour la création d'une area 'layer-demo'
    const handleLayerDemo = (params: any) => {
        const areaId = params.areaId || params.itemMetadata?.areaId;
        if (areaId) {
            updateArea({
                id: areaId,
                type: 'layer-demo',
                state: {
                    layers: [
                        {
                            id: "layer-blue",
                            type: "color-demo",
                            color: "#3498db",
                            opacity: 0.8,
                            zIndex: 1,
                            visible: true,
                            enabled: true,
                            locked: false,
                        },
                        {
                            id: "layer-red",
                            type: "color-demo",
                            color: "#e74c3c",
                            opacity: 0.5,
                            zIndex: 2,
                            visible: true,
                            enabled: true,
                            locked: false,
                        },
                    ]
                }
            });
        }
    };

    const handleTileset = (params: any) => {
        const areaId = params.areaId || params.itemMetadata?.areaId;
        if (areaId) {
            updateArea({
                id: areaId,
                type: 'tileset',
                state: {
                    tileset: {
                        image: null,
                        tileWidth: 32,
                        tileHeight: 32,
                        columns: 8,
                        rows: 8,
                    },
                    selectedTile: 0,
                    id: 'tileset-1',
                    type: 'tileset',
                    zIndex: 1,
                    opacity: 1,
                    visible: true,
                    enabled: true,
                    locked: false,
                }
            });
        }
    };

    // Register action handlers
    useEffect(() => {
        actionRegistry.registerActionHandler('area.create-workspace', handleWorkspace);
        actionRegistry.registerActionHandler('area.create-text-note', handleTextNote);
        actionRegistry.registerActionHandler('area.create-color-picker', handleColorPicker);
        actionRegistry.registerActionHandler('area.create-image-viewer', handleImageViewer);
        actionRegistry.registerActionHandler('area.create-images-gallery', handleImagesGallery);
        actionRegistry.registerActionHandler('area.create-performance-example', handlePerformanceExample);
        actionRegistry.registerActionHandler('area.create-history-drawing', handleHistoryDrawing);
        actionRegistry.registerActionHandler('area.create-space-manager', handleSpaceManager);
        actionRegistry.registerActionHandler('area.create-layer-demo', handleLayerDemo);
        actionRegistry.registerActionHandler('area.create-tileset', handleTileset);
        // Cleanup on unmount
        return () => {
            actionRegistry.unregisterActionHandler('area.create-workspace');
            actionRegistry.unregisterActionHandler('area.create-text-note');
            actionRegistry.unregisterActionHandler('area.create-color-picker');
            actionRegistry.unregisterActionHandler('area.create-image-viewer');
            actionRegistry.unregisterActionHandler('area.create-images-gallery');
            actionRegistry.unregisterActionHandler('area.create-performance-example');
            actionRegistry.unregisterActionHandler('area.create-history-drawing');
            actionRegistry.unregisterActionHandler('area.create-space-manager');
            actionRegistry.unregisterActionHandler('area.create-layer-demo');
            actionRegistry.unregisterActionHandler('area.create-tileset');
        };
    }, [updateArea]); // Ajouter updateArea aux dépendances si nécessaire

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            areaRegistry.unregisterAreaType('workspace');
            areaRegistry.unregisterAreaType('text-note');
            areaRegistry.unregisterAreaType('color-picker');
            areaRegistry.unregisterAreaType('image-viewer');
            areaRegistry.unregisterAreaType('images-gallery');
            areaRegistry.unregisterAreaType('performance-example');
            areaRegistry.unregisterAreaType('history-drawing');
            areaRegistry.unregisterAreaType('space-manager');
            areaRegistry.unregisterAreaType('layer-demo');
            areaRegistry.unregisterAreaType('tileset');
        };
    }, []);

    return null;
}; 
