import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { Karmyc } from '../../src/components/Karmyc';
import { KarmycProvider } from '../../src/providers/KarmycProvider';
import { useKarmyc } from '../../src/hooks/useKarmyc';
import { IKarmycOptions } from '../../src/types/karmyc';
import { useKarmycStore } from '../../src/store/areaStore';

export const TestComponent: React.FC<{ 
  options?: IKarmycOptions, 
  onError?: (err: Error) => void 
}> = ({ options = {}, onError }) => {
  const config = useKarmyc(options);
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((err: Error) => {
    console.error('[KarmycInitializer] Error during initialization:', err);
    setError(err);
    if (onError) {
      onError(err);
    }
  }, [onError]);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return (
    <KarmycProvider options={config} onError={handleError}>
      <Karmyc />
    </KarmycProvider>
  );
};

export const setupErrorTest = () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const onError = jest.fn();

  const cleanup = () => {
    consoleError.mockRestore();
    consoleWarn.mockRestore();
  };

  return {
    consoleError,
    consoleWarn,
    onError,
    cleanup
  };
};

export const resetKarmycStore = () => {
  act(() => {
    useKarmycStore.setState({
      screens: {},
      activeScreenId: 'main',
      options: {
        keyboardShortcutsEnabled: true,
        builtInLayouts: [],
        validators: []
      }
    });
  });
};

export const waitForInitialization = async () => {
  await act(async () => {
    jest.runAllTimers();
  });
};

export const assertErrorLogged = (consoleSpy: jest.SpyInstance, expectedMessage: string) => {
  expect(consoleSpy).toHaveBeenCalledWith(
    expect.stringContaining(expectedMessage),
    expect.any(Error)
  );
}; 
