export type AreaRole = 'LEAD' | 'FOLLOW' | 'SELF';

export interface IArea {
  type: string;
  role?: AreaRole;
  state?: Record<string, any>;
  position?: { x: number; y: number };
  id?: string;
}

export interface ILayout {
  type: string;
  children: any[];
}

export interface ISpace {
  id: string;
  name: string;
  state: Record<string, any>;
}

export interface IKarmycOptions {
  initialAreas?: IArea[];
  keyboardShortcutsEnabled?: boolean;
  resizableAreas?: boolean;
  manageableAreas?: boolean;
  multiScreen?: boolean;
  builtInLayouts?: Array<{
    id: string;
    name: string;
    config: ILayout;
  }>;
  spaces?: Record<string, ISpace>;
} 
