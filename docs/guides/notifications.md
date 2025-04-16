# Notifications System

This guide explains how to use the built-in notification system in Karmyc.

## Overview

The notification system allows you to display temporary, non-blocking messages to the user. These can be used for:

- Success messages after operations complete
- Warning messages about potential issues
- Error alerts when something goes wrong
- Information messages to guide users

## Quick Start

```tsx
import React from 'react';
import { useNotifications } from '@gamesberry/karmyc-core';

function MyComponent() {
  const { showSuccess, showError, showWarning, showInfo } = useNotifications();
  
  const handleSave = () => {
    try {
      // Save operation
      showSuccess('Successfully saved!');
    } catch (error) {
      showError('Failed to save: ' + error.message);
    }
  };
  
  return (
    <button onClick={handleSave}>
      Save
    </button>
  );
}
```

## Notification Types

The system supports four types of notifications:

| Type | Function | Default Duration | Use Case |
|------|----------|------------------|----------|
| Success | `showSuccess()` | 2000ms | Confirm successful operations |
| Error | `showError()` | 3000ms | Alert users to errors |
| Warning | `showWarning()` | 3000ms | Warn about potential issues |
| Info | `showInfo()` | 2000ms | General information |

## Using the Notification Hook

The `useNotifications` hook gives you access to functions for displaying each type of notification:

```tsx
const { showSuccess, showError, showWarning, showInfo } = useNotifications();

// Display a success notification
showSuccess('Item created successfully');

// Display an error notification
showError('Failed to connect to server');

// Display a warning notification
showWarning('Your session will expire soon');

// Display an info notification
showInfo('New features available');
```

## Adding Action Buttons

Each notification function accepts an optional action parameter:

```tsx
showInfo('Your file is ready', {
  label: 'Download',
  onClick: () => downloadFile()
});

showError('Permission denied', {
  label: 'Request Access',
  onClick: () => requestAccess()
});
```

## Customizing Notification Behavior

### Setting Custom Duration

Each notification function accepts an optional duration parameter (in milliseconds):

```tsx
// Create a notification with a custom factory function
import { createNotification } from '@gamesberry/karmyc-core';
import { addNotification } from '@gamesberry/karmyc-core';

const dispatch = useDispatch();

// Create a long-lasting warning (5 seconds)
const notification = createNotification(
  'warning',
  'Please complete your profile',
  5000,
  {
    label: 'Go to Profile',
    onClick: () => navigateToProfile()
  }
);

dispatch(addNotification(notification));
```

### Setting Maximum Notifications

You can control how many notifications can be displayed at once:

```tsx
import { useDispatch } from 'react-redux';
import { setMaxNotifications } from '@gamesberry/karmyc-core';

function NotificationConfig() {
  const dispatch = useDispatch();
  
  const limitNotifications = () => {
    // Only show up to 3 notifications at once
    dispatch(setMaxNotifications(3));
  };
  
  return (
    <button onClick={limitNotifications}>
      Limit Notifications
    </button>
  );
}
```

## Notification Components

The notification system includes a `NotificationList` component that is automatically added to your application when using the `KarmycProvider`. This component handles the rendering and animation of notifications.

### Appearance

Notifications appear in the bottom-right corner of the screen by default, with the most recent notification at the bottom of the stack. They automatically fade out after their specified duration.

## Best Practices

1. **Be concise**: Keep notification messages short and to the point
2. **Use appropriate types**: Choose the right notification type based on the message content
3. **Group related notifications**: Don't flood users with multiple related notifications
4. **Provide actions when helpful**: Add action buttons when a user might want to respond immediately
5. **Set appropriate durations**: Use longer durations for more important messages 
