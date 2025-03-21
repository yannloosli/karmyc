import { debounce } from 'lodash';
import React from "react";
import ReactDOM from 'react-dom';
import { KarmycProvider } from "~/providers/KarmycProvider";
import { sendDiffsToSubscribers } from "~/store/diffSubscription";
import { App } from "./App";
import { initAreaRegistries } from "./store/registries/initRegistries";
import { getActionState } from "./utils/stateUtils";

// Initialiser les registres
initAreaRegistries();

const Root = () => (
    <React.StrictMode>
        <KarmycProvider>
            <App />
        </KarmycProvider>
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
        sendDiffsToSubscribers(getActionState(), [{
            id: `resize-${Date.now()}`,
            timestamp: Date.now(),
            type: 'ResizeAreas',
            changes: [],
            metadata: {}
        }]);
    });
}, 100);

window.addEventListener("resize", handleResize);
