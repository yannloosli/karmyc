import React from "react";
import { useSelector } from "react-redux";
import { areaRegistry } from "~/area/registry";
import { useArea } from "~/hooks/useArea";
import { RootState } from '~/store/store';

// Component to reset the state
export const ResetButtonWrapper: React.FC = () => {
    const { updateAreaState } = useArea();
    const areas = useSelector((state: RootState) => state.area.areas);
    const activeAreaId = useSelector((state: RootState) => state.area.activeAreaId);

    const handleReset = () => {
        if (activeAreaId && areas[activeAreaId]) {
            const area = areas[activeAreaId];
            const initialState = areaRegistry.getInitialState(area.type);
            if (initialState) {
                updateAreaState(activeAreaId, initialState);
            }
        }
    };

    return (
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
            <button
                onClick={handleReset}
                style={{
                    background: '#ff4d4f',
                    color: 'white',
                    border: 'none',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                }}
            >
                <span role="img" aria-label="reset">🔄</span>
                Reset active area
            </button>
        </div>
    );
};
