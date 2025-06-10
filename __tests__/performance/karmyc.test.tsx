import React from 'react';
import { render, act } from '@testing-library/react';
import { AreaRole } from '../../src/types/actions';
import { 
  TestComponent, 
  createGridAreas,
  measurePerformance,
  assertPerformance
} from '../__mocks__/performanceTestUtils';

describe('Karmyc Performance', () => {
  it('should render many areas efficiently', async () => {
    const { areas } = createGridAreas(5, 5);

    const renderTime = await measurePerformance(async () => {
      await act(async () => {
        render(<TestComponent areas={areas} />);
      });
    });

    assertPerformance(renderTime, 1000, 'Rendering 25 areas grid');
  });

  it('should handle state updates efficiently', async () => {
    const { areas } = createGridAreas(2, 2);

    let rerender: any;
    await act(async () => {
      const result = render(<TestComponent areas={areas} />);
      rerender = result.rerender;
    });

    const updateTime = await measurePerformance(async () => {
      // Simulate 100 state updates
      for (let i = 0; i < 100; i++) {
        await act(async () => {
          rerender(<TestComponent areas={areas} />);
        });
      }
    });

    const averageUpdateTime = updateTime / 100;
    assertPerformance(averageUpdateTime, 10, 'Average state update');
  });
}); 
