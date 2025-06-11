import { IArea } from '../types/areaTypes';
import { ContextMenuItem } from '../types/contextMenu';
import { IDiff } from '../types/diff';
import { IState } from '../types/state';
import { IToolbarItem } from '../types/toolbarType';
export declare const validateArea: (area: IArea<string>) => {
    isValid: boolean;
    errors: string[];
};
export declare const validateState: (state: IState) => {
    isValid: boolean;
    errors: string[];
};
export declare const validateDiff: (diff: IDiff) => {
    isValid: boolean;
    errors: string[];
};
export declare const validateToolbarItem: (item: IToolbarItem) => {
    isValid: boolean;
    errors: string[];
};
export declare const validatePosition: (position: {
    x: number;
    y: number;
}) => {
    isValid: boolean;
    errors: string[];
};
export declare const validateContextMenuItem: (item: ContextMenuItem) => {
    isValid: boolean;
    errors: string[];
};
