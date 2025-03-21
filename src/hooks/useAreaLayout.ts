import { useSelector } from 'react-redux';
import { selectAreaLayout } from '../store/selectors/area';
import { IAreaLayout } from '../types/area';

/**
 * Hook pour accéder à la disposition des zones
 * @returns Disposition des zones
 */
export function useAreaLayout(): IAreaLayout {
  return useSelector(selectAreaLayout);
} 
