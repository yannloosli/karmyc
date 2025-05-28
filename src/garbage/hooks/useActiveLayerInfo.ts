import { useSpaceStore, LayerLike } from '../../core/data/spaceStore';

interface ActiveLayerInfo {
  activeLayerId: string | null;
  activeLayerType: string | null;
  activeLayer: LayerLike | null;
}

export function useActiveLayerInfo(): ActiveLayerInfo {
  const activeSpace = useSpaceStore((s) => s.getActiveSpace());

  if (!activeSpace || !activeSpace.sharedState.activeLayerId) {
    return { activeLayerId: null, activeLayerType: null, activeLayer: null };
  }

  const activeLayerId = activeSpace.sharedState.activeLayerId;
  const layers = activeSpace.sharedState.layers || [];
  
  const activeLayer = layers.find((layer: LayerLike) => layer.id === activeLayerId) || null;

  return {
    activeLayerId,
    activeLayerType: activeLayer ? activeLayer.type : null, // Supposant que LayerLike a une propriété type
    activeLayer,
  };
} 
