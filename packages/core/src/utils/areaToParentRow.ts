import { AreaState } from "../store/slices/areaSlice";

export function computeAreaToParentRow(state: AreaState): { [key: string]: string } {
    const areaToParentRow: { [key: string]: string } = {};

    const keys = Object.keys(state.layout);
    for (let i = 0; i < keys.length; i += 1) {
        const layout = state.layout[keys[i]];

        if (layout.type === "area") {
            continue;
        }

        for (let j = 0; j < layout.areas.length; j += 1) {
            areaToParentRow[layout.areas[j].id] = layout.id;
        }
    }

    return areaToParentRow;
} 
