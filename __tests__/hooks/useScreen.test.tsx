import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { useKarmycStore, initializeKarmycStore } from '../../src/store/areaStore';

describe('useKarmycStore - Screen Management', () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    // Completely reset the store
    useKarmycStore.setState({
      screens: {
        '1': {
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
          },
          isDetached: false
        }
      },
      activeScreenId: '1',
      nextScreenId: 2,
      options: {
        resizableAreas: true,
        manageableAreas: true,
        multiScreen: true
      },
      lastUpdated: Date.now()
    });

    // Mock console.warn for all tests
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    if (consoleWarnSpy) {
      consoleWarnSpy.mockRestore();
    }
  });

  it('should add a new screen', () => {
    const { result } = renderHook(() => useKarmycStore());

    act(() => {
      result.current.addScreen();
    });

    const state = useKarmycStore.getState();
    expect(Object.keys(state.screens)).toHaveLength(2); // 1 initial screen + 1 new one
    expect(state.screens['2']).toBeDefined(); // The new screen should have ID 2
    expect(state.nextScreenId).toBe(3);
  });

  it('should switch between screens', () => {
    const { result } = renderHook(() => useKarmycStore());

    act(() => {
      result.current.addScreen();
      result.current.switchScreen('2');
    });

    const state = useKarmycStore.getState();
    expect(state.activeScreenId).toBe('2');
  });

  it('should remove a screen', () => {
    const { result } = renderHook(() => useKarmycStore());

    act(() => {
      result.current.addScreen();
      result.current.removeScreen('2');
    });

    const state = useKarmycStore.getState();
    expect(Object.keys(state.screens)).toHaveLength(1); // Only the initial screen
    expect(state.screens['2']).toBeUndefined();
    expect(state.nextScreenId).toBe(2);
  });

  it('should not remove the last classic screen', () => {
    const { result } = renderHook(() => useKarmycStore());

    act(() => {
      result.current.removeScreen('1');
    });

    const state = useKarmycStore.getState();
    expect(Object.keys(state.screens)).toHaveLength(1);
    expect(state.screens['1']).toBeDefined();
  });

  it('should duplicate a screen', () => {
    const { result } = renderHook(() => useKarmycStore());

    act(() => {
      result.current.addScreen();
      result.current.duplicateScreen('2');
    });

    const state = useKarmycStore.getState();
    expect(Object.keys(state.screens)).toHaveLength(3); // 1 initial + 1 added + 1 duplicated
    expect(state.screens['2']).toBeDefined();
    expect(state.screens['3']).toBeDefined();
    expect(state.nextScreenId).toBe(4);
  });

  it('should handle detached screens', () => {
    const { result } = renderHook(() => useKarmycStore());

    act(() => {
      result.current.addScreen();
      // Simulate a detached screen
      useKarmycStore.setState(state => ({
        ...state,
        screens: {
          ...state.screens,
          '2': {
            ...state.screens['2'],
            isDetached: true
          }
        }
      }));
      result.current.removeScreen('1');
    });

    const state = useKarmycStore.getState();
    expect(Object.keys(state.screens)).toHaveLength(2); // 1 classic + 1 detached
    expect(state.screens['2']).toBeDefined();
    expect(state.screens['2'].isDetached).toBe(true);
    expect(state.screens['1']).toBeDefined(); // The classic screen remains
  });

  it('should initialize store with options', () => {
    const options = {
      resizableAreas: false,
      manageableAreas: false,
      multiScreen: false
    };

    act(() => {
      useKarmycStore.setState(state => ({
        ...state,
        options
      }));
    });

    const state = useKarmycStore.getState();
    expect(state.options).toEqual(options);
  });

  it('should handle URL synchronization', () => {
    const { result } = renderHook(() => useKarmycStore());

    // Simulate a URL parameter
    const url = new URL(window.location.href);
    url.searchParams.set('screen', '2');

    act(() => {
      result.current.addScreen();
      // Simulate the reading of the URL
      const params = new URLSearchParams(url.search);
      const screenIdFromUrl = params.get('screen');
      if (screenIdFromUrl) {
        result.current.switchScreen(screenIdFromUrl);
      }
    });

    const state = useKarmycStore.getState();
    expect(state.activeScreenId).toBe('2');
  });

  it('should handle invalid screen ID in URL', () => {
    const { result } = renderHook(() => useKarmycStore());

    // Simulate an invalid URL parameter
    const url = new URL(window.location.href);
    url.searchParams.set('screen', 'invalid');

    act(() => {
      // Simulate the reading of the URL
      const params = new URLSearchParams(url.search);
      const screenIdFromUrl = params.get('screen');
      if (screenIdFromUrl) {
        result.current.switchScreen(screenIdFromUrl);
      }
    });

    const state = useKarmycStore.getState();
    expect(state.activeScreenId).toBe('1'); // Should stay on the default screen
  });

  it('should handle screen renumbering after removal', () => {
    const { result } = renderHook(() => useKarmycStore());

    act(() => {
      result.current.addScreen();
      result.current.addScreen();
      result.current.removeScreen('2');
    });

    const state = useKarmycStore.getState();
    expect(Object.keys(state.screens)).toHaveLength(2);
    expect(state.screens['1']).toBeDefined();
    expect(state.screens['3']).toBeDefined();
    expect(state.nextScreenId).toBe(4);
  });

  it('should handle multiple detached screens', () => {
    const { result } = renderHook(() => useKarmycStore());

    act(() => {
      result.current.addScreen();
      result.current.addScreen();
      // Detach the two additional screens
      useKarmycStore.setState(state => ({
        ...state,
        screens: {
          ...state.screens,
          '2': {
            ...state.screens['2'],
            isDetached: true
          },
          '3': {
            ...state.screens['3'],
            isDetached: true
          }
        }
      }));
    });

    const state = useKarmycStore.getState();
    expect(Object.keys(state.screens)).toHaveLength(3);
    expect(state.screens['2'].isDetached).toBe(true);
    expect(state.screens['3'].isDetached).toBe(true);
  });

  it('should handle screen switching with detached screens', () => {
    const { result } = renderHook(() => useKarmycStore());

    act(() => {
      result.current.addScreen();
      // Detach the new screen
      useKarmycStore.setState(state => ({
        ...state,
        screens: {
          ...state.screens,
          '2': {
            ...state.screens['2'],
            isDetached: true
          }
        }
      }));
      // Try to switch to the detached screen
      result.current.switchScreen('2');
    });

    const state = useKarmycStore.getState();
    expect(state.activeScreenId).toBe('2'); // We should be able to switch to a detached screen
  });

  it('should handle screen duplication with detached screens', () => {
    const { result } = renderHook(() => useKarmycStore());

    act(() => {
      result.current.addScreen();
      // Detach the new screen
      useKarmycStore.setState(state => ({
        ...state,
        screens: {
          ...state.screens,
          '2': {
            ...state.screens['2'],
            isDetached: true
          }
        }
      }));
      // Duplicate the detached screen
      result.current.duplicateScreen('2');
    });

    const state = useKarmycStore.getState();
    expect(Object.keys(state.screens)).toHaveLength(3);
    expect(state.screens['3']).toBeDefined();
    expect(state.screens['3'].isDetached).toBe(true); // The new screen should inherit the detached status
  });

  it('should handle URL synchronization with detached screens', () => {
    const { result } = renderHook(() => useKarmycStore());

    act(() => {
      result.current.addScreen();
      // Detach the new screen
      useKarmycStore.setState(state => ({
        ...state,
        screens: {
          ...state.screens,
          '2': {
            ...state.screens['2'],
            isDetached: true
          }
        }
      }));

      // Simulate a URL parameter pointing to the detached screen
      const url = new URL(window.location.href);
      url.searchParams.set('screen', '2');

      // Simulate the reading of the URL
      const params = new URLSearchParams(url.search);
      const screenIdFromUrl = params.get('screen');
      if (screenIdFromUrl) {
        result.current.switchScreen(screenIdFromUrl);
      }
    });

    const state = useKarmycStore.getState();
    expect(state.activeScreenId).toBe('2'); // We should be able to switch to a detached screen via URL
  });
}); 
