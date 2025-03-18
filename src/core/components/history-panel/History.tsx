import React from "react";
import { AreaComponentProps } from "../types/areaTypes";

export const History: React.FC<AreaComponentProps<any>> = ({
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
                backgroundColor: "#fff5f5",
                padding: "16px",
            }}
        >
            <h2>History Area</h2>
            <p>History content will be displayed here</p>
        </div>
    );
}; 
