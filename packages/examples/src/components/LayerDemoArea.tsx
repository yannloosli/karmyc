import React from "react";
import LayerAreaManager from "../../../karmyc-layer-area-manager";

const layers = [
  {
    id: "layer-blue",
    type: "color-demo",
    color: "#3498db",
    opacity: 0.8,
    zIndex: 1,
    visible: true,
    enabled: true,
    locked: false,
  },
  {
    id: "layer-red",
    type: "color-demo",
    color: "#e74c3c",
    opacity: 0.5,
    zIndex: 2,
    visible: true,
    enabled: true,
    locked: false,
  },
];

const LayerDemoArea: React.FC = () => {
  return (
    <div style={{ width: 400, height: 300, border: "1px solid #ccc", position: "relative" }}>
      <LayerAreaManager layers={layers} />
    </div>
  );
};

export default LayerDemoArea; 
