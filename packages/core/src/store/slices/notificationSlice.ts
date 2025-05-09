import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { INotification, INotificationState } from '../../types';
import { initialState } from '../../utils/notifications';

export const notificationSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        addNotification: (state, action: PayloadAction<INotification>) => {
            const notifications = [...state.notifications, action.payload];
            if (notifications.length > state.maxNotifications) {
                notifications.shift();
            }
            state.notifications = notifications;
        },
        removeNotification: (state, action: PayloadAction<string>) => {
            state.notifications = state.notifications.filter(
                notification => notification.id !== action.payload
            );
        },
        clearNotifications: (state) => {
            state.notifications = [];
        },
        setMaxNotifications: (state, action: PayloadAction<number>) => {
            const max = action.payload;
            const notifications = [...state.notifications];
            while (notifications.length > max) {
                notifications.shift();
            }
            state.notifications = notifications;
            state.maxNotifications = max;
        },
    },
});

export const {
    addNotification,
    removeNotification,
    clearNotifications,
    setMaxNotifications,
} = notificationSlice.actions;

export const selectNotifications = (state: { notification: INotificationState }) =>
    state.notification.notifications;

export const selectMaxNotifications = (state: { notification: INotificationState }) =>
    state.notification.maxNotifications;

export default notificationSlice.reducer; 
