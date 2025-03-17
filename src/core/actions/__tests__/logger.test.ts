import { AnyAction } from '@reduxjs/toolkit';
import { actionLogger, LogLevel } from '../logger';

describe('ActionLogger', () => {
  beforeEach(() => {
    actionLogger.clearLogs();
    actionLogger.enable();
  });

  describe('Configuration', () => {
    it('devrait être un singleton', () => {
      const logger1 = actionLogger;
      const logger2 = actionLogger;
      expect(logger1).toBe(logger2);
    });

    it('devrait permettre de configurer le niveau de log', () => {
      actionLogger.setConfig({ level: LogLevel.WARN });
      actionLogger.debug('Message debug');
      actionLogger.info('Message info');
      actionLogger.warn('Message warn');
      actionLogger.error('Message error');

      const logs = actionLogger.getLogs();
      expect(logs.length).toBe(2);
      expect(logs[0].level).toBe(LogLevel.WARN);
      expect(logs[1].level).toBe(LogLevel.ERROR);
    });

    it('devrait permettre de désactiver le logging', () => {
      actionLogger.disable();
      actionLogger.info('Message info');
      expect(actionLogger.getLogs().length).toBe(0);
    });

    it('devrait permettre de configurer le nombre maximum de logs', () => {
      actionLogger.setMaxLogs(2);
      actionLogger.info('Message 1');
      actionLogger.info('Message 2');
      actionLogger.info('Message 3');

      const logs = actionLogger.getLogs();
      expect(logs.length).toBe(2);
      expect(logs[0].message).toBe('Message 2');
      expect(logs[1].message).toBe('Message 3');
    });
  });

  describe('Logging', () => {
    it('devrait logger des messages avec différents niveaux', () => {
      actionLogger.debug('Message debug');
      actionLogger.info('Message info');
      actionLogger.warn('Message warn');
      actionLogger.error('Message error');

      const logs = actionLogger.getLogs();
      expect(logs.length).toBe(4);
      expect(logs.map(log => log.level)).toEqual([
        LogLevel.DEBUG,
        LogLevel.INFO,
        LogLevel.WARN,
        LogLevel.ERROR
      ]);
    });

    it('devrait inclure les métadonnées dans les logs', () => {
      const metadata = { key: 'value' };
      actionLogger.info('Message avec métadonnées', undefined, metadata);

      const logs = actionLogger.getLogs();
      expect(logs[0].metadata).toEqual(metadata);
    });

    it('devrait inclure les actions dans les logs', () => {
      const action: AnyAction = {
        type: 'test/action',
        payload: { data: 'test' }
      };
      actionLogger.info('Message avec action', action);

      const logs = actionLogger.getLogs();
      expect(logs[0].action).toEqual(action);
    });

    it('devrait inclure les erreurs dans les logs', () => {
      const error = new Error('Test error');
      actionLogger.error('Message avec erreur', undefined, error);

      const logs = actionLogger.getLogs();
      expect(logs[0].error).toBe(error);
    });
  });

  describe('Filtrage', () => {
    it('devrait filtrer les logs par niveau', () => {
      actionLogger.debug('Message debug');
      actionLogger.info('Message info');
      actionLogger.warn('Message warn');
      actionLogger.error('Message error');

      const warnLogs = actionLogger.getLogsByLevel(LogLevel.WARN);
      expect(warnLogs.length).toBe(1);
      expect(warnLogs[0].level).toBe(LogLevel.WARN);
    });

    it('devrait filtrer les logs par type d\'action', () => {
      const action1: AnyAction = { type: 'test/action1', payload: {} };
      const action2: AnyAction = { type: 'test/action2', payload: {} };
      
      actionLogger.info('Message 1', action1);
      actionLogger.info('Message 2', action2);

      const action1Logs = actionLogger.getLogsByActionType('test/action1');
      expect(action1Logs.length).toBe(1);
      expect(action1Logs[0].action?.type).toBe('test/action1');
    });

    it('devrait respecter le filtre personnalisé', () => {
      actionLogger.setConfig({
        filter: (action: AnyAction) => action.type.startsWith('test/')
      });

      const validAction: AnyAction = { type: 'test/action', payload: {} };
      const invalidAction: AnyAction = { type: 'other/action', payload: {} };

      actionLogger.info('Message valide', validAction);
      actionLogger.info('Message invalide', invalidAction);

      const logs = actionLogger.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].action?.type).toBe('test/action');
    });
  });

  describe('Nettoyage', () => {
    it('devrait permettre de vider les logs', () => {
      actionLogger.info('Message 1');
      actionLogger.info('Message 2');
      expect(actionLogger.getLogs().length).toBe(2);

      actionLogger.clearLogs();
      expect(actionLogger.getLogs().length).toBe(0);
    });
  });
}); 
