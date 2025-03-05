import * as PIXI from "pixi.js";
import React from "react";
import ReactDOM from "react-dom";
import { ErrorBoundary } from 'react-error-boundary';
import { debounce } from 'lodash';
import { Provider } from "react-redux";
import { DiffType } from "~/diff/diffs";
import "~/globals";
import { sendDiffsToSubscribers } from "~/listener/diffListener";
import { getActionState } from "~/state/stateUtils";
import { store } from "~/state/store";
import "~/state/undoRedo";
import { App } from "./App";

// If unsafe-eval is present in CSP, this can be used to fix that.

// import { install } from "@pixi/unsafe-eval";
// install(PIXI);

PIXI.utils.skipHello();

const Root = () => (
    <React.StrictMode>
        <ErrorBoundary fallback={<div>Une erreur est survenue</div>}>
            <Provider store={store}>
                <App />
            </Provider>
        </ErrorBoundary>
    </React.StrictMode>
);

ReactDOM.render(<Root />, document.getElementById("root"));

// Disable right click context menu
document.addEventListener("contextmenu", (e) => e.preventDefault(), false);

const handleResize = debounce(() => {
    requestAnimationFrame(() => {
        sendDiffsToSubscribers(getActionState(), [{ type: DiffType.ResizeAreas }]);
    });
}, 100);

window.addEventListener("resize", handleResize);
