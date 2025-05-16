export type ViewportOutput = "screen" | "print";

export interface ViewportFormat {
  label: string; // ex: "A4", "1920x1080"
  width: number; // en px ou mm selon output
  height: number;
}

export interface ViewportProps {
  id: string;
  name: string;
  x: number;
  y: number;
  output: ViewportOutput;
  ppi?: number; // seulement pour print
  format: ViewportFormat;
  width: number;
  height: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
} 
