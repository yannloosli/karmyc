import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { TOOLBAR_HEIGHT } from "~/constants";
import { useLoadingState } from "../../../hooks/useLoadingState";
import { RootState } from "../../../store";
import { areaSlice } from "../../../store/slices/areaSlice";
import AreaRootStyles from "../../../styles/AreaRoot.styles";
import { AreaRowLayout } from "../../../types/areaTypes";
import { computeAreaToViewport } from "../../../utils/areaToViewport";
import { _setAreaViewport, getAreaRootViewport } from "../../../utils/getAreaViewport";
import { compileStylesheetLabelled } from "../../../utils/stylesheets";
import { LoadingIndicator } from "../../common/LoadingIndicator";
import { EmptyAreaMessage } from '../EmptyAreaMessage';
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
    const { layout, rootId, joinPreview, areaToOpen } = useSelector((state: RootState) => state.area);
    const [viewportMap, setViewportMap] = useState<{ [areaId: string]: Rect }>({});
    const [viewport, setViewport] = useState(getAreaRootViewport());
    const [isLoading, setIsLoading] = useState(false);
    const layoutRef = useRef(layout);
    const rootIdRef = useRef(rootId);
    const dispatch = useDispatch();
    const { isLoading: loadingStateIsLoading } = useLoadingState('area-root');

    // Add a counter to limit recalculations and avoid infinite loops
    const recalculationAttemptsRef = useRef(0);
    const MAX_RECALCULATION_ATTEMPTS = 3;

    // Update refs when layout or rootId changes
    useEffect(() => {
        layoutRef.current = layout;
        rootIdRef.current = rootId;
    }, [layout, rootId]);

    // Function to check structure validity
    const validateAndFixStructure = useCallback(() => {
        // Check if rootId exists in layout
        if (!layout[rootId]) {
            dispatch(areaSlice.actions.cleanState());
            return false;
        }

        return true;
    }, [layout, rootId, dispatch]);

    // Improve recalculateViewports function to handle errors and limit attempts
    const recalculateViewports = useCallback(() => {
        // Check if maximum attempts reached
        if (recalculationAttemptsRef.current >= MAX_RECALCULATION_ATTEMPTS) {
            console.warn(`Maximum recalculation attempts (${MAX_RECALCULATION_ATTEMPTS}) reached, giving up.`);
            return null;
        }

        // Increment attempts counter
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
                        // Check for changes to avoid unnecessary re-renders
                        let hasChanges = false;
                        const filteredMap = { ...newMap };

                        // Remove entries that no longer exist in layout
                        Object.keys(prevMap).forEach(id => {
                            if (!layoutRef.current[id]) {
                                delete filteredMap[id];
                                hasChanges = true;
                            } else if (JSON.stringify(prevMap[id]) !== JSON.stringify(newMap[id])) {
                                hasChanges = true;
                            }
                        });

                        // Check for new IDs
                        Object.keys(newMap).forEach(id => {
                            if (!prevMap[id]) {
                                hasChanges = true;
                            }
                        });

                        // Reset counter if update successful
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
            // Try to clean state in case of error
            dispatch(areaSlice.actions.cleanState());
        }

        return null;
    }, [validateAndFixStructure, dispatch]);

    // Reset counter after each mount or major dependency changes
    useEffect(() => {
        recalculationAttemptsRef.current = 0;
    }, [layout, rootId]);

    // Handle window resize
    useEffect(() => {
        const fn = () => {
            // Ignore updates during active area resizing
            if (window.__AREA_RESIZING__) {
                return;
            }

            recalculateViewports();
        };

        window.addEventListener("resize", fn);
        return () => window.removeEventListener("resize", fn);
    }, [recalculateViewports]);

    // Calculate initial viewports and when layout changes
    useEffect(() => {
        recalculateViewports();
    }, [layout, rootId, recalculateViewports]);

    // Filter layout keys to keep only those that still exist
    const validLayoutKeys = Object.keys(layout).filter(id => {
        const layoutItem = layout[id];
        return layoutItem && (layoutItem.type === "area" ||
            (layoutItem.type === "area_row" &&
                layoutItem.areas &&
                layoutItem.areas.length > 0));
    });

    // Modify the useEffect for missing viewports to use a dedicated counter and avoid infinite loops
    const missingViewportAttemptsRef = useRef(0);

    useEffect(() => {
        // Identify areas without viewport
        const missingViewports = validLayoutKeys
            .filter(id => layout[id].type === "area" && !viewportMap[id])
            .map(id => id);

        // If viewports are missing, recalculate with attempt limitation
        if (missingViewports.length > 0 && missingViewportAttemptsRef.current < MAX_RECALCULATION_ATTEMPTS) {
            console.debug(`Calculating missing viewports for ${missingViewports.length} areas (attempt ${missingViewportAttemptsRef.current + 1}/${MAX_RECALCULATION_ATTEMPTS})`);

            missingViewportAttemptsRef.current++;

            setTimeout(() => {
                // Use setTimeout to avoid render loop
                recalculateViewports();
            }, 0);
        } else if (missingViewports.length > 0) {
            // When limit reached, give up and clean
            console.warn(`Giving up on calculating missing viewports after ${MAX_RECALCULATION_ATTEMPTS} attempts`);
            // Try to clean state if viewports can't be calculated
            dispatch(areaSlice.actions.cleanState());
        } else {
            // Reset counter when everything is calculated
            missingViewportAttemptsRef.current = 0;
        }
    }, [layout, viewportMap, validLayoutKeys, recalculateViewports, dispatch]);

    // Handle specific area rendering with missing viewport management
    const renderArea = useCallback((id: string, layoutItem: any) => {
        const areaViewport = viewportMap[id];

        if (!areaViewport) {
            console.debug(`Skipping render for area ${id} - no viewport available`);
            return null;
        }
        return <Area key={id} viewport={areaViewport} id={id} />;
    }, [viewportMap]);

    // Function to update viewports with loading state management
    const updateViewports = useCallback(async () => {
        if (!rootId) return;

        setIsLoading(true);
        try {
            const newViewportMap = computeAreaToViewport(layout, rootId, viewport);
            setViewportMap(newViewportMap);
            _setAreaViewport(newViewportMap);
        } finally {
            setIsLoading(false);
        }
    }, [layout, rootId, viewport]);

    // Update viewports when layout, rootId or viewport changes
    useEffect(() => {
        updateViewports();
    }, [updateViewports]);

    // Update viewport when window is resized
    useEffect(() => {
        const handleResize = () => {
            setViewport(getAreaRootViewport());
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div data-area-root style={{
            background: '#2c3e50',
            position: 'relative',
            height: `calc(100vh - ${TOOLBAR_HEIGHT * 2}px)`,  // Total height minus MenuBar and StatusBar
            overflow: 'hidden'
        }}>
            {isLoading && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 1000
                }}>
                    <LoadingIndicator size="medium" />
                </div>
            )}
            {Object.keys(layout).length === 0 ? (
                <EmptyAreaMessage />
            ) : (
                rootId && validLayoutKeys.map((id) => {
                    const layoutItem = layout[id];
                    if (!layoutItem) {
                        return null;
                    }

                    if (layoutItem.type === "area_row") {
                        // Don't render separators if there aren't enough areas or viewports
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
                })
            )}
            {joinPreview && joinPreview.areaId && viewportMap[joinPreview.areaId] && (
                <JoinAreaPreview
                    viewport={viewportMap[joinPreview.areaId]}
                    movingInDirection={joinPreview.movingInDirection!}
                />
            )}
            {Object.keys(viewportMap).length > 0 && <AreaToOpenPreview areaToViewport={viewportMap} />}
            <div className={s("cursorCapture", { active: !!joinPreview })} />
        </div>
    );
};

export const AreaRoot = AreaRootComponent; 
