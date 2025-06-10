import React, { useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { KarmycProvider } from '../../src/providers/KarmycProvider';
import { IKarmycOptions } from '../../src/types/karmyc';
import { useKarmycStore } from '../../src/store/areaStore';

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
          'main': {
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
        activeScreenId: 'main',
        options: { ...defaultOptions, ...options }
      });
      isInitialized.current = true;
    }

    if (containerRef.current && !rootRef.current) {
      rootRef.current = createRoot(containerRef.current);
    }

    if (rootRef.current) {
      rootRef.current.render(
        <KarmycProvider options={{ ...defaultOptions, ...options }}>
          {children}
        </KarmycProvider>
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
