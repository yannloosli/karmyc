import { ZustandPlugin } from '../src/hooks/usePluginSystem';
import { useSpaceStore, SpaceStateType } from '../src/core/spaceStore';
import { usePluginSystem } from '../src/hooks/usePluginSystem';
import { actionRegistry } from '../src/core/registries/actionRegistry';

// Plugin simple qui ajoute un compteur de vues aux espaces
export const spaceViewCounterPlugin: ZustandPlugin<SpaceStateType> = {
    name: 'space-view-counter',
    
    onStoreInit: (store) => {
        console.log('Plugin de compteur de vues initialisé');
        
        const state = store.getState();
        const updatedSpaces = { ...state.spaces };
        
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
        
        store.setState({ spaces: updatedSpaces });
    },
    
    actions: {
        'INCREMENT_VIEW_COUNT': (payload: { spaceId: string }) => {
            const store = useSpaceStore.getState();
            const space = store.spaces[payload.spaceId];
            
            if (space) {
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
            }
        }
    }
};

// Hook pour utiliser le plugin
export function useSpaceViewCounter() {
    const spaceStore = useSpaceStore;
    const pluginSystem = usePluginSystem(spaceStore, [spaceViewCounterPlugin]);
    
    const viewCounterActions = {
        incrementViewCount: (spaceId: string) => {
            // Utiliser le système d'actions pour déclencher l'action du plugin
            actionRegistry.handleAction({
                type: 'INCREMENT_VIEW_COUNT',
                payload: { spaceId }
            });
        },
        
        resetViewCount: (spaceId: string) => {
            // Utiliser le système d'actions pour déclencher l'action du plugin
            actionRegistry.handleAction({
                type: 'RESET_VIEW_COUNT',
                payload: { spaceId }
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
        }
    };
    
    return {
        ...spaceStore.getState(),
        ...viewCounterActions,
        pluginSystem
    };
} 
