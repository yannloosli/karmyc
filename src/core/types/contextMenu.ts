import { ReactNode } from 'react';

/**
 * Position d'un menu contextuel
 */
export interface IPosition {
  x: number;
  y: number;
}

/**
 * Option de menu contextuel
 */
export interface IContextMenuOption {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  divider?: boolean;
  children?: IContextMenuOption[];
}

/**
 * Action de menu contextuel
 */
export interface IContextMenuAction {
  id: string;
  label: string;
  icon?: string;
  handler: () => void;
  isEnabled?: () => boolean;
  isVisible?: () => boolean;
}

/**
 * État du menu contextuel
 */
export interface IContextMenuState {
  isVisible: boolean;
  position: IContextMenuPosition;
  items: IContextMenuItem[];
  targetId?: string;
  metadata?: Record<string, any>;
  errors: string[];
}

/**
 * Propriétés de base pour un composant de menu contextuel personnalisé
 */
export interface IContextMenuBaseProps {
  updateRect: (rect: DOMRect) => void;
  close: () => void;
}

export interface IContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  disabled?: boolean;
  divider?: boolean;
  submenu?: IContextMenuItem[];
  action?: () => void;
}

export interface IContextMenuPosition {
  x: number;
  y: number;
}

export interface ContextMenuItem {
  id: string;
  label: string;
  action: () => void;
  disabled?: boolean;
  shortcut?: string;
}

export interface ContextMenuState {
  isOpen: boolean;
  position: { x: number; y: number } | null;
  items: ContextMenuItem[];
  targetId: string | null;
} 
