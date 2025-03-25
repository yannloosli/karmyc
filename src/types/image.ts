/**
 * Types liés aux images
 */

/**
 * Représente une image avec ses métadonnées
 */
export interface ImageData {
    id: string;
    url: string;
    caption?: string;
    width?: number;
    height?: number;
    metadata?: {
        createdAt?: string;
        updatedAt?: string;
        source?: string;
        tags?: string[];
    };
}

/**
 * État commun pour les composants de visualisation d'images
 */
export interface ImageViewerState {
    image: ImageData;
    zoom: number;
    filter: string;
}

/**
 * État pour la galerie d'images
 */
export interface ImagesGalleryState {
    images: ImageData[];
    selectedImageId: string | null;
    zoom: number;
    filter: string;
    sortBy: 'default' | 'title' | 'titleDesc' | 'random';
} 
