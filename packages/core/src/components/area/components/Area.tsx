import { areaRegistry } from "@gamesberry/karmyc-core/area/registry";
import { AreaTypeValue } from "@gamesberry/karmyc-core/constants";
import { AreaState, useAreaStore } from "@gamesberry/karmyc-core/stores/areaStore";
import { useContextMenuStore } from "@gamesberry/karmyc-core/stores/contextMenuStore";
import styles from "@gamesberry/karmyc-core/styles/Area.styles";
import { AreaComponentProps, ResizePreviewState } from "@gamesberry/karmyc-core/types/areaTypes";
import { Rect } from "@gamesberry/karmyc-core/types/geometry";
import { AreaIdContext } from "@gamesberry/karmyc-core/utils/AreaIdContext";
import { requestAction } from "@gamesberry/karmyc-core/utils/requestAction";
import { compileStylesheetLabelled } from "@gamesberry/karmyc-core/utils/stylesheets";
import { Vec2 } from "@gamesberry/karmyc-shared";
import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { PenIcon } from "../../icons/PenIcon";
import { handleAreaDragFromCorner } from "../handlers/areaDragFromCorner";
import { useAreaContextMenu } from '../hooks/useAreaContextMenu';
import { AreaErrorBoundary } from "./AreaErrorBoundary";
import { MenuBar } from './MenuBar';
import { StatusBar } from './StatusBar';
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
        // Use a default viewport to avoid rendering errors
        viewport = {
            left: 0,
            top: 0,
            width: 100,
            height: 100
        };
    }

    const active = useAreaStore((state: AreaState) => state.activeAreaId === id);
    const setActiveArea = useAreaStore((state: AreaState) => state.setActiveArea);
    const contextMenuItems = useAreaContextMenu(id);
    const openContextMenuAction = useContextMenuStore((state) => state.openContextMenu);

    // Check if this is a custom or standard type
    let IconComponent: React.ComponentType = PenIcon; // Use PenIcon as default

    // For standard types, use the defined icon

    // For custom types, try to get the icon from the registry
    const registeredIcon = areaRegistry.getIcon(type);
    if (registeredIcon) {
        IconComponent = registeredIcon;
    }

    const openSelectArea = (_: React.MouseEvent) => {
        const pos = Vec2.new(viewport.left + 4, viewport.top + 4);

        requestAction({}, () => {
            openContextMenuAction({
                position: { x: pos.x, y: pos.y },
                items: contextMenuItems,
                metadata: { areaId: id }
            });
        });
    };

    // Get viewport for keyboard shortcuts
    const viewportRef = useRef<HTMLDivElement>(null);
    const [keyboardViewport, setKeyboardViewport] = useState<Rect>({ left: 0, top: 0, width: 0, height: 0 });

    // Update the viewport when the component is mounted or resized
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

        // Observe resizing
        const resizeObserver = new ResizeObserver(updateViewport);
        if (viewportRef.current) {
            resizeObserver.observe(viewportRef.current);
        }

        // Clean up the observer when unmounting
        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    // Activate the area when clicked
    const onActivate = () => {
        if (!active) {
            setActiveArea(id);
        }
    };

    // Prepare inner dimensions for the content area
    const contentViewport = {
        left: 0,
        top: 0,
        width: viewport.width,
        height: viewport.height
    };

    return (
        <div
            ref={viewportRef}
            data-areaid={id}
            className={s("area", { raised: !!raised, active })}
            style={viewport}
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

            <div className={s("area__content")} style={{ minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <MenuBar areaId={id} areaState={state} areaType={type} />
                <div style={{ minHeight: 0, position: 'relative', opacity: active ? 1 : 0.8 }}>
                    <AreaIdContext.Provider value={id}>
                        <AreaErrorBoundary
                            component={Component}
                            areaId={id}
                            areaState={state}
                            type={type}
                            viewport={contentViewport}
                        />
                    </AreaIdContext.Provider>
                    <Toolbar areaId={id} areaState={state} areaType={type} />
                </div>
                <StatusBar areaId={id} areaState={state} areaType={type} />
            </div>
        </div>
    );
};

interface AreaContainerProps extends OwnProps {
    setResizePreview: Dispatch<SetStateAction<ResizePreviewState | null>>;
}

export const Area: React.FC<AreaContainerProps> = (props) => {
    const { id, setResizePreview } = props;
    const areas = useAreaStore((state: AreaState) => state.areas);
    const layout = useAreaStore((state: AreaState) => state.layout);
    const rootId = useAreaStore((state: AreaState) => state.rootId);
    const activeAreaId = useAreaStore((state: AreaState) => state.activeAreaId);

    if (!areas || !layout) {
        return null;
    }

    const area = areas[id];
    if (!area) {
        return null;
    }

    const Component = areaRegistry.getComponent(area.type);
    const initialState = areaRegistry.getInitialState(area.type);

    if (!Component) {
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
