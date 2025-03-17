import { AnyAction } from '@reduxjs/toolkit';
import { hasPayload, hasRequiredFields } from '../validators';

describe('Validators', () => {
  describe('hasPayload', () => {
    it('devrait valider une action avec un payload', () => {
      const action: AnyAction = {
        type: 'test/action',
        payload: { data: 'test' }
      };

      const result = hasPayload(action);
      expect(result.valid).toBe(true);
    });

    it('devrait rejeter une action sans payload', () => {
      const action: AnyAction = {
        type: 'test/action'
      };

      const result = hasPayload(action);
      expect(result.valid).toBe(false);
      expect(result.message).toBe('L\'action test/action n\'a pas de payload');
    });
  });

  describe('hasRequiredFields', () => {
    it('devrait valider une action avec tous les champs requis', () => {
      const action: AnyAction = {
        type: 'test/action',
        payload: {
          id: '123',
          name: 'test',
          type: 'editor'
        }
      };

      const validator = hasRequiredFields(['id', 'name', 'type']);
      const result = validator(action);
      expect(result.valid).toBe(true);
    });

    it('devrait rejeter une action manquant des champs requis', () => {
      const action: AnyAction = {
        type: 'test/action',
        payload: {
          id: '123'
        }
      };

      const validator = hasRequiredFields(['id', 'name', 'type']);
      const result = validator(action);
      expect(result.valid).toBe(false);
      expect(result.message).toBe('L\'action test/action n\'a pas la propriété requise: name');
    });

    it('devrait rejeter une action sans payload', () => {
      const action: AnyAction = {
        type: 'test/action'
      };

      const validator = hasRequiredFields(['id', 'name']);
      const result = validator(action);
      expect(result.valid).toBe(false);
      expect(result.message).toBe('L\'action test/action n\'a pas la propriété requise: id');
    });
  });
}); 
