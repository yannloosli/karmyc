import React, { Dispatch, SetStateAction } from 'react';
import { css } from '@emotion/css';
import { IArea, AreaRowLayout } from '../types/areaTypes';
import { AreaTabs } from './AreaTabs';
import { AreaComponent } from './Area';
import { areaRegistry } from '../stores/registries/areaRegistry';
import { ResizePreviewState } from '../types/areaTypes';

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
            className={css`
                position: absolute;
                left: ${viewport.left}px;
                top: ${viewport.top}px;
                width: ${viewport.width}px;
                height: ${viewport.height}px;
                background: #1e1e1e;
                border: 1px solid #404040;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            `}
            data-areaid={id}
        >
            <AreaTabs
                rowId={layout.id}
                row={layout}
                areas={areas}
            />
            <div className={css`
                flex: 1;
                position: relative;
                overflow: hidden;
            `}>
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
                        height: viewport.height - 40 // Hauteur des onglets
                    }}
                    setResizePreview={setResizePreview}
                    raised={!!activeArea.raised}
                />
            </div>
        </div>
    );
}); 
