import { useEffect } from 'react';
import { toolsEventBus } from '../utils/toolsEventBus';
import { toolsBarRegistry, notifyToolsRegistryChange } from '../utils/toolsRegistry';

// Fonction pour nettoyer le registre des outils d'une zone
function cleanupToolsRegistry(areaId: string) {
    const positions = ['top-outer', 'top-inner', 'bottom-outer', 'bottom-inner'];
    positions.forEach(position => {
        const registryKey = `${areaId}:${position}`;
        if (toolsBarRegistry[registryKey]) {
            delete toolsBarRegistry[registryKey];
        }
    });
    notifyToolsRegistryChange();
}

// Hook pour gérer le nettoyage des outils
export function useToolsCleanup() {
    useEffect(() => {
        const unsubscribe = toolsEventBus.subscribe((event) => {
            if (event.type === 'cleanup') {
                cleanupToolsRegistry(event.areaId);
            }
        });
        return unsubscribe;
    }, []);
} 
