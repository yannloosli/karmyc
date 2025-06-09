import React from 'react';
import { KarmycProvider } from '../../src/providers/KarmycProvider';
import { IKarmycOptions } from '../../src/types/karmyc';

interface TestWrapperProps {
  children: React.ReactNode;
  options?: Partial<IKarmycOptions>;
}

const defaultOptions: IKarmycOptions = {
  keyboardShortcutsEnabled: true,
  builtInLayouts: [],
  validators: [],
  initialAreas: [],
  initialLayout: undefined
};

export const TestWrapper: React.FC<TestWrapperProps> = ({ children, options = {} }) => {
  return (
    <KarmycProvider options={{ ...defaultOptions, ...options }}>
      {children}
    </KarmycProvider>
  );
}; 
