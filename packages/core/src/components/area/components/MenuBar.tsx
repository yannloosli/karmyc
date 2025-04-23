import React, { useCallback, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';

import { TOOLBAR_HEIGHT } from '@gamesberry/karmyc-core/constants';
import { areaSlice, finalizeAreaPlacement, updateAreaToOpenPosition } from '@gamesberry/karmyc-core/store/slices/areaSlice';
import { computeAreaToViewport } from '@gamesberry/karmyc-core/utils/areaToViewport';
import { getHoveredAreaId } from '@gamesberry/karmyc-core/utils/areaUtils';
import { getAreaRootViewport } from '@gamesberry/karmyc-core/utils/getAreaViewport';
import { requestAction } from '@gamesberry/karmyc-core/utils/requestAction';
import { getActionState } from '@gamesberry/karmyc-core/utils/stateUtils';
import { compileStylesheetLabelled } from '@gamesberry/karmyc-core/utils/stylesheets';
import { Vec2 } from '@gamesberry/karmyc-shared';

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
export const useMenuBar = (areaType: string, areaId: string) => {
    // Create a unique key for this type:id combination
    const registryKey = `${areaType}:${areaId}`;

    // Function to register a component
    const registerComponent = useCallback((
        component: React.ComponentType<any>,
        identifier: ComponentIdentifier,
        options: { order?: number; width?: string | number } = {}
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
            identifier
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
        border-bottom: 1px solid #e8e8e8;
        user-select: none;
        cursor: move;
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
}> = ({ areaId, areaType, areaState }) => {
    const { getComponents } = useMenuBar(areaType, areaId);
    const components = getComponents();
    const dispatch = useDispatch();
    const dragRef = useRef<{ startX: number; startY: number } | null>(null);
    const rafRef = useRef<number | undefined>(undefined);
    const isUpdatingRef = useRef<boolean>(false);

    const updatePosition = useCallback((x: number, y: number) => {
        if (!dragRef.current || isUpdatingRef.current) return;
        isUpdatingRef.current = true;

        rafRef.current = requestAnimationFrame(() => {
            if (!dragRef.current) return;
            const position = {
                x: x - dragRef.current.startX,
                y: y - dragRef.current.startY
            };
            dispatch(updateAreaToOpenPosition(position));
            isUpdatingRef.current = false;
        });
    }, [dispatch]);

    useEffect(() => {
        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, []);

    const handleDragStart = useCallback((e: React.DragEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        dragRef.current = {
            startX: e.clientX - rect.left,
            startY: e.clientY - rect.top
        };

        // Create an invisible drag image
        const dragImage = document.createElement('div');
        dragImage.style.cssText = `
            width: 1px;
            height: 1px;
            position: fixed;
            top: -1px;
            left: -1px;
            opacity: 0.01;
            pointer-events: none;
        `;
        document.body.appendChild(dragImage);

        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', JSON.stringify({
            type: 'menubar',
            areaType,
            areaId
        }));
        e.dataTransfer.setDragImage(dragImage, 0, 0);

        requestAnimationFrame(() => {
            document.body.removeChild(dragImage);
        });
    }, [areaType, areaId]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        updatePosition(e.clientX, e.clientY);
    }, [updatePosition]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!dragRef.current) return;

        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        if (data.type !== 'menubar') return;

        requestAction({}, (params) => {
            try {
                // Calculate final position
                const position = {
                    x: e.clientX - dragRef.current!.startX,
                    y: e.clientY - dragRef.current!.startY
                };

                // Get target area ID
                const currentState = getActionState().area;
                const areaToViewport = computeAreaToViewport(
                    currentState.layout,
                    currentState.rootId || '',
                    getAreaRootViewport()
                );
                const targetAreaId = getHoveredAreaId(Vec2.new(position.x, position.y), currentState, areaToViewport);

                if (targetAreaId && targetAreaId !== areaId) {
                    // If we have a different target area, move the menu bar
                    const targetViewport = areaToViewport[targetAreaId];
                    if (targetViewport) {
                        // Calculate new sizes for sibling areas
                        const parentRow = currentState.layout[targetAreaId];
                        if (parentRow && parentRow.type === 'area_row') {
                            const totalSize = parentRow.areas.reduce((acc: number, area: any) => acc + area.size, 0);
                            const newSize = totalSize / (parentRow.areas.length + 1);

                            // Update existing area sizes
                            const newSizes = parentRow.areas.map((area: any) => area.size * (1 - newSize / totalSize));
                            newSizes.push(newSize);

                            // Update layout
                            params.dispatch(areaSlice.actions.setRowSizes({
                                rowId: parentRow.id,
                                sizes: newSizes
                            }));
                        }
                    }
                }

                // Finalize area placement
                params.dispatch(finalizeAreaPlacement());

                // Clean up temporary states
                params.dispatch(areaSlice.actions.cleanupTemporaryStates());

                // Update viewports
                const viewports = computeAreaToViewport(
                    getActionState().area.layout,
                    getActionState().area.rootId || '',
                    getAreaRootViewport()
                );
                params.dispatch(areaSlice.actions.setViewports({ viewports }));

                params.submitAction("Move menubar");
            } catch (error) {
                console.error('Error during menubar drop:', error);
                params.dispatch(areaSlice.actions.cleanupTemporaryStates());
                params.cancelAction();
            }
        });

        dragRef.current = null;
    }, [dispatch, areaId, areaState]);

    return (
        <div
            className={`${s('menuBar')} area-menu-bar`}
            style={{
                height: TOOLBAR_HEIGHT + 'px',
            }}
            draggable
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
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
