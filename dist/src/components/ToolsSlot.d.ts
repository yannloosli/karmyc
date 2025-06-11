import React from 'react';
import { Rect } from '../types/math';
export type ComponentIdentifier = {
    name: string;
    type: string;
};
export type ToolsBarAlignment = 'left' | 'center' | 'right';
export type ToolsBarPosition = 'top-outer' | 'top-inner' | 'bottom-outer' | 'bottom-inner' | string;
export interface ToolsBarComponent {
    component: React.ComponentType<any>;
    order: number;
    alignment: ToolsBarAlignment;
    width?: string | number;
    identifier: ComponentIdentifier;
    allowedLayerTypes?: string[];
    callback?: (() => void)[];
}
/**
 * Hook for dynamically registering components in a Tools bar.
 * @param key ID of the area or type of area
 * @param position Position of the bar
 */
export declare function useToolsSlot(key: string, position: ToolsBarPosition): {
    registerComponent: (component: React.ComponentType<any>, identifier: ComponentIdentifier, options?: {
        order?: number;
        alignment?: ToolsBarAlignment;
        width?: string | number;
        allowedLayerTypes?: string[];
        callback?: (() => void)[];
    }) => string;
    getComponents: () => ToolsBarComponent[];
};
interface ToolsProps {
    areaId?: string;
    areaType?: string;
    areaState?: any;
    children: React.ReactNode;
    style?: React.CSSProperties;
    viewport?: Rect;
}
export declare const Tools: React.FC<ToolsProps>;
export {};
