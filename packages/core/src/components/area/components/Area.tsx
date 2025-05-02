import { areaRegistry } from "@gamesberry/karmyc-core/area/registry";
import { AreaTypeValue, TOOLBAR_HEIGHT } from "@gamesberry/karmyc-core/constants";
import { useKarmycStore } from "@gamesberry/karmyc-core/stores/areaStore";
import { useContextMenuStore } from "@gamesberry/karmyc-core/stores/contextMenuStore";
import styles from "@gamesberry/karmyc-core/styles/Area.styles";
import { AreaComponentProps, ResizePreviewState } from "@gamesberry/karmyc-core/types/areaTypes";
import { Rect } from "@gamesberry/karmyc-core/types/geometry";
import { AreaIdContext } from "@gamesberry/karmyc-core/utils/AreaIdContext";
import { compileStylesheetLabelled } from "@gamesberry/karmyc-core/utils/stylesheets";
import { Vec2 } from "@gamesberry/karmyc-shared";
import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { PenIcon } from "../../icons/PenIcon";
import { handleAreaDragFromCorner } from "../handlers/areaDragFromCorner";
import { useAreaContextMenu } from '../hooks/useAreaContextMenu';
import { AreaErrorBoundary } from "./AreaErrorBoundary";
import { MenuBar, useMenuBar } from './MenuBar';
import { StatusBar, useStatusBar } from './StatusBar';
import { Toolbar } from './Toolbar';

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

    let IconComponent: React.ComponentType = PenIcon;
    const registeredIcon = areaRegistry.getIcon(type);
    if (registeredIcon) {
        IconComponent = registeredIcon;
    }

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
                overflow: 'hidden'
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
            <button className={s("selectAreaButton")} onMouseDown={openSelectArea}>
                <IconComponent />
            </button>

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
