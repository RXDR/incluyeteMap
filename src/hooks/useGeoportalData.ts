import { useState, useEffect } from 'react';
import { GeoportalService, GeoportalStats, DepartmentFilter } from '@/services/geoportalService';
import { DepartmentData } from '@/data/colombiaData';

export const useGeoportalData = () => {
  const [stats, setStats] = useState<GeoportalStats | null>(null);
  const [departments, setDepartments] = useState<DepartmentData[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<DepartmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    try {
      const initialStats = GeoportalService.getStats();
      const initialDepartments = GeoportalService.getDepartments();
      
      setStats(initialStats);
      setDepartments(initialDepartments);
      setFilteredDepartments(initialDepartments);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
      setLoading(false);
    }
  }, []);

  // Función para filtrar departamentos
  const filterDepartments = (filters: DepartmentFilter) => {
    try {
      const filtered = GeoportalService.filterDepartments(filters);
      setFilteredDepartments(filtered);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al filtrar datos');
    }
  };

  // Función para obtener top departamentos
  const getTopDepartments = (metric: keyof DepartmentData, limit: number = 5) => {
    return GeoportalService.getTopDepartments(metric, limit);
  };

  // Función para obtener bottom departamentos
  const getBottomDepartments = (metric: keyof DepartmentData, limit: number = 5) => {
    return GeoportalService.getBottomDepartments(metric, limit);
  };

  // Función para obtener rango de métrica
  const getMetricRange = (metric: keyof DepartmentData) => {
    return GeoportalService.getMetricRange(metric);
  };

  // Función para obtener datos de mapa
  const getMapData = (metric: keyof DepartmentData) => {
    return GeoportalService.getMapData(metric);
  };

  // Función para obtener datos de encuestas
  const getSurveyData = (departmentId: string) => {
    return GeoportalService.getSurveyData(departmentId);
  };

  // Función para obtener datos de correlación
  const getCorrelationData = () => {
    return GeoportalService.getCorrelationData();
  };

  // Función para obtener departamento por ID
  const getDepartmentById = (id: string) => {
    return GeoportalService.getDepartmentById(id);
  };

  // Función para limpiar filtros
  const clearFilters = () => {
    setFilteredDepartments(departments);
  };

  return {
    // Estado
    stats,
    departments,
    filteredDepartments,
    loading,
    error,
    
    // Funciones
    filterDepartments,
    getTopDepartments,
    getBottomDepartments,
    getMetricRange,
    getMapData,
    getSurveyData,
    getCorrelationData,
    getDepartmentById,
    clearFilters,
  };
};
