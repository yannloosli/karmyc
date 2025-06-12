import React, { Dispatch, SetStateAction, useRef, useEffect } from "react";
import { handleAreaDragFromCorner } from "./handlers/areaDragFromCorner";
import { AreaErrorBoundary } from "./AreaErrorBoundary";
import { Tools } from './ToolsSlot';
import { AREA_ROLE } from "../types/actions";
import { TOOLBAR_HEIGHT } from "../utils/constants";
import { useKarmycStore } from "../store/areaStore";
import { AreaComponentProps, ResizePreviewState } from "../types/areaTypes";
import { AreaIdContext } from "../utils/AreaIdContext";
import { useSpaceStore } from "../store/spaceStore";
import { AreaDragButton } from "./handlers/AreaDragButton";

interface AreaComponentOwnProps extends AreaComponentProps {
    setResizePreview: Dispatch<SetStateAction<ResizePreviewState | null>>;
    isChildOfStack: boolean;
    nbOfLines?: number;
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
    nbOfLines = 1,
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
    const area = useKarmycStore(state => state.getAreaById(id));
    const setActiveSpace = useSpaceStore(state => state.setActiveSpace);
    const activeSpaceId = useSpaceStore(state => state.activeSpaceId);
    const pilotMode = useSpaceStore(state => state.pilotMode);
    const spaces = useSpaceStore(state => state.spaces);
    const resizableAreas = useKarmycStore(state => state.options?.resizableAreas ?? true);
    const manageableAreas = useKarmycStore(state => state.options?.manageableAreas ?? true);

    // Effet pour mettre à jour les zones FOLLOW quand l'espace actif change
    useEffect(() => {
        if (activeSpaceId) {
            // En mode AUTO, les areas FOLLOW suivent toujours le LEAD
            if (pilotMode === 'AUTO' && area?.role === AREA_ROLE.FOLLOW) {
                const activeScreenId = useKarmycStore.getState().activeScreenId;
                const lastLeadAreaId = useKarmycStore.getState().screens[activeScreenId]?.areas.lastLeadAreaId;
                const allAreas = useKarmycStore.getState().screens[activeScreenId]?.areas.areas || {};
                const leadArea = lastLeadAreaId ? allAreas[lastLeadAreaId] : null;
                
                if (leadArea && leadArea.spaceId === activeSpaceId) {
                    setActiveArea(leadArea.id);
                }
            }
            // En mode MANUAL, toutes les areas suivent l'espace actif
            else if (pilotMode === 'MANUAL') {
                if (area?.spaceId !== activeSpaceId) {
                    useKarmycStore.getState().updateArea({ id, spaceId: activeSpaceId });
                }
            }
        }
    }, [activeSpaceId, area?.role, pilotMode]);

    const onActivate = () => {
        if (!active) {
            setActiveArea(id);
            // Si c'est une area LEAD, on met à jour l'espace actif seulement si on n'est pas en mode MANUAL
            if (area?.role === AREA_ROLE.LEAD && pilotMode !== 'MANUAL') {
                if (area.spaceId) {
                    setActiveSpace(area.spaceId);
                } else {
                    // Si pas d'espace défini, on utilise le dernier espace actif ou on en crée un nouveau
                    const existingSpaces = Object.keys(spaces);
                    if (existingSpaces.length > 0) {
                        // Utiliser le dernier espace actif ou le premier disponible
                        const spaceToUse = activeSpaceId || existingSpaces[0];
                        useKarmycStore.getState().updateArea({ id, spaceId: spaceToUse });
                        setActiveSpace(spaceToUse);
                    } else {
                        // Créer un nouvel espace seulement s'il n'y en a aucun
                        const newSpaceId = useSpaceStore.getState().addSpace({
                            name: `Space for ${area.type}`,
                            sharedState: {}
                        });
                        if (newSpaceId) {
                            useKarmycStore.getState().updateArea({ id, spaceId: newSpaceId });
                            setActiveSpace(newSpaceId);
                        }
                    }
                }
            }
        }
    };

    const activeScreenId = useKarmycStore((state) => state.activeScreenId);
    const isDetached = useKarmycStore((state) => state.screens[activeScreenId]?.isDetached) || false;

    return (
        <AreaIdContext.Provider value={id}>
            {(!isDetached && !isChildOfStack) && <AreaDragButton id={id} state={state} type={type} />}
            <Tools
                areaId={id}
                areaType={type}
                areaState={state}
                viewport={viewport}
                nbOfLines={nbOfLines}
            >
                <div
                    ref={viewportRef}
                    data-areaid={id}
                    data-testid={`area-${id}`}
                    data-testid-resize-handle={`area-${id}-resize-handle`}
                    className={`area ${raised ? 'active' : ''}`}
                    style={{
                        width: '100%',
                       // height: isDetached || area?.enableFullscreen ? '100%' : `calc(${typeof viewport.height === 'string' ? viewport.height : viewport.height + 'px'} - ${TOOLBAR_HEIGHT}px)`,
                        height: '100%',
                    }}
                    onClick={onActivate}
                >
                    {!isDetached && !isChildOfStack && resizableAreas && manageableAreas && ['ne', 'nw', 'se', 'sw'].map((dir) => (
                        <div
                            key={dir}
                            className={`area__corner area__corner--${dir}`}
                            data-testid={`area-${id}-resize-handle`}
                            onMouseDown={(e) => handleAreaDragFromCorner(e.nativeEvent, dir as 'ne', id, viewport, setResizePreview, () => { })}
                        />
                    ))}

                    <div
                        className={`area-main-content-wrapper ${type}`}
                        data-areatype={type}
                        data-testid={`area-${id}-role-button`}
                        style={{
                            opacity: active ? 1 : 0.9,
                            height: '100%',
                            width: area?.enableFullscreen ? '100vw' : '100%',
                            top: area?.enableFullscreen ? 0 : 'auto',
                            left: area?.enableFullscreen ? 0 : 'auto',
                            zIndex: area?.enableFullscreen ? 9999 : 'auto',
                            overflow: 'hidden',
                        }}
                    >
                        {Component ? (
                            <AreaErrorBoundary
                                component={Component}
                                areaId={id}
                                areaState={state}
                                type={type}
                                viewport={{
                                    left: 0,
                                    top: 0,
                                    width: area?.enableFullscreen ? window.innerWidth : viewport.width,
                                    height: area?.enableFullscreen ? window.innerHeight : viewport.height - (!isDetached ? TOOLBAR_HEIGHT : 0)
                                }}
                            />
                        ) : (
                            <div
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    top: 0,
                                    width: area?.enableFullscreen ? window.innerWidth : viewport.width,
                                    height: area?.enableFullscreen ? window.innerHeight : viewport.height - (!isDetached ? TOOLBAR_HEIGHT : 0),
                                    backgroundColor: "#fff5f5",
                                    border: "1px solid #feb2b2",
                                    borderRadius: "4px",
                                    padding: "16px",
                                    color: "#c53030",
                                }}
                            >
                                <h3>Invalid area type: {type}</h3>
                                <p>This area type is not registered in the area registry.</p>
                            </div>
                        )}
                    </div>
                </div>
            </Tools>
        </AreaIdContext.Provider>
    );
}; 
