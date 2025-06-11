import { ToolsBarComponent } from '../components/ToolsSlot';

// Global registry
export const toolsBarRegistry: Record<string, ToolsBarComponent[]> = {};

// Subscription system for registry reactivity
const listeners = new Set<() => void>();
export function notifyToolsRegistryChange() {
    listeners.forEach((cb) => cb());
}

export function subscribeToRegistryChanges(callback: () => void) {
    listeners.add(callback);
    return () => {
        listeners.delete(callback);
    };
} 
