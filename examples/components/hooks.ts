// This file serves as a gateway to avoid import issues
import { useMenuBar as _useMenuBar } from '../../lib/components/area/components/MenuBar';
import { useStatusBar as _useStatusBar } from '../../lib/components/area/components/StatusBar';
import { useToolbar as _useToolbar } from '../../lib/components/area/components/Toolbar';

// Re-export hooks ensuring the ID is passed
export const useMenuBar = (areaType: string, areaId?: string) => _useMenuBar(areaType, areaId || '');
export const useStatusBar = (areaType: string, areaId?: string) => _useStatusBar(areaType, areaId || '');
export const useToolbar = (areaType: string, areaId?: string) => _useToolbar(areaType, areaId || '');

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
