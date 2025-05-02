import { useKarmycStore } from '@gamesberry/karmyc-core/stores/areaStore';
import React from 'react';
// Importer les styles si nécessaire, par exemple :
// import styles from './ScreenSwitcher.module.css';

export const ScreenSwitcher: React.FC = () => {
    // Récupérer les données nécessaires du store
    const screens = useKarmycStore((state) => state.screens);
    const activeScreenId = useKarmycStore((state) => state.activeScreenId);
    const switchScreen = useKarmycStore((state) => state.switchScreen);
    const addScreen = useKarmycStore((state) => state.addScreen);

    const screenIds = Object.keys(screens);

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '0 10px' }}>
            {/* Lister les boutons pour chaque écran */}
            {screenIds.map((id) => (
                <button
                    key={id}
                    onClick={() => switchScreen(id)}
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
                    {id}
                </button>
            ))}
            {/* Bouton pour ajouter un écran */}
            <button
                onClick={addScreen}
                style={{
                    padding: '2px 6px',
                    border: '1px solid #555',
                    borderRadius: '3px',
                    background: '#2a2a2a',
                    color: '#aaa',
                    cursor: 'pointer',
                    marginLeft: '5px',
                }}
                title="Add new screen"
            >
                +
            </button>
        </div>
    );
}; 
