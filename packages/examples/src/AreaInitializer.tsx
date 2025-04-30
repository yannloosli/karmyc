import React, { useEffect } from 'react';

import {
    actionRegistryWithHandlers as actionRegistry,
    areaRegistry,
    useArea,
    useRegisterAreaType,
    useStatusBar,
    useSyncContextMenuActions,
} from '@gamesberry/karmyc-core';
import { useAreaStore } from '@gamesberry/karmyc-core/stores/areaStore'; // Importer directement

import { ColorPickerArea } from './components/ColorPickerArea';
import { HistoryDrawingArea } from './components/HistoryDrawingArea';
import { ImageViewerArea } from './components/ImageViewerArea';
import { ImagesGalleryArea } from './components/ImagesGalleryArea';
import { PerformanceExample } from './components/PerformanceExample';
import { ResetButtonWrapper } from './components/ResetButtonWrapper';
import { SpaceManager } from './components/SpaceManager';
import { TextNoteArea } from './components/TextNoteArea';


export const AreaInitializer: React.FC = () => {
    // Récupérer l'action Zustand
    const { updateArea } = useAreaStore.getState();
    const { createArea } = useArea();
    const { registerComponent: registerRootStatusComponent } = useStatusBar('app', 'root');

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
        'text-note',
        TextNoteArea,
        { content: '' },
        {
            displayName: 'Note',
            defaultSize: { width: 300, height: 200 }
        }
    );

    useRegisterAreaType(
        'color-picker',
        ColorPickerArea,
        { color: '#1890ff' },
        {
            displayName: 'Palette',
            defaultSize: { width: 300, height: 250 }
        }
    );

    useRegisterAreaType(
        'image-viewer',
        ImageViewerArea,
        { imageUrl: 'https://picsum.photos/300/400', caption: '' },
        {
            displayName: 'Image',
            defaultSize: { width: 350, height: 300 }
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
            defaultSize: { width: 800, height: 600 }
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
            supportedActions: ['run', 'monitor', 'clear', 'delete', 'move', 'resize']
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
            supportedActions: ['draw', 'clear', 'delete', 'move', 'resize']
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
            supportedActions: ['delete', 'move', 'resize']
        }
    );

    // Action handlers for area creation (utilisation de updateArea Zustand)
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

    // Register action handlers
    useEffect(() => {
        actionRegistry.registerActionHandler('area.create-text-note', handleTextNote);
        actionRegistry.registerActionHandler('area.create-color-picker', handleColorPicker);
        actionRegistry.registerActionHandler('area.create-image-viewer', handleImageViewer);
        actionRegistry.registerActionHandler('area.create-images-gallery', handleImagesGallery);
        actionRegistry.registerActionHandler('area.create-performance-example', handlePerformanceExample);
        actionRegistry.registerActionHandler('area.create-history-drawing', handleHistoryDrawing);
        actionRegistry.registerActionHandler('area.create-space-manager', handleSpaceManager);

        // Cleanup on unmount
        return () => {
            actionRegistry.unregisterActionHandler('area.create-text-note');
            actionRegistry.unregisterActionHandler('area.create-color-picker');
            actionRegistry.unregisterActionHandler('area.create-image-viewer');
            actionRegistry.unregisterActionHandler('area.create-images-gallery');
            actionRegistry.unregisterActionHandler('area.create-performance-example');
            actionRegistry.unregisterActionHandler('area.create-history-drawing');
            actionRegistry.unregisterActionHandler('area.create-space-manager');
        };
    }, [updateArea]); // Ajouter updateArea aux dépendances si nécessaire

    // Register context menu
    useEffect(() => {
        // Get the existing context menu for the areas
        const createAreaContextMenu = {
            id: 'create-area',
            label: 'Créer une zone',
            icon: '+',
            children: [
                {
                    id: 'text-note',
                    label: 'Note',
                    action: 'area.create-text-note',
                    icon: '📝'
                },
                {
                    id: 'color-picker',
                    label: 'Palette',
                    action: 'area.create-color-picker',
                    icon: '🎨'
                },
                {
                    id: 'image-viewer',
                    label: 'Image',
                    action: 'area.create-image-viewer',
                    icon: '🖼️'
                },
                {
                    id: 'images-gallery',
                    label: 'Gallery',
                    action: 'area.create-images-gallery',
                    icon: '📷'
                },
                {
                    id: 'performance-example',
                    label: 'Performance',
                    action: 'area.create-performance-example',
                    icon: '⚡'
                },
                {
                    id: 'history-drawing',
                    label: 'Dessin',
                    action: 'area.create-history-drawing',
                    icon: '✏️'
                },
                {
                    id: 'space-manager',
                    label: 'Espaces',
                    action: 'area.create-space-manager',
                    icon: '🌐'
                }
            ]
        };

        // Les menus contextuels sont enregistrés via useSyncContextMenuActions
        // qui est déjà utilisé au début de ce composant
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            areaRegistry.unregisterAreaType('text-note');
            areaRegistry.unregisterAreaType('color-picker');
            areaRegistry.unregisterAreaType('image-viewer');
            areaRegistry.unregisterAreaType('images-gallery');
            areaRegistry.unregisterAreaType('performance-example');
            areaRegistry.unregisterAreaType('history-drawing');
            areaRegistry.unregisterAreaType('space-manager');
        };
    }, []);

    return null;
}; 
