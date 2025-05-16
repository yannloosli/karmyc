import React from 'react';
import { AreaErrorBoundary } from './AreaErrorBoundary';
import { AreaIdContext } from '../../../utils/AreaIdContext';
import { css } from '@emotion/css';

const areaContent = css`
    flex: 1 !important;
    position: relative !important;
    overflow: auto !important;
    border: 1px dashed blue !important;
`;

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
        <div className={"area-content " + areaContent}>
            <AreaIdContext.Provider value={id}>
                <AreaErrorBoundary
                    key={areaStateKey}
                    component={Component}
                    areaId={id}
                    areaState={state}
                    type={type}
                    viewport={viewport}
                />
            </AreaIdContext.Provider>
        </div>
    );
}; 
