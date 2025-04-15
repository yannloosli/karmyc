import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { areaRegistry } from "~/area/registry";
import { AreaTypeValue } from "~/constants";
import { RootState } from "~/store";
import { setActiveArea } from "~/store/slices/areaSlice";
import { openContextMenu } from "~/store/slices/contextMenuSlice";
import styles from "~/styles/Area.styles";
import { AreaComponentProps } from "~/types/areaTypes";
import { Rect } from "~/types/geometry";
import { AreaIdContext } from "~/utils/AreaIdContext";
import { Vec2 } from "~/utils/math/vec2";
import { requestAction } from "~/utils/requestAction";
import { compileStylesheetLabelled } from "~/utils/stylesheets";
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
    const contextMenuItems = useAreaContextMenu(id);

    // Vérifier s'il s'agit d'un type personnalisé ou standard
    let IconComponent: React.ComponentType = PenIcon; // Utiliser PenIcon par défaut

    // Pour les types standard, utiliser l'icône définie

    // Pour les types personnalisés, essayer de récupérer l'icône du registre
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

    // Activer la zone lorsqu'elle est cliquée
    const onActivate = () => {
        if (!active) {
            dispatch(setActiveArea(id));
        }
    };

    // Préparer les dimensions intérieures pour la zone de contenu
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
            Component: (() => <div>Type non supporté : {area.type}</div>) as any,
        };
    }

    return {
        state: area.state || initialState || {},
        type: area.type,
        raised: !!area.raised,
        Component,
    };
}; 
