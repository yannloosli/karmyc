import React from "react";
import { AreaComponentProps } from "../../types/areaTypes";

export const Project: React.FC<AreaComponentProps<any>> = ({
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
                backgroundColor: "#f7fafc",
                padding: "16px",
            }}
        >
            <h2>Project Area</h2>
            <p>Project content will be displayed here</p>
        </div>
    );
}; 
