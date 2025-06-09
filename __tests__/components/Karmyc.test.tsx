import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Karmyc } from '../../src/components/Karmyc';
import { KarmycProvider } from '../../src/providers/KarmycProvider';
import { useKarmyc } from '../../src/hooks/useKarmyc';
import { useKarmycStore } from '../../src/store/areaStore';

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const config = useKarmyc({});
  return <KarmycProvider options={config}>{children}</KarmycProvider>;
};

describe('Karmyc Component', () => {
  beforeEach(() => {
    // Reset store before each test
    useKarmycStore.setState({
      screens: {},
      activeScreenId: 'main',
      options: {
        keyboardShortcutsEnabled: true,
        builtInLayouts: [],
        validators: []
      }
    });
  });

  it('should render without crashing', async () => {
    render(
      <TestWrapper>
        <Karmyc />
      </TestWrapper>
    );
    
    await waitFor(() => {
      const areaRoot = document.querySelector('.area-root');
      expect(areaRoot).toBeInTheDocument();
    });
  });

  it('should render with initial areas', async () => {
    const config = useKarmyc({
      initialAreas: [
        { id: 'test-area-1', type: 'test-area', role: 'LEAD' }
      ]
    });

    render(
      <KarmycProvider options={config}>
        <Karmyc />
      </KarmycProvider>
    );

    await waitFor(() => {
      const state = useKarmycStore.getState();
      const activeScreenAreas = state.screens['main'].areas;
      expect(activeScreenAreas.areas['test-area-1']).toBeDefined();
      expect(activeScreenAreas.areas['test-area-1'].role).toBe('LEAD');
    });
  });

  it('should handle empty initial areas', async () => {
    const config = useKarmyc({
      initialAreas: []
    });

    render(
      <KarmycProvider options={config}>
        <Karmyc />
      </KarmycProvider>
    );

    await waitFor(() => {
      const state = useKarmycStore.getState();
      const activeScreenAreas = state.screens['main'].areas;
      expect(Object.keys(activeScreenAreas.areas)).toHaveLength(0);
    });
  });

  it('should handle invalid area configuration', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    const config = useKarmyc({
      initialAreas: [
        { type: 'invalid-area' } as any
      ]
    });

    render(
      <KarmycProvider options={config}>
        <Karmyc />
      </KarmycProvider>
    );

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });
}); 
