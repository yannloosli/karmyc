import React from 'react';
import { AreaIdContext } from '~/utils/AreaIdContext';
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
    // Utilisation d'une clé pour s'assurer que le composant est correctement recréé lors d'un changement d'état
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
                        isActive={true} // À modifier si nécessaire pour refléter l'état d'activation réel
                    />
                </AreaErrorBoundary>
            </AreaIdContext.Provider>
        </div>
    );
}; 
