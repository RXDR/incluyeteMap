
import { supabase } from '@/integrations/supabase/client';
import { useMemo, useState, useCallback, useEffect } from 'react';

import { toast } from 'sonner';

/**
 * Hook personalizado para manejar los filtros combinados sin límites de resultados
 */
export function useCombinedFiltersSinLimite() {
  const [isLoading, setIsLoading] = useState(false);
  const [combinedFilters, setCombinedFilters] = useState<FilterConfig[]>([]);
  const [combinedStats, setCombinedStats] = useState<MapDataItem[]>([]);
  const [totalStats, setTotalStats] = useState<{ 
    totalEncuestas: number, 
    totalBarrios: number,
    totalMatches: number
  }>({
    totalEncuestas: 0,
    totalBarrios: 0,
    totalMatches: 0
  });

  // Función para aplicar filtros sin límite
  const applyCombinedFilters = useCallback(async (filters: FilterConfig[]) => {
    if (filters.length === 0) {
      setCombinedStats([]);
      setTotalStats({ totalEncuestas: 0, totalBarrios: 0, totalMatches: 0 });
      return [];
    }

    setIsLoading(true);

    try {
      // Formatear los filtros para la función SQL
      const filtrosFormateados = filters.map(filter => ({
        category: filter.category,
        questionId: filter.questionId,
        response: filter.selectedResponse
      }));

      console.log('Aplicando filtros sin límite:', filtrosFormateados);

      // Usar la nueva función SQL sin límite
      let { data, error } = await supabase.rpc('apply_combined_filters_sin_limite', {
        filters: filtrosFormateados
      });

      if (error) {
        console.error('Error al aplicar filtros:', error);
        toast.error('Error al aplicar los filtros. No se pudieron aplicar los filtros');
        setCombinedStats([]);
        setTotalStats({ totalEncuestas: 0, totalBarrios: 0, totalMatches: 0 });
        setIsLoading(false);
        return [];
      }

      // Calcular estadísticas totales
      const totalEncuestas = data.reduce((sum: number, item: any) => sum + Number(item.total_encuestas), 0);
      const totalMatches = data.reduce((sum: number, item: any) => sum + Number(item.matches_count), 0);
      const totalBarrios = data.length;

      console.log(`Resultados sin límite: ${totalBarrios} barrios con ${totalEncuestas} encuestas totales`);

      setCombinedStats(data);
      setTotalStats({ totalEncuestas, totalBarrios, totalMatches });
      setIsLoading(false);
      return data;
    } catch (err) {
      console.error('Error inesperado al aplicar filtros:', err);
      toast.error('Error inesperado al procesar los filtros');
      setCombinedStats([]);
      setTotalStats({ totalEncuestas: 0, totalBarrios: 0, totalMatches: 0 });
      setIsLoading(false);
      return [];
    }
  }, []);

  // Función para agregar un filtro
  const addFilter = useCallback(async (newFilter: FilterConfig) => {
    // Verificar si ya existe un filtro con la misma categoría y pregunta
    const existingFilterIndex = combinedFilters.findIndex(
      filter => filter.category === newFilter.category && filter.questionId === newFilter.questionId
    );

    let updatedFilters: FilterConfig[];
    
    if (existingFilterIndex >= 0) {
      // Reemplazar el filtro existente
      updatedFilters = [
        ...combinedFilters.slice(0, existingFilterIndex),
        newFilter,
        ...combinedFilters.slice(existingFilterIndex + 1)
      ];
    } else {
      // Agregar nuevo filtro
      updatedFilters = [...combinedFilters, newFilter];
    }

    setCombinedFilters(updatedFilters);
    await applyCombinedFilters(updatedFilters);
  }, [combinedFilters, applyCombinedFilters]);

  // Función para eliminar un filtro
  const removeFilter = useCallback(async (filterToRemove: FilterConfig) => {
    const updatedFilters = combinedFilters.filter(
      filter => !(filter.category === filterToRemove.category && 
                filter.questionId === filterToRemove.questionId)
    );
    
    setCombinedFilters(updatedFilters);
    await applyCombinedFilters(updatedFilters);
  }, [combinedFilters, applyCombinedFilters]);

  // Función para limpiar todos los filtros
  const clearAllFilters = useCallback(() => {
    setCombinedFilters([]);
    setCombinedStats([]);
    setTotalStats({ totalEncuestas: 0, totalBarrios: 0, totalMatches: 0 });
  }, []);

  return {
    isLoading,
    combinedFilters,
    combinedStats,
    totalStats,
    addFilter,
    removeFilter,
    clearAllFilters,
    applyCombinedFilters
  };
}

// Tipos de datos para TypeScript
interface FilterConfig {
  category: string;
  questionId: string;
  selectedResponse: string;
}

interface MapDataItem {
  barrio: string;
  localidad: string;
  coordx: number;
  coordsy: number;
  total_encuestas: number;
  matches_count: number;
  match_percentage: number;
  intensity_score: number;
}
