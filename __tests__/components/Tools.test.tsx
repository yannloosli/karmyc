import { render, screen } from '@testing-library/react';
import { Tools } from '../../src/components/ToolsSlot';
import { useKarmycStore } from '../../src/core/store';
import { createMockStore } from '../__mocks__/testWrappers';

// Mock the store
jest.mock('../../src/core/store', () => ({
  useKarmycStore: jest.fn()
}));

describe('Tools Component', () => {
  beforeEach(() => {
    // Mock default store values
    (useKarmycStore as unknown as jest.Mock).mockImplementation((selector) => {
      return selector(createMockStore());
    });
  });

  it('should render with default props', () => {
    render(
      <Tools>
        <button>Test Button</button>
      </Tools>
    );

    const tools = screen.getByTestId('tools-container');
    expect(tools).toBeInTheDocument();
  });

  it('should handle area state', () => {
    const areaState = { test: 'value' };
    render(
      <Tools areaState={areaState}>
        <button>Test Button</button>
      </Tools>
    );

    const tools = screen.getByTestId('tools-container');
    expect(tools).toBeInTheDocument();
  });

  it('should handle area ID', () => {
    render(
      <Tools areaId="test-area">
        <button>Test Button</button>
      </Tools>
    );

    const tools = screen.getByTestId('tools-container');
    expect(tools).toBeInTheDocument();
  });
});
