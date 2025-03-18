import React from "react";
import { AreaComponentProps } from "../types/areaTypes";

export const FlowEditor: React.FC<AreaComponentProps<any>> = ({
    width,
    height,
    left,
    top,
    areaState,
    areaId,
}) => {
    return (
        <div
            style={{
                position: "absolute",
                left,
                top,
                width,
                height,
                backgroundColor: "#faf5ff",
                padding: "16px",
            }}
        >
            <h2>Flow Editor Area</h2>
            <p>Flow editor content will be displayed here</p>
        </div>
    );
}; 
