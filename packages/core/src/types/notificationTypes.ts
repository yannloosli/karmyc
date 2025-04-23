/**
 * Types related to the notification system.
 */

/** Defines the possible severity levels for a notification. */
export type NotificationType = 'error' | 'warning' | 'info' | 'success';

/** Defines the structure of a single notification object. */
export interface INotification {
    id: string;
    type: NotificationType;
    message: string;
    timestamp: number;
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
}

/** Defines the shape of the notification state, typically used in a store. */
export interface INotificationState {
    notifications: INotification[];
    maxNotifications: number;
} 
