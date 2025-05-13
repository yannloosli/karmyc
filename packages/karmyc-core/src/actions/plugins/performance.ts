import { Action } from '../../types/actions';
import { actionLogger } from '../logger';

/**
 * Performance plugin configuration
 */
export interface IPerformanceConfig {
    enabled: boolean;
    maxMetrics: number;
    slowActionThreshold: number; // in milliseconds
    actionTypesToTrack?: string[];
}

/**
 * Performance metrics for an action
 */
export interface IPerformanceMetrics {
    actionType: string;
    executionTime: number;
    timestamp: string;
    success: boolean;
    payload?: any;
    metadata?: Record<string, any>;
}

/**
 * Global metrics
 */
export interface IGlobalMetrics {
    totalActions: number;
    actionsByType: Record<string, number>;
    averageExecutionTime: number;
    errors: number;
    lastAction?: IPerformanceMetrics;
}

/**
 * Class to manage performance metrics
 */
class PerformanceMonitor {
    private static instance: PerformanceMonitor;
    private config: IPerformanceConfig = {
        enabled: true,
        maxMetrics: 1000,
        slowActionThreshold: 100,
        actionTypesToTrack: undefined
    };
    private metrics: IPerformanceMetrics[] = [];
    private globalMetrics: IGlobalMetrics = {
        totalActions: 0,
        actionsByType: {},
        averageExecutionTime: 0,
        errors: 0
    };
    private actionStartTimes: Map<string, number> = new Map();

    private constructor() { }

    static getInstance(): PerformanceMonitor {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    }

    setConfig(config: Partial<IPerformanceConfig>): void {
        this.config = { ...this.config, ...config };
    }

    enable(): void {
        this.config.enabled = true;
    }

    disable(): void {
        this.config.enabled = false;
    }

    startTracking(action: Action): void {
        if (!this.config.enabled) return;
        if (this.config.actionTypesToTrack && !this.config.actionTypesToTrack.includes(action.type)) {
            return;
        }

        this.actionStartTimes.set(action.type, performance.now());
        this.globalMetrics.totalActions++;
        this.globalMetrics.actionsByType[action.type] = (this.globalMetrics.actionsByType[action.type] || 0) + 1;
    }

    endTracking(action: Action, success: boolean = true): void {
        if (!this.config.enabled) return;
        const startTime = this.actionStartTimes.get(action.type);
        if (!startTime) return;

        const executionTime = performance.now() - startTime;
        this.actionStartTimes.delete(action.type);

        const metric: IPerformanceMetrics = {
            actionType: action.type,
            executionTime,
            timestamp: new Date().toISOString(),
            success,
            payload: action.payload,
            metadata: {
                source: action.meta?.source,
                timestamp: action.meta?.timestamp
            }
        };

        this.addMetric(metric);
        this.updateGlobalMetrics(metric);

        // Warn if the execution time is too long
        if (executionTime > this.config.slowActionThreshold) {
            actionLogger.warn('Slow action detected', action, {
                executionTime,
                actionType: action.type
            });
        }
    }

    private addMetric(metric: IPerformanceMetrics): void {
        this.metrics.push(metric);
        if (this.metrics.length > this.config.maxMetrics) {
            this.metrics.shift();
        }
    }

    private updateGlobalMetrics(metric: IPerformanceMetrics): void {
        this.globalMetrics.lastAction = metric;
        this.globalMetrics.averageExecutionTime = this.calculateAverageExecutionTime();

        if (!metric.success) {
            this.globalMetrics.errors++;
        }
    }

    private calculateAverageExecutionTime(): number {
        if (this.metrics.length === 0) return 0;
        return this.metrics.reduce((sum, m) => sum + m.executionTime, 0) / this.metrics.length;
    }

    getMetrics(): IPerformanceMetrics[] {
        return [...this.metrics];
    }

    getGlobalMetrics(): IGlobalMetrics {
        return { ...this.globalMetrics };
    }

    getMetricsByActionType(actionType: string): IPerformanceMetrics[] {
        return this.metrics.filter(m => m.actionType === actionType);
    }

    getAverageExecutionTime(actionType: string): number {
        const metrics = this.getMetricsByActionType(actionType);
        if (metrics.length === 0) return 0;
        return metrics.reduce((sum, m) => sum + m.executionTime, 0) / metrics.length;
    }

    getSlowActions(threshold: number = 100): Array<{ type: string; executionTime: number }> {
        return Object.entries(this.globalMetrics.actionsByType)
            .map(([type, count]) => ({
                type,
                executionTime: this.getAverageExecutionTime(type)
            }))
            .filter(action => action.executionTime > threshold);
    }

    getErrorRate(): number {
        if (this.globalMetrics.totalActions === 0) return 0;
        return (this.globalMetrics.errors / this.globalMetrics.totalActions) * 100;
    }

    clear(): void {
        this.metrics = [];
        this.actionStartTimes.clear();
        this.globalMetrics = {
            totalActions: 0,
            actionsByType: {},
            averageExecutionTime: 0,
            errors: 0
        };
    }
}

const performanceMonitor = PerformanceMonitor.getInstance();

// Export for performance monitor access
export { performanceMonitor };
