import { areaRegistry, useKarmycStore } from '@gamesberry/karmyc-core';
import { useSpaceStore } from '../stores/spaceStore';
import { useContextMenuStore } from '../stores/contextMenuStore';

interface ContextMenuItem {
    id: string;
    label: string;
    actionId: string;
    disabled?: boolean;
    children?: ContextMenuItem[];
    metadata: { areaId: string;[key: string]: any };
}

export const useAreaContextMenu = (areaId: string): ContextMenuItem[] => {
    const area = useKarmycStore((state) => state.getAreaById(areaId));
    const areaToOpen = useKarmycStore((state) => state.screens[state.activeScreenId]?.areas.areaToOpen);
    const openContextMenuAction = useContextMenuStore((state) => state.openContextMenu);
    const removeArea = useKarmycStore((state) => state.removeArea);
    const updateArea = useKarmycStore((state) => state.updateArea);
    const detachArea = useKarmycStore((state) => state.detachArea);
    const allSpaces = useSpaceStore((state) => state.getAllSpaces());

    // Special case for area preview (ID -1)
    if (areaId === "-1" && areaToOpen) {
        const areaTypeChildren: ContextMenuItem[] = [];
        const registeredTypes = Array.from(areaRegistry.getRegisteredTypes());
        registeredTypes.forEach((type) => {
            if (type === areaToOpen.area.type) return;
            const component = areaRegistry.getComponent(type);
            if (!component) return;
            const displayName = areaRegistry.getDisplayName(type);
            areaTypeChildren.push({
                id: `create-${type}`,
                label: displayName,
                actionId: `area.create-${type}`,
                metadata: { areaId }
            });
        });
        return [
            {
                id: "separator",
                label: "───────────────",
                actionId: "area.separator",
                metadata: { areaId }
            },
            {
                id: "area-type",
                label: "Area Type",
                actionId: "area.type",
                children: areaTypeChildren,
                metadata: { areaId }
            },
            {
                id: "detach",
                label: "Detach",
                actionId: "area.detach",
                disabled: true,
                metadata: { areaId }
            }
        ];
    }

    // If area doesn't exist, return empty menu
    if (!area) {
        console.warn(`Area ${areaId} not found in active screen state`);
        return [];
    }

    // Sous-menu Area Type
    const areaTypeChildren: ContextMenuItem[] = [];
    const registeredTypes = Array.from(areaRegistry.getRegisteredTypes());
    registeredTypes.forEach((type) => {
        if (type === area.type) return;
        const component = areaRegistry.getComponent(type);
        if (!component) return;
        const displayName = areaRegistry.getDisplayName(type);
        areaTypeChildren.push({
            id: `create-${type}`,
            label: displayName,
            actionId: `area.create-${type}`,
            metadata: { areaId }
        });
    });
    // Ajoute l'option Close Area à la fin du sous-menu Area Type
    areaTypeChildren.push({
        id: "close-area",
        label: "Close Area",
        actionId: "area.close",
        metadata: { areaId }
    });

    // Sous-menu Space
    const spaceChildren: ContextMenuItem[] = Object.values(allSpaces).map((space) => ({
        id: `assign-space-${space.id}`,
        label: space.name,
        actionId: 'area.assign-space',
        metadata: { areaId, spaceId: space.id },
        disabled: area.spaceId === space.id
    }));

    const menuItems: ContextMenuItem[] = [
        {
            id: "separator",
            label: "───────────────",
            actionId: "area.separator",
            metadata: { areaId }
        },
        {
            id: "area-type",
            label: "Area Type",
            actionId: "area.type",
            children: areaTypeChildren,
            metadata: { areaId }
        },
        {
            id: "space",
            label: "Space",
            actionId: "area.space",
            children: spaceChildren,
            metadata: { areaId }
        },
        {
            id: "detach",
            label: "Detach",
            actionId: "area.detach",
            disabled: false,
            metadata: { areaId }
        }
    ];

    return menuItems;
}; 
