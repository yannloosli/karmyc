import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { Layout, FileUp, FileDown, Edit, Trash2, Plus } from 'lucide-react';
import { actionRegistry } from '../../actions/handlers/actionRegistry';
import { useKarmycStore } from '../../store/areaStore';
import { ControlledMenu, MenuItem, MenuState } from '@szhsin/react-menu';
import { useTranslation } from '../../hooks/useTranslation';


// Types pour les layouts
interface LayoutPreset {
    id: string;
    name: string;
    config: any;
    isBuiltIn: boolean;
}

const STORAGE_KEY = 'karmyc_custom_layouts';

export const LayoutMenu: React.FC = () => {
    const { t } = useTranslation();
    const [isHovered, setIsHovered] = useState(false);
    const [menuState, setMenuState] = useState<MenuState>('closed');
    const [anchorPoint, setAnchorPoint] = useState({ x: 0, y: 0 });
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
                lastLeadAreaId: currentScreen.areas.lastLeadAreaId
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
        setAnchorPoint({ x: e.clientX, y: e.clientY });
        setMenuState('open');
    }, []);

    const handleClose = useCallback(() => {
        setMenuState('closed');
    }, []);

    return (
        <>
            <style>
                {`
                    .layout-context-menu {
                        z-index: 9999 !important;
                    }
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
            <ControlledMenu
                anchorPoint={anchorPoint}
                state={menuState}
                onClose={handleClose}
                menuClassName="layout-context-menu"
            >
                {allPresets.map(preset => (
                    <MenuItem key={preset.id} onClick={() => handleApplyPreset(preset.id)}>
                        <div className="preset-item">
                            <span>{preset.name}</span>
                            {!preset.isBuiltIn && (
                                <div className="preset-actions">
                                    <button onClick={(e) => {
                                        e.stopPropagation();
                                        handleExportPreset(preset);
                                    }} title={t('layout.export', 'Exporter le layout')}>
                                        <FileUp size={16} />
                                    </button>
                                    <button onClick={(e) => {
                                        e.stopPropagation();
                                        handleRenamePreset(preset);
                                    }} title={t('layout.rename', 'Renommer le layout')}>
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeletePreset(preset);
                                    }} title={t('layout.delete', 'Supprimer le layout')}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </MenuItem>
                ))}
                <MenuItem onClick={handleSaveCurrentLayout} title={t('layout.save', 'Save current layout')}>
                    <Plus size={16} /> {t('layout.save', 'Save current layout')}
                </MenuItem>
                <MenuItem onClick={handleImportPreset} title={t('layout.import', 'Import a layout')}>
                    <FileDown size={16} /> {t('layout.import', 'Import a layout')}
                </MenuItem>
            </ControlledMenu>
        </>
    );
}; 
