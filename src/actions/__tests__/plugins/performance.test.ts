import { AnyAction } from '@reduxjs/toolkit';
import { actionLogger } from '../../logger';
import { IPerformanceConfig, performanceMonitor, performancePlugin } from '../../plugins/performance';

// Mock du logger
jest.mock('../../logger', () => ({
  actionLogger: {
    warn: jest.fn()
  }
}));

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    performanceMonitor.clear();
    jest.clearAllMocks();
  });

  describe('Configuration', () => {
    it('devrait être un singleton', () => {
      const monitor1 = performanceMonitor;
      const monitor2 = performanceMonitor;
      expect(monitor1).toBe(monitor2);
    });

    it('devrait permettre de configurer le monitoring', () => {
      const config: Partial<IPerformanceConfig> = {
        maxMetrics: 5,
        slowActionThreshold: 50,
        actionTypesToTrack: ['test/action']
      };

      performanceMonitor.setConfig(config);
      performanceMonitor.startTracking({ type: 'test/action' } as AnyAction);
      performanceMonitor.endTracking({ type: 'test/action' } as AnyAction);

      expect(performanceMonitor.getMetrics().length).toBe(1);
    });

    it('devrait permettre d\'activer/désactiver le monitoring', () => {
      performanceMonitor.disable();
      performanceMonitor.startTracking({ type: 'test/action' } as AnyAction);
      performanceMonitor.endTracking({ type: 'test/action' } as AnyAction);
      expect(performanceMonitor.getMetrics().length).toBe(0);

      performanceMonitor.enable();
      performanceMonitor.startTracking({ type: 'test/action' } as AnyAction);
      performanceMonitor.endTracking({ type: 'test/action' } as AnyAction);
      expect(performanceMonitor.getMetrics().length).toBe(1);
    });
  });

  describe('Tracking des actions', () => {
    it('devrait tracker le temps d\'exécution des actions', () => {
      const action: AnyAction = { type: 'test/action' };
      
      performanceMonitor.startTracking(action);
      // Simuler un délai
      jest.advanceTimersByTime(100);
      performanceMonitor.endTracking(action);

      const metrics = performanceMonitor.getMetrics();
      expect(metrics.length).toBe(1);
      expect(metrics[0].executionTime).toBeGreaterThanOrEqual(100);
    });

    it('devrait tracker les actions par type', () => {
      const action1: AnyAction = { type: 'test/action1' };
      const action2: AnyAction = { type: 'test/action2' };

      performanceMonitor.startTracking(action1);
      performanceMonitor.endTracking(action1);
      performanceMonitor.startTracking(action2);
      performanceMonitor.endTracking(action2);

      const globalMetrics = performanceMonitor.getGlobalMetrics();
      expect(globalMetrics.actionsByType['test/action1']).toBe(1);
      expect(globalMetrics.actionsByType['test/action2']).toBe(1);
    });

    it('devrait détecter les actions lentes', () => {
      const action: AnyAction = { type: 'test/action' };
      
      performanceMonitor.setConfig({ slowActionThreshold: 50 });
      performanceMonitor.startTracking(action);
      jest.advanceTimersByTime(100);
      performanceMonitor.endTracking(action);

      expect(actionLogger.warn).toHaveBeenCalledWith(
        'Action lente détectée',
        action,
        expect.any(Object)
      );
    });
  });

  describe('Métriques', () => {
    it('devrait calculer le temps moyen d\'exécution', () => {
      const action: AnyAction = { type: 'test/action' };

      performanceMonitor.startTracking(action);
      jest.advanceTimersByTime(100);
      performanceMonitor.endTracking(action);

      performanceMonitor.startTracking(action);
      jest.advanceTimersByTime(200);
      performanceMonitor.endTracking(action);

      const globalMetrics = performanceMonitor.getGlobalMetrics();
      expect(globalMetrics.averageExecutionTime).toBeGreaterThanOrEqual(150);
    });

    it('devrait calculer le taux d\'erreur', () => {
      const action: AnyAction = { type: 'test/action' };

      performanceMonitor.startTracking(action);
      performanceMonitor.endTracking(action, true);
      performanceMonitor.startTracking(action);
      performanceMonitor.endTracking(action, false);

      expect(performanceMonitor.getErrorRate()).toBe(50);
    });

    it('devrait identifier les actions lentes', () => {
      const action1: AnyAction = { type: 'test/action1' };
      const action2: AnyAction = { type: 'test/action2' };

      performanceMonitor.startTracking(action1);
      jest.advanceTimersByTime(50);
      performanceMonitor.endTracking(action1);

      performanceMonitor.startTracking(action2);
      jest.advanceTimersByTime(150);
      performanceMonitor.endTracking(action2);

      const slowActions = performanceMonitor.getSlowActions(100);
      expect(slowActions.length).toBe(1);
      expect(slowActions[0].type).toBe('test/action2');
    });
  });

  describe('Plugin', () => {
    it('devrait avoir les bonnes propriétés', () => {
      expect(performancePlugin.id).toBe('performance');
      expect(performancePlugin.priority).toBeDefined();
      expect(performancePlugin.actionTypes).toBeNull();
    });

    it('devrait tracker les actions via le handler', () => {
      const action: AnyAction = { type: 'test/action' };
      
      performanceMonitor.startTracking(action);
      jest.advanceTimersByTime(100);
      performancePlugin.handler(action);

      const metrics = performanceMonitor.getMetrics();
      expect(metrics.length).toBe(1);
      expect(metrics[0].executionTime).toBeGreaterThanOrEqual(100);
    });
  });
}); 
