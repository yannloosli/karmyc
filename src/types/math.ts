export interface Rect {
    left: number;
    top: number;
    width: number;
    height: number;
}

export function createRect(left: number, top: number, width: number, height: number): Rect {
    return { left, top, width, height };
} 
