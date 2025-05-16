import React, { useEffect, useRef, useState } from 'react';
import type { LayerProps } from '../../karmyc-layer-system/types';
import './tools/BrushTool';
import './tools/EraserTool';
import './tools/FillTool';
import { getTools } from './tools/registry';
import './tools/SelectTool';
import { TilemapEditorState, Tool } from './types';

// Props typiques pour une area karmyc
interface TilemapEditorAreaProps {
    layer: LayerProps;
    width?: number;
    height?: number;
    zoom?: number;
    pan?: { x: number; y: number };
    onChange?: (next: TilemapEditorState) => void;
}

export const TilemapEditorArea: React.FC<TilemapEditorAreaProps> = ({ layer, width = 512, height = 512, zoom = 1, pan = { x: 0, y: 0 }, onChange }) => {
    const tilemap = layer as TilemapEditorState;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { width: mapWidth, height: mapHeight, layers, tileset, selectedTile, zoom: stateZoom, pan: statePan, tool, activeLayerId, selectedRect } = tilemap;

    // Toolbar tools
    const tools = getTools();

    // Gestion du pinceau (peindre sur le layer actif)
    const [isPainting, setIsPainting] = useState(false);

    // Sélection rectangulaire
    const [selectStart, setSelectStart] = useState<{ x: number; y: number } | null>(null);

    const getTileCoord = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
        // Prendre en compte le zoom et le pan
        const x = Math.floor(((e.clientX - rect.left) / (stateZoom || 1) - (statePan?.x || 0)) / tileset.tileWidth);
        const y = Math.floor(((e.clientY - rect.top) / (stateZoom || 1) - (statePan?.y || 0)) / tileset.tileHeight);
        return { x, y };
    };

    const paintAt = (x: number, y: number) => {
        if (!onChange) return;
        if (x < 0 || y < 0 || x >= mapWidth || y >= mapHeight) return;
        const layerIdx = layers.findIndex(l => l.id === activeLayerId);
        if (layerIdx === -1) return;
        const newLayers = layers.map((l, idx) => {
            if (idx !== layerIdx) return l;
            const newData = l.data.map((row, yy) =>
                yy === y ? row.map((cell, xx) => {
                    if (xx !== x) return cell;
                    if (tool === 'brush' && typeof selectedTile === 'number') return selectedTile + 1;
                    if (tool === 'eraser') return 0;
                    return cell;
                }) : row
            );
            return { ...l, data: newData };
        });
        onChange({ ...tilemap, layers: newLayers });
    };

    const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        if (tool !== 'brush' && tool !== 'eraser') return;
        setIsPainting(true);
        const { x, y } = getTileCoord(e);
        paintAt(x, y);
    };
    const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        if ((tool !== 'brush' && tool !== 'eraser') || !isPainting) return;
        const { x, y } = getTileCoord(e);
        paintAt(x, y);
    };
    const handlePointerUp = () => setIsPainting(false);
    const handlePointerLeave = () => setIsPainting(false);

    const handleSelectPointerDown = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        if (tool !== 'select') return;
        const { x, y } = getTileCoord(e);
        setSelectStart({ x, y });
        if (onChange) {
            onChange({ ...tilemap, selectedRect: null });
        }
    };
    const handleSelectPointerMove = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        if (tool !== 'select' || !selectStart) return;
        const { x, y } = getTileCoord(e);
        const rx = Math.min(selectStart.x, x);
        const ry = Math.min(selectStart.y, y);
        const rw = Math.abs(x - selectStart.x) + 1;
        const rh = Math.abs(y - selectStart.y) + 1;
        if (onChange) {
            onChange({ ...tilemap, selectedRect: { x: rx, y: ry, w: rw, h: rh } });
        }
    };
    const handleSelectPointerUp = () => {
        setSelectStart(null);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !tileset?.image) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const img = new window.Image();
        img.src = tileset.image;
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.imageSmoothingEnabled = false;
            ctx.scale(stateZoom || 1, stateZoom || 1);
            ctx.translate(statePan?.x || 0, statePan?.y || 0);
            // Pour chaque calque visible
            layers.forEach(layer => {
                if (!layer.visible) return;
                for (let y = 0; y < mapHeight; y++) {
                    for (let x = 0; x < mapWidth; x++) {
                        const tileIdx = layer.data[y]?.[x] ?? 0;
                        if (tileIdx <= 0) continue; // 0 = vide
                        const idx = tileIdx - 1;
                        const col = idx % tileset.columns;
                        const row = Math.floor(idx / tileset.columns);
                        ctx.drawImage(
                            img,
                            col * tileset.tileWidth,
                            row * tileset.tileHeight,
                            tileset.tileWidth,
                            tileset.tileHeight,
                            x * tileset.tileWidth,
                            y * tileset.tileHeight,
                            tileset.tileWidth,
                            tileset.tileHeight
                        );
                    }
                }
            });
            // Grille
            ctx.save();
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            for (let x = 0; x <= mapWidth; x++) {
                ctx.beginPath();
                ctx.moveTo(x * tileset.tileWidth, 0);
                ctx.lineTo(x * tileset.tileWidth, mapHeight * tileset.tileHeight);
                ctx.stroke();
            }
            for (let y = 0; y <= mapHeight; y++) {
                ctx.beginPath();
                ctx.moveTo(0, y * tileset.tileHeight);
                ctx.lineTo(mapWidth * tileset.tileWidth, y * tileset.tileHeight);
                ctx.stroke();
            }
            ctx.restore();
            ctx.restore();
            // Overlay debug : tile sélectionné
            if (typeof selectedTile === 'number' && selectedTile >= 0) {
                ctx.save();
                ctx.globalAlpha = 0.7;
                ctx.drawImage(
                    img,
                    (selectedTile % tileset.columns) * tileset.tileWidth,
                    Math.floor(selectedTile / tileset.columns) * tileset.tileHeight,
                    tileset.tileWidth,
                    tileset.tileHeight,
                    8,
                    8,
                    tileset.tileWidth * 2,
                    tileset.tileHeight * 2
                );
                ctx.strokeStyle = '#4fd1c5';
                ctx.lineWidth = 2;
                ctx.strokeRect(8, 8, tileset.tileWidth * 2, tileset.tileHeight * 2);
                ctx.restore();
            }
            // Overlay sélection rectangulaire
            if (selectedRect) {
                ctx.save();
                ctx.strokeStyle = '#ffb300';
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 2]);
                ctx.strokeRect(
                    selectedRect.x * tileset.tileWidth,
                    selectedRect.y * tileset.tileHeight,
                    selectedRect.w * tileset.tileWidth,
                    selectedRect.h * tileset.tileHeight
                );
                ctx.restore();
            }
        };
    }, [layers, tileset, mapWidth, mapHeight, selectedTile, stateZoom, statePan, selectedRect]);

    // Sélection d'un outil
    const handleSelectTool = (toolName: Tool) => {
        if (onChange) {
            onChange({ ...tilemap, tool: toolName });
        }
    };

    return (
        <div style={{ width, height, background: '#222', color: '#fff', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'row', gap: 4, margin: 8 }}>
                {tools.map(({ component: ToolComp, identifier }) => (
                    <ToolComp
                        key={identifier.name}
                        active={tool === identifier.name}
                        onSelect={() => handleSelectTool(identifier.name as Tool)}
                    />
                ))}
            </div>
            <canvas
                ref={canvasRef}
                width={mapWidth * tileset.tileWidth * (stateZoom || 1)}
                height={mapHeight * tileset.tileHeight * (stateZoom || 1)}
                style={{
                    border: '1px solid #444',
                    background: '#222',
                    imageRendering: 'pixelated',
                    cursor: tool === 'select' ? 'crosshair' : 'pointer',
                    marginBottom: 8
                }}
                onMouseDown={tool === 'select' ? handleSelectPointerDown : handlePointerDown}
                onMouseMove={tool === 'select' ? handleSelectPointerMove : handlePointerMove}
                onMouseUp={tool === 'select' ? handleSelectPointerUp : handlePointerUp}
                onMouseLeave={tool === 'select' ? handleSelectPointerUp : handlePointerLeave}
            />
            <div style={{ fontSize: 12, color: '#aaa' }}>
                {mapWidth} x {mapHeight} tiles
            </div>
        </div>
    );
}; 
