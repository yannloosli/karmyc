import React from "react";
import { AreaComponentProps } from "../types/areaTypes";

export const Timeline: React.FC<AreaComponentProps<any>> = ({
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
                backgroundColor: "#f0fff4",
                padding: "16px",
            }}
        >
            <h2>Timeline Area</h2>
            <p>Timeline content will be displayed here</p>
        </div>
    );
}; 
