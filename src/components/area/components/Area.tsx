import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { areaRegistry } from "~/area/registry";
import { AREA_BORDER_WIDTH, AreaType, AreaTypeValue } from "~/constants";
import { RootState } from "~/store";
import { _areaReactKeyRegistry } from "~/store/registries/areaRegistry";
import { setActiveArea } from "~/store/slices/areaSlice";
import { openContextMenu } from "~/store/slices/contextMenuSlice";
import styles from "~/styles/Area.styles";
import { AreaComponentProps } from "~/types/areaTypes";
import { Rect } from "~/types/geometry";
import { AreaIdContext } from "~/utils/AreaIdContext";
import { Vec2 } from "~/utils/math/vec2";
import { requestAction } from "~/utils/requestAction";
import { compileStylesheetLabelled } from "~/utils/stylesheets";
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
    type: AreaTypeValue;
    raised: boolean;
    Component: React.ComponentType<AreaComponentProps<any>>;
}

type Props = StateProps & OwnProps;

const areaTypeOptions: Array<{ icon: React.ComponentType; type: AreaTypeValue; label: string }> = [
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

const typeToIndex: Record<AreaTypeValue, number> = areaTypeOptions.reduce((obj, { type }, i) => {
    obj[type] = i;
    return obj;
}, {} as Record<AreaTypeValue, number>);

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
    const active = useSelector((state: RootState) => state.area.activeAreaId === id);

    // Vérifier s'il s'agit d'un type personnalisé ou standard
    let isCustomType = !typeToIndex.hasOwnProperty(type);
    let IconComponent: React.ComponentType = PenIcon; // Utiliser PenIcon par défaut

    // Pour les types standard, utiliser l'icône définie
    if (!isCustomType) {
        IconComponent = areaTypeOptions[typeToIndex[type]].icon;
    } else {
        // Pour les types personnalisés, essayer de récupérer l'icône du registre
        const registeredIcon = areaRegistry.getIcon(type);
        if (registeredIcon) {
            IconComponent = registeredIcon;
        }
        console.log(`Utilisation du type personnalisé: ${type}`);
    }

    const openSelectArea = (_: React.MouseEvent) => {
        const pos = Vec2.new(viewport.left + 4, viewport.top + 4);
        console.log("Ouverture du menu contextuel zone à la position:", pos);
        requestAction({}, (params) => {
            dispatch(
                openContextMenu({
                    position: { x: pos.x, y: pos.y },
                    items: [
                        {
                            id: "project",
                            label: "Project",
                            actionId: "area.project",
                            metadata: { areaId: id }
                        },
                        {
                            id: "timeline",
                            label: "Timeline",
                            actionId: "area.timeline",
                            metadata: { areaId: id }
                        },
                        {
                            id: "workspace",
                            label: "Workspace",
                            actionId: "area.workspace",
                            metadata: { areaId: id }
                        },
                        {
                            id: "floweditor",
                            label: "Node Editor",
                            actionId: "area.floweditor",
                            metadata: { areaId: id }
                        },
                        {
                            id: "history",
                            label: "History",
                            actionId: "area.history",
                            metadata: { areaId: id }
                        },
                        {
                            id: "separator",
                            label: "───────────────",
                            actionId: "area.separator",
                            metadata: { areaId: id }
                        },
                        {
                            id: "create-text-note",
                            label: "Convertir en note",
                            actionId: "area.create-text-note",
                            metadata: { areaId: id }
                        },
                        {
                            id: "create-color-picker",
                            label: "Convertir en palette",
                            actionId: "area.create-color-picker",
                            metadata: { areaId: id }
                        },
                        {
                            id: "create-image-viewer",
                            label: "Convertir en image",
                            actionId: "area.create-image-viewer",
                            metadata: { areaId: id }
                        }
                    ],
                    metadata: { areaId: id }
                })
            );
        });
    };

    const areaStateKey = _areaReactKeyRegistry[type];
    const key = areaStateKey ? state[areaStateKey] : id;

    // Récupérer le viewport pour les raccourcis clavier
    const viewportRef = useRef<HTMLDivElement>(null);
    const [keyboardViewport, setKeyboardViewport] = useState<Rect>({ left: 0, top: 0, width: 0, height: 0 });

    // Mettre à jour le viewport lorsque le composant est monté ou redimensionné
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

        // Observer les redimensionnements
        const resizeObserver = new ResizeObserver(updateViewport);
        if (viewportRef.current) {
            resizeObserver.observe(viewportRef.current);
        }

        // Nettoyer l'observateur lors du démontage
        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    // Les raccourcis clavier sont maintenant gérés par les types d'area individuels
    // qui utilisent useAreaKeyboardShortcuts avec leurs propres raccourcis

    // Activer la zone lorsqu'elle est cliquée
    const onActivate = () => {
        if (!active) {
            dispatch(setActiveArea(id));
        }
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

    const areaType = areas[id].type as AreaTypeValue;
    const component = areaRegistry.getComponent(areaType);

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
