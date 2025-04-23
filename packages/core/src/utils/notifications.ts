import { INotification, INotificationState, NotificationType } from '../types';

export const createNotification = (
    type: NotificationType,
    message: string,
    duration?: number,
    action?: { label: string; onClick: () => void }
): INotification => ({
    id: Math.random().toString(36).substr(2, 9),
    type,
    message,
    timestamp: Date.now(),
    duration,
    action,
});

export const createErrorNotification = (message: string, action?: { label: string; onClick: () => void }) =>
    createNotification('error', message, 5000, action);

export const createWarningNotification = (message: string, action?: { label: string; onClick: () => void }) =>
    createNotification('warning', message, 3000, action);

export const createInfoNotification = (message: string, action?: { label: string; onClick: () => void }) =>
    createNotification('info', message, 2000, action);

export const createSuccessNotification = (message: string, action?: { label: string; onClick: () => void }) =>
    createNotification('success', message, 2000, action);

export const initialState: INotificationState = {
    notifications: [],
    maxNotifications: 5,
}; 
