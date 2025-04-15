import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { areaRegistry } from "~/area/registry";
import { Rect } from "~/types/geometry";
import { AREA_BORDER_WIDTH, AREA_PLACEMENT_TRESHOLD } from "../../../constants";
import { useVec2TransitionState } from "../../../hooks/useNumberTransitionState";
import { RootState } from "../../../store";
import { clearAreaToOpen, finalizeAreaPlacement, setAreaToOpen, updateAreaToOpenPosition } from "../../../store/slices/areaSlice";
import AreaRootStyles from "../../../styles/AreaRoot.styles";
import { AreaToOpen } from "../../../types/areaTypes";
import { computeAreaToParentRow } from "../../../utils/areaToParentRow";
import { computeAreaToViewport } from "../../../utils/areaToViewport";
import { getAreaToOpenPlacementInViewport, getHoveredAreaId, PlaceArea } from "../../../utils/areaUtils";
import { getAreaRootViewport } from "../../../utils/getAreaViewport";
import { contractRect } from "../../../utils/math";
import { Vec2 } from "../../../utils/math/vec2";
import { requestAction } from "../../../utils/requestAction";
import { compileStylesheetLabelled } from "../../../utils/stylesheets";
import { AreaComponent } from "./Area";

interface RenderAreaToOpenProps {
    viewport: Rect;
    areaToOpen: AreaToOpen;
    dimensions: Vec2;
    areaState: RootState['area'];
    areaToViewport: { [key: string]: Rect };
}

const RenderAreaToOpen: React.FC<RenderAreaToOpenProps> = React.memo((props) => {
    const { areaToOpen, viewport, dimensions, areaState, areaToViewport } = props;
    const dispatch = useDispatch();
    const rafRef = useRef<number | undefined>(undefined);
    const isUpdatingRef = useRef(false);

    // Log initial props
    useEffect(() => {
        console.log('[AreaToOpenPreview] RenderAreaToOpen - Props initialisés:', {
            areaToOpen,
            areaState,
            dimensions
        });
    }, []);

    const updatePosition = useCallback((x: number, y: number) => {
        if (isUpdatingRef.current) return;
        isUpdatingRef.current = true;

        console.log('[AreaToOpenPreview] updatePosition appelé', { x, y });

        rafRef.current = requestAnimationFrame(() => {
            dispatch(updateAreaToOpenPosition({ x, y }));
            isUpdatingRef.current = false;
        });
    }, [dispatch]);

    useEffect(() => {
        return () => {
            console.log('[AreaToOpenPreview] Nettoyage du composant RenderAreaToOpen');
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, []);

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
        updatePosition(e.clientX, e.clientY);
    }, [updatePosition]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        console.log('[AreaToOpenPreview] handleDrop - Début', { clientX: e.clientX, clientY: e.clientY });

        // Récupérer le sourceId depuis les données de transfert
        const sourceId = e.dataTransfer.getData('text/plain');
        if (!sourceId) {
            console.warn('[AreaToOpenPreview] handleDrop - Pas de sourceId trouvé');
            dispatch(clearAreaToOpen());
            return;
        }

        // Mettre à jour l'état avec le sourceId et le type correct
        const sourceData = JSON.parse(sourceId);
        console.log('[AreaToOpenPreview] handleDrop - Source data:', sourceData);

        // Si c'est une création de nouvelle zone, on garde l'areaToOpen actuel
        if (sourceData.type === 'create-new') {
            console.log('[AreaToOpenPreview] handleDrop - Création nouvelle zone');
            requestAction({}, (params) => {
                console.log('[AreaToOpenPreview] finalizeAreaPlacement pour creation - AVANT');
                params.dispatch(finalizeAreaPlacement());
                console.log('[AreaToOpenPreview] finalizeAreaPlacement pour creation - APRÈS');
                params.submitAction("Finalize area placement");
            });
            return;
        }

        // Pour les autres types (comme menubar), on utilise une approche simplifiée avec une action unique
        const sourceArea = areaState.areas[sourceData.areaId];
        if (!sourceArea) {
            console.warn('[AreaToOpenPreview] handleDrop - Area source non trouvée:', sourceData.areaId);
            dispatch(clearAreaToOpen());
            return;
        }

        // Vérifier si on drop sur la même zone ou dans la même zone
        const dropPosition = Vec2.new(e.clientX, e.clientY);
        const hoveredAreaId = getHoveredAreaId(dropPosition, areaState, areaToViewport, dimensions);

        // Récupérer des informations sur la structure pour les vérifications
        const areaToParentRow = computeAreaToParentRow(areaState);
        const sourceParentRowId = areaToParentRow[sourceData.areaId];

        // Vérification de sécurité du parent
        if (!sourceParentRowId) {
            console.warn('[AreaToOpenPreview] handleDrop - Pas de rangée parente pour la zone source, opération risquée, annulation');
            dispatch(clearAreaToOpen());
            return;
        }

        // Déterminer si c'est un drop sur soi-même (même ID ou bordure de la même zone)
        let isSelfDrop = false;

        // 1. Vérification directe d'ID (même zone exactement)
        if (hoveredAreaId && sourceData.areaId === hoveredAreaId) {
            console.log('[AreaToOpenPreview] handleDrop - Drop détecté sur la même zone, annulation');
            isSelfDrop = true;
        }
        // 2. Vérification du placement si on est sur une bordure de la même zone
        else if (hoveredAreaId && areaToViewport[hoveredAreaId]) {
            const viewport = areaToViewport[hoveredAreaId];
            const placement = getAreaToOpenPlacementInViewport(viewport, dropPosition);

            // Si la zone cible et la zone source sont dans la même rangée parente
            // et que nous sommes sur une bordure (top, left, right, bottom)
            const targetParentRowId = areaToParentRow[hoveredAreaId];

            if (targetParentRowId && sourceParentRowId === targetParentRowId &&
                (placement === "top" || placement === "left" || placement === "right" || placement === "bottom")) {
                console.log(`[AreaToOpenPreview] Drop détecté sur la bordure ${placement} d'une zone dans la même rangée`);

                // Pour les zones dans la même rangée parente, vérifier l'orientation
                const parentRow = areaState.layout[sourceParentRowId];
                if (parentRow && parentRow.type === 'area_row') {
                    const isHorizontal = parentRow.orientation === 'horizontal';

                    // Si on est dans la même rangée et qu'on drop sur la même zone source
                    if (sourceData.areaId === hoveredAreaId) {
                        console.log('[AreaToOpenPreview] handleDrop - Drop sur la même zone source, considéré comme self-drop');
                        isSelfDrop = true;
                    }
                    // Sinon, vérifier uniquement les zones adjacentes dans la même orientation
                    else {
                        // Trouver l'index de la zone source et de la zone cible dans la rangée
                        const sourceIndex = parentRow.areas.findIndex((a: { id: string }) => a.id === sourceData.areaId);
                        const targetIndex = parentRow.areas.findIndex((a: { id: string }) => a.id === hoveredAreaId);

                        // Si les deux zones sont adjacentes et le drop est dans la même orientation que la rangée,
                        // on autorise le drop (pas de self-drop)
                        const areAdjacent = Math.abs(sourceIndex - targetIndex) === 1;

                        // Si on est pas adjacents ou si on drop dans une orientation différente, pas de self-drop
                        if (!areAdjacent) {
                            console.log('[AreaToOpenPreview] handleDrop - Drop sur une zone non-adjacente dans la même rangée, autorisé');
                        } else if ((isHorizontal && (placement === "top" || placement === "bottom")) ||
                            (!isHorizontal && (placement === "left" || placement === "right"))) {
                            console.log('[AreaToOpenPreview] handleDrop - Drop dans une orientation différente de la rangée, autorisé');
                        } else {
                            // Cas où on drop une zone à côté d'elle-même dans la même orientation
                            // Exemple: zone à gauche déposée sur le bord gauche de sa voisine de droite
                            console.log('[AreaToOpenPreview] handleDrop - Drop adjacent dans la même orientation, considéré comme self-drop');
                            isSelfDrop = true;
                        }
                    }
                }
            }

            // Vérifier spécifiquement les rangées imbriquées qui pourraient être liées
            const sourceParentRow = areaState.layout[sourceParentRowId];
            if (sourceParentRow && sourceParentRow.type === 'area_row') {
                // Si la zone cible fait partie d'une structure plus grande qui inclut la zone source
                if (targetParentRowId &&
                    (targetParentRowId === sourceData.areaId ||
                        sourceParentRowId === hoveredAreaId)) {
                    console.log('[AreaToOpenPreview] Drop détecté sur une structure liée à la source, annulation');
                    isSelfDrop = true;
                }
            }
        }

        // Annuler si c'est un self-drop
        if (isSelfDrop) {
            console.log('[AreaToOpenPreview] handleDrop - Zone déposée sur elle-même ou ses bordures, annulation de l\'action');
            dispatch(clearAreaToOpen());
            return;
        }

        console.log('[AreaToOpenPreview] handleDrop - Source area trouvée pour déplacement:', sourceData.areaId);

        // Créer une action unique pour déplacer l'area
        requestAction({}, (params) => {
            try {
                // Préparer les informations nécessaires au déplacement
                const areaToOpenData = {
                    position: { x: e.clientX, y: e.clientY },
                    area: {
                        type: sourceArea.type,
                        state: { ...sourceArea.state, sourceId: sourceData.areaId }
                    }
                };

                console.log('[AreaToOpenPreview] handleDrop - Déplacement de l\'area avec:', areaToOpenData);

                // Nous utilisons setAreaToOpen suivi immédiatement de finalizeAreaPlacement
                // pour éviter les problèmes avec Immer et l'état intermédiaire
                params.dispatch(setAreaToOpen(areaToOpenData));
                params.dispatch(finalizeAreaPlacement());

                // Soumettre l'action après que tout soit terminé
                params.submitAction("Move area");
            } catch (error) {
                console.error('[AreaToOpenPreview] handleDrop - Erreur lors du déplacement:', error);
                dispatch(clearAreaToOpen());
            }
        });
    }, [dispatch, areaState.areas, areaState, areaToViewport, dimensions]);

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
                    pointerEvents: 'none',
                    userSelect: 'none',
                    touchAction: 'none',
                    willChange: 'transform',
                    transform: 'translate(-50%, -50%) scale(0.4)',
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
