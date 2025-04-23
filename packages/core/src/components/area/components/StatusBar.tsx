import React, { useCallback } from 'react';

import { TOOLBAR_HEIGHT } from '@gamesberry/karmyc-core/constants';

// Type to uniquely identify a component
type ComponentIdentifier = {
    name: string;
    type: string;
};

// Registry for status bar components
const statusBarComponentRegistry: Record<string, Array<{
    component: React.ComponentType<any>;
    order: number;
    alignment: 'left' | 'center' | 'right';
    width?: string | number;
    identifier: ComponentIdentifier;
}>> = {};

// Custom hook for status bar
export const useStatusBar = (areaType: string, areaId: string) => {
    // Create a unique key for this type:id combination
    const registryKey = `${areaType}:${areaId}`;

    // Function to register a component
    const registerComponent = useCallback((
        component: React.ComponentType<any>,
        identifier: ComponentIdentifier,
        options: {
            order?: number;
            alignment?: 'left' | 'center' | 'right';
            width?: string | number;
        } = {}
    ) => {
        const { order = 0, alignment = 'left', width } = options;

        // Clean up existing components before adding new ones
        if (!statusBarComponentRegistry[registryKey]) {
            statusBarComponentRegistry[registryKey] = [];
        } else {
            // Keep only components with different identifiers
            statusBarComponentRegistry[registryKey] = statusBarComponentRegistry[registryKey].filter(
                item => !(item.identifier.name === identifier.name && item.identifier.type === identifier.type)
            );
        }

        const id = Math.random().toString(36).substr(2, 9);
        statusBarComponentRegistry[registryKey].push({
            component,
            order,
            alignment,
            width,
            identifier
        });

        // Sort components by order
        statusBarComponentRegistry[registryKey].sort((a, b) => a.order - b.order);

        return id;
    }, [registryKey]);

    // Function to retrieve components
    const getComponents = useCallback(() => {
        return statusBarComponentRegistry[registryKey] || [];
    }, [registryKey]);

    // Clean up components when unmounting
    React.useEffect(() => {
        return () => {
            delete statusBarComponentRegistry[registryKey];
        };
    }, [registryKey]);

    return {
        registerComponent,
        getComponents
    };
};

interface StatusBarProps {
    areaId: string;
    areaState: any;
    areaType: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({ areaId, areaState, areaType }) => {
    const { getComponents } = useStatusBar(areaType, areaId);
    const components = getComponents();

    // Organize components by alignment
    const leftComponents = components.filter(c => c.alignment === 'left');
    const centerComponents = components.filter(c => c.alignment === 'center');
    const rightComponents = components.filter(c => c.alignment === 'right');

    return (
        <div className="area-status-bar" style={{
            height: TOOLBAR_HEIGHT + 'px',
        }}>
            <div className="area-status-bar-section left" style={{ flex: 1, display: 'flex', gap: '8px' }}>
                {leftComponents.map((item, index) => {
                    const Component = item.component;
                    return (
                        <div key={`${item.identifier.type}-${item.identifier.name}-${index}`} className="area-status-bar-item" style={{ width: item.width }}>
                            <Component areaId={areaId} areaState={areaState} />
                        </div>
                    );
                })}
            </div>
            <div className="area-status-bar-section center" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '8px' }}>
                {centerComponents.map((item, index) => {
                    const Component = item.component;
                    return (
                        <div key={`${item.identifier.type}-${item.identifier.name}-${index}`} className="area-status-bar-item" style={{ width: item.width }}>
                            <Component areaId={areaId} areaState={areaState} />
                        </div>
                    );
                })}
            </div>
            <div className="area-status-bar-section right" style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                {rightComponents.map((item, index) => {
                    const Component = item.component;
                    return (
                        <div key={`${item.identifier.type}-${item.identifier.name}-${index}`} className="area-status-bar-item" style={{ width: item.width }}>
                            <Component areaId={areaId} areaState={areaState} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}; 
