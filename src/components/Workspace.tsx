import React from "react";
import { AreaComponentProps } from "../types/areaTypes";

export const Workspace: React.FC<AreaComponentProps<any>> = ({
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
                backgroundColor: "#ebf8ff",
                padding: "16px",
            }}
        >
            <h2>Workspace Area</h2>
            <p>Workspace content will be displayed here</p>
        </div>
    );
}; 
