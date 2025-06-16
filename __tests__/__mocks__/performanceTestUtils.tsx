import React from 'react';
import { Karmyc } from '../../src/components/Karmyc';
import { KarmycCoreProvider } from '../../src/core/KarmycCoreProvider';
import { useKarmyc } from '../../src/hooks/useKarmyc';
import { AREA_ROLE } from '../../src/core/types/actions';
import { IKarmycOptions } from '../../src/core/types/karmyc';
import { areaRegistry } from '../../src/core/registries/areaRegistry';
import { useToolsSlot } from '../../src/components/ToolsSlot';

// Composant de test pour les barres d'outils
const TestToolbarComponent: React.FC = () => {
  return <div>Test Toolbar</div>;
};

// Enregistrer les types de zones de test
const registerTestArea = (type: string, role: typeof AREA_ROLE[keyof typeof AREA_ROLE]) => {
  areaRegistry.registerDisplayName(type, `Test ${type}`);
  areaRegistry.registerInitialState(type, { test: true });
  areaRegistry.registerSupportedActions(type, [role]);
};

registerTestArea('test-area-1', AREA_ROLE.LEAD);
registerTestArea('test-area-2', AREA_ROLE.FOLLOW);
registerTestArea('test-row', AREA_ROLE.LEAD);
registerTestArea('test-root', AREA_ROLE.LEAD);

// Enregistrer les outils une seule fois au démarrage
const registerTestTools = () => {
  const tools = useToolsSlot('test-root', 'bottom-outer');
  React.useEffect(() => {
    tools.registerComponent(TestToolbarComponent, { name: 'test-toolbar', type: 'test' });
  }, []);
};

// Composant de test qui enregistre les outils
const TestAreaWithTools: React.FC<{ id: string; type: string }> = React.memo(({ id, type }) => {
  const tools = useToolsSlot(type, 'bottom-outer');
  const componentRef = React.useRef<{ name: string; type: string }>({ name: 'test-toolbar', type: 'test' });
  
  React.useEffect(() => {
    tools.registerComponent(TestToolbarComponent, componentRef.current);
  }, [tools]);

  return null;
});

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
}> = React.memo(({ areas = [], onConfigReady, options = {} }) => {
  const config = useKarmyc({
    initialAreas: areas,
    ...options
  });

  React.useEffect(() => {
    if (onConfigReady) {
      onConfigReady(config);
    }
  }, [config, onConfigReady]);

  const toolsComponents = React.useMemo(() => 
    areas.map(area => (
      <TestAreaWithTools key={area.id} id={area.id} type={area.type} />
    )),
    [areas]
  );

  return (
    <KarmycCoreProvider options={config}>
      <Karmyc />
      {toolsComponents}
    </KarmycCoreProvider>
  );
});

export const createGridAreas = (rows: number, cols: number) => {
  // Génération des ids pour chaque cellule
  const areaIds = Array.from({ length: rows * cols }, (_, i) => `area-${i + 1}`);

  // Création du mapping des areas
  const areas: Record<string, any> = {};
  areaIds.forEach((id) => {
    areas[id] = {
      id,
      type: 'test-area',
      state: { test: true },
      role: AREA_ROLE.LEAD
    };
  });

  // Création du layout imbriqué (root -> lignes -> cellules)
  const layout: Record<string, any> = {};

  // Racine verticale (chaque ligne est une area_row horizontale)
  layout['root'] = {
    id: 'root',
    type: 'area_row',
    orientation: 'vertical',
    areas: Array.from({ length: rows }, (_, rowIdx) => ({
      id: `row-${rowIdx + 1}`,
      size: 1 / rows
    }))
  };

  // Pour chaque ligne, créer une area_row horizontale
  for (let rowIdx = 0; rowIdx < rows; rowIdx++) {
    layout[`row-${rowIdx + 1}`] = {
      id: `row-${rowIdx + 1}`,
      type: 'area_row',
      orientation: 'horizontal',
      areas: Array.from({ length: cols }, (_, colIdx) => ({
        id: areaIds[rowIdx * cols + colIdx],
        size: 1 / cols
      }))
    };
  }

  // Chaque cellule est une area simple
  areaIds.forEach((id) => {
    layout[id] = {
      type: 'area',
      id
    };
  });

  return {
    areas,
    layout
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
