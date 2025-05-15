// This file serves as a gateway to avoid import issues
import { useToolsBar as _useToolsBar } from '../../../karmyc-core/src/components/area/components/Tools';

// Hook générique pour toutes les barres
export const useToolsBar = (areaType: string, areaId: string, position: 'top-outside' | 'top-inside' | 'bottom-outside' | 'bottom-inside') =>
    _useToolsBar(areaType, areaId, position);

// Types pour les composants enregistrables
export interface ToolsBarComponentProps {
    areaId: string;
    areaState: any;
    areaType: string;
    width?: number | 'auto';
}

// Types for components
export interface MenuBarComponentProps {
    areaId: string;
    areaState: any;
    areaType: string;
    width?: number | 'auto';
}

export interface StatusBarComponentProps {
    areaId: string;
    areaState: any;
    areaType: string;
    width?: number | 'auto';
}

export interface ToolbarComponentProps {
    areaId: string;
    areaState: any;
    areaType: string;
    height?: number;
}

export interface ToolbarSlotComponentProps {
    areaId: string;
    areaState: any;
    areaType: string;
    slot: 'nw' | 'n' | 'ne' | 'sw' | 's' | 'se';
} 
