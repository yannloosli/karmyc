// Ce fichier sert de passerelle pour éviter les problèmes d'importation
import { useMenuBar as _useMenuBar } from '../components/MenuBar';
import { useStatusBar as _useStatusBar } from '../components/StatusBar';
import { useToolbar as _useToolbar } from '../components/Toolbar';

// Réexporter les hooks en s'assurant de passer l'ID
export const useMenuBar = (areaType: string, areaId?: string) => _useMenuBar(areaType, areaId);
export const useStatusBar = (areaType: string, areaId?: string) => _useStatusBar(areaType, areaId);
export const useToolbar = (areaType: string, areaId?: string) => _useToolbar(areaType, areaId);

// Types pour les composants
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
