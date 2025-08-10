import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { Layout, FileUp, FileDown, Edit, Trash2, Plus } from 'lucide-react';
import { actionRegistry } from '../../core/registries/actionRegistry';
import { useKarmycStore } from '../../core/store';
import { t } from '../../core/utils/translation';
import { useContextMenu } from '../../hooks/useContextMenu';
import { LayoutPreset } from '../../types';
import type { ContextMenuItem } from '../../core/types/context-menu-types';

const STORAGE_KEY = 'karmyc_custom_layouts';

export const LayoutMenu: React.FC = () => {
    const { open } = useContextMenu();
    const [isHovered, setIsHovered] = useState(false);
    const store = useKarmycStore();
    const builtInLayouts = store.options?.builtInLayouts || [];

    // Charger les presets personnalisés depuis le localStorage
    const [userPresets, setUserPresets] = useState<LayoutPreset[]>(() => {
        const savedPresets = localStorage.getItem(STORAGE_KEY);
        return savedPresets ? JSON.parse(savedPresets) : [];
    });

    // Sauvegarder les presets personnalisés dans le localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userPresets));
    }, [userPresets]);

    // Mémoriser les presets pour éviter les re-renders inutiles
    const allPresets = useMemo(() => {
        return [...builtInLayouts, ...userPresets];
    }, [builtInLayouts, userPresets]);

    const updateUserPresets = useCallback((newPresets: LayoutPreset[]) => {
        setUserPresets(newPresets);
        useKarmycStore.setState(state => ({
            ...state,
            layout_preset: newPresets
        }));
    }, []);

    const handleExportPreset = useCallback((preset: LayoutPreset) => {
        const dataStr = JSON.stringify(preset, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = `${preset.name}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }, []);

    const handleImportPreset = useCallback(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const presetData = JSON.parse(event.target?.result as string);
                    // Générer un nouvel ID pour le preset importé
                    const newPreset = {
                        ...presetData,
                        id: Date.now().toString(),
                        isBuiltIn: false
                    };
                    updateUserPresets([...userPresets, newPreset]);
                } catch (error) {
                    console.error('Erreur lors de l\'import du preset:', error);
                }
            };
            reader.readAsText(file);
        };

        input.click();
    }, [userPresets, updateUserPresets]);

    const handleRenamePreset = useCallback((preset: LayoutPreset) => {
        const newName = prompt('Nouveau nom du preset:', preset.name);
        if (newName && newName !== preset.name) {
            updateUserPresets(
                userPresets.map(p => p.id === preset.id ? { ...p, name: newName } : p)
            );
        }
    }, [userPresets, updateUserPresets]);

    const handleDeletePreset = useCallback((preset: LayoutPreset) => {
        if (confirm(`Voulez-vous vraiment supprimer le preset "${preset.name}" ?`)) {
            updateUserPresets(userPresets.filter(p => p.id !== preset.id));
        }
    }, [userPresets, updateUserPresets]);

    const handleSaveCurrentLayout = useCallback(() => {
        const activeScreenId = store.activeScreenId;
        const currentScreen = store.screens[activeScreenId];
        if (!currentScreen) return;

        const presetName = prompt('Nom du nouveau preset:');
        if (!presetName) return;

        const newPreset: LayoutPreset = {
            id: Date.now().toString(),
            name: presetName,
            config: {
                _id: currentScreen.areas._id,
                rootId: currentScreen.areas.rootId,
                errors: [],
                activeAreaId: currentScreen.areas.activeAreaId,
                joinPreview: null,
                layout: currentScreen.areas.layout,
                areas: currentScreen.areas.areas,
                viewports: currentScreen.areas.viewports,
                areaToOpen: null,
                lastSplitResultData: null,
                lastLeadAreaId: currentScreen.areas.lastLeadAreaId || null
            },
            isBuiltIn: false
        };

        updateUserPresets([...userPresets, newPreset]);
    }, [store, userPresets, updateUserPresets]);

    const handleApplyPreset = useCallback((presetId: string) => {
        const preset = allPresets.find(p => p.id === presetId);
        if (!preset) return;

        const activeScreenId = store.activeScreenId;
        if (!activeScreenId) return;

        useKarmycStore.setState(state => {
            const screen = state.screens[activeScreenId];
            if (!screen) return;

            // Réinitialiser complètement les areas avec la configuration du preset
            screen.areas = {
                _id: preset.config._id,
                rootId: preset.config.rootId,
                errors: [],
                activeAreaId: preset.config.activeAreaId,
                joinPreview: null,
                layout: { ...preset.config.layout },
                areas: { ...preset.config.areas },
                viewports: { ...preset.config.viewports },
                areaToOpen: null,
                lastSplitResultData: null,
                lastLeadAreaId: preset.config.lastLeadAreaId
            };

            // Mettre à jour le timestamp pour forcer le rafraîchissement
            state.lastUpdated = Date.now();
        });
    }, [store, allPresets]);

    useEffect(() => {
        actionRegistry.registerActionHandler('layout.import', handleImportPreset);
        actionRegistry.registerActionHandler('layout.export', handleExportPreset);
        actionRegistry.registerActionHandler('layout.rename', handleRenamePreset);
        actionRegistry.registerActionHandler('layout.delete', handleDeletePreset);
        actionRegistry.registerActionHandler('layout.save', handleSaveCurrentLayout);
        actionRegistry.registerActionHandler('layout.apply', handleApplyPreset);

        return () => {
            actionRegistry.unregisterActionHandler('layout.import');
            actionRegistry.unregisterActionHandler('layout.export');
            actionRegistry.unregisterActionHandler('layout.rename');
            actionRegistry.unregisterActionHandler('layout.delete');
            actionRegistry.unregisterActionHandler('layout.save');
            actionRegistry.unregisterActionHandler('layout.apply');
        };
    }, [handleImportPreset, handleExportPreset, handleRenamePreset, handleDeletePreset, handleSaveCurrentLayout, handleApplyPreset]);

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();

        // Construire un menu strictement typé pour éviter les enfants React invalides
        const items: ContextMenuItem[] = [
            // Liste des presets
            ...allPresets.map<ContextMenuItem>(preset => ({
                id: `preset-${preset.id}`,
                label: preset.name,
                actionId: 'layout.apply',
                metadata: { presetId: preset.id },
                // Sous-menu d'actions pour les presets non intégrés
                children: preset.isBuiltIn ? undefined : [
                    {
                        id: `preset-${preset.id}-export`,
                        label: t('layout.export', 'Exporter le layout'),
                        actionId: 'layout.export',
                        metadata: { preset }
                    },
                    {
                        id: `preset-${preset.id}-rename`,
                        label: t('layout.rename', 'Renommer le layout'),
                        actionId: 'layout.rename',
                        metadata: { preset }
                    },
                    {
                        id: `preset-${preset.id}-delete`,
                        label: t('layout.delete', 'Supprimer le layout'),
                        actionId: 'layout.delete',
                        metadata: { preset }
                    }
                ]
            })),
            // Séparateur simple
            { id: 'separator-actions', label: '---', actionId: 'area.separator' },
            // Actions globales
            {
                id: 'save-current-layout',
                label: t('layout.save', 'Save current layout'),
                actionId: 'layout.save'
            },
            {
                id: 'import-layout',
                label: t('layout.import', 'Import a layout'),
                actionId: 'layout.import'
            }
        ];

        open({
            position: { x: e.clientX, y: e.clientY },
            items,
            menuClassName: 'context-menu layout-context-menu',
            menuType: 'default'
        });
    }, [open, allPresets, t]);

    return (
        <>
            <style>
                {`
 
                    .preset-item {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        width: 100%;
                        padding: 4px 8px;
                    }
                    .preset-actions {
                        display: flex;
                        gap: 4px;
                    }
                    .preset-actions button {
                        background: none;
                        border: none;
                        padding: 4px;
                        cursor: pointer;
                        color: inherit;
                    }
                    .preset-actions button:hover {
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 4px;
                    }
                `}
            </style>

            <div
                onContextMenu={handleContextMenu}
                onClick={handleContextMenu}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                title={t('layout.menu', 'Menu des layouts')}
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
                <Layout size={26} />
            </div>
        </>
    );
}; 
