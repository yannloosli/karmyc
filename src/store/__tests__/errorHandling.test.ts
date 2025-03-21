import { AnyAction } from '@reduxjs/toolkit';
import { ErrorHandler, ErrorType, errorUtils } from '../errorHandling';

describe('Gestionnaire d\'Erreurs', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = ErrorHandler.getInstance();
    errorHandler.clearErrors();
  });

  test('Singleton pattern fonctionne correctement', () => {
    const instance1 = ErrorHandler.getInstance();
    const instance2 = ErrorHandler.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('Ajout d\'erreur', () => {
    const error = errorUtils.createValidationError('Test error');
    errorHandler.addError(error);
    const errors = errorHandler.getErrors();
    expect(errors).toHaveLength(1);
    expect(errors[0]).toEqual(expect.objectContaining({
      type: ErrorType.VALIDATION,
      message: 'Test error'
    }));
  });

  test('Écouteurs d\'erreurs', () => {
    const mockListener = jest.fn();
    const error = errorUtils.createValidationError('Test error');
    
    const unsubscribe = errorHandler.addListener(mockListener);
    errorHandler.addError(error);
    
    expect(mockListener).toHaveBeenCalledWith(error);
    
    unsubscribe();
    errorHandler.addError(errorUtils.createValidationError('Another error'));
    expect(mockListener).toHaveBeenCalledTimes(1);
  });

  test('Filtrage des erreurs par type', () => {
    const validationError = errorUtils.createValidationError('Validation error');
    const transitionError = errorUtils.createTransitionError('Transition error');
    
    errorHandler.addError(validationError);
    errorHandler.addError(transitionError);
    
    const validationErrors = errorHandler.getErrorsByType(ErrorType.VALIDATION);
    expect(validationErrors).toHaveLength(1);
    expect(validationErrors[0]).toEqual(validationError);
  });

  test('Erreurs récentes', () => {
    const error1 = errorUtils.createValidationError('Error 1');
    const error2 = errorUtils.createValidationError('Error 2');
    const error3 = errorUtils.createValidationError('Error 3');
    
    errorHandler.addError(error1);
    errorHandler.addError(error2);
    errorHandler.addError(error3);
    
    const recentErrors = errorHandler.getRecentErrors(2);
    expect(recentErrors).toHaveLength(2);
    expect(recentErrors[0]).toEqual(error3);
    expect(recentErrors[1]).toEqual(error2);
  });

  test('Nettoyage des erreurs', () => {
    const validationError = errorUtils.createValidationError('Validation error');
    const transitionError = errorUtils.createTransitionError('Transition error');
    
    errorHandler.addError(validationError);
    errorHandler.addError(transitionError);
    
    errorHandler.clearErrorsByType(ErrorType.VALIDATION);
    expect(errorHandler.getErrors()).toHaveLength(1);
    expect(errorHandler.getErrors()[0]).toEqual(transitionError);
    
    errorHandler.clearErrors();
    expect(errorHandler.getErrors()).toHaveLength(0);
  });
});

describe('Utilitaires d\'Erreurs', () => {
  test('Création d\'erreur de validation', () => {
    const error = errorUtils.createValidationError('Test error', { field: 'name' });
    expect(error).toEqual(expect.objectContaining({
      type: ErrorType.VALIDATION,
      message: 'Test error',
      code: 'VALIDATION_ERROR',
      details: { field: 'name' }
    }));
  });

  test('Création d\'erreur de transition', () => {
    const action: AnyAction = { type: 'test/action' };
    const error = errorUtils.createTransitionError('Test error', action, { from: 'draft', to: 'review' });
    expect(error).toEqual(expect.objectContaining({
      type: ErrorType.TRANSITION,
      message: 'Test error',
      code: 'TRANSITION_ERROR',
      action,
      details: { from: 'draft', to: 'review' }
    }));
  });

  test('Création d\'erreur de diff', () => {
    const error = errorUtils.createDiffError('Test error', { diffId: '123' });
    expect(error).toEqual(expect.objectContaining({
      type: ErrorType.DIFF,
      message: 'Test error',
      code: 'DIFF_ERROR',
      details: { diffId: '123' }
    }));
  });

  test('Création d\'erreur de barre d\'outils', () => {
    const error = errorUtils.createToolbarError('Test error', { toolId: '456' });
    expect(error).toEqual(expect.objectContaining({
      type: ErrorType.TOOLBAR,
      message: 'Test error',
      code: 'TOOLBAR_ERROR',
      details: { toolId: '456' }
    }));
  });

  test('Création d\'erreur système', () => {
    const error = errorUtils.createSystemError('Test error', { component: 'store' });
    expect(error).toEqual(expect.objectContaining({
      type: ErrorType.SYSTEM,
      message: 'Test error',
      code: 'SYSTEM_ERROR',
      details: { component: 'store' }
    }));
  });
}); 
