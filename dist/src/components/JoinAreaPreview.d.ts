import React from "react";
import { CardinalDirection } from "../types/directions";
interface Props {
    viewport: {
        left: number;
        top: number;
        width: number;
        height: number;
    };
    movingInDirection: CardinalDirection;
}
export declare const JoinAreaPreview: React.FC<Props>;
export {};
