type ToolsEventType = 'cleanup' | 'register' | 'unregister';
interface ToolsEvent {
    type: ToolsEventType;
    areaId: string;
}
type ToolsEventListener = (event: ToolsEvent) => void;
declare class ToolsEventBus {
    private listeners;
    subscribe(listener: ToolsEventListener): () => void;
    publish(event: ToolsEvent): void;
}
export declare const toolsEventBus: ToolsEventBus;
export {};
