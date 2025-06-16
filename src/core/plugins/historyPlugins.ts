import { IActionPlugin } from "../types/actions";
import { ActionPriority } from "../types/actions";
import { Action } from "../types/actions";
import { spaceHistoryStore } from "../spaceHistoryStore";
import { actionRegistry } from "../registries/actionRegistry";

/**
 * Plugin that manages the action history
 * Records actions in the history to allow undo/redo
 */
export const historyPlugin: IActionPlugin = {
    id: 'history',
    priority: ActionPriority.HIGH, // High priority to run before other plugins
    actionTypes: actionRegistry.getActionTypes(), // List of action types to record
    handler: (action: Action) => {
        // Record the action in the history
        const { type, payload } = action;

        // Generate a unique identifier for this history action
        const historyEntryId = `${type}-${Date.now()}`;

        // Record the history entry with important metadata
        const historyEntry = {
            id: historyEntryId,
            type,
            payload,
            timestamp: Date.now(),
            description: actionRegistry.getActionDescription(type)
        };

        // Add to history
        spaceHistoryStore.getState().addEntry(historyEntry);
    }
};
