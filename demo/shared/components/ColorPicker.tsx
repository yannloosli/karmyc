import { useEffect, useState } from 'react';
import { useSpace } from '../../../src/hooks';
import { useKarmycStore } from '../../../src/core/store';
import { useSpaceStore } from '../../../src/core/spaceStore';
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
    state,
    viewport,
    targetSpace,
}) => {
    const { activeSpaceId, updateSpaceProperties } = useSpace();
    const areaStore = useKarmycStore();
    const spaceStore = useSpaceStore();
    
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

    const updateColor = (color: string) => {
        const spaceToUpdate = selectedSpace || leadSpaceId || activeSpaceId;

        if (spaceToUpdate) {
            updateSpaceProperties(spaceToUpdate, { color });
        } else {
            console.warn("No space available to update color");
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
        </div>
    );
};
