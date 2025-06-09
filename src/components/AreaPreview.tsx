import React from "react";
import { AreaComponent } from "./Area";
import { areaRegistry } from "../store/registries/areaRegistry";
import { Vec2 } from "../utils";
import { AreaToOpen } from "../types/areaTypes";
import { useTranslation } from '../hooks/useTranslation';

interface AreaPreviewProps {
    areaToOpen: AreaToOpen;
    dimensions: Vec2;
}

export const AreaPreview: React.FC<AreaPreviewProps> = React.memo(({ areaToOpen, dimensions }) => {
    const { t } = useTranslation();
    const Component = areaRegistry.getComponent(areaToOpen.area.type);
    if (!Component) {
        return null;
    }

    return (
        <div
            className="area-preview"
            style={{
                left: areaToOpen.position.x,
                top: areaToOpen.position.y,
            }}
        >
            <AreaComponent
                id="-1"
                Component={Component}
                raised
                isChildOfStack={false}
                state={areaToOpen.area.state}
                type={areaToOpen.area.type}
                viewport={{
                    left: 0,
                    top: 0,
                    height: dimensions.y,
                    width: dimensions.x,
                }}
                setResizePreview={() => { }}
            />
            <div className="area-preview-content">
                {t(`area.preview.${areaToOpen.area.type}`, `Preview of ${areaToOpen.area.type}`)}
            </div>
        </div>
    );
}); 
