import CloseIcon from '@mui/icons-material/Close';
import { Alert, Box, IconButton, Snackbar } from '@mui/material';
import React, { useEffect } from 'react';
// import { useDispatch, useSelector } from 'react-redux'; // Supprimé
// import { removeNotification, selectNotifications } from '../store/slices/notificationSlice'; // Supprimé
import { useNotificationStore } from '../stores/notificationStore'; // Ajouté
import { INotification } from '../types';

export const NotificationList: React.FC = () => {
    // const dispatch = useDispatch(); // Supprimé
    // const notifications = useSelector(selectNotifications); // Supprimé
    const notifications = useNotificationStore((state) => state.notifications); // Remplacé
    const removeNotification = useNotificationStore((state) => state.removeNotification); // Remplacé

    useEffect(() => {
        notifications.forEach((notification: INotification) => {
            if (notification.duration) {
                const timer = setTimeout(() => {
                    // dispatch(removeNotification(notification.id)); // Supprimé
                    removeNotification(notification.id); // Remplacé
                }, notification.duration);

                return () => clearTimeout(timer);
            }
        });
    }, [notifications, removeNotification]); // Mis à jour les dépendances

    const handleClose = (id: string) => {
        // dispatch(removeNotification(id)); // Supprimé
        removeNotification(id); // Remplacé
    };

    const getSeverity = (type: INotification['type']) => {
        switch (type) {
        case 'error':
            return 'error';
        case 'warning':
            return 'warning';
        case 'success':
            return 'success';
        default:
            return 'info';
        }
    };

    return (
        <Box sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 9999 }}>
            {notifications.map((notification) => (
                <Snackbar
                    key={notification.id}
                    open={true}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    autoHideDuration={notification.duration}
                    onClose={() => handleClose(notification.id)} // Utilise la nouvelle fonction handleClose
                >
                    <Alert
                        severity={getSeverity(notification.type)}
                        action={
                            <IconButton
                                aria-label="close"
                                color="inherit"
                                size="small"
                                onClick={() => handleClose(notification.id)} // Utilise la nouvelle fonction handleClose
                            >
                                <CloseIcon fontSize="inherit" />
                            </IconButton>
                        }
                        sx={{ width: '100%' }}
                    >
                        {notification.message}
                        {notification.action && (
                            <Box
                                component="button"
                                onClick={notification.action.onClick}
                                sx={{
                                    marginLeft: 1,
                                    textDecoration: 'underline',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                }}
                            >
                                {notification.action.label}
                            </Box>
                        )}
                    </Alert>
                </Snackbar>
            ))}
        </Box>
    );
}; 
