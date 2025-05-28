import React from 'react';
import { useKarmycStore } from '../stores/areaStore';
import { useContextMenu } from '../hooks/useContextMenu';
import { useRegisterActionHandler } from '../hooks/useRegisterActionHandler';
// Importer les styles si nécessaire, par exemple :
// import styles from './ScreenSwitcher.module.css';

export const ScreenSwitcher: React.FC = () => {
    // Récupérer les données nécessaires du store
    const screens = useKarmycStore((state) => state.screens);
    const activeScreenId = useKarmycStore((state) => state.activeScreenId);
    const switchScreen = useKarmycStore((state) => state.switchScreen);
    const addScreen = useKarmycStore((state) => state.addScreen);
    const removeScreen = useKarmycStore((state) => state.removeScreen);
    const duplicateScreen = useKarmycStore((state) => state.duplicateScreen);
    const { open } = useContextMenu();

    // Enregistrer les actions du menu contextuel
    useRegisterActionHandler('open-new-window', (params) => {
        if (params?.screenId) {
            window.open(`?screen=${params.screenId}`, '_blank');
        }
    });

    useRegisterActionHandler('open-new-tab', (params) => {
        if (params?.screenId) {
            window.open(`?screen=${params.screenId}`, '_blank');
        }
    });

    useRegisterActionHandler('delete-screen', (params) => {
        if (params?.screenId) {
            // Vérifier s'il reste plus d'un écran
            if (Object.keys(screens).length > 1) {
                removeScreen(params.screenId);
            } else {
                console.warn('Impossible de supprimer le dernier écran');
            }
        }
    });

    useRegisterActionHandler('duplicate-screen', (params) => {
        if (params?.screenId) {
            duplicateScreen(params.screenId);
        }
    });

    useRegisterActionHandler('add-screen', () => {
        addScreen();
    });

    // Filtrer et trier les screens non détachés
    const filteredScreenIds = Object.keys(screens)
        .filter((id) => !screens[id]?.isDetached)
        .sort((a, b) => parseInt(a) - parseInt(b));

    const handleContextMenu = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        open({
            position: { x: e.clientX, y: e.clientY },
            items: [
                {
                    id: 'open-new-window',
                    label: 'Ouvrir dans une nouvelle fenêtre',
                    actionId: 'open-new-window',
                    metadata: { screenId: id }
                },
                {
                    id: 'open-new-tab',
                    label: 'Ouvrir dans un nouvel onglet',
                    actionId: 'open-new-tab',
                    metadata: { screenId: id }
                },
                {
                    id: 'delete',
                    label: 'Supprimer',
                    actionId: 'delete-screen',
                    metadata: { screenId: id },
                    disabled: Object.keys(screens).length <= 1 // Désactiver si c'est le dernier écran
                },
                {
                    id: 'duplicate',
                    label: 'Dupliquer',
                    actionId: 'duplicate-screen',
                    metadata: { screenId: id }
                },
                {
                    id: 'add',
                    label: 'Ajouter',
                    actionId: 'add-screen',
                    metadata: {}
                }
            ],
            targetId: id
        });
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '0 10px' }}>
            {/* Lister les boutons pour chaque écran */}
            {filteredScreenIds.map((id, idx) => (
                <button
                    key={id}
                    onClick={() => switchScreen(id)}
                    onContextMenu={(e) => handleContextMenu(e, id)}
                    style={{
                        padding: '2px 8px',
                        border: '1px solid #555',
                        borderRadius: '3px',
                        background: activeScreenId === id ? '#444' : '#2a2a2a',
                        color: activeScreenId === id ? '#eee' : '#aaa',
                        cursor: 'pointer',
                        minWidth: '25px', // Ensure minimum width
                        textAlign: 'center',
                    }}
                    disabled={activeScreenId === id} // Disable active screen button
                >
                    {idx + 1}
                </button>
            ))}

        </div>
    );
}; 
