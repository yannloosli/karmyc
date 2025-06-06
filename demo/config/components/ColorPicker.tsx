import { useEffect, useMemo, useState } from 'react';
import { useArea, useKarmycStore, AREA_ROLE, useSpace, useSpaceStore } from '../../../src';

// Type pour l'état du composant
interface ColorPickerAreaState {
    color: string;
}

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

export const ColorPicker: React.FC<ColorPickerAreaProps> = ({
    id,
    state,
    viewport,
    targetSpace,
}) => {
    const { activeSpaceId, updateSharedState, spaceList } = useSpace();
    const areaStore = useKarmycStore();
    const activeScreenId = areaStore.activeScreenId;
    const allAreas = areaStore.screens[activeScreenId]?.areas.areas || {};
    const lastLeadAreaId = areaStore.screens[activeScreenId]?.areas.lastLeadAreaId;

    const [selectedSpace, setSelectedSpace] = useState<string>(targetSpace || activeSpaceId || '');

    // Synchroniser le select sur l'espace du dernier LEAD sélectionné
    useEffect(() => {
        if (lastLeadAreaId && selectedSpace !== lastLeadAreaId) {
            setSelectedSpace(lastLeadAreaId);
        }
    }, [lastLeadAreaId]);

    // Récupérer l'area LEAD et son spaceId
    const leadArea = lastLeadAreaId ? allAreas[lastLeadAreaId] : null;
    const leadSpaceId = leadArea?.spaceId;

    // Couleur à afficher : priorité à la couleur du space du LEAD
    const spaceStore = useSpaceStore();
    const leadSpaceColor = leadSpaceId ? spaceStore.spaces[leadSpaceId]?.sharedState?.color : undefined;
    const colorToShow = leadSpaceColor || state.color || '#ffffff';

    const updateColor = (color: string) => {
        const activeScreenId = useKarmycStore.getState().activeScreenId;
        const lastLeadAreaId = useKarmycStore.getState().screens[activeScreenId]?.areas.lastLeadAreaId;
        const allAreas = useKarmycStore.getState().screens[activeScreenId]?.areas.areas || {};
        const leadArea = lastLeadAreaId ? allAreas[lastLeadAreaId] : null;

        if (leadArea?.spaceId) {
            updateSharedState(leadArea.spaceId, { color });
        }
    };

    return (
        <div style={{
            width: viewport.width,
            height: viewport.height,
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
                <code>{colorToShow}</code>
            </div>
        </div>
    );
};
