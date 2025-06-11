import { IActionPlugin } from '../types/actions';
/**
 * Plugin that manages the action history
 * Records actions in the history to allow undo/redo
 */
export declare const historyPlugin: IActionPlugin;
/**
 * Generates a human-readable description for an action
 * Used to display messages in the history UI
 */
export declare function getActionDescription(type: string, payload: any): string;
