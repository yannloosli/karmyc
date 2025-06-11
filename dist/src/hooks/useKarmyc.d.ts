import { IKarmycOptions, LayoutPreset } from '../types/karmyc';
interface IKarmycConfigWithLayouts {
    plugins: IKarmycOptions['plugins'];
    validators: IKarmycOptions['validators'];
    initialAreas: IKarmycOptions['initialAreas'];
    keyboardShortcutsEnabled: boolean;
    builtInLayouts: LayoutPreset[];
    initialLayout: string;
    options: {
        resizableAreas: boolean;
        manageableAreas: boolean;
        multiScreen: boolean;
        builtInLayouts: LayoutPreset[];
    };
}
/**
 * Combined hook that provides both configuration and initialization for the Karmyc system.
 */
export declare function useKarmyc(options?: IKarmycOptions): IKarmycConfigWithLayouts;
export {};
