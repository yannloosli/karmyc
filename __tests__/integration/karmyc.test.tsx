import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Karmyc } from '../../src/components/Karmyc';
import { KarmycProvider } from '../../src/providers/KarmycProvider';
import { useKarmyc } from '../../src/hooks/useKarmyc';
import { AreaRole } from '../../src/types/actions';

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const config = useKarmyc({
    initialAreas: [
      { type: 'test-area', role: 'LEAD' as AreaRole }
    ]
  });
  return <KarmycProvider options={config}>{children}</KarmycProvider>;
};

describe('Karmyc Integration', () => {
  it('should handle area interactions', async () => {
    render(
      <TestWrapper>
        <Karmyc />
      </TestWrapper>
    );

    // Test area rendering
    const area = screen.getByTestId('area-test-area');
    expect(area).toBeInTheDocument();

    // Test area interactions
    fireEvent.mouseDown(area);
    fireEvent.mouseMove(area, { clientX: 100, clientY: 100 });
    fireEvent.mouseUp(area);

    // Check that the state has been updated
    await waitFor(() => {
      expect(area).toHaveStyle({ transform: 'translate(100px, 100px)' });
    });
  });

  it('should handle multiple areas', () => {
    const config = useKarmyc({
      initialAreas: [
        { type: 'test-area-1', role: 'LEAD' as AreaRole },
        { type: 'test-area-2', role: 'FOLLOW' as AreaRole }
      ]
    });

    render(
      <KarmycProvider options={config}>
        <Karmyc />
      </KarmycProvider>
    );

    const area1 = screen.getByTestId('area-test-area-1');
    const area2 = screen.getByTestId('area-test-area-2');

    expect(area1).toBeInTheDocument();
    expect(area2).toBeInTheDocument();
  });

  it('should handle area resizing', async () => {
    const config = useKarmyc({
      initialAreas: [
        { type: 'test-area', role: 'LEAD' as AreaRole }
      ],
      resizableAreas: true
    });

    render(
      <KarmycProvider options={config}>
        <Karmyc />
      </KarmycProvider>
    );

    const area = screen.getByTestId('area-test-area');
    const resizeHandle = screen.getByTestId('area-resize-handle');

    fireEvent.mouseDown(resizeHandle);
    fireEvent.mouseMove(resizeHandle, { clientX: 200, clientY: 200 });
    fireEvent.mouseUp(resizeHandle);

    await waitFor(() => {
      expect(area).toHaveStyle({ width: '200px', height: '200px' });
    });
  });

  it('should handle area role changes', async () => {
    const config = useKarmyc({
      initialAreas: [
        { type: 'test-area', role: 'LEAD' as AreaRole }
      ]
    });

    render(
      <KarmycProvider options={config}>
        <Karmyc />
      </KarmycProvider>
    );

    const area = screen.getByTestId('area-test-area');
    const roleButton = screen.getByTestId('area-role-button');

    fireEvent.click(roleButton);
    const followOption = screen.getByText('FOLLOW');
    fireEvent.click(followOption);

    await waitFor(() => {
      expect(area).toHaveAttribute('data-role', 'FOLLOW');
    });
  });

  it('should handle keyboard shortcuts', async () => {
    const config = useKarmyc({
      initialAreas: [
        { type: 'test-area', role: 'LEAD' as AreaRole }
      ],
      keyboardShortcutsEnabled: true
    });

    render(
      <KarmycProvider options={config}>
        <Karmyc />
      </KarmycProvider>
    );

    const area = screen.getByTestId('area-test-area');
    fireEvent.keyDown(area, { key: 'Delete', code: 'Delete' });

    await waitFor(() => {
      expect(area).not.toBeInTheDocument();
    });
  });

  it('should handle space switching', async () => {
    const config = useKarmyc({
      initialAreas: [
        { type: 'test-area', role: 'LEAD' as AreaRole }
      ]
    });

    render(
      <KarmycProvider options={config}>
        <Karmyc />
      </KarmycProvider>
    );

    const spaceButton = screen.getByTestId('space-switch-button');
    fireEvent.click(spaceButton);
    const newSpaceOption = screen.getByText('New Space');
    fireEvent.click(newSpaceOption);

    await waitFor(() => {
      const newSpace = screen.getByTestId('space-new-space');
      expect(newSpace).toBeInTheDocument();
    });
  });
}); 
