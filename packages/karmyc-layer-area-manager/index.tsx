// Point d'entrée du package @gamesberry/karmyc-layer-area-manager 

import React, { useRef, useCallback, useState, useEffect } from "react";
import type { LayerProps } from "../karmyc-layer-system/types";
import { useSpaceStore } from "../karmyc-core/src/stores/spaceStore";
import { Trash2, Eye, EyeOff, CheckCircle, Circle, Lock, Unlock, GripVertical } from "lucide-react";
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const LayerAreaManager: React.FC = () => {
  const getActiveSpace = useSpaceStore((s) => s.getActiveSpace);
  const updateSpaceGenericSharedState = useSpaceStore((s) => s.updateSpaceGenericSharedState);
  const activeSpace = getActiveSpace();
  const layers = Array.isArray(activeSpace?.sharedState?.layers) ? activeSpace.sharedState.layers : [];
  const spaceId = activeSpace?.id;

  // State local pour l'ordre temporaire des layers pendant le drag
  const [localOrder, setLocalOrder] = useState<string[]>(layers.map((l: any) => l.id));

  // Sync localOrder avec layers du store si layers change (ajout/suppression)
  useEffect(() => {
    setLocalOrder(layers.filter((l: any) => l && l.id).map((l: any) => l.id));
  }, [layers]);

  // Trouver l'ordre courant à afficher (local pendant drag, sinon store)
  const getOrderedLayers = () => {
    if (localOrder.length === layers.length && localOrder.every((id, i) => id === layers[i].id)) {
      // Pas de drag en cours, on affiche layers du store (le plus haut en haut)
      return [...layers].slice().reverse();
    }
    // Drag en cours, on affiche l'ordre local (inversé pour affichage)
    return localOrder.map(id => layers.find(l => l.id === id)).reverse();
  };

  // Déplacement local pendant le drag
  const moveLayerLocal = (from: number, to: number) => {
    setLocalOrder(prev => {
      const newOrder = [...prev];
      const [dragged] = newOrder.splice(from, 1);
      newOrder.splice(to, 0, dragged);
      return newOrder;
    });
  };

  // Appliquer l'ordre local au store à la fin du drag
  const handleDrop = () => {
    if (!spaceId) return;
    // On ne fait rien si un layer a disparu pendant le drag
    const newLayers = localOrder
      .map(id => layers.find((l: any) => l && l.id === id))
      .filter((l: any): l is LayerProps => !!l);
    console.log("handleDrop layers", { localOrder, layers, newLayers });
    if (newLayers.length !== layers.length) return; // Sécurité supplémentaire
    updateSpaceGenericSharedState({
      spaceId,
      changes: { layers: newLayers }
    });
  };

  // Ajout d'un layer coloré aléatoire dans le store global du space
  const addLayer = () => {
    if (!spaceId) return;
    const colors = ["#3498db", "#e74c3c", "#2ecc71", "#f1c40f", "#9b59b6", "#1abc9c"];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const newLayer: LayerProps = {
      id: `layer-${Date.now()}`,
      type: "color-demo",
      color,
      opacity: 0.7,
      zIndex: layers.length + 1,
      visible: true,
      enabled: true,
      locked: false,
    };
    const newLayers = Array.isArray(layers) ? [...layers, newLayer] : [newLayer];
    updateSpaceGenericSharedState({
      spaceId,
      changes: { layers: newLayers }
    });
  };

  // Suppression d'un layer
  const removeLayer = (layerId: string) => {
    if (!spaceId) return;
    const newLayers = Array.isArray(layers) ? layers.filter((l: any) => l.id !== layerId) : [];
    updateSpaceGenericSharedState({
      spaceId,
      changes: { layers: newLayers }
    });
  };

  // Mise à jour d'un layer
  const updateLayer = (layerId: string, changes: Partial<LayerProps>) => {
    if (!spaceId) return;
    const newLayers = layers.map((l: any) =>
      l.id === layerId ? { ...l, ...changes } : l
    );
    updateSpaceGenericSharedState({
      spaceId,
      changes: { layers: newLayers }
    });
  };

  // LayerItem avec react-dnd
  const LayerItem = ({ layer, index }: { layer: any; index: number }) => {
    const ref = useRef<HTMLLIElement>(null);
    const handleRef = useRef<HTMLSpanElement>(null);

    // Drag source (seulement le handle)
    const [{ isDragging }, drag] = useDrag({
      type: 'LAYER',
      item: { index },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
      end: handleDrop, // On applique l'ordre au store à la fin du drag
    });

    // Drop target (le bloc entier)
    const [, drop] = useDrop({
      accept: 'LAYER',
      hover: (item: { index: number }, monitor) => {
        if (!ref.current) return;
        const dragIndex = item.index;
        const hoverIndex = index;
        if (dragIndex === hoverIndex) return;
        // Calculer la position de la souris par rapport au centre de l'item
        const hoverBoundingRect = ref.current.getBoundingClientRect();
        const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
        const clientOffset = monitor.getClientOffset();
        if (!clientOffset) return;
        const hoverClientY = clientOffset.y - hoverBoundingRect.top;
        // Ne déplace que si la souris a dépassé la moitié de l'item
        if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
        if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;
        moveLayerLocal(dragIndex, hoverIndex);
        item.index = hoverIndex;
      },
    });

    drop(ref);
    drag(handleRef);

    return (
      <li
        ref={ref}
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 12,
          flexDirection: 'column',
          border: '1px solid #eee',
          borderRadius: 4,
          padding: 8,
          background: isDragging ? '#f0f8ff' : undefined,
          opacity: isDragging ? 0.5 : 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 8 }}>
          <span ref={handleRef} style={{ cursor: 'grab', marginRight: 8, display: 'flex', alignItems: 'center' }}>
            <GripVertical size={18} />
          </span>
          <span style={{ width: 16, height: 16, background: layer.color, display: "inline-block", marginRight: 8, border: "1px solid #ccc" }} />
          <span style={{ flex: 1 }}>{layer.type} ({layer.id})</span>
          <span
            style={{ cursor: 'pointer', opacity: layer.visible ? 1 : 0.4 }}
            title={layer.visible ? "Masquer" : "Afficher"}
            onClick={() => updateLayer(layer.id, { visible: !layer.visible })}
          >
            {layer.visible ? <Eye size={18} /> : <EyeOff size={18} />}
          </span>
          <span
            style={{ cursor: 'pointer', opacity: layer.enabled ? 1 : 0.4 }}
            title={layer.enabled ? "Désactiver" : "Activer"}
            onClick={() => updateLayer(layer.id, { enabled: !layer.enabled })}
          >
            {layer.enabled ? <CheckCircle size={18} /> : <Circle size={18} />}
          </span>
          <span
            style={{ cursor: 'pointer', opacity: layer.locked ? 0.5 : 1 }}
            title={layer.locked ? "Déverrouiller" : "Verrouiller"}
            onClick={() => updateLayer(layer.id, { locked: !layer.locked })}
          >
            {layer.locked ? <Lock size={18} /> : <Unlock size={18} />}
          </span>
          <span
            style={{ cursor: 'pointer', color: '#e74c3c' }}
            title="Supprimer"
            onClick={() => removeLayer(layer.id)}
          >
            <Trash2 size={18} />
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            Blend mode :
            <select
              value={layer.blendMode || "normal"}
              onChange={e => updateLayer(layer.id, { blendMode: e.target.value })}
            >
              <option value="normal">Normal</option>
              <option value="multiply">Multiply</option>
              <option value="screen">Screen</option>
              <option value="overlay">Overlay</option>
              <option value="darken">Darken</option>
              <option value="lighten">Lighten</option>
              <option value="color-dodge">Color Dodge</option>
              <option value="color-burn">Color Burn</option>
              <option value="hard-light">Hard Light</option>
              <option value="soft-light">Soft Light</option>
              <option value="difference">Difference</option>
              <option value="exclusion">Exclusion</option>
              <option value="hue">Hue</option>
              <option value="saturation">Saturation</option>
              <option value="color">Color</option>
              <option value="luminosity">Luminosity</option>
            </select>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            Opacité :
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={layer.opacity ?? 1}
              onChange={e => updateLayer(layer.id, { opacity: parseFloat(e.target.value) })}
              style={{ width: 60 }}
            />
            <span>{Math.round((layer.opacity ?? 1) * 100)}%</span>
          </label>
        </div>
      </li>
    );
  };

  return (
    <div style={{ padding: 12 }}>
      <h3>Layers (space: {spaceId || 'aucun'})</h3>
      <button onClick={addLayer} style={{ marginBottom: 8 }} disabled={!spaceId}>
        Ajouter un layer
      </button>
      <DndProvider backend={HTML5Backend}>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {getOrderedLayers().map((layer: any, idx: number, arr) => (
            <LayerItem key={layer.id} layer={layer} index={localOrder.indexOf(layer.id)} />
          ))}
        </ul>
      </DndProvider>
    </div>
  );
};

export default LayerAreaManager; 
