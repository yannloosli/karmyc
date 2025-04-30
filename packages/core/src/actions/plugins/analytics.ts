import { Action, IActionPlugin } from '../../types/actions';
import { ActionPriority } from '../priorities';

/**
 * Analytics plugin configuration
 */
export interface IAnalyticsConfig {
    enabled: boolean;
    maxEvents: number;
    actionTypesToTrack?: string[];
    filter?: (action: Action) => boolean;
    metadataExtractor?: (action: Action) => Record<string, any>;
}

/**
 * Analytics event
 */
export interface IAnalyticsEvent {
    actionType: string;
    timestamp: string;
    payload: any;
    metadata: Record<string, any>;
}

/**
 * Class to manage analytics events
 */
class AnalyticsCollector {
    private config: IAnalyticsConfig = {
        enabled: true,
        maxEvents: 1000,
        actionTypesToTrack: undefined,
        filter: undefined,
        metadataExtractor: (action) => ({
            source: action.meta?.source,
            timestamp: action.meta?.timestamp
        })
    };
    private events: IAnalyticsEvent[] = [];

    setConfig(config: Partial<IAnalyticsConfig>) {
        this.config = { ...this.config, ...config };
    }

    addEvent(action: Action) {
        if (!this.config.enabled) return;
        if (this.config.actionTypesToTrack && !this.config.actionTypesToTrack.includes(action.type)) {
            return;
        }
        if (this.config.filter && !this.config.filter(action)) {
            return;
        }

        const event: IAnalyticsEvent = {
            actionType: action.type,
            timestamp: new Date().toISOString(),
            payload: action.payload,
            metadata: this.config.metadataExtractor?.(action) || {}
        };

        this.events.push(event);
        if (this.events.length > this.config.maxEvents) {
            this.events.shift();
        }

    }

    getEvents() {
        return [...this.events];
    }

    getEventsByActionType(actionType: string) {
        return this.events.filter(e => e.actionType === actionType);
    }

    getEventCount(actionType?: string) {
        if (!actionType) return this.events.length;
        return this.events.filter(e => e.actionType === actionType).length;
    }

    clear() {
        this.events = [];
    }

    enable() {
        this.config.enabled = true;
    }

    disable() {
        this.config.enabled = false;
    }

    // Method to export data
    exportData() {
        return {
            totalEvents: this.events.length,
            events: this.events,
            timestamp: new Date().toISOString(),
            config: { ...this.config }
        };
    }
}

const analyticsCollector = new AnalyticsCollector();

/**
 * Analytics plugin for actions
 * Allows collecting and analyzing action events
 */
export const analyticsPlugin: IActionPlugin = {
    id: 'analytics',
    priority: ActionPriority.LOW,
    actionTypes: null, // Track all actions
    handler: (action: Action) => {
        analyticsCollector.addEvent(action);
    }
};

// Export for analytics collector access
export { analyticsCollector };
