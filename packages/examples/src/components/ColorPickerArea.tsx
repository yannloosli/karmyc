import { useArea, useSpace } from '@gamesberry/karmyc-core';
import React, { useEffect, useMemo, useState } from 'react';

// Type pour l'état du composant
interface ColorPickerAreaState {
    color: string;
}

// Définir un type pour les espaces
type Space = {
    name: string;
    sharedState?: {
        color?: string;
    };
};

type Spaces = Record<string, Space>;

// Type des propriétés du composant en utilisant les types définis par l'API de Karmyc
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

export const ColorPickerArea: React.FC<ColorPickerAreaProps> = ({
    id,
    state,
    viewport,
    targetSpace,
}) => {
    const { activeSpaceId, updateSharedState, spaceList } = useSpace();
    const { removeArea, update: updateArea } = useArea();

    const [selectedSpace, setSelectedSpace] = useState<string>(targetSpace || activeSpaceId || '');

    // Loguer la prop state quand elle change
    useEffect(() => {
        console.log(`ColorPickerArea [${id}] received new state:`, state);
    }, [state, id]); // Dépendre de state et id

    const handleSpaceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedSpace(event.target.value);
    };

    const updateColor = (color: string) => {
        // Use updateArea and pass the state change correctly
        updateArea(id, { state: { color: color } });

        if (selectedSpace) {
            updateSharedState(selectedSpace, { color });
        }
    };

    // Build options using the spaceList
    const spaceOptions = useMemo(() => {
        return spaceList.map((space) => (
            <option key={space.id} value={space.id}>
                {space.name}
            </option>
        ));
    }, [spaceList]); // Recompute only when spaceList changes

    return (
        <div style={{
            width: viewport.width,
            height: viewport.height,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            background: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
        }}>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                gap: '1rem'
            }}>
                <h3 style={{ margin: 0, textAlign: 'center' }}>Sélecteur de couleur</h3>

                {/* Afficher le sélecteur de couleur */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <input
                        type="color"
                        value={state.color || '#ffffff'}
                        onChange={(e) => updateColor(e.target.value)}
                        style={{
                            width: '100%',
                            height: '50px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    />
                    <div style={{ fontSize: '0.9rem' }}>
                        Couleur actuelle: <code>{state.color || '#ffffff'}</code>
                    </div>
                </div>

                {/* Sélectionner l'espace pour appliquer la couleur */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                }}>
                    <label htmlFor="space-select">Appliquer à l'espace:</label>
                    <select
                        id="space-select"
                        value={selectedSpace}
                        onChange={handleSpaceChange}
                        style={{
                            padding: '0.5rem',
                            borderRadius: '4px',
                            border: '1px solid #ccc'
                        }}
                    >
                        <option value="">-- Aucun espace --</option>
                        {spaceOptions}
                    </select>
                </div>

                {/* Bouton pour fermer/supprimer */}
                <button
                    onClick={() => removeArea(id)}
                    style={{
                        padding: '0.5rem',
                        marginTop: '1rem',
                        background: '#ff4d4f',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Fermer
                </button>
            </div>
        </div>
    );
};
