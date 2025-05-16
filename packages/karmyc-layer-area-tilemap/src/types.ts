// Types pour l'éditeur de tilemap et le panneau tileset

import type { LayerProps } from '../../karmyc-layer-system/types';

export interface Tileset {
    image: string | null; // URL ou base64
    tileWidth: number;
    tileHeight: number;
    columns: number;
    rows: number;
}

export interface Layer {
    id: string;
    name: string;
    data: number[][]; // Matrice de tiles
    visible: boolean;
    opacity: number;
    // ...autres propriétés (verrouillé, mode de fusion, etc.)
}

export type Tool = 'brush' | 'eraser' | 'fill' | 'select';

export interface TilemapEditorState extends LayerProps {
    width: number;
    height: number;
    layers: Layer[];
    activeLayerId: string;
    tileset: Tileset;
    selectedTile: number | null;
    tool: Tool;
    zoom: number;
    pan: { x: number; y: number };
    selectedRect?: { x: number; y: number; w: number; h: number } | null;
    clipboard?: { data: number[][]; w: number; h: number } | null;
}

export interface TilesetAreaState extends LayerProps {
    tileset: Tileset;
    selectedTile: number | null;
} 
