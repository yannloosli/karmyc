import { AnyAction } from '@reduxjs/toolkit';
import { JSONSchema7 } from 'json-schema';
import { actionLogger } from '../logger';
import { createSchemaValidator } from '../validators/schema';

// Mock des dépendances
jest.mock('../logger');

describe('SchemaValidator', () => {
  describe('Validation de base', () => {
    it('devrait valider un objet simple', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        required: ['id', 'type'],
        properties: {
          id: { type: 'string' },
          type: { type: 'string' }
        }
      };

      const validator = createSchemaValidator(schema);
      const action: AnyAction = {
        type: 'test/action',
        payload: {
          id: '123',
          type: 'test'
        }
      };

      const result = validator(action);
      expect(result.valid).toBe(true);
    });

    it('devrait rejeter un objet manquant des champs requis', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        required: ['id', 'type'],
        properties: {
          id: { type: 'string' },
          type: { type: 'string' }
        }
      };

      const validator = createSchemaValidator(schema);
      const action: AnyAction = {
        type: 'test/action',
        payload: {
          id: '123'
        }
      };

      const result = validator(action);
      expect(result.valid).toBe(false);
      expect(result.message).toBeDefined();
    });
  });

  describe('Validation des types', () => {
    it('devrait valider les types de base', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          string: { type: 'string' },
          number: { type: 'number' },
          integer: { type: 'integer' },
          boolean: { type: 'boolean' },
          array: { type: 'array' },
          object: { type: 'object' },
          null: { type: 'null' }
        }
      };

      const validator = createSchemaValidator(schema);
      const action: AnyAction = {
        type: 'test/action',
        payload: {
          string: 'test',
          number: 42.5,
          integer: 42,
          boolean: true,
          array: [],
          object: {},
          null: null
        }
      };

      const result = validator(action);
      expect(result.valid).toBe(true);
    });

    it('devrait rejeter les types incorrects', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          string: { type: 'string' },
          number: { type: 'number' }
        }
      };

      const validator = createSchemaValidator(schema);
      const action: AnyAction = {
        type: 'test/action',
        payload: {
          string: 42,
          number: '42'
        }
      };

      const result = validator(action);
      expect(result.valid).toBe(false);
    });
  });

  describe('Validation des tableaux', () => {
    it('devrait valider un tableau simple', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      };

      const validator = createSchemaValidator(schema);
      const action: AnyAction = {
        type: 'test/action',
        payload: {
          items: ['a', 'b', 'c']
        }
      };

      const result = validator(action);
      expect(result.valid).toBe(true);
    });

    it('devrait valider un tableau avec des items par position', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: [
              { type: 'string' },
              { type: 'number' },
              { type: 'boolean' }
            ]
          }
        }
      };

      const validator = createSchemaValidator(schema);
      const action: AnyAction = {
        type: 'test/action',
        payload: {
          items: ['test', 42, true]
        }
      };

      const result = validator(action);
      expect(result.valid).toBe(true);
    });

    it('devrait rejeter un tableau avec des items invalides', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      };

      const validator = createSchemaValidator(schema);
      const action: AnyAction = {
        type: 'test/action',
        payload: {
          items: ['a', 42, 'c']
        }
      };

      const result = validator(action);
      expect(result.valid).toBe(false);
    });
  });

  describe('Validation des objets imbriqués', () => {
    it('devrait valider un objet imbriqué', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          nested: {
            type: 'object',
            required: ['id'],
            properties: {
              id: { type: 'string' }
            }
          }
        }
      };

      const validator = createSchemaValidator(schema);
      const action: AnyAction = {
        type: 'test/action',
        payload: {
          nested: {
            id: '123'
          }
        }
      };

      const result = validator(action);
      expect(result.valid).toBe(true);
    });

    it('devrait rejeter un objet imbriqué invalide', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          nested: {
            type: 'object',
            required: ['id'],
            properties: {
              id: { type: 'string' }
            }
          }
        }
      };

      const validator = createSchemaValidator(schema);
      const action: AnyAction = {
        type: 'test/action',
        payload: {
          nested: {
            id: 123
          }
        }
      };

      const result = validator(action);
      expect(result.valid).toBe(false);
    });
  });

  describe('Gestion des erreurs', () => {
    it('devrait logger les erreurs de validation', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      };

      const validator = createSchemaValidator(schema);
      const action: AnyAction = {
        type: 'test/action',
        payload: {}
      };

      validator(action);

      expect(actionLogger.warn).toHaveBeenCalledWith(
        'Validation par schéma échouée',
        action,
        expect.any(Object)
      );
    });

    it('devrait gérer les erreurs de validation', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      };

      const validator = createSchemaValidator(schema);
      const action: AnyAction = {
        type: 'test/action',
        payload: null
      };

      const result = validator(action);
      expect(result.valid).toBe(false);
      expect(result.message).toBeDefined();
    });
  });
}); 
