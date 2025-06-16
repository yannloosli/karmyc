import { render, act } from '@testing-library/react';
import { 
  TestComponent, 
  createGridAreas,
  measurePerformance,
  assertPerformance
} from '../__mocks__/performanceTestUtils';

describe('Karmyc Performance', () => {
  it('should render many areas efficiently', async () => {
    const { areas } = createGridAreas(5, 5);

    const areaList = Object.values(areas).map(a => ({ ...a, type: 'test-area' }));

    const renderTime = await measurePerformance(async () => {
      await act(async () => {
        render(<TestComponent areas={areaList} />);
      });
    });

    assertPerformance(renderTime, 1000, 'Rendering 25 areas grid');
  });

  it('should handle state updates efficiently', async () => {
    const { areas } = createGridAreas(2, 2);

    const areaList = Object.values(areas).map(a => ({ ...a, type: 'test-area' }));

    let rerender: any;
    await act(async () => {
      const result = render(<TestComponent areas={areaList} />);
      rerender = result.rerender;
    });

    const updateTime = await measurePerformance(async () => {
      // Simulate 100 state updates
      for (let i = 0; i < 100; i++) {
        await act(async () => {
          rerender(<TestComponent areas={areaList} />);
        });
      }
    });

    const averageUpdateTime = updateTime / 100;
    assertPerformance(averageUpdateTime, 10, 'Average state update');
  });
}); 
