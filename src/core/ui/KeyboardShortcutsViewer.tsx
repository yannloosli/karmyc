import React from 'react';
import { keyboardShortcutRegistry } from '../plugins/keyboard/actions/keyboardShortcutRegistry';
import { KeyboardShortcut } from '../plugins/keyboard/actions/keyboardShortcutRegistry';

const KeyboardShortcutsViewer: React.FC = () => {
    const allShortcuts = keyboardShortcutRegistry.getAllShortcuts();
    
    // Séparer les raccourcis globaux et par type d'aire
    const globalShortcuts = allShortcuts.filter(s => s.isGlobal);
    const areaShortcuts = allShortcuts.filter(s => !s.isGlobal);
    
    // Grouper les raccourcis par type d'aire
    const shortcutsByArea = areaShortcuts.reduce((acc, shortcut) => {
        const areaType = shortcut.areaType || 'Unknown';
        if (!acc[areaType]) {
            acc[areaType] = [];
        }
        acc[areaType].push(shortcut);
        return acc;
    }, {} as Record<string, KeyboardShortcut[]>);

    return (
        <div style={{ 
            padding: '20px',
            color: 'white',
            height: '100%',
            overflow: 'auto'
        }}>
            <h2 style={{ marginBottom: '20px' }}>Raccourcis Clavier</h2>
            
            {/* Raccourcis Globaux */}
            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ 
                    borderBottom: '1px solid rgba(255,255,255,0.2)',
                    paddingBottom: '10px',
                    marginBottom: '15px'
                }}>
                    Raccourcis Globaux
                </h3>
                <div style={{ display: 'grid', gap: '10px' }}>
                    {globalShortcuts.map((shortcut, index) => (
                        <div key={index} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '8px',
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            borderRadius: '4px'
                        }}>
                            <span>{shortcut.name}</span>
                            <span style={{ 
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontFamily: 'monospace'
                            }}>
                                {shortcut.modifierKeys?.map(mod => mod).join(' + ')} + {shortcut.key}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Raccourcis par Type d'Aire */}
            {Object.entries(shortcutsByArea).map(([areaType, shortcuts]) => (
                <div key={areaType} style={{ marginBottom: '30px' }}>
                    <h3 style={{ 
                        borderBottom: '1px solid rgba(255,255,255,0.2)',
                        paddingBottom: '10px',
                        marginBottom: '15px'
                    }}>
                        {areaType}
                    </h3>
                    <div style={{ display: 'grid', gap: '10px' }}>
                        {shortcuts.map((shortcut, index) => (
                            <div key={index} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '8px',
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                borderRadius: '4px'
                            }}>
                                <span>{shortcut.name}</span>
                                <span style={{ 
                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontFamily: 'monospace'
                                }}>
                                    {shortcut.modifierKeys?.map(mod => mod).join(' + ')} + {shortcut.key}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default KeyboardShortcutsViewer; 
