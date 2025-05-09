import { ContextMenuOption } from "@gamesberry/karmyc-core/contextMenu/contextMenuReducer";
import { ContextMenuBaseProps, OpenCustomContextMenuOptions } from "@gamesberry/karmyc-core/contextMenu/contextMenuTypes";
import { createAction } from "typesafe-actions";
import { Vec2 } from "../../../util/math/vec2";

const openCustomContextMenu = createAction("contextMenu/OPEN_CUSTOM", (action) => {
    return (options: OpenCustomContextMenuOptions<any>) => action({ options });
});

type OpenCustomContextMenuFn = <P extends ContextMenuBaseProps>(
    options: OpenCustomContextMenuOptions<P>,
) => ReturnType<typeof openCustomContextMenu>;

export const contextMenuActions = {
    openContextMenu: createAction("contextMenu/OPEN", (action) => {
        return (name: string, options: ContextMenuOption[], position: Vec2, close: () => void) =>
            action({ name, options, position, close });
    }),

    openCustomContextMenu: openCustomContextMenu as OpenCustomContextMenuFn,

    closeContextMenu: createAction("contextMenu/CLOSE", (action) => {
        return () => action({});
    }),
};
