import React, { useRef } from "react";
import { WorkspaceArea as WorkspaceAreaComponent, WorkspaceAreaHandle } from "../../../karmyc-core/src/components/area/WorkspaceArea";
import { useKarmycStore } from "../../../karmyc-core/src/stores/areaStore";
import { useSpaceStore } from "../../../karmyc-core/src/stores/spaceStore";
import { LayerRegistry } from "../../../karmyc-layer-system";

// Type pour l'état du composant
interface WorkspaceAreaState {
    color?: string;
    layers?: any[];
}

// Type des propriétés du composant en utilisant les types définis par l'API de Karmyc
interface WorkspaceAreaProps {
    id: string;
    state: WorkspaceAreaState;
    viewport: {
        width: number;
        height: number;
    };
    type?: string;
    targetSpace?: string;
}

export const WorkspaceArea: React.FC<WorkspaceAreaProps> = ({
    id,
    state,
    type,
    viewport,
}) => {
    const { width, height } = viewport;
    const originX = width / 2;
    const originY = height / 2;
    const area = useKarmycStore((s) => s.getAreaById(id));
    const updateArea = useKarmycStore((s) => s.updateArea);
    const activeSpace = useSpaceStore((s) => s.getActiveSpace());
    const layers = Array.isArray(activeSpace?.sharedState?.layers) ? activeSpace.sharedState.layers : [];
    const areaRef = useRef<WorkspaceAreaHandle>(null);
    const zoom = area?.zoom ?? 1;
    const pan = area?.pan ?? { x: 0, y: 0 };

    layers.forEach(layer => {
        const Comp = LayerRegistry.get(layer.type);
    });

    const handleTransformChange = (z: number, p: { x: number; y: number }) => {
        if (!area?.id) return;
        if (area.zoom === z && area.pan?.x === p.x && area.pan?.y === p.y) return;
        updateArea({ id: area.id, zoom: z, pan: p });
    };

    if (!width || !height || width <= 0 || height <= 0) {
        console.warn("[WorkspaceArea] Dimensions invalides, rendu annulé.");
        return <div>Chargement de l'espace de travail…</div>;
    }

    return (
        <div style={{ position: 'relative', width, height }}>
            <WorkspaceAreaComponent
                ref={areaRef}
                width={width}
                height={height}
                originX={originX}
                originY={originY}
                onTransformChange={handleTransformChange}
            />
            {/* Overlay React pour les layers HTML */}
            {layers.length === 0 && (
                <div style={{ position: "absolute", top: 0, left: 0, color: "red", zIndex: 1000 }}>
                    Aucun layer à afficher
                </div>
            )}
            {layers.map((layer) => {
                const Comp = LayerRegistry.get(layer.type);
                if (!Comp) return null;
                return (
                    <div
                        key={layer.id}
                        style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            width,
                            height,
                            pointerEvents: "none",
                            zIndex: layer.zIndex || 1,
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                            transformOrigin: "0 0",
                            mixBlendMode: layer.blendMode || "normal",
                        }}
                    >
                        <Comp layer={layer} width={width} height={height} zoom={zoom} pan={pan} originX={originX} originY={originY} />
                    </div>
                );
            })}
        </div>
    );
}; 
