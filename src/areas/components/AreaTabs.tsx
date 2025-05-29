import React from 'react';
import { IArea, AreaRowLayout } from '../../core/types/areaTypes';
import { areaRegistry } from '../../core/data/registries/areaRegistry';
import { useKarmycStore } from '../../core/data/areaStore';
import { AreaDragButton } from './handlers/AreaDragButton';
import { AREA_TAB_HEIGHT } from '../../core/utils/constants';

interface AreaTabsProps {
    rowId: string;
    row: AreaRowLayout;
    areas: Record<string, IArea>;
}

export const AreaTabs: React.FC<AreaTabsProps> = React.memo(({ rowId, row, areas }) => {
    const updateLayout = useKarmycStore(state => state.updateLayout);
    const setActiveArea = useKarmycStore(state => state.setActiveArea);
    const removeArea = useKarmycStore(state => state.removeArea);
    const state = useKarmycStore(state => state.screens[state.activeScreenId]?.areas.areas);

    const handleTabClick = (areaId: string) => {
        setActiveArea(areaId);
        updateLayout({ id: rowId, activeTabId: areaId });
    };

    const handleTabClose = (e: React.MouseEvent, areaId: string) => {
        e.stopPropagation();
        removeArea(areaId);
    };

    // Drag & drop pour réorganiser les onglets
    const handleTabDragStart = (e: React.DragEvent, areaId: string) => {
        // Si le drag commence sur le bouton select-area-button, on ne fait rien
        // car c'est géré par useAreaDragAndDrop
        if (e.target instanceof HTMLElement && e.target.closest('.select-area-button')) {
            return;
        }
        
        e.dataTransfer.setData('text/plain', JSON.stringify({
            type: 'tab',
            areaId,
            sourceRowId: rowId
        }));
    };

    const handleTabDragOver = (e: React.DragEvent) => {
        // Si le drag est sur le bouton select-area-button, on ne fait rien
        if (e.target instanceof HTMLElement && e.target.closest('.select-area-button')) {
            return;
        }
        
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleTabDrop = (e: React.DragEvent, targetAreaId: string) => {
        // Si le drop est sur le bouton select-area-button, on ne fait rien
        if (e.target instanceof HTMLElement && e.target.closest('.select-area-button')) {
            return;
        }
        
        e.preventDefault();
        try {
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            if (data.type === 'tab' && data.sourceRowId === rowId) {
                const sourceIndex = row.areas.findIndex(a => a.id === data.areaId);
                const targetIndex = row.areas.findIndex(a => a.id === targetAreaId);
                if (sourceIndex !== -1 && targetIndex !== -1) {
                    const newAreas = [...row.areas];
                    const [movedArea] = newAreas.splice(sourceIndex, 1);
                    newAreas.splice(targetIndex, 0, movedArea);
                    updateLayout({ id: rowId, areas: newAreas });
                }
            }
        } catch (error) {
            console.error('Error handling tab drop:', error);
        }
    };

    return (
        <div className="area-tabs">
            {row.areas.map(({ id }) => {
                const area = areas[id];
                if (!area) return null;

                const displayName = areaRegistry.getDisplayName(area.type);
                const isActive = row.activeTabId === id;

                return (
                    <div
                        key={id}
                        className={`area-tab ${isActive ? 'area-tab--active' : ''}`}
                        onClick={() => handleTabClick(id)}
                        draggable
                        onDragStart={e => { console.log('[AreaTabs] NATIVE DRAGSTART', e); handleTabDragStart(e, id); }}
                        onDragOver={e => { console.log('[AreaTabs] NATIVE DRAGOVER', e); handleTabDragOver(e); }}
                        onDrop={e => { console.log('[AreaTabs] NATIVE DROP', e); handleTabDrop(e, id); }}
                        data-areaid={id}
                        style={{ height: AREA_TAB_HEIGHT }}
                    >
                        <AreaDragButton
                            id={id}
                            state={area.state}
                            type={area.type}
                        />
                        <span className="area-tab__title">
                            {displayName}
                        </span>
                        <button
                            className="area-tab__close-button"
                            onClick={(e) => handleTabClose(e, id)}
                        >
                            ×
                        </button>
                    </div>
                );
            })}
        </div>
    );
}); 
