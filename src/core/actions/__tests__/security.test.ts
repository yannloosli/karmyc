import { AnyAction } from '@reduxjs/toolkit';
import { actionLogger } from '../logger';
import { actionMonitor } from '../monitoring';
import { actionSecurity, Permission } from '../security';

// Mock des dépendances
jest.mock('../logger');
jest.mock('../monitoring');

describe('ActionSecurity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    actionSecurity.clearRateLimits();
  });

  describe('registerPermission', () => {
    it('devrait enregistrer une permission correctement', () => {
      const permission = {
        actionType: 'test/action',
        requiredPermissions: [Permission.READ, Permission.WRITE]
      };

      actionSecurity.registerPermission(permission);
      const permissions = actionSecurity.getPermissions();
      expect(permissions.get('test/action')).toEqual(permission);
    });
  });

  describe('unregisterPermission', () => {
    it('devrait désenregistrer une permission', () => {
      const permission = {
        actionType: 'test/action',
        requiredPermissions: [Permission.READ]
      };

      actionSecurity.registerPermission(permission);
      actionSecurity.unregisterPermission('test/action');

      const permissions = actionSecurity.getPermissions();
      expect(permissions.has('test/action')).toBe(false);
    });
  });

  describe('validateAction', () => {
    it('devrait valider une action sans permission requise', () => {
      const action: AnyAction = {
        type: 'test/action',
        payload: { data: 'test' }
      };

      const result = actionSecurity.validateAction(action, []);
      expect(result).toBe(true);
    });

    it('devrait valider une action avec les permissions requises', () => {
      const permission = {
        actionType: 'test/action',
        requiredPermissions: [Permission.READ, Permission.WRITE]
      };

      actionSecurity.registerPermission(permission);

      const action: AnyAction = {
        type: 'test/action',
        payload: { data: 'test' }
      };

      const result = actionSecurity.validateAction(action, [Permission.READ, Permission.WRITE]);
      expect(result).toBe(true);
    });

    it('devrait rejeter une action sans les permissions requises', () => {
      const permission = {
        actionType: 'test/action',
        requiredPermissions: [Permission.READ, Permission.WRITE]
      };

      actionSecurity.registerPermission(permission);

      const action: AnyAction = {
        type: 'test/action',
        payload: { data: 'test' }
      };

      const result = actionSecurity.validateAction(action, [Permission.READ]);
      expect(result).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('devrait respecter le rate limit', () => {
      const permission = {
        actionType: 'test/action',
        requiredPermissions: [Permission.READ],
        rateLimit: {
          maxRequests: 2,
          windowMs: 1000
        }
      };

      actionSecurity.registerPermission(permission);

      const action: AnyAction = {
        type: 'test/action',
        payload: { data: 'test' }
      };

      // Première action
      const result1 = actionSecurity.validateAction(action, [Permission.READ]);
      expect(result1).toBe(true);

      // Deuxième action
      const result2 = actionSecurity.validateAction(action, [Permission.READ]);
      expect(result2).toBe(true);

      // Troisième action (devrait être rejetée)
      const result3 = actionSecurity.validateAction(action, [Permission.READ]);
      expect(result3).toBe(false);
    });

    it('devrait réinitialiser le rate limit après la fenêtre de temps', () => {
      const permission = {
        actionType: 'test/action',
        requiredPermissions: [Permission.READ],
        rateLimit: {
          maxRequests: 1,
          windowMs: 100
        }
      };

      actionSecurity.registerPermission(permission);

      const action: AnyAction = {
        type: 'test/action',
        payload: { data: 'test' }
      };

      // Première action
      const result1 = actionSecurity.validateAction(action, [Permission.READ]);
      expect(result1).toBe(true);

      // Deuxième action (devrait être rejetée)
      const result2 = actionSecurity.validateAction(action, [Permission.READ]);
      expect(result2).toBe(false);

      // Attendre que la fenêtre de temps expire
      jest.advanceTimersByTime(150);

      // Nouvelle action (devrait être acceptée)
      const result3 = actionSecurity.validateAction(action, [Permission.READ]);
      expect(result3).toBe(true);
    });
  });

  describe('Logging et Monitoring', () => {
    it('devrait logger les rejets de permission', () => {
      const permission = {
        actionType: 'test/action',
        requiredPermissions: [Permission.READ]
      };

      actionSecurity.registerPermission(permission);

      const action: AnyAction = {
        type: 'test/action',
        payload: { data: 'test' }
      };

      actionSecurity.validateAction(action, []);

      expect(actionLogger.warn).toHaveBeenCalledWith(
        'Action rejetée - Permissions insuffisantes',
        action,
        expect.any(Object)
      );
    });

    it('devrait logger les rejets de rate limit', () => {
      const permission = {
        actionType: 'test/action',
        requiredPermissions: [Permission.READ],
        rateLimit: {
          maxRequests: 1,
          windowMs: 1000
        }
      };

      actionSecurity.registerPermission(permission);

      const action: AnyAction = {
        type: 'test/action',
        payload: { data: 'test' }
      };

      // Première action
      actionSecurity.validateAction(action, [Permission.READ]);

      // Deuxième action (devrait être rejetée)
      actionSecurity.validateAction(action, [Permission.READ]);

      expect(actionLogger.warn).toHaveBeenCalledWith(
        'Action rejetée - Rate limit dépassé',
        action,
        expect.any(Object)
      );
    });

    it('devrait mettre à jour le monitoring en cas de rejet', () => {
      const permission = {
        actionType: 'test/action',
        requiredPermissions: [Permission.READ]
      };

      actionSecurity.registerPermission(permission);

      const action: AnyAction = {
        type: 'test/action',
        payload: { data: 'test' }
      };

      actionSecurity.validateAction(action, []);

      expect(actionMonitor.endMonitoring).toHaveBeenCalledWith(action, false);
    });
  });
}); 
