import React from "react";
import { css } from '@emotion/css';
import { AreaComponent } from "./Area";
import { areaRegistry } from "../stores/registries/areaRegistry";
import { Vec2 } from "../utils";
import { IArea, AreaToOpen } from "../types/areaTypes";
import { Rect } from "../types";
import { compileStylesheetLabelled } from "../utils/stylesheets";
import AreaRootStyles from "../styles/AreaRoot.styles";

const s = compileStylesheetLabelled(AreaRootStyles);

interface AreaPreviewProps {
    areaToOpen: AreaToOpen;
    dimensions: Vec2;
}

export const AreaPreview: React.FC<AreaPreviewProps> = React.memo(({ areaToOpen, dimensions }) => {
    const Component = areaRegistry.getComponent(areaToOpen.area.type);
    if (!Component) {
        return null;
    }

    const containerStyle: React.CSSProperties = {
        left: areaToOpen.position.x,
        top: areaToOpen.position.y,
        position: 'fixed',
        zIndex: 1000000,
        cursor: 'move',
        pointerEvents: 'none',
        userSelect: 'none',
        touchAction: 'none',
        willChange: 'transform',
        transform: 'translate(-50%, -50%) scale(0.4)',
        outline: '3px dashed blue',
        background: 'rgba(255, 255, 255, 0.5)',
        borderRadius: '4px',
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)'
    };

    return (
        <div
            className={css(s("areaToOpenContainer"))}
            style={containerStyle}
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
        </div>
    );
}); 
