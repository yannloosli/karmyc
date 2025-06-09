import React from 'react';
import { render, screen } from '@testing-library/react';
import { Tools } from '../../src/components/ToolsSlot';
import { useKarmycStore } from '../../src/store/areaStore';

// Mock the store
jest.mock('../../src/store/areaStore', () => ({
  useKarmycStore: jest.fn()
}));

describe('Tools Component', () => {
  beforeEach(() => {
    // Mock default store values
    (useKarmycStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        activeScreenId: 'screen-1',
        screens: {
          'screen-1': {
            isDetached: false,
            areas: {
              areas: {}
            }
          }
        },
        options: {
          multiScreen: false
        }
      };
      return selector(state);
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

  it('should handle viewport changes', () => {
    const viewport = {
      top: 0,
      left: 0,
      width: 100,
      height: 100
    };

    render(
      <Tools viewport={viewport}>
        <button>Test Button</button>
      </Tools>
    );

    const tools = screen.getByTestId('tools-container');
    expect(tools).toHaveStyle({
      top: '0px',
      left: '0px',
      height: 'calc(100px)'
    });
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

  it('should handle custom styles', () => {
    const customStyle = {
      backgroundColor: 'red',
      padding: '10px'
    };

    render(
      <Tools style={customStyle}>
        <button>Test Button</button>
      </Tools>
    );

    const tools = screen.getByTestId('tools-container');
    expect(tools).toHaveStyle(customStyle);
  });

  it('should handle fullscreen mode', () => {
    (useKarmycStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        activeScreenId: 'screen-1',
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
        },
        options: {
          multiScreen: false
        }
      };
      return selector(state);
    });

    render(
      <Tools areaId="test-area">
        <button>Test Button</button>
      </Tools>
    );

    const tools = screen.getByTestId('tools-container');
    expect(tools).toHaveStyle({ height: '100%' });
  });

  it('should handle detached mode', () => {
    (useKarmycStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        activeScreenId: 'screen-1',
        screens: {
          'screen-1': {
            isDetached: true,
            areas: {
              areas: {}
            }
          }
        },
        options: {
          multiScreen: false
        }
      };
      return selector(state);
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
