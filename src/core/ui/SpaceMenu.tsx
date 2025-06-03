import React, { useCallback, useState, useEffect } from 'react';
import { useContextMenu } from '../hooks/useContextMenu';
import { useSpace } from '../../spaces/useSpace';
import { Plus, FileUp, FileDown, History, X, FolderOpen, Edit } from 'lucide-react';
import { ContextMenuItem } from '../types';
import { actionRegistry } from '../actions/handlers/actionRegistry';

export const SpaceMenu: React.FC = () => {
    const { open } = useContextMenu();
    const [isHovered, setIsHovered] = useState(false);
    const { 
        spaceList, 
        activeSpaceId,
        openSpaces,
        createSpace, 
        deleteSpace, 
        setActive,
        openSpace,
        closeSpace,
        updateSpaceProperties 
    } = useSpace();

    const handleExportSpace = useCallback(() => {
        const space = spaceList.find(s => s.id === activeSpaceId);
        if (!space) return;

        const dataStr = JSON.stringify(space, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `${space.name}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }, [spaceList, activeSpaceId]);

    const handleImportSpace = useCallback(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const spaceData = JSON.parse(event.target?.result as string);
                    const newSpaceId = createSpace(spaceData.name, spaceData.sharedState);
                    if (newSpaceId) {
                        setActive(newSpaceId);
                    }
                } catch (error) {
                    console.error('Error importing space:', error);
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }, [createSpace, setActive]);

    const handleRenameSpace = useCallback(() => {
        const space = spaceList.find(s => s.id === activeSpaceId);
        if (!space || !activeSpaceId) return;

        const newName = prompt('Nouveau nom du space:', space.name);
        if (newName && newName !== space.name) {
            updateSpaceProperties(activeSpaceId, { name: newName });
        }
    }, [spaceList, activeSpaceId, updateSpaceProperties]);

    // Enregistrer les actions
    useEffect(() => {
        actionRegistry.registerActionHandler('space.new', () => {
            const newSpaceId = createSpace('Nouveau Space');
            if (newSpaceId) {
                setActive(newSpaceId);
            }
        });

        actionRegistry.registerActionHandler('space.import', handleImportSpace);
        actionRegistry.registerActionHandler('space.export', handleExportSpace);
        actionRegistry.registerActionHandler('space.rename', handleRenameSpace);
        actionRegistry.registerActionHandler('space.close', (params: { spaceId: string }) => {
            const spaceId = params.spaceId || activeSpaceId;
            if (spaceId) {
                closeSpace(spaceId);
            }
        });
        actionRegistry.registerActionHandler('space.open', (params: { spaceId: string }) => {
            if (params.spaceId) {
                openSpace(params.spaceId);
                setActive(params.spaceId);
            }
        });

        return () => {
            actionRegistry.unregisterActionHandler('space.new');
            actionRegistry.unregisterActionHandler('space.import');
            actionRegistry.unregisterActionHandler('space.export');
            actionRegistry.unregisterActionHandler('space.rename');
            actionRegistry.unregisterActionHandler('space.close');
            actionRegistry.unregisterActionHandler('space.open');
        };
    }, [createSpace, handleImportSpace, handleExportSpace, handleRenameSpace, closeSpace, openSpace, setActive, activeSpaceId]);

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        
        const recentSpaces = spaceList.slice(-10).reverse();
        const hasActiveSpace = !!activeSpaceId;
        
        const menuItems: ContextMenuItem[] = [
            {
                id: 'new',
                label: 'Nouveau Space',
                actionId: 'space.new',
                icon: Plus
            },
            {
                id: 'import',
                label: 'Importer Space',
                actionId: 'space.import',
                icon: FileUp
            },
            {
                id: 'export',
                label: 'Exporter Space',
                actionId: 'space.export',
                icon: FileDown,
                disabled: !hasActiveSpace
            },
            {
                id: 'rename',
                label: 'Renommer Space',
                actionId: 'space.rename',
                icon: Edit,
                disabled: !hasActiveSpace
            },
            {
                id: 'close',
                label: 'Fermer Space Actif',
                actionId: 'space.close',
                icon: X,
                disabled: !hasActiveSpace
            }
        ];

        // Ajouter la liste des espaces ouverts
        if (openSpaces.length > 0) {
            menuItems.push(
                {
                    id: 'separator1',
                    label: '---',
                    actionId: 'area.separator'
                },
                {
                    id: 'open',
                    label: 'Espaces Ouverts',
                    actionId: 'space.open',
                    icon: FolderOpen,
                    children: openSpaces.map(space => ({
                        id: `open-${space.id}`,
                        label: space.name,
                        actionId: 'space.open',
                        metadata: { spaceId: space.id }
                    }))
                }
            );
        }

        // Ajouter la liste des espaces récents
        if (recentSpaces.length > 0) {
            menuItems.push(
                {
                    id: 'separator2',
                    label: '---',
                    actionId: 'area.separator'
                },
                {
                    id: 'recent',
                    label: 'Spaces Récents',
                    actionId: 'space.recent',
                    icon: History,
                    children: recentSpaces.map(space => ({
                        id: `recent-${space.id}`,
                        label: space.name,
                        actionId: 'space.open',
                        metadata: { spaceId: space.id }
                    }))
                }
            );
        }
        
        open({
            position: { x: e.clientX, y: e.clientY },
            items: menuItems,
            menuClassName: 'space-context-menu'
        });
    }, [open, spaceList, activeSpaceId, openSpaces]);

    return (
        <>
            <style>
                {`
                    .space-context-menu {
                        z-index: 9999 !important;
                    }
                `}
            </style>
            <div 
                onContextMenu={handleContextMenu}
                onClick={handleContextMenu}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{ 
                    cursor: 'pointer',
                    padding: '8px',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    userSelect: 'none',
                    backgroundColor: isHovered ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    transition: 'background-color 0.2s ease'
                }}
            >
                <FolderOpen size={26} />
            </div>
        </>
    );
}; 
