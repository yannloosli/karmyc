import CloseIcon from '@mui/icons-material/Close';
import { Alert, Box, IconButton, Snackbar } from '@mui/material';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { removeNotification, selectNotifications } from '../store/slices/notificationSlice';
import { INotification } from '../types';

export const NotificationList: React.FC = () => {
    const dispatch = useDispatch();
    const notifications = useSelector(selectNotifications);

    useEffect(() => {
        notifications.forEach((notification: INotification) => {
            if (notification.duration) {
                const timer = setTimeout(() => {
                    dispatch(removeNotification(notification.id));
                }, notification.duration);

                return () => clearTimeout(timer);
            }
        });
    }, [notifications, dispatch]);

    const handleClose = (id: string) => {
        dispatch(removeNotification(id));
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
                    onClose={() => handleClose(notification.id)}
                >
                    <Alert
                        severity={getSeverity(notification.type)}
                        action={
                            <IconButton
                                aria-label="close"
                                color="inherit"
                                size="small"
                                onClick={() => handleClose(notification.id)}
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
