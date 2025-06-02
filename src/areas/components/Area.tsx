import React, { Dispatch, SetStateAction, useEffect, useRef, useState, useMemo } from "react";
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
import { useSpaceStore } from "../../core/data/spaceStore";
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
    const [keyboardViewport, setKeyboardViewport] = useState<Rect>({ left: 0, top: 0, width: 0, height: 0 });

    const area = useKarmycStore(state => state.getAreaById(id));

    const setActiveSpace = useSpaceStore(state => state.setActiveSpace);

    useEffect(() => {
        const updateViewport = () => {
            if (viewportRef.current) {
                const rect = viewportRef.current.getBoundingClientRect();
                const newViewport = {
                    left: rect.left,
                    top: rect.top,
                    width: rect.width,
                    height: rect.height
                };
                
                // Ne mettre à jour que si les dimensions ont réellement changé
                if (newViewport.width !== keyboardViewport.width || 
                    newViewport.height !== keyboardViewport.height ||
                    newViewport.left !== keyboardViewport.left ||
                    newViewport.top !== keyboardViewport.top) {
                    setKeyboardViewport(newViewport);
                }
            }
        };
        updateViewport();
        const resizeObserver = new ResizeObserver(updateViewport);
        if (viewportRef.current) {
            resizeObserver.observe(viewportRef.current);
        }
        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    const onActivate = () => {
        if (!active) {
            setActiveArea(id);
            if (area?.role === AREA_ROLE.LEAD && area.spaceId) {
                setActiveSpace(area.spaceId);
            }
        }
    };

    const activeScreenId = useKarmycStore((state) => state.activeScreenId);
    const isDetached = useKarmycStore((state) => state.screens[activeScreenId]?.isDetached);

    return (
        <AreaIdContext.Provider value={id}>
            <Tools
                areaId={id}
                areaType={type}
                areaState={state}
                style={{
                    position: 'absolute',
                    left: viewport.left,
                    top: viewport.top,
                    width: viewport.width,
                    height: viewport.height,
                }}
            >
                <div
                    ref={viewportRef}
                    data-areaid={id}
                    className={`area ${raised ? 'area--raised' : ''}`}
                    style={{
                        width: '100%',
                        height: '100%',
                    }}
                    onClick={onActivate}
                >
                    {!isDetached && !isChildOfStack && ['ne', 'nw', 'se', 'sw'].map((dir) => (
                        <div
                            key={dir}
                            className={`area__corner area__corner--${dir}`}
                            onMouseDown={(e) => handleAreaDragFromCorner(e.nativeEvent, dir as 'ne', id, viewport, setResizePreview, () => { })}
                        />
                    ))}

                    {(!isDetached && !isChildOfStack) && <AreaDragButton id={id} state={state} type={type} />}

                    <div
                        className={`area-main-content-wrapper ${type}`}
                        style={{
                            opacity: active ? 1 : 0.8,
                            height: `calc(100% - ${TOOLBAR_HEIGHT}px)`,
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
    const loggingEnabled = useKarmycStore(state => state.options?.enableLogging);
    const activeScreenId = useKarmycStore((state) => state.activeScreenId);
    const isDetached = useKarmycStore((state) => state.screens[activeScreenId]?.isDetached);

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
        // Si même après avoir cherché l'activeTabId, on ne trouve rien pour un stack (ce qui serait étrange pour un activeTabId valide)
        if (rowLayout!.activeTabId && (!dataForRender || !componentForRender)) {
            loggingEnabled && console.warn(`[Area.tsx] Stack '${id}': Active tab '${rowLayout!.activeTabId}' missing data or component.`);
        }
    }

    // Récupérer les toolbars du parent
    const { getComponents: getParentMenuComponents } = useToolsSlot(dataForRender?.type || '', id, 'top-outer');
    const { getComponents: getParentStatusComponents } = useToolsSlot(dataForRender?.type || '', id, 'bottom-outer');
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
        return {
            ...viewport,
            top: viewport.top + parentTopOuterHeight,
            height: viewport.height - (parentTopOuterHeight + parentBottomOuterHeight)
        };
    }, [viewport, isDetached, parentTopOuterHeight, parentBottomOuterHeight]);

    const contentViewport = useMemo(() => ({
        left: 0,
        top: 0,
        width: viewport.width || 0,
        height: adjustedViewport.height || 0
    }), [viewport.width, adjustedViewport.height]);

    const containerStyle: React.CSSProperties = {
        position: 'absolute',
        left: `${viewport.left || 0}px`,
        top: `${adjustedViewport.top || 0}px`,
        width: `${viewport.width || 0}px`,
        height: `${adjustedViewport.height || 0}px`,
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
