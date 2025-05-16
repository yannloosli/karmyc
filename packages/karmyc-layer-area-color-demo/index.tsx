// Point d'entrée du package @gamesberry/karmyc-layer-area-color-demo 

import React from "react";
import { LayerRegistry } from "../karmyc-layer-system";

export const ColorLayerDemo: React.FC<{ layer: any; width?: number; height?: number; zoom?: number; pan?: { x: number; y: number } }> = ({ layer, width = "100%", height = "100%", zoom = 1, pan = { x: 0, y: 0 } }) => {
    const color = layer["color"] ?? "#3498db";
    const opacity = layer["opacity"] ?? 1;
    const visible = layer["visible"] ?? true;
    const zIndex = layer["zIndex"] ?? 0;
    const enabled = layer["enabled"] ?? true;
    const locked = layer["locked"] ?? false;

    if (!visible || !enabled) return null;
    return (
        <div
            style={{
                width: typeof width === 'number' ? width : '100%',
                height: typeof height === 'number' ? height : '100%',
                background: color,
                opacity,
                position: "absolute",
                left: 0,
                top: 0,
                zIndex,
                pointerEvents: locked ? "none" : undefined,
            }}
        />
    );
};

LayerRegistry.register("color-demo", ColorLayerDemo);

export default ColorLayerDemo; 
