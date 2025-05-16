import React, {
  useRef,
  useEffect,
  useImperativeHandle,
  useCallback,
  forwardRef,
  useState
} from "react";
import * as PIXI from "pixi.js";

export interface WorkspaceAreaProps {
  width: number;
  height: number;
  originX?: number;
  originY?: number;
  minZoom?: number;
  maxZoom?: number;
  children?: (container: PIXI.Container) => void; // callback pour ajouter des layers
  onTransformChange?: (zoom: number, pan: { x: number; y: number }) => void;
}

export interface WorkspaceAreaHandle {
  resetZoom: () => void;
  center: () => void;
  setZoom: (zoom: number) => void;
  getZoom: () => number;
  getPan: () => { x: number; y: number };
}

const DEFAULT_BG = 0x232323;
const DEFAULT_GRID_COLOR = 0x444444;
const DEFAULT_GRID_SPACING = 32;

export const WorkspaceArea = forwardRef<WorkspaceAreaHandle, WorkspaceAreaProps>(
  (
    {
      width,
      height,
      originX = 0,
      originY = 0,
      minZoom = 0.2,
      maxZoom = 4,
      children,
      onTransformChange
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const appRef = useRef<PIXI.Application | null>(null);
    const containerRef = useRef<PIXI.Container | null>(null);
    const gridRef = useRef<PIXI.Graphics | null>(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: originX, y: originY });
    const dragging = useRef(false);
    const lastPointer = useRef({ x: 0, y: 0 });

    // API publique
    useImperativeHandle(ref, () => ({
      resetZoom: () => setZoom(1),
      center: () => setPan({ x: originX, y: originY }),
      setZoom: (z: number) => setZoom(Math.max(minZoom, Math.min(maxZoom, z))),
      getZoom: () => zoom,
      getPan: () => pan
    }), [zoom, pan, originX, originY, minZoom, maxZoom]);

    // Initialisation Pixi
    useEffect(() => {
      if (!canvasRef.current) return;
      const app = new PIXI.Application({
        view: canvasRef.current,
        width,
        height,
        backgroundColor: DEFAULT_BG,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });
      appRef.current = app;

      // Container principal
      const container = new PIXI.Container();
      app.stage.addChild(container);
      containerRef.current = container;

      // Grille
      const grid = new PIXI.Graphics();
      container.addChild(grid);
      gridRef.current = grid;

      // Ajout des layers enfants si callback fournie
      if (children) {
        children(container);
      }

      return () => {
        app.destroy(true, { children: true });
      };
    }, [width, height, children]);

    // Redessiner la grille à chaque pan/zoom
    useEffect(() => {
      const grid = gridRef.current;
      if (!grid) return;
      grid.clear();
      grid.beginFill(DEFAULT_BG);
      grid.drawRect(0, 0, width, height);
      grid.endFill();
      grid.lineStyle(1, DEFAULT_GRID_COLOR, 0.7);
      const spacing = DEFAULT_GRID_SPACING * zoom;
      for (let x = pan.x % spacing; x < width; x += spacing) {
        grid.moveTo(x, 0);
        grid.lineTo(x, height);
      }
      for (let y = pan.y % spacing; y < height; y += spacing) {
        grid.moveTo(0, y);
        grid.lineTo(width, y);
      }
    }, [width, height, pan, zoom]);

    // Appliquer pan/zoom au container
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;
      container.x = pan.x;
      container.y = pan.y;
      container.scale.set(zoom, zoom);
    }, [pan, zoom]);

    // Panning à la souris
    const onPointerDown = useCallback((e: React.PointerEvent) => {
      dragging.current = true;
      lastPointer.current = { x: e.clientX, y: e.clientY };
    }, []);
    const onPointerUp = useCallback(() => {
      dragging.current = false;
    }, []);
    const onPointerMove = useCallback((e: React.PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      setPan((prev) => ({ x: prev.x + dx / zoom, y: prev.y + dy / zoom }));
      lastPointer.current = { x: e.clientX, y: e.clientY };
    }, [zoom]);

    // Zoom à la molette
    const onWheel = useCallback((e: React.WheelEvent) => {
      const delta = -e.deltaY / 500;
      setZoom((z) => {
        let newZoom = Math.max(minZoom, Math.min(maxZoom, z * (1 + delta)));
        return newZoom;
      });
    }, [minZoom, maxZoom]);

    // Raccourcis clavier
    useEffect(() => {
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "r") setZoom(1);
        if (e.key === "c") setPan({ x: originX, y: originY });
      };
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }, [originX, originY]);

    useEffect(() => {
      if (onTransformChange) {
        onTransformChange(zoom, pan);
      }
    }, [zoom, pan, onTransformChange]);

    return (
      <div
        style={{ width, height, cursor: dragging.current ? "grabbing" : "grab", userSelect: "none" }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onPointerMove={onPointerMove}
        onWheel={onWheel}
        tabIndex={0}
      >
        <canvas ref={canvasRef} width={width} height={height} />
      </div>
    );
  }
);

WorkspaceArea.displayName = "WorkspaceArea"; 
