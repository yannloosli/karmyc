import React from 'react';
import { render, screen } from '@testing-library/react';
import { Karmyc } from '../../src/components/Karmyc';
import { KarmycProvider } from '../../src/providers/KarmycProvider';
import { useKarmyc } from '../../src/hooks/useKarmyc';
import { AreaRole } from '../../src/types/actions';
import { IArea } from '../../src/types/areaTypes';
import { IKarmycOptions } from '../../src/types/karmyc';

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const config = useKarmyc({});
  return <KarmycProvider options={config}>{children}</KarmycProvider>;
};

describe('Error Handling', () => {
  it('should handle invalid area type', () => {
    const config = useKarmyc({
      initialAreas: [
        { type: 'invalid-area', role: 'LEAD' as AreaRole }
      ]
    });

    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <KarmycProvider options={config}>
        <Karmyc />
      </KarmycProvider>
    );

    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('Invalid area type: invalid-area')
    );
    
    consoleError.mockRestore();
  });

  it('should handle invalid area role', () => {
    const config = useKarmyc({
      initialAreas: [
        { type: 'test-area', role: 'INVALID_ROLE' as AreaRole }
      ]
    });

    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <KarmycProvider options={config}>
        <Karmyc />
      </KarmycProvider>
    );

    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('Invalid area role: INVALID_ROLE')
    );
    
    consoleError.mockRestore();
  });

  it('should handle missing provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<Karmyc />);

    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('Karmyc must be used within a KarmycProvider')
    );
    
    consoleError.mockRestore();
  });

  it('should handle invalid layout configuration', () => {
    const config = useKarmyc({
      initialAreas: [
        { type: 'test-area', role: 'LEAD' as AreaRole }
      ],
      builtInLayouts: [
        {
          id: 'invalid-layout',
          name: 'Invalid Layout',
          config: {
            type: 'invalid-type',
            children: []
          }
        }
      ]
    });

    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <KarmycProvider options={config}>
        <Karmyc />
      </KarmycProvider>
    );

    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('Invalid layout type: invalid-type')
    );
    
    consoleError.mockRestore();
  });

  it('should handle duplicate area IDs', () => {
    const config = useKarmyc({
      initialAreas: [
        { type: 'test-area', role: 'LEAD' as AreaRole, id: 'duplicate-id' } as IArea,
        { type: 'test-area', role: 'FOLLOW' as AreaRole, id: 'duplicate-id' } as IArea
      ]
    });

    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <KarmycProvider options={config}>
        <Karmyc />
      </KarmycProvider>
    );

    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('Duplicate area ID: duplicate-id')
    );
    
    consoleError.mockRestore();
  });

  it('should handle invalid space configuration', () => {
    const config = useKarmyc({
      initialAreas: [
        { type: 'test-area', role: 'LEAD' as AreaRole }
      ],
      spaces: {
        'invalid-space': {
          id: 'invalid-space',
          name: 'Invalid Space',
          state: null // Invalid state
        }
      }
    } as IKarmycOptions);

    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <KarmycProvider options={config}>
        <Karmyc />
      </KarmycProvider>
    );

    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('Invalid space configuration')
    );
    
    consoleError.mockRestore();
  });
}); 
