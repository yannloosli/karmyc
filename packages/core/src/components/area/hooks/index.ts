// Re-export of hooks from components
// We now use hooks directly from components
// This file is kept for compatibility
import { useMenuBar } from '../components/MenuBar';
import { useStatusBar } from '../components/StatusBar';
import { useToolbar } from '../components/Toolbar';

// Export hooks - ensure compatibility with initial API
export {
    useMenuBar,
    useStatusBar,
    useToolbar
};

// Types for components (for API compatibility)
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
