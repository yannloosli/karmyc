export type NotificationType = 'error' | 'warning' | 'info' | 'success';

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

export interface INotificationState {
  notifications: INotification[];
  maxNotifications: number;
}

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

export const addNotification = (state: INotificationState, notification: INotification): INotificationState => {
  const notifications = [...state.notifications, notification];
  if (notifications.length > state.maxNotifications) {
    notifications.shift();
  }
  return { ...state, notifications };
};

export const removeNotification = (state: INotificationState, id: string): INotificationState => ({
  ...state,
  notifications: state.notifications.filter(notification => notification.id !== id),
});

export const clearNotifications = (state: INotificationState): INotificationState => ({
  ...state,
  notifications: [],
});

export const setMaxNotifications = (state: INotificationState, max: number): INotificationState => {
  const notifications = [...state.notifications];
  while (notifications.length > max) {
    notifications.shift();
  }
  return { ...state, notifications, maxNotifications: max };
}; 
