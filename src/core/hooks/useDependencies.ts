import { useCallback, useMemo } from 'react';
import { selectAreasWithDependencies } from '../store/selectors/complex';
import { AreaWithMetadata } from '../types/store';
import { useAppSelector } from './index';

export function useDependencies() {
  const areasWithDeps = useAppSelector(selectAreasWithDependencies);

  const getDependencies = useCallback((areaId: string) => {
    return areasWithDeps.find((area: AreaWithMetadata) => area.id === areaId)?.dependencies || [];
  }, [areasWithDeps]);

  const getDependents = useCallback((areaId: string) => {
    return areasWithDeps.filter((area: AreaWithMetadata) => 
      area.dependencies?.some((dep: { id: string; name: string }) => dep.id === areaId)
    );
  }, [areasWithDeps]);

  const dependencyGraph = useMemo(() => {
    const graph: Record<string, string[]> = {};
    
    areasWithDeps.forEach((area: AreaWithMetadata) => {
      graph[area.id] = area.dependencies?.map((dep: { id: string; name: string }) => dep.id) || [];
    });

    return graph;
  }, [areasWithDeps]);

  const hasCircularDependencies = useCallback((areaId: string) => {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    function hasCycle(nodeId: string): boolean {
      if (!visited.has(nodeId)) {
        visited.add(nodeId);
        recursionStack.add(nodeId);

        const dependencies = getDependencies(nodeId);
        for (const depId of dependencies) {
          if (!visited.has(depId) && hasCycle(depId)) {
            return true;
          } else if (recursionStack.has(depId)) {
            return true;
          }
        }
      }

      recursionStack.delete(nodeId);
      return false;
    }

    return hasCycle(areaId);
  }, [getDependencies]);

  return {
    getDependencies,
    getDependents,
    dependencyGraph,
    hasCircularDependencies,
  };
} 
