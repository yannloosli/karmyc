import { karmycStore } from '../../src/store/karmycStore';
import { AreaRole } from '../types/area';
import { 
  registerShortcut,
  unregisterShortcut,
  handleKeyPress
} from '../../src/actions/keyboardShortcuts';

describe('Keyboard Shortcuts', () => {
  beforeEach(() => {
    karmycStore.setState({
      screens: {
        main: {
          areas: {},
          layout: {
            type: 'row',
            children: []
          }
        }
      },
      activeScreenId: 'main',
      options: {
        keyboardShortcutsEnabled: true,
        resizableAreas: true,
        manageableAreas: true,
        multiScreen: true,
        builtInLayouts: []
      }
    });
  });

  it('should register a shortcut', () => {
    const handler = jest.fn();
    registerShortcut({
      key: 'a',
      ctrlKey: true,
      handler
    });

    handleKeyPress(new KeyboardEvent('keydown', {
      key: 'a',
      ctrlKey: true
    }));

    expect(handler).toHaveBeenCalled();
  });

  it('should unregister a shortcut', () => {
    const handler = jest.fn();
    const shortcut = {
      key: 'a',
      ctrlKey: true,
      handler
    };

    registerShortcut(shortcut);
    unregisterShortcut(shortcut);

    handleKeyPress(new KeyboardEvent('keydown', {
      key: 'a',
      ctrlKey: true
    }));

    expect(handler).not.toHaveBeenCalled();
  });

  it('should handle area-specific shortcuts', () => {
    const area = {
      type: 'test-area',
      role: 'LEAD' as AreaRole,
      state: {}
    };

    const handler = jest.fn();
    registerShortcut({
      key: 'b',
      ctrlKey: true,
      handler,
      areaId: 'test-area-1'
    });

    karmycStore.setState({
      screens: {
        main: {
          areas: {
            'test-area-1': area
          },
          activeAreaId: 'test-area-1',
          layout: {
            type: 'row',
            children: []
          }
        }
      }
    });

    handleKeyPress(new KeyboardEvent('keydown', {
      key: 'b',
      ctrlKey: true
    }));

    expect(handler).toHaveBeenCalled();
  });

  it('should not trigger shortcuts when disabled', () => {
    karmycStore.setState({
      options: {
        keyboardShortcutsEnabled: false
      }
    });

    const handler = jest.fn();
    registerShortcut({
      key: 'c',
      ctrlKey: true,
      handler
    });

    handleKeyPress(new KeyboardEvent('keydown', {
      key: 'c',
      ctrlKey: true
    }));

    expect(handler).not.toHaveBeenCalled();
  });
}); 
