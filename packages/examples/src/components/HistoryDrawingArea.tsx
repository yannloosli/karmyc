// import { useAppDispatch } from '@gamesberry/karmyc-core/hooks'; // Comment out Redux hook
// import { addHistoryEntry, hasFutureEntriesForSpace, hasPastEntriesForSpace, redo, undo } from '@gamesberry/karmyc-core/store/slices/historySlice'; // Comment out history actions
// import { addDrawingLineToSpace, selectSpaceSharedState, setDrawingLinesForSpace, setDrawingStrokeWidthForSpace, Space } from '@gamesberry/karmyc-core/store/slices/spaceSlice'; // Comment out space slice specific actions/selectors
import { useSpace } from '@gamesberry/karmyc-core/hooks/useSpace'; // Re-introduce useSpace
import { useKarmycStore } from '@gamesberry/karmyc-core/stores/areaStore';
import { Space, SpaceSharedState, SpaceState, useSpaceStore } from '@gamesberry/karmyc-core/stores/spaceStore';
import { AreaComponentProps } from '@gamesberry/karmyc-core/types/areaTypes';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { shallow } from 'zustand/shallow'; // Import shallow
import { useStoreWithEqualityFn } from 'zustand/traditional'; // Import useStoreWithEqualityFn
// Import Line using package alias
import { Line } from '@gamesberry/karmyc-core/types/drawingTypes';

// Keep DrawingState interface if needed, or remove if unused
interface DrawingState { } // Re-added, remove if truly unused

// Define a type for the object returned by the selector
interface SelectedSpaceHistoryState {
    spaceSharedState: SpaceSharedState;
    canUndoSpace: boolean;
    canRedoSpace: boolean;
}

// Define a default value for the entire selected object
const defaultSelectedSpaceHistoryState: SelectedSpaceHistoryState = {
    spaceSharedState: {
        lines: [],
        strokeWidth: 3,
        color: '#000000',
        pastDiffs: [],
        futureDiffs: [],
    },
    canUndoSpace: false,
    canRedoSpace: false,
};

export const HistoryDrawingArea: React.FC<AreaComponentProps<DrawingState>> = ({
    id,
    viewport
}) => {
    // const dispatch = useAppDispatch(); // Comment out dispatch
    const updateArea = useKarmycStore(state => state.updateArea);
    const currentArea = useKarmycStore(state => {
        const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
        return activeScreenAreas ? activeScreenAreas.areas[id] : undefined;
    });
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentLinePoints, setCurrentLinePoints] = useState<{ x: number; y: number }[]>([]);

    const spaces = useSpaceStore((s: SpaceState) => s.spaces); // Get all spaces for dropdown
    // const getSpaceById = useSpaceStore((s: SpaceState) => s.getSpaceById); // Not needed reactively here
    const { updateSharedState } = useSpace();

    // Get history functions for BOTH stores from the hook
    // const {
    //     undoArea, redoArea, canUndoArea, canRedoArea, // For area-specific history (like changing spaceId)
    // } = useHistory();

    // Get history actions directly from space store
    const undoSharedState = useSpaceStore(state => state.undoSharedState);
    const redoSharedState = useSpaceStore(state => state.redoSharedState);

    // --- State Derivation --- 
    const currentSpaceId = currentArea?.spaceId ?? null;

    // --- State Locaux --- 
    const [localLines, setLocalLines] = useState<Line[]>([]);
    const [localStrokeWidth, setLocalStrokeWidth] = useState(defaultSelectedSpaceHistoryState.spaceSharedState.strokeWidth);
    const [localColor, setLocalColor] = useState(defaultSelectedSpaceHistoryState.spaceSharedState.color);
    const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);

    // --- Lecture de l'historique seulement (réactif) --- 
    const { pastDiffs, futureDiffs } = useStoreWithEqualityFn(
        useSpaceStore,
        (state: SpaceState) => {
            const currentSpace = currentSpaceId ? state.spaces[currentSpaceId] : null;
            return {
                pastDiffs: currentSpace?.sharedState?.pastDiffs ?? [],
                futureDiffs: currentSpace?.sharedState?.futureDiffs ?? []
            }
        },
        shallow
    );
    const canUndoSpace = pastDiffs.length > 0;
    const canRedoSpace = futureDiffs.length > 0;

    // --- Subscribe Effect (Met à jour TOUT l'état local pertinent) --- 
    useEffect(() => {
        if (!currentSpaceId) {
            setLocalLines([]);
            setLocalColor(defaultSelectedSpaceHistoryState.spaceSharedState.color);
            setLocalStrokeWidth(defaultSelectedSpaceHistoryState.spaceSharedState.strokeWidth);
            return;
        }
        // Sync initiale
        const initialSharedState = useSpaceStore.getState().spaces[currentSpaceId]?.sharedState;
        setLocalLines(initialSharedState?.lines ?? []);
        setLocalColor(initialSharedState?.color ?? defaultSelectedSpaceHistoryState.spaceSharedState.color);
        setLocalStrokeWidth(initialSharedState?.strokeWidth ?? defaultSelectedSpaceHistoryState.spaceSharedState.strokeWidth);

        // Abonnement
        const unsubscribe = useSpaceStore.subscribe(
            (state: SpaceState, prevState: SpaceState) => {
                const currentSpace = state.spaces[currentSpaceId]; // Get current space state
                const currentStoreLines = currentSpace?.sharedState?.lines;
                const previousStoreLines = prevState.spaces[currentSpaceId]?.sharedState?.lines;

                if (currentStoreLines !== previousStoreLines) {
                    // Lire l'état frais complet du space au moment de la notification
                    const freshSharedState = currentSpace?.sharedState;
                    // Mettre à jour directement l'état local
                    setLocalLines(freshSharedState?.lines ?? []);
                    // Optionnel: Mettre aussi à jour couleur/largeur locales pour assurer la synchro complète
                    setLocalColor(freshSharedState?.color ?? defaultSelectedSpaceHistoryState.spaceSharedState.color);
                    setLocalStrokeWidth(freshSharedState?.strokeWidth ?? defaultSelectedSpaceHistoryState.spaceSharedState.strokeWidth);
                }
            }
        );

        // Nettoyer l'abonnement
        return () => {
            unsubscribe();
        };

    }, [currentSpaceId, id]);

    // --- Sync local UI pour le dropdown seulement --- 
    useEffect(() => { setSelectedSpaceId(currentSpaceId); }, [currentSpaceId]);

    // --- Redraw canvas based on LOCAL lines --- 
    useEffect(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const drawAreaHeight = Math.max(0, viewport.height - 50);
        canvas.width = viewport.width;
        canvas.height = drawAreaHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Add check for valid drawingLines array
        if (!Array.isArray(localLines)) {
            console.error(`[HistoryDrawingArea ${id}] Invalid drawingLines data detected (not an array):`, localLines);
            return; // Stop drawing if data is invalid
        }

        localLines.forEach((line: Line | null | undefined, index: number) => { // Allow null/undefined for checking
            // *** Add check for valid line object and points array ***
            if (!line || !Array.isArray(line.points) || line.points.length < 1) {
                console.warn(`[HistoryDrawingArea ${id}] Skipping invalid line data at index ${index}:`, line);
                return; // Skip this iteration if line or points are invalid
            }
            // Check points length again for safety before accessing index 0
            if (line.points.length < 2) return;

            ctx.beginPath();
            // Access points only after validation
            ctx.moveTo(line.points[0].x, line.points[0].y);
            for (let i = 1; i < line.points.length; i++) {
                // Check individual points for safety? Might be overkill
                if (line.points[i]) {
                    ctx.lineTo(line.points[i].x, line.points[i].y);
                }
            }
            ctx.strokeStyle = line.color;
            ctx.lineWidth = line.width;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
        });
    }, [localLines, viewport.width, viewport.height, id]);

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current || !currentSpaceId) return;
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setIsDrawing(true);
        setCurrentLinePoints([{ x, y }]);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !canvasRef.current || !currentSpaceId) return;
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const newPoints = [...currentLinePoints, { x, y }];
        setCurrentLinePoints(newPoints);

        const ctx = canvas.getContext('2d');
        if (!ctx || newPoints.length < 2) return;
        const prevPoint = newPoints[newPoints.length - 2];
        ctx.beginPath();
        ctx.moveTo(prevPoint.x, prevPoint.y);
        ctx.lineTo(x, y);
        ctx.strokeStyle = localColor; // Use reactive color from space state for preview
        ctx.lineWidth = localStrokeWidth; // Use reactive width for preview consistency
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    };

    const handleMouseUp = () => {
        if (!isDrawing || currentLinePoints.length < 2 || !currentSpaceId) {
            setIsDrawing(false);
            setCurrentLinePoints([]);
            return;
        }
        setIsDrawing(false);

        const newLine: Line = {
            id: `line-${Date.now()}`,
            points: currentLinePoints,
            color: localColor,
            width: localStrokeWidth
        };

        const currentLines = useSpaceStore.getState().spaces[currentSpaceId]?.sharedState?.lines ?? [];
        const newLines = [...currentLines, newLine];

        updateSharedState(currentSpaceId, { lines: newLines });
        setCurrentLinePoints([]);
    };

    // --- Handlers pour les contrôles UI (utilisent/mettent à jour l'état local ET le store) --- 
    const handleStrokeWidthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (!currentSpaceId) return;
        const newWidth = parseInt(e.target.value);
        setLocalStrokeWidth(newWidth); // Met à jour UI locale immédiatement
        updateSharedState(currentSpaceId, { strokeWidth: newWidth }); // Met à jour le store central
    }, [currentSpaceId, updateSharedState]);

    const handleColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (!currentSpaceId) return;
        const newColor = e.target.value;
        setLocalColor(newColor); // Met à jour UI locale immédiatement
        updateSharedState(currentSpaceId, { color: newColor }); // Met à jour le store central
    }, [currentSpaceId, updateSharedState]);

    const handleClearCanvas = useCallback(() => {
        if (!currentSpaceId) return;
        updateSharedState(currentSpaceId, { lines: [] });
    }, [currentSpaceId, updateSharedState]);

    // Affects Area state -> uses Area undo/redo
    const handleSpaceChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
        const newSpaceId = event.target.value || null;
        setSelectedSpaceId(newSpaceId);
        updateArea({ id: id, spaceId: newSpaceId });
    }, [id, updateArea]);

    // *** Use new space-specific history actions ***
    const handleUndoDrawing = useCallback(() => {
        if (currentSpaceId) {
            undoSharedState(currentSpaceId);
        }
    }, [currentSpaceId, undoSharedState]);

    const handleRedoDrawing = useCallback(() => {
        if (currentSpaceId) {
            redoSharedState(currentSpaceId);
        }
    }, [currentSpaceId, redoSharedState]);

    // Populate space options using reactive `spaces` object
    const spaceOptions = useMemo(() => {
        return Object.entries(spaces || {}).map(([spaceId, space]) => (
            <option key={spaceId} value={spaceId}>
                {(space as Space).name}
            </option>
        ));
    }, [spaces]);

    return (
        <div style={{
            width: viewport.width,
            height: viewport.height,
            display: 'flex',
            flexDirection: 'column',
            background: '#ffffff',
            borderRadius: '4px',
            overflow: 'hidden'
        }}>
            <div style={{
                padding: '8px',
                borderBottom: '1px solid #e8e8e8',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <label htmlFor={`space-select-${id}`}>Espace:</label>
                    <select
                        id={`space-select-${id}`}
                        value={selectedSpaceId ?? ''}
                        onChange={handleSpaceChange}
                        style={{ padding: '4px', minWidth: '100px' }}
                    >
                        <option value="">-- Aucun espace --</option>
                        {spaceOptions}
                    </select>
                    {/* <button onClick={undoArea} disabled={!canUndoArea}>Undo Area Action</button> */}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={handleUndoDrawing} disabled={!canUndoSpace}>Undo Drawing</button>
                    <button onClick={handleRedoDrawing} disabled={!canRedoSpace}>Redo Drawing</button>
                    <button onClick={handleClearCanvas}>Clear Drawing</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <label htmlFor={`stroke-width-${id}`}>Width:</label>
                    <input
                        id={`stroke-width-${id}`}
                        type="range"
                        min="1"
                        max="20"
                        value={localStrokeWidth}
                        onChange={handleStrokeWidthChange}
                    />
                    <span>{localStrokeWidth}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <label htmlFor={`color-picker-${id}`}>Color:</label>
                    <input
                        id={`color-picker-${id}`}
                        type="color"
                        value={localColor}
                        onChange={handleColorChange}
                    />
                </div>
            </div>
            <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ display: 'block' }}
            />
        </div>
    );
}; 
