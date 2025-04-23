// import { useDispatch } from 'react-redux';
// import { addNotification } from '../store/slices/notificationSlice';
import { useNotificationStore } from '../stores/notificationStore';
import {
    createErrorNotification,
    createInfoNotification,
    createSuccessNotification,
    createWarningNotification,
} from '../utils/notifications';

export const useNotifications = () => {
    // const dispatch = useDispatch();
    const addNotification = useNotificationStore((state) => state.addNotification);

    const showError = (message: string, action?: { label: string; onClick: () => void }) => {
        // dispatch(addNotification(createErrorNotification(message, action)));
        addNotification(createErrorNotification(message, action));
    };

    const showWarning = (message: string, action?: { label: string; onClick: () => void }) => {
        // dispatch(addNotification(createWarningNotification(message, action)));
        addNotification(createWarningNotification(message, action));
    };

    const showInfo = (message: string, action?: { label: string; onClick: () => void }) => {
        // dispatch(addNotification(createInfoNotification(message, action)));
        addNotification(createInfoNotification(message, action));
    };

    const showSuccess = (message: string, action?: { label: string; onClick: () => void }) => {
        // dispatch(addNotification(createSuccessNotification(message, action)));
        addNotification(createSuccessNotification(message, action));
    };

    return {
        showError,
        showWarning,
        showInfo,
        showSuccess,
    };
}; 
