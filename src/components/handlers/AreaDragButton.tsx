import { createElement, useRef, useState } from "react";
import { AreaTypeValue } from "../../types/actions";
import { useKarmycStore } from "../../store/areaStore";
import { useContextMenuStore } from "../../store/contextMenuStore";
import { TOOLBAR_HEIGHT } from "../../utils/constants";
import { areaRegistry } from "../../store/registries/areaRegistry";
import { useSpaceStore } from "../../store/spaceStore";
import useAreaDragAndDrop from "../../hooks/useAreaDragAndDrop";
import { CopyIcon, LockIcon, LockOpenIcon, XIcon, Maximize2Icon, Minimize2Icon } from "lucide-react";
import { SwitchAreaTypeContextMenu } from '../SwitchAreatypeContextMenu';

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
    const updateLayout = useKarmycStore(state => state.updateLayout);
    const rootId = useKarmycStore(state => state.screens[state.activeScreenId]?.areas.rootId);

    const {
        handleDragStart,
        handleDragOver,
        handleDrop,
        handleDragEnd
    } = useAreaDragAndDrop({ type, id, state });

    const openCustomContextMenu = useContextMenuStore((state) => state.openCustomContextMenu);

    // Ref pour le bouton
    const selectAreaButtonRef = useRef<HTMLDivElement>(null);
    // Ref pour l'élément parent qui contient l'area
    const areaContainerRef = useRef<HTMLDivElement>(null);

    const openSelectArea = (e: React.MouseEvent) => {
        if (!manageableAreas) return;
        if (selectAreaButtonRef.current) {
            const rect = selectAreaButtonRef.current.getBoundingClientRect();
            openCustomContextMenu({
                targetId: id,
                position: { x: rect.left, y: rect.top },
                component: (
                    <SwitchAreaTypeContextMenu />
                )
            });
        }
    };

    const space = useSpaceStore(state => state.getSpaceById(area?.spaceId || ''));

    // Si FOLLOW, on prend la couleur du space du dernier LEAD sélectionné
    let spaceColor = space?.sharedState?.color || '#0000ff';
    if (area?.role === 'FOLLOW') {
        const activeScreenId = useKarmycStore.getState().activeScreenId;
        const lastLeadAreaId = useKarmycStore.getState().screens[activeScreenId]?.areas.lastLeadAreaId;
        const allAreas = useKarmycStore.getState().screens[activeScreenId]?.areas.areas || {};
        const leadArea = lastLeadAreaId ? allAreas[lastLeadAreaId] : null;
        const leadSpaceId = leadArea?.spaceId;
        if (leadSpaceId) {
            const leadSpace = useSpaceStore.getState().spaces[leadSpaceId];
            if (leadSpace && leadSpace.sharedState?.color) {
                spaceColor = leadSpace.sharedState.color;
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

        // Trouver l'élément parent qui contient l'area
        const areaContainer = document.querySelector(`[data-areaid="${id}"]`);
        if (!areaContainer) return;

        if (!isFullscreen) {
            // Sauvegarder l'état actuel avant de passer en plein écran
            const currentLayout = useKarmycStore.getState().screens[useKarmycStore.getState().activeScreenId]?.areas.layout;
            const currentRootId = useKarmycStore.getState().screens[useKarmycStore.getState().activeScreenId]?.areas.rootId;
            
            // Mettre à jour l'area avec l'état précédent
            updateArea({ 
                id, 
                enableFullscreen: true,
                previousLayout: currentLayout,
                previousRootId: currentRootId
            });

            // Passer en mode plein écran
            if (areaContainer.requestFullscreen) {
                areaContainer.requestFullscreen();
            } else if ((areaContainer as any).webkitRequestFullscreen) {
                (areaContainer as any).webkitRequestFullscreen();
            } else if ((areaContainer as any).msRequestFullscreen) {
                (areaContainer as any).msRequestFullscreen();
            }

            // Ajouter un écouteur pour la sortie du mode plein écran
            const handleFullscreenChange = () => {
                if (!document.fullscreenElement && 
                    !(document as any).webkitFullscreenElement && 
                    !(document as any).msFullscreenElement) {
                    // Mettre à jour l'area
                    updateArea({ 
                        id, 
                        enableFullscreen: false,
                        previousLayout: undefined,
                        previousRootId: undefined
                    });
                    // Nettoyer l'écouteur
                    document.removeEventListener('fullscreenchange', handleFullscreenChange);
                    document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
                    document.removeEventListener('msfullscreenchange', handleFullscreenChange);
                }
            };

            document.addEventListener('fullscreenchange', handleFullscreenChange);
            document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.addEventListener('msfullscreenchange', handleFullscreenChange);
        } else {
            // Sortir du mode plein écran
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if ((document as any).webkitExitFullscreen) {
                (document as any).webkitExitFullscreen();
            } else if ((document as any).msExitFullscreen) {
                (document as any).msExitFullscreen();
            }

            // Mettre à jour l'area
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
            onDragStart={e => {
                if (!manageableAreas || isFullscreen) return;
                setIsDragging(true);
                handleDragStart(e);
                // Désactiver complètement le bouton pendant le drag, de manière asynchrone
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
            onDragEnd={e => {
                if (!manageableAreas || isFullscreen) return;
                setIsDragging(false);
                selectAreaButtonRef.current!.style.pointerEvents = 'auto';
                selectAreaButtonRef.current!.style.opacity = '1';
                handleDragEnd(e);
            }}
            onContextMenu={e => { 
                if (!manageableAreas || isFullscreen) return;
                e.preventDefault(); 
                openSelectArea(e); 
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
                            onClick={handleDetach}>
                            <CopyIcon />
                        </button>
                        <button
                            className="select-area-icons select-area-button__close"
                            onClick={handleClose}>
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
