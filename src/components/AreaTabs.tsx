import React from 'react';
import { css } from '@emotion/css';
import { IArea, AreaRowLayout } from '../types/areaTypes';
import { areaRegistry } from '../stores/registries/areaRegistry';
import { useKarmycStore } from '../stores/areaStore';
import { AreaDragButton } from './handlers/AreaDragButton';

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

    console.log('AREA TABS', row);
    return (
        <div className={css`
            display: flex;
            background: #2d2d2d;
            padding: 4px 4px 0;
            gap: 2px;
            border-bottom: 1px solid #404040;
            height: 32px;
            min-height: 32px;
            max-height: 32px;
        `}>
            {row.areas.map(({ id }) => {
                const area = areas[id];
                if (!area) return null;

                const displayName = areaRegistry.getDisplayName(area.type);
                const isActive = row.activeTabId === id;

                return (
                    <div
                        key={id}
                        className={css`
                            display: flex;
                            align-items: center;
                            padding: 0 12px 0 0 ;
                            background: ${isActive ? '#404040' : 'transparent'};
                            color: ${isActive ? '#fff' : '#aaa'};
                            border-radius: 0 6px 0 0;
                            cursor: pointer;
                            user-select: none;
                            gap: 8px;
                            min-width: 100px;
                            max-width: 200px;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            white-space: nowrap;

                            &:hover {
                                background: ${isActive ? '#404040' : '#353535'};
                            }
                        `}
                        onClick={() => handleTabClick(id)}
                        draggable
                        onDragStart={e => { console.log('[AreaTabs] NATIVE DRAGSTART', e); handleTabDragStart(e, id); }}
                        onDragOver={e => { console.log('[AreaTabs] NATIVE DRAGOVER', e); handleTabDragOver(e); }}
                        onDrop={e => { console.log('[AreaTabs] NATIVE DROP', e); handleTabDrop(e, id); }}
                        data-areaid={id}
                    >
                        <AreaDragButton
                            id={id}
                            state={area.state}
                            type={area.type}
                            style={{
                                position: 'relative',
                                width: 10,
                                height: '100%',
                                borderRadius: '0',
                                border: 'none',
                                top: 'unset',
                                right: 'unset',
                                padding: '0',
                            }}
                        />
                        <span className={css`
                            flex: 1;
                            overflow: hidden;
                            text-overflow: ellipsis;
                        `}>
                            {displayName}
                        </span>
                        <button
                            className={css`
                                background: none;
                                border: none;
                                color: #aaa;
                                padding: 2px;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                border-radius: 4px;

                                &:hover {
                                    background: #505050;
                                    color: #fff;
                                }
                            `}
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
