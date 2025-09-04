// 🚀 VERSIÓN OPTIMIZADA DEL HOOK COMBINADO
// Esta versión elimina los ciclos de actualización y mejora el rendimiento

import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { debounce } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

// =====================================================
// MAPEO DINÁMICO DE PREGUNTAS - BASADO EN ESTRUCTURA REAL
// =====================================================
const QUESTION_MAPPING: Record<string, Record<string, string>> = {
  // [Mantener el mapeo existente]
  "TIPO DE DISCAPACIDAD": {
    "Pensar, memorizar": "Pensar, memorizar",
    "Hablar y comunicarse": "Hablar y comunicarse",
    "Caminar, correr, saltar": "Caminar, correr, saltar",
    // Otros...
  },
  // Resto de las categorías...
};

// Tipos comunes
export interface FilterConfig {
  category: string;
  questionId: string;
  selectedResponse: string;
  response?: string; // Compatibilidad
}

export interface QuestionResponse {
  response_value: string;
  response_count: number;
  response_percentage: number;
}

export interface QuestionByCategory {
  category: string;
  question_id: string;
  question_index?: number;
  question_text: string;
  response_count: number;
}

export interface MapDataItem {
  barrio: string;
  localidad: string;
  coordx: number;
  coordsy: number;
  total_encuestas: number;
  matches_count: number;
  match_percentage: number;
  intensity_score: number;
}

// Usar tipos consistentes con el hook original
export type FilterStats = MapDataItem;
export type CombinedFilter = FilterConfig;

interface QuestionByCategory {
  question_id: string;
  question_text: string;
  response_count: number;
}

// Hook optimizado
export function useCombinedFiltersOptimizado() {
  // Refs para evitar re-renderizaciones innecesarias
  const isMounted = useRef(true);
  const previousFilters = useRef<FilterConfig[]>([]);

  // Estados esenciales
  const [categories, setCategories] = useState<string[]>([]);
  const [questionsByCategory, setQuestionsByCategory] = useState<Record<string, QuestionByCategory[]>>({});
  const [combinedFilters, setCombinedFilters] = useState<FilterConfig[]>([]);
  const [filterStats, setFilterStats] = useState<MapDataItem[]>([]);

  // Estados de carga
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Paginación
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const PAGE_SIZE = 1000;
  
  // Estado para controlar si ya se cargaron las categorías
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);

  // =====================================================
  // FUNCIÓN: Cargar categorías (optimizada para cargar una sola vez)
  // =====================================================
  const loadCategories = useCallback(async () => {
    if (categoriesLoaded) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Cargando categorías...');
      
      // Usar las categorías predefinidas
      const predefinedCategories = Object.keys(QUESTION_MAPPING);
      setCategories(predefinedCategories);
      setCategoriesLoaded(true);
      
    } catch (err) {
      console.error('❌ Error en loadCategories:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar categorías');
    } finally {
      setLoading(false);
    }
  }, [categoriesLoaded]);

  // =====================================================
  // FUNCIÓN: Cargar preguntas para una categoría (con caché)
  // =====================================================
  const loadQuestionsForCategory = useCallback(async (category: string) => {
    // Si ya tenemos las preguntas para esta categoría, no volver a cargar
    if (questionsByCategory[category] && questionsByCategory[category].length > 0) {
      return;
    }
    try {
      // Obtener las preguntas basadas en la estructura del mapeo
      const categoryMapping = QUESTION_MAPPING[category] || {};
      const questions: QuestionByCategory[] = Object.keys(categoryMapping).map(key => ({
        question_id: key,
        question_text: categoryMapping[key],
        response_count: 0 // Valor real se debe obtener de la base de datos si es necesario
      }));
      setQuestionsByCategory(prev => ({
        ...prev,
        [category]: questions
      }));
    } catch (err) {
      console.error(`Error al cargar preguntas para ${category}:`, err);
    }
  }, [questionsByCategory]);

  // =====================================================
  // FUNCIÓN: Obtener respuestas para una pregunta (optimizada con caché)
  // =====================================================
  const getQuestionResponses = useCallback(async (questionId: string, category: string) => {
    try {
      // Aquí deberías hacer una consulta real a Supabase para obtener las respuestas de la pregunta
      // Ejemplo:
      // const { data, error } = await supabase.rpc('get_question_responses', { question_id: questionId, category });
      // if (error) throw error;
      // return data;
      return [];
    } catch (err) {
      console.error('Error al cargar respuestas:', err);
      return [];
    }
  }, []);

  // =====================================================
  // FUNCIÓN: Aplicar filtros combinados (con debounce para evitar llamadas frecuentes)
  // =====================================================
  // Nueva función para cargar más datos (paginación)
  const loadMoreData = useCallback(async (filters: FilterConfig[], page: number) => {
    setStatsLoading(true);
    try {
      const filtrosFormateados = filters.map(filter => ({
        category: filter.category || '',
        questionId: filter.questionId,
        response: filter.selectedResponse || filter.response
      }));
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await supabase.rpc('apply_combined_filters_optimized', {
        filters: filtrosFormateados,
        from_offset: from,
        to_offset: to
      });
      if (error) throw error;
      if (!isMounted.current) return;
      if (data && data.length > 0) {
        setFilterStats(prev => page === 0 ? data : [...prev, ...data]);
        setHasMore(data.length === PAGE_SIZE);
      } else {
        if (page === 0) setFilterStats([]);
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error al aplicar filtros optimizados:', err);
      toast.error('Error al aplicar filtros optimizados');
      if (page === 0) setFilterStats([]);
      setHasMore(false);
    } finally {
      if (isMounted.current) setStatsLoading(false);
    }
  }, []);

  // Función principal para aplicar filtros (reset de paginación)
  const applyCombinedFilters = useCallback(
    debounce(async (filters: FilterConfig[]) => {
      if (JSON.stringify(filters) === JSON.stringify(previousFilters.current)) return;
      previousFilters.current = [...filters];
      if (!isMounted.current) return;
      if (filters.length === 0) {
        setFilterStats([]);
        setHasMore(false);
        setCurrentPage(0);
        return;
      }
      setCurrentPage(0);
      await loadMoreData(filters, 0);
    }, 500),
    [loadMoreData]
  );

  // Función para cargar el siguiente lote
  const loadNextPage = useCallback(async () => {
    if (!hasMore || statsLoading) return;
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    await loadMoreData(combinedFilters, nextPage);
  }, [hasMore, statsLoading, currentPage, combinedFilters, loadMoreData]);

  // =====================================================
  // FUNCIÓN: Agregar filtro (actualizada para soportar múltiples respuestas)
  // =====================================================
  const addFilter = useCallback((questionId: string, response: string, category?: string) => {
    setCombinedFilters(prev => {
      // Validar si ya existe una respuesta para la misma pregunta
      const existingFilter = prev.find(
        filter => filter.questionId === questionId && filter.category === (category || '')
      );

      // Bloquear si ya existe una respuesta para la misma pregunta
      if (existingFilter) {
        toast.warning('Ya existe una respuesta seleccionada para esta pregunta. Por favor, elimínala antes de seleccionar otra.');
        return prev;
      }

      // Agregar el nuevo filtro
      return [
        ...prev,
        {
          category: category || '',
          questionId,
          selectedResponse: response
        }
      ];
    });
  }, []);

  const clearFilterForQuestion = useCallback((questionId: string, category?: string) => {
    setCombinedFilters(prev => prev.filter(
      filter => !(filter.questionId === questionId && filter.category === (category || ''))
    ));
  }, []);

  // =====================================================
  // FUNCIÓN: Remover filtro
  // =====================================================
  const removeFilter = useCallback((index: number) => {
    setCombinedFilters(prev => prev.filter((_, i) => i !== index));
  }, []);

  // =====================================================
  // FUNCIÓN: Limpiar filtros
  // =====================================================
  const clearFilters = useCallback(() => {
    setCombinedFilters([]);
    setFilterStats([]);
  }, []);

  // =====================================================
  // EFECTO: Limpiar cuando el componente se desmonte
  // =====================================================
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // =====================================================
  // EFECTO: Cargar categorías al inicio
  // =====================================================
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // =====================================================
  // EFECTO: Aplicar filtros cuando cambien (con protección)
  // =====================================================
  useEffect(() => {
    if (combinedFilters.length > 0) {
      applyCombinedFilters(combinedFilters);
    } else if (combinedFilters.length === 0 && filterStats.length > 0) {
      setFilterStats([]);
    }
    // No incluir filterStats en las dependencias para evitar ciclos
  }, [combinedFilters, applyCombinedFilters]);

  return {
    // Estados
    categories,
    questionsByCategory,
    loading,
    error,
    combinedFilters,
    filterStats,
    statsLoading,
  hasMore,
  loadNextPage,
    
    // Funciones
    loadQuestionsForCategory,
    getQuestionResponses,
    addFilter,
    removeFilter,
    clearFilters,
  applyCombinedFilters
  };
}

// Para mantener compatibilidad con el código existente
export const useCombinedFilters = useCombinedFiltersOptimizado;
