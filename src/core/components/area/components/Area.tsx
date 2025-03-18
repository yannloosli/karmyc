import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { AREA_BORDER_WIDTH, AreaType } from "~/core/constants";
import { useAreaKeyboardShortcuts } from "~/core/hooks/useAreaKeyboardShortcuts";
import { _areaReactKeyRegistry, areaComponentRegistry } from "~/core/store/registries/areaRegistry";
import { updateArea } from "~/core/store/slices/areaSlice";
import { closeContextMenu, openContextMenu } from "~/core/store/slices/contextMenuSlice";
import styles from "~/core/styles/Area.styles";
import { AreaComponentProps } from "~/core/types/areaTypes";
import { AreaIdContext } from "~/core/utils/AreaIdContext";
import { Rect } from "~/core/utils/math/types";
import { Vec2 } from "~/core/utils/math/vec2";
import { requestAction } from "~/core/utils/requestAction";
import { compileStylesheetLabelled } from "~/core/utils/stylesheets";
import { EditIcon } from "../../icons/EditIcon";
import { PenIcon } from "../../icons/PenIcon";
import { handleAreaDragFromCorner } from "../handlers/areaDragFromCorner";
import { AreaErrorBoundary } from "./AreaErrorBoundary";

const s = compileStylesheetLabelled(styles);

interface OwnProps {
    id: string;
    viewport: Rect;
}

interface StateProps {
    state: any;
    type: AreaType;
    raised: boolean;
    Component: React.ComponentType<AreaComponentProps<any>>;
}

type Props = StateProps & OwnProps;

const areaTypeOptions: Array<{ icon: React.ComponentType; type: AreaType; label: string }> = [
    {
        icon: PenIcon,
        type: AreaType.Project,
        label: "Project",
    },
    {
        icon: PenIcon,
        type: AreaType.Timeline,
        label: "Timeline",
    },
    {
        icon: PenIcon,
        type: AreaType.Workspace,
        label: "Workspace",
    },
    {
        icon: EditIcon,
        type: AreaType.FlowEditor,
        label: "Node Editor",
    },
    {
        icon: EditIcon,
        type: AreaType.History,
        label: "History",
    },
];

const typeToIndex: Record<AreaType, number> = areaTypeOptions.reduce((obj, { type }, i) => {
    obj[type] = i;
    return obj;
}, {} as Record<AreaType, number>);

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
        // Utiliser un viewport par défaut pour éviter les erreurs de rendu
        viewport = {
            left: 0,
            top: 0,
            width: 100,
            height: 100
        };
    }

    const dispatch = useDispatch();

    console.log('Area type:', type);
    console.log('Available types:', Object.keys(typeToIndex));
    console.log('Type index:', typeToIndex[type]);

    // Vérifier si le type est valide
    if (!typeToIndex.hasOwnProperty(type)) {
        console.error(`Invalid area type: ${type}`);
        return null;
    }

    const { icon: Icon } = areaTypeOptions[typeToIndex[type]];

    const openSelectArea = (_: React.MouseEvent) => {
        const pos = Vec2.new(viewport.left + 4, viewport.top + 4);
        requestAction({}, (params) => {
            dispatch(
                openContextMenu({
                    position: pos,
                    items: [
                        {
                            id: "project",
                            label: "Project",
                            action: () => {
                                dispatch(updateArea({ id, changes: { type: AreaType.Project } }));
                                dispatch(closeContextMenu());
                                params.submitAction("Update area type");
                            }
                        },
                        {
                            id: "timeline",
                            label: "Timeline",
                            action: () => {
                                dispatch(updateArea({ id, changes: { type: AreaType.Timeline } }));
                                dispatch(closeContextMenu());
                                params.submitAction("Update area type");
                            }
                        },
                        {
                            id: "workspace",
                            label: "Workspace",
                            action: () => {
                                dispatch(updateArea({ id, changes: { type: AreaType.Workspace } }));
                                dispatch(closeContextMenu());
                                params.submitAction("Update area type");
                            }
                        },
                        {
                            id: "floweditor",
                            label: "Node Editor",
                            action: () => {
                                dispatch(updateArea({ id, changes: { type: AreaType.FlowEditor } }));
                                dispatch(closeContextMenu());
                                params.submitAction("Update area type");
                            }
                        },
                        {
                            id: "history",
                            label: "History",
                            action: () => {
                                dispatch(updateArea({ id, changes: { type: AreaType.History } }));
                                dispatch(closeContextMenu());
                                params.submitAction("Update area type");
                            }
                        }
                    ]
                })
            );
        });
    };

    const areaStateKey = _areaReactKeyRegistry[type];
    const key = areaStateKey ? state[areaStateKey] : id;

    useAreaKeyboardShortcuts(id, type, viewport);

    return (
        <div data-areaid={id} className={s("area", { raised: !!raised })} style={viewport}>
            {["ne", "nw", "se", "sw"].map((dir) => (
                <div
                    key={dir}
                    className={s("area__corner", { [dir]: true })}
                    onMouseDown={(e) => handleAreaDragFromCorner(e, dir as "ne", id, viewport)}
                />
            ))}
            <button className={s("selectAreaButton")} onMouseDown={openSelectArea}>
                <Icon />
            </button>
            <div className={s("area__content")}>
                <AreaIdContext.Provider value={id}>
                    <AreaErrorBoundary
                        key={key}
                        component={Component}
                        areaId={id}
                        areaState={state}
                        type={type}
                        viewport={{
                            left: 0,
                            top: 0,
                            width: viewport.width - AREA_BORDER_WIDTH * 2,
                            height: viewport.height - AREA_BORDER_WIDTH * 2
                        }}
                    />
                </AreaIdContext.Provider>
            </div>
        </div>
    );
};

const mapStateToProps = (state: any, ownProps: OwnProps): StateProps => {
    const { area } = state;
    const { joinPreview, areas } = area;
    const { id } = ownProps;

    const isEligibleForJoin = joinPreview && joinPreview.eligibleAreaIds.indexOf(id) !== -1;
    const isBeingJoined = joinPreview && joinPreview.areaId === id;

    const areaType = areas[id].type as AreaType;
    const component = areaComponentRegistry[areaType];

    if (!component) {
        throw new Error(`No component registered for area type: ${areaType}`);
    }

    return {
        type: areaType,
        state: areas[id].state,
        raised: !!(isEligibleForJoin || isBeingJoined),
        Component: component,
    };
};

export const Area: React.FC<OwnProps> = (props) => {
    const { id, viewport } = props;
    const stateProps = useSelector((state) => mapStateToProps(state, props));

    if (!viewport) {
        console.warn(`No viewport found for area ${id}`);
        return null;
    }

    return (
        <AreaComponent
            id={id}
            viewport={viewport}
            Component={stateProps.Component}
            state={stateProps.state}
            type={stateProps.type}
            raised={stateProps.raised}
        />
    );
}; 
