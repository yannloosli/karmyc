import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAppDispatch } from '~/hooks';
import { useArea } from '~/hooks/useArea';
import { useHistory } from '~/hooks/useHistory';
import { addHistoryEntry } from '~/store/slices/historySlice';
import { AreaComponentProps } from '~/types/areaTypes';

interface DrawingState {
    lines: Line[];
    currentColor: string;
    strokeWidth: number;
}

interface Line {
    id: string;
    points: { x: number; y: number }[];
    color: string;
    width: number;
}

export const HistoryDrawingArea: React.FC<AreaComponentProps<DrawingState>> = ({
    id,
    state,
    viewport
}) => {
    const dispatch = useAppDispatch();
    const { updateAreaState } = useArea();
    const { canUndo, canRedo, undo, redo, getHistoryForArea } = useHistory();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentLine, setCurrentLine] = useState<{ x: number; y: number }[]>([]);

    // État local pour l'area spécifique
    const [areaCanUndo, setAreaCanUndo] = useState(false);
    const [areaCanRedo, setAreaCanRedo] = useState(false);

    // États locaux pour les valeurs de UI
    const [localColor, setLocalColor] = useState('#000000');
    const [localStrokeWidth, setLocalStrokeWidth] = useState(3);

    // Référence pour éviter la réinitialisation à chaque rendu
    const initializedRef = useRef(false);

    // Référence pour stocker temporairement la couleur pendant le glissement
    const tempColorRef = useRef('#000000');
    const colorInputRef = useRef<HTMLInputElement>(null);

    // Mettre à jour l'état des boutons undo/redo spécifiques à cette area
    useEffect(() => {
        // Utiliser la fonction getHistoryForArea pour obtenir l'état de l'historique pour cette area
        const areaHistory = getHistoryForArea(id);
        console.log('Historique pour area', id, ':', areaHistory);

        setAreaCanUndo(areaHistory.canUndo);
        setAreaCanRedo(areaHistory.canRedo);
    }, [id, getHistoryForArea]);

    // Initialize state if needed - UNIQUEMENT LA PREMIÈRE FOIS
    useEffect(() => {
        // Vérifier si l'état a besoin d'une initialisation complète
        if (!initializedRef.current && (!state || !state.lines)) {
            console.log('Initialisation de l\'état du dessin pour l\'id:', id);
            const initialState = {
                lines: [],
                currentColor: '#000000',
                strokeWidth: 3
            };
            updateAreaState(id, initialState);
            initializedRef.current = true;
        }
        // Synchroniser les états locaux avec l'état Redux
        else if (state) {
            if (state.currentColor) {
                setLocalColor(state.currentColor);
                tempColorRef.current = state.currentColor;
            }
            if (state.strokeWidth) {
                setLocalStrokeWidth(state.strokeWidth);
            }
        }
    }, [id, state, updateAreaState]);

    // Draw all lines whenever the state changes
    useEffect(() => {
        if (!canvasRef.current || !state || !state.lines) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw all lines
        state.lines.forEach(line => {
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
    }, [state?.lines]);

    // Event handlers for drawing
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setIsDrawing(true);
        setCurrentLine([{ x, y }]);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setCurrentLine(prevLine => [...prevLine, { x, y }]);

        // Draw the current line
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.beginPath();

        if (currentLine.length > 0) {
            ctx.moveTo(currentLine[currentLine.length - 1].x, currentLine[currentLine.length - 1].y);
        } else {
            ctx.moveTo(x, y);
        }

        ctx.lineTo(x, y);
        ctx.strokeStyle = localColor;
        ctx.lineWidth = localStrokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    };

    const handleMouseUp = () => {
        if (!isDrawing) return;

        setIsDrawing(false);

        // Save the line to state
        if (currentLine.length > 1) {
            const newLine: Line = {
                id: `line-${Date.now()}`,
                points: currentLine,
                color: localColor,
                width: localStrokeWidth
            };

            // Sauvegarder l'état précédent pour l'historique
            const prevState = state ? { ...state } : { lines: [], currentColor: localColor, strokeWidth: localStrokeWidth };

            // IMPORTANT: préserver explicitement les lignes existantes
            const existingLines = state?.lines || [];
            const newState = {
                ...prevState,
                lines: [...existingLines, newLine]
            };

            // Mettre à jour l'état
            updateAreaState(id, newState);

            // Ajouter l'entrée dans l'historique
            dispatch(addHistoryEntry({
                name: 'drawing/addLine',
                prevState,
                nextState: newState,
                metadata: {
                    areaId: id
                }
            }));

            setCurrentLine([]);
        }
    };

    // Optimisation: Mettre à jour la couleur locale pendant le glissement, mais 
    // ne mettre à jour le state Redux qu'à la fin
    const handleColorInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newColor = e.target.value;
        setLocalColor(newColor); // Mise à jour locale pour l'UI
        tempColorRef.current = newColor; // Stocker temporairement pour mise à jour finale
    }, []);

    // Envoi de la mise à jour finale quand le sélecteur de couleur est fermé
    const handleColorInputBlur = useCallback(() => {
        const finalColor = tempColorRef.current;
        console.log('Couleur finalisée:', finalColor);

        // Sauvegarder l'état précédent pour l'historique
        const prevState = state ? { ...state } : { lines: [], currentColor: localColor, strokeWidth: localStrokeWidth };

        // IMPORTANT: préserver explicitement l'état existant
        const newState = {
            ...prevState,
            currentColor: finalColor
        };

        // Mettre à jour l'état
        updateAreaState(id, newState);

        // Ajouter l'entrée dans l'historique
        dispatch(addHistoryEntry({
            name: 'drawing/changeColor',
            prevState,
            nextState: newState,
            metadata: {
                areaId: id
            }
        }));

    }, [id, state, localColor, localStrokeWidth, updateAreaState, dispatch]);

    // Gestion du changement d'épaisseur
    const handleStrokeWidthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newWidth = parseInt(e.target.value);
        setLocalStrokeWidth(newWidth);

        // Sauvegarder l'état précédent pour l'historique
        const prevState = state ? { ...state } : { lines: [], currentColor: localColor, strokeWidth: localStrokeWidth };

        // IMPORTANT: préserver explicitement l'état existant
        const newState = {
            ...prevState,
            strokeWidth: newWidth
        };

        // Mettre à jour l'état
        updateAreaState(id, newState);

        // Ajouter l'entrée dans l'historique
        dispatch(addHistoryEntry({
            name: 'drawing/changeStrokeWidth',
            prevState,
            nextState: newState,
            metadata: {
                areaId: id
            }
        }));

    }, [id, state, localColor, localStrokeWidth, updateAreaState, dispatch]);

    const handleClearCanvas = useCallback(() => {
        // Sauvegarder l'état précédent pour l'historique
        const prevState = state ? { ...state } : { lines: [], currentColor: localColor, strokeWidth: localStrokeWidth };

        // Conserver les autres propriétés, mais vider les lignes
        const newState = {
            ...prevState,
            lines: []
        };

        // Mettre à jour l'état
        updateAreaState(id, newState);

        // Ajouter l'entrée dans l'historique
        dispatch(addHistoryEntry({
            name: 'drawing/clearCanvas',
            prevState,
            nextState: newState,
            metadata: {
                areaId: id
            }
        }));

    }, [id, state, localColor, localStrokeWidth, updateAreaState, dispatch]);

    // Utilisation des fonctions d'annulation/rétablissement avec l'ID de l'area
    const handleUndo = useCallback(() => {
        console.log('Annuler appelé pour area:', id);
        undo(id);
    }, [id, undo]);

    const handleRedo = useCallback(() => {
        console.log('Rétablir appelé pour area:', id);
        redo(id);
    }, [id, redo]);

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
                gap: '8px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <label htmlFor={`color-${id}`}>Couleur:</label>
                    <input
                        ref={colorInputRef}
                        id={`color-${id}`}
                        type="color"
                        value={localColor}
                        onChange={handleColorInputChange}
                        onBlur={handleColorInputBlur}
                    />
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
                    />
                    <span>{localStrokeWidth}px</span>
                </div>

                <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
                    <button
                        onClick={handleUndo}
                        disabled={!areaCanUndo}
                        style={{
                            padding: '4px 8px',
                            background: areaCanUndo ? '#1890ff' : '#d9d9d9',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: areaCanUndo ? 'pointer' : 'not-allowed'
                        }}
                    >
                        Annuler
                    </button>

                    <button
                        onClick={handleRedo}
                        disabled={!areaCanRedo}
                        style={{
                            padding: '4px 8px',
                            background: areaCanRedo ? '#1890ff' : '#d9d9d9',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: areaCanRedo ? 'pointer' : 'not-allowed'
                        }}
                    >
                        Rétablir
                    </button>

                    <button
                        onClick={handleClearCanvas}
                        style={{
                            padding: '4px 8px',
                            background: '#ff4d4f',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Effacer tout
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, position: 'relative' }}>
                <canvas
                    ref={canvasRef}
                    width={viewport.width}
                    height={viewport.height - 50} // Subtracting the toolbar height
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    style={{
                        display: 'block',
                        background: '#f5f5f5'
                    }}
                />
            </div>
        </div>
    );
}; 
