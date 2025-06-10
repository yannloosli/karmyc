import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { IArea, AreaRowLayout } from '../types/areaTypes';
import { AreaTabs } from './AreaTabs';
import { AreaComponent } from './Area';
import { areaRegistry } from '../store/registries/areaRegistry';
import { ResizePreviewState } from '../types/areaTypes';
import { TOOLBAR_HEIGHT } from '../utils/constants';

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
    const [isComponentReady, setIsComponentReady] = useState(false);

    useEffect(() => {
        if (activeArea?.type) {
            const checkComponent = () => {
                const component = areaRegistry.getComponent(activeArea.type);
                if (component) {
                    setIsComponentReady(true);
                } else {
                    // Si le composant n'est pas encore disponible, on réessaie après un court délai
                    setTimeout(checkComponent, 25);
                }
            };
            checkComponent();
        }
    }, [activeArea?.type]);

    const Component = activeArea?.type ? areaRegistry.getComponent(activeArea.type) : null;
    if (!Component || !isComponentReady) {
        return null;
    }

    return (
        <div
            className="area-stack"
            style={{
                left: viewport.left,
                top: viewport.top,
                width: viewport.width,
                height: viewport.height + TOOLBAR_HEIGHT
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
                    state={activeArea?.state}
                    type={activeArea?.type || ''}
                    viewport={{
                        left: 0,
                        top: 0,
                        width: viewport.width,
                        height: viewport.height
                    }}
                    setResizePreview={setResizePreview}
                    raised={!!activeArea?.raised}
                />
            </div>
        </div>
    );
}); 
