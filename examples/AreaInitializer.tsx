import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
    actionRegistryWithHandlers as actionRegistry,
    areaRegistry,
    areaSlice,
    setAreaType,
    store,
    useArea,
    useRegisterAreaType,
    useStatusBar,
    useSyncContextMenuActions
} from '../lib';
import { ColorPickerArea } from './components/ColorPickerArea';
import { HistoryDrawingArea } from './components/HistoryDrawingArea';
import { ImageViewerArea } from './components/ImageViewerArea';
import { ImagesGalleryArea } from './components/ImagesGalleryArea';
import { NotificationExample } from './components/NotificationExample';
import { PerformanceExample } from './components/PerformanceExample';
import { ResetButtonWrapper } from './components/ResetButtonWrapper';
import { TextNoteArea } from './components/TextNoteArea';

const { actions: areaActions } = areaSlice;

export const AreaInitializer: React.FC = () => {
    const dispatch = useDispatch();
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

    // Register notification example area
    useRegisterAreaType(
        'notification-example',
        NotificationExample,
        {},
        {
            displayName: 'Notifications',
            defaultSize: { width: 500, height: 600 },
            supportedActions: ['send', 'clear', 'delete', 'move', 'resize']
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
            currentColor: '#000000',
            strokeWidth: 3
        },
        {
            displayName: 'Dessin',
            defaultSize: { width: 600, height: 400 },
            supportedActions: ['draw', 'clear', 'delete', 'move', 'resize']
        }
    );

    // Action handlers for area creation
    const handleTextNote = (params: any) => {
        const areaId = params.areaId || params.itemMetadata?.areaId;
        if (areaId) {
            dispatch(setAreaType({
                areaId,
                type: 'text-note',
                initialState: { content: '' }
            }));
        }
    };

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
                initialState: { imageUrl: 'https://picsum.photos/300/400', caption: '' }
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

    const handleNotificationExample = (params: any) => {
        const areaId = params.areaId || params.itemMetadata?.areaId;
        if (areaId) {
            dispatch(setAreaType({
                areaId,
                type: 'notification-example',
                initialState: {}
            }));
        }
    };

    const handlePerformanceExample = (params: any) => {
        const areaId = params.areaId || params.itemMetadata?.areaId;
        if (areaId) {
            dispatch(setAreaType({
                areaId,
                type: 'performance-example',
                initialState: {}
            }));
        }
    };

    // Gestionnaire pour l'area de dessin avec historique
    const handleHistoryDrawing = (params: any) => {
        const areaId = params.areaId || params.itemMetadata?.areaId;
        if (areaId) {
            dispatch(setAreaType({
                areaId,
                type: 'history-drawing',
                initialState: {
                    lines: [],
                    currentColor: '#000000',
                    strokeWidth: 3
                }
            }));
        }
    };

    // Register action handlers
    useEffect(() => {
        actionRegistry.registerActionHandler('area.create-text-note', handleTextNote);
        actionRegistry.registerActionHandler('area.create-color-picker', handleColorPicker);
        actionRegistry.registerActionHandler('area.create-image-viewer', handleImageViewer);
        actionRegistry.registerActionHandler('area.create-images-gallery', handleImagesGallery);
        actionRegistry.registerActionHandler('area.create-notification-example', handleNotificationExample);
        actionRegistry.registerActionHandler('area.create-performance-example', handlePerformanceExample);
        actionRegistry.registerActionHandler('area.create-history-drawing', handleHistoryDrawing);

        // Cleanup on unmount
        return () => {
            actionRegistry.unregisterActionHandler('area.create-text-note');
            actionRegistry.unregisterActionHandler('area.create-color-picker');
            actionRegistry.unregisterActionHandler('area.create-image-viewer');
            actionRegistry.unregisterActionHandler('area.create-images-gallery');
            actionRegistry.unregisterActionHandler('area.create-notification-example');
            actionRegistry.unregisterActionHandler('area.create-performance-example');
            actionRegistry.unregisterActionHandler('area.create-history-drawing');
        };
    }, []);

    // Create custom areas on load
    useEffect(() => {
        // Check if no areas exist (note: ceci est maintenant géré par useKarmyc dans main.tsx)
        // Ceci est gardé comme fallback seulement
        const state = store.getState();
        if (state?.area && Object.keys(state.area.areas).length === 0) {
            // Function to create initial structure
            const initializeAreas = async () => {
                try {
                    // Create the first area (text-note) that will be the root
                    const textNoteId = createArea('text-note', { content: '' }, { x: 0, y: 0 });

                    // Create the color-picker
                    const colorPickerId = createArea('color-picker', { color: '#52c41a' }, { x: 0, y: 0 });

                    // Create the image-viewer
                    const imageViewerId = createArea('image-viewer', {
                        imageUrl: 'https://picsum.photos/300/400',
                        caption: 'A random image with the new structure'
                    }, { x: 0, y: 0 });

                    // Create the gallery
                    const imagesGalleryId = createArea('images-gallery', {
                        images: [
                            { id: '1', url: 'https://picsum.photos/id/1/300/200', title: 'Laptop on desk' },
                            { id: '2', url: 'https://picsum.photos/id/24/300/200', title: 'Open book' },
                            { id: '3', url: 'https://picsum.photos/id/37/300/200', title: 'White flowers' },
                            { id: '4', url: 'https://picsum.photos/id/48/300/200', title: 'Old building' },
                            { id: '5', url: 'https://picsum.photos/id/96/300/200', title: 'Mountain landscape' },
                            { id: '6', url: 'https://picsum.photos/id/116/300/200', title: 'Urban scene' }
                        ],
                        selectedImageId: '1',
                        zoom: 1,
                        filter: 'none',
                        sortBy: 'default'
                    }, { x: 0, y: 0 });

                    // Create notification example area
                    const notificationExampleId = createArea('notification-example', {}, { x: 0, y: 0 });

                    // Create performance example area
                    const performanceExampleId = createArea('performance-example', {}, { x: 0, y: 0 });

                    // Create history drawing area
                    const historyDrawingId = createArea('history-drawing', {
                        lines: [],
                        currentColor: '#000000',
                        strokeWidth: 3
                    }, { x: 0, y: 0 });

                    // Create structure in quadrants
                    const topRowId = `row-${Date.now()}-top`;
                    const bottomRowId = `row-${Date.now()}-bottom`;
                    const mainRowId = `row-${Date.now()}-main`;

                    // Create structure with setFields
                    dispatch(areaActions.setFields({
                        layout: {
                            [topRowId]: {
                                type: 'area_row',
                                id: topRowId,
                                orientation: 'horizontal',
                                areas: [
                                    { id: textNoteId, size: 0.5 },
                                    { id: colorPickerId, size: 0.5 }
                                ]
                            },
                            [bottomRowId]: {
                                type: 'area_row',
                                id: bottomRowId,
                                orientation: 'horizontal',
                                areas: [
                                    { id: imageViewerId, size: 0.5 },
                                    { id: imagesGalleryId, size: 0.5 }
                                ]
                            },
                            [mainRowId]: {
                                type: 'area_row',
                                id: mainRowId,
                                orientation: 'vertical',
                                areas: [
                                    { id: topRowId, size: 0.5 },
                                    { id: bottomRowId, size: 0.5 }
                                ]
                            },
                            [textNoteId]: { type: 'area', id: textNoteId },
                            [colorPickerId]: { type: 'area', id: colorPickerId },
                            [imageViewerId]: { type: 'area', id: imageViewerId },
                            [imagesGalleryId]: { type: 'area', id: imagesGalleryId },
                            [notificationExampleId]: { type: 'area', id: notificationExampleId },
                            [performanceExampleId]: { type: 'area', id: performanceExampleId },
                            [historyDrawingId]: { type: 'area', id: historyDrawingId }
                        },
                        rootId: mainRowId
                    }));

                } catch (error) {
                    console.error('Error initializing areas:', error);
                }
            };

            // Initialize
            initializeAreas();
        }
    }, [createArea, dispatch]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            areaRegistry.unregisterAreaType('text-note');
            areaRegistry.unregisterAreaType('color-picker');
            areaRegistry.unregisterAreaType('image-viewer');
            areaRegistry.unregisterAreaType('images-gallery');
            areaRegistry.unregisterAreaType('notification-example');
            areaRegistry.unregisterAreaType('performance-example');
            areaRegistry.unregisterAreaType('history-drawing');
        };
    }, []);

    return null;
}; 
