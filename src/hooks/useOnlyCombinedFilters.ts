import { useCombinedFilters } from './useCombinedFilters';

/**
 * Hook para obtener solo el array de filtros combinados,
 * sin ejecutar funciones pesadas ni cálculos de estadísticas.
 */
export function useOnlyCombinedFilters() {
  const { combinedFilters } = useCombinedFilters();
  return combinedFilters;
}
