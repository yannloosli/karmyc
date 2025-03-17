import { AnyAction } from '@reduxjs/toolkit';
import { JSONSchema7, JSONSchema7TypeName } from 'json-schema';
import { actionLogger } from '../logger';
import { IActionValidationResult, TActionValidator } from '../types';

export class SchemaValidator implements TActionValidator {
  private schema: JSONSchema7;

  constructor(schema: JSONSchema7) {
    this.schema = schema;
  }

  validate(action: AnyAction): IActionValidationResult {
    try {
      const isValid = this.validateSchema(action.payload, this.schema);
      
      if (!isValid) {
        actionLogger.warn('Validation par schéma échouée', action, {
          schema: this.schema,
          payload: action.payload
        });
        
        return {
          valid: false,
          message: `L'action ${action.type} ne correspond pas au schéma attendu`
        };
      }

      return { valid: true };
    } catch (error) {
      actionLogger.error('Erreur lors de la validation par schéma', action, error as Error);
      return {
        valid: false,
        message: `Erreur lors de la validation de l'action ${action.type}: ${(error as Error).message}`
      };
    }
  }

  private validateSchema(data: unknown, schema: JSONSchema7): boolean {
    // Validation des types de base
    if (schema.type) {
      if (!this.validateType(data, schema.type)) {
        return false;
      }
    }

    // Validation des propriétés requises
    if (schema.required && Array.isArray(schema.required)) {
      if (!this.validateRequired(data, schema.required)) {
        return false;
      }
    }

    // Validation des propriétés
    if (schema.properties) {
      if (!this.validateProperties(data, schema.properties)) {
        return false;
      }
    }

    // Validation des items pour les tableaux
    if (schema.items) {
      if (!this.validateItems(data, schema.items)) {
        return false;
      }
    }

    return true;
  }

  private validateType(data: unknown, type: JSONSchema7TypeName | JSONSchema7TypeName[]): boolean {
    if (Array.isArray(type)) {
      return type.some(t => this.validateSingleType(data, t));
    }
    return this.validateSingleType(data, type);
  }

  private validateSingleType(data: unknown, type: JSONSchema7TypeName): boolean {
    switch (type) {
      case 'string':
        return typeof data === 'string';
      case 'number':
        return typeof data === 'number';
      case 'integer':
        return Number.isInteger(data);
      case 'boolean':
        return typeof data === 'boolean';
      case 'object':
        return typeof data === 'object' && data !== null;
      case 'array':
        return Array.isArray(data);
      case 'null':
        return data === null;
      default:
        return true;
    }
  }

  private validateRequired(data: unknown, required: string[]): boolean {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    return required.every(prop => prop in data);
  }

  private validateProperties(data: unknown, properties: Record<string, JSONSchema7>): boolean {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    for (const [prop, schema] of Object.entries(properties)) {
      if (prop in data) {
        if (!this.validateSchema((data as any)[prop], schema)) {
          return false;
        }
      }
    }

    return true;
  }

  private validateItems(data: unknown, items: JSONSchema7 | JSONSchema7[]): boolean {
    if (!Array.isArray(data)) {
      return false;
    }

    if (Array.isArray(items)) {
      // Validation par position
      return data.every((item, index) => {
        const schema = items[index] || items[items.length - 1];
        return this.validateSchema(item, schema);
      });
    } else {
      // Validation uniforme
      return data.every(item => this.validateSchema(item, items));
    }
  }
}

export function createSchemaValidator(schema: JSONSchema7): TActionValidator {
  return new SchemaValidator(schema);
}

// Exemple d'utilisation :
/*
const areaSchema: JSONSchema7 = {
  type: 'object',
  required: ['id', 'type'],
  properties: {
    id: { type: 'string' },
    type: { type: 'string', enum: ['editor', 'preview'] },
    position: {
      type: 'object',
      required: ['x', 'y'],
      properties: {
        x: { type: 'number' },
        y: { type: 'number' }
      }
    }
  }
};

const validator = createSchemaValidator(areaSchema);
*/ 
