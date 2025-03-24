import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { areaRegistry } from '~/area/registry';
import { ColorPickerArea } from '~/components/area/examples/ColorPickerArea';
import { ImageViewerArea } from '~/components/area/examples/ImageViewerArea';
import { ImagesGalleryArea } from '~/components/area/examples/ImagesGalleryArea';
import { TextNoteArea } from '~/components/area/examples/TextNoteArea';
import { useRegisterActionHandler, useRegisterAreaType } from '~/hooks';
import { useSyncContextMenuActions } from '~/hooks/useSyncContextMenuActions';
import { setAreaType } from '~/store/slices/areaSlice';

export const AreaInitializer: React.FC = () => {
    const dispatch = useDispatch();

    // Synchroniser les actions du menu contextuel
    useSyncContextMenuActions();

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

    // Enregistrer les gestionnaires d'actions pour chaque type
    useRegisterActionHandler('area.create-text-note', (params) => {
        const areaId = params.areaId || params.itemMetadata?.areaId;
        if (areaId) {
            dispatch(setAreaType({
                areaId,
                type: 'text-note',
                initialState: { content: '' }
            }));
        }
    });

    useRegisterActionHandler('area.create-color-picker', (params) => {
        const areaId = params.areaId || params.itemMetadata?.areaId;
        if (areaId) {
            dispatch(setAreaType({
                areaId,
                type: 'color-picker',
                initialState: { color: '#1890ff' }
            }));
        }
    });

    useRegisterActionHandler('area.create-image-viewer', (params) => {
        const areaId = params.areaId || params.itemMetadata?.areaId;
        if (areaId) {
            dispatch(setAreaType({
                areaId,
                type: 'image-viewer',
                initialState: { imageUrl: 'https://picsum.photos/300/400', caption: '' }
            }));
        }
    });

    useRegisterActionHandler('area.create-images-gallery', (params) => {
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
    });

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
