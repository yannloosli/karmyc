import { AnyAction } from '@reduxjs/toolkit';
import { actionLogger } from './logger';
import { actionMonitor } from './monitoring';

export enum Permission {
    READ = 'READ',
    WRITE = 'WRITE',
    DELETE = 'DELETE',
    ADMIN = 'ADMIN'
}

export interface IActionPermission {
    actionType: string;
    requiredPermissions: Permission[];
    rateLimit?: {
        maxRequests: number;
        windowMs: number;
    };
}

export class ActionSecurity {
    private static instance: ActionSecurity;
    private permissions: Map<string, IActionPermission> = new Map();
    private rateLimits: Map<string, number[]> = new Map();
    private isEnabled: boolean = true;

    private constructor() { }

    static getInstance(): ActionSecurity {
        if (!ActionSecurity.instance) {
            ActionSecurity.instance = new ActionSecurity();
        }
        return ActionSecurity.instance;
    }

    enable(): void {
        this.isEnabled = true;
    }

    disable(): void {
        this.isEnabled = false;
    }

    registerPermission(permission: IActionPermission): void {
        this.permissions.set(permission.actionType, permission);
        actionLogger.info(`Permission registered for action: ${permission.actionType}`);
    }

    unregisterPermission(actionType: string): void {
        this.permissions.delete(actionType);
        actionLogger.info(`Permission removed for action: ${actionType}`);
    }

    validateAction(action: AnyAction, userPermissions: Permission[]): boolean {
        if (!this.isEnabled) return true;

        const permission = this.permissions.get(action.type);
        if (!permission) return true;

        // Check required permissions
        const hasRequiredPermissions = permission.requiredPermissions.every(required =>
            userPermissions.includes(required)
        );

        if (!hasRequiredPermissions) {
            actionLogger.warn('Action rejected - Insufficient permissions', action, {
                required: permission.requiredPermissions,
                user: userPermissions
            });
            actionMonitor.endMonitoring(action, false);
            return false;
        }

        // Check rate limit
        if (permission.rateLimit) {
            const isRateLimited = this.checkRateLimit(action.type, permission.rateLimit);
            if (isRateLimited) {
                actionLogger.warn('Action rejected - Rate limit exceeded', action, {
                    rateLimit: permission.rateLimit
                });
                actionMonitor.endMonitoring(action, false);
                return false;
            }
        }

        return true;
    }

    private checkRateLimit(actionType: string, rateLimit: { maxRequests: number; windowMs: number }): boolean {
        const now = Date.now();
        const timestamps = this.rateLimits.get(actionType) || [];

        // Clean expired timestamps
        const validTimestamps = timestamps.filter(
            timestamp => now - timestamp < rateLimit.windowMs
        );

        if (validTimestamps.length >= rateLimit.maxRequests) {
            return true;
        }

        validTimestamps.push(now);
        this.rateLimits.set(actionType, validTimestamps);
        return false;
    }

    getPermissions(): Map<string, IActionPermission> {
        return new Map(this.permissions);
    }

    clearRateLimits(): void {
        this.rateLimits.clear();
    }

    // Example usage:
    /*
    const security = ActionSecurity.getInstance();
    
    security.registerPermission({
      actionType: 'area/delete',
      requiredPermissions: [Permission.DELETE],
      rateLimit: {
        maxRequests: 10,
        windowMs: 60000 // 1 minute
      }
    });
    
    const userPermissions = [Permission.READ, Permission.WRITE];
    const isValid = security.validateAction(action, userPermissions);
    */
}

export const actionSecurity = ActionSecurity.getInstance(); 
