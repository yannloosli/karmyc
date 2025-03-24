// Réexportation des hooks depuis les composants
// Nous utilisons maintenant les hooks directement depuis les composants
// Ce fichier est conservé pour compatibilité
import { useMenuBar } from '../components/MenuBar';
import { useStatusBar } from '../components/StatusBar';
import { useToolbar } from '../components/Toolbar';

// Export des hooks - assurer la compatibilité avec l'API initiale
export {
    useMenuBar,
    useStatusBar,
    useToolbar
};

// Types pour les composants (pour la compatibilité API)
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
