import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface ResponseStats {
  response: string;
  count: number;
  percentage?: number;
}

interface CategoryResponse {
  questionId: number;
  questionText: string;
  responseValue: string;
  count: number;
}

interface SurveyStatistics {
  totalRecords: number;
  totalBarrios: number;
  totalLocalidades: number;
  dateRange: string;
  categoriesCount: number;
}

export const useSurveyFunctions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener respuestas únicas para una pregunta
  const getQuestionResponses = useCallback(async (
    questionId: number, 
    limitCount: number = 50
  ): Promise<string[]> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .rpc('get_question_responses', {
          question_id: questionId,
          limit_count: limitCount
        });

      if (error) throw error;

      return data?.map((item: any) => item.response_value) || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error obteniendo respuestas:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener estadísticas de respuestas
  const getQuestionResponseStats = useCallback(async (
    questionId: number, 
    limitCount: number = 20
  ): Promise<ResponseStats[]> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .rpc('get_question_response_stats', {
          question_id: questionId,
          limit_count: limitCount
        });

      if (error) throw error;

      return data?.map((item: any) => ({
        response: item.response_value,
        count: item.count,
        percentage: item.percentage
      })) || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error obteniendo estadísticas:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener respuestas por categoría
  const getCategoryResponses = useCallback(async (
    categoryName: string, 
    limitCount: number = 100
  ): Promise<CategoryResponse[]> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .rpc('get_category_responses', {
          category_name: categoryName,
          limit_count: limitCount
        });

      if (error) throw error;

      return data?.map((item: any) => ({
        questionId: item.question_id,
        questionText: item.question_text,
        responseValue: item.response_value,
        count: item.count
      })) || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error obteniendo respuestas por categoría:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Aplicar filtros múltiples
  const applySurveyFilters = useCallback(async (
    filterCriteria: any[]
  ): Promise<any[]> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .rpc('apply_survey_filters', {
          filter_criteria: filterCriteria
        });

      if (error) throw error;

      return data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error aplicando filtros:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener estadísticas generales
  const getSurveyStatistics = useCallback(async (): Promise<SurveyStatistics | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .rpc('get_survey_statistics');

      if (error) throw error;

      if (data && data.length > 0) {
        const stats = data[0];
        return {
          totalRecords: stats.total_records,
          totalBarrios: stats.total_barrios,
          totalLocalidades: stats.total_localidades,
          dateRange: stats.date_range,
          categoriesCount: stats.categories_count
        };
      }

      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error obteniendo estadísticas generales:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Función de fallback para obtener respuestas desde temp_excel_import
  const getResponsesFromRawData = useCallback(async (
    questionId: number, 
    limitCount: number = 200
  ): Promise<string[]> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('temp_excel_import')
        .select('raw_data')
        .limit(limitCount);

      if (error) throw error;

      const responses = new Set<string>();
      data?.forEach(record => {
        if (record.raw_data && record.raw_data.person_data && Array.isArray(record.raw_data.person_data)) {
          const personData = record.raw_data.person_data;
          if (personData[questionId] !== undefined && personData[questionId] !== null) {
            const response = String(personData[questionId]);
            if (response && response !== 'null' && response !== 'undefined' && response.trim() !== '') {
              responses.add(response);
            }
          }
        }
      });

      return Array.from(responses).sort();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error obteniendo respuestas desde datos crudos:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getQuestionResponses,
    getQuestionResponseStats,
    getCategoryResponses,
    applySurveyFilters,
    getSurveyStatistics,
    getResponsesFromRawData
  };
};
