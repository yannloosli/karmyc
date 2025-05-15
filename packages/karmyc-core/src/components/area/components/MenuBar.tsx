import React, { useCallback, useEffect, useRef } from 'react';

import { TOOLBAR_HEIGHT } from '../../../constants';
import { useAreaStore } from '../../../stores/areaStore'; 
import { compileStylesheetLabelled } from '../../../utils/stylesheets';

// Type to uniquely identify a component
type ComponentIdentifier = {
    name: string;
    type: string;
};

// Menu bar component registry
const menuBarComponentRegistry: Record<string, Array<{
    component: React.ComponentType<any>;
    order: number;
    width?: string | number;
    identifier: ComponentIdentifier;
}>> = {};

// Custom hook for menu bar
export const useMenuBar = (areaType: string, areaId: string, style?: React.CSSProperties) => {
    // Create a unique key for this type:id combination
    const registryKey = `${areaType}:${areaId}`;

    // Function to register a component
    const registerComponent = useCallback((
        component: React.ComponentType<any>,
        identifier: ComponentIdentifier,
        options: { 
            order?: number;
            width?: string | number; }
    ) => {
        const { order = 0, width } = options;

        // Clean up existing components before adding new ones
        if (!menuBarComponentRegistry[registryKey]) {
            menuBarComponentRegistry[registryKey] = [];
        } else {
            // Keep only components with different identifiers
            menuBarComponentRegistry[registryKey] = menuBarComponentRegistry[registryKey].filter(
                item => !(item.identifier.name === identifier.name && item.identifier.type === identifier.type)
            );
        }

        const id = Math.random().toString(36).substr(2, 9);
        menuBarComponentRegistry[registryKey].push({
            component,
            order,
            width,
            identifier,
        });

        // Sort components by order
        menuBarComponentRegistry[registryKey].sort((a, b) => a.order - b.order);

        return id;
    }, [registryKey]);

    // Function to retrieve components
    const getComponents = useCallback(() => {
        return menuBarComponentRegistry[registryKey] || [];
    }, [registryKey]);

    return {
        registerComponent,
        getComponents
    };
};

const s = compileStylesheetLabelled(({ css }) => ({
    menuBar: css`
        display: flex;
        align-items: center;
        height: ${TOOLBAR_HEIGHT}px;
        background-color: #f5f5f5;
        user-select: none;
        position: relative;
        transition: background-color 0.2s;

        &:hover {
            background-color: #e8e8e8;
        }

        &.dragging {
            opacity: 0.5;
            background-color: #d9d9d9;
        }
    `,
    menuBarItem: css`
        display: flex;
        align-items: center;
        height: 100%;
        padding: 0 8px;
        position: relative;
    `
}));

// MenuBar component
export const MenuBar: React.FC<{
    areaId: string;
    areaType: string;
    areaState: any;
    style?: React.CSSProperties;
}> = ({ areaId, areaType, areaState, style }) => {
    const { getComponents } = useMenuBar(areaType, areaId, style);
    const components = getComponents();
    // Log de debug
    console.log('[MenuBar] props:', { areaId, areaType, areaState, style });
    console.log('[MenuBar] children components:', components);
    // Utiliser des sélecteurs individuels pour chaque action
    const setAreaToOpen = useAreaStore(state => state.setAreaToOpen);
    const updateAreaToOpenPosition = useAreaStore(state => state.updateAreaToOpenPosition);
    const finalizeAreaPlacement = useAreaStore(state => state.finalizeAreaPlacement);

    return (
        <div
            className={`${s('menuBar')} area-menu-bar`}
            style={{
                height: TOOLBAR_HEIGHT + 'px',
                ...style
            }}
        >
            {components.map((item, index) => {
                const Component = item.component;
                return (
                    <div
                        key={`${item.identifier.type}-${item.identifier.name}-${index}`}
                        className={s("menuBarItem")}
                        style={{ width: item.width }}
                    >
                        <Component
                            areaId={areaId}
                            areaState={areaState}
                        />
                    </div>
                );
            })}
        </div>
    );
}; 
