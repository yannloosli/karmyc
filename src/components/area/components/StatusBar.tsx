import React, { useCallback } from 'react';
import { TOOLBAR_HEIGHT } from '~/constants';

// Type pour identifier un composant de manière unique
type ComponentIdentifier = {
    name: string;
    type: string;
};

// Registre des composants de la barre de statut
const statusBarComponentRegistry: Record<string, Array<{
    component: React.ComponentType<any>;
    order: number;
    alignment: 'left' | 'center' | 'right';
    width?: string | number;
    identifier: ComponentIdentifier;
}>> = {};

// Hook personnalisé pour la barre de statut
export const useStatusBar = (areaType: string, areaId: string) => {
    // Créer une clé unique pour cette combinaison type:id
    const registryKey = `${areaType}:${areaId}`;

    // Fonction pour enregistrer un composant
    const registerComponent = useCallback((
        component: React.ComponentType<any>,
        identifier: ComponentIdentifier,
        options: {
            order?: number;
            alignment?: 'left' | 'center' | 'right';
            width?: string | number;
        } = {}
    ) => {
        const { order = 0, alignment = 'left', width } = options;

        // Nettoyer les composants existants avant d'en ajouter de nouveaux
        if (!statusBarComponentRegistry[registryKey]) {
            statusBarComponentRegistry[registryKey] = [];
        } else {
            // On garde uniquement les composants avec un identifiant différent
            statusBarComponentRegistry[registryKey] = statusBarComponentRegistry[registryKey].filter(
                item => !(item.identifier.name === identifier.name && item.identifier.type === identifier.type)
            );
        }

        const id = Math.random().toString(36).substr(2, 9);
        statusBarComponentRegistry[registryKey].push({
            component,
            order,
            alignment,
            width,
            identifier
        });

        // Trier les composants par ordre
        statusBarComponentRegistry[registryKey].sort((a, b) => a.order - b.order);

        return id;
    }, [registryKey]);

    // Fonction pour récupérer les composants
    const getComponents = useCallback(() => {
        return statusBarComponentRegistry[registryKey] || [];
    }, [registryKey]);

    // Nettoyer les composants lors du démontage
    React.useEffect(() => {
        return () => {
            delete statusBarComponentRegistry[registryKey];
        };
    }, [registryKey]);

    return {
        registerComponent,
        getComponents
    };
};

interface StatusBarProps {
    areaId: string;
    areaState: any;
    areaType: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({ areaId, areaState, areaType }) => {
    const { getComponents } = useStatusBar(areaType, areaId);
    const components = getComponents();

    // Organiser les composants par alignement
    const leftComponents = components.filter(c => c.alignment === 'left');
    const centerComponents = components.filter(c => c.alignment === 'center');
    const rightComponents = components.filter(c => c.alignment === 'right');

    return (
        <div className="area-status-bar" style={{
            height: TOOLBAR_HEIGHT + 'px',
        }}>
            <div className="area-status-bar-section left" style={{ flex: 1, display: 'flex', gap: '8px' }}>
                {leftComponents.map((item, index) => {
                    const Component = item.component;
                    return (
                        <div key={`${item.identifier.type}-${item.identifier.name}-${index}`} className="area-status-bar-item" style={{ width: item.width }}>
                            <Component areaId={areaId} areaState={areaState} />
                        </div>
                    );
                })}
            </div>
            <div className="area-status-bar-section center" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '8px' }}>
                {centerComponents.map((item, index) => {
                    const Component = item.component;
                    return (
                        <div key={`${item.identifier.type}-${item.identifier.name}-${index}`} className="area-status-bar-item" style={{ width: item.width }}>
                            <Component areaId={areaId} areaState={areaState} />
                        </div>
                    );
                })}
            </div>
            <div className="area-status-bar-section right" style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                {rightComponents.map((item, index) => {
                    const Component = item.component;
                    return (
                        <div key={`${item.identifier.type}-${item.identifier.name}-${index}`} className="area-status-bar-item" style={{ width: item.width }}>
                            <Component areaId={areaId} areaState={areaState} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}; 
