import React, { Dispatch, SetStateAction, useMemo } from "react";
import { useToolsSlot } from './ToolsSlot';
import { areaRegistry } from "../data/registries/areaRegistry";
import { AreaTypeValue } from "../types/actions";
import { TOOLBAR_HEIGHT } from "../utils/constants";
import { useKarmycStore } from "../data/mainStore";
import { ResizePreviewState } from "../types/areaTypes";
import { Rect } from "../types";
import { AreaStack } from "./AreaStack";
import { AreaRowLayout } from "../types/areaTypes";
import { AreaComponent } from "./AreaComponent";
import { useAreaStack } from "../hooks/useAreaStack";

interface OwnProps {
    id: string;
    viewport: Rect;
}

interface AreaContainerProps extends OwnProps {
    setResizePreview: Dispatch<SetStateAction<ResizePreviewState | null>>;
}

export const Area: React.FC<AreaContainerProps> = React.memo(({ id, viewport, setResizePreview }) => {
    const areaData = useKarmycStore(state => state.getAreaById(id));
    const layoutData = useKarmycStore(state => state.screens[state.activeScreenId]?.areas.layout[id]);
    const allAreasData = useKarmycStore(state => state.screens[state.activeScreenId]?.areas.areas);
    const activeScreenId = useKarmycStore((state) => state.activeScreenId);
    const isDetached = useKarmycStore((state) => state.screens[activeScreenId]?.isDetached) || false;
    const { isChildOfStack } = useAreaStack(id);

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

        // Ajuster le viewport en fonction des toolbars du parent
        return {
            ...viewport,
            top: viewport.top /* + parentTopOuterHeight */,
            height: viewport.height /* - parentTopOuterHeight - parentBottomOuterHeight */
        };
    }, [viewport, isDetached, parentTopOuterHeight, parentBottomOuterHeight]);

    const containerStyle = useMemo(() => ({
        position: 'absolute' as const,
        left: adjustedViewport.left,
        top: adjustedViewport.top,
        width: adjustedViewport.width,
        height: adjustedViewport.height,
        display: 'flex',
        flexDirection: isHorizontalOrVerticalRow 
            ? (rowLayout?.orientation === 'horizontal' ? 'row' : 'column') 
            : 'column' as 'row' | 'column',
    }), [adjustedViewport, isHorizontalOrVerticalRow, rowLayout?.orientation]);

    const contentViewport = useMemo(() => ({
        left: 0,
        top: 0,
        width: adjustedViewport.width,
        height: adjustedViewport.height
    }), [adjustedViewport]);

    return (
        (!id.includes('row-') || isStack) && (id !== 'root') &&
        (<div
            className={"area-container " + id}
            style={containerStyle}
            data-areaid={id}
            data-testid={`area-${id}`}
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
            {!isLayoutRow && !isChildOfStack && componentForRender && dataForRender &&
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
