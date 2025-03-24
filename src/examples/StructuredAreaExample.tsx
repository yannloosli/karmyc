import React, { useEffect } from 'react';
import { StructuredArea } from '~/components/area';
import {
    useRegisterAreaType,
} from '~/hooks';
import { useMenuBar } from '../components/area/components/MenuBar';
import { useStatusBar } from '../components/area/components/StatusBar';
import { useToolbar } from '../components/area/components/Toolbar';

// Composant pour l'exemple
const ExampleComponent: React.FC<any> = ({ id, state, type }) => {
    // Utiliser les hooks pour enregistrer les composants
    const { registerComponent: registerMenuComponent } = useMenuBar(type, id);
    const { registerComponent: registerStatusComponent } = useStatusBar(type, id);
    const {
        registerComponent: registerToolbarComponent,
        registerSlotComponent
    } = useToolbar(type, id);

    useEffect(() => {
        // Enregistrer les composants pour la barre de menu
        const menuId = registerMenuComponent(
            ({ areaId, areaState }) => (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold' }}>Exemple: {areaId}</span>
                    <button style={{ marginLeft: '10px' }}>Action</button>
                </div>
            ),
            { order: 10, width: 'auto' }
        );

        // Enregistrer les composants pour la barre d'état
        const statusId = registerStatusComponent(
            ({ areaId, areaState }) => (
                <div>Status: {areaState.status || 'Prêt'}</div>
            ),
            { order: 10, alignment: 'left', width: 'auto' }
        );

        // Enregistrer un compteur en bas à droite
        const counterStatusId = registerStatusComponent(
            ({ areaState }) => (
                <div>Compteur: {areaState.counter}</div>
            ),
            { order: 10, alignment: 'right', width: 'auto' }
        );

        // Enregistrer les composants pour la barre d'outils
        const toolbarId = registerToolbarComponent(
            ({ areaId, areaState }) => (
                <button
                    style={{ padding: '5px 10px' }}
                    onClick={(e) => {
                        e.stopPropagation();
                        console.log('Action pour', areaId);
                    }}
                >
                    Action
                </button>
            ),
            { order: 10 }
        );

        // Enregistrer un composant pour le slot Nord-Est
        const neSlotId = registerSlotComponent(
            'ne',
            ({ areaId }) => (
                <div style={{ padding: '5px' }}>
                    <button onClick={(e) => {
                        e.stopPropagation();
                        console.log('Options pour', areaId);
                    }}>
                        Options
                    </button>
                </div>
            )
        );

        // Enregistrer un composant pour le slot Sud-Ouest
        const swSlotId = registerSlotComponent(
            'sw',
            ({ areaId }) => (
                <div style={{ padding: '5px' }}>
                    <button onClick={(e) => {
                        e.stopPropagation();
                        console.log('Info pour', areaId);
                    }}>
                        Info
                    </button>
                </div>
            )
        );

        // Nettoyage lors du démontage
        return () => {
            // Désinscrire tous les composants
        };
    }, [
        registerMenuComponent,
        registerStatusComponent,
        registerToolbarComponent,
        registerSlotComponent
    ]);

    // Rendu du contenu principal
    return (
        <div style={{ padding: '20px' }}>
            <h2>Contenu principal</h2>
            <p>ID: {id}</p>
            <p>État: {JSON.stringify(state)}</p>
        </div>
    );
};

export const StructuredAreaExample: React.FC = () => {
    // Enregistrer le type d'area
    useRegisterAreaType(
        'example',
        ExampleComponent,
        { status: 'Initialisé', counter: 42 },
        { displayName: 'Zone Exemple' }
    );

    return (
        <div style={{ position: 'relative', width: '100%', height: '500px' }}>
            <StructuredArea
                id="example-1"
                type="example"
                state={{ status: 'Actif', counter: 42 }}
                viewport={{ left: 50, top: 50, width: 500, height: 400 }}
                isActive={true}
                onSelect={(id) => console.log('Sélectionné:', id)}
            />
        </div>
    );
}; 
