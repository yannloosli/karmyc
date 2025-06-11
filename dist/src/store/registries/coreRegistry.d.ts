import { IKarmycConfig } from '../../types/karmyc';
interface ICoreRegistry {
    initialize: (config: IKarmycConfig) => void;
}
export declare const coreRegistry: ICoreRegistry;
export {};
