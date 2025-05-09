import { areaRegistry } from "@gamesberry/karmyc-core/area/registry";
import { AreaTypeValue } from "@gamesberry/karmyc-core/constants";
import { RootState } from "@gamesberry/karmyc-core/store";
import { setActiveArea } from "@gamesberry/karmyc-core/store/slices/areaSlice";
import { openContextMenu } from "@gamesberry/karmyc-core/store/slices/contextMenuSlice";
import styles from "@gamesberry/karmyc-core/styles/Area.styles";
import { AreaComponentProps } from "@gamesberry/karmyc-core/types/areaTypes";
import { Rect } from "@gamesberry/karmyc-core/types/geometry";
import { AreaIdContext } from "@gamesberry/karmyc-core/utils/AreaIdContext";
import { requestAction } from "@gamesberry/karmyc-core/utils/requestAction";
import { compileStylesheetLabelled } from "@gamesberry/karmyc-core/utils/stylesheets";
import { Vec2 } from "@gamesberry/karmyc-shared";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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

export const AreaComponent: React.FC<AreaComponentProps> = ({
    id,
    Component,
    state,
    type,
    viewport,
    raised,
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

    const dispatch = useDispatch();
    const active = useSelector((state: RootState) => state.area.activeAreaId === id);
    const contextMenuItems = useAreaContextMenu(id);

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
            dispatch(
                openContextMenu({
                    position: { x: pos.x, y: pos.y },
                    items: contextMenuItems,
                    metadata: { areaId: id }
                })
            );
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
            dispatch(setActiveArea(id));
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
            className={s("area", { raised: !!raised })}
            style={viewport}
            onClick={onActivate}
        >
            {["ne", "nw", "se", "sw"].map((dir) => (
                <div
                    key={dir}
                    className={s("area__corner", { [dir]: true })}
                    onMouseDown={(e) => handleAreaDragFromCorner(e.nativeEvent, dir as "ne", id, viewport)}
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

export const Area: React.FC<OwnProps> = (props) => {
    const areaState = useSelector((state: RootState) => {
        if (!state?.area) return null;
        return {
            areas: state.area.areas || {},
            layout: state.area.layout || {},
            rootId: state.area.rootId,
            activeAreaId: state.area.activeAreaId
        };
    }, (prev, next) => {
        if (!prev || !next) return false;
        return (
            prev.rootId === next.rootId &&
            prev.activeAreaId === next.activeAreaId &&
            prev.areas === next.areas &&
            prev.layout === next.layout
        );
    });

    if (!areaState) {
        console.warn('Area state is not available');
        return null;
    }

    const stateProps = mapStateToProps(areaState, props);
    return <AreaComponent {...props} {...stateProps} />;
};

const mapStateToProps = (state: any, ownProps: OwnProps): StateProps => {
    if (!state?.areas) {
        console.warn(`Area state is not available for area ${ownProps.id}`);
        return {
            state: {},
            type: 'unknown',
            raised: false,
            Component: () => <div>Area not found</div>
        };
    }

    const area = state.areas[ownProps.id];
    if (!area) {
        console.warn(`Area ${ownProps.id} not found in state`);
        return {
            state: {},
            type: 'unknown',
            raised: false,
            Component: () => <div>Area not found</div>
        };
    }

    const Component = areaRegistry.getComponent(area.type);
    const initialState = areaRegistry.getInitialState(area.type);

    if (!Component) {
        console.warn(`Component for area type ${area.type} not found in registry`);
        return {
            state: area.state || initialState || {},
            type: area.type,
            raised: !!area.raised,
            Component: (() => <div>Unsupported type: {area.type}</div>) as any,
        };
    }

    return {
        state: area.state || initialState || {},
        type: area.type,
        raised: !!area.raised,
        Component,
    };
}; 
