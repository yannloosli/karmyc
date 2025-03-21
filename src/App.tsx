import React from "react";
import { useDispatch } from "react-redux";
import { AreaRoot } from "~/components/area/components/AreaRoot";
import { useAreaKeyboardShortcuts, useRegisterActionHandler, useRegisterAreaType, useRegisterContextMenuAction } from "~/hooks";
import { useArea } from "~/hooks/useArea";
import { setAreaType } from "~/store/slices/areaSlice";

// Déterminer si une couleur doit avoir un texte clair ou sombre
function getContrastColor(hexColor: string): string {
    // Convertir le code hexadécimal en RGB
    const r = parseInt(hexColor.substring(1, 3), 16);
    const g = parseInt(hexColor.substring(3, 5), 16);
    const b = parseInt(hexColor.substring(5, 7), 16);

    // Calculer la luminosité
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Si la luminosité est élevée (couleur claire), retourner du texte noir, sinon du texte blanc
    return luminance > 0.5 ? '#000000' : '#ffffff';
}

// Composant pour une zone de texte personnalisée
const TextNoteArea: React.FC<{ id: string; state: any; isActive?: boolean }> = ({
    id,
    state = {},
    isActive = false
}) => {
    const { updateAreaState } = useArea();

    // S'assurer que state.content existe
    const content = state?.content || '';

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        updateAreaState(id, {
            content: e.target.value
        });
    };

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                background: isActive ? '#e6f7ff' : '#f5f5f5',
                border: isActive ? '2px solid #1890ff' : '1px solid #d9d9d9',
                borderRadius: '4px',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <div style={{
                fontWeight: 'bold',
                marginBottom: '4px',
                padding: '4px',
                background: '#f0f0f0',
                borderRadius: '2px'
            }}>
                Note de texte
            </div>
            <textarea
                value={content}
                onChange={handleChange}
                style={{
                    flex: 1,
                    resize: 'none',
                    border: '1px solid #d9d9d9',
                    borderRadius: '2px',
                    padding: '4px',
                    fontFamily: 'inherit'
                }}
                placeholder="Écrivez votre texte ici..."
            />
        </div>
    );
};

// Composant pour une zone de couleur personnalisée
const ColorPickerArea: React.FC<{ id: string; state: any; isActive?: boolean }> = ({
    id,
    state = {},
    isActive = false
}) => {
    const { updateAreaState } = useArea();

    // S'assurer que state.color existe
    const color = state?.color || '#1890ff';

    const colors = ['#f5222d', '#fa8c16', '#fadb14', '#52c41a', '#1890ff', '#722ed1', '#eb2f96'];

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                background: isActive ? '#e6f7ff' : '#f5f5f5',
                border: isActive ? '2px solid #1890ff' : '1px solid #d9d9d9',
                borderRadius: '4px',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <div style={{
                fontWeight: 'bold',
                marginBottom: '4px',
                padding: '4px',
                background: '#f0f0f0',
                borderRadius: '2px'
            }}>
                Palette de couleurs
            </div>
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{
                    background: color,
                    color: getContrastColor(color),
                    width: '100%',
                    padding: '20px 0',
                    textAlign: 'center',
                    borderRadius: '4px',
                    marginBottom: '10px',
                    fontWeight: 'bold'
                }}>
                    {color}
                </div>
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: '5px'
                }}>
                    {colors.map(c => (
                        <div
                            key={c}
                            style={{
                                width: '30px',
                                height: '30px',
                                background: c,
                                cursor: 'pointer',
                                borderRadius: '4px',
                                border: c === color ? '2px solid #000' : '1px solid #d9d9d9'
                            }}
                            onClick={() => updateAreaState(id, { color: c })}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

// Composant pour une zone d'image personnalisée
const ImageViewerArea: React.FC<{ id: string; state: any; isActive?: boolean }> = ({
    id,
    state = {},
    isActive = false
}) => {
    const { updateAreaState } = useArea();

    // S'assurer que les propriétés existent
    const imageUrl = state?.imageUrl || 'https://picsum.photos//300/400';
    const caption = state?.caption || '';

    const handleCaptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateAreaState(id, {
            ...state,
            caption: e.target.value
        });
    };

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                background: isActive ? '#e6f7ff' : '#f5f5f5',
                border: isActive ? '2px solid #1890ff' : '1px solid #d9d9d9',
                borderRadius: '4px',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <div style={{
                fontWeight: 'bold',
                marginBottom: '4px',
                padding: '4px',
                background: '#f0f0f0',
                borderRadius: '2px'
            }}>
                Visualiseur d'image
            </div>
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                marginBottom: '8px'
            }}>
                <img
                    src={imageUrl}
                    alt={caption}
                    style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain'
                    }}
                />
            </div>
            <input
                type="text"
                value={caption}
                onChange={handleCaptionChange}
                placeholder="Légende de l'image"
                style={{
                    border: '1px solid #d9d9d9',
                    borderRadius: '2px',
                    padding: '4px',
                    fontFamily: 'inherit'
                }}
            />
        </div>
    );
};

// Composant de configuration
const AreaSetup: React.FC = () => {
    // Enregistrer les types de zones personnalisés
    useRegisterAreaType(
        'text-note',
        TextNoteArea,
        { content: '' },
        {
            displayName: 'Note de texte',
            defaultSize: { width: 300, height: 200 }
        }
    );

    useRegisterAreaType(
        'color-picker',
        ColorPickerArea,
        { color: '#1890ff' },
        {
            displayName: 'Palette de couleurs',
            defaultSize: { width: 300, height: 250 }
        }
    );

    // Nouveau type de zone d'image
    useRegisterAreaType(
        'image-viewer',
        ImageViewerArea,
        { imageUrl: 'https://picsum.photos//300/400', caption: '' },
        {
            displayName: 'Visualiseur d\'image',
            defaultSize: { width: 350, height: 300 }
        }
    );

    // Ajouter des raccourcis clavier pour le type text-note
    useAreaKeyboardShortcuts('text-note', [
        {
            key: 'S',
            modifierKeys: ['Control'],
            name: 'Sauvegarder le texte',
            fn: (areaId, params) => {
                console.log(`Sauvegarde du texte de la zone ${areaId}`);
                // Ici, vous pourriez implémenter une logique de sauvegarde réelle
            }
        }
    ]);

    // Ajouter des actions supportées pour color-picker
    useAreaKeyboardShortcuts('color-picker', [
        {
            key: 'R',
            modifierKeys: ['Control'],
            name: 'Réinitialiser la couleur',
            fn: (areaId, params) => {
                console.log(`Réinitialisation de la couleur pour la zone ${areaId}`);
                const { updateAreaState } = useArea();
                updateAreaState(areaId, { color: '#1890ff' });
            }
        }
    ]);

    // Ajouter des actions supportées pour image-viewer
    useAreaKeyboardShortcuts('image-viewer', [
        {
            key: 'R',
            modifierKeys: ['Control'],
            name: 'Recharger l\'image',
            fn: (areaId, params) => {
                console.log(`Rechargement de l'image pour la zone ${areaId}`);
                // Action de rechargement si nécessaire
            }
        }
    ]);

    // Accéder aux fonctions du hook useArea
    const { createArea } = useArea();

    // Importer l'action setAreaType
    const dispatch = useDispatch();

    // Enregistrer les actions de menu contextuel
    const registerContextMenuAction = useRegisterContextMenuAction();

    // Enregistrer les gestionnaires d'actions pour les nouvelles zones

    // Gestionnaire pour l'action 'area.create-text-note'
    useRegisterActionHandler('area.create-text-note', (params) => {
        console.log("Action 'area.create-text-note' exécutée avec les paramètres:", params);

        // Récupérer l'ID de la zone cible depuis les paramètres
        const areaId = params.areaId || params.itemMetadata?.areaId;

        if (areaId) {
            // Changer le type de la zone existante
            dispatch(setAreaType({
                areaId,
                type: 'text-note',
                initialState: { content: '' }
            }));
            console.log(`Zone ${areaId} convertie en text-note`);
        } else {
            console.error("ID de zone manquant dans les paramètres");
        }
    });

    // Gestionnaire pour l'action 'area.create-color-picker'
    useRegisterActionHandler('area.create-color-picker', (params) => {
        console.log("Action 'area.create-color-picker' exécutée avec les paramètres:", params);

        // Récupérer l'ID de la zone cible depuis les paramètres
        const areaId = params.areaId || params.itemMetadata?.areaId;

        if (areaId) {
            // Changer le type de la zone existante
            dispatch(setAreaType({
                areaId,
                type: 'color-picker',
                initialState: { color: '#1890ff' }
            }));
            console.log(`Zone ${areaId} convertie en color-picker`);
        } else {
            console.error("ID de zone manquant dans les paramètres");
        }
    });

    // Nouveau gestionnaire pour l'action 'area.create-image-viewer'
    useRegisterActionHandler('area.create-image-viewer', (params) => {
        console.log("Action 'area.create-image-viewer' exécutée avec les paramètres:", params);

        // Récupérer l'ID de la zone cible depuis les paramètres
        const areaId = params.areaId || params.itemMetadata?.areaId;

        if (areaId) {
            // Changer le type de la zone existante
            dispatch(setAreaType({
                areaId,
                type: 'image-viewer',
                initialState: {
                    imageUrl: 'https://picsum.photos//300/400',
                    caption: ''
                }
            }));
            console.log(`Zone ${areaId} convertie en image-viewer`);
        } else {
            console.error("ID de zone manquant dans les paramètres");
        }
    });

    // Enregistrer les actions dans le menu contextuel
    registerContextMenuAction('area', {
        id: 'create-text-note',
        label: 'Convertir en note',
        handler: () => {
            // Cette fonction ne sera pas utilisée directement
            // L'action sera exécutée via le gestionnaire enregistré
        }
    });

    registerContextMenuAction('area', {
        id: 'create-color-picker',
        label: 'Convertir en palette',
        handler: () => {
            // Cette fonction ne sera pas utilisée directement
            // L'action sera exécutée via le gestionnaire enregistré
        }
    });

    // Nouvelle action de menu contextuel
    registerContextMenuAction('area', {
        id: 'create-image-viewer',
        label: 'Convertir en image',
        handler: () => {
            // Cette fonction ne sera pas utilisée directement
            // L'action sera exécutée via le gestionnaire enregistré
        }
    });

    return null;
};

export const App: React.FC = () => {
    // Fonction pour réinitialiser l'état
    const handleReset = () => {
        if (window.confirm("Êtes-vous sûr de vouloir réinitialiser l'application ? Toutes vos données seront perdues.")) {
            // Effacer le localStorage et recharger la page
            localStorage.removeItem('areaState');
            window.location.reload();
        }
    };

    return (
        <>
            <AreaSetup />
            <AreaRoot />

            {/* Bouton de réinitialisation */}
            <div style={{
                position: 'fixed',
                bottom: '10px',
                right: '10px',
                zIndex: 999
            }}>
                <button
                    onClick={handleReset}
                    style={{
                        background: '#ff4d4f',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                    }}
                >
                    Réinitialiser l'application
                </button>
            </div>
        </>
    );
};
