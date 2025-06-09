import { render, screen, waitFor } from '@testing-library/react';
import { Karmyc } from '../Karmyc';
import { KarmycProvider } from '../../providers/KarmycProvider';
import { KarmycInitializer } from '../../providers/KarmycInitializer';
import { areaRegistry } from '../../store/registries/areaRegistry';
import { CircleSlash } from 'lucide-react';
import { useKarmycStore } from '../../store/areaStore';
import { IKarmycOptions } from '../../types/karmyc';
import { AreaRowLayout } from '../../types/areaTypes';
import { useArea } from '../../hooks/useArea';

// Mock KarmycInitializer
jest.mock('../../providers/KarmycInitializer', () => ({
  KarmycInitializer: ({ options }: { options: IKarmycOptions }) => {
    const { createArea } = useArea();
    const store = useKarmycStore.getState();
    const activeScreenId = store.activeScreenId;
    const activeScreenAreasState = store.screens[activeScreenId]?.areas;

    if (!activeScreenAreasState?.rootId && options.initialAreas && options.initialAreas.length > 0) {
      const newAreaIds = options.initialAreas.map(areaConfig => {
        const newId = createArea(areaConfig.type, areaConfig.state);
        return newId;
      });

      if (newAreaIds.length > 0) {
        const defaultRowLayout: AreaRowLayout = {
          id: 'root',
          type: 'area_row',
          orientation: 'horizontal',
          areas: newAreaIds.map(areaId => ({ id: areaId, size: 1 / newAreaIds.length }))
        };

        useKarmycStore.setState(state => {
          if (!state.screens[state.activeScreenId]?.areas) {
            console.error(`[KarmycInitializer] Active screen areas ${state.activeScreenId} not found during layout update.`);
            return state;
          }

          const newLayoutMap = {
            ...(state.screens[state.activeScreenId].areas.layout || {}),
            ['root']: defaultRowLayout,
            ...newAreaIds.reduce((acc: Record<string, AreaRowLayout | { type: 'area'; id: string }>, id: string) => {
              acc[id] = { type: 'area', id };
              return acc;
            }, {})
          };

          state.screens[state.activeScreenId].areas.rootId = 'root';
          state.screens[state.activeScreenId].areas.layout = newLayoutMap;

          return state;
        }, false, 'KarmycInitializer/setDefaultLayout');
      }
    }
    return null;
  }
}));

// Composant de test simple
const TestArea = () => <div data-areatype="test-area">Test Area</div>;

describe('Karmyc', () => {
  // Enregistrer le composant test-area
  beforeAll(() => {
    areaRegistry.registerComponent('test-area', TestArea);
    areaRegistry.registerIcon('test-area', CircleSlash);
    areaRegistry.registerDisplayName('test-area', 'Test Area');
  });

  const defaultConfig = {
    initialAreas: [
      { type: 'test-area', state: { content: 'test' } },
    ],
    builtInLayouts: [],
    initialLayout: undefined,
  };

  it('should render with initial areas', async () => {
    const { container } = render(
      <KarmycProvider options={defaultConfig}>
        <KarmycInitializer options={defaultConfig} />
        <Karmyc />
      </KarmycProvider>
    );

    await waitFor(() => {
      expect(container.querySelector('[data-areatype="test-area"]')).toBeInTheDocument();
    });
  });

  it('should render with empty layout', () => {
    const emptyConfig = {
      initialAreas: [],
      builtInLayouts: [],
      initialLayout: undefined,
    };

    const { container } = render(
      <KarmycProvider options={emptyConfig}>
        <KarmycInitializer options={emptyConfig} />
        <Karmyc />
      </KarmycProvider>
    );

    expect(container.querySelector('[data-areatype="test-area"]')).not.toBeInTheDocument();
  });
}); 
