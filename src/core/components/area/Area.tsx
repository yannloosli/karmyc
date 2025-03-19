import React, { ComponentType } from "react";
import { AreaType } from "~/core/constants";
import { Rect } from "~/core/types/geometry";

export interface AreaComponentProps<T = any> {
    id: string;
    state: T;
    type: AreaType;
    viewport: Rect;
    raised?: boolean;
    Component: ComponentType<any>;
}

export const AreaComponent: React.FC<AreaComponentProps> = ({
    id,
    Component,
    state,
    type,
    viewport,
    raised,
}) => {
    return (
        <div
            className={`area ${raised ? "raised" : ""}`}
            style={{
                position: "absolute",
                left: viewport.left,
                top: viewport.top,
                width: viewport.width,
                height: viewport.height,
            }}
        >
            <Component id={id} state={state} type={type} viewport={viewport} />
        </div>
    );
}; 
