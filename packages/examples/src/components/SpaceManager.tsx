import { useSpace } from '@gamesberry/karmyc-core/src/hooks/useSpace';
import { AreaComponentProps } from '@gamesberry/karmyc-core/src/types/areaTypes';
import { useAreaStore } from '@gamesberry/karmyc-core/src/stores/areaStore';
import { useSpaceStore } from '@gamesberry/karmyc-core/src/stores/spaceStore';
import React, { useMemo, useState } from 'react';
import { shallow } from 'zustand/shallow';
import { useStoreWithEqualityFn } from 'zustand/traditional';

interface SpaceManagerState {
    // Pas de propriétés spécifiques pour le moment
}

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
interface SpacesMap { [key: string]: SpaceType }
interface AreasMap { [key: string]: AreaType }

export const SpaceManager: React.FC<AreaComponentProps<SpaceManagerState>> = ({
    id,
    viewport
}) => {
    // Get actions and activeId from the hook
    const { activeSpaceId, createSpace, deleteSpace, setActive, updateSharedState, getSpaceById } = useSpace();

    // Use useStoreWithEqualityFn and shallow comparison for selectors returning objects/arrays
    const spaces = useStoreWithEqualityFn(
        useSpaceStore,
        (s) => s.getAllSpaces() as SpacesMap, // Cast to expected type
        shallow
    );
    const activeSpace = useStoreWithEqualityFn(
        useSpaceStore,
        (s) => s.getActiveSpace() as SpaceType | null, // Cast to expected type
        shallow
    );
    const allAreas = useStoreWithEqualityFn(
        useAreaStore,
        (s) => s.getAllAreas() as AreasMap, // Cast to expected type
        shallow
    );

    const addArea = useAreaStore((s) => s.addArea); // Selector returning a function, no shallow needed

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

    // Créer un color picker dans l'espace actif
    const handleCreateColorPicker = () => {
        if (activeSpace) {
            addArea({
                type: 'color-picker',
                state: { color: activeSpace.sharedState.color || '#1890ff' },
                id: ``,
                spaceId: activeSpace.id
            });
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
            background: '#fff',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            overflow: 'auto'
        }}>
            <h2>Gestionnaire d'espaces</h2>

            {/* Création d'un nouvel espace */}
            <div style={{
                padding: '1rem',
                border: '1px solid #eee',
                borderRadius: '4px',
                background: '#f9f9f9'
            }}>
                <h3>Créer un nouvel espace</h3>
                <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'center',
                    marginBottom: '0.5rem'
                }}>
                    <input
                        type="text"
                        value={newSpaceName}
                        onChange={(e) => setNewSpaceName(e.target.value)}
                        placeholder="Nom de l'espace"
                        style={{
                            padding: '0.5rem',
                            borderRadius: '4px',
                            border: '1px solid #ccc',
                            flex: 1
                        }}
                    />

                    <input
                        type="color"
                        value={newColor}
                        onChange={(e) => setNewColor(e.target.value)}
                        style={{
                            height: '38px',
                            width: '50px',
                            padding: '0',
                            border: '1px solid #ccc',
                            borderRadius: '4px'
                        }}
                    />

                    <button
                        onClick={handleCreateSpace}
                        disabled={!newSpaceName.trim()}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '4px',
                            border: 'none',
                            background: '#1890ff',
                            color: 'white',
                            cursor: newSpaceName.trim() ? 'pointer' : 'not-allowed',
                            opacity: newSpaceName.trim() ? 1 : 0.6
                        }}
                    >
                        Créer
                    </button>
                </div>
            </div>

            {/* Liste des espaces existants */}
            <div style={{
                padding: '1rem',
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
                    marginBottom: '1rem'
                }}>
                    <h3 style={{ margin: 0 }}>Espaces ({spacesData.length})</h3>
                    {activeSpace && (
                        <button
                            onClick={handleCreateColorPicker}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '4px',
                                border: 'none',
                                background: '#52c41a',
                                color: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            + Color Picker
                        </button>
                    )}
                </div>

                {spacesData.length === 0 && (
                    <p style={{ color: '#999', fontStyle: 'italic' }}>
                        Aucun espace créé. Créez votre premier espace ci-dessus.
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
                        onClick={() => setActive(spaceId)}
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
                                        if (window.confirm(`Supprimer l'espace "${space.name}" ?`)) {
                                            deleteSpace(spaceId);
                                        }
                                    }}
                                    style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '4px',
                                        border: 'none',
                                        background: '#ff4d4f',
                                        color: 'white',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Supprimer
                                </button>
                            </div>
                        </div>

                        <div style={{ fontSize: '0.9rem', color: '#666' }}>
                            {areasCount === 0 ? (
                                <span style={{ fontStyle: 'italic' }}>Aucune area dans cet espace</span>
                            ) : (
                                <>
                                    <b>{areasCount}</b> area{areasCount > 1 ? 's' : ''} dans cet espace
                                </>
                            )}
                        </div>

                        {/* Informations partagées */}
                        <div style={{
                            marginTop: '0.5rem',
                            padding: '0.5rem',
                            background: '#f5f5f5',
                            borderRadius: '4px',
                            fontSize: '0.9rem'
                        }}>
                            <div>
                                <span style={{ fontWeight: 'bold' }}>Couleur partagée:</span>{' '}
                                <span style={{
                                    display: 'inline-block',
                                    width: '16px',
                                    height: '16px',
                                    background: space.sharedState.color || '#1890ff',
                                    borderRadius: '2px',
                                    border: '1px solid #ddd',
                                    verticalAlign: 'middle',
                                    marginLeft: '0.25rem'
                                }}></span>
                                <span style={{ marginLeft: '0.25rem' }}>{space.sharedState.color || '#1890ff'}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}; 
