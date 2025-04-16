import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNotifications } from '~/hooks/useNotifications';
import { addNotification, setMaxNotifications } from '~/store/slices/notificationSlice';
import { createNotification } from '~/utils/notifications';

/**
 * Example component demonstrating the notification system
 */
export const NotificationExample: React.FC<{ areaState: any }> = ({ areaState }) => {
    const { showSuccess, showError, showWarning, showInfo } = useNotifications();
    const dispatch = useDispatch();
    const [message, setMessage] = useState('This is a notification message');
    const [duration, setDuration] = useState('3000');
    const [maxCount, setMaxCount] = useState('5');

    // Handle showing different types of notifications
    const handleShowSuccess = () => {
        showSuccess(message);
    };

    const handleShowError = () => {
        showError(message);
    };

    const handleShowWarning = () => {
        showWarning(message);
    };

    const handleShowInfo = () => {
        showInfo(message);
    };

    // Example with action button
    const handleShowWithAction = () => {
        showInfo(message, {
            label: 'Click Me',
            onClick: () => {
                showSuccess('Action button clicked!');
            }
        });
    };

    // Example with custom duration
    const handleShowWithDuration = () => {
        const durationMs = parseInt(duration, 10);
        if (isNaN(durationMs) || durationMs <= 0) {
            showError('Please enter a valid duration');
            return;
        }

        // Create a custom notification with specific duration
        const notification = createNotification(
            'info',
            `This notification will last for ${durationMs}ms`,
            durationMs,
            {
                label: 'OK',
                onClick: () => { }
            }
        );

        dispatch(addNotification(notification));
    };

    // Example of setting maximum notifications
    const handleSetMaxNotifications = () => {
        const max = parseInt(maxCount, 10);
        if (isNaN(max) || max <= 0) {
            showError('Please enter a valid count');
            return;
        }

        dispatch(setMaxNotifications(max));
        showSuccess(`Maximum notifications set to ${max}`);
    };

    // Create multiple notifications to test stacking
    const handleCreateMultiple = () => {
        showInfo('First notification');
        setTimeout(() => showSuccess('Second notification'), 300);
        setTimeout(() => showWarning('Third notification'), 600);
        setTimeout(() => showError('Fourth notification'), 900);
        setTimeout(() => showInfo('Fifth notification'), 1200);
    };

    return (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2>Notification System Example</h2>

            <div>
                <label htmlFor="message" style={{ display: 'block', marginBottom: '8px' }}>
                    Notification Message:
                </label>
                <input
                    id="message"
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    style={{ width: '100%', padding: '8px', marginBottom: '16px' }}
                />
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button onClick={handleShowSuccess} style={{ padding: '8px 16px' }}>
                    Success Notification
                </button>
                <button onClick={handleShowError} style={{ padding: '8px 16px' }}>
                    Error Notification
                </button>
                <button onClick={handleShowWarning} style={{ padding: '8px 16px' }}>
                    Warning Notification
                </button>
                <button onClick={handleShowInfo} style={{ padding: '8px 16px' }}>
                    Info Notification
                </button>
            </div>

            <div style={{ marginTop: '16px' }}>
                <button onClick={handleShowWithAction} style={{ padding: '8px 16px' }}>
                    Notification with Action Button
                </button>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label htmlFor="duration">Custom Duration (ms):</label>
                <input
                    id="duration"
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    style={{ width: '80px', padding: '8px' }}
                />
                <button onClick={handleShowWithDuration} style={{ padding: '8px 16px' }}>
                    Show with Custom Duration
                </button>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label htmlFor="maxCount">Max Notifications:</label>
                <input
                    id="maxCount"
                    type="number"
                    value={maxCount}
                    onChange={(e) => setMaxCount(e.target.value)}
                    style={{ width: '80px', padding: '8px' }}
                />
                <button onClick={handleSetMaxNotifications} style={{ padding: '8px 16px' }}>
                    Set Max Notifications
                </button>
            </div>

            <div style={{ marginTop: '16px' }}>
                <button onClick={handleCreateMultiple} style={{ padding: '8px 16px' }}>
                    Create Multiple Notifications
                </button>
            </div>

            <div style={{ marginTop: '24px' }}>
                <h3>Instructions</h3>
                <ul>
                    <li>Enter a message and click different notification types</li>
                    <li>Try the notification with an action button that shows a success message when clicked</li>
                    <li>Test a custom duration notification that stays visible for a specific time</li>
                    <li>Set the maximum number of notifications that can be shown at once</li>
                    <li>Create multiple notifications to see how they stack</li>
                </ul>
            </div>
        </div>
    );
}; 
