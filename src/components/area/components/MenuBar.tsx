import React, { useCallback, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { TOOLBAR_HEIGHT } from '~/constants';
import { areaSlice, finalizeAreaPlacement, updateAreaToOpenPosition } from '~/store/slices/areaSlice';
import { computeAreaToViewport } from '~/utils/areaToViewport';
import { getHoveredAreaId } from '~/utils/areaUtils';
import { getAreaRootViewport } from '~/utils/getAreaViewport';
import { Vec2 } from '~/utils/math/vec2';
import { requestAction } from '~/utils/requestAction';
import { getActionState } from '~/utils/stateUtils';
import { compileStylesheetLabelled } from '~/utils/stylesheets';

// Type pour identifier un composant de manière unique
type ComponentIdentifier = {
    name: string;
    type: string;
};

// Registre des composants de la barre de menu
const menuBarComponentRegistry: Record<string, Array<{
    component: React.ComponentType<any>;
    order: number;
    width?: string | number;
    identifier: ComponentIdentifier;
}>> = {};

// Hook personnalisé pour la barre de menu
export const useMenuBar = (areaType: string, areaId: string) => {
    // Créer une clé unique pour cette combinaison type:id
    const registryKey = `${areaType}:${areaId}`;

    // Fonction pour enregistrer un composant
    const registerComponent = useCallback((
        component: React.ComponentType<any>,
        identifier: ComponentIdentifier,
        options: { order?: number; width?: string | number } = {}
    ) => {
        const { order = 0, width } = options;

        // Nettoyer les composants existants avant d'en ajouter de nouveaux
        if (!menuBarComponentRegistry[registryKey]) {
            menuBarComponentRegistry[registryKey] = [];
        } else {
            // On garde uniquement les composants avec un identifiant différent
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

        // Trier les composants par ordre
        menuBarComponentRegistry[registryKey].sort((a, b) => a.order - b.order);

        return id;
    }, [registryKey]);

    // Fonction pour récupérer les composants
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

// Composant MenuBar
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

        // Créer une image de drag invisible
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
                // Calculer la position finale
                const position = {
                    x: e.clientX - dragRef.current!.startX,
                    y: e.clientY - dragRef.current!.startY
                };

                // Récupérer l'ID de la zone cible
                const currentState = getActionState().area;
                const areaToViewport = computeAreaToViewport(
                    currentState.layout,
                    currentState.rootId || '',
                    getAreaRootViewport()
                );
                const targetAreaId = getHoveredAreaId(Vec2.new(position.x, position.y), currentState, areaToViewport);

                if (targetAreaId && targetAreaId !== areaId) {
                    // Si on a une zone cible différente, on déplace la barre de menu
                    const targetViewport = areaToViewport[targetAreaId];
                    if (targetViewport) {
                        // Calculer les nouvelles tailles pour les zones siblings
                        const parentRow = currentState.layout[targetAreaId];
                        if (parentRow && parentRow.type === 'area_row') {
                            const totalSize = parentRow.areas.reduce((acc: number, area: any) => acc + area.size, 0);
                            const newSize = totalSize / (parentRow.areas.length + 1);

                            // Mettre à jour les tailles des zones existantes
                            const newSizes = parentRow.areas.map((area: any) => area.size * (1 - newSize / totalSize));
                            newSizes.push(newSize);

                            // Mettre à jour le layout
                            params.dispatch(areaSlice.actions.setRowSizes({
                                rowId: parentRow.id,
                                sizes: newSizes
                            }));
                        }
                    }
                }

                // Finaliser le placement de la zone
                params.dispatch(finalizeAreaPlacement());

                // Nettoyer les états temporaires
                params.dispatch(areaSlice.actions.cleanupTemporaryStates());

                // Mettre à jour les viewports
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
