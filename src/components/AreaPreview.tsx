import React from "react";
import { AreaErrorBoundary } from "./AreaErrorBoundary";
import { areaRegistry } from "../core/registries/areaRegistry";
import { Vec2 } from "../utils";
import { AreaToOpen } from "../types/areaTypes";

export interface AreaPreviewProps {
    areaToOpen: AreaToOpen;
    dimensions: Vec2;
}

export const AreaPreview: React.FC<AreaPreviewProps> = React.memo(({ areaToOpen, dimensions }) => {
    const Component = areaRegistry.getComponent(areaToOpen.area.type);
    if (!Component) {
        return null;
    }

    return (
        <div
            className="area-preview"
            style={{
                position: 'absolute',
                left: areaToOpen.position.x,
                top: areaToOpen.position.y,
                width: dimensions.x,
                height: dimensions.y,
                zIndex: 1000,
                pointerEvents: 'none',
                border: '2px dashed #666',
                borderRadius: '4px',
                overflow: 'hidden'
            }}
        >
            <AreaErrorBoundary
                component={Component}
                areaId="-1"
                areaState={areaToOpen.area.state}
                type={areaToOpen.area.type}
                viewport={{
                    left: 0,
                    top: 0,
                    width: dimensions.x,
                    height: dimensions.y
                }}
            />
        </div>
    );
}); 
