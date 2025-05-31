import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
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
                setKeyboardViewport({
                    left: rect.left,
                    top: rect.top,
                    width: rect.width,
                    height: rect.height
                });
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
            // Logique LEAD/FOLLOW/SELF
            if (area?.role === AREA_ROLE.LEAD && area.spaceId) {
                setActiveSpace(area.spaceId);
            }
            // FOLLOW : rien à faire ici, la logique d'action doit utiliser le space actif global
            // SELF : rien à faire
        }
    };

    // --- Remplacement des hooks par useToolsSlot ---
    const { getComponents: getMenuComponents } = useToolsSlot(type, id, 'top-outside');
    const { getComponents: getStatusComponents } = useToolsSlot(type, id, 'bottom-outside');
    const { getComponents: getToolbarTopInside } = useToolsSlot(type, id, 'top-inside');
    const { getComponents: getToolbarBottomInside } = useToolsSlot(type, id, 'bottom-inside');
    const menuComponents = getMenuComponents();
    const statusComponents = getStatusComponents();
    const toolbarTopInsideComponents = getToolbarTopInside();
    const toolbarBottomInsideComponents = getToolbarBottomInside();

    const activeScreenId = useKarmycStore((state) => state.activeScreenId);
    const isDetached = useKarmycStore((state) => state.screens[activeScreenId]?.isDetached);

    // Nouvelle logique avec Tools
    const shouldRenderMenubar = menuComponents.length > 0;
    const shouldRenderStatusbar = statusComponents.length > 0;
    const shouldRenderToolbarTopInside = toolbarTopInsideComponents.length > 0;
    const shouldRenderToolbarBottomInside = toolbarBottomInsideComponents.length > 0;

    // Calculer la hauteur disponible pour le contenu
    const menubarHeight = shouldRenderMenubar ? TOOLBAR_HEIGHT : 0;
    const statusbarHeight = shouldRenderStatusbar ? TOOLBAR_HEIGHT : 0;
    const contentAvailableHeight = Math.max(0, viewport.height - menubarHeight - statusbarHeight);

    // --- Logique de drag pour le bouton de sélection de type d'area ---
    const rafRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, []);

    // Préparation des variables de debug pour FOLLOW
    let lastLeadAreaId = null;
    let leadArea = null;
    let leadSpaceId = null;
    let leadSpaceColor = null;
    if (area?.role === 'FOLLOW') {
        const activeScreenId = useKarmycStore.getState().activeScreenId;
        lastLeadAreaId = useKarmycStore.getState().screens[activeScreenId]?.areas.lastLeadAreaId;
        const allAreas = useKarmycStore.getState().screens[activeScreenId]?.areas.areas || {};
        leadArea = lastLeadAreaId ? allAreas[lastLeadAreaId] : null;
        leadSpaceId = leadArea?.spaceId;
        if (leadSpaceId) {
            const leadSpace = useSpaceStore.getState().spaces[leadSpaceId];
            leadSpaceColor = leadSpace?.sharedState?.color;
        }
    }

    return (
        <AreaIdContext.Provider value={id}>
            <div
                ref={viewportRef}
                data-areaid={id}
                className={`area ${raised ? 'area--raised' : ''}`}
                style={{
                    left: viewport.left,
                    top: viewport.top,
                    width: viewport.width,
                    height: viewport.height,
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

                {shouldRenderMenubar && <Tools
                    areaId={id}
                    areaType={type}
                    areaState={state}
                    position="top-outside"
                    style={{ height: TOOLBAR_HEIGHT, minHeight: TOOLBAR_HEIGHT }}
                />}

                <div
                    className={`area-main-content-wrapper ${type}`}
                    style={{ 
                        opacity: active ? 1 : 0.8,
                        height: contentAvailableHeight
                    }}
                >
                    {shouldRenderToolbarTopInside && <Tools
                        areaId={id}
                        areaType={type}
                        areaState={state}
                        position="top-inside"
                        style={{ height: TOOLBAR_HEIGHT, minHeight: TOOLBAR_HEIGHT }}
                    />}
                    <AreaErrorBoundary
                        component={Component}
                        areaId={id}
                        areaState={state}
                        type={type}
                        viewport={{
                            left: 0,
                            top: 0,
                            width: viewport.width,
                            height: contentAvailableHeight
                        }}
                    />
                    {shouldRenderToolbarBottomInside && <Tools
                        areaId={id}
                        areaType={type}
                        areaState={state}
                        position="bottom-inside"
                        style={{ height: TOOLBAR_HEIGHT, minHeight: TOOLBAR_HEIGHT }}
                    />}
                </div>

                {shouldRenderStatusbar && <Tools
                    areaId={id}
                    areaType={type}
                    areaState={state}
                    position="bottom-outside"
                    style={{ height: TOOLBAR_HEIGHT, minHeight: TOOLBAR_HEIGHT }}
                />}
            </div>
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
    const allViewports = useKarmycStore(state => state.screens[state.activeScreenId]?.areas.viewports);

    
    
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

    if (isChildOfStack && !isStack) {
        return null; 
    }


    const contentViewport = {
        left: 0,
        top: 0,
        width: viewport.width || 0,
        height: viewport.height || 0
    };
    
    const containerStyle: React.CSSProperties = {
        position: 'absolute',
        left: `${viewport.left || 0}px`,
        top: `${viewport.top || 0}px`,
        width: `${viewport.width || 0}px`,
        height: `${viewport.height || 0}px`,
        boxSizing: 'border-box',
        overflow: 'hidden', // Empêche les enfants de déborder visuellement du viewport assigné
    };


    return (
        (!id.includes('row-') || isStack) &&
        (<div
            className={"area-container " + id}
            style={containerStyle}
            data-areaid={id}
            data-areatype={isStack ? 'stack-row' : isHorizontalOrVerticalRow ? `${rowLayout?.orientation}-row` : areaData?.type || 'unknown-leaf'}
        >
            <div className="area-container__content">
                {isStack && rowLayout &&
                    (<AreaStack // Pour les lignes de type 'stack'
                        id={id} // L'ID du stack lui-même
                        areas={allAreasData} // Toutes les données d'area pour trouver les enfants
                        layout={rowLayout}   // Le layout du stack
                        viewport={contentViewport} // Le viewport interne pour le contenu du stack
                        setResizePreview={setResizePreview}
                    />)
                }
                {!isLayoutRow && componentForRender && dataForRender && // Pour les areas de données (feuilles)
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
              {/*   {((isHorizontalOrVerticalRow && rowLayout) || (id === 'root')) &&  // Pour les lignes horizontales ou verticales
                    (() => {
                        return rowLayout?.areas.map((childAreaRef) => {
                            const childId = childAreaRef.id;
                            const childActualViewport = allViewports?.[childId];

                            if (!childActualViewport) {
                                loggingEnabled && console.warn(`[Area.tsx] Viewport for child '${childId}' of H/V row '${id}' not found in allViewports map. Rendering placeholder.`);
                                return <div key={childId} style={{ position: 'absolute', border: '1px dashed red', color: 'red', padding: '5px', width: '100%', height: '100%', boxSizing: 'border-box' }}>Placeholder: Viewport for {childId} missing</div>;
                            }
                            
                            return (
                                <Area 
                                    key={childId}
                                    id={childId}
                                    viewport={childActualViewport}
                                    setResizePreview={setResizePreview}
                                />
                            );
                        });
                    })()
                } */}
            </div>
        </div>)
    );
}); 
