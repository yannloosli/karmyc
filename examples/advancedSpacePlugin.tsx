import React from 'react';
import { ZustandPlugin } from '../src/hooks/usePluginSystem';
import { useSpaceStore, SpaceStateType } from '../src/core/spaceStore';
import { usePluginSystem } from '../src/hooks/usePluginSystem';
import { actionRegistry } from '../src/core/registries/actionRegistry';

// ============================================================================
// EXEMPLE 1: Plugin pour ajouter des statistiques aux espaces
// ============================================================================

/**
 * Plugin qui ajoute des statistiques aux espaces
 * - Compte le nombre de modifications
 * - Ajoute un timestamp de dernière modification
 */
export const spaceStatsPlugin: ZustandPlugin<SpaceStateType> = {
    name: 'space-stats',
    
    // Initialisation du plugin
    onStoreInit: (store) => {
        console.log('Space Stats Plugin initialisé');
        
        // Ajouter des propriétés par défaut aux espaces existants
        const state = store.getState();
        const updatedSpaces = { ...state.spaces };
        
        Object.keys(updatedSpaces).forEach(spaceId => {
            const space = updatedSpaces[spaceId];
            // Ajouter des propriétés personnalisées au sharedState
            if (!space.sharedState.actionType) {
                space.sharedState.actionType = 'stats';
            }
            if (!space.sharedState.payload) {
                space.sharedState.payload = {
                    modificationCount: 0,
                    lastModified: Date.now()
                };
            }
        });
        
        store.setState({ spaces: updatedSpaces });
    },
    
    // Écouter les changements d'état
    onStoreChange: (newState, prevState) => {
        // Détecter les modifications d'espaces
        Object.keys(newState.spaces).forEach(spaceId => {
            const newSpace = newState.spaces[spaceId];
            const prevSpace = prevState.spaces[spaceId];
            
            if (prevSpace && newSpace.sharedState !== prevSpace.sharedState) {
                // Incrémenter le compteur de modifications
                const payload = newSpace.sharedState.payload as any;
                if (payload) {
                    payload.modificationCount = (payload.modificationCount || 0) + 1;
                    payload.lastModified = Date.now();
                }
            }
        });
    },
    
    // Actions personnalisées
    actions: {
        'RESET_SPACE_STATS': (payload: { spaceId: string }) => {
            const store = useSpaceStore.getState();
            const space = store.spaces[payload.spaceId];
            
            if (space) {
                const spacePayload = space.sharedState.payload as any;
                if (spacePayload) {
                    spacePayload.modificationCount = 0;
                    spacePayload.lastModified = Date.now();
                    
                    // Mettre à jour le store
                    useSpaceStore.setState({
                        spaces: { ...store.spaces }
                    });
                }
            }
        },
        
        'GET_SPACE_STATS': (payload: { spaceId: string }) => {
            const store = useSpaceStore.getState();
            const space = store.spaces[payload.spaceId];
            
            if (space) {
                const spacePayload = space.sharedState.payload as any;
                if (spacePayload) {
                    return {
                        modificationCount: spacePayload.modificationCount || 0,
                        lastModified: spacePayload.lastModified || Date.now(),
                        daysSinceLastModification: Math.floor(
                            (Date.now() - (spacePayload.lastModified || Date.now())) / (1000 * 60 * 60 * 24)
                        )
                    };
                }
            }
            return null;
        }
    }
};

// ============================================================================
// EXEMPLE 2: Plugin pour ajouter des tags aux espaces
// ============================================================================

/**
 * Plugin qui ajoute un système de tags aux espaces
 * - Permet d'ajouter/supprimer des tags
 * - Fournit des actions pour filtrer par tags
 */
export const spaceTagsPlugin: ZustandPlugin<SpaceStateType> = {
    name: 'space-tags',
    
    onStoreInit: (store) => {
        console.log('Space Tags Plugin initialisé');
        
        // Initialiser les tags pour les espaces existants
        const state = store.getState();
        const updatedSpaces = { ...state.spaces };
        
        Object.keys(updatedSpaces).forEach(spaceId => {
            const space = updatedSpaces[spaceId];
            if (!space.sharedState.payload) {
                space.sharedState.payload = { tags: [] };
            } else {
                const payload = space.sharedState.payload as any;
                if (!payload.tags) {
                    payload.tags = [];
                }
            }
        });
        
        store.setState({ spaces: updatedSpaces });
    },
    
    actions: {
        'ADD_SPACE_TAG': (payload: { spaceId: string; tag: string; color?: string }) => {
            const store = useSpaceStore.getState();
            const space = store.spaces[payload.spaceId];
            
            if (space) {
                const spacePayload = space.sharedState.payload as any;
                if (spacePayload) {
                    const tags = spacePayload.tags || [];
                    const newTag = {
                        name: payload.tag,
                        color: payload.color || '#007bff',
                        addedAt: Date.now()
                    };
                    
                    // Éviter les doublons
                    if (!tags.find((t: any) => t.name === payload.tag)) {
                        spacePayload.tags = [...tags, newTag];
                        
                        useSpaceStore.setState({
                            spaces: { ...store.spaces }
                        });
                    }
                }
            }
        },
        
        'REMOVE_SPACE_TAG': (payload: { spaceId: string; tagName: string }) => {
            const store = useSpaceStore.getState();
            const space = store.spaces[payload.spaceId];
            
            if (space) {
                const spacePayload = space.sharedState.payload as any;
                if (spacePayload) {
                    const tags = spacePayload.tags || [];
                    spacePayload.tags = tags.filter((t: any) => t.name !== payload.tagName);
                    
                    useSpaceStore.setState({
                        spaces: { ...store.spaces }
                    });
                }
            }
        },
        
        'GET_SPACES_BY_TAG': (payload: { tagName: string }) => {
            const store = useSpaceStore.getState();
            const spaces = Object.values(store.spaces);
            
            return spaces.filter(space => {
                const spacePayload = space.sharedState.payload as any;
                return spacePayload?.tags?.some((tag: any) => tag.name === payload.tagName);
            });
        }
    }
};

// ============================================================================
// HOOK PERSONNALISÉ POUR UTILISER LES PLUGINS
// ============================================================================

/**
 * Hook personnalisé qui combine tous les plugins pour le spaceStore
 */
export function useSpaceStoreWithPlugins() {
    const spaceStore = useSpaceStore;
    
    // Initialiser le système de plugins avec tous nos plugins
    const pluginSystem = usePluginSystem(spaceStore, [
        spaceStatsPlugin,
        spaceTagsPlugin
    ]);
    
    // Fonctions utilitaires pour utiliser les plugins
    const spaceActions = {
        // Actions de statistiques
        resetSpaceStats: (spaceId: string) => {
            actionRegistry.handleAction({
                type: 'RESET_SPACE_STATS',
                payload: { spaceId }
            });
        },
        
        // Actions de tags
        addTag: (spaceId: string, tag: string, color?: string) => {
            actionRegistry.handleAction({
                type: 'ADD_SPACE_TAG',
                payload: { spaceId, tag, color }
            });
        },
        
        removeTag: (spaceId: string, tagName: string) => {
            actionRegistry.handleAction({
                type: 'REMOVE_SPACE_TAG',
                payload: { spaceId, tagName }
            });
        },
        
        getSpacesByTag: (tagName: string) => {
            const store = useSpaceStore.getState();
            const spaces = Object.values(store.spaces);
            
            return spaces.filter(space => {
                const spacePayload = space.sharedState.payload as any;
                return spacePayload?.tags?.some((tag: any) => tag.name === tagName);
            });
        }
    };
    
    return {
        ...spaceStore.getState(),
        ...spaceActions,
        pluginSystem
    };
}

// ============================================================================
// EXEMPLE D'UTILISATION
// ============================================================================

/**
 * Exemple d'utilisation dans un composant React
 */
export function SpaceManagerWithPlugins() {
    const { 
        spaces, 
        addSpace, 
        addTag, 
        removeTag,
        pluginSystem 
    } = useSpaceStoreWithPlugins();
    
    const handleCreateSpace = () => {
        const spaceId = addSpace({ 
            name: 'Nouvel espace avec plugins',
            description: 'Espace avec statistiques et tags'
        });
        
        if (spaceId) {
            // Ajouter des tags
            addTag(spaceId, 'important', '#ff0000');
            addTag(spaceId, 'work', '#007bff');
        }
    };
    
    return (
        <div>
            <button onClick={handleCreateSpace}>
                Créer un espace avec plugins
            </button>
            
            <div>
                {Object.entries(spaces).map(([id, space]) => {
                    const payload = space.sharedState.payload as any;
                    return (
                        <div key={id}>
                            <h3>{space.name}</h3>
                            <p>Modifications: {payload?.modificationCount || 0}</p>
                            <p>Tags: {payload?.tags?.map((t: any) => t.name).join(', ') || 'Aucun'}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
} 
