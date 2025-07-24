import React, { Dispatch, SetStateAction, useMemo } from "react";
import { useToolsSlot } from './ToolsSlot';
import { areaRegistry } from "../core/registries/areaRegistry";
import { AreaTypeValue } from "../core/types/actions";
import { TOOLBAR_HEIGHT } from "../utils/constants";
import { useKarmycStore } from "../core/store";
import { ResizePreviewState } from "../types/areaTypes";
import { Rect } from "../types";
import { AreaStack } from "./AreaStack";
import { AreaRowLayout } from "../types/areaTypes";
import { AreaComponent } from "./AreaComponent";
import { useAreaStack } from "../hooks/useAreaStack";
import { useAreaById, useAreaLayoutById, useAllAreas, useActiveScreenId } from "../hooks/useAreaOptimized";

interface OwnProps {
    id: string;
    viewport: Rect;
}

interface AreaContainerProps extends OwnProps {
    setResizePreview: Dispatch<SetStateAction<ResizePreviewState | null>>;
}

export const Area: React.FC<AreaContainerProps> = React.memo(({ id, viewport, setResizePreview }) => {
    // Utilisation des hooks optimisés
    const areaData = useAreaById(id);
    const layoutData = useAreaLayoutById(id);
    const allAreasData = useAllAreas();
    const activeScreenId = useActiveScreenId();
    const isDetached = useKarmycStore((state) => state.screens[activeScreenId]?.isDetached) || false;
    const { isChildOfStack } = useAreaStack(id);

    const isLayoutRow = layoutData?.type === 'area_row';
    const rowLayout = isLayoutRow ? layoutData as AreaRowLayout : null;
    const isStack = isLayoutRow && rowLayout!.orientation === 'stack';
    const isHorizontalOrVerticalRow = isLayoutRow && !isStack;

    const Component = areaData?.type ? areaRegistry.getComponent(areaData.type) : null;

    let activeAreaIdForRender = id;
    let dataForRender: any = areaData;
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
    const { getComponents: getParentMenuComponents, getLines: getParentMenuLines } = useToolsSlot(dataForRender?.id || '', 'top-outer');
    const { getComponents: getParentStatusComponents, getLines: getParentStatusLines } = useToolsSlot(dataForRender?.id || '', 'bottom-outer');
    const parentMenuComponents = getParentMenuComponents();
    const parentStatusComponents = getParentStatusComponents();
    const parentMenuLines = getParentMenuLines();
    const parentStatusLines = getParentStatusLines();
    const { lastChildOfRow } = useAreaStack(id);

    // Calculer les hauteurs des toolbars du parent
    const hasParentTopOuter = parentMenuComponents.length > 0;
    const hasParentBottomOuter = parentStatusComponents.length > 0;
    const parentTopOuterHeight = hasParentTopOuter ? TOOLBAR_HEIGHT * parentMenuLines : 0;
    const parentBottomOuterHeight = hasParentBottomOuter ? TOOLBAR_HEIGHT * parentStatusLines : 0;
    
    // Ne rendre les toolbars outer que si c'est une area racine (pas un enfant de stack)
    const isRootArea = !isChildOfStack && id === 'root';
    const adjustedViewport = useMemo(() => {
        // Si l'écran est détaché, ne pas ajuster le viewport
        if (isDetached) {
            return viewport;
        }
        // Ajuster le viewport en fonction des toolbars du parent seulement si elles existent
        if (hasParentTopOuter || hasParentBottomOuter) {
            return {
                ...viewport,
                top: viewport.top + parentTopOuterHeight,
                height: viewport.height - parentTopOuterHeight - parentBottomOuterHeight
            };
        }
        return viewport;
    }, [viewport, isDetached, hasParentTopOuter, hasParentBottomOuter, parentTopOuterHeight, parentBottomOuterHeight]);

const containerStyle = useMemo(() => ({
    position: 'absolute' as const,
    left: adjustedViewport.left,
    top: adjustedViewport.top - (hasParentTopOuter ? parentTopOuterHeight : 0),
    width: adjustedViewport.width,
    height: adjustedViewport.height + (hasParentTopOuter ? parentTopOuterHeight : 0) + (hasParentBottomOuter ? parentBottomOuterHeight : 0),
    display: 'flex',
    flexDirection: isHorizontalOrVerticalRow
        ? (rowLayout?.orientation === 'horizontal' ? 'row' : 'column')
        : 'column' as 'row' | 'column',
}), [adjustedViewport, isHorizontalOrVerticalRow, rowLayout?.orientation, hasParentTopOuter, hasParentBottomOuter, parentTopOuterHeight, parentBottomOuterHeight]);

const hasStackContent = isStack && rowLayout && allAreasData;
const contentViewport = useMemo(() => ({
    left: 0,
    top: hasParentTopOuter && !hasStackContent ? parentTopOuterHeight : 0,
    width: adjustedViewport.width,
    height: adjustedViewport.height - (hasParentBottomOuter && !hasStackContent ? parentBottomOuterHeight : 0)
}), [adjustedViewport, hasParentTopOuter, hasParentBottomOuter, parentTopOuterHeight, parentBottomOuterHeight]);

const hasComponentContent = !isLayoutRow && !isChildOfStack && componentForRender && dataForRender;
const shouldRenderContainer = hasStackContent || hasComponentContent;

return (
    shouldRenderContainer &&
    (!id.includes('row-') || isStack) && (id !== 'root') &&
    (<div
        className={"area-container " + id}
        style={containerStyle}
        data-areaid={id}
        data-testid={`area-${id}`}
        data-areatype={isStack ? 'stack-row' : isHorizontalOrVerticalRow ? `${rowLayout?.orientation}-row` : areaData?.type || 'unknown-leaf'}
    >
        {isRootArea && hasParentTopOuter && (
            <div
                className="tools-bar tools-bar-top-outer"
                style={{
                    height: parentTopOuterHeight,
                    position: 'absolute',
                    top: -parentTopOuterHeight,
                    left: 0,
                    right: 0,
                    zIndex: 10
                }}
            >
                {parentMenuComponents.map((item, idx) => {
                    const Component = item.component;
                    return (
                        <Component
                            key={`${item.identifier.type}-${item.identifier.name}-${idx}`}
                            areaState={dataForRender?.state}
                        />
                    );
                })}
            </div>
        )}
        
        {isRootArea && hasParentBottomOuter && (
            <div
                className="tools-bar tools-bar-bottom-outer"
                style={{
                    height: parentBottomOuterHeight,
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 10
                }}
            >
                {parentStatusComponents.map((item, idx) => {
                    const Component = item.component;
                    return (
                        <Component
                            key={`${item.identifier.type}-${item.identifier.name}-${idx}`}
                            areaState={dataForRender?.state}
                        />
                    );
                })}
            </div>
        )}
        
        {hasStackContent &&
            (<AreaStack
                id={id}
                areas={allAreasData}
                layout={rowLayout}
                viewport={contentViewport}
                setResizePreview={setResizePreview}
            />)
        }
        {componentForRender && hasComponentContent &&
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
