import {
    validateArea,
    validateContextMenuItem,
    validateDiff,
    validateDimensions,
    validatePosition,
    validateProject,
    validateState,
    validateToolbarItem,
} from '../validation';

describe('Validation Utils', () => {
  describe('validateArea', () => {
    it('devrait valider une zone valide', () => {
      const validArea = {
        id: '1',
        name: 'Zone Test',
        type: 'rectangle',
        width: 100,
        height: 100,
        x: 0,
        y: 0,
      };

      const result = validateArea(validArea);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('devrait rejeter une zone sans ID', () => {
      const invalidArea = {
        name: 'Zone Test',
        type: 'rectangle',
        width: 100,
        height: 100,
        x: 0,
        y: 0,
      };

      const result = validateArea(invalidArea as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('ID manquant');
    });

    it('devrait rejeter une zone avec des dimensions négatives', () => {
      const invalidArea = {
        id: '1',
        name: 'Zone Test',
        type: 'rectangle',
        width: -100,
        height: 100,
        x: 0,
        y: 0,
      };

      const result = validateArea(invalidArea);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Largeur invalide');
    });
  });

  describe('validateProject', () => {
    it('devrait valider un projet valide', () => {
      const validProject = {
        id: '1',
        name: 'Projet Test',
        type: 'animation',
        status: 'active',
        areas: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = validateProject(validProject);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('devrait rejeter un projet sans date de création', () => {
      const invalidProject = {
        id: '1',
        name: 'Projet Test',
        type: 'animation',
        status: 'active',
        areas: [],
        updatedAt: new Date().toISOString(),
      };

      const result = validateProject(invalidProject as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Date de création manquante');
    });
  });

  describe('validateState', () => {
    it('devrait valider un état valide', () => {
      const validState = {
        id: '1',
        type: 'animation',
        name: 'État Test',
        data: {},
        transitions: ['next', 'prev'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = validateState(validState);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('devrait rejeter un état sans transitions', () => {
      const invalidState = {
        id: '1',
        type: 'animation',
        name: 'État Test',
        data: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = validateState(invalidState as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Transitions manquantes');
    });
  });

  describe('validateDiff', () => {
    it('devrait valider une diff valide', () => {
      const validDiff = {
        id: '1',
        timestamp: Date.now(),
        type: 'update',
        changes: [
          {
            path: ['data', 'value'],
            type: 'update',
            oldValue: 'old',
            newValue: 'new',
          },
        ],
      };

      const result = validateDiff(validDiff);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('devrait rejeter une diff sans changements', () => {
      const invalidDiff = {
        id: '1',
        timestamp: Date.now(),
        type: 'update',
      };

      const result = validateDiff(invalidDiff as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Changements manquants');
    });
  });

  describe('validateToolbarItem', () => {
    it('devrait valider un item de toolbar valide', () => {
      const validItem = {
        id: '1',
        type: 'button',
        label: 'Test',
      };

      const result = validateToolbarItem(validItem);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('devrait rejeter un item sans type', () => {
      const invalidItem = {
        id: '1',
        label: 'Test',
      };

      const result = validateToolbarItem(invalidItem as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Type manquant');
    });
  });

  describe('validateContextMenuItem', () => {
    it('devrait valider un item de menu contextuel valide', () => {
      const validItem = {
        id: '1',
        label: 'Test',
        action: () => {},
      };

      const result = validateContextMenuItem(validItem);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('devrait rejeter un item sans action', () => {
      const invalidItem = {
        id: '1',
        label: 'Test',
      };

      const result = validateContextMenuItem(invalidItem as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Action manquante');
    });
  });

  describe('validatePosition', () => {
    it('devrait valider une position valide', () => {
      const validPosition = {
        x: 100,
        y: 100,
      };

      const result = validatePosition(validPosition);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('devrait rejeter une position avec coordonnées négatives', () => {
      const invalidPosition = {
        x: -100,
        y: 100,
      };

      const result = validatePosition(invalidPosition);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Position X invalide');
    });
  });

  describe('validateDimensions', () => {
    it('devrait valider des dimensions valides', () => {
      const validDimensions = {
        width: 100,
        height: 100,
      };

      const result = validateDimensions(validDimensions);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('devrait rejeter des dimensions nulles ou négatives', () => {
      const invalidDimensions = {
        width: 0,
        height: 100,
      };

      const result = validateDimensions(invalidDimensions);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Largeur invalide');
    });
  });
}); 
