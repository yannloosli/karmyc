import { debounce } from 'lodash';
import React from "react";
import ReactDOM from 'react-dom';
import { CoreProvider } from "~/core/providers/CoreProvider";
import { DiffType } from "~/diff/diffs";
import "~/globals";
import { sendDiffsToSubscribers } from "~/listener/diffListener";
import { getActionState } from "~/state/stateUtils";
import "~/state/undoRedo";
import { App } from "./App";

const Root = () => (
    <React.StrictMode>
        <CoreProvider>
            <App />
        </CoreProvider>
    </React.StrictMode>
);

const rootElement = document.getElementById("root");

if (rootElement) {
    // @ts-expect-error TO CHECK WHEN UPGRADING REACT
    ReactDOM.render(<Root />, rootElement);
}

// Disable right click context menu
document.addEventListener("contextmenu", (e) => e.preventDefault(), false);

const handleResize = debounce(() => {
    requestAnimationFrame(() => {
        sendDiffsToSubscribers(getActionState(), [{ type: DiffType.ResizeAreas }]);
    });
}, 100);

window.addEventListener("resize", handleResize);
