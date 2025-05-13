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
    style?: React.CSSProperties;
}> = ({ areaId, areaType, areaState, style }) => {
    const { getComponents } = useMenuBar(areaType, areaId, style);
    const components = getComponents();
    // Utiliser des sélecteurs individuels pour chaque action
    const setAreaToOpen = useAreaStore(state => state.setAreaToOpen);
    const updateAreaToOpenPosition = useAreaStore(state => state.updateAreaToOpenPosition);
    const finalizeAreaPlacement = useAreaStore(state => state.finalizeAreaPlacement);

    // Ajouter les refs pour gérer le drag
    const dragRef = useRef<{ startX: number; startY: number } | null>(null);
    const rafRef = useRef<number | undefined>(undefined);
    const isUpdatingRef = useRef<boolean>(false);

    // Optimisation du updatePosition avec requestAnimationFrame
    const updatePosition = useCallback((x: number, y: number) => {
        if (!dragRef.current || isUpdatingRef.current) return;
        isUpdatingRef.current = true;

        rafRef.current = requestAnimationFrame(() => {
            if (!dragRef.current) return;
            const position = {
                x: x - dragRef.current.startX,
                y: y - dragRef.current.startY
            };
            updateAreaToOpenPosition(position);
            isUpdatingRef.current = false;
        });
    }, [updateAreaToOpenPosition]);

    // Nettoyage du RAF
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

        // --- Préparation des données et de l'image de drag (Synchrone) ---
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
        const transferData = JSON.stringify({
            type: 'menubar',
            areaType,
            areaId
        });
        e.dataTransfer.setData('text/plain', transferData);
        e.dataTransfer.setDragImage(dragImage, 0, 0);

        // --- Mise à jour de l'état (Asynchrone via rAF) ---
        const areaToOpenData = {
            position: { x: e.clientX, y: e.clientY },
            area: {
                type: areaType,
                state: { ...areaState, sourceId: areaId }
            }
        };

        requestAnimationFrame(() => {
            setAreaToOpen(areaToOpenData);
        });

        // --- Nettoyage de l'image de drag (Timeout) ---
        const dragImageTimeout = setTimeout(() => {
            if (document.body.contains(dragImage)) {
                document.body.removeChild(dragImage);
            }
        }, 50);
    }, [areaType, areaId, areaState, setAreaToOpen]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        // Ce handler sur MenuBar ne devrait pas être appelé souvent si on drag
        // hors de la barre elle-même, mais ajoutons un log au cas où.
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Explicitly check if dragRef.current is truly null/undefined
        if (!dragRef.current) {
            return;
        }

        let data;
        try {
            data = JSON.parse(e.dataTransfer.getData('text/plain'));
        } catch (error) {
            return;
        }

        // Prevent dropping onto self or invalid data type
        if (data.type !== 'menubar' || data.areaId === areaId) {
            return;
        }

        try {
            // Check again before accessing properties, just in case
            if (!dragRef.current) {
                console.error('[MenuBar] handleDrop - dragRef became null unexpectedly before use!');
                return;
            }
            const position = {
                x: e.clientX - dragRef.current.startX,
                y: e.clientY - dragRef.current.startY
            };

            updateAreaToOpenPosition({ x: e.clientX, y: e.clientY });
            finalizeAreaPlacement();
        } catch (error) {
            // Attempt cleanup even if processing failed
            try {
                const store = useAreaStore.getState();
                store.cleanupTemporaryStates();
            } catch (cleanupError) {
                console.error('[MenuBar] Error during cleanup after drop error:', cleanupError);
            }
            return;
        }

        // Null the ref ONLY on successful drop processing
        dragRef.current = null;
    }, [areaId, updateAreaToOpenPosition, finalizeAreaPlacement]);

    // Ajouter un handleDragEnd pour logger quand il se produit
    const handleDragEnd = useCallback((e: React.DragEvent) => {
        // Nettoyer le dragRef au cas où le drop n'aurait pas eu lieu
        if (dragRef.current) {
            dragRef.current = null;
            // Nettoyer l'état Zustand s'il existe toujours
            const store = useAreaStore.getState();
            if (store.areaToOpen) {
                store.cleanupTemporaryStates();
            }
        }
    }, []);

    return (
        <div
            className={`${s('menuBar')} area-menu-bar`}
            style={{
                height: TOOLBAR_HEIGHT + 'px',
                ...style
            }}
            draggable
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
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
