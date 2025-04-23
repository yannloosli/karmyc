import { contextMenuActions } from "@gamesberry/karmyc-core/contextMenu/contextMenuActions";
import { OpenCustomContextMenuOptions } from "@gamesberry/karmyc-core/contextMenu/contextMenuTypes";
import { ActionType, getType } from "typesafe-actions";

type ContextMenuAction = ActionType<typeof contextMenuActions>;

export interface ContextMenuActionOption {
    label: string;
    onSelect: () => void;
    default?: boolean;
    icon?: React.ComponentType;
}

export interface ContextMenuListOption {
    label: string;
    options: ContextMenuOption[];
    default?: boolean;
    icon?: React.ComponentType;
}

export type ContextMenuOption = ContextMenuActionOption | ContextMenuListOption;

export interface ContextMenuState {
    name: string;
    isOpen: boolean;
    options: ContextMenuOption[];
    position: { x: number; y: number };
    close: (() => void) | null;
    customContextMenu: null | OpenCustomContextMenuOptions;
}

export const initialContextMenuState: ContextMenuState = {
    isOpen: false,
    name: "",
    options: [],
    position: { x: 0, y: 0 },
    close: null,
    customContextMenu: null,
};

export const contextMenuReducer = (
    state: ContextMenuState,
    action: ContextMenuAction,
): ContextMenuState => {
    switch (action.type) {
    case getType(contextMenuActions.openContextMenu): {
        const { name, options, position, close } = action.payload;
        return {
            ...state,
            isOpen: true,
            name,
            options,
            position: { x: position.x, y: position.y },
            close,
        };
    }

    case getType(contextMenuActions.openCustomContextMenu): {
        const { options } = action.payload;
        return {
            ...state,
            customContextMenu: options,
        };
    }

    case getType(contextMenuActions.closeContextMenu): {
        return {
            ...state,
            isOpen: false,
            name: "",
            options: [],
            position: { x: 0, y: 0 },
            close: null,
            customContextMenu: null,
        };
    }

    default:
        return state;
    }
};
