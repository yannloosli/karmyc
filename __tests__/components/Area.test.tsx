import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Area } from '../../src/components/Area';
import { KarmycProvider } from '../../src/providers/KarmycProvider';
import { useKarmyc } from '../../src/hooks/useKarmyc';
import { AREA_ROLE } from '../../src/types/actions';
import { ResizePreviewState } from '../../src/types/areaTypes';

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const config = useKarmyc({
    initialAreas: [
      { type: 'test-area', role: AREA_ROLE.LEAD }
    ]
  });
  return <KarmycProvider options={config}>{children}</KarmycProvider>;
};

const TestAreaComponent: React.FC<{ id: string; viewport: { left: number; top: number; width: number; height: number } }> = ({ id, viewport }) => {
  const [resizePreview, setResizePreview] = useState<ResizePreviewState | null>(null);
  
  return (
    <Area
      id={id}
      viewport={viewport}
      setResizePreview={setResizePreview}
    />
  );
};

describe('Area Component', () => {
  it('should render with correct props', () => {
    render(
      <TestWrapper>
        <TestAreaComponent
          id="test-area-1"
          viewport={{ left: 0, top: 0, width: 100, height: 100 }}
        />
      </TestWrapper>
    );

    const area = screen.getByTestId('area-test-area-1');
    expect(area).toBeInTheDocument();
  });

  it('should handle resize preview state', async () => {
    render(
      <TestWrapper>
        <TestAreaComponent
          id="test-area-1"
          viewport={{ left: 0, top: 0, width: 100, height: 100 }}
        />
      </TestWrapper>
    );

    const corner = screen.getByTestId('area-corner-ne');
    fireEvent.mouseDown(corner);
    
    await waitFor(() => {
      const area = screen.getByTestId('area-test-area-1');
      expect(area).toHaveClass('area--resizing');
    });
  });

  it('should handle viewport changes', () => {
    const viewport = { left: 0, top: 0, width: 100, height: 100 };
    
    const { rerender } = render(
      <TestWrapper>
        <TestAreaComponent
          id="test-area-1"
          viewport={viewport}
        />
      </TestWrapper>
    );

    const newViewport = { ...viewport, width: 200 };
    rerender(
      <TestWrapper>
        <TestAreaComponent
          id="test-area-1"
          viewport={newViewport}
        />
      </TestWrapper>
    );

    const area = screen.getByTestId('area-test-area-1');
    expect(area).toHaveStyle({ width: '200px' });
  });

  it('should handle area activation', async () => {
    render(
      <TestWrapper>
        <TestAreaComponent
          id="test-area-1"
          viewport={{ left: 0, top: 0, width: 100, height: 100 }}
        />
      </TestWrapper>
    );

    const area = screen.getByTestId('area-test-area-1');
    fireEvent.click(area);
    
    await waitFor(() => {
      expect(area).toHaveClass('area--active');
    });
  });
}); 
