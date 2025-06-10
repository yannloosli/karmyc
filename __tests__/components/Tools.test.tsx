import React from 'react';
import { render, screen } from '@testing-library/react';
import { Tools } from '../../src/components/ToolsSlot';
import { useKarmycStore } from '../../src/store/areaStore';
import { createMockStore, createTestViewport } from '../__mocks__/testWrappers';

// Mock the store
jest.mock('../../src/store/areaStore', () => ({
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

  it('should handle fullscreen mode', () => {
    (useKarmycStore as unknown as jest.Mock).mockImplementation((selector) => {
      return selector(createMockStore({
        screens: {
          'screen-1': {
            isDetached: false,
            areas: {
              areas: {
                'test-area': {
                  enableFullscreen: true
                }
              }
            }
          }
        }
      }));
    });

    render(
      <Tools areaId="test-area">
        <button>Test Button</button>
      </Tools>
    );

    const tools = screen.getByTestId('tools-container');
    expect(tools).toHaveStyle({ height: 'calc(100%)' });
  });

  it('should handle detached mode', () => {
    (useKarmycStore as unknown as jest.Mock).mockImplementation((selector) => {
      return selector(createMockStore({
        screens: {
          'screen-1': {
            isDetached: true,
            areas: {
              areas: {}
            }
          }
        }
      }));
    });

    render(
      <Tools>
        <button>Test Button</button>
      </Tools>
    );

    const tools = screen.getByTestId('tools-container');
    expect(tools).toHaveStyle({ height: '100%' });
  });
}); 
