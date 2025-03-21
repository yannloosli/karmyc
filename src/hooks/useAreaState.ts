import { useSelector } from 'react-redux';
import { selectAreaState } from '../store/selectors/area';

/**
 * Hook pour accéder à l'état d'une zone
 * @param areaId - Identifiant de la zone
 * @returns État de la zone
 */
export function useAreaState<T = any>(areaId: string): T {
  return useSelector((state) => selectAreaState<T>(state, areaId));
} 
