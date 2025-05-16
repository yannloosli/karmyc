export type LayerType = "html" | "tilemap" | string;

export interface LayerProps {
  id: string;
  type: LayerType;
  zIndex: number;
  blendMode?: string; // CSS blend-mode
  opacity: number; // 0-1
  locked: boolean;
  visible: boolean;
  enabled: boolean; // runtime
  [key: string]: any; // extensibilité pour les props spécifiques
} 
