import { useSelector } from 'react-redux';
import { areaRegistry } from '~/area/registry';
import { RootState } from '~/store';

interface ContextMenuItem {
    id: string;
    label: string;
    actionId: string;
    metadata: { areaId: string;[key: string]: any };
}

export const useAreaContextMenu = (areaId: string): ContextMenuItem[] => {
    const area = useSelector((state: RootState) => state.area.areas[areaId]);
    const areaToOpen = useSelector((state: RootState) => state.area.areaToOpen);

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
        console.warn(`Area ${areaId} not found in state`);
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
