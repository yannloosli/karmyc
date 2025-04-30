import { useArea } from "@gamesberry/karmyc-core";
import { areaRegistry } from "@gamesberry/karmyc-core/area/registry";
import { useAreaStore } from "@gamesberry/karmyc-core/stores/areaStore";
import React from "react";

// Component to reset the state
export const ResetButtonWrapper: React.FC = () => {
    const { update } = useArea();
    const areas = useAreaStore((state) => state.areas);
    const activeAreaId = useAreaStore((state) => state.activeAreaId);

    const handleReset = () => {
        if (activeAreaId && areas[activeAreaId]) {
            const area = areas[activeAreaId];
            const initialState = areaRegistry.getInitialState(area.type);
            if (initialState) {
                update(activeAreaId, { state: initialState });
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
