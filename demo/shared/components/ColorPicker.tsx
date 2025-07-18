import { useEffect, useState } from 'react';
import { useSpace } from '../../../src/hooks';
import { useKarmycStore } from '../../../src/core/store';
import { useSpaceStore } from '../../../src/core/spaceStore';
import { useActiveSpaceHistory } from '../../../src/hooks/useHistory';
import { t } from '../../../src/core/utils/translation';

// Type for component state
interface ColorPickerAreaState {
    color: string;
}

// Component properties type using types defined by Karmyc API
interface ColorPickerAreaProps {
    id: string;
    state: ColorPickerAreaState;
    viewport: {
        width: number;
        height: number;
    };
    type?: string;
    targetSpace?: string;
}

// Determine if a color should have light or dark text
function getContrastColor(hexColor: string): string {
    // Convert hex code to RGB
    const r = parseInt(hexColor.substring(1, 3), 16);
    const g = parseInt(hexColor.substring(3, 5), 16);
    const b = parseInt(hexColor.substring(5, 7), 16);

    // Calculate brightness
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // If brightness is high (light color), return black text, otherwise white text
    return luminance > 0.5 ? '#000000' : '#ffffff';
}

export const ColorPicker: React.FC<ColorPickerAreaProps> = ({
    id,
    state,
    viewport,
    type,
    targetSpace,
}) => {
    const { activeSpaceId, updateSpaceProperties } = useSpace();
    const areaStore = useKarmycStore();
    const spaceStore = useSpaceStore();
    
    // Nouveau système d'historique amélioré
    const history = useActiveSpaceHistory();
    
    const activeScreenId = areaStore.activeScreenId;
    const allAreas = areaStore.screens[activeScreenId]?.areas.areas || {};
    const lastLeadAreaId = areaStore.screens[activeScreenId]?.areas.lastLeadAreaId;

    const [selectedSpace, setSelectedSpace] = useState<string>(targetSpace || activeSpaceId || '');

    // Synchronize select with the space of the last selected LEAD
    useEffect(() => {
        const leadArea = lastLeadAreaId ? allAreas[lastLeadAreaId] : null;
        const leadSpaceId = leadArea?.spaceId;
    

        if (leadSpaceId && leadSpaceId !== selectedSpace) {
            setSelectedSpace(leadSpaceId);
        } else if (!leadSpaceId && activeSpaceId && activeSpaceId !== selectedSpace) {
            setSelectedSpace(activeSpaceId);
        }
    }, [lastLeadAreaId, activeSpaceId, allAreas]);

    // Get LEAD area and its spaceId
    const leadArea = lastLeadAreaId ? allAreas[lastLeadAreaId] : null;
    const leadSpaceId = leadArea?.spaceId;

    // Color to display: priority to selected space color
    const spaceColor = selectedSpace ? spaceStore.spaces[selectedSpace]?.color : undefined;
    const colorToShow = spaceColor || state.color || '#ffffff';

    // Fonction mise à jour avec le nouveau système d'historique
    const updateColor = (color: string) => {
        const spaceToUpdate = selectedSpace || leadSpaceId || activeSpaceId;

        if (!spaceToUpdate) {
            console.warn("No space available to update color");
            return;
        }

        // Obtenir l'ancienne couleur pour créer un diff
        const oldColor = spaceStore.spaces[spaceToUpdate]?.color || '#ffffff';
        
        // Créer une action d'historique avec diff
        const diffs = [{
            type: 'UPDATE',
            path: ['color'],
            oldValue: oldColor,
            newValue: color,
            metadata: {
                allowIndexShift: false,
                modifiedRelated: false,
            }
        }];

        const result = history.createSimpleAction(
            'UPDATE_SPACE_COLOR',
            diffs,
            false,
            ['color', 'space']
        );

        if (result.success) {
            // Mettre à jour l'espace via l'ancien système pour compatibilité
            updateSpaceProperties(spaceToUpdate, { color });
            
            // Optionnel : Afficher une notification de succès
            console.log('Couleur mise à jour avec succès:', color);
        } else {
            // Gestion d'erreur avec le nouveau système
            console.error('Erreur lors de la mise à jour de la couleur:', result.error);
            
            // Fallback vers l'ancien système en cas d'erreur
            updateSpaceProperties(spaceToUpdate, { color });
        }
    };

    // Fonction pour annuler le dernier changement de couleur
    const handleUndoColor = () => {
        if (history.canUndo()) {
            const result = history.undo();
            if (result.success) {
                console.log('Changement de couleur annulé');
            } else {
                console.error('Erreur lors de l\'annulation:', result.error);
            }
        }
    };

    // Fonction pour refaire le dernier changement de couleur
    const handleRedoColor = () => {
        if (history.canRedo()) {
            const result = history.redo();
            if (result.success) {
                console.log('Changement de couleur refait');
            } else {
                console.error('Erreur lors du redo:', result.error);
            }
        }
    };

    return (
        <div style={{
            width: viewport.width,
            height: viewport.height,
            position: 'relative',
        }}>
            <style>
                {`
                input.color-picker::-webkit-color-swatch {
                    border: 0 none;
                    }
                input.color-picker::-moz-color-swatch {
                    border: 0 none;
                    }
                `}
            </style>
            <input
                className="color-picker"
                type="color"
                value={colorToShow}
                onChange={(e) => updateColor(e.target.value)}
                title={t('colorPicker.pickColor', 'Pick a color')}
                style={{
                    width: '100%',
                    height: '100%',
                    border: '0 none',
                    borderColor: colorToShow,
                    cursor: 'pointer',
                    padding: '0',
                    backgroundColor: colorToShow,
                    outline: '0 none'
                }}
            />
            
            {/* Affichage de la couleur actuelle */}
            <div style={{
                fontSize: '1.25rem',
                color: getContrastColor(colorToShow),
                position: 'absolute',
                top: '0',
                left: '0',
                height: '100%',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                pointerEvents: 'none'
            }}>
                <code style={{ backgroundColor: 'transparent' }} title={t('colorPicker.currentColor', 'Current color')}>{colorToShow}</code>
            </div>
            
            {/* Boutons d'historique (optionnels, pour debug) */}
            {process.env.NODE_ENV === 'development' && (
                <div style={{
                    position: 'absolute',
                    bottom: '5px',
                    right: '5px',
                    display: 'flex',
                    gap: '2px',
                    pointerEvents: 'auto',
                }}>
                    <button
                        onClick={handleUndoColor}
                        disabled={!history.canUndo()}
                        style={{
                            fontSize: '0.75rem',
                            padding: '2px 4px',
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '2px',
                            cursor: history.canUndo() ? 'pointer' : 'not-allowed',
                            opacity: history.canUndo() ? 1 : 0.5,
                        }}
                        title="Annuler (Ctrl+Z)"
                    >
                        ↶
                    </button>
                    <button
                        onClick={handleRedoColor}
                        disabled={!history.canRedo()}
                        style={{
                            fontSize: '0.75rem',
                            padding: '2px 4px',
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '2px',
                            cursor: history.canRedo() ? 'pointer' : 'not-allowed',
                            opacity: history.canRedo() ? 1 : 0.5,
                        }}
                        title="Refaire (Ctrl+Y)"
                    >
                        ↷
                    </button>
                </div>
            )}
            
            {/* Indicateur d'action en cours (optionnel) */}
            {history.isActionInProgress && (
                <div style={{
                    position: 'absolute',
                    top: '5px',
                    left: '5px',
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#ff6b6b',
                    borderRadius: '50%',
                    animation: 'pulse 1s infinite',
                }} />
            )}
            
            <style>
                {`
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
                `}
            </style>
        </div>
    );
};
