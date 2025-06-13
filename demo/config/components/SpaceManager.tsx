import { useMemo, useState } from 'react';
import { shallow } from 'zustand/shallow';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import { AreaComponentProps } from '../../../src/types/areaTypes';
import { useSpace } from '../../../src/hooks/useSpace';
import { useKarmycStore } from '../../../src/data/mainStore';
import { useSpaceStore } from '../../../src/store/spaceStore';
import { t } from '../../../src/data/utils/translation';
import { Plus, Trash2, Settings } from 'lucide-react';

interface SpaceType {
    id: string;
    name: string;
    sharedState: {
        color?: string;
        [key: string]: any;
    };
}

interface SpaceListItem {
    id: string;
    space: SpaceType;
    isActive: boolean;
    areasCount: number;
}

// Type générique utilisé dans le store pour les areas
type AreaTypeValue = any;

// Interface pour représenter une area dans le store
interface AreaType<T = AreaTypeValue> {
    id: string;
    type: string;
    spaceId?: string | null;
    state: T;
    position?: {
        x: number;
        y: number;
    };
    size?: {
        width: number;
        height: number;
    };
    [key: string]: any;
}

// Define expected return types for selectors
interface AreasMap { [key: string]: AreaType }

export const SpaceManager: React.FC<AreaComponentProps> = ({
    viewport
}) => {
    // Get actions and activeId from the hook
    const { activeSpaceId, createSpace, deleteSpace, setActive, updateSharedState, pilotMode, setPilotMode } = useSpace();

    // Use useStoreWithEqualityFn and shallow comparison for selectors returning objects/arrays
    const spaces = useSpaceStore().getAllSpaces()


    const allAreas = useStoreWithEqualityFn(
        useKarmycStore,
        (s) => s.getAllAreas() as AreasMap, // Cast to expected type
        shallow
    );

    const [newSpaceName, setNewSpaceName] = useState('');
    const [newColor, setNewColor] = useState('#1890ff');

    // Calculer les areas par espace en utilisant les données déjà obtenues
    const areasBySpaceId = useMemo(() => {
        const result: Record<string, AreaType[]> = {};

        // Initialiser les espaces avec des tableaux vides
        for (const key in spaces) {
            result[key] = [];
        }

        // Parcourir toutes les areas et les grouper par espace
        Object.values(allAreas).forEach((area) => {
            const spaceId = area.spaceId;
            if (spaceId && result[spaceId]) {
                result[spaceId].push(area);
            }
        });

        return result;
    }, [spaces, allAreas]);

    // Préparer les données des espaces pour l'affichage
    const spacesData = useMemo(() => {
        const list: SpaceListItem[] = [];

        for (const key in spaces) {
            if (Object.prototype.hasOwnProperty.call(spaces, key)) {
                const spaceObj = spaces[key] as SpaceType;
                const areasInSpace = areasBySpaceId[key] || [];

                list.push({
                    id: key,
                    space: spaceObj,
                    isActive: key === activeSpaceId,
                    areasCount: areasInSpace.length
                });
            }
        }

        return list;
    }, [spaces, activeSpaceId, areasBySpaceId]);

    // Créer un nouvel espace
    const handleCreateSpace = () => {
        if (newSpaceName.trim()) {
            createSpace(newSpaceName.trim(), { color: newColor });
            setNewSpaceName('');
        }
    };

    // Mettre à jour la couleur partagée d'un espace
    const handleColorChange = (spaceId: string, color: string) => {
        updateSharedState(spaceId, { color });
    };

    return (
        <div style={{
            width: viewport.width,
            height: viewport.height,
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            overflow: 'auto'
        }}>
            <div style={{
                padding: '0.25rem',
                border: '1px solid #eee',
                borderRadius: '4px',
                background: '#f9f9f9',
                flex: 1,
                overflowY: 'auto'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem',
                    padding: '0.5rem',
                    borderBottom: '1px solid #eee'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>Pilot mode:</span>
                        <button
                            onClick={() => setPilotMode(pilotMode === 'MANUAL' ? 'AUTO' : 'MANUAL')}
                            title={t('space.pilotMode', 'Change pilot mode')}
                            style={{
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                border: '1px solid #ccc',
                                background: pilotMode === 'MANUAL' ? '#1890ff' : 'white',
                                color: pilotMode === 'MANUAL' ? 'white' : 'black',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}
                        >
                            <Settings size={16} />
                            {pilotMode === 'MANUAL' ? 'Manual' : 'Automatic'}
                        </button>
                    </div>
                </div>

                {spacesData.length === 0 && (
                    <p style={{ color: '#999', fontStyle: 'italic' }}>
                        {t('space.empty', 'No space created. Create your first space below.')}
                    </p>
                )}

                {spacesData.map(({ id: spaceId, space, isActive, areasCount }) => (
                    <div
                        key={spaceId}
                        style={{
                            padding: '1rem',
                            marginBottom: '0.5rem',
                            border: `2px solid ${isActive ? '#1890ff' : '#eee'}`,
                            borderRadius: '4px',
                            background: isActive ? '#e6f7ff' : 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onClick={() => {
                            setActive(spaceId);
                            setPilotMode('MANUAL');
                        }}
                        title={t('space.select', `Select space ${space.name}`)}
                    >
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '0.5rem'
                        }}>
                            <h4 style={{ margin: 0 }}>{space.name}</h4>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="color"
                                    value={space.sharedState.color || '#1890ff'}
                                    onChange={(e) => handleColorChange(spaceId, e.target.value)}
                                    title={t('space.color', 'Change space color')}
                                    style={{
                                        height: '26px',
                                        width: '40px',
                                        padding: '0',
                                        border: '1px solid #ccc',
                                        borderRadius: '4px'
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm(t('space.deleteConfirm', `Do you really want to delete the space "${space.name}"?`))) {
                                            deleteSpace(spaceId);
                                        }
                                    }}
                                    title={t('space.delete', 'Delete space')}
                                    style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '4px',
                                        border: 'none',
                                        background: '#ff4d4f',
                                        color: 'white',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div style={{ fontSize: '0.9rem', color: '#666' }}>
                            {areasCount === 0 ? (
                                <span style={{ fontStyle: 'italic' }}>{t('space.noAreas', 'No area in this space')}</span>
                            ) : (
                                <>
                                    <b>{areasCount}</b> {t('space.areasCount', `area${areasCount > 1 ? 's' : ''} in this space`)}
                                </>
                            )}
                        </div>
                    </div>
                ))}

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                }}>
                    <input
                        type="text"
                        value={newSpaceName}
                        onChange={(e) => setNewSpaceName(e.target.value)}
                        placeholder={t('space.namePlaceholder', 'Space name')}
                        title={t('space.nameInput', 'Enter the name of the new space')}
                        style={{
                            padding: '0.5rem',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            marginRight: '0.5rem'
                        }}
                    />
                    <input
                        type="color"
                        value={newColor}
                        onChange={(e) => setNewColor(e.target.value)}
                        title={t('space.colorInput', 'Choose the color of the new space')}
                        style={{
                            height: '26px',
                            width: '40px',
                            padding: '0',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            marginRight: '0.5rem'
                        }}
                    />
                    <button
                        onClick={handleCreateSpace}
                        title={t('space.create', 'Create new space')}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '4px',
                            border: 'none',
                            background: '#1890ff',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}
                    >
                        <Plus size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}; 
