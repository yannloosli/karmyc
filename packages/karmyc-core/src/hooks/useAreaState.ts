import { useAreaStore } from '../stores/areaStore';

export function useAreaState() {
    const layout = useAreaStore(state => state.layout);
    const rootId = useAreaStore(state => state.rootId);
    const joinPreview = useAreaStore(state => state.joinPreview);
    const areaToOpen = useAreaStore(state => state.areaToOpen);
    const areas = useAreaStore(state => state.areas);

    return {
        layout,
        rootId,
        joinPreview,
        areaToOpen,
        areas
    };
} 
