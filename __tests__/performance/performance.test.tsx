import React from 'react';
import { render, screen } from '@testing-library/react';
import { Karmyc } from '../../src/components/Karmyc';
import { KarmycProvider } from '../../src/providers/KarmycProvider';
import { useKarmyc } from '../../src/hooks/useKarmyc';
import { AreaRole } from '../../src/types/actions';

describe('Karmyc Performance', () => {
  it('should handle large number of areas efficiently', () => {
    const areas = Array.from({ length: 50 }, (_, i) => ({
      type: `test-area-${i}`,
      role: 'LEAD' as AreaRole,
      state: { index: i }
    }));

    const config = useKarmyc({
      initialAreas: areas
    });

    const startTime = performance.now();
    
    render(
      <KarmycProvider options={config}>
        <Karmyc />
      </KarmycProvider>
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Rendering time should not exceed 500ms for 50 areas
    expect(renderTime).toBeLessThan(500);
  });

  it('should handle rapid state updates efficiently', () => {
    const config = useKarmyc({
      initialAreas: [
        { type: 'test-area', role: 'LEAD' as AreaRole }
      ]
    });

    const { rerender } = render(
      <KarmycProvider options={config}>
        <Karmyc />
      </KarmycProvider>
    );

    const startTime = performance.now();

    // Simulate 100 rapid state updates
    for (let i = 0; i < 100; i++) {
      const newConfig = useKarmyc({
        initialAreas: [
          { type: 'test-area', role: 'LEAD' as AreaRole, state: { update: i } }
        ]
      });
      rerender(
        <KarmycProvider options={newConfig}>
          <Karmyc />
        </KarmycProvider>
      );
    }

    const endTime = performance.now();
    const updateTime = endTime - startTime;

    // Update time should not exceed 1000ms for 100 updates
    expect(updateTime).toBeLessThan(1000);
  });

  it('should handle layout changes efficiently', () => {
    const config = useKarmyc({
      initialAreas: [
        { type: 'test-area-1', role: 'LEAD' as AreaRole },
        { type: 'test-area-2', role: 'FOLLOW' as AreaRole }
      ]
    });

    const { rerender } = render(
      <KarmycProvider options={config}>
        <Karmyc />
      </KarmycProvider>
    );

    const startTime = performance.now();

    // Simulate 50 layout changes
    for (let i = 0; i < 50; i++) {
      const newConfig = useKarmyc({
        initialAreas: [
          { type: 'test-area-1', role: 'LEAD' as AreaRole, position: { x: i, y: i } },
          { type: 'test-area-2', role: 'FOLLOW' as AreaRole, position: { x: i + 1, y: i + 1 } }
        ]
      });
      rerender(
        <KarmycProvider options={newConfig}>
          <Karmyc />
        </KarmycProvider>
      );
    }

    const endTime = performance.now();
    const layoutChangeTime = endTime - startTime;

    // Layout change time should not exceed 500ms for 50 changes
    expect(layoutChangeTime).toBeLessThan(500);
  });
}); 
