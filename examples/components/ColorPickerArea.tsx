import React from 'react';
import { useArea } from '~/hooks/useArea';
import { AreaComponentProps } from '~/types/areaTypes';

interface ColorPickerState {
    color: string;
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

export const ColorPickerArea: React.FC<AreaComponentProps<ColorPickerState>> = ({
    id,
    state,
    viewport
}) => {
    const { updateAreaState } = useArea();

    // Ensure state.color exists
    const color = state?.color || '#1890ff';

    const colors = ['#f5222d', '#fa8c16', '#fadb14', '#52c41a', '#1890ff', '#722ed1', '#eb2f96'];

    return (
        <div style={{
            width: viewport.width,
            height: viewport.height,
            padding: '1rem',
            background: '#fff'
        }}>
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
