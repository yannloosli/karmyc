import React from 'react';
import { PlusIcon, CopyIcon, AppWindow, ExternalLinkIcon, TrashIcon } from 'lucide-react';

import { useScreenManagement } from '@hooks/useScreenManagement';
import { useContextMenu } from '@hooks/useContextMenu';

import { useRegisterActionHandler } from '@hooks/useRegisterActionHandler';

import { t } from '@core/utils/translation';

export const ScreenSwitcher: React.FC = () => {
    
    const { screens, activeScreenId, switchScreen, addScreen, removeScreen, duplicateScreen } = useScreenManagement();
    const { open } = useContextMenu();

    // Enregistrer les actions du menu contextuel
    useRegisterActionHandler('open-new-window', (params) => {
        if (params?.screenId) {
            window.open(`?screen=${params.screenId}`, '_blank', 'noopener,noreferrer');
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
                console.warn('Cannot remove the last screen');
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
            menuClassName: 'screen-switcher-menu',
            items: [
                {
                    id: 'add',
                    label: t('screen.menu.add', 'Add'),
                    icon: PlusIcon,
                    actionId: 'add-screen',
                    metadata: {}
                },
                {
                    id: 'duplicate',
                    label: t('screen.menu.duplicate', 'Duplicate'),
                    icon: CopyIcon,
                    actionId: 'duplicate-screen',
                    metadata: { screenId: id }
                },
                {
                    id: 'open-new-window',
                    label: t('screen.menu.openNewWindow', 'Open in new window'),
                    icon: AppWindow,
                    actionId: 'open-new-window',
                    metadata: { screenId: id }
                },
                {
                    id: 'open-new-tab',
                    label: t('screen.menu.openNewTab', 'Open in new tab'),
                    icon: ExternalLinkIcon,
                    actionId: 'open-new-tab',
                    metadata: { screenId: id }
                },
                {
                    id: 'delete',   
                    label: t('screen.menu.delete', 'Delete'),
                    icon: TrashIcon,
                    actionId: 'delete-screen',
                    metadata: { screenId: id },
                    disabled: Object.keys(screens).length <= 1
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
                    title={t('screen.switch', `Switch to screen ${idx + 1}`)}
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
