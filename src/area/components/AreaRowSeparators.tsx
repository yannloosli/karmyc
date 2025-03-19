import React from "react";
import { AreaRowLayout } from "~/types/areaTypes";

interface OwnProps {
    row: AreaRowLayout;
    areaToViewport: MapOf<Rect>;
}
type Props = OwnProps;

export const AreaRowSeparators: React.FC<Props> = props => {
    console.log("[AreaRowSeparators] Render test component");

    // On ignore complètement les props et on retourne simplement un test
    return (
        <div
            style={{
                position: 'absolute',
                left: 150,
                top: 150,
                width: 30,
                height: 30,
                backgroundColor: 'green',
                color: 'white',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                border: '2px solid yellow'
            }}
        >
            TEST SEP
        </div>
    );
};
