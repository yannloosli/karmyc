import React, { useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { KarmycCoreProvider } from '../../src/core/KarmycCoreProvider';
import { IKarmycOptions } from '../../src/core/types/karmyc';
import { useKarmycStore, initializeMainStore } from '../../src/core/store';
import { act } from '@testing-library/react';
import { IArea } from '../../src/types/areaTypes';
import { AreaTypeValue } from '../../src/core/types/actions';
import { Karmyc } from '../../src/components/Karmyc';
import { validateArea } from '../../src/core/utils/validation';
import React from 'react';

interface TestWrapperProps {
  children: React.ReactNode;
  options?: Partial<IKarmycOptions>;
}

const defaultOptions: IKarmycOptions = {
  keyboardShortcutsEnabled: true,
  builtInLayouts: [],
  validators: [],
  initialAreas: [],
  initialLayout: undefined,
  resizableAreas: true,
  manageableAreas: true,
  multiScreen: false
};

export const TestWrapper: React.FC<TestWrapperProps> = ({ children, options = {} }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<ReturnType<typeof createRoot> | null>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!isInitialized.current) {
      act(() => {
        // Initialiser le store
        initializeMainStore({ ...defaultOptions, ...options });

        // Valider les zones initiales et mettre à jour le store avec les erreurs
        const initialAreas = options.initialAreas || [];
        const errors: string[] = [];
        
        initialAreas.forEach(area => {
          const validation = validateArea(area);
          if (!validation.isValid) {
            errors.push(...validation.errors);
          }
        });

        // Mettre à jour le store avec les erreurs
        if (errors.length > 0) {
          useKarmycStore.setState(state => ({
            ...state,
            screens: {
              ...state.screens,
              [state.activeScreenId]: {
                ...state.screens[state.activeScreenId],
                areas: {
                  ...state.screens[state.activeScreenId].areas,
                  errors
                }
              }
            }
          }));
        }
      });
      isInitialized.current = true;
    }

    if (containerRef.current && !rootRef.current) {
      rootRef.current = createRoot(containerRef.current);
    }

    if (rootRef.current) {
      const mergedOptions = { ...defaultOptions, ...options };
      act(() => {
        rootRef.current?.render(
          <KarmycCoreProvider options={mergedOptions}>
            {children}
          </KarmycCoreProvider>
        );
      });
    }

    return () => {
      if (rootRef.current) {
        setTimeout(() => {
          act(() => {
            rootRef.current?.unmount();
            rootRef.current = null;
          });
        }, 0);
      }
    };
  }, [children, options]);

  return <div ref={containerRef} />;
};

export const createMockStore = (overrides = {}) => ({
  activeScreenId: '1',
  screens: {
    '1': {
      isDetached: false,
      areas: {
        areas: {}
      }
    }
  },
  options: {
    multiScreen: false
  },
  ...overrides
});

export const createTestViewport = (overrides = {}) => ({
  top: 0,
  left: 0,
  width: 100,
  height: 100,
  ...overrides
});

interface TestComponentProps {
  initialAreas: IArea<AreaTypeValue>[];
  options?: Partial<IKarmycOptions>;
}

export const TestComponent: React.FC<TestComponentProps> = ({ initialAreas, options = {} }) => {
  return (
    <TestWrapper options={{ ...options, initialAreas }}>
      <Karmyc />
    </TestWrapper>
  );
}; 
