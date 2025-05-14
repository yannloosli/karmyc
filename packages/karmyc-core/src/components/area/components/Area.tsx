import { Vec2 } from "@gamesberry/karmyc-shared";
import React, { Dispatch, SetStateAction, useEffect, useRef, useState, useCallback } from "react";
import { PenIcon } from "../../icons/PenIcon";
import { handleAreaDragFromCorner } from "../handlers/areaDragFromCorner";
import { useAreaContextMenu } from '../hooks/useAreaContextMenu';
import { AreaErrorBoundary } from "./AreaErrorBoundary";
import { MenuBar, useMenuBar } from './MenuBar';
import { areaRegistry } from "../../../area/registry";
import { AreaTypeValue, TOOLBAR_HEIGHT } from "../../../constants";
import { useKarmycStore } from "../../../stores/areaStore";
import { useContextMenuStore } from "../../../stores/contextMenuStore";
import styles from "../../../styles/Area.styles";
import { AreaComponentProps, ResizePreviewState } from "../../../types/areaTypes";
import { Rect } from "../../../types/geometry";
import { AreaIdContext } from "../../../utils/AreaIdContext";
import { compileStylesheetLabelled } from "../../../utils/stylesheets";
import { StatusBar, useStatusBar } from './StatusBar';
import { Toolbar } from './Toolbar';
import { useSpaceStore } from "../../../stores/spaceStore";

const s = compileStylesheetLabelled(styles);

interface OwnProps {
    id: string;
    viewport: Rect;
}

interface StateProps {
    state: any;
    type: AreaTypeValue;
    raised: boolean;
    Component: React.ComponentType<AreaComponentProps<any>>;
}

interface AreaComponentOwnProps extends AreaComponentProps {
    setResizePreview: Dispatch<SetStateAction<ResizePreviewState | null>>;
}

export const AreaComponent: React.FC<AreaComponentOwnProps> = ({
    id,
    Component,
    state,
    type,
    viewport,
    raised,
    setResizePreview,
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
    const contextMenuItems = useAreaContextMenu(id);
    const openContextMenuAction = useContextMenuStore((state) => state.openContextMenu);

    const openSelectArea = (_: React.MouseEvent) => {
        const pos = Vec2.new(viewport.left + 4, viewport.top + 4);
        openContextMenuAction({
            position: { x: pos.x, y: pos.y },
            items: contextMenuItems,
            metadata: { areaId: id }
        });
    };

    const viewportRef = useRef<HTMLDivElement>(null);
    const [keyboardViewport, setKeyboardViewport] = useState<Rect>({ left: 0, top: 0, width: 0, height: 0 });

    const area = useKarmycStore(state => state.getAreaById(id));
    const space = useSpaceStore(state => state.getSpaceById(area?.spaceId || ''));
    const spaceColor = space?.sharedState?.color || '#0000ff';

    useEffect(() => {
        const updateViewport = () => {
            if (viewportRef.current) {
                const rect = viewportRef.current.getBoundingClientRect();
                setKeyboardViewport({
                    left: rect.left,
                    top: rect.top,
                    width: rect.width,
                    height: rect.height
                });
            }
        };
        updateViewport();
        const resizeObserver = new ResizeObserver(updateViewport);
        if (viewportRef.current) {
            resizeObserver.observe(viewportRef.current);
        }
        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    const onActivate = () => {
        if (!active) {
            setActiveArea(id);
        }
    };

    const { getComponents: getMenuComponents } = useMenuBar(type, id);
    const { getComponents: getStatusComponents } = useStatusBar(type, id);
    const menuComponents = getMenuComponents();
    const statusComponents = getStatusComponents();

    const shouldRenderMenubar = menuComponents.length > 0;
    const shouldRenderStatusbar = statusComponents.length > 0;

    // Calculer la hauteur disponible pour le contenu
    const menubarHeight = shouldRenderMenubar ? TOOLBAR_HEIGHT : 0;
    const statusbarHeight = shouldRenderStatusbar ? TOOLBAR_HEIGHT : 0;
    const contentAvailableHeight = Math.max(0, viewport.height - menubarHeight - statusbarHeight);

    // --- Logique de drag pour le bouton de sélection de type d'area ---
    const dragRef = useRef<{ startX: number; startY: number } | null>(null);
    const rafRef = useRef<number | undefined>(undefined);
    const isUpdatingRef = useRef<boolean>(false);
    const setAreaToOpen = useKarmycStore(state => state.setAreaToOpen);
    const updateAreaToOpenPosition = useKarmycStore(state => state.updateAreaToOpenPosition);
    const finalizeAreaPlacement = useKarmycStore(state => state.finalizeAreaPlacement);

    useEffect(() => {
        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, []);

    const handleDragStart = useCallback((e: React.DragEvent) => {
        // Empêcher la sélection de texte pendant le drag
        document.body.style.userSelect = 'none';
        const rect = e.currentTarget.getBoundingClientRect();
        dragRef.current = {
            startX: e.clientX - rect.left,
            startY: e.clientY - rect.top
        };
        const dragImage = document.createElement('div');
        dragImage.style.cssText = `
            width: 1px;
            height: 1px;
            position: fixed;
            top: -1px;
            left: -1px;
            opacity: 0.01;
            pointer-events: none;
        `;
        document.body.appendChild(dragImage);
        e.dataTransfer.effectAllowed = 'move';
        const transferData = JSON.stringify({
            type: 'menubar',
            areaType: type,
            areaId: id
        });
        e.dataTransfer.setData('text/plain', transferData);
        e.dataTransfer.setDragImage(dragImage, 0, 0);
        const areaToOpenData = {
            position: { x: e.clientX, y: e.clientY },
            area: {
                type: type,
                state: { ...state, sourceId: id }
            }
        };
        requestAnimationFrame(() => {
            setAreaToOpen(areaToOpenData);
        });
        setTimeout(() => {
            if (document.body.contains(dragImage)) {
                document.body.removeChild(dragImage);
            }
        }, 50);
    }, [type, id, state, setAreaToOpen]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!dragRef.current) return;
        let data;
        try {
            data = JSON.parse(e.dataTransfer.getData('text/plain'));
        } catch (error) {
            return;
        }
        if (data.type !== 'menubar' || data.areaId === id) return;
        try {
            if (!dragRef.current) return;
            updateAreaToOpenPosition({ x: e.clientX, y: e.clientY });
            finalizeAreaPlacement();
        } catch (error) {
            try {
                const store = useKarmycStore.getState();
                store.cleanupTemporaryStates();
            } catch (cleanupError) {
                console.error('[Area] Error during cleanup after drop error:', cleanupError);
            }
            return;
        }
        dragRef.current = null;
    }, [id, updateAreaToOpenPosition, finalizeAreaPlacement]);

    const handleDragEnd = useCallback((e: React.DragEvent) => {
        // Réactiver la sélection de texte à la fin du drag
        document.body.style.userSelect = '';
        if (dragRef.current) {
            dragRef.current = null;
            const store = useKarmycStore.getState();
            if (store.areaToOpen) {
                store.cleanupTemporaryStates();
            }
        }
    }, []);

    return (
        <div
            ref={viewportRef}
            data-areaid={id}
            className={s("area", { raised: !!raised, active })}
            style={{
                ...viewport,
                ...(id === '-1' && { pointerEvents: 'none' }),
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                '--space-color': spaceColor 
            }}
            onClick={onActivate}
        >
            {["ne", "nw", "se", "sw"].map((dir) => (
                <div
                    key={dir}
                    className={s("area__corner", { [dir]: true })}
                    onMouseDown={(e) => handleAreaDragFromCorner(e.nativeEvent, dir as "ne", id, viewport, setResizePreview)}
                />
            ))}
            <button className={s("selectAreaButton")}
                draggable
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                onContextMenu={e => { e.preventDefault(); openSelectArea(e); }}
                style={{
                    cursor: "grab"
                }}
            />

            {shouldRenderMenubar && <MenuBar areaId={id} areaState={state} areaType={type} />}

            <div
                className="area-main-content-wrapper"
                style={{
                    flexGrow: 1,
                    minHeight: 0,
                    overflowY: 'auto',
                    position: 'relative',
                    opacity: active ? 1 : 0.8
                }}
            >
                <AreaIdContext.Provider value={id}>
                    <AreaErrorBoundary
                        component={Component}
                        areaId={id}
                        areaState={state}
                        type={type}
                        viewport={{
                            left: 0,
                            top: 0,
                            width: viewport.width,
                            height: contentAvailableHeight
                        }}
                    />
                </AreaIdContext.Provider>
                <Toolbar areaId={id} areaState={state} areaType={type} />
            </div>

            {shouldRenderStatusbar && <StatusBar areaId={id} areaState={state} areaType={type} />}
        </div>
    );
};

interface AreaContainerProps extends OwnProps {
    setResizePreview: Dispatch<SetStateAction<ResizePreviewState | null>>;
}

export const Area: React.FC<AreaContainerProps> = (props) => {
    const { id, setResizePreview } = props;
    const area = useKarmycStore(state => state.getAreaById(id));

    if (!area) {
        console.warn(`[Area Container] Area data not found for ID: ${id} in active screen.`);
        return null;
    }

    const Component = areaRegistry.getComponent(area.type);
    const initialState = areaRegistry.getInitialState(area.type);

    if (!Component) {
        console.error(`[Area Container] Unsupported area type: ${area.type} for ID: ${id}`);
        return <div>Unsupported type: {area.type}</div>;
    }

    return (
        <AreaComponent
            {...props}
            state={area.state || initialState || {}}
            type={area.type}
            raised={!!area.raised}
            Component={Component}
            setResizePreview={setResizePreview}
        />
    );
}; 
