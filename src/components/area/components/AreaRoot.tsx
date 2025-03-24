import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { TOOLBAR_HEIGHT } from "~/constants";
import { RootState } from "../../../store";
import { areaSlice } from "../../../store/slices/areaSlice";
import AreaRootStyles from "../../../styles/AreaRoot.styles";
import { AreaRowLayout } from "../../../types/areaTypes";
import { computeAreaToViewport } from "../../../utils/areaToViewport";
import { _setAreaViewport, getAreaRootViewport } from "../../../utils/getAreaViewport";
import { compileStylesheetLabelled } from "../../../utils/stylesheets";
import { Area } from "./Area";
import { AreaRowSeparators } from "./AreaRowSeparators";
import { AreaToOpenPreview } from "./AreaToOpenPreview";
import { JoinAreaPreview } from "./JoinAreaPreview";

const s = compileStylesheetLabelled(AreaRootStyles);

interface Rect {
    left: number;
    top: number;
    width: number;
    height: number;
}

const AreaRootComponent: React.FC = () => {
    const { layout, rootId, joinPreview } = useSelector((state: RootState) => state.area);
    const [viewportMap, setViewportMap] = useState<{ [areaId: string]: Rect }>({});
    const [viewport, setViewport] = useState(getAreaRootViewport());
    const layoutRef = useRef(layout);
    const rootIdRef = useRef(rootId);
    const dispatch = useDispatch();

    // Ajouter un compteur de tentatives pour limiter les recalculs et éviter les boucles infinies
    const recalculationAttemptsRef = useRef(0);
    const MAX_RECALCULATION_ATTEMPTS = 3;

    // Mettre à jour les refs quand le layout ou rootId change
    useEffect(() => {
        layoutRef.current = layout;
        rootIdRef.current = rootId;
    }, [layout, rootId]);

    // Fonction pour vérifier la validité de la structure
    const validateAndFixStructure = useCallback(() => {
        // Vérifier que le rootId existe dans le layout
        if (!layout[rootId]) {
            console.error("RootId invalide, nettoyage de l'état");
            dispatch(areaSlice.actions.cleanState());
            return false;
        }

        return true;
    }, [layout, rootId, dispatch]);

    // Améliorer la fonction recalculateViewports pour gérer les erreurs et limiter les tentatives
    const recalculateViewports = useCallback(() => {
        // Vérifier si on a atteint le nombre maximum de tentatives
        if (recalculationAttemptsRef.current >= MAX_RECALCULATION_ATTEMPTS) {
            console.warn(`Maximum recalculation attempts (${MAX_RECALCULATION_ATTEMPTS}) reached, giving up.`);
            return null;
        }

        // Incrémenter le compteur de tentatives
        recalculationAttemptsRef.current++;

        if (!validateAndFixStructure()) {
            return null;
        }

        try {
            const newViewport = getAreaRootViewport();
            setViewport(newViewport);

            if (newViewport && layoutRef.current && rootIdRef.current) {
                const newMap = computeAreaToViewport(layoutRef.current, rootIdRef.current, newViewport);

                if (Object.keys(newMap).length > 0) {
                    setViewportMap(prevMap => {
                        // Vérifier les changements pour éviter des re-rendus inutiles
                        let hasChanges = false;
                        const filteredMap = { ...newMap };

                        // Supprimer les entrées qui n'existent plus dans le layout
                        Object.keys(prevMap).forEach(id => {
                            if (!layoutRef.current[id]) {
                                delete filteredMap[id];
                                hasChanges = true;
                            } else if (JSON.stringify(prevMap[id]) !== JSON.stringify(newMap[id])) {
                                hasChanges = true;
                            }
                        });

                        // Vérifier s'il y a de nouveaux IDs
                        Object.keys(newMap).forEach(id => {
                            if (!prevMap[id]) {
                                hasChanges = true;
                            }
                        });

                        // Réinitialiser le compteur si on a réussi à mettre à jour
                        if (hasChanges) {
                            recalculationAttemptsRef.current = 0;
                        }

                        return hasChanges ? filteredMap : prevMap;
                    });

                    _setAreaViewport(newMap);
                    return newMap;
                }
            }
        } catch (error) {
            console.error("Error computing viewports:", error);
            // En cas d'erreur, tenter de nettoyer l'état
            dispatch(areaSlice.actions.cleanState());
        }

        return null;
    }, [validateAndFixStructure, dispatch]);

    // Réinitialiser le compteur après chaque montage ou changement de dépendances majeures
    useEffect(() => {
        recalculationAttemptsRef.current = 0;
    }, [layout, rootId]);

    // Gérer le redimensionnement de la fenêtre
    useEffect(() => {
        const fn = () => {
            // Ignorer les mises à jour pendant le redimensionnement actif des zones
            if (window.__AREA_RESIZING__) {
                return;
            }

            recalculateViewports();
        };

        window.addEventListener("resize", fn);
        return () => window.removeEventListener("resize", fn);
    }, [recalculateViewports]);

    // Calculer les viewports initiaux et lorsque le layout change
    useEffect(() => {
        recalculateViewports();
    }, [layout, rootId, recalculateViewports]);

    // Filtrer les clés de layout pour ne garder que celles qui existent encore
    const validLayoutKeys = Object.keys(layout).filter(id => {
        const layoutItem = layout[id];
        return layoutItem && (layoutItem.type === "area" ||
            (layoutItem.type === "area_row" &&
                layoutItem.areas &&
                layoutItem.areas.length > 0));
    });

    // Modifier l'useEffect pour les viewports manquants pour utiliser un compteur dédié et éviter les boucles infinies
    const missingViewportAttemptsRef = useRef(0);

    useEffect(() => {
        // Identifier les zones sans viewport
        const missingViewports = validLayoutKeys
            .filter(id => layout[id].type === "area" && !viewportMap[id])
            .map(id => id);

        // Si des viewports sont manquants, les recalculer avec une limitation de tentatives
        if (missingViewports.length > 0 && missingViewportAttemptsRef.current < MAX_RECALCULATION_ATTEMPTS) {
            console.debug(`Calculating missing viewports for ${missingViewports.length} areas (attempt ${missingViewportAttemptsRef.current + 1}/${MAX_RECALCULATION_ATTEMPTS})`);

            missingViewportAttemptsRef.current++;

            setTimeout(() => {
                // Utiliser un setTimeout pour éviter la boucle de rendu
                recalculateViewports();
            }, 0);
        } else if (missingViewports.length > 0) {
            // Lorsqu'on a atteint la limite, on abandonne et on nettoie
            console.warn(`Giving up on calculating missing viewports after ${MAX_RECALCULATION_ATTEMPTS} attempts`);
            // Tenter de nettoyer l'état si on n'arrive pas à calculer les viewports
            dispatch(areaSlice.actions.cleanState());
        } else {
            // Réinitialiser le compteur quand tout est calculé
            missingViewportAttemptsRef.current = 0;
        }
    }, [layout, viewportMap, validLayoutKeys, recalculateViewports, dispatch]);

    // Gérer le rendu d'une zone spécifique avec gestion des viewports manquants
    const renderArea = useCallback((id: string, layoutItem: any) => {
        const areaViewport = viewportMap[id];

        if (!areaViewport) {
            console.debug(`Skipping render for area ${id} - no viewport available`);
            return null;
        }
        return <Area key={id} viewport={areaViewport} id={id} />;
    }, [viewportMap]);

    return (
        <div data-area-root style={{
            background: '#2c3e50',
            position: 'relative',
            height: `calc(100vh - ${TOOLBAR_HEIGHT * 2}px)`,  // Hauteur totale moins MenuBar et StatusBar
            overflow: 'hidden'
        }}>
            {viewport &&
                validLayoutKeys.map((id) => {
                    const layoutItem = layout[id];
                    if (!layoutItem) {
                        return null;
                    }

                    if (layoutItem.type === "area_row") {
                        // Ne pas rendre les séparateurs s'il n'y a pas assez de zones ou de viewports
                        const row = layoutItem as AreaRowLayout;
                        if (!row.areas || row.areas.length < 2 ||
                            row.areas.some(area => !viewportMap[area.id])) {
                            return null;
                        }

                        return (
                            <AreaRowSeparators
                                key={id}
                                areaToViewport={viewportMap}
                                row={layoutItem}
                            />
                        );
                    }

                    return renderArea(id, layoutItem);
                })}
            {joinPreview && joinPreview.areaId && viewportMap[joinPreview.areaId] && (
                <JoinAreaPreview
                    viewport={viewportMap[joinPreview.areaId]}
                    movingInDirection={joinPreview.movingInDirection!}
                />
            )}
            <AreaToOpenPreview areaToViewport={viewportMap} />
            <div className={s("cursorCapture", { active: !!joinPreview })} />
        </div>
    );
};

export const AreaRoot = AreaRootComponent; 
