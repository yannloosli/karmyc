import React, { useEffect } from "react";
import { AreaRoot } from "~/core/components/area/components/AreaRoot";
import { addListener, removeListener } from "~/listener/addListener";
import { isKeyCodeOf } from "~/listener/keyboard";

export const App: React.FC = () => {
    useEffect(() => {
        const token = addListener.repeated("keydown", { modifierKeys: ["Command"] }, (e) => {
            if (isKeyCodeOf("S", e.keyCode)) {
                e.preventDefault();
                (window as any).saveActionState();
                console.log("Saved!");
            }
        });
        return () => {
            removeListener(token);
        };
    }, []);

    return (
        <>
            {/* 		<NormalContextMenu />
			<CustomContextMenu /> */}
            {/* 	<Toolbar /> */}
            <AreaRoot />
            {/* <DragCompositionPreview /> */}
        </>
    );
};
