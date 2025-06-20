import React from 'react';
import { render, act } from '@testing-library/react';
import { AreaRole, IKarmycOptions } from '../../src/core/types/karmyc';
import { 
  TestComponent, 
  generateUniqueId, 
  resetIdCounter,
  measurePerformance,
  assertPerformance
} from '../__mocks__/performanceTestUtils';

describe('Karmyc Performance', () => {
  beforeEach(() => {
    resetIdCounter();
  });

  it('should handle large number of areas efficiently', async () => {
    const areas = Array.from({ length: 50 }, (_, i) => ({
      id: generateUniqueId(),
      type: `test-area-${i}`,
      role: 'LEAD' as AreaRole,
      state: { index: i }
    }));

    let config: IKarmycOptions;
    const handleConfigReady = (newConfig: any) => {
      config = newConfig;
      console.log('config', config);
    };

    const renderTime = await measurePerformance(async () => {
      await act(async () => {
        render(
          <TestComponent areas={areas} onConfigReady={handleConfigReady} />
        );
      });
    });

    assertPerformance(renderTime, 1000, 'Rendering 50 areas');
  }, 10000);

  it('should handle rapid state updates efficiently', async () => {
    const initialAreas = [
      { id: generateUniqueId(), type: 'test-area', role: 'LEAD' as AreaRole }
    ];

    const { rerender } = await act(async () => {
      return render(
        <TestComponent areas={initialAreas} onConfigReady={() => {}} />
      );
    });

    const updateTime = await measurePerformance(async () => {
      // Simulate 100 rapid state updates
      for (let i = 0; i < 100; i++) {
        const updatedAreas = [
          { id: generateUniqueId(), type: 'test-area', role: 'LEAD' as AreaRole, state: { update: i } }
        ];
        await act(async () => {
          rerender(
            <TestComponent areas={updatedAreas} onConfigReady={() => {}} />
          );
        });
      }
    });

    assertPerformance(updateTime, 3000, '100 state updates');
  }, 15000);

  it('should handle layout changes efficiently', async () => {
    const initialAreas = [
      { id: generateUniqueId(), type: 'test-area-1', role: 'LEAD' as AreaRole },
      { id: generateUniqueId(), type: 'test-area-2', role: 'FOLLOW' as AreaRole }
    ];

    const { rerender } = await act(async () => {
      return render(
        <TestComponent areas={initialAreas} onConfigReady={() => {}} />
      );
    });

    const layoutChangeTime = await measurePerformance(async () => {
      // Simulate 50 layout changes
      for (let i = 0; i < 50; i++) {
        const updatedAreas = [
          { id: generateUniqueId(), type: 'test-area-1', role: 'LEAD' as AreaRole, position: { x: i, y: i } },
          { id: generateUniqueId(), type: 'test-area-2', role: 'FOLLOW' as AreaRole, position: { x: i + 1, y: i + 1 } }
        ];
        await act(async () => {
          rerender(
            <TestComponent areas={updatedAreas} onConfigReady={() => {}} />
          );
        });
      }
    });

    assertPerformance(layoutChangeTime, 2000, '50 layout changes');
  }, 12000);
}); 
