// import { useAppDispatch } from '@gamesberry/karmyc-core/hooks'; // Comment out Redux hook
// import { addHistoryEntry, hasFutureEntriesForSpace, hasPastEntriesForSpace, redo, undo } from '@gamesberry/karmyc-core/store/slices/historySlice'; // Comment out history actions
// import { addDrawingLineToSpace, selectSpaceSharedState, setDrawingLinesForSpace, setDrawingStrokeWidthForSpace, Space } from '@gamesberry/karmyc-core/store/slices/spaceSlice'; // Comment out space slice specific actions/selectors
import { useSpace } from '@gamesberry/karmyc-core/hooks/useSpace'; // Re-introduce useSpace
import { AreaState, useAreaStore } from '@gamesberry/karmyc-core/stores/areaStore';
import { Space, SpaceState, useSpaceStore } from '@gamesberry/karmyc-core/stores/spaceStore';
import { AreaComponentProps } from '@gamesberry/karmyc-core/types/areaTypes';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { shallow } from 'zustand/shallow'; // Import shallow
import { useStoreWithEqualityFn } from 'zustand/traditional'; // Import hook with equality function support
// Import Line using package alias
import { SpaceSharedState } from '@gamesberry/karmyc-core/stores/spaceStore'; // Import the actual type
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
    const updateArea = useAreaStore((s: AreaState) => s.updateArea); // Use Zustand store action
    const currentArea = useAreaStore((s: AreaState) => s.getAreaById(id)); // Get current area data
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

    // Read shared state and history status reactively
    const { spaceSharedState, canUndoSpace, canRedoSpace } = useStoreWithEqualityFn(
        useSpaceStore,
        (state): SelectedSpaceHistoryState => {
            const currentSpace = currentSpaceId ? state.spaces[currentSpaceId] : null;
            // Use default structure if space or sharedState is missing
            const shared = currentSpace?.sharedState ?? defaultSelectedSpaceHistoryState.spaceSharedState;
            return {
                // Ensure the returned shared state conforms to SpaceSharedState
                spaceSharedState: {
                    ...defaultSelectedSpaceHistoryState.spaceSharedState, // Ensure all keys exist
                    ...shared, // Overwrite with actual values
                },
                canUndoSpace: (shared.pastDiffs?.length ?? 0) > 0,
                canRedoSpace: (shared.futureDiffs?.length ?? 0) > 0,
            };
        },
        shallow // Compare the { spaceSharedState, canUndo, canRedo } object shallowly
    );

    // Derive drawing properties from the reactive spaceSharedState object
    const drawingLines: Line[] = spaceSharedState.lines;
    const drawingStrokeWidth = spaceSharedState.strokeWidth;
    const drawingColor = spaceSharedState.color;

    // Local UI state
    const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
    const [localStrokeWidth, setLocalStrokeWidth] = useState(defaultSelectedSpaceHistoryState.spaceSharedState.strokeWidth);
    const [localColor, setLocalColor] = useState(defaultSelectedSpaceHistoryState.spaceSharedState.color);

    // Sync local stroke width when drawingStrokeWidth from space state changes
    useEffect(() => {
        setLocalStrokeWidth(drawingStrokeWidth);
    }, [drawingStrokeWidth]);

    useEffect(() => {
        setLocalColor(drawingColor);
    }, [drawingColor]);

    // Sync selected space ID dropdown when area's spaceId changes
    useEffect(() => {
        setSelectedSpaceId(currentSpaceId);
    }, [currentSpaceId]);

    // Redraw canvas when drawingLines (from reactive space state) or viewport changes
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
        if (!Array.isArray(drawingLines)) {
            console.error(`[HistoryDrawingArea ${id}] Invalid drawingLines data detected (not an array):`, drawingLines);
            return; // Stop drawing if data is invalid
        }

        drawingLines.forEach((line: Line | null | undefined, index: number) => { // Allow null/undefined for checking
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
    }, [drawingLines, viewport.width, viewport.height]);

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
        ctx.strokeStyle = drawingColor; // Use reactive color from space state for preview
        ctx.lineWidth = drawingStrokeWidth; // Use reactive width for preview consistency
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
            color: drawingColor, // Use reactive color from space state
            width: drawingStrokeWidth  // Use reactive width from space state
        };

        const currentLines = spaceSharedState.lines ?? [];
        const newLines = [...currentLines, newLine];

        updateSharedState(currentSpaceId, { lines: newLines });
        setCurrentLinePoints([]);
    };

    const handleStrokeWidthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (!currentSpaceId) return;
        const newWidth = parseInt(e.target.value);
        setLocalStrokeWidth(newWidth);
        updateSharedState(currentSpaceId, { strokeWidth: newWidth });
    }, [currentSpaceId, updateSharedState]);

    const handleColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (!currentSpaceId) return;
        const newColor = e.target.value;
        setLocalColor(newColor);
        updateSharedState(currentSpaceId, { color: newColor });
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
