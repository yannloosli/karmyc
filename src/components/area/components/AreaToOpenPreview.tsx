import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { areaRegistry } from "~/area/registry";
import { Rect } from "~/types/geometry";
import { AREA_BORDER_WIDTH, AREA_PLACEMENT_TRESHOLD } from "../../../constants";
import { useVec2TransitionState } from "../../../hooks/useNumberTransitionState";
import { RootState } from "../../../store";
import { areaSlice, clearAreaToOpen, finalizeAreaPlacement, setAreaToOpen, updateAreaToOpenPosition } from "../../../store/slices/areaSlice";
import AreaRootStyles from "../../../styles/AreaRoot.styles";
import { AreaToOpen } from "../../../types/areaTypes";
import { computeAreaToViewport } from "../../../utils/areaToViewport";
import { getAreaToOpenPlacementInViewport, getHoveredAreaId, PlaceArea } from "../../../utils/areaUtils";
import { getAreaRootViewport } from "../../../utils/getAreaViewport";
import { contractRect } from "../../../utils/math";
import { Vec2 } from "../../../utils/math/vec2";
import { compileStylesheetLabelled } from "../../../utils/stylesheets";
import { AreaComponent } from "./Area";

interface RenderAreaToOpenProps {
    viewport: Rect;
    areaToOpen: AreaToOpen;
    dimensions: Vec2;
    areaState: RootState['area'];
    areaToViewport: { [key: string]: Rect };
}

// Fonction de debounce
const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

const RenderAreaToOpen: React.FC<RenderAreaToOpenProps> = React.memo((props) => {
    const { areaToOpen, viewport, dimensions, areaState, areaToViewport } = props;
    const dispatch = useDispatch();
    const lastUpdateRef = useRef<number>(0);
    const UPDATE_INTERVAL = 16; // ~60fps

    // Mémoriser le calcul de areaToViewport
    const memoizedAreaToViewport = useMemo(() => {
        return computeAreaToViewport(areaState.layout, areaState.rootId, getAreaRootViewport());
    }, [areaState.layout, areaState.rootId]);

    // Fonction pour vérifier si une area est une leaf
    const isAreaLeaf = useCallback((areaId: string): boolean => {
        // Parcourir le layout pour trouver l'area
        const layout = areaState.layout[areaId];
        if (!layout) return false;

        // Si c'est une area (pas un row), c'est une leaf
        return layout.type === 'area';
    }, [areaState.layout]);

    // Calculer l'ID de l'area cible
    const targetId = useMemo(() => {
        const position = Vec2.new(areaToOpen.position.x, areaToOpen.position.y);
        return getHoveredAreaId(position, areaState, areaToViewport, dimensions);
    }, [areaToOpen.position, areaState, areaToViewport, dimensions]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';

        const now = performance.now();
        if (now - lastUpdateRef.current >= UPDATE_INTERVAL) {
            const position = Vec2.new(e.clientX, e.clientY);
            console.log('AreaToOpenPreview - handleDragOver:', { position });
            dispatch(updateAreaToOpenPosition(position));
            lastUpdateRef.current = now;
        }
    }, [dispatch]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Récupérer le sourceId depuis les données de transfert
        const sourceId = e.dataTransfer.getData('text/plain');
        if (!sourceId) {
            console.warn('AreaToOpenPreview - handleDrop - Pas de sourceId trouvé');
            dispatch(clearAreaToOpen());
            return;
        }

        // Mettre à jour l'état avec le sourceId et le type correct
        const sourceData = JSON.parse(sourceId);
        console.log('AreaToOpenPreview - handleDrop - Source data:', sourceData);

        // Si c'est une création de nouvelle zone, on garde l'areaToOpen actuel
        if (sourceData.type === 'create-new') {
            dispatch(finalizeAreaPlacement());
            return;
        }

        // Pour les autres types (comme menubar), on garde le comportement existant
        const sourceArea = areaState.areas[sourceData.areaId];
        if (!sourceArea) {
            console.warn('AreaToOpenPreview - handleDrop - Area source non trouvée:', sourceData.areaId);
            dispatch(clearAreaToOpen());
            return;
        }

        // Sauvegarder les informations de l'area source avant de la supprimer
        const sourceAreaInfo = {
            type: sourceArea.type,
            state: sourceArea.state
        };

        // Mettre à jour l'areaToOpen avec le type et le state corrects AVANT de supprimer l'area source
        dispatch(setAreaToOpen({
            position: { x: e.clientX, y: e.clientY },
            area: sourceAreaInfo
        }));

        // Supprimer l'area source
        dispatch(areaSlice.actions.removeArea(sourceData.areaId));

        // Nettoyer l'état des zones déconnectées
        dispatch(areaSlice.actions.cleanState());

        // Finaliser le placement
        dispatch(finalizeAreaPlacement());
    }, [dispatch, areaState.areas]);

    const placement = useMemo(() => {
        const position = Vec2.new(areaToOpen.position.x, areaToOpen.position.y);
        return getAreaToOpenPlacementInViewport(viewport, position);
    }, [viewport, areaToOpen.position]);

    // Mémoriser les calculs des lignes de placement
    const placementLinesMemo = useMemo(() => {
        const treshold = Math.min(viewport.width, viewport.height) * AREA_PLACEMENT_TRESHOLD;
        const O = Vec2.new(treshold, treshold);

        const w = viewport.width;
        const h = viewport.height;

        const nw_0 = Vec2.new(0, 0);
        const ne_0 = Vec2.new(w, 0);
        const se_0 = Vec2.new(w, h);
        const sw_0 = Vec2.new(0, h);

        const nw_1 = nw_0.add(O);
        const ne_1 = ne_0.add(O.scaleX(-1));
        const se_1 = se_0.add(O.scale(-1));
        const sw_1 = sw_0.add(O.scaleY(-1));

        const lines = [
            [nw_0, nw_1],
            [ne_0, ne_1],
            [sw_0, sw_1],
            [se_0, se_1],
            [nw_1, ne_1],
            [ne_1, se_1],
            [se_1, sw_1],
            [sw_1, nw_1],
        ];

        const placementLines: Record<PlaceArea, Vec2[]> = {
            left: [nw_0, nw_1, sw_1, sw_0],
            top: [nw_0, ne_0, ne_1, nw_1],
            right: [ne_1, ne_0, se_0, se_1],
            bottom: [sw_0, sw_1, se_1, se_0],
            replace: [nw_1, ne_1, se_1, sw_1],
        };

        return { lines, placementLines };
    }, [viewport.width, viewport.height]);

    // Mémoriser le calcul du path SVG
    const pathData = useMemo(() => {
        const hlines = placementLinesMemo.placementLines[placement];
        return hlines
            .map((p: Vec2) => [p.x, p.y].join(","))
            .map((str: string, i: number) => [i === 0 ? "M" : "L", str].join(" "))
            .join(" ") + " Z";
    }, [placementLinesMemo.placementLines, placement]);

    // Récupérer le composant depuis le registre
    const Component = areaRegistry.getComponent(areaToOpen.area.type);
    if (!Component) {
        return null;
    }

    return (
        <>
            <div
                className={s("areaToOpenContainer")}
                style={{
                    left: areaToOpen.position.x,
                    top: areaToOpen.position.y,
                    position: 'fixed',
                    zIndex: 10001,
                    cursor: 'move',
                    pointerEvents: 'auto',
                    userSelect: 'none',
                    touchAction: 'none',
                    willChange: 'transform'
                }}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <AreaComponent
                    id="-1"
                    Component={Component}
                    raised
                    state={areaToOpen.area.state}
                    type={areaToOpen.area.type}
                    viewport={{
                        left: -(dimensions.x / 2),
                        top: -(dimensions.y / 2),
                        height: dimensions.y,
                        width: dimensions.x,
                    }}
                />
            </div>
            {targetId && isAreaLeaf(targetId) && (
                <div
                    className={s("areaToOpenTargetOverlay")}
                    style={{
                        ...contractRect(viewport, AREA_BORDER_WIDTH),
                        transition: 'opacity 0.1s ease-out',
                        position: 'absolute',
                        zIndex: 10000,
                        pointerEvents: 'auto',
                        userSelect: 'none',
                        touchAction: 'none',
                        willChange: 'transform'
                    }}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onDragEnter={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('AreaToOpenPreview - DragEnter sur overlay');
                    }}
                    onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('AreaToOpenPreview - DragLeave sur overlay');
                    }}
                >
                    <svg width={viewport.width} height={viewport.height} className={s("placement")}>
                        {placementLinesMemo.lines.map(([p0, p1], i) => (
                            <line
                                key={i}
                                x1={p0.x}
                                y1={p0.y}
                                x2={p1.x}
                                y2={p1.y}
                            />
                        ))}
                        <path d={pathData} />
                    </svg>
                </div>
            )}
        </>
    );
});

const s = compileStylesheetLabelled(AreaRootStyles);

interface OwnProps {
    areaToViewport: { [key: string]: Rect };
}

export const AreaToOpenPreview: React.FC<OwnProps> = React.memo((props) => {
    const areaState = useSelector((state: RootState) => state.area);
    const { areaToOpen } = areaState;

    // Dimensions visuelles de la preview (avec animation)
    const [areaToOpenDimensions, setAreaToOpenDimensions] = useVec2TransitionState(
        Vec2.new(100, 100),
        { duration: 250, bezier: [0.24, 0.02, 0.18, 0.97] },
    );

    // Dimensions fixes pour la détection de la zone cible
    const detectionDimensions = useMemo(() => Vec2.new(300, 200), []);

    const areaToOpenTargetId = useMemo(() => {
        if (!areaToOpen || !props.areaToViewport || Object.keys(props.areaToViewport).length === 0) return null;
        return getHoveredAreaId(areaToOpen.position, areaState, props.areaToViewport, detectionDimensions);
    }, [areaToOpen, areaState, props.areaToViewport, detectionDimensions]);

    const areaToOpenTargetViewport = areaToOpenTargetId ? props.areaToViewport[areaToOpenTargetId] : null;

    useEffect(() => {
        if (!areaToOpenTargetId) return;

        const viewport = props.areaToViewport[areaToOpenTargetId];
        if (!viewport) return;

        const dimensions = Vec2.new(viewport.width, viewport.height);
        setAreaToOpenDimensions(dimensions);
    }, [areaToOpenTargetId, props.areaToViewport]);

    if (!areaToOpen || !areaToOpenTargetViewport) {
        return null;
    }

    return (
        <RenderAreaToOpen
            areaToOpen={areaToOpen}
            viewport={areaToOpenTargetViewport}
            dimensions={areaToOpenDimensions}
            areaState={areaState}
            areaToViewport={props.areaToViewport}
        />
    );
});
