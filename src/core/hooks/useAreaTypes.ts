import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectAreaTypes } from '../store/selectors/area';

/**
 * Hook pour accéder à la liste des types de zones enregistrés
 * @param filter - Fonction de filtrage optionnelle
 * @returns Liste des types de zones enregistrés
 */
export function useAreaTypes<T extends string>(filter?: (areaType: T) => boolean): T[] {
  // Récupérer la liste des types de zones depuis le store
  const areaTypes = useSelector(selectAreaTypes);
  
  // Filtrer si nécessaire
  return useMemo(() => {
    if (filter) {
      return areaTypes.filter(filter) as T[];
    }
    return areaTypes as T[];
  }, [areaTypes, filter]);
} 
