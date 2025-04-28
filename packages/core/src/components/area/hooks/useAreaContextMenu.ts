import { areaRegistry } from '@gamesberry/karmyc-core/area/registry';
import { useAreaStore } from '@gamesberry/karmyc-core/stores/areaStore';
import { useContextMenuStore } from '@gamesberry/karmyc-core/stores/contextMenuStore';

interface ContextMenuItem {
    id: string;
    label: string;
    actionId: string;
    metadata: { areaId: string;[key: string]: any };
}

export const useAreaContextMenu = (areaId: string): ContextMenuItem[] => {
    const area = useAreaStore((state) => state.areas[areaId]);
    const areaToOpen = useAreaStore((state) => state.areaToOpen);
    const openContextMenuAction = useContextMenuStore((state) => state.openContextMenu);

    // Special case for area preview (ID -1)
    if (areaId === "-1" && areaToOpen) {
        const menuItems: ContextMenuItem[] = [
            {
                id: "separator",
                label: "───────────────",
                actionId: "area.separator",
                metadata: { areaId }
            }
        ];

        // Add conversion options for preview
        const registeredTypes = Array.from(areaRegistry.getRegisteredTypes());
        registeredTypes.forEach((type) => {
            if (type === areaToOpen.area.type) return;

            const component = areaRegistry.getComponent(type);
            if (!component) return;

            const displayName = areaRegistry.getDisplayName(type);

            menuItems.push({
                id: `create-${type}`,
                label: `Convert to ${displayName.toLowerCase()}`,
                actionId: `area.create-${type}`,
                metadata: { areaId }
            });
        });

        return menuItems;
    }

    // If area doesn't exist, return empty menu
    if (!area) {
        console.warn(`Area ${areaId} not found in Zustand state`);
        return [];
    }

    // Create basic menu items
    const menuItems: ContextMenuItem[] = [
        {
            id: "separator",
            label: "───────────────",
            actionId: "area.separator",
            metadata: { areaId }
        }
    ];

    // Get all registered types from registry
    const registeredTypes = Array.from(areaRegistry.getRegisteredTypes());

    // Dynamically add conversion options for each available type
    registeredTypes.forEach((type) => {
        // Don't add conversion option for current type
        if (type === area.type) return;

        const component = areaRegistry.getComponent(type);
        if (!component) return; // Skip unregistered types

        const displayName = areaRegistry.getDisplayName(type);

        menuItems.push({
            id: `create-${type}`,
            label: `Convert to ${displayName.toLowerCase()}`,
            actionId: `area.create-${type}`,
            metadata: { areaId }
        });
    });

    return menuItems;
}; 
