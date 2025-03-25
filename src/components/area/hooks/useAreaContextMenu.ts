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

    // Cas spécial pour l'aperçu de zone (ID -1)
    if (areaId === "-1" && areaToOpen) {
        const menuItems: ContextMenuItem[] = [
            {
                id: "separator",
                label: "───────────────",
                actionId: "area.separator",
                metadata: { areaId }
            }
        ];

        // Ajouter les options de conversion pour l'aperçu
        const registeredTypes = Array.from(areaRegistry.getRegisteredTypes());
        registeredTypes.forEach((type) => {
            if (type === areaToOpen.area.type) return;

            const component = areaRegistry.getComponent(type);
            if (!component) return;

            const displayName = areaRegistry.getDisplayName(type);

            menuItems.push({
                id: `create-${type}`,
                label: `Convertir en ${displayName.toLowerCase()}`,
                actionId: `area.create-${type}`,
                metadata: { areaId }
            });
        });

        return menuItems;
    }

    // Si l'area n'existe pas, retourner un menu vide
    if (!area) {
        console.warn(`Area ${areaId} not found in state`);
        return [];
    }

    // Créer les éléments de menu de base
    const menuItems: ContextMenuItem[] = [
        {
            id: "separator",
            label: "───────────────",
            actionId: "area.separator",
            metadata: { areaId }
        }
    ];

    // Récupérer tous les types enregistrés dans le registre
    const registeredTypes = Array.from(areaRegistry.getRegisteredTypes());

    // Ajouter dynamiquement les options de conversion pour chaque type disponible
    registeredTypes.forEach((type) => {
        // Ne pas ajouter l'option de conversion vers le type actuel
        if (type === area.type) return;

        const component = areaRegistry.getComponent(type);
        if (!component) return; // Ignorer les types non enregistrés

        const displayName = areaRegistry.getDisplayName(type);

        menuItems.push({
            id: `create-${type}`,
            label: `Convertir en ${displayName.toLowerCase()}`,
            actionId: `area.create-${type}`,
            metadata: { areaId }
        });
    });

    return menuItems;
}; 
