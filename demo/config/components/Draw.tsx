import { BrushCleaning, Radius, Redo, Undo } from 'lucide-react';
import { AreaComponentProps, useSpace, useKarmycStore, SpaceSharedState, SpaceState, useSpaceStore, useToolsSlot } from '../../../src';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { shallow } from 'zustand/shallow';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import { useSpaceHistory } from '../../../src/spaces/hooks/useSpaceHistory';
import { useRegisterActionHandler } from '../../../src/core/actions/handlers/useRegisterActionHandler';
import { actionRegistry } from '../../../src/core/actions/handlers/actionRegistry';

interface DrawingState { }

export interface Line {
    id: string;
    points: { x: number; y: number }[];
    color: string;
    width: number;
}

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
        zoom: 1,
        pan: { x: 0, y: 0 }
    },
    canUndoSpace: false,
    canRedoSpace: false,
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

    // Enregistrement des actions avec historique
    useRegisterActionHandler('draw/addLine', (params) => {
        const { line, spaceId } = params;
        if (!spaceId) return;
        const currentLines = useSpaceStore.getState().spaces[spaceId]?.sharedState?.lines ?? [];
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
        const oldWidth = useSpaceStore.getState().spaces[spaceId]?.sharedState?.strokeWidth;
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
        const oldLines = useSpaceStore.getState().spaces[spaceId]?.sharedState?.lines ?? [];
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
                oldValue: useSpaceStore.getState().spaces[params.spaceId]?.sharedState?.lines ?? [],
                newValue: []
            })
        }
    });

    // Utilisation du hook d'historique
    const { canUndo, canRedo, undo, redo } = useSpaceHistory(currentSpaceId, {
        enabled: true,
        maxHistorySize: 50
    });

    // --- State Locaux --- 
    const [localLines, setLocalLines] = useState<Line[]>([]);
    const [localStrokeWidth, setLocalStrokeWidth] = useState(defaultSelectedSpaceHistoryState.spaceSharedState.strokeWidth);
    const [localColor, setLocalColor] = useState(defaultSelectedSpaceHistoryState.spaceSharedState.color);

    const inputRef = useRef<HTMLInputElement>(null);

    const handleStrokeWidthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (!currentSpaceId) return;
        const newWidth = parseInt(e.target.value);
        const oldWidth = useSpaceStore.getState().spaces[currentSpaceId]?.sharedState?.strokeWidth;
        // Utiliser l'action enregistrée
        actionRegistry.executeAction('draw/updateStrokeWidth', { 
            width: newWidth,
            oldWidth,
            spaceId: currentSpaceId
        });
    }, [currentSpaceId]);

    const { registerComponent: registerStatusBar } = useToolsSlot('draw-area', 'bottom-outer');
    useMemo(() => {
        registerStatusBar(
            () => {
                const currentSpace = currentSpaceId ? useSpaceStore.getState().spaces[currentSpaceId] : null;
                const strokeWidth = currentSpace?.sharedState?.strokeWidth ?? defaultSelectedSpaceHistoryState.spaceSharedState.strokeWidth;

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
    }, [currentSpaceId, id, handleStrokeWidthChange]);


    const { registerComponent: registerBottomToolBar } = useToolsSlot('draw-area', 'bottom-inner');
    useMemo(() => {
        registerBottomToolBar(
            () => {
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button onClick={undo} disabled={!canUndo}><Undo /></button>
                        <button onClick={redo} disabled={!canRedo}><Redo /></button>
                        <button onClick={handleClearCanvas}><BrushCleaning /></button>
                    </div>
                );
            },
            { name: 'bottomInnerSlot', type: 'menu' },
            { order: 990, width: 'auto', alignment: 'center' }
        );
    }, [currentSpaceId, id, handleStrokeWidthChange, undo, redo, canUndo, canRedo]);



    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentLinePoints, setCurrentLinePoints] = useState<{ x: number; y: number }[]>([]);

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
                const currentSpace = state.spaces[currentSpaceId];
                const prevSpace = prevState.spaces[currentSpaceId];

                // Vérifier si le strokeWidth a changé
                if (currentSpace?.sharedState?.strokeWidth !== prevSpace?.sharedState?.strokeWidth) {
                    setLocalStrokeWidth(currentSpace?.sharedState?.strokeWidth ?? defaultSelectedSpaceHistoryState.spaceSharedState.strokeWidth);
                }

                // Vérifier si les lignes ont changé
                if (currentSpace?.sharedState?.lines !== prevSpace?.sharedState?.lines) {
                    setLocalLines(currentSpace?.sharedState?.lines ?? []);
                }

                // Vérifier si la couleur a changé
                if (currentSpace?.sharedState?.color !== prevSpace?.sharedState?.color) {
                    setLocalColor(currentSpace?.sharedState?.color ?? defaultSelectedSpaceHistoryState.spaceSharedState.color);
                }
            }
        );

        return () => {
            unsubscribe();
        };
    }, [currentSpaceId]);

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

        // Utiliser l'action enregistrée
        actionRegistry.executeAction('draw/addLine', { 
            line: newLine,
            spaceId: currentSpaceId
        });
        setCurrentLinePoints([]);
    };

    const handleClearCanvas = useCallback(() => {
        if (!currentSpaceId) return;
        // Utiliser l'action enregistrée
        actionRegistry.executeAction('draw/clearCanvas', { 
            spaceId: currentSpaceId
        });
    }, [currentSpaceId]);


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
