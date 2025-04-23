import { useAppDispatch } from '@gamesberry/karmyc-core/hooks';
import { useArea } from '@gamesberry/karmyc-core/hooks/useArea';
import { useSpace } from '@gamesberry/karmyc-core/hooks/useSpace';
import { RootState } from '@gamesberry/karmyc-core/store';
import { selectAreaById } from '@gamesberry/karmyc-core/store/slices/areaSlice';
import { addHistoryEntry, hasFutureEntriesForSpace, hasPastEntriesForSpace, redo, undo } from '@gamesberry/karmyc-core/store/slices/historySlice';
import { addDrawingLineToSpace, selectSpaceSharedState, setDrawingLinesForSpace, setDrawingStrokeWidthForSpace, Space } from '@gamesberry/karmyc-core/store/slices/spaceSlice';
import { AreaComponentProps } from '@gamesberry/karmyc-core/types/areaTypes';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

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
    const dispatch = useAppDispatch();
    const { setAreaSpace } = useArea();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentLinePoints, setCurrentLinePoints] = useState<{ x: number; y: number }[]>([]);

    const { spaces } = useSpace();
    const currentSpaceId = useSelector((state: RootState) => selectAreaById(id)(state)?.spaceId);
    const currentSpaceSharedState = useSelector(selectSpaceSharedState(currentSpaceId ?? null));

    const drawingLines = currentSpaceSharedState?.drawingLines ?? [];
    const drawingStrokeWidth = currentSpaceSharedState?.drawingStrokeWidth ?? 3;
    const drawingColor = currentSpaceSharedState?.color ?? '#000000';

    const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
    const [localStrokeWidth, setLocalStrokeWidth] = useState(drawingStrokeWidth);

    const canUndo = useSelector((state: RootState) => hasPastEntriesForSpace(state, currentSpaceId ?? null));
    const canRedo = useSelector((state: RootState) => hasFutureEntriesForSpace(state, currentSpaceId ?? null));

    useEffect(() => {
        setSelectedSpaceId(currentSpaceId ?? null);
    }, [currentSpaceId]);

    useEffect(() => {
        setLocalStrokeWidth(drawingStrokeWidth);
    }, [drawingStrokeWidth]);

    useEffect(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height - 50;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawingLines.forEach(line => {
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

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!currentSpaceId || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setIsDrawing(true);
        setCurrentLinePoints([{ x, y }]);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !currentSpaceId || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setCurrentLinePoints(prev => [...prev, { x, y }]);

        const ctx = canvas.getContext('2d');
        if (!ctx || currentLinePoints.length < 1) return;
        const lastPoint = currentLinePoints[currentLinePoints.length - 1];
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(x, y);
        ctx.strokeStyle = drawingColor;
        ctx.lineWidth = localStrokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    };

    const handleMouseUp = () => {
        if (!isDrawing || !currentSpaceId || currentLinePoints.length < 2) {
            setIsDrawing(false);
            setCurrentLinePoints([]);
            return;
        }
        setIsDrawing(false);

        const newLine: Line = {
            id: `line-${Date.now()}`,
            points: currentLinePoints,
            color: drawingColor,
            width: localStrokeWidth
        };

        const prevSharedState = currentSpaceSharedState ?? { drawingLines: [], drawingStrokeWidth: localStrokeWidth, color: drawingColor };
        const nextSharedState = {
            ...prevSharedState,
            drawingLines: [...(prevSharedState.drawingLines ?? []), newLine]
        };

        dispatch(addDrawingLineToSpace({ spaceId: currentSpaceId, line: newLine }));

        dispatch(addHistoryEntry({
            name: 'drawing/addLine',
            prevState: prevSharedState,
            nextState: nextSharedState,
            metadata: { spaceId: currentSpaceId }
        }));

        setCurrentLinePoints([]);
    };

    const handleStrokeWidthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (!currentSpaceId) return;
        const newWidth = parseInt(e.target.value);
        setLocalStrokeWidth(newWidth);

        const prevSharedState = currentSpaceSharedState ?? { drawingLines: [], drawingStrokeWidth: localStrokeWidth, color: drawingColor };
        const nextSharedState = { ...prevSharedState, drawingStrokeWidth: newWidth };

        dispatch(setDrawingStrokeWidthForSpace({ spaceId: currentSpaceId, width: newWidth }));

        dispatch(addHistoryEntry({
            name: 'drawing/changeStrokeWidth',
            prevState: prevSharedState,
            nextState: nextSharedState,
            metadata: { spaceId: currentSpaceId }
        }));
    }, [currentSpaceId, currentSpaceSharedState, localStrokeWidth, drawingColor, dispatch]);

    const handleClearCanvas = useCallback(() => {
        if (!currentSpaceId || drawingLines.length === 0) return;

        const prevSharedState = currentSpaceSharedState ?? { drawingLines: [], drawingStrokeWidth: localStrokeWidth, color: drawingColor };
        const nextSharedState = { ...prevSharedState, drawingLines: [] };

        dispatch(setDrawingLinesForSpace({ spaceId: currentSpaceId, lines: [] }));

        dispatch(addHistoryEntry({
            name: 'drawing/clearCanvas',
            prevState: prevSharedState,
            nextState: nextSharedState,
            metadata: { spaceId: currentSpaceId }
        }));
    }, [currentSpaceId, currentSpaceSharedState, localStrokeWidth, drawingColor, drawingLines, dispatch]);

    const handleSpaceChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
        const newSpaceId = event.target.value || null;
        setSelectedSpaceId(newSpaceId);
        setAreaSpace(id, newSpaceId);
    }, [id, setAreaSpace]);

    const handleUndo = useCallback(() => {
        if (currentSpaceId) {
            dispatch(undo({ spaceId: currentSpaceId }));
        }
    }, [dispatch, currentSpaceId]);

    const handleRedo = useCallback(() => {
        if (currentSpaceId) {
            dispatch(redo({ spaceId: currentSpaceId }));
        }
    }, [dispatch, currentSpaceId]);

    const spaceOptions = Object.entries(spaces || {}).map(([spaceId, space]) => (
        <option key={spaceId} value={spaceId}>
            {(space as Space).name}
        </option>
    ));

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
                    {currentSpaceId && (
                        <span title={`Couleur de l'espace: ${drawingColor}`}
                            style={{
                                marginLeft: '4px',
                                display: 'inline-block',
                                width: '16px',
                                height: '16px',
                                backgroundColor: drawingColor,
                                border: '1px solid grey',
                                borderRadius: '2px'
                            }}>
                        </span>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <label htmlFor={`stroke-${id}`}>Épaisseur:</label>
                    <input
                        id={`stroke-${id}`}
                        type="range"
                        min="1"
                        max="20"
                        value={localStrokeWidth}
                        onChange={handleStrokeWidthChange}
                        disabled={!currentSpaceId}
                        style={{ width: '80px' }}
                    />
                    <span style={{ minWidth: '25px' }}>{localStrokeWidth}px</span>
                </div>

                <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
                    <button
                        onClick={handleUndo}
                        disabled={!canUndo}
                        style={{
                            padding: '4px 8px',
                            background: canUndo ? '#1890ff' : '#d9d9d9',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: canUndo ? 'pointer' : 'not-allowed'
                        }}
                    >
                        Annuler
                    </button>

                    <button
                        onClick={handleRedo}
                        disabled={!canRedo}
                        style={{
                            padding: '4px 8px',
                            background: canRedo ? '#1890ff' : '#d9d9d9',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: canRedo ? 'pointer' : 'not-allowed'
                        }}
                    >
                        Rétablir
                    </button>

                    <button
                        onClick={handleClearCanvas}
                        disabled={!currentSpaceId || drawingLines.length === 0}
                        style={{
                            padding: '4px 8px',
                            background: (currentSpaceId && drawingLines.length > 0) ? '#ff4d4f' : '#d9d9d9',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: (currentSpaceId && drawingLines.length > 0) ? 'pointer' : 'not-allowed'
                        }}
                    >
                        Effacer tout
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, position: 'relative', background: '#f5f5f5' }}>
                <canvas
                    ref={canvasRef}
                    onMouseDown={currentSpaceId ? handleMouseDown : undefined}
                    onMouseMove={currentSpaceId ? handleMouseMove : undefined}
                    onMouseUp={currentSpaceId ? handleMouseUp : undefined}
                    onMouseLeave={currentSpaceId ? handleMouseUp : undefined}
                    style={{ display: 'block' }}
                />
                {!currentSpaceId && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(245,245,245,0.8)', pointerEvents: 'none', fontStyle: 'italic', color: '#666' }}>
                        Veuillez sélectionner un espace pour dessiner.
                    </div>
                )}
            </div>
        </div>
    );
}; 
