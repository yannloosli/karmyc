import { AreaLayout, AreaRowLayout } from "../types/areaTypes";

export const computeAreaToViewport = (
    layout: { [key: string]: AreaLayout | AreaRowLayout },
    rootId: string,
    viewport: { left: number; top: number; width: number; height: number }
) => {
    const areaToViewport: { [key: string]: { left: number; top: number; width: number; height: number } } = {};

    function computeArea(area: AreaLayout, contentArea: { left: number; top: number; width: number; height: number }) {
        areaToViewport[area.id] = contentArea;
    }

    function computeRow(row: AreaRowLayout, contentArea: { left: number; top: number; width: number; height: number }) {
        areaToViewport[row.id] = contentArea;

        const size = row.orientation === "horizontal" ? contentArea.width : contentArea.height;
        const totalArea = row.areas.reduce((acc, area) => acc + area.size, 0);

        let left = contentArea.left;
        let top = contentArea.top;

        row.areas.forEach((area, i) => {
            const layoutItem = layout[area.id];
            if (!layoutItem) {
                console.warn(`Layout not found for area ${area.id}, skipping viewport calculation`);
                return;
            }

            const t = area.size / totalArea;
            const contentAreaForArea = {
                left,
                top,
                width: row.orientation === "horizontal" ? Math.floor(size * t) : contentArea.width,
                height: row.orientation === "vertical" ? Math.floor(size * t) : contentArea.height,
            };

            left += row.orientation === "horizontal" ? contentAreaForArea.width : 0;
            top += row.orientation === "vertical" ? contentAreaForArea.height : 0;

            if (layoutItem.type === "area_row") {
                computeRow(layoutItem as AreaRowLayout, contentAreaForArea);
            } else {
                computeArea(layoutItem as AreaLayout, contentAreaForArea);
            }
        });
    }

    const rootLayout = layout[rootId];
    if (!rootLayout) {
        console.warn(`Root layout not found for id ${rootId}`);
        return areaToViewport;
    }

    if (rootLayout.type === "area_row") {
        computeRow(rootLayout as AreaRowLayout, viewport);
    } else {
        computeArea(rootLayout as AreaLayout, viewport);
    }

    return areaToViewport;
}; 
