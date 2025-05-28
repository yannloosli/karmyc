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

    const area = useKarmycStore(state => state.getAreaById(id));
    const layout = useKarmycStore(state => state.screens[state.activeScreenId]?.areas.layout[id]);
    const areas = useKarmycStore(state => state.screens[state.activeScreenId]?.areas.areas);

    // Vérifier si c'est un stack
    const isStack = layout?.type === 'area_row' && layout.orientation === 'stack';

    // Vérifier si l'area est un enfant d'une stack
    const isChildOfStack = useKarmycStore(state => {
        const activeScreenLayout = state.screens[state.activeScreenId]?.areas.layout;
        if (!activeScreenLayout) return false;

        for (const [layoutId, layoutItem] of Object.entries(activeScreenLayout)) {
            if (layoutItem.type === 'area_row' &&
                layoutItem.orientation === 'stack' &&
                layoutItem.areas.some(area => area.id === id)) {
                return true;
            }
        }
        return false;
    });

    // Si c'est un stack, on continue même si l'area n'existe pas directement
    if (!area && !isStack) {
        console.warn(`Area ${id} not found`);
        return null;
    }

    const Component = area?.type ? areaRegistry.getComponent(area.type) : null;
    if (!Component && !isStack) {
        console.warn(`No component found for type ${area?.type || 'unknown'}`);
        return <div>Unsupported type: {area?.type || 'unknown'}</div>;
    }

    let activeAreaId = id;
    if (isStack && layout.activeTabId) {
        activeAreaId = layout.activeTabId;
    }
    const activeArea = activeAreaId ? areas?.[activeAreaId] : null;

    if (isStack && !activeArea) {
        console.warn(`Stack ${id} has no active area`);
        return null;
    }

    if (isChildOfStack && !isStack) {
        return null;
    }

    const TAB_BAR_HEIGHT = 32;
    const contentViewport = {
        left: 0,
        top: 0,
        width: viewport.width || 0,
        height: isStack ? (viewport.height || 0) - TAB_BAR_HEIGHT : (viewport.height || 0)
    };

    return (
        <div
            className="area-container"
            style={{
                left: `${viewport.left || 0}px`,
                top: `${viewport.top || 0}px`,
                width: `${viewport.width || 0}px`,
                height: `${viewport.height || 0}px`,
            }}
            data-areaid={id}
        >
            <div className="area-container__content">
                {isStack &&
                    (<AreaStack
                        id={activeAreaId}
                        areas={areas}
                        layout={layout}
                        viewport={contentViewport}
                        setResizePreview={setResizePreview}
                    />)
                }
                {!isStack && Component &&
                    <AreaComponent
                        id={activeAreaId}
                        Component={Component}
                        state={activeArea?.state || area?.state}
                        type={(activeArea?.type || area?.type || 'unknown') as AreaTypeValue}
                        viewport={contentViewport}
                        raised={!!area?.raised}
                        setResizePreview={setResizePreview}
                        isChildOfStack={isChildOfStack}
                    />
                }
            </div>
        </div>
    );
}); 
