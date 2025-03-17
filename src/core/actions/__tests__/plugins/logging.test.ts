import { AnyAction } from '@reduxjs/toolkit';
import { actionLogger } from '../../logger';
import { loggingPlugin } from '../../plugins/logging';

// Mock du logger
jest.mock('../../logger', () => ({
  actionLogger: {
    info: jest.fn()
  }
}));

describe('LoggingPlugin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('devrait avoir les bonnes propriétés', () => {
    expect(loggingPlugin.id).toBe('logging');
    expect(loggingPlugin.type).toBe('logging');
    expect(loggingPlugin.actionTypes).toBeNull();
  });

  it('devrait logger les informations de l\'action', () => {
    const action: AnyAction = {
      type: 'test/action',
      payload: { data: 'test' },
      meta: { timestamp: Date.now() }
    };

    loggingPlugin.handler(action);

    expect(actionLogger.info).toHaveBeenCalledWith(
      'Action exécutée: test/action',
      action,
      {
        payload: action.payload,
        meta: action.meta
      }
    );
  });

  it('devrait gérer les actions sans payload ni meta', () => {
    const action: AnyAction = {
      type: 'test/action'
    };

    loggingPlugin.handler(action);

    expect(actionLogger.info).toHaveBeenCalledWith(
      'Action exécutée: test/action',
      action,
      {
        payload: undefined,
        meta: undefined
      }
    );
  });
}); 
