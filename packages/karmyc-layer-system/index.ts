// Point d'entrée du package @gamesberry/karmyc-layer-system 

import type { LayerProps } from "./types";
import React from "react";

export type LayerComponent = React.ComponentType<{ layer: LayerProps } & Record<string, any>>;

class LayerRegistryClass {
  private registry: Record<string, LayerComponent> = {};

  register(type: string, component: LayerComponent) {
    this.registry[type] = component;
  }

  get(type: string): LayerComponent | undefined {
    return this.registry[type];
  }

  getAll(): Record<string, LayerComponent> {
    return { ...this.registry };
  }
}

export const LayerRegistry = new LayerRegistryClass();
