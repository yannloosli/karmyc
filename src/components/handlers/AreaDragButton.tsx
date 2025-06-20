import React, { createElement, useRef, useState } from "react";
import { AreaTypeValue } from "../../core/types/actions";
import { useKarmycStore } from "../../core/store";
import { TOOLBAR_HEIGHT } from "../../utils/constants";
import { areaRegistry } from "../../core/registries/areaRegistry";
import { useSpaceStore } from "../../core/spaceStore";
import { useAreaDragAndDrop } from "../../hooks/useAreaDragAndDrop";
import { CopyIcon, LockIcon, LockOpenIcon, XIcon, Maximize2Icon, Minimize2Icon } from "lucide-react";
import { SwitchAreaTypeContextMenu } from '../menus/SwitchAreaTypeContextMenu';
import { t } from "../../core/utils/translation";
import { useContextMenu } from "../../hooks/useContextMenu";

interface IAreaDragButton {
    state: any;
    type: AreaTypeValue;
    id: string;
    style?: React.CSSProperties;
}

export const AreaDragButton = ({ state, type, id, style }: IAreaDragButton) => {
    
    const [isDragging, setIsDragging] = useState(false);
    const updateArea = useKarmycStore(state => state.updateArea);
    const isLocked = useKarmycStore(state => state.getAreaById(id)?.isLocked || false);
    const manageableAreas = useKarmycStore(state => state.options?.manageableAreas ?? true);
    const area = useKarmycStore(state => state.getAreaById(id));
    const isFullscreen = area?.enableFullscreen ?? false;
    const supportsFullscreen = (areaRegistry as any)._supportFullscreenMap?.[type] ?? false;

    const {
        handleDragStart,
        handleDragOver,
        handleDrop,
        handleDragEnd
    } = useAreaDragAndDrop({ type, id, state });

    const { open } = useContextMenu();

    // Ref for the button
    const selectAreaButtonRef = useRef<HTMLDivElement>(null);
    // Ref for the parent element containing the area

    const openSelectArea = () => {
        if (!manageableAreas) return;
        if (selectAreaButtonRef.current) {
            const rect = selectAreaButtonRef.current.getBoundingClientRect();
            open({
                targetId: id,
                position: { x: rect.left, y: rect.top },
                items: <SwitchAreaTypeContextMenu />,
                menuClassName: 'context-menu switch-area-type-context-menu',
            });
        }
    };

    const space = useSpaceStore(state => state.getSpaceById(area?.spaceId || ''));

    // If FOLLOW, use the color from the last selected LEAD space
    let spaceColor = space?.color || '#0000ff';
    if (area?.role === 'FOLLOW') {
        const activeScreenId = useKarmycStore.getState().activeScreenId;
        const lastLeadAreaId = useKarmycStore.getState().screens[activeScreenId]?.areas.lastLeadAreaId;
        const allAreas = useKarmycStore.getState().screens[activeScreenId]?.areas.areas || {};
        const leadArea = lastLeadAreaId ? allAreas[lastLeadAreaId] : null;
        const leadSpaceId = leadArea?.spaceId;
        if (leadSpaceId) {
            const leadSpace = useSpaceStore.getState().spaces[leadSpaceId];
            if (leadSpace && leadSpace.color) {
                spaceColor = leadSpace.color;
            }
        }
    }

    const handleDetach = (e: React.MouseEvent) => {
        if (!manageableAreas) return;
        e.stopPropagation();
        useKarmycStore.getState().detachArea(id);
    };

    const handleClose = (e: React.MouseEvent) => {
        if (!manageableAreas) return;
        e.stopPropagation();
        useKarmycStore.getState().removeArea(id);
    };

    const handleToggleFullscreen = (e: React.MouseEvent) => {
        if (!manageableAreas) return;
        e.stopPropagation();

        // Find the parent element containing the area
        const areaContainer = document.querySelector(`[data-areaid="${id}"]`);
        if (!areaContainer) return;

        if (!isFullscreen) {
            // Save current state before going fullscreen
            const currentLayout = useKarmycStore.getState().screens[useKarmycStore.getState().activeScreenId]?.areas.layout;
            const currentRootId = useKarmycStore.getState().screens[useKarmycStore.getState().activeScreenId]?.areas.rootId;
            
            // Update area with previous state
            updateArea({ 
                id, 
                enableFullscreen: true,
                previousLayout: currentLayout,
                previousRootId: currentRootId
            });

            // Enter fullscreen mode
            if (areaContainer.requestFullscreen) {
                areaContainer.requestFullscreen();
            } else if ((areaContainer as any).webkitRequestFullscreen) {
                (areaContainer as any).webkitRequestFullscreen();
            } else if ((areaContainer as any).msRequestFullscreen) {
                (areaContainer as any).msRequestFullscreen();
            }

            // Add listener for fullscreen exit
            const handleFullscreenChange = () => {
                if (!document.fullscreenElement && 
                    !(document as any).webkitFullscreenElement && 
                    !(document as any).msFullscreenElement) {
                    // Update area
                    updateArea({ 
                        id, 
                        enableFullscreen: false,
                        previousLayout: undefined,
                        previousRootId: undefined
                    });
                    // Clean up listener
                    document.removeEventListener('fullscreenchange', handleFullscreenChange);
                    document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
                    document.removeEventListener('msfullscreenchange', handleFullscreenChange);
                }
            };

            document.addEventListener('fullscreenchange', handleFullscreenChange);
            document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.addEventListener('msfullscreenchange', handleFullscreenChange);
        } else {
            // Exit fullscreen mode
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if ((document as any).webkitExitFullscreen) {
                (document as any).webkitExitFullscreen();
            } else if ((document as any).msExitFullscreen) {
                (document as any).msExitFullscreen();
            }

            // Update area
            updateArea({ 
                id, 
                enableFullscreen: false,
                previousLayout: undefined,
                previousRootId: undefined
            });
        }
    };

    return (
        <div
            className="select-area-button"
            draggable={manageableAreas && !isLocked && !isFullscreen}
            title={t('area.drag', 'Move area')}
            onDragStart={e => {
                if (!manageableAreas || isFullscreen) return;
                setIsDragging(true);
                handleDragStart(e);
                // Completely disable the button during drag, asynchronously
                requestAnimationFrame(() => {
                    if (selectAreaButtonRef.current) {
                        selectAreaButtonRef.current.style.pointerEvents = 'none';
                        selectAreaButtonRef.current.style.opacity = '0.5';
                    }
                });
            }}
            onDragOver={e => {
                if (!manageableAreas || isFullscreen) return;
                handleDragOver(e);
            }}
            onDrop={e => {
                if (!manageableAreas || isFullscreen) return;
                if (!isDragging) {
                    handleDrop(e);
                }
            }}
            onDragEnd={() => {
                if (!manageableAreas || isFullscreen) return;
                setIsDragging(false);
                selectAreaButtonRef.current!.style.pointerEvents = 'auto';
                selectAreaButtonRef.current!.style.opacity = '1';
                handleDragEnd();
            }}
            onContextMenu={e => { 
                if (!manageableAreas || isFullscreen) return;
                e.preventDefault(); 
                openSelectArea(); 
            }}
            style={{
                cursor: !manageableAreas || isFullscreen ? 'default' : isLocked ? 'default' : isDragging ? 'grabbing' : 'grab',
                '--space-color': spaceColor,
                pointerEvents: 'auto',
                height: TOOLBAR_HEIGHT + 'px',
                ...style
            } as React.CSSProperties}
            ref={selectAreaButtonRef}
        >
            <div className="select-area-button__main">
                {createElement(areaRegistry.getIcon(type), { className: 'select-area-button__icon', style: { color: spaceColor } })}
                {areaRegistry.getDisplayName(type)}
            </div>
            <div className="select-area-button__action-icons">
                {manageableAreas && !isLocked &&
                    <>
                        <button
                            className="select-area-icons select-area-button__detach"
                            onClick={handleDetach}
                            title={t('area.detach', 'Detach area')}>
                            <CopyIcon />
                        </button>
                        <button
                            className="select-area-icons select-area-button__close"
                            onClick={handleClose}
                            title={t('area.close', 'Close area')}>
                            <XIcon />
                        </button>
                    </>
                }
                {manageableAreas &&
                    <>
                        {supportsFullscreen && (
                            <button
                                className="select-area-icons select-area-button__fullscreen"
                                onClick={handleToggleFullscreen}
                                title={t('area.fullscreen', 'Toggle fullscreen')}
                            >
                                {isFullscreen ? <Minimize2Icon /> : <Maximize2Icon />}
                            </button>
                        )}
                        <button
                            className={`select-area-icons select-area-button__lock-icon ${isLocked ? 'locked' : ''}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                updateArea({ id, isLocked: !isLocked });
                            }}
                            title={t('area.lock', 'Lock/Unlock area')}
                        >
                            {isLocked ? <LockIcon /> : <LockOpenIcon />}
                        </button>
                    </>
                }
            </div>
        </div>
    );
};

export default AreaDragButton;
