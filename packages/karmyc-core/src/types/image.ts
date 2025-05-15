/**
 * Types related to images
 */

/**
 * Represents an image with its metadata
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
 * Common state for image viewer components
 */
export interface ImageViewerState {
    image: ImageData;
    zoom: number;
    filter: string;
}

/**
 * State for the image gallery
 */
export interface ImagesGalleryState {
    images: ImageData[];
    selectedImageId: string | null;
    zoom: number;
    filter: string;
    sortBy: 'default' | 'title' | 'titleDesc' | 'random';
} 
