// import { useAppDispatch } from '@gamesberry/karmyc-core/hooks'; // Comment out Redux hook
// import { addHistoryEntry, hasFutureEntriesForSpace, hasPastEntriesForSpace, redo, undo } from '@gamesberry/karmyc-core/store/slices/historySlice'; // Comment out history actions
// import { addDrawingLineToSpace, selectSpaceSharedState, setDrawingLinesForSpace, setDrawingStrokeWidthForSpace, Space } from '@gamesberry/karmyc-core/store/slices/spaceSlice'; // Comment out space slice specific actions/selectors
import { useHistory } from '@gamesberry/karmyc-core/hooks/useHistory'; // Import updated hook
import { AreaState, useAreaStore } from '@gamesberry/karmyc-core/stores/areaStore';
import { Space, SpaceState, useSpaceStore } from '@gamesberry/karmyc-core/stores/spaceStore';
import { AreaComponentProps } from '@gamesberry/karmyc-core/types/areaTypes';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface DrawingState { }

interface Line {
    id: string;
    points: { x: number; y: number }[];
    color: string;
    width: number;
}

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

    const spaces = useSpaceStore((s: SpaceState) => s.getAllSpaces()); // Get spaces from store
    const getSpaceById = useSpaceStore((s: SpaceState) => s.getSpaceById);
    // const currentSpaceId = useSelector((state: RootState) => selectAreaById(id)(state)?.spaceId); // Comment out selector
    // const currentSpaceSharedState = useSelector(selectSpaceSharedState(currentSpaceId ?? null)); // Comment out selector

    // Get history functions from the updated hook - Now using Area history
    const { undoArea, redoArea, canUndoArea, canRedoArea } = useHistory();

    // --- State Derivation --- 
    // Get the area's own state, which should contain drawing data
    const areaInternalState = currentArea?.state ?? {};
    const drawingLines: Line[] = areaInternalState.lines ?? [];
    const drawingStrokeWidth = areaInternalState.strokeWidth ?? 3;
    const drawingColor = areaInternalState.currentColor ?? '#000000'; // Or maybe get from space shared state?

    const currentSpaceId = currentArea?.spaceId ?? null; // Still needed for space selection UI
    const currentSpace = currentSpaceId ? getSpaceById(currentSpaceId) : null;
    // Example: Get shared color from space if available, otherwise fallback
    const spaceColor = currentSpace?.sharedState?.color ?? drawingColor; // Use space color or area color

    const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
    const [localStrokeWidth, setLocalStrokeWidth] = useState(drawingStrokeWidth);

    // const canUndo = useSelector((state: RootState) => hasPastEntriesForSpace(state, currentSpaceId ?? null)); // Comment out selector
    // const canRedo = useSelector((state: RootState) => hasFutureEntriesForSpace(state, currentSpaceId ?? null)); // Comment out selector
    // Use canUndoSpace/canRedoSpace from useHistory hook directly

    // ... (useEffect for selectedSpaceId can be removed or adapted if setAreaSpace works differently) ...
    // useEffect(() => {
    //     setSelectedSpaceId(currentSpaceId ?? null);
    // }, [currentSpaceId]);

    useEffect(() => {
        setLocalStrokeWidth(drawingStrokeWidth);
    }, [drawingStrokeWidth]);

    useEffect(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const drawAreaHeight = Math.max(0, viewport.height - 50); // Ensure non-negative height
        canvas.width = viewport.width;
        canvas.height = drawAreaHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawingLines.forEach((line: Line) => {
            if (line.points.length < 2) return;
            ctx.beginPath();
            ctx.moveTo(line.points[0].x, line.points[0].y);
            for (let i = 1; i < line.points.length; i++) {
                ctx.lineTo(line.points[i].x, line.points[i].y);
            }
            ctx.strokeStyle = line.color;
            ctx.lineWidth = line.width;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
        });
    }, [drawingLines, viewport.width, viewport.height]);

    useEffect(() => {
        setSelectedSpaceId(currentSpaceId);
    }, [currentSpaceId]);

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setIsDrawing(true);
        setCurrentLinePoints([{ x, y }]);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const newPoints = [...currentLinePoints, { x, y }];
        setCurrentLinePoints(newPoints);

        // Draw the current segment being dragged
        const ctx = canvas.getContext('2d');
        if (!ctx || newPoints.length < 2) return;
        const prevPoint = newPoints[newPoints.length - 2];
        ctx.beginPath();
        ctx.moveTo(prevPoint.x, prevPoint.y);
        ctx.lineTo(x, y);
        ctx.strokeStyle = spaceColor;
        ctx.lineWidth = localStrokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    };

    const handleMouseUp = () => {
        if (!isDrawing || currentLinePoints.length < 2) {
            setIsDrawing(false);
            setCurrentLinePoints([]);
            return;
        }
        setIsDrawing(false);

        const newLine: Line = {
            id: `line-${Date.now()}`,
            points: currentLinePoints,
            color: drawingColor, // Use area's color state
            width: localStrokeWidth
        };

        // Get the current lines from the area's internal state
        const currentLines = currentArea?.state?.lines ?? [];
        const newLines = [...currentLines, newLine];

        // Update the area's internal state using the Zustand action
        updateArea({
            id: id, // The ID of the current area
            state: {
                ...currentArea?.state, // Preserve other potential state properties
                lines: newLines // Set the updated lines array
            }
        });

        console.log(`[HistoryDrawingArea] Updated area ${id} state with new line. Total lines: ${newLines.length}`);

        // // We no longer need to update space shared state here for drawing
        // if (currentSpaceId) {
        //    const prevLines = currentSpace?.sharedState?.drawingLines ?? [];
        //    updateSharedState(currentSpaceId, { drawingLines: [...prevLines, newLine] });
        // }

        setCurrentLinePoints([]);
    };

    const handleStrokeWidthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newWidth = parseInt(e.target.value);
        setLocalStrokeWidth(newWidth);

        // Update the area's internal state with the new stroke width
        updateArea({
            id: id,
            state: {
                ...currentArea?.state,
                strokeWidth: newWidth
            }
        });
        console.log(`[HistoryDrawingArea] Updated area ${id} state with new strokeWidth: ${newWidth}`);

        // // No longer update shared state directly for this
        // if (currentSpaceId) {
        //     updateSharedState(currentSpaceId, { drawingStrokeWidth: newWidth });
        // }
    }, [id, currentArea?.state, updateArea]); // Update dependencies

    const handleClearCanvas = useCallback(() => {
        // Update the area's internal state to have no lines
        updateArea({
            id: id,
            state: {
                ...currentArea?.state,
                lines: []
            }
        });
        console.log(`[HistoryDrawingArea] Cleared lines for area ${id}`);

        // // No longer update shared state directly for this
        // if (currentSpaceId) {
        //     updateSharedState(currentSpaceId, { drawingLines: [] });
        // }

        // Canvas clearing is handled by the useEffect watching drawingLines
    }, [id, currentArea?.state, updateArea]); // Update dependencies

    const handleSpaceChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
        const newSpaceId = event.target.value || null;
        setSelectedSpaceId(newSpaceId);
        // Update the area's spaceId using the Zustand store action
        updateArea({ id: id, spaceId: newSpaceId });
        console.log(`Area ${id} spaceId updated to ${newSpaceId}`);
    }, [id, updateArea]); // Update dependencies

    const handleUndo = useCallback(() => {
        if (undoArea) {
            undoArea();
        }
    }, [undoArea]);

    const handleRedo = useCallback(() => {
        if (redoArea) {
            redoArea();
        }
    }, [redoArea]);

    // Populate space options for the dropdown
    const spaceOptions = useMemo(() => {
        return Object.entries(spaces || {}).map(([spaceId, space]) => (
            <option key={spaceId} value={spaceId}>
                {(space as Space).name} {/* Use imported Space type */}
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
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={handleUndo} disabled={!canUndoArea}>Undo Area</button>
                    <button onClick={handleRedo} disabled={!canRedoArea}>Redo Area</button>
                    <button onClick={handleClearCanvas}>Clear</button>
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
                {/* Add color picker or other controls as needed */}
            </div>
            <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp} // End drawing if mouse leaves canvas
                style={{ display: 'block' }} // Ensure canvas takes block display
            />
        </div>
    );
}; 
