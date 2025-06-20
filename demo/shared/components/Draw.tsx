import { useCallback, useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { BrushCleaning, Radius, Redo, Undo } from 'lucide-react';
import { AreaComponentProps } from '../../../src/types/areaTypes';
import { useSpace } from '../../../src/hooks';
import { useKarmycStore } from '../../../src/core/store';
import { useSpaceStore, SpaceSharedState } from '../../../src/core/spaceStore';
import { useToolsSlot } from '../../../src/components/ToolsSlot';
import { useRegisterActionHandler } from '../../../src/hooks/useRegisterActionHandler';
import { actionRegistry } from '../../../src/core/registries/actionRegistry';
import { t } from '../../../src/core/utils/translation';
import React from 'react';

interface DrawingState { }

export interface DrawSharedState extends SpaceSharedState {
    lines: Line[];
    strokeWidth: number;
}

export interface Line {
    id: string;
    points: { x: number; y: number }[];
    color: string;
    width: number;
}
    
// Define a default value for the entire selected object
const defaultSharedState: DrawSharedState = {
    lines: [],
    strokeWidth: 3,
    pastDiffs: [],
    futureDiffs: [],
};

export const Draw: React.FC<AreaComponentProps<DrawingState>> = ({
    id,
    viewport
}) => {
    const currentArea = useKarmycStore(state => {
        const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
        return activeScreenAreas ? activeScreenAreas.areas[id] : undefined;
    });
    const currentSpaceId = currentArea?.spaceId ?? null;
    const { updateSharedState } = useSpace();

    // --- Zustand selectors for reactive state and actions ---
    const { undoSharedState, redoSharedState, getSpaceById } = useSpaceStore();

    const { color, sharedState = defaultSharedState, canUndo, canRedo } = useSpaceStore(useShallow(state => {
        const space = currentSpaceId ? state.spaces[currentSpaceId] : null;
        return {
            color: space?.color ?? '#000000',
            sharedState: (space?.sharedState ?? defaultSharedState) as DrawSharedState,
            canUndo: (space?.sharedState?.pastDiffs?.length ?? 0) > 0,
            canRedo: (space?.sharedState?.futureDiffs?.length ?? 0) > 0,
        }
    }));

    const { lines = [], strokeWidth = 3 } = sharedState;

    // Enregistrement des actions avec historique
    useRegisterActionHandler('draw/addLine', (params) => {
        const { line, spaceId } = params;
        if (!spaceId) return;
        const currentLines = (getSpaceById(spaceId)?.sharedState as DrawSharedState)?.lines ?? [];
        updateSharedState(spaceId, {
            lines: [...currentLines, line],
            actionType: 'draw/addLine',
            payload: { line }
        });
    }, {
        history: {
            enabled: true,
            type: 'draw/addLine',
            getDescription: () => 'Ajout d\'une ligne',
            getPayload: (params) => ({ line: params.line })
        }
    });

    useRegisterActionHandler('draw/updateStrokeWidth', (params) => {
        const { width, spaceId } = params;
        if (!spaceId) return;
        const oldWidth = (getSpaceById(spaceId)?.sharedState as DrawSharedState)?.strokeWidth;
        updateSharedState(spaceId, {
            strokeWidth: width,
            actionType: 'draw/updateStrokeWidth',
            payload: {
                oldValue: oldWidth,
                newValue: width
            }
        });
    }, {
        history: {
            enabled: true,
            type: 'draw/updateStrokeWidth',
            getDescription: (params) => `Modification de l'épaisseur : ${params.oldWidth} → ${params.width}`,
            getPayload: (params) => ({
                oldValue: params.oldWidth,
                newValue: params.width
            })
        }
    });

    useRegisterActionHandler('draw/clearCanvas', (params) => {
        const { spaceId } = params;
        if (!spaceId) return;
        const oldLines = (getSpaceById(spaceId)?.sharedState as DrawSharedState)?.lines ?? [];
        updateSharedState(spaceId, {
            lines: [],
            actionType: 'draw/clearCanvas',
            payload: {
                oldValue: oldLines,
                newValue: []
            }
        });
    }, {
        history: {
            enabled: true,
            type: 'draw/clearCanvas',
            getDescription: () => 'Effacement du dessin',
            getPayload: (params) => ({
                oldValue: (getSpaceById(params.spaceId)?.sharedState as DrawSharedState)?.lines ?? [],
                newValue: []
            })
        }
    });

    const inputRef = useRef<HTMLInputElement>(null);

    const handleStrokeWidthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (!currentSpaceId) return;
        const newWidth = parseInt(e.target.value);
        // Utiliser l'action enregistrée
        actionRegistry.executeAction('draw/updateStrokeWidth', {
            width: newWidth,
            oldWidth: strokeWidth,
            spaceId: currentSpaceId
        });
    }, [currentSpaceId, strokeWidth]);

    const handleClearCanvas = useCallback(() => {
        if (!currentSpaceId) return;
        actionRegistry.executeAction('draw/clearCanvas', {
            spaceId: currentSpaceId
        });
    }, [currentSpaceId]);

    const handleUndo = useCallback(() => {
        if (!currentSpaceId) return;
        undoSharedState(currentSpaceId);
    }, [currentSpaceId, undoSharedState]);

    const handleRedo = useCallback(() => {
        if (!currentSpaceId) return;
        redoSharedState(currentSpaceId);
    }, [currentSpaceId, redoSharedState]);


    const { registerComponent: registerStatusBar } = useToolsSlot(id, 'bottom-outer');
    useEffect(() => {
        registerStatusBar(
            () => {
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'white' }}>
                        <Radius />
                        <input
                            ref={inputRef}
                            id={`stroke-width-${id}`}
                            type="range"
                            min="1"
                            max="20"
                            value={strokeWidth}
                            onChange={handleStrokeWidthChange}
                            style={{
                                width: '100px',
                                cursor: 'pointer',
                                WebkitAppearance: 'none',
                                appearance: 'none',
                                height: '4px',
                                borderRadius: '2px',
                                background: '#ffffff'
                            }}
                            className="custom-range"
                        />
                        <span>{strokeWidth}</span>
                    </div>
                );
            },
            { name: 'topOuterSlot', type: 'menu' },
            { order: 990, width: 'auto', alignment: 'right' }
        );
    }, [id, handleStrokeWidthChange, strokeWidth, registerStatusBar]);

    const { registerComponent: registerBottomToolBar } = useToolsSlot(id, 'bottom-inner');
    useEffect(() => {
        registerBottomToolBar(
            () => {
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button onClick={handleUndo} disabled={!canUndo} title={t('draw.undo', 'Undo')}><Undo /></button>
                        <button onClick={handleRedo} disabled={!canRedo} title={t('draw.redo', 'Redo')}><Redo /></button>
                        <button onClick={handleClearCanvas} title={t('draw.clear', 'Clear drawing')}><BrushCleaning /></button>
                    </div>
                );
            },
            { name: 'bottomInnerSlot', type: 'menu' },
            { order: 990, width: 'auto', alignment: 'center' }
        );
    }, [id, handleUndo, handleRedo, handleClearCanvas, canUndo, canRedo, t, registerBottomToolBar]);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentLinePoints, setCurrentLinePoints] = useState<{ x: number; y: number }[]>([]);

    // --- Redraw canvas based on lines from the store --- 
    useEffect(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const drawAreaHeight = Math.max(0, viewport.height - 50);
        canvas.width = viewport.width;
        canvas.height = drawAreaHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!Array.isArray(lines)) {
            console.error(`[DrawArea ${id}] Invalid drawingLines data detected (not an array):`, lines);
            return;
        }

        lines.forEach((line: Line | null | undefined, index: number) => {
            if (!line || !Array.isArray(line.points) || line.points.length < 2) {
                console.warn(`[DrawArea ${id}] Skipping invalid line data at index ${index}:`, line);
                return;
            }
            ctx.beginPath();
            ctx.moveTo(line.points[0].x, line.points[0].y);
            for (let i = 1; i < line.points.length; i++) {
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
    }, [lines, viewport.width, viewport.height, id]);

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
        ctx.strokeStyle = color;
        ctx.lineWidth = strokeWidth;
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
            color: color,
            width: strokeWidth
        };

        // Utiliser l'action enregistrée
        actionRegistry.executeAction('draw/addLine', {
            line: newLine,
            spaceId: currentSpaceId
        });
        setCurrentLinePoints([]);
    };

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
