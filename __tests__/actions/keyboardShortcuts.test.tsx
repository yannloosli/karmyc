import { useKarmycStore } from '../../src/core/store';
import { AreaRole } from '../../src/core/types/karmyc';
import { keyboardShortcutRegistry, KeyboardShortcut } from '../../src/core/registries/keyboardShortcutRegistry';
import { act } from '@testing-library/react';
import { KarmycCoreProvider } from '../../src/core/KarmycCoreProvider';
import { render } from '@testing-library/react';
import React from 'react';

describe('Keyboard Shortcuts', () => {
  let providerOptions = {
    keyboardShortcutsEnabled: true,
    resizableAreas: true,
    manageableAreas: true,
    multiScreen: true,
    builtInLayouts: [],
    initialAreas: [
      {
        type: 'test-area',
        id: 'test-area-1',
        state: {}
      }
    ]
  };

  let provider: ReturnType<typeof render>;

  beforeEach(() => {
    // Réinitialiser le store avant chaque test
    act(() => {
      useKarmycStore.setState({
        screens: {
          "1": {
            areas: {
              _id: 0,
              rootId: null,
              errors: [],
              activeAreaId: null,
              joinPreview: null,
              layout: {},
              areas: {},
              viewports: {},
              areaToOpen: null,
              lastSplitResultData: null,
              lastLeadAreaId: null
            }
          }
        },
        activeScreenId: '1',
        options: {
          keyboardShortcutsEnabled: true,
          resizableAreas: true,
          manageableAreas: true,
          multiScreen: true,
          builtInLayouts: []
        }
      });
    });

    // Rendre le provider pour initialiser les événements clavier
    provider = render(
      <KarmycCoreProvider options={providerOptions}>
        <div />
      </KarmycCoreProvider>
    );
  });

  afterEach(() => {
    provider.unmount();
  });

  it('should register a shortcut', () => {
    const handler = jest.fn();
    const shortcut: KeyboardShortcut = {
      key: 'a',
      name: 'Test Shortcut',
      fn: handler,
      modifierKeys: ['Control'],
      isGlobal: true
    };

    const id = keyboardShortcutRegistry.register(shortcut);

    act(() => {
      // Simuler l'appui sur la touche
      const event = new KeyboardEvent('keydown', {
        key: 'a',
        ctrlKey: true,
        bubbles: true,
        cancelable: true
      });
      document.dispatchEvent(event);
    });

    expect(handler).toHaveBeenCalled();
    expect(id).toBeDefined();
  });

  it('should unregister a shortcut', () => {
    const handler = jest.fn();
    const shortcut: KeyboardShortcut = {
      key: 'a',
      name: 'Test Shortcut',
      fn: handler,
      modifierKeys: ['Control'],
      isGlobal: true
    };

    const id = keyboardShortcutRegistry.register(shortcut);
    const removed = keyboardShortcutRegistry.remove(id);

    act(() => {
      // Simuler l'appui sur la touche
      const event = new KeyboardEvent('keydown', {
        key: 'a',
        ctrlKey: true,
        bubbles: true,
        cancelable: true
      });
      document.dispatchEvent(event);
    });

    expect(handler).not.toHaveBeenCalled();
    expect(removed).toBe(true);
  });

  it('should handle area-specific shortcuts', () => {
    const area = {
      id: 'test-area-1',
      type: 'test-area',
      role: 'LEAD' as AreaRole,
      state: {}
    };

    const handler = jest.fn();
    const shortcut: KeyboardShortcut = {
      key: 'b',
      name: 'Area Shortcut',
      fn: handler,
      modifierKeys: ['Control'],
      areaType: 'test-area'
    };

    keyboardShortcutRegistry.registerShortcuts('test-area', [shortcut]);

    act(() => {
      useKarmycStore.setState({
        screens: {
          "1": {
            areas: {
              _id: 0,
              rootId: null,
              errors: [],
              activeAreaId: 'test-area-1',
              joinPreview: null,
              layout: {},
              areas: {
                'test-area-1': area
              },
              viewports: {},
              areaToOpen: null,
              lastSplitResultData: null,
              lastLeadAreaId: null
            }
          }
        }
      });

      // Simuler l'appui sur la touche
      const event = new KeyboardEvent('keydown', {
        key: 'b',
        ctrlKey: true,
        bubbles: true,
        cancelable: true
      });
      document.dispatchEvent(event);
    });

    expect(handler).toHaveBeenCalled();
  });

  it('should not trigger shortcuts when disabled', () => {
    // Démontage du provider précédent
    provider.unmount();

    // Mettre à jour les options
    providerOptions = {
      ...providerOptions,
      keyboardShortcutsEnabled: false
    };

    // Mettre à jour le store directement
    act(() => {
      useKarmycStore.setState({
        options: {
          ...useKarmycStore.getState().options,
          keyboardShortcutsEnabled: false
        }
      });
    });

    // Créer un nouveau provider avec les options mises à jour
    provider = render(
      <KarmycCoreProvider options={providerOptions}>
        <div />
      </KarmycCoreProvider>
    );

    // Vérifier que les options sont correctement propagées
    expect(useKarmycStore.getState().options.keyboardShortcutsEnabled).toBe(false);

    const handler = jest.fn();
    const shortcut: KeyboardShortcut = {
      key: 'c',
      name: 'Disabled Shortcut',
      fn: handler,
      modifierKeys: ['Control'],
      isGlobal: true
    };

    keyboardShortcutRegistry.register(shortcut);

    act(() => {
      // Simuler l'appui sur la touche
      const event = new KeyboardEvent('keydown', {
        key: 'c',
        ctrlKey: true,
        bubbles: true,
        cancelable: true
      });
      document.dispatchEvent(event);
    });

    expect(handler).not.toHaveBeenCalled();
  });
}); 
