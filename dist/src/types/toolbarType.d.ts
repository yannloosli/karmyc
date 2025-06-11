export interface IToolbarItem {
    id: string;
    type: 'button' | 'dropdown' | 'separator' | 'group';
    label?: string;
    icon?: string;
    disabled?: boolean;
    active?: boolean;
    children?: IToolbarItem[];
    action?: () => void;
    config?: Record<string, any>;
}
export interface IToolbarState {
    toolbars: Record<string, IToolbarItem[]>;
    activeToolbarId: string | null;
    activeToolId: string | null;
    toolbarConfigs: Record<string, Record<string, any>>;
    errors: string[];
}
export interface IToolbarConfig {
    position?: 'top' | 'bottom' | 'left' | 'right';
    orientation?: 'horizontal' | 'vertical';
    size?: 'small' | 'medium' | 'large';
    theme?: 'light' | 'dark';
    customStyles?: Record<string, any>;
}
