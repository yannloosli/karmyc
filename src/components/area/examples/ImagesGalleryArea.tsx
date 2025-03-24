import React, { useEffect, useState } from 'react';
import { useArea } from '~/hooks/useArea';
import { AreaComponentProps } from '~/types/areaTypes';
import { useMenuBar } from '../components/MenuBar';
import { useStatusBar } from '../components/StatusBar';
import { useToolbar } from '../components/Toolbar';

interface GalleryImage {
    id: string;
    url: string;
    caption?: string;
}

interface ImagesGalleryState {
    images: GalleryImage[];
    selectedImageId: string | null;
    zoom: number;
    filter: string;
    sortBy: string;
}

export const ImagesGalleryArea: React.FC<AreaComponentProps<ImagesGalleryState>> = ({
    id,
    state,
    viewport
}) => {
    const { updateAreaState } = useArea();
    const { registerComponent: registerMenuComponent } = useMenuBar('images-gallery', id);
    const { registerComponent: registerStatusComponent } = useStatusBar('images-gallery', id);
    const {
        registerComponent: registerToolbarComponent,
        registerSlotComponent
    } = useToolbar('images-gallery', id);

    // États locaux
    const [viewMode, setViewMode] = useState<'grid' | 'single'>('grid');

    // S'assurer que les propriétés existent
    const images = state?.images || [];
    const selectedImageId = state?.selectedImageId;
    const zoom = state?.zoom || 1;
    const filter = state?.filter || 'none';
    const sortBy = state?.sortBy || 'default';

    // Trouver l'image actuellement sélectionnée
    const selectedImage = images.find((img: GalleryImage) => img.id === selectedImageId) || images[0];

    // Fonction pour ajouter une nouvelle image
    const addImage = () => {
        const newImage: GalleryImage = {
            id: Date.now().toString(),
            url: `https://picsum.photos/300/400?t=${Date.now()}`,
            caption: ''
        };

        updateAreaState(id, {
            ...state,
            images: [...images, newImage],
            selectedImageId: newImage.id
        });
    };

    // Fonction pour sélectionner une image
    const selectImage = (imageId: string) => {
        updateAreaState(id, {
            ...state,
            selectedImageId: imageId
        });
    };

    // Fonction pour supprimer une image
    const deleteImage = (imageId: string) => {
        updateAreaState(id, {
            ...state,
            images: images.filter(img => img.id !== imageId),
            selectedImageId: selectedImageId === imageId ? null : selectedImageId
        });
    };

    // Fonction pour mettre à jour la légende d'une image
    const updateCaption = (imageId: string, caption: string) => {
        updateAreaState(id, {
            ...state,
            images: images.map(img =>
                img.id === imageId ? { ...img, caption } : img
            )
        });
    };

    // Fonction pour changer le zoom
    const changeZoom = (newZoom: number) => {
        updateAreaState(id, {
            ...state,
            zoom: newZoom
        });
    };

    // Fonction pour changer le mode d'affichage
    const toggleViewMode = () => {
        setViewMode(viewMode === 'grid' ? 'single' : 'grid');
    };

    // Fonction pour changer le filtre
    const changeFilter = (newFilter: string) => {
        updateAreaState(id, {
            ...state,
            filter: newFilter
        });
    };

    // Fonction pour trier les images
    const sortImages = (sortType: string) => {
        updateAreaState(id, {
            ...state,
            sortBy: sortType
        });
    };

    // Tri des images selon le critère sélectionné
    const sortedImages = [...images].sort((a: GalleryImage, b: GalleryImage) => {
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

    useEffect(() => {
        // DEBUG: Log au début du useEffect
        console.log(`ImagesGalleryArea - Enregistrement des composants pour ${id}`);

        // --- Menu Bar Components ---
        // Menu déroulant des filtres (premier élément)
        registerMenuComponent(
            () => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '36px' }}>
                    <span style={{ fontSize: '12px' }}>Filtre:</span>
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
                        <option value="grayscale(100%)">Noir & Blanc</option>
                        <option value="sepia(70%)">Sépia</option>
                        <option value="brightness(120%)">Lumineux</option>
                        <option value="contrast(150%)">Contraste</option>
                        <option value="hue-rotate(90deg)">Teinte</option>
                        <option value="invert(80%)">Inversé</option>
                        <option value="blur(2px)">Flou</option>
                    </select>
                </div>
            ),
            { name: 'filterSelect', type: 'menu' }
        );

        // Sélecteur de tri (deuxième élément)
        registerMenuComponent(
            () => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '16px' }}>
                    <span style={{ fontSize: '12px' }}>Tri:</span>
                    <select
                        value={sortBy}
                        onChange={(e) => sortImages(e.target.value)}
                        style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            border: '1px solid #d9d9d9'
                        }}
                    >
                        <option value="default">Par défaut</option>
                        <option value="title">Titre ↑</option>
                        <option value="titleDesc">Titre ↓</option>
                        <option value="random">Aléatoire</option>
                    </select>
                </div>
            ),
            { name: 'sortSelector', type: 'menu' }
        );

        // --- Status Bar Components ---
        // Nom de l'image (gauche)
        registerStatusComponent(
            () => {
                const img = images.find((img: GalleryImage) => img.id === selectedImageId);
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span role="img" aria-label="image">🖼️</span>
                        <span style={{ fontWeight: 'normal' }}>{img?.caption || 'Sans titre'}</span>
                    </div>
                );
            },
            { name: 'imageName', type: 'status' },
            { order: 10, alignment: 'left', width: 'auto' }
        );

        // Taille de l'image (centre)
        registerStatusComponent(
            () => (
                <div style={{ textAlign: 'center' }}>
                    {selectedImageId ? '300 × 200 px' : ''}
                </div>
            ),
            { name: 'imageSize', type: 'status' },
            { order: 20, alignment: 'center', width: 'auto' }
        );

        // Niveau de zoom (droite)
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

        // --- Toolbar Slots ---
        // Boutons de zoom (slot NE)
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

        // Navigation gauche (slot W)
        registerSlotComponent(
            'w',
            () => (
                <button
                    onClick={() => {
                        const currentIndex = images.findIndex((img: GalleryImage) => img.id === selectedImageId);
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

        // Navigation droite (slot E)
        registerSlotComponent(
            'e',
            () => (
                <button
                    onClick={() => {
                        const currentIndex = images.findIndex((img: GalleryImage) => img.id === selectedImageId);
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

        // Bouton d'ajout (slot SE)
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
                    <span role="img" aria-label="add">➕</span> Ajouter
                </button>
            ),
            { name: 'addImage', type: 'slot' }
        );

        // Nettoyage lors du démontage
        return () => {
            console.log(`ImagesGalleryArea - Nettoyage des composants pour ${id}`);
        };
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

    return (
        <div style={{
            width: viewport.width,
            height: viewport.height,
            padding: '1rem',
            background: '#fff',
            display: 'grid',
            gridTemplateColumns: '200px 1fr',
            gap: '1rem'
        }}>
            {/* Sidebar avec la liste des images */}
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
                            style={{
                                border: selectedImageId === img.id ? '2px solid #1890ff' : '1px solid #d9d9d9',
                                borderRadius: '4px',
                                padding: '0.5rem',
                                cursor: 'pointer'
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
                                    borderRadius: '2px'
                                }}
                            />
                            <div style={{
                                marginTop: '0.5rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span style={{ fontSize: '0.8rem' }}>
                                    {img.caption || 'Sans titre'}
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

            {/* Zone principale d'affichage */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
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
                            placeholder="Ajouter une légende..."
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
                        Sélectionnez une image pour l'afficher
                    </div>
                )}
            </div>
        </div>
    );
}; 
