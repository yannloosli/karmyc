import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Configure testing-library pour utiliser les nouvelles APIs React 18
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 1000,
});
