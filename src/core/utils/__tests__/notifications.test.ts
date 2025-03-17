import {
    addNotification,
    clearNotifications,
    createErrorNotification,
    createInfoNotification,
    createNotification,
    createSuccessNotification,
    createWarningNotification,
    initialState,
    removeNotification,
    setMaxNotifications,
} from '../notifications';

describe('Notification Utils', () => {
  describe('createNotification', () => {
    it('devrait créer une notification avec les paramètres fournis', () => {
      const notification = createNotification('info', 'Test message', 1000, {
        label: 'Action',
        onClick: () => {},
      });

      expect(notification).toMatchObject({
        type: 'info',
        message: 'Test message',
        duration: 1000,
        action: {
          label: 'Action',
        },
      });
      expect(notification.id).toBeDefined();
      expect(notification.timestamp).toBeDefined();
    });
  });

  describe('createErrorNotification', () => {
    it('devrait créer une notification d\'erreur', () => {
      const notification = createErrorNotification('Error message');

      expect(notification).toMatchObject({
        type: 'error',
        message: 'Error message',
        duration: 5000,
      });
    });
  });

  describe('createWarningNotification', () => {
    it('devrait créer une notification d\'avertissement', () => {
      const notification = createWarningNotification('Warning message');

      expect(notification).toMatchObject({
        type: 'warning',
        message: 'Warning message',
        duration: 3000,
      });
    });
  });

  describe('createInfoNotification', () => {
    it('devrait créer une notification d\'information', () => {
      const notification = createInfoNotification('Info message');

      expect(notification).toMatchObject({
        type: 'info',
        message: 'Info message',
        duration: 2000,
      });
    });
  });

  describe('createSuccessNotification', () => {
    it('devrait créer une notification de succès', () => {
      const notification = createSuccessNotification('Success message');

      expect(notification).toMatchObject({
        type: 'success',
        message: 'Success message',
        duration: 2000,
      });
    });
  });

  describe('addNotification', () => {
    it('devrait ajouter une notification à l\'état', () => {
      const notification = createNotification('info', 'Test message');
      const newState = addNotification(initialState, notification);

      expect(newState.notifications).toHaveLength(1);
      expect(newState.notifications[0]).toBe(notification);
    });

    it('devrait respecter la limite maximale de notifications', () => {
      const state = { ...initialState, maxNotifications: 2 };
      const notifications = [
        createNotification('info', 'Message 1'),
        createNotification('info', 'Message 2'),
        createNotification('info', 'Message 3'),
      ];

      const newState = notifications.reduce(
        (state, notification) => addNotification(state, notification),
        state
      );

      expect(newState.notifications).toHaveLength(2);
      expect(newState.notifications[0].message).toBe('Message 2');
      expect(newState.notifications[1].message).toBe('Message 3');
    });
  });

  describe('removeNotification', () => {
    it('devrait supprimer une notification par son ID', () => {
      const notification = createNotification('info', 'Test message');
      const state = addNotification(initialState, notification);
      const newState = removeNotification(state, notification.id);

      expect(newState.notifications).toHaveLength(0);
    });
  });

  describe('clearNotifications', () => {
    it('devrait supprimer toutes les notifications', () => {
      const notifications = [
        createNotification('info', 'Message 1'),
        createNotification('info', 'Message 2'),
      ];
      const state = notifications.reduce(
        (state, notification) => addNotification(state, notification),
        initialState
      );
      const newState = clearNotifications(state);

      expect(newState.notifications).toHaveLength(0);
    });
  });

  describe('setMaxNotifications', () => {
    it('devrait mettre à jour la limite maximale de notifications', () => {
      const newState = setMaxNotifications(initialState, 10);

      expect(newState.maxNotifications).toBe(10);
    });

    it('devrait supprimer les notifications excédentaires', () => {
      const notifications = [
        createNotification('info', 'Message 1'),
        createNotification('info', 'Message 2'),
        createNotification('info', 'Message 3'),
      ];
      const state = notifications.reduce(
        (state, notification) => addNotification(state, notification),
        initialState
      );
      const newState = setMaxNotifications(state, 2);

      expect(newState.notifications).toHaveLength(2);
      expect(newState.maxNotifications).toBe(2);
    });
  });
}); 
