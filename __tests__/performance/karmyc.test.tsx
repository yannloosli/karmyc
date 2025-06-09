import React from 'react';
import { render } from '@testing-library/react';
import { Karmyc } from '../../src/components/Karmyc';
import { KarmycProvider } from '../../src/providers/KarmycProvider';
import { useKarmyc } from '../../src/hooks/useKarmyc';
import { AreaRole } from '../../src/types/area';

describe('Karmyc Performance', () => {
  it('should render many areas efficiently', () => {
    const startTime = performance.now();

    const config = useKarmyc({
      initialAreas: Array.from({ length: 50 }, (_, i) => ({
        type: `test-area-${i}`,
        role: 'LEAD' as AreaRole
      }))
    });

    render(
      <KarmycProvider options={config}>
        <Karmyc />
      </KarmycProvider>
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Rendering time should not exceed 1000ms
    expect(renderTime).toBeLessThan(1000);
  });

  it('should handle state updates efficiently', () => {
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

    // Simulate 100 state updates
    for (let i = 0; i < 100; i++) {
      rerender(
        <KarmycProvider options={config}>
          <Karmyc />
        </KarmycProvider>
      );
    }

    const endTime = performance.now();
    const updateTime = endTime - startTime;

    // Average update time should not exceed 10ms
    expect(updateTime / 100).toBeLessThan(10);
  });
}); 
