import React, { useCallback } from 'react';
import { TOOLBAR_HEIGHT } from '~/constants';

// Type pour identifier un composant de manière unique
type ComponentIdentifier = {
    name: string;
    type: string;
};

// Registre des composants de la barre de menu
const menuBarComponentRegistry: Record<string, Array<{
    component: React.ComponentType<any>;
    order: number;
    width?: string | number;
    identifier: ComponentIdentifier;
}>> = {};

// Hook personnalisé pour la barre de menu
export const useMenuBar = (areaType: string, areaId: string) => {
    // Créer une clé unique pour cette combinaison type:id
    const registryKey = `${areaType}:${areaId}`;

    // Fonction pour enregistrer un composant
    const registerComponent = useCallback((
        component: React.ComponentType<any>,
        identifier: ComponentIdentifier,
        options: { order?: number; width?: string | number } = {}
    ) => {
        const { order = 0, width } = options;

        // Nettoyer les composants existants avant d'en ajouter de nouveaux
        if (!menuBarComponentRegistry[registryKey]) {
            menuBarComponentRegistry[registryKey] = [];
        } else {
            // On garde uniquement les composants avec un identifiant différent
            menuBarComponentRegistry[registryKey] = menuBarComponentRegistry[registryKey].filter(
                item => !(item.identifier.name === identifier.name && item.identifier.type === identifier.type)
            );
        }

        const id = Math.random().toString(36).substr(2, 9);
        menuBarComponentRegistry[registryKey].push({
            component,
            order,
            width,
            identifier
        });

        // Trier les composants par ordre
        menuBarComponentRegistry[registryKey].sort((a, b) => a.order - b.order);

        return id;
    }, [registryKey]);

    // Fonction pour récupérer les composants
    const getComponents = useCallback(() => {
        return menuBarComponentRegistry[registryKey] || [];
    }, [registryKey]);

    // Nettoyer les composants lors du démontage
    React.useEffect(() => {
        return () => {
            delete menuBarComponentRegistry[registryKey];
        };
    }, [registryKey]);

    return {
        registerComponent,
        getComponents
    };
};

// Composant MenuBar
export const MenuBar: React.FC<{
    areaId: string;
    areaType: string;
    areaState: any;
}> = ({ areaId, areaType, areaState }) => {
    const { getComponents } = useMenuBar(areaType, areaId);
    const components = getComponents();

    return (
        <div className="area-menu-bar" style={{
            height: TOOLBAR_HEIGHT + 'px',
        }}>
            {components.map((item, index) => {
                const Component = item.component;
                return (
                    <div
                        key={`${item.identifier.type}-${item.identifier.name}-${index}`}
                        className="area-menu-bar-item"
                        style={{ width: item.width }}
                    >
                        <Component
                            areaId={areaId}
                            areaState={areaState}
                        />
                    </div>
                );
            })}
        </div>
    );
}; 
