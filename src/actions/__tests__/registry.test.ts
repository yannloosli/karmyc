import { AnyAction } from '@reduxjs/toolkit';
import { actionLogger } from '../logger';
import { actionMonitor } from '../monitoring';
import { ActionPriority } from '../priorities';
import { actionRegistry } from '../registry';
import { actionSecurity } from '../security';

// Mock des dépendances
jest.mock('../logger');
jest.mock('../monitoring');
jest.mock('../security');

describe('ActionRegistry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    actionRegistry.clear();
  });

  describe('registerPlugin', () => {
    it('devrait enregistrer un plugin correctement', () => {
      const plugin = {
        id: 'test-plugin',
        priority: ActionPriority.NORMAL,
        actionTypes: ['test/action'],
        handler: jest.fn()
      };

      actionRegistry.registerPlugin(plugin);
      const plugins = actionRegistry.getPlugins();
      expect(plugins).toContainEqual(plugin);
    });

    it('devrait trier les plugins par priorité', () => {
      const lowPriorityPlugin = {
        id: 'low',
        priority: ActionPriority.LOW,
        actionTypes: ['test/action'],
        handler: jest.fn()
      };

      const highPriorityPlugin = {
        id: 'high',
        priority: ActionPriority.HIGH,
        actionTypes: ['test/action'],
        handler: jest.fn()
      };

      actionRegistry.registerPlugin(lowPriorityPlugin);
      actionRegistry.registerPlugin(highPriorityPlugin);

      const plugins = actionRegistry.getPlugins();
      expect(plugins[0]).toBe(highPriorityPlugin);
      expect(plugins[1]).toBe(lowPriorityPlugin);
    });
  });

  describe('unregisterPlugin', () => {
    it('devrait désenregistrer un plugin par son ID', () => {
      const plugin = {
        id: 'test-plugin',
        priority: ActionPriority.NORMAL,
        actionTypes: ['test/action'],
        handler: jest.fn()
      };

      actionRegistry.registerPlugin(plugin);
      actionRegistry.unregisterPlugin('test-plugin');

      const plugins = actionRegistry.getPlugins();
      expect(plugins).not.toContainEqual(plugin);
    });
  });

  describe('handleAction', () => {
    it('devrait appeler les handlers des plugins concernés', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      const plugin1 = {
        id: 'plugin1',
        priority: ActionPriority.HIGH,
        actionTypes: ['test/action'],
        handler: handler1
      };

      const plugin2 = {
        id: 'plugin2',
        priority: ActionPriority.NORMAL,
        actionTypes: ['test/action'],
        handler: handler2
      };

      actionRegistry.registerPlugin(plugin1);
      actionRegistry.registerPlugin(plugin2);

      const action: AnyAction = {
        type: 'test/action',
        payload: { data: 'test' }
      };

      actionRegistry.handleAction(action);

      expect(handler1).toHaveBeenCalledWith(action);
      expect(handler2).toHaveBeenCalledWith(action);
    });

    it('devrait respecter l\'ordre de priorité des plugins', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      const plugin1 = {
        id: 'plugin1',
        priority: ActionPriority.LOW,
        actionTypes: ['test/action'],
        handler: handler1
      };

      const plugin2 = {
        id: 'plugin2',
        priority: ActionPriority.HIGH,
        actionTypes: ['test/action'],
        handler: handler2
      };

      actionRegistry.registerPlugin(plugin1);
      actionRegistry.registerPlugin(plugin2);

      const action: AnyAction = {
        type: 'test/action',
        payload: { data: 'test' }
      };

      actionRegistry.handleAction(action);

      expect(handler2).toHaveBeenCalledBefore(handler1);
    });

    it('devrait gérer les erreurs dans les handlers', () => {
      const error = new Error('Test error');
      const handler = jest.fn().mockImplementation(() => {
        throw error;
      });

      const plugin = {
        id: 'error-plugin',
        priority: ActionPriority.NORMAL,
        actionTypes: ['test/action'],
        handler
      };

      actionRegistry.registerPlugin(plugin);

      const action: AnyAction = {
        type: 'test/action',
        payload: { data: 'test' }
      };

      actionRegistry.handleAction(action);

      expect(actionLogger.error).toHaveBeenCalledWith(
        'Erreur dans le plugin error-plugin',
        action,
        error
      );
    });
  });

  describe('validateAction', () => {
    it('devrait valider une action avec succès', () => {
      const validator = jest.fn().mockReturnValue({ valid: true });
      actionRegistry.registerValidator('test/action', validator);

      const action: AnyAction = {
        type: 'test/action',
        payload: { data: 'test' }
      };

      const result = actionRegistry.validateAction(action);
      expect(result.valid).toBe(true);
    });

    it('devrait rejeter une action invalide', () => {
      const validator = jest.fn().mockReturnValue({
        valid: false,
        message: 'Action invalide'
      });
      actionRegistry.registerValidator('test/action', validator);

      const action: AnyAction = {
        type: 'test/action',
        payload: { data: 'test' }
      };

      const result = actionRegistry.validateAction(action);
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Action invalide');
    });
  });

  describe('Intégration', () => {
    it('devrait suivre le flux complet de traitement d\'une action', () => {
      const action: AnyAction = {
        type: 'test/action',
        payload: { data: 'test' }
      };

      const handler = jest.fn();
      const plugin = {
        id: 'test-plugin',
        priority: ActionPriority.NORMAL,
        actionTypes: ['test/action'],
        handler
      };

      actionRegistry.registerPlugin(plugin);

      // Simuler le flux complet
      actionMonitor.startMonitoring(action);
      actionSecurity.validateAction(action, []);
      actionRegistry.handleAction(action);
      actionMonitor.endMonitoring(action, true);

      expect(actionMonitor.startMonitoring).toHaveBeenCalledWith(action);
      expect(actionSecurity.validateAction).toHaveBeenCalledWith(action, []);
      expect(handler).toHaveBeenCalledWith(action);
      expect(actionMonitor.endMonitoring).toHaveBeenCalledWith(action, true);
    });
  });
}); 
