/**
 * Types related to drawing state
 */

// Moved from HistoryDrawingArea.tsx
export interface Line {
    id: string;
    points: { x: number; y: number }[];
    color: string;
    width: number;
} 
