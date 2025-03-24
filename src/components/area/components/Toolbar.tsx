import React, { useCallback } from 'react';

// Type pour identifier un composant de manière unique
type ComponentIdentifier = {
    name: string;
    type: string;
};

// Registre des composants de slot
const slotComponentRegistry: Record<string, Record<string, {
    component: React.ComponentType<any>;
    identifier: ComponentIdentifier;
    order?: number;
}>> = {};

// Hook personnalisé pour la barre d'outils
export const useToolbar = (areaType: string, areaId: string) => {
    // Créer une clé unique pour cette combinaison type:id
    const registryKey = `${areaType}:${areaId}`;

    // Fonction pour enregistrer un composant dans un slot
    const registerSlotComponent = useCallback((
        slot: 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w',
        component: React.ComponentType<any>,
        identifier: ComponentIdentifier,
        options: { order?: number } = {}
    ) => {
        if (!slotComponentRegistry[registryKey]) {
            slotComponentRegistry[registryKey] = {};
        }
        if (!slotComponentRegistry[registryKey][slot]) {
            slotComponentRegistry[registryKey][slot] = {};
        }

        const id = Math.random().toString(36).substr(2, 9);
        slotComponentRegistry[registryKey][slot] = {
            component,
            identifier,
            order: options.order
        };

        return id;
    }, [registryKey]);

    // Fonction pour récupérer un composant de slot
    const getSlotComponent = useCallback((slot: string) => {
        return slotComponentRegistry[registryKey]?.[slot]?.component;
    }, [registryKey]);

    // Nettoyer les composants lors du démontage
    React.useEffect(() => {
        return () => {
            delete slotComponentRegistry[registryKey];
        };
    }, [registryKey]);

    return {
        registerComponent: registerSlotComponent, // Pour la compatibilité avec l'ancien code
        registerSlotComponent,
        getSlotComponent
    };
};

interface ToolbarProps {
    areaId: string;
    areaState: any;
    areaType: string;
}

export const Toolbar: React.FC<ToolbarProps> = ({ areaId, areaState, areaType }) => {
    const { getSlotComponent } = useToolbar(areaType, areaId);

    // Récupérer les composants de slot
    const NWComponent = getSlotComponent('nw');
    const NComponent = getSlotComponent('n');
    const NEComponent = getSlotComponent('ne');
    const EComponent = getSlotComponent('e');
    const SEComponent = getSlotComponent('se');
    const SComponent = getSlotComponent('s');
    const SWComponent = getSlotComponent('sw');
    const WComponent = getSlotComponent('w');

    return (
        <div className="area-toolbar">
            <div className="area-toolbar-slots" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                {/* Ligne du haut */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between' }}>
                    {NWComponent && (
                        <div className="area-toolbar-slot nw">
                            <NWComponent areaId={areaId} areaState={areaState} />
                        </div>
                    )}
                    {NComponent && (
                        <div className="area-toolbar-slot n">
                            <NComponent areaId={areaId} areaState={areaState} />
                        </div>
                    )}
                    {NEComponent && (
                        <div className="area-toolbar-slot ne">
                            <NEComponent areaId={areaId} areaState={areaState} />
                        </div>
                    )}
                </div>

                {/* Ligne du milieu */}
                <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: 0, right: 0, display: 'flex', justifyContent: 'space-between' }}>
                    {WComponent && (
                        <div className="area-toolbar-slot w">
                            <WComponent areaId={areaId} areaState={areaState} />
                        </div>
                    )}
                    {EComponent && (
                        <div className="area-toolbar-slot e" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <EComponent areaId={areaId} areaState={areaState} />
                        </div>
                    )}
                </div>

                {/* Ligne du bas */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between' }}>
                    {SWComponent && (
                        <div className="area-toolbar-slot sw">
                            <SWComponent areaId={areaId} areaState={areaState} />
                        </div>
                    )}
                    {SComponent && (
                        <div className="area-toolbar-slot s">
                            <SComponent areaId={areaId} areaState={areaState} />
                        </div>
                    )}
                    {SEComponent && (
                        <div className="area-toolbar-slot se">
                            <SEComponent areaId={areaId} areaState={areaState} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}; 
