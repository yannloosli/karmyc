import React from 'react';
import { render, screen } from '@testing-library/react';
import { KarmycProvider } from '../KarmycProvider';
import { useKarmyc } from '../../hooks/useKarmyc';
import { AreaRole } from '../../types';

// Mock du hook useKarmyc
jest.mock('../../hooks/useKarmyc');

describe('KarmycProvider', () => {
  const mockConfig = {
    initialAreas: [
      { type: 'test-area', state: {}, role: 'LEAD' as AreaRole }
    ]
  };

  beforeEach(() => {
    (useKarmyc as jest.Mock).mockReturnValue(mockConfig);
  });

  it('devrait rendre les enfants correctement', () => {
    const TestComponent = () => <div data-testid="test-child">Test Child</div>;

    render(
      <KarmycProvider options={mockConfig}>
        <TestComponent />
      </KarmycProvider>
    );

    expect(screen.getByTestId('test-child')).toBeInTheDocument();
  });

  it('devrait initialiser le contexte avec les options fournies', () => {
    render(
      <KarmycProvider options={mockConfig}>
        <div>Test</div>
      </KarmycProvider>
    );

    expect(useKarmyc).toHaveBeenCalledWith(mockConfig);
  });
}); 
