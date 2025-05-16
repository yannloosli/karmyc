import React, { Dispatch, SetStateAction, useEffect, useRef, useState, useCallback } from "react";
import { handleAreaDragFromCorner } from "../handlers/areaDragFromCorner";
import { useAreaContextMenu } from '../hooks/useAreaContextMenu';
import { AreaErrorBoundary } from "./AreaErrorBoundary";
import { useToolsBar } from './Tools';
import { areaRegistry } from "../../../area/registry";
import { AreaTypeValue, TOOLBAR_HEIGHT, AREA_ROLE } from "../../../constants";
import { useKarmycStore } from "../../../stores/areaStore";
import { useContextMenuStore } from "../../../stores/contextMenuStore";
import styles from "../../../styles/Area.styles";
import { AreaComponentProps, ResizePreviewState } from "../../../types/areaTypes";
import { Rect } from "../../../types/geometry";
import { AreaIdContext } from "../../../utils/AreaIdContext";
import { compileStylesheet } from "../../../utils/stylesheets";
import { useSpaceStore } from "../../../stores/spaceStore";
import { Tools } from './Tools';
import type { AreaRole } from "../../../constants";
import { css } from '@emotion/css';

const s = compileStylesheet(styles);

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

const areaMainContentWrapper = css`
    flex-grow: 1;
    min-height: 0;
    overflow-y: auto;
    position: relative;
`;

export const AreaComponent: React.FC<AreaComponentOwnProps> = ({
    id,
    Component,
    state,
    type,
    viewport,
    raised,
    setResizePreview,
}) => {
    // LOG: Vérification de la génération des classes CSS
    console.log("[DEBUG] s('area') =", s("area"));
    console.log("[DEBUG] s('area__corner', { nw: true }) =", s("area__corner", { nw: true }));

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
    const removeArea = useKarmycStore((state) => state.removeArea);

    // Ref pour le bouton
    const selectAreaButtonRef = useRef<HTMLButtonElement>(null);
    const openSelectArea = (_: React.MouseEvent) => {
        if (selectAreaButtonRef.current) {
            const rect = selectAreaButtonRef.current.getBoundingClientRect();
        openContextMenuAction({
                position: { x: rect.left + rect.width / 2, y: rect.top + rect.height },
            items: contextMenuItems,
            metadata: { areaId: id }
        });
        }
    };

    const viewportRef = useRef<HTMLDivElement>(null);
    const [keyboardViewport, setKeyboardViewport] = useState<Rect>({ left: 0, top: 0, width: 0, height: 0 });

    const area = useKarmycStore(state => state.getAreaById(id));
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
    const setActiveSpace = useSpaceStore(state => state.setActiveSpace);
    const activeSpaceId = useSpaceStore(state => state.activeSpaceId);

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
            // Logique LEAD/FOLLOW/SELF
            if (area?.role === AREA_ROLE.LEAD && area.spaceId) {
                setActiveSpace(area.spaceId);
            }
            // FOLLOW : rien à faire ici, la logique d'action doit utiliser le space actif global
            // SELF : rien à faire
        }
    };

    // --- Remplacement des hooks par useToolsBar ---
    const { getComponents: getMenuComponents } = useToolsBar(type, id, 'top-outside');
    const { getComponents: getStatusComponents } = useToolsBar(type, id, 'bottom-outside');
    const { getComponents: getToolbarTopInside } = useToolsBar(type, id, 'top-inside');
    const { getComponents: getToolbarBottomInside } = useToolsBar(type, id, 'bottom-inside');
    const menuComponents = getMenuComponents();
    const statusComponents = getStatusComponents();
    const toolbarTopInsideComponents = getToolbarTopInside();
    const toolbarBottomInsideComponents = getToolbarBottomInside();

    // Nouvelle logique avec Tools
    const shouldRenderMenubar = menuComponents.length > 0;
    const shouldRenderStatusbar = statusComponents.length > 0;
    const shouldRenderToolbarTopInside = toolbarTopInsideComponents.length > 0;
    const shouldRenderToolbarBottomInside = toolbarBottomInsideComponents.length > 0;

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
            if (store.screens[store.activeScreenId]?.areas.areaToOpen) {
                store.cleanupTemporaryStates();
            }
        }
    }, []);

    // Préparation des variables de debug pour FOLLOW
    let lastLeadAreaId = null;
    let leadArea = null;
    let leadSpaceId = null;
    let leadSpaceColor = null;
    if (area?.role === 'FOLLOW') {
        const activeScreenId = useKarmycStore.getState().activeScreenId;
        lastLeadAreaId = useKarmycStore.getState().screens[activeScreenId]?.areas.lastLeadAreaId;
        const allAreas = useKarmycStore.getState().screens[activeScreenId]?.areas.areas || {};
        leadArea = lastLeadAreaId ? allAreas[lastLeadAreaId] : null;
        leadSpaceId = leadArea?.spaceId;
        if (leadSpaceId) {
            const leadSpace = useSpaceStore.getState().spaces[leadSpaceId];
            leadSpaceColor = leadSpace?.sharedState?.color;
        }
    }

    return (
        <div
            ref={viewportRef}
            className={`area ${s('area', { raised: !!raised })}`}
            style={{
                left: viewport.left,
                top: viewport.top,
                width: viewport.width,
                height: viewport.height,
            }}
            onClick={onActivate}
        >
            {/* Bloc de debug FOLLOW/LEAD */}
            <div style={{
                background: '#f8f8f8',
                border: '1px solid #eee',
                borderRadius: 4,
                padding: 6,
                marginBottom: 6,
                fontSize: 11,
                color: '#333',
                width: '100%'
            }}>
                <div><b>DEBUG</b></div>
                <div>Area id : {id}</div>
                <div>Rôle : {area?.role || 'N/A'}</div>
                <div>spaceId : {area?.spaceId || 'N/A'}</div>
                <div>Couleur utilisée : <span style={{ color: spaceColor }}>{spaceColor}</span></div>
                {area?.role === 'FOLLOW' && (
                    <>
                        <div>LEAD id : {lastLeadAreaId || 'N/A'}</div>
                        <div>LEAD spaceId : {leadSpaceId || 'N/A'}</div>
                        <div>Couleur du LEAD : <span style={{ color: spaceColor }}>{spaceColor || 'N/A'}</span></div>
                    </>
                )}
            </div>
            {['ne', 'nw', 'se', 'sw'].map((dir) => (
                <div
                    key={dir}
                    className={`area__corner ${s('area__corner', { [dir]: true })}`}
                    onMouseDown={(e) => handleAreaDragFromCorner(e.nativeEvent, dir as 'ne', id, viewport, setResizePreview)}
                />
            ))}
            <button className={`select-area-button ${s('selectAreaButton')}`}
                draggable
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                onContextMenu={e => { e.preventDefault(); openSelectArea(e); }}
                style={{
                    cursor: 'grab',
                    '--space-color': spaceColor
                } as React.CSSProperties}
                ref={selectAreaButtonRef}
            />

            <Tools
                areaId={id}
                areaType={type}
                areaState={state}
                position="top-outside"
                style={{ height: TOOLBAR_HEIGHT, minHeight: TOOLBAR_HEIGHT }}
            />

            <div
                className={"area-main-content-wrapper " + areaMainContentWrapper}
                style={{ opacity: active ? 1 : 0.8 }}
            >
                <Tools
                    areaId={id}
                    areaType={type}
                    areaState={state}
                    position="top-inside"
                    style={{ height: TOOLBAR_HEIGHT, minHeight: TOOLBAR_HEIGHT }}
                />
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
                <Tools
                    areaId={id}
                    areaType={type}
                    areaState={state}
                    position="bottom-inside"
                    style={{ height: TOOLBAR_HEIGHT, minHeight: TOOLBAR_HEIGHT }}
                />
            </div>

            <Tools
                areaId={id}
                areaType={type}
                areaState={state}
                position="bottom-outside"
                style={{ height: TOOLBAR_HEIGHT, minHeight: TOOLBAR_HEIGHT }}
            />
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
