import React from 'react';
import { render, act } from '@testing-library/react';
import { Karmyc } from '../../src/components/Karmyc';
import { KarmycProvider } from '../../src/providers/KarmycProvider';
import { useKarmyc } from '../../src/hooks/useKarmyc';
import { AreaRole } from '../../src/types/actions';
import { IKarmycOptions } from '../../src/types/karmyc';

// Fonction utilitaire pour générer des IDs uniques
let idCounter = 0;
export const generateUniqueId = () => `test-area-${idCounter++}`;

export const resetIdCounter = () => {
  idCounter = 0;
};

export const TestComponent: React.FC<{ 
  areas?: any[], 
  onConfigReady?: (config: any) => void,
  options?: IKarmycOptions 
}> = ({ areas = [], onConfigReady, options = {} }) => {
  const config = useKarmyc({
    initialAreas: areas,
    ...options
  });

  React.useEffect(() => {
    if (onConfigReady) {
      onConfigReady(config);
    }
  }, [config, onConfigReady]);

  return (
    <KarmycProvider options={config}>
      <Karmyc />
    </KarmycProvider>
  );
};

export const createGridAreas = (rows: number, cols: number) => {
  const gridRows = Array.from({ length: rows }, (_, rowIndex) => ({
    type: 'area_row' as const,
    id: `row-${rowIndex}`,
    orientation: 'horizontal' as const,
    areas: Array.from({ length: cols }, (_, colIndex) => ({
      id: `area-${rowIndex}-${colIndex}`,
      size: 1 / cols
    }))
  }));

  const rootRow = {
    type: 'area_row' as const,
    id: 'root-row',
    orientation: 'vertical' as const,
    areas: gridRows.map(row => ({
      id: row.id,
      size: 1 / rows
    }))
  };

  return {
    areas: [
      ...gridRows.flatMap(row => 
        row.areas.map(area => ({
          type: `test-area-${area.id}`,
          role: 'LEAD' as AreaRole,
          id: area.id
        }))
      ),
      ...gridRows.map(row => ({
        type: 'test-row',
        role: 'LEAD' as AreaRole,
        id: row.id
      })),
      {
        type: 'test-root',
        role: 'LEAD' as AreaRole,
        id: rootRow.id
      }
    ],
    layout: {
      rootRow,
      gridRows
    }
  };
};

export const measurePerformance = async (callback: () => Promise<void>) => {
  const startTime = performance.now();
  await callback();
  const endTime = performance.now();
  return endTime - startTime;
};

export const assertPerformance = (time: number, maxTime: number, operation: string) => {
  expect(time).toBeLessThan(maxTime);
  console.log(`${operation} took ${time.toFixed(2)}ms (max: ${maxTime}ms)`);
}; 
