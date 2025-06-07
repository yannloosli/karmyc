import React, { Dispatch, SetStateAction, useRef, useMemo, useEffect } from "react";
import { handleAreaDragFromCorner } from "./handlers/areaDragFromCorner";
import { AreaErrorBoundary } from "./AreaErrorBoundary";
import { useToolsSlot, Tools } from '../../tools/components/ToolsSlot';
import { areaRegistry } from "../../core/data/registries/areaRegistry";
import { AreaTypeValue, AREA_ROLE } from "../../core/types";
import { TOOLBAR_HEIGHT } from "../../core/utils/constants";
import { useKarmycStore } from "../../core/data/areaStore";
import { AreaComponentProps, ResizePreviewState } from "../../core/types/areaTypes";
import { Rect } from "../../core/types";
import { AreaIdContext } from "../../core/utils/AreaIdContext";
import { useSpaceStore } from "../../spaces/spaceStore";
import { AreaStack } from "./AreaStack";
import { AreaDragButton } from "./handlers/AreaDragButton";
import { AreaRowLayout } from "../../core/types/areaTypes";

interface OwnProps {
    id: string;
    viewport: Rect;
}

interface AreaComponentOwnProps extends AreaComponentProps {
    setResizePreview: Dispatch<SetStateAction<ResizePreviewState | null>>;
    isChildOfStack: boolean;
}

export const AreaComponent: React.FC<AreaComponentOwnProps> = ({
    id,
    Component,
    state,
    type,
    viewport,
    raised,
    isChildOfStack = false,
    setResizePreview,
}) => {
    if (!viewport) {
        console.warn(`No viewport found for area ${id}, using default viewport`);
        viewport = {
            left: 0,
            top: 0,
            width: 100,
            height: 100
        };
    }

    const active = useKarmycStore(state => state.screens[state.activeScreenId]?.areas.activeAreaId === id);
    const setActiveArea = useKarmycStore(state => state.setActiveArea);
    const viewportRef = useRef<HTMLDivElement>(null);
    const area = useKarmycStore(state => state.getAreaById(id));
    const setActiveSpace = useSpaceStore(state => state.setActiveSpace);
    const activeSpaceId = useSpaceStore(state => state.activeSpaceId);
    const pilotMode = useSpaceStore(state => state.pilotMode);
    const spaces = useSpaceStore(state => state.spaces);
    const resizableAreas = useKarmycStore(state => state.options?.resizableAreas ?? true);
    const manageableAreas = useKarmycStore(state => state.options?.manageableAreas ?? true);

    // Effet pour mettre à jour les zones FOLLOW quand l'espace actif change
    useEffect(() => {
        if (activeSpaceId) {
            // En mode AUTO, les areas FOLLOW suivent toujours le LEAD
            if (pilotMode === 'AUTO' && area?.role === AREA_ROLE.FOLLOW) {
                const activeScreenId = useKarmycStore.getState().activeScreenId;
                const lastLeadAreaId = useKarmycStore.getState().screens[activeScreenId]?.areas.lastLeadAreaId;
                const allAreas = useKarmycStore.getState().screens[activeScreenId]?.areas.areas || {};
                const leadArea = lastLeadAreaId ? allAreas[lastLeadAreaId] : null;
                
                if (leadArea && leadArea.spaceId === activeSpaceId) {
                    setActiveArea(leadArea.id);
                }
            }
            // En mode MANUAL, toutes les areas suivent l'espace actif
            else if (pilotMode === 'MANUAL') {
                if (area?.spaceId !== activeSpaceId) {
                    useKarmycStore.getState().updateArea({ id, spaceId: activeSpaceId });
                }
            }
        }
    }, [activeSpaceId, area?.role, pilotMode]);

    const onActivate = () => {
        if (!active) {
            setActiveArea(id);
            // Si c'est une area LEAD, on met à jour l'espace actif seulement si on n'est pas en mode MANUAL
            if (area?.role === AREA_ROLE.LEAD && pilotMode !== 'MANUAL') {
                if (area.spaceId) {
                    setActiveSpace(area.spaceId);
                } else {
                    // Si pas d'espace défini, on utilise le dernier espace actif ou on en crée un nouveau
                    const existingSpaces = Object.keys(spaces);
                    if (existingSpaces.length > 0) {
                        // Utiliser le dernier espace actif ou le premier disponible
                        const spaceToUse = activeSpaceId || existingSpaces[0];
                        useKarmycStore.getState().updateArea({ id, spaceId: spaceToUse });
                        setActiveSpace(spaceToUse);
                    } else {
                        // Créer un nouvel espace seulement s'il n'y en a aucun
                        const newSpaceId = useSpaceStore.getState().addSpace({
                            name: `Space for ${area.type}`,
                            sharedState: {}
                        });
                        if (newSpaceId) {
                            useKarmycStore.getState().updateArea({ id, spaceId: newSpaceId });
                            setActiveSpace(newSpaceId);
                        }
                    }
                }
            }
        }
    };

    const activeScreenId = useKarmycStore((state) => state.activeScreenId);
    const isDetached = useKarmycStore((state) => state.screens[activeScreenId]?.isDetached) || false;

    return (
        <AreaIdContext.Provider value={id}>
            {(!isDetached && !isChildOfStack) && <AreaDragButton id={id} state={state} type={type} />}
            <Tools
                areaType={type}
                areaState={state}
                viewport={viewport}
            >
                <div
                    ref={viewportRef}
                    data-areaid={id}
                    className={`area ${raised ? 'area--raised' : ''}`}
                    style={{
                        width: '100%',
                        height: isDetached ? '100%' : `calc(${typeof viewport.height === 'string' ? viewport.height : viewport.height + 'px'} - ${TOOLBAR_HEIGHT}px)`,
                    }}
                    onClick={onActivate}
                >
                    {!isDetached && !isChildOfStack && resizableAreas && manageableAreas && ['ne', 'nw', 'se', 'sw'].map((dir) => (
                        <div
                            key={dir}
                            className={`area__corner area__corner--${dir}`}
                            onMouseDown={(e) => handleAreaDragFromCorner(e.nativeEvent, dir as 'ne', id, viewport, setResizePreview, () => { })}
                        />
                    ))}

                    <div
                        className={`area-main-content-wrapper ${type}`}
                        style={{
                            opacity: active ? 1 : 0.9,
                            height: '100%',
                        }}
                    >
                        <AreaErrorBoundary
                            component={Component}
                            areaId={id}
                            areaState={state}
                            type={type}
                            viewport={{
                                left: 0,
                                top: 0,
                                width: viewport.width,
                                height: viewport.height - (!isDetached ? TOOLBAR_HEIGHT : 0)
                            }}
                        />
                    </div>
                </div>
            </Tools>
        </AreaIdContext.Provider>
    );
};

interface AreaContainerProps extends OwnProps {
    setResizePreview: Dispatch<SetStateAction<ResizePreviewState | null>>;
}

export const Area: React.FC<AreaContainerProps> = React.memo(({ id, viewport, setResizePreview }) => {
    const areaData = useKarmycStore(state => state.getAreaById(id));
    const layoutData = useKarmycStore(state => state.screens[state.activeScreenId]?.areas.layout[id]);
    const allAreasData = useKarmycStore(state => state.screens[state.activeScreenId]?.areas.areas);
    const activeScreenId = useKarmycStore((state) => state.activeScreenId);
    const isDetached = useKarmycStore((state) => state.screens[activeScreenId]?.isDetached) || false;

    const isChildOfStack = useKarmycStore(state => {
        const activeScreenLayout = state.screens[state.activeScreenId]?.areas.layout;
        if (!activeScreenLayout) return false;

        for (const [, layoutItem] of Object.entries(activeScreenLayout)) {
            if (layoutItem.type === 'area_row' &&
                layoutItem.orientation === 'stack' &&
                layoutItem.areas.some(areaRef => areaRef.id === id)) {
                return true;
            }
        }
        return false;
    });

    const isLayoutRow = layoutData?.type === 'area_row';
    const rowLayout = isLayoutRow ? layoutData as AreaRowLayout : null;
    const isStack = isLayoutRow && rowLayout!.orientation === 'stack';
    const isHorizontalOrVerticalRow = isLayoutRow && !isStack;

    const Component = areaData?.type ? areaRegistry.getComponent(areaData.type) : null;

    let activeAreaIdForRender = id;
    let dataForRender = areaData;
    let componentForRender = Component;

    if (isStack) {
        if (rowLayout!.activeTabId) {
            activeAreaIdForRender = rowLayout!.activeTabId;
            dataForRender = allAreasData?.[activeAreaIdForRender];
            componentForRender = dataForRender?.type ? areaRegistry.getComponent(dataForRender.type) : null;
        } else {
            // Un stack sans activeTabId, AreaStack gérera l'affichage (peut-être un message vide)
            dataForRender = undefined;
            componentForRender = null;
        }
    }

    // Récupérer les toolbars du parent
    const { getComponents: getParentMenuComponents } = useToolsSlot(dataForRender?.type || '', 'top-outer');
    const { getComponents: getParentStatusComponents } = useToolsSlot(dataForRender?.type || '', 'bottom-outer');
    const parentMenuComponents = getParentMenuComponents();
    const parentStatusComponents = getParentStatusComponents();

    // Calculer les hauteurs des toolbars du parent
    const hasParentTopOuter = parentMenuComponents.length > 0;
    const hasParentBottomOuter = parentStatusComponents.length > 0;
    const parentTopOuterHeight = hasParentTopOuter ? TOOLBAR_HEIGHT : 0;
    const parentBottomOuterHeight = hasParentBottomOuter ? TOOLBAR_HEIGHT : 0;

    const adjustedViewport = useMemo(() => {
        // Si l'écran est détaché, ne pas ajuster le viewport
        if (isDetached) {
            return viewport;
        }
        const newViewport = {
            ...viewport,
            top: viewport.top,
            height: viewport.height - (parentTopOuterHeight + parentBottomOuterHeight)
        };
        
        return newViewport;
    }, [viewport, isDetached, parentTopOuterHeight, parentBottomOuterHeight, id]);

    const contentViewport = useMemo(() => ({
        left: 0,
        top: 0,
        width: viewport.width || 0,
        height: adjustedViewport.height || 0
    }), [viewport.width, adjustedViewport.height]);

    const containerStyle: React.CSSProperties = {
        position: 'absolute',
        left: `${viewport.left || 0}px`,
        top: isDetached ? '0px' : `${adjustedViewport.top || 0}px`,
        width: `${viewport.width || 0}px`,
        height: isDetached ? '100%' : `${viewport.height || 0}px`,
        boxSizing: 'border-box',
        overflow: 'hidden',
    };

    // Déplacer la condition de retour après tous les appels de hooks
    if (isChildOfStack && !isStack) {
        return null;
    }

    return (
        (!id.includes('row-') || isStack) && (id !== 'root') &&
        (<div
            className={"area-container " + id}
            style={containerStyle}
            data-areaid={id}
            data-areatype={isStack ? 'stack-row' : isHorizontalOrVerticalRow ? `${rowLayout?.orientation}-row` : areaData?.type || 'unknown-leaf'}
        >
            {isStack && rowLayout &&
                (<AreaStack
                    id={id}
                    areas={allAreasData}
                    layout={rowLayout}
                    viewport={contentViewport}
                    setResizePreview={setResizePreview}
                />)
            }
            {!isLayoutRow && componentForRender && dataForRender &&
                <AreaComponent
                    id={dataForRender.id}
                    Component={componentForRender}
                    state={dataForRender.state}
                    type={dataForRender.type as AreaTypeValue}
                    viewport={contentViewport}
                    raised={!!dataForRender.raised}
                    setResizePreview={setResizePreview}
                    isChildOfStack={false}
                />
            }
        </div>)
    );
}); 
