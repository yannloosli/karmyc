import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { INotification } from '../types'; // Corrected path

// Define the state interface based on Redux slice
interface NotificationState {
    notifications: INotification[];
    maxNotifications: number;
    addNotification: (notification: INotification) => void;
    removeNotification: (id: string) => void;
    clearNotifications: () => void;
    setMaxNotifications: (max: number) => void;
}

// Assuming the initial state structure is similar or fetched from the same utility
// We need the actual initial state values. Let's assume default values for now.
// TODO: Import actual initialState if available, e.g., from '../../utils/notifications'
const defaultInitialState = {
    notifications: [],
    maxNotifications: 5, // Default value, adjust if needed
};

export const useNotificationStore = create<NotificationState>()(
    immer((set) => ({
        notifications: defaultInitialState.notifications,
        maxNotifications: defaultInitialState.maxNotifications,

        addNotification: (notification: INotification) =>
            set((state) => {
                state.notifications.push(notification);
                // Ensure maxNotifications limit is respected
                if (state.notifications.length > state.maxNotifications) {
                    state.notifications.shift();
                }
            }),

        removeNotification: (id: string) =>
            set((state) => {
                state.notifications = state.notifications.filter(
                    (notification) => notification.id !== id
                );
            }),

        clearNotifications: () =>
            set((state) => {
                state.notifications = [];
            }),

        setMaxNotifications: (max: number) =>
            set((state) => {
                // Ensure max is a non-negative integer
                const validMax = Math.max(0, Math.floor(max));
                state.maxNotifications = validMax;
                // Adjust current notifications if they exceed the new max
                while (state.notifications.length > validMax) {
                    state.notifications.shift();
                }
            }),
    }))
);

// Selectors are often derived directly from the hook in components,
// but we can provide explicit selectors if needed for consistency or complex derivations.
export const selectNotifications = (state: NotificationState) => state.notifications;
export const selectMaxNotifications = (state: NotificationState) => state.maxNotifications; 
