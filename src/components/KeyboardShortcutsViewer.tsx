import React from 'react';
import { keyboardShortcutRegistry } from '../core/registries/keyboardShortcutRegistry';
import { KeyboardShortcut } from '../core/registries/keyboardShortcutRegistry';
import { t } from '../core/utils/translation';
import { AreaComponentProps } from '../types/areaTypes';

const KeyboardShortcutsViewer: React.FC<AreaComponentProps> = ({
    id: _id,
    state: _state,
    type: _type,
    viewport,
    raised: _raised
}) => {
    
    const allShortcuts = keyboardShortcutRegistry.getAllShortcuts();
    
    // Separate global shortcuts and by area type
    const globalShortcuts = allShortcuts.filter(s => s.isGlobal);
    const areaShortcuts = allShortcuts.filter(s => !s.isGlobal);
    
    // Group shortcuts by area type
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
            padding: '15px',
            color: 'white',
            height: '100%',
            overflow: 'auto'
        }}>
            {/* Global Shortcuts */}
            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ 
                    borderBottom: '1px solid rgba(255,255,255,0.2)',
                    paddingBottom: '10px',
                    marginBottom: '15px'
                }}>
                    {t('shortcuts.global.title', 'Global Shortcuts')}
                </h3>
                <div style={{ display: 'grid', gap: '5px' }}>
                    {globalShortcuts.map((shortcut, index) => (
                        <div key={index} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '8px',
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            borderRadius: '4px'
                        }}>
                            <span>{t(`shortcuts.${shortcut.name}`, shortcut.name)}</span>
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

            {/* Shortcuts by Area Type */}
            {Object.entries(shortcutsByArea).map(([areaType, shortcuts]) => (
                <div key={areaType} style={{ marginBottom: '30px' }}>
                    <h3 style={{ 
                        borderBottom: '1px solid rgba(255,255,255,0.2)',
                        paddingBottom: '10px',
                        marginBottom: '15px'
                    }}>
                        {t(`shortcuts.area.${areaType}`, areaType)}
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
                                <span>{t(`shortcuts.${shortcut.name}`, shortcut.name)}</span>
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
