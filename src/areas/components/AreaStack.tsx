import React, { Dispatch, SetStateAction } from 'react';
import { IArea, AreaRowLayout } from '../../core/types/areaTypes';
import { AreaTabs } from './AreaTabs';
import { AreaComponent } from './Area';
import { areaRegistry } from '../../core/data/registries/areaRegistry';
import { ResizePreviewState } from '../../core/types/areaTypes';
import { AREA_TAB_HEIGHT } from '../../core/utils/constants';

interface AreaStackProps {
    id: string;
    layout: AreaRowLayout;
    areas: Record<string, IArea>;
    viewport: { left: number; top: number; width: number; height: number };
    setResizePreview: Dispatch<SetStateAction<ResizePreviewState | null>>;
}

export const AreaStack: React.FC<AreaStackProps> = React.memo(({ id, layout, areas, viewport, setResizePreview }) => {
    const activeAreaId = layout.activeTabId || layout.areas[0]?.id;
    const activeArea = activeAreaId ? areas[activeAreaId] : null;

    if (!activeArea) {
        return null;
    }

    const Component = areaRegistry.getComponent(activeArea.type);
    if (!Component) {
        return null;
    }

    return (
        <div
            className="area-stack"
            style={{
                left: viewport.left,
                top: viewport.top,
                width: viewport.width,
                height: viewport.height
            }}
            data-areaid={id}
        >
            <AreaTabs
                rowId={layout.id}
                row={layout}
                areas={areas}
            />
            <div className="area-stack__content">
                <AreaComponent
                    isChildOfStack={true}
                    id={activeAreaId}
                    Component={Component}
                    state={activeArea.state}
                    type={activeArea.type}
                    viewport={{
                        left: 0,
                        top: 0,
                        width: viewport.width,
                        height: viewport.height
                    }}
                    setResizePreview={setResizePreview}
                    raised={!!activeArea.raised}
                />
            </div>
        </div>
    );
}); 
