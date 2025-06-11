type ToolsEventType = 'cleanup' | 'register' | 'unregister';

interface ToolsEvent {
    type: ToolsEventType;
    areaId: string;
}

type ToolsEventListener = (event: ToolsEvent) => void;

class ToolsEventBus {
    private listeners: Set<ToolsEventListener> = new Set();

    subscribe(listener: ToolsEventListener) {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    publish(event: ToolsEvent) {
        this.listeners.forEach(listener => listener(event));
    }
}

export const toolsEventBus = new ToolsEventBus(); 
