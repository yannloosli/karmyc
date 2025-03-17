import { AnyAction } from '@reduxjs/toolkit';
import { historyPlugin } from '../../plugins/historyPlugin';
import { ActionPriority } from '../../priorities';

describe('HistoryPlugin', () => {
  it('devrait avoir la bonne configuration', () => {
    expect(historyPlugin.id).toBe('history');
    expect(historyPlugin.priority).toBe(ActionPriority.HIGH);
    expect(Array.isArray(historyPlugin.actionTypes)).toBe(true);
    expect(historyPlugin.actionTypes).toContain('area/addArea');
    expect(historyPlugin.actionTypes).toContain('area/removeArea');
    expect(historyPlugin.actionTypes).toContain('area/updateArea');
  });

  it('devrait gérer les actions d\'historique', () => {
    const action: AnyAction = {
      type: 'area/addArea',
      payload: {
        id: 'area-1',
        type: 'editor'
      }
    };

    // Vérifier que le handler ne lance pas d'erreur
    expect(() => historyPlugin.handler(action)).not.toThrow();
  });

  it('devrait ignorer les actions non liées à l\'historique', () => {
    const action: AnyAction = {
      type: 'other/action',
      payload: {}
    };

    // Vérifier que le handler ne lance pas d'erreur
    expect(() => historyPlugin.handler(action)).not.toThrow();
  });
}); 
