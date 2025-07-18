import { useCallback, useEffect, useRef, useState, useReducer, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { BrushCleaning, Radius, Redo, Undo } from 'lucide-react';
import { AreaComponentProps } from '../../../src/types/areaTypes';
import { useSpace } from '../../../src/hooks';
import { useKarmycStore } from '../../../src/core/store';
import { useSpaceStore, SpaceSharedState } from '../../../src/core/spaceStore';
import { useEnhancedHistory } from '../../../src/hooks/useHistory';
import { useToolsSlot } from '../../../src/components/ToolsSlot';
import { useRegisterActionHandler } from '../../../src/hooks/useRegisterActionHandler';
import { actionRegistry } from '../../../src/core/registries/actionRegistry';
import { t } from '../../../src/core/utils/translation';
import * as React from 'react';

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
}: {
    id: string;
    viewport: { width: number; height: number };
}) => {
    const currentArea = useKarmycStore(state => {
        const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
        return activeScreenAreas ? activeScreenAreas.areas[id] : undefined;
    });
    const currentSpaceId = currentArea?.spaceId ?? null;
    const { updateSharedState } = useSpace();

    // --- Nouveau système d'historique amélioré ---
    const history = currentSpaceId ? useEnhancedHistory(currentSpaceId) : null;

    // --- Zustand selectors for reactive state and actions ---
    const { getSpaceById } = useSpaceStore();

    // Correction de l'accès aux données avec la nouvelle structure
    const { color, lines = [], strokeWidth = 3 } = useSpaceStore(state => {
        const space = currentSpaceId ? state.spaces[currentSpaceId] : null;
        const currentState = space?.sharedState?.currentState || {};
        // Forcer la réactivité en incluant les clés spécifiques
        return {
            color: space?.color ?? '#000000',
            lines: currentState.lines || [],
            strokeWidth: currentState.strokeWidth || 3,
            // Ajouter des clés pour forcer la réactivité
            currentStateKeys: Object.keys(currentState),
            pastActionsLength: space?.sharedState?.pastActions?.length || 0,
            futureActionsLength: space?.sharedState?.futureActions?.length || 0,
        }
    });

    // Debug: Afficher l'état actuel
    useEffect(() => {
        console.log('[Draw] État actuel:', {
            currentSpaceId,
            color,
            lines: lines.length,
            strokeWidth,
            spaceExists: currentSpaceId ? !!getSpaceById(currentSpaceId) : false,
            currentState: currentSpaceId ? getSpaceById(currentSpaceId)?.sharedState?.currentState : null,
            linesContent: lines.slice(0, 3), // Afficher les 3 premières lignes pour debug
            pastActionsLength: currentSpaceId ? getSpaceById(currentSpaceId)?.sharedState?.pastActions?.length || 0 : 0,
            futureActionsLength: currentSpaceId ? getSpaceById(currentSpaceId)?.sharedState?.futureActions?.length || 0 : 0
        });
    }, [currentSpaceId, color, lines, strokeWidth, getSpaceById]);

    // Initialiser l'état par défaut si nécessaire
    useEffect(() => {
        if (currentSpaceId) {
            const space = getSpaceById(currentSpaceId);
            const currentState = space?.sharedState?.currentState || {};
            
            console.log('[Draw] Vérification de l\'état:', {
                spaceId: currentSpaceId,
                hasSpace: !!space,
                currentState,
                hasLines: currentState.hasOwnProperty('lines'),
                hasStrokeWidth: currentState.hasOwnProperty('strokeWidth')
            });
            
            // Vérifier si l'état par défaut doit être initialisé
            if (!currentState.hasOwnProperty('lines') || !currentState.hasOwnProperty('strokeWidth')) {
                console.log('[Draw] Initialisation de l\'état par défaut pour l\'espace:', currentSpaceId);
                updateSharedState(currentSpaceId, {
                    lines: [],
                    strokeWidth: 3
                });
            }
        }
    }, [currentSpaceId, getSpaceById, updateSharedState]);

    // Enregistrement des actions avec historique
    useRegisterActionHandler('draw/addLine', (params) => {
        const { line, spaceId } = params;
        console.log('[Draw] Action draw/addLine appelée:', { line, spaceId });
        if (!spaceId || !history) {
            console.error('[Draw] Pas d\'spaceId fourni ou pas d\'historique disponible pour draw/addLine');
            return;
        }
        
        // Utiliser le nouveau système d'historique
        const currentState = getSpaceById(spaceId)?.sharedState?.currentState || {};
        const currentLines = currentState.lines || [];
        console.log('[Draw] Lignes actuelles:', currentLines.length, 'Nouvelle ligne:', line);
        
        // Créer une action avec le nouveau système d'historique
        const diffs = [{
            type: 'UPDATE',
            path: ['lines'],
            oldValue: currentLines,
            newValue: [...currentLines, line],
            metadata: {
                allowIndexShift: false,
                modifiedRelated: false,
            }
        }];

        const result = history.createSimpleAction(
            'DRAW_ADD_LINE',
            diffs,
            false,
            ['lines', 'drawing']
        );

        console.log('[Draw] createSimpleAction résultat:', result);

        if (result.success) {
            // Mettre à jour l'espace via l'ancien système pour compatibilité
            updateSharedState(spaceId, {
                lines: [...currentLines, line]
            });
            console.log('[Draw] Ligne ajoutée avec succès via le nouveau système d\'historique');
            
            // Vérifier l'état de l'historique après création
            setTimeout(() => {
                console.log('[Draw] État de l\'historique après création d\'action:', {
                    canUndo: history.canUndo(),
                    canRedo: history.canRedo(),
                    stats: history.stats,
                    action: result.action
                });
            }, 50);
        } else {
            console.error('[Draw] Erreur lors de l\'ajout de ligne:', result.error);
            // Fallback vers l'ancien système
            updateSharedState(spaceId, {
                lines: [...currentLines, line]
            });
        }
    });

    useRegisterActionHandler('draw/updateStrokeWidth', (params) => {
        const { width, spaceId } = params;
        if (!spaceId) return;
        
        // Action sans historique - mise à jour directe
        updateSharedState(spaceId, { strokeWidth: width });
        console.log('[Draw] Épaisseur mise à jour sans historique:', width);
    }, {
        history: {
            enabled: false,  // Désactive l'historique pour cette action
            type: 'draw/updateStrokeWidth'
        }
    });

    useRegisterActionHandler('draw/updateColor', (params) => {
        const { color, spaceId } = params;
        if (!spaceId) return;
        
        // Action sans historique - mise à jour directe de la couleur
        const { updateSpaceProperties } = useSpace();
        updateSpaceProperties(spaceId, { color });
        console.log('[Draw] Couleur mise à jour sans historique:', color);
    }, {
        history: {
            enabled: false,  // Désactive l'historique pour cette action
            type: 'draw/updateColor'
        }
    });

    useRegisterActionHandler('draw/clearCanvas', (params) => {
        const { spaceId } = params;
        if (!spaceId || !history) return;
        const currentState = getSpaceById(spaceId)?.sharedState?.currentState || {};
        const oldLines = currentState.lines || [];
        
        // Créer une action avec le nouveau système d'historique
        const diffs = [{
            type: 'UPDATE',
            path: ['lines'],
            oldValue: oldLines,
            newValue: [],
            metadata: {
                allowIndexShift: false,
                modifiedRelated: false,
            }
        }];

        const result = history.createSimpleAction(
            'DRAW_CLEAR_CANVAS',
            diffs,
            false,
            ['lines', 'drawing']
        );

        if (result.success) {
            updateSharedState(spaceId, { lines: [] });
            console.log('[Draw] Canvas effacé avec succès via le nouveau système d\'historique');
        } else {
            console.error('[Draw] Erreur lors de l\'effacement du canvas:', result.error);
            // Fallback vers l'ancien système
            updateSharedState(spaceId, { lines: [] });
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

    // Fonctions undo/redo avec le nouveau système d'historique
    const handleUndo = useCallback(() => {
        if (!history) {
            console.log('[Draw] handleUndo - Pas d\'historique disponible');
            return;
        }
        
        console.log('[Draw] handleUndo - État de l\'historique:', {
            canUndo: history.canUndo(),
            canRedo: history.canRedo(),
            stats: history.stats,
            currentSpaceId
        });
        
        if (!history.canUndo()) {
            console.log('[Draw] handleUndo - Pas d\'action à annuler');
            return;
        }
        
        console.log('[Draw] handleUndo appelé');
        const result = history.undo();
        console.log('[Draw] handleUndo - Résultat:', result);
        
        if (result.success) {
            console.log('[Draw] Action annulée avec succès');
            // Forcer un re-render du canvas
            setTimeout(() => {
                console.log('[Draw] Re-render forcé après undo');
            }, 100);
        } else {
            console.error('[Draw] Erreur lors de l\'annulation:', result.error);
        }
    }, [history, currentSpaceId]);

    const handleRedo = useCallback(() => {
        if (!history) {
            console.log('[Draw] handleRedo - Pas d\'historique disponible');
            return;
        }
        
        console.log('[Draw] handleRedo - État de l\'historique:', {
            canUndo: history.canUndo(),
            canRedo: history.canRedo(),
            stats: history.stats,
            currentSpaceId
        });
        
        if (!history.canRedo()) {
            console.log('[Draw] handleRedo - Pas d\'action à refaire');
            return;
        }
        
        console.log('[Draw] handleRedo appelé');
        const result = history.redo();
        console.log('[Draw] handleRedo - Résultat:', result);
        
        if (result.success) {
            console.log('[Draw] Action refaite avec succès');
            // Forcer un re-render du canvas
            setTimeout(() => {
                console.log('[Draw] Re-render forcé après redo');
            }, 100);
        } else {
            console.error('[Draw] Erreur lors du redo:', result.error);
        }
    }, [history, currentSpaceId]);


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
    useMemo(() => {
        registerBottomToolBar(
            () => {
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div 
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleUndo();
                            }}
                            title={t('draw.undo', 'Undo')}
                            style={{
                                opacity: history?.canUndo() ? 1 : 0.5,
                                cursor: history?.canUndo() ? 'pointer' : 'not-allowed',
                                background: 'transparent',
                                border: 'none',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                userSelect: 'none'
                            }}
                        >
                            <Undo />
                        </div>
                        <div 
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleRedo();
                            }}
                            title={t('draw.redo', 'Redo')}
                            style={{
                                opacity: history?.canRedo() ? 1 : 0.5,
                                cursor: history?.canRedo() ? 'pointer' : 'not-allowed',
                                background: 'transparent',
                                border: 'none',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                userSelect: 'none'
                            }}
                        >
                            <Redo />
                        </div>
                        <div 
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleClearCanvas();
                            }}
                            title={t('draw.clear', 'Clear drawing')}
                            style={{
                                cursor: 'pointer',
                                background: 'transparent',
                                border: 'none',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                userSelect: 'none'
                            }}
                        >
                            <BrushCleaning />
                        </div>
                        
                   
                    </div>
                );
            },
            { name: 'bottomInnerSlot', type: 'menu' },
            { order: 990, width: 'auto', alignment: 'center' }
        );
    }, [id, handleUndo, handleRedo, handleClearCanvas, history?.canUndo(), history?.canRedo(), t, registerBottomToolBar, currentSpaceId, lines, strokeWidth, getSpaceById, updateSharedState]);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentLinePoints, setCurrentLinePoints] = useState<{ x: number; y: number }[]>([]);

    // --- Redraw canvas based on lines from the store --- 
    useEffect(() => {
        console.log(`[Draw] Redessinage du canvas - lines:`, lines.length, 'lignes');
        
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

        console.log(`[Draw] Dessinage de ${lines.length} lignes`);
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
        
        console.log(`[Draw] Canvas redessiné avec ${lines.length} lignes`);
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
        const success = actionRegistry.executeAction('draw/addLine', {
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
