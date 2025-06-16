import React from 'react';
import { act } from '@testing-library/react';
import { Karmyc } from '../../src/components/Karmyc';
import { KarmycCoreProvider } from '../../src/core/KarmycCoreProvider';
import { useKarmyc } from '../../src/hooks/useKarmyc';
import { IKarmycOptions } from '../../src/core/types/karmyc';
import { useKarmycStore } from '../../src/core/store';

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
    <KarmycCoreProvider options={config} onError={handleError}>
      <Karmyc />
    </KarmycCoreProvider>
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
      activeScreenId: '1',
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
