import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { areaRegistry } from '~/area/registry';
import { ColorPickerArea } from '~/components/area/examples/ColorPickerArea';
import { ImageViewerArea } from '~/components/area/examples/ImageViewerArea';
import { ImagesGalleryArea } from '~/components/area/examples/ImagesGalleryArea';
import { ResetButtonWrapper } from '~/components/area/examples/ResetButtonWrapper';
import { TextNoteArea } from '~/components/area/examples/TextNoteArea';
import { useArea, useRegisterAreaType, useStatusBar } from '~/hooks';
import { useSyncContextMenuActions } from '~/hooks/useSyncContextMenuActions';
import { store } from '~/store';
import { actionRegistry } from '~/store/registries/actionRegistry';
import { areaSlice, setAreaType } from '~/store/slices/areaSlice';

const { actions: areaActions } = areaSlice;

export const AreaInitializer: React.FC = () => {
    const dispatch = useDispatch();
    const { createArea } = useArea();
    const { registerComponent: registerRootStatusComponent } = useStatusBar('app', 'root');

    // Synchroniser les actions du menu contextuel
    useSyncContextMenuActions();

    // Configurer le bouton de réinitialisation
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

    // Enregistrer tous les types d'aires
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
            displayName: 'Galerie',
            defaultSize: { width: 800, height: 600 }
        }
    );

    // Gestionnaires d'actions pour la création d'aires
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

    // Enregistrer les gestionnaires d'actions
    useEffect(() => {
        actionRegistry.registerActionHandler('area.create-text-note', handleTextNote);
        actionRegistry.registerActionHandler('area.create-color-picker', handleColorPicker);
        actionRegistry.registerActionHandler('area.create-image-viewer', handleImageViewer);
        actionRegistry.registerActionHandler('area.create-images-gallery', handleImagesGallery);

        // Nettoyage lors du démontage
        return () => {
            actionRegistry.unregisterActionHandler('area.create-text-note');
            actionRegistry.unregisterActionHandler('area.create-color-picker');
            actionRegistry.unregisterActionHandler('area.create-image-viewer');
            actionRegistry.unregisterActionHandler('area.create-images-gallery');
        };
    }, []);

    // Créer des zones personnalisées au chargement
    useEffect(() => {
        // Vérifier si aucune zone n'existe
        const state = store.getState();
        if (state?.area && Object.keys(state.area.areas).length === 0) {
            // Fonction pour créer la structure initiale
            const initializeAreas = async () => {
                try {
                    // Créer la première zone (text-note) qui sera la racine
                    const textNoteId = createArea('text-note', { content: '' }, { x: 0, y: 0 });

                    // Créer le color-picker
                    const colorPickerId = createArea('color-picker', { color: '#52c41a' }, { x: 0, y: 0 });

                    // Créer l'image-viewer
                    const imageViewerId = createArea('image-viewer', {
                        imageUrl: 'https://picsum.photos/300/400',
                        caption: 'Une image aléatoire avec la nouvelle structure'
                    }, { x: 0, y: 0 });

                    // Créer la galerie
                    const imagesGalleryId = createArea('images-gallery', {
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
                    }, { x: 0, y: 0 });

                    // Créer la structure en quadrants
                    const topRowId = `row-${Date.now()}-top`;
                    const bottomRowId = `row-${Date.now()}-bottom`;
                    const mainRowId = `row-${Date.now()}-main`;

                    // Créer la structure avec setFields
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
                            [imagesGalleryId]: { type: 'area', id: imagesGalleryId }
                        },
                        rootId: mainRowId
                    }));

                } catch (error) {
                    console.error('Erreur lors de l\'initialisation des zones:', error);
                }
            };

            // Lancer l'initialisation
            initializeAreas();
        }
    }, [createArea, dispatch]);

    // Nettoyage lors du démontage
    useEffect(() => {
        return () => {
            areaRegistry.unregisterAreaType('text-note');
            areaRegistry.unregisterAreaType('color-picker');
            areaRegistry.unregisterAreaType('image-viewer');
            areaRegistry.unregisterAreaType('images-gallery');
        };
    }, []);

    return null;
}; 
