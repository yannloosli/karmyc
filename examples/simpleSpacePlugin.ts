import { ZustandPlugin } from '../src/hooks/usePluginSystem';
import { useSpaceStore, SpaceStateType } from '../src/core/spaceStore';
import { usePluginSystem } from '../src/hooks/usePluginSystem';
import { actionRegistry } from '../src/core/registries/actionRegistry';

// Configuration des espaces par défaut
const DEFAULT_SPACES = [
    {
        id: 'default-workspace',
        name: 'Espace de travail',
        description: 'Espace principal pour vos activités',
        color: '#2196F3',
        viewCount: 0
    },
    {
        id: 'personal-space',
        name: 'Espace personnel',
        description: 'Votre espace privé',
        color: '#4CAF50',
        viewCount: 0
    },
    {
        id: 'shared-space',
        name: 'Espace partagé',
        description: 'Espace pour la collaboration',
        color: '#FF9800',
        viewCount: 0
    }
];

// Plugin simple qui ajoute un compteur de vues aux espaces
export const spaceViewCounterPlugin: ZustandPlugin<SpaceStateType> = {
    name: 'space-view-counter',
    
    onStoreInit: (store) => {
        console.log('Plugin de compteur de vues initialisé');
        
        const state = store.getState();
        const updatedSpaces = { ...state.spaces };
        
        // 1. Initialiser les espaces existants avec le compteur de vues
        Object.keys(updatedSpaces).forEach(spaceId => {
            const space = updatedSpaces[spaceId];
            if (!space.sharedState.payload) {
                space.sharedState.payload = { viewCount: 0 };
            } else {
                const payload = space.sharedState.payload as any;
                if (typeof payload.viewCount === 'undefined') {
                    payload.viewCount = 0;
                }
            }
        });
        
        // 2. Créer les espaces par défaut s'ils n'existent pas
        DEFAULT_SPACES.forEach(defaultSpace => {
            if (!updatedSpaces[defaultSpace.id]) {
                const newSpaceId = useSpaceStore.getState().addSpace({
                    name: defaultSpace.name,
                    description: defaultSpace.description,
                    color: defaultSpace.color,
                    sharedState: {
                        payload: { viewCount: defaultSpace.viewCount }
                    }
                });
                
                if (newSpaceId) {
                    console.log(`Espace par défaut créé: ${defaultSpace.name} (ID: ${newSpaceId})`);
                    // Mettre à jour la référence pour les prochaines itérations
                    updatedSpaces[newSpaceId] = useSpaceStore.getState().spaces[newSpaceId];
                }
            } else {
                console.log(`Espace par défaut déjà existant: ${defaultSpace.name}`);
            }
        });
        
        // 3. Définir un espace actif par défaut s'il n'y en a pas
        if (!state.activeSpaceId && Object.keys(updatedSpaces).length > 0) {
            const firstSpaceId = Object.keys(updatedSpaces)[0];
            useSpaceStore.getState().setActiveSpace(firstSpaceId);
            console.log(`Espace actif défini par défaut: ${firstSpaceId}`);
        }
        
        store.setState({ spaces: updatedSpaces });
    },
    
    actions: {
        'INCREMENT_VIEW_COUNT': (payload: { spaceId: string; spaceName?: string }) => {
            const store = useSpaceStore.getState();
            let space = store.spaces[payload.spaceId];
            
            // Si l'espace n'existe pas, on le crée
            if (!space) {
                const spaceId = payload.spaceId;
                const spaceName = payload.spaceName || `Espace ${spaceId}`;
                
                // Créer un nouvel espace avec le compteur de vues initialisé
                const newSpaceId = useSpaceStore.getState().addSpace({
                    name: spaceName,
                    description: 'Espace créé automatiquement par le plugin de compteur de vues',
                    color: '#4CAF50',
                    sharedState: {
                        payload: { viewCount: 1 } // Initialiser à 1 car c'est la première vue
                    }
                });
                
                if (newSpaceId) {
                    console.log(`Nouvel espace créé: ${spaceName} avec ID: ${newSpaceId}`);
                    space = useSpaceStore.getState().spaces[newSpaceId];
                } else {
                    console.error('Échec de la création de l\'espace');
                    return;
                }
            } else {
                // L'espace existe, incrémenter le compteur
                const spacePayload = space.sharedState.payload as any;
                if (spacePayload) {
                    spacePayload.viewCount = (spacePayload.viewCount || 0) + 1;
                    useSpaceStore.setState({ spaces: { ...store.spaces } });
                    console.log(`Vue incrémentée pour l'espace ${space.name}: ${spacePayload.viewCount}`);
                }
            }
        },
        
        'RESET_VIEW_COUNT': (payload: { spaceId: string }) => {
            const store = useSpaceStore.getState();
            const space = store.spaces[payload.spaceId];
            
            if (space) {
                const spacePayload = space.sharedState.payload as any;
                if (spacePayload) {
                    spacePayload.viewCount = 0;
                    useSpaceStore.setState({ spaces: { ...store.spaces } });
                    console.log(`Compteur réinitialisé pour l'espace ${space.name}`);
                }
            } else {
                console.warn(`Impossible de réinitialiser le compteur: l'espace ${payload.spaceId} n'existe pas`);
            }
        },
        
        'CREATE_SPACE_WITH_COUNTER': (payload: { name: string; description?: string; color?: string }) => {
            const store = useSpaceStore.getState();
            
            // Créer un nouvel espace avec le compteur de vues initialisé
            const newSpaceId = store.addSpace({
                name: payload.name,
                description: payload.description || 'Espace créé avec compteur de vues',
                color: payload.color || '#2196F3',
                sharedState: {
                    payload: { viewCount: 0 }
                }
            });
            
            if (newSpaceId) {
                console.log(`Nouvel espace créé avec compteur: ${payload.name} (ID: ${newSpaceId})`);
                return newSpaceId;
            } else {
                console.error('Échec de la création de l\'espace avec compteur');
                return null;
            }
        },
        
        'INITIALIZE_DEFAULT_SPACES': () => {
            const store = useSpaceStore.getState();
            const createdSpaces: string[] = [];
            
            DEFAULT_SPACES.forEach(defaultSpace => {
                if (!store.spaces[defaultSpace.id]) {
                    const newSpaceId = store.addSpace({
                        name: defaultSpace.name,
                        description: defaultSpace.description,
                        color: defaultSpace.color,
                        sharedState: {
                            payload: { viewCount: defaultSpace.viewCount }
                        }
                    });
                    
                    if (newSpaceId) {
                        createdSpaces.push(newSpaceId);
                        console.log(`Espace par défaut créé: ${defaultSpace.name} (ID: ${newSpaceId})`);
                    }
                }
            });
            
            // Définir un espace actif si aucun n'est actif
            if (!store.activeSpaceId && createdSpaces.length > 0) {
                store.setActiveSpace(createdSpaces[0]);
            }
            
            return createdSpaces;
        }
    }
};

// Hook pour utiliser le plugin
export function useSpaceViewCounter() {
    const spaceStore = useSpaceStore;
    const pluginSystem = usePluginSystem(spaceStore, [spaceViewCounterPlugin]);
    
    const viewCounterActions = {
        incrementViewCount: (spaceId: string, spaceName?: string) => {
            // Utiliser le système d'actions pour déclencher l'action du plugin
            actionRegistry.handleAction({
                type: 'INCREMENT_VIEW_COUNT',
                payload: { spaceId, spaceName }
            });
        },
        
        resetViewCount: (spaceId: string) => {
            // Utiliser le système d'actions pour déclencher l'action du plugin
            actionRegistry.handleAction({
                type: 'RESET_VIEW_COUNT',
                payload: { spaceId }
            });
        },
        
        createSpaceWithCounter: (name: string, description?: string, color?: string) => {
            // Utiliser le système d'actions pour créer un nouvel espace avec compteur
            actionRegistry.handleAction({
                type: 'CREATE_SPACE_WITH_COUNTER',
                payload: { name, description, color }
            });
        },
        
        initializeDefaultSpaces: () => {
            // Utiliser le système d'actions pour initialiser les espaces par défaut
            actionRegistry.handleAction({
                type: 'INITIALIZE_DEFAULT_SPACES',
                payload: {}
            });
        },
        
        getViewCount: (spaceId: string) => {
            const store = useSpaceStore.getState();
            const space = store.spaces[spaceId];
            if (space) {
                const payload = space.sharedState.payload as any;
                return payload?.viewCount || 0;
            }
            return 0;
        },
        
        // Fonction utilitaire pour initialiser un espace s'il n'existe pas
        ensureSpaceExists: (spaceId: string, spaceName?: string) => {
            const store = useSpaceStore.getState();
            const space = store.spaces[spaceId];
            
            if (!space) {
                const name = spaceName || `Espace ${spaceId}`;
                const newSpaceId = store.addSpace({
                    name,
                    description: 'Espace créé automatiquement',
                    color: '#FF9800',
                    sharedState: {
                        payload: { viewCount: 0 }
                    }
                });
                
                if (newSpaceId) {
                    console.log(`Espace initialisé: ${name} (ID: ${newSpaceId})`);
                    return newSpaceId;
                }
            }
            
            return spaceId;
        },
        
        // Fonction pour obtenir les espaces par défaut
        getDefaultSpaces: () => {
            return DEFAULT_SPACES;
        }
    };
    
    return {
        ...spaceStore.getState(),
        ...viewCounterActions,
        pluginSystem
    };
} 
