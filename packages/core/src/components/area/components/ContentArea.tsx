import { AreaIdContext } from '@gamesberry/karmyc-core/utils/AreaIdContext';
import React from 'react';
import { AreaErrorBoundary } from './AreaErrorBoundary';

interface ContentAreaProps {
    id: string;
    state: any;
    type: string;
    viewport: any;
    Component: React.ComponentType<any>;
}

export const ContentArea: React.FC<ContentAreaProps> = ({
    id,
    state,
    type,
    viewport,
    Component
}) => {
    // Using a key to ensure the component is properly recreated when state changes
    const areaStateKey = state?.key || id;

    return (
        <div className="area-content" style={{ border: '1px dashed blue', position: 'relative', overflow: 'auto' }}>
            <AreaIdContext.Provider value={id}>
                <AreaErrorBoundary
                    key={areaStateKey}
                    component={Component}
                    areaId={id}
                    areaState={state}
                    type={type}
                    viewport={viewport}
                >
                    <Component
                        id={id}
                        state={state}
                        type={type}
                        viewport={viewport}
                        isActive={true} // Should be modified to reflect the actual activation state
                    />
                </AreaErrorBoundary>
            </AreaIdContext.Provider>
        </div>
    );
}; 
