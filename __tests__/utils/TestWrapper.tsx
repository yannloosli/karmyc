import React, { useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { KarmycCoreProvider } from '../../src/core/KarmycCoreProvider';
import { IKarmycOptions } from '../../src/core/types/karmyc';
import { useKarmycStore } from '../../src/core/store';
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
      // Initialiser le store seulement une fois
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
            }
          }
        },
        activeScreenId: '1',
        options: { ...defaultOptions, ...options }
      });
      isInitialized.current = true;
    }

    if (containerRef.current && !rootRef.current) {
      rootRef.current = createRoot(containerRef.current);
    }

    if (rootRef.current) {
      rootRef.current.render(
        <KarmycCoreProvider options={{ ...defaultOptions, ...options }}>
          {children}
        </KarmycCoreProvider>
      );
    }

    return () => {
      if (rootRef.current) {
        // Utiliser requestAnimationFrame pour s'assurer que le démontage se fait après le rendu
        requestAnimationFrame(() => {
          rootRef.current?.unmount();
          rootRef.current = null;
        });
      }
    };
  }, [children, options]);

  return <div ref={containerRef} />;
}; 
