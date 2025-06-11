import { ToolsBarComponent } from '../components/ToolsSlot';
export declare const toolsBarRegistry: Record<string, ToolsBarComponent[]>;
export declare function notifyToolsRegistryChange(): void;
export declare function subscribeToRegistryChanges(callback: () => void): () => void;
