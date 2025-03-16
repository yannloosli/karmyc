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
  icon?: ReactNode;
  action: (context: any) => void;
  isVisible?: (context: any) => boolean;
  isDisabled?: (context: any) => boolean;
  divider?: boolean;
  children?: IContextMenuAction[];
  priority?: number;
}

/**
 * État du menu contextuel
 */
export interface IContextMenuState {
  isOpen: boolean;
  name: string | null;
  options: IContextMenuOption[];
  position: IPosition | null;
  customComponent: {
    component: React.ComponentType<any>;
    props: any;
    position: IPosition;
    alignPosition?: 'top-left' | 'bottom-left' | 'center';
    closeMenuBuffer?: number;
  } | null;
}

/**
 * Propriétés de base pour un composant de menu contextuel personnalisé
 */
export interface IContextMenuBaseProps {
  updateRect: (rect: DOMRect) => void;
  close: () => void;
} 
