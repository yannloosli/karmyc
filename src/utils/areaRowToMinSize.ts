import { AreaLayout, AreaRowLayout } from "../types/areaTypes";

export type Layout = AreaLayout | AreaRowLayout;

export const computeAreaRowToMinSize = (rootId: string, areaLayout: Record<string, Layout>) => {
    const rowToMinSize: { [areaId: string]: { width: number; height: number } } = {};

    const root = areaLayout[rootId];

    if (root.type === "area") {
        return {};
    }

    function compute(id: string): { height: number; width: number } {
        const layout = areaLayout[id];

        if (layout.type === "area") {
            return { width: 1, height: 1 };
        }

        const result = { height: 0, width: 0 };

        const items = layout.areas.map((item: { id: string }) => {
            return compute(item.id);
        });

        if (layout.orientation === "horizontal") {
            result.width = items.reduce((acc: number, item: { width: number; height: number }) => acc + item.width, 0);
            result.height = Math.max(...items.map((item: { width: number; height: number }) => item.height));
        } else {
            result.height = items.reduce((acc: number, item: { width: number; height: number }) => acc + item.height, 0);
            result.width = Math.max(...items.map((item: { width: number; height: number }) => item.width));
        }

        rowToMinSize[id] = result;
        return result;
    }

    rowToMinSize[rootId] = compute(rootId);

    return rowToMinSize;
};
