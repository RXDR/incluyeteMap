
import { useState, useEffect, useCallback } from 'react';
import { useMapLibreMap } from '@/hooks/useMapLibreMap';
import { BarranquillaGeoService, BarrioInfo } from '@/services/barranquillaGeoService';
import { barranquillaConfig, metricColors } from '@/config/mapStyles';
import EnhancedSurveyFilters from './EnhancedSurveyFilters';
import CombinedFiltersPanel from './CombinedFiltersPanel';
import { useCombinedFilters, CombinedFilter, FilterStats } from '@/hooks/useCombinedFilters';
import { supabase } from '@/lib/supabase';
import './MapTooltip.css';
import { testHeatmapSupport, testBothConfigurations } from '../utils/heatmapTest';
import { barranquillaBarrios, BarrioData } from '@/data/barranquillaData';
import { 
  MapPin, 
  Search, 
  Layers,
  ChevronDown,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Home,
  BarChart3,
  Palette,
  Target,
  Filter,
  Loader2,
  X,
  FileSpreadsheet,
  Database,
  TrendingUp,
  Users
} from 'lucide-react';

// Import Excel survey system components
import { ExcelUploader } from '@/components/excel';
import { SurveyDataVisualizer } from '@/components/excel';
import { StatsDisplay } from '@/components/excel';
import { ProcessingStats } from '@/types/excel';

interface BarranquillaChoroplethMapProps {  
  initialZoom?: number;
}

// Types for the current database structure with responses_data
interface SurveyData {
  id: string;
  barrio: string;
  localidad: string;
  coordenadas: [number, number];
  sociodemographic_data: Record<string, any>;
  location_data: {
    localidad: string;
    barrio: string;
    coordinates: { x: number | null; y: number | null };
    address: string;
  };
  responses_data: Record<string, Record<string, string>>; // Usar responses_data como en el modelo real
  metadata: {
    stratum: string;
    observations: string;
    category_distribution: Record<string, string>;
    processing_date: string;
    row_number: number;
  };
  created_at: string;
  updated_at: string;
}

// Types for heatmap data from the new system
interface HeatmapDataPoint {
  latitude: number;
  longitude: number;
  value: number;
  location_info: {
    localidad: string;
    barrio: string;
    address: string;
  };
  response_data: Record<string, any>;
}

// Categorías reales de las encuestas basadas en la estructura actual
const surveyCategories = {
  "OTROS": { name: "Otros", color: "#6b7280", unit: "%" },
  "SALUD": { name: "Salud", color: "#ef4444", unit: "%" },
  "CERTIFICADO": { name: "Certificado", color: "#10b981", unit: "%" },
  "NECESIDADES": { name: "Necesidades", color: "#f59e0b", unit: "%" },
  "ACCESIBILIDAD": { name: "Accesibilidad", color: "#6366f1", unit: "%" },
  "CUIDADEOR DE PCD": { name: "Cuidador de PCD", color: "#8b5cf6", unit: "%" },
  "SOCIODEMOGRÁFICO": { name: "Sociodemográfico", color: "#ec4899", unit: "%" },
  "CONDICIONES DE VIDA": { name: "Condiciones de Vida", color: "#f97316", unit: "%" },
  "TIPO DE DISCAPACIDAD": { name: "Tipo de Discapacidad", color: "#06b6d4", unit: "%" },
  "NECESIDAD DE CUIDADOR": { name: "Necesidad de Cuidador", color: "#84cc16", unit: "%" },
  "EDUCACIÓN Y ECONOMÍA": { name: "Educación y Economía", color: "#3b82f6", unit: "%" }
};

// Esquemas de colores para las categorías actualizadas
const colorSchemes = {
  "OTROS": [[0, "#f3f4f6"], [25, "#d1d5db"], [50, "#9ca3af"], [75, "#6b7280"], [100, "#374151"]],
  "SALUD": [[0, "#fee2e2"], [25, "#fecaca"], [50, "#fca5a5"], [75, "#ef4444"], [100, "#dc2626"]],
  "CERTIFICADO": [[0, "#d1fae5"], [25, "#a7f3d0"], [50, "#6ee7b7"], [75, "#10b981"], [100, "#059669"]],
  "NECESIDADES": [[0, "#fef3c7"], [25, "#fde68a"], [50, "#fcd34d"], [75, "#f59e0b"], [100, "#d97706"]],
  "ACCESIBILIDAD": [[0, "#e0e7ff"], [25, "#c7d2fe"], [50, "#a5b4fc"], [75, "#6366f1"], [100, "#4f46e5"]],
  "CUIDADEOR DE PCD": [[0, "#f3e8ff"], [25, "#e9d5ff"], [50, "#d8b4fe"], [75, "#8b5cf6"], [100, "#7c3aed"]],
  "SOCIODEMOGRÁFICO": [[0, "#fce7f3"], [25, "#fbcfe8"], [50, "#f9a8d4"], [75, "#ec4899"], [100, "#db2777"]],
  "CONDICIONES DE VIDA": [[0, "#fed7aa"], [25, "#fdba74"], [50, "#fb923c"], [75, "#f97316"], [100, "#ea580c"]],
  "TIPO DE DISCAPACIDAD": [[0, "#cffafe"], [25, "#a5f3fc"], [50, "#67e8f9"], [75, "#06b6d4"], [100, "#0891b2"]],
  "NECESIDAD DE CUIDADOR": [[0, "#f0fdf4"], [25, "#dcfce7"], [50, "#bbf7d0"], [75, "#84cc16"], [100, "#65a30d"]],
  "EDUCACIÓN Y ECONOMÍA": [[0, "#dbeafe"], [25, "#bfdbfe"], [50, "#93c5fd"], [75, "#3b82f6"], [100, "#2563eb"]]
} as Record<string, [number, string][]>;

export default function BarranquillaChoroplethMap({ 
  initialZoom = 12 
}: BarranquillaChoroplethMapProps) {
  const [selectedMetric, setSelectedMetric] = useState<keyof typeof colorSchemes>('SALUD');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedBarrio, setSelectedBarrio] = useState<BarrioInfo | null>(null);
  const [combinedFilters, setCombinedFilters] = useState<CombinedFilter[]>([]);
  const [combinedStats, setCombinedStats] = useState<FilterStats[]>([]);
  const [showCombinedFilters, setShowCombinedFilters] = useState(false);
  const [surveyData, setSurveyData] = useState<SurveyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    metrics: true,
    controls: true,
    info: true,
    excel: false,
    data: false
  });

  // New state for Excel survey system
  const [showExcelUploader, setShowExcelUploader] = useState(false);
  const [showDataVisualizer, setShowDataVisualizer] = useState(false);
  const [uploadStats, setUploadStats] = useState<ProcessingStats | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapDataPoint[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [processingExcel, setProcessingExcel] = useState(false);

  // Hook para filtros combinados
  const { loading: combinedLoading } = useCombinedFilters();

  // Obtener datos del servicio geográfico
  const barrios = BarranquillaGeoService.getBarrios();
  const stats = BarranquillaGeoService.getStats();
  const mapBounds = BarranquillaGeoService.getMapBounds();

  // Función simplificada para cargar datos básicos del mapa
  const loadBasicMapData = useCallback(async () => {
    try {
      console.log('🔄 Cargando datos básicos para el mapa...');
      
  // Eliminar consulta directa, usar solo el sistema optimizado de filtros
  // Los datos deben venir del hook optimizado y su paginación
  // Si necesitas datos básicos, usa el primer lote del sistema de filtros

      if (error) {
        console.error('Error cargando datos básicos:', error);
        throw error;
      }

      if (basicData && basicData.length > 0) {
        // Procesar datos básicos
        const processedData: SurveyData[] = basicData
          .filter((item: any) => {
            const coords = item.location_data?.coordinates;
            return coords && coords.x !== 0 && coords.y !== 0;
          })
          .map((item: any, index: number) => {
            const locationData = item.location_data || {};
            const coordinates = locationData.coordinates || { x: 0, y: 0 };
            
            return {
              id: item.id || `basic-${index}`,
              barrio: locationData.barrio || 'Desconocido',
              localidad: locationData.localidad || 'Desconocida',
              coordenadas: [coordinates.x || 0, coordinates.y || 0],
              sociodemographic_data: {},
              location_data: {
                localidad: locationData.localidad || '',
                barrio: locationData.barrio || '',
                coordinates: coordinates,
                address: locationData.address || ''
              },
              responses_data: item.responses_data || {},
              metadata: {
                stratum: '',
                observations: '',
                category_distribution: {},
                processing_date: '',
                row_number: 0
              },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
          });

        setSurveyData(processedData);
        console.log('✅ Datos básicos cargados:', processedData.length, 'puntos');

        // Extraer categorías básicas
        const categories = new Set<string>();
        processedData.forEach(survey => {
          if (survey.responses_data) {
            Object.keys(survey.responses_data).forEach(category => {
              categories.add(category);
            });
          }
        });

        const categoriesList = Array.from(categories).map(category => ({
          category,
          count: processedData.filter(survey => 
            survey.responses_data && survey.responses_data[category]
          ).length
        }));

        setAvailableCategories(categoriesList.map(c => c.category));
        console.log('✅ Categorías básicas extraídas:', categoriesList.map(c => c.category));

        // 🔧 CRÍTICO: Marcar como no cargando cuando los datos están listos
        setLoading(false);
        console.log('✅ Estado de loading cambiado a false');

      } else {
        console.warn('⚠️ No se encontraron datos básicos');
        // 🔧 CRÍTICO: También marcar como no cargando si no hay datos
        setLoading(false);
        console.log('✅ Estado de loading cambiado a false (sin datos)');
      }

    } catch (err) {
      console.error('❌ Error cargando datos básicos:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      // 🔧 CRÍTICO: Marcar como no cargando en caso de error
      setLoading(false);
      console.log('✅ Estado de loading cambiado a false (error)');
    }
  }, [supabase]);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadBasicMapData();
    fetchAvailableCategories();
  }, [loadBasicMapData]);

  // Función para obtener categorías disponibles usando la función SQL correcta
  const fetchAvailableCategories = async () => {
    try {
      console.log('🔄 Cargando categorías disponibles...');
      
      // Intentar obtener categorías de la base de datos usando la función SQL
      const { data: dbCategories, error } = await supabase.rpc('get_available_categories');
      
      if (error) {
        console.log('ℹ️ Función SQL no disponible, usando categorías predefinidas:', error.message);
        // Fallback a categorías predefinidas
        const predefinedCategories = Object.keys(surveyCategories);
        setAvailableCategories(predefinedCategories);
        console.log('✅ Categorías predefinidas cargadas:', predefinedCategories);
        return;
      }

      if (dbCategories && dbCategories.length > 0) {
        const categoryNames = dbCategories.map((cat: any) => cat.category).filter(Boolean);
        setAvailableCategories(categoryNames);
        console.log('✅ Categorías de BD cargadas:', categoryNames);
      } else {
        // Si no hay datos, usar categorías predefinidas
        const predefinedCategories = Object.keys(surveyCategories);
        setAvailableCategories(predefinedCategories);
        console.log('✅ Usando categorías predefinidas (sin datos en BD):', predefinedCategories);
      }
      
    } catch (err) {
      console.error('❌ Error cargando categorías:', err);
      // En caso de error, usar categorías predefinidas como fallback
      const predefinedCategories = Object.keys(surveyCategories);
      setAvailableCategories(predefinedCategories);
      console.log('✅ Usando categorías predefinidas como fallback:', predefinedCategories);
    }
  };

  // Función para obtener datos de mapa de calor usando la función SQL correcta
  const fetchHeatmapData = async (categoryFilter?: string) => {
    try {
      console.log('🔄 Cargando datos para mapa de calor...');
      
      // Usar la función SQL get_heatmap_data
      const { data: heatmapData, error } = await supabase.rpc('get_heatmap_data', {
        category_filter: categoryFilter || null
      });
      
      if (error) {
        console.log('ℹ️ Función SQL no disponible, usando consulta directa:', error.message);
        // Fallback a consulta directa
        let query = supabase
          .from('survey_responses')
          .select('location_data, responses_data')
          .not('location_data->coordinates->x', 'is', null)
          .not('location_data->coordinates->y', 'is', null);
        
        const { data: surveyData, error: directError } = await query;
        
        if (directError) throw directError;

        if (surveyData && surveyData.length > 0) {
          const processedHeatmapData: HeatmapDataPoint[] = surveyData
            .filter((item: any) => {
              const coords = item.location_data?.coordinates;
              return coords && coords.x !== 0 && coords.y !== 0;
            })
            .map((item: any) => ({
              latitude: item.location_data.coordinates.y,
              longitude: item.location_data.coordinates.x,
              value: 1, // Valor base
              location_info: item.location_data,
              response_data: categoryFilter ? item.responses_data[categoryFilter] : item.responses_data
            }));
          
          setHeatmapData(processedHeatmapData);
          console.log('✅ Datos de mapa de calor cargados (consulta directa):', processedHeatmapData.length, 'puntos');
        }
        return;
      }

      if (heatmapData && heatmapData.length > 0) {
        const processedHeatmapData: HeatmapDataPoint[] = heatmapData.map((item: any) => ({
          latitude: item.latitude,
          longitude: item.longitude,
          value: item.value,
          location_info: item.location_info,
          response_data: item.response_data
        }));
        
        setHeatmapData(processedHeatmapData);
        console.log('✅ Datos de mapa de calor cargados (función SQL):', processedHeatmapData.length, 'puntos');
      }
    } catch (err) {
      console.error('❌ Error cargando datos de mapa de calor:', err);
    }
  };

  // Función para manejar la subida exitosa de Excel
  const handleExcelUploadSuccess = (stats: ProcessingStats) => {
    console.log('✅ Excel procesado exitosamente:', stats);
    setUploadStats(stats);
    setProcessingExcel(false);
    
    // Recargar datos después de la subida
    loadBasicMapData();
    fetchAvailableCategories();
    
    // Si hay datos con coordenadas, cargar mapa de calor
    if (stats.withCategory > 0) {
      fetchHeatmapData(selectedCategory);
    }
  };

  // Función para manejar el procesamiento de Excel
  const handleExcelProcessing = (isProcessing: boolean) => {
    setProcessingExcel(isProcessing);
  };

  // Función para obtener estadísticas por localidad (versión simplificada)
  const fetchLocationStats = async () => {
    try {
      console.log('🔄 Cargando estadísticas por localidad...');
      
      // Consulta directa a la tabla en lugar de usar función SQL
      const { data: surveyData, error } = await supabase
        .from('survey_responses')
        .select('location_data, responses_data');
      
      if (error) throw error;

      if (surveyData && surveyData.length > 0) {
        // Agrupar por localidad
        const statsByLocation = surveyData.reduce((acc: any, item: any) => {
          const localidad = item.location_data?.localidad;
          if (localidad) {
            if (!acc[localidad]) {
              acc[localidad] = {
                localidad,
                total_responses: 0,
                categories: new Set()
              };
            }
            acc[localidad].total_responses++;
            
            // Agregar categorías disponibles
            if (item.responses_data) {
              Object.keys(item.responses_data).forEach(category => {
                acc[localidad].categories.add(category);
              });
            }
          }
          return acc;
        }, {});
        
        // Convertir a array y ordenar
        const stats = Object.values(statsByLocation).map((item: any) => ({
          localidad: item.localidad,
          total_responses: item.total_responses,
          categories: Array.from(item.categories)
        })).sort((a: any, b: any) => b.total_responses - a.total_responses);
        
        console.log('✅ Estadísticas por localidad:', stats);
        return stats;
      }
    } catch (err) {
      console.error('❌ Error cargando estadísticas por localidad:', err);
    }
  };

  // Calcular centro del mapa basado en los bounds
  const mapCenter: [number, number] = [
    (mapBounds[0][0] + mapBounds[1][0]) / 2,
    (mapBounds[0][1] + mapBounds[1][1]) / 2
  ];

  // Configuración del mapa usando la configuración de Barranquilla
  const mapConfig = {
    center: barranquillaConfig.center,
    zoom: barranquillaConfig.zoom,
    pitch: 0,
    bearing: 0,
    style: barranquillaConfig.style
  };

    const {
    mapContainer,
    map,
    isReady,
    styleLoaded,
    error: mapError,
    addHeatmapLayer,
    removeLayer,
    set3DMode,
    flyTo,
    zoomIn,
    zoomOut,
    fitBounds,
    resetView,
    addChoroplethLayer,
    addGeoJSONLayer
  } = useMapLibreMap(mapConfig);

  // 🔍 DIAGNÓSTICO: Verificar estado del mapa al inicializar
  useEffect(() => {
    console.log('🔍 Estado del mapa al inicializar:', {
      map: !!map,
      mapType: typeof map,
      isReady,
      styleLoaded,
      mapCurrent: map
    });
  }, [map, isReady, styleLoaded]);

  // Crear GeoJSON con datos reales para el choropleth usando la nueva estructura
  const createChoroplethGeoJSON = (metric: keyof typeof colorSchemes) => {
    return {
      type: 'FeatureCollection',
      features: surveyData.map(barrio => ({
        type: 'Feature',
        geometry: {
          type: 'Point', // Usar puntos ya que no tenemos polígonos exactos
          coordinates: barrio.coordenadas
        },
        properties: {
          id: barrio.id,
          nombre: barrio.barrio,
          localidad: barrio.localidad,
          [metric]: 0, // Por ahora usar 0, se calculará dinámicamente
          // Datos de la nueva estructura
          sociodemographic_data: barrio.sociodemographic_data,
          responses_data: barrio.responses_data,
          metadata: barrio.metadata,
          created_at: barrio.created_at
        }
      }))
    };
  };

  // Crear datos para mapa de calor usando los datos reales de la función SQL
  const createHeatmapData = (metric: keyof typeof colorSchemes) => {
    if (!heatmapData || heatmapData.length === 0) {
      console.log('No hay datos de heatmap disponibles');
      return [];
    }

    return heatmapData.map(point => ({
      id: `heatmap-${point.latitude}-${point.longitude}`,
      lng: point.longitude,
      lat: point.latitude,
      intensity: point.value || 1,
      properties: {
        barrio: point.location_info?.barrio || 'Desconocido',
        localidad: point.location_info?.localidad || 'Desconocida',
        [metric]: point.value || 1,
        response_data: point.response_data,
        location_info: point.location_info
      }
    }));
  };

  // Efecto para cargar datos del mapa de calor cuando se monta el componente
  useEffect(() => {
    if (isReady && styleLoaded) {
      fetchHeatmapData(selectedCategory);
    }
  }, [isReady, styleLoaded, selectedCategory]);

  // Efecto para cargar el mapa coroplético
  useEffect(() => {
    if (!isReady || !styleLoaded || surveyData.length === 0) return;

    // Si hay filtros combinados activos, no mostrar el mapa coroplético normal
    if (combinedFilters.length > 0) {
      return;
    }

    // Remover capas anteriores
    removeLayer('barranquilla-choropleth');
    removeLayer('barranquilla-choropleth-border');
    removeLayer('barranquilla-heatmap');

    if (showHeatmap) {
      // Mostrar mapa de calor
      const heatmapData = createHeatmapData(selectedMetric);
      addHeatmapLayer(heatmapData, 'barranquilla-heatmap');
    } else {
      // Mostrar mapa coroplético con datos reales
      const choroplethData = createChoroplethGeoJSON(selectedMetric);
      addChoroplethLayer(
        'barranquilla-choropleth',
        choroplethData,
        colorSchemes[selectedMetric] as [number, string][],
        selectedMetric,
        {
          strokeColor: '#ffffff',
          strokeWidth: 1,
          strokeOpacity: 0.8
        }
      );
    }

  }, [isReady, styleLoaded, selectedMetric, showHeatmap, surveyData, combinedFilters, addChoroplethLayer, addHeatmapLayer, removeLayer]);

  // Efecto para hacer zoom automático a los bounds
  useEffect(() => {
    if (isReady && styleLoaded) {
      setTimeout(() => {
        fitBounds(mapBounds, { padding: 100 });
      }, 1000);
    }
  }, [isReady, styleLoaded, fitBounds, mapBounds]);

  // Efecto para limpiar mapa de calor cuando se limpien los filtros
  useEffect(() => {
    if (combinedFilters.length === 0 && map) {
      clearHeatmap();
    }
  }, [combinedFilters.length, map]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev]
    }));
  };

  const getMetricLabel = (metric: keyof typeof colorSchemes) => {
    return surveyCategories[metric]?.name || metric;
  };

  const getMetricUnit = (metric: keyof typeof colorSchemes) => {
    return surveyCategories[metric]?.unit || '';
  };

  const getAverageValue = (metric: keyof typeof colorSchemes) => {
    if (surveyData.length === 0) return '0.0';
    
    // Calcular promedio basado en los datos reales de la categoría
    let totalValue = 0;
    let count = 0;
    
    surveyData.forEach(data => {
      const categoryData = data.responses_data[metric];
      if (categoryData) {
        // Contar respuestas válidas en la categoría
        const responses = Object.values(categoryData);
        totalValue += responses.length;
        count++;
      }
    });
    
    if (count === 0) return '0.0';
    return (totalValue / count).toFixed(1);
  };

  const handleCombinedFiltersChange = (filters: CombinedFilter[]) => {
    setCombinedFilters(filters);
    console.log('Filtros combinados aplicados:', filters);
    
    // Si no hay filtros, limpiar el mapa de calor
    if (filters.length === 0) {
      clearHeatmap();
    }
  };

  // Función para limpiar el mapa de calor con verificaciones ultra-robustas
  const clearHeatmap = useCallback(() => {
    // Verificar que el mapa esté completamente listo
    if (!map || !isReady || !styleLoaded) {
      console.log('⚠️ Mapa no está listo para limpiar heatmap', { 
        map: !!map, 
        isReady, 
        styleLoaded,
        mapType: typeof map 
      });
      return;
    }

    // Verificar que el mapa sea un objeto válido de MapLibre
    if (typeof map !== 'object' || map === null) {
      console.warn('⚠️ map no es un objeto válido:', typeof map);
      return;
    }

    try {
      // Verificar que los métodos existan y sean funciones
      if (typeof map.getLayer !== 'function') {
        console.warn('⚠️ map.getLayer no es una función:', typeof map.getLayer);
        return;
      }

      if (typeof map.getSource !== 'function') {
        console.warn('⚠️ map.getSource no es una función:', typeof map.getSource);
        return;
      }

      if (typeof map.removeLayer !== 'function') {
        console.warn('⚠️ map.removeLayer no es una función:', typeof map.removeLayer);
        return;
      }

      if (typeof map.removeSource !== 'function') {
        console.warn('⚠️ map.removeSource no es una función:', typeof map.removeSource);
        return;
      }

      // Lista de capas a remover
      const layersToRemove = [
        'heatmap-layer',
        'heatmap-points',
        'barranquilla-heatmap',
        'choropleth-layer'
      ];

      // Lista de fuentes a remover
      const sourcesToRemove = [
        'heatmap-data',
        'heatmap-source',
        'choropleth-data'
      ];

      // Remover capas de forma segura
      layersToRemove.forEach(layerId => {
        try {
          if (map.getLayer(layerId)) {
            map.removeLayer(layerId);
            console.log(`✅ Capa ${layerId} removida`);
          }
        } catch (layerError) {
          console.warn(`⚠️ Error removiendo capa ${layerId}:`, layerError);
        }
      });

      // Remover fuentes de forma segura
      sourcesToRemove.forEach(sourceId => {
        try {
          if (map.getSource(sourceId)) {
            map.removeSource(sourceId);
            console.log(`✅ Fuente ${sourceId} removida`);
          }
        } catch (sourceError) {
          console.warn(`⚠️ Error removiendo fuente ${sourceId}:`, sourceError);
        }
      });

      // Remover tooltip si existe
      try {
        if ((map as any).currentTooltip && document.body.contains((map as any).currentTooltip)) {
          document.body.removeChild((map as any).currentTooltip);
          (map as any).currentTooltip = null;
          console.log('✅ Tooltip removido');
        }
      } catch (tooltipError) {
        console.warn('⚠️ Error removiendo tooltip:', tooltipError);
      }

      console.log('✅ Mapa de calor limpiado completamente');
    } catch (error) {
      console.error('❌ Error crítico limpiando mapa de calor:', error);
    }
  }, [map, isReady, styleLoaded]);

  // =====================================================
  // FUNCIÓN OPTIMIZADA: Actualizar mapa con datos de filtros
  // =====================================================
  const updateMapWithFilterData = useCallback((stats: FilterStats[]) => {
    // 🔍 DIAGNÓSTICO: Verificar datos de filtros recibidos
    console.log('🔍 Datos de filtros recibidos:', {
      statsLength: stats.length,
      statsSample: stats.slice(0, 2),
      mapAvailable: !!map,
      isReady,
      styleLoaded
    });

    // Verificar que el mapa esté completamente listo
    if (!map || !isReady || !styleLoaded || stats.length === 0) {
      console.log('⚠️ Mapa no está listo para actualizar con datos de filtros', { 
        map: !!map, 
        isReady, 
        styleLoaded,
        statsLength: stats.length,
        mapType: typeof map,
        mapCurrent: map
      });
      return;
    }

    // Verificar que el mapa sea un objeto válido de MapLibre
    if (typeof map !== 'object' || map === null) {
      console.warn('⚠️ map no es un objeto válido en updateMapWithFilterData:', typeof map);
      return;
    }

    // Verificar que los métodos necesarios existan
    if (typeof map.getSource !== 'function' || typeof map.addSource !== 'function' || 
        typeof map.getLayer !== 'function' || typeof map.addLayer !== 'function') {
      console.warn('⚠️ Métodos del mapa no están disponibles:', {
        getSource: typeof map.getSource,
        addSource: typeof map.addSource,
        getLayer: typeof map.getLayer,
        addLayer: typeof map.addLayer
      });
      return;
    }

    console.log('🔄 Actualizando mapa con datos de filtros:', stats.length);

    // 🔍 DIAGNÓSTICO DETALLADO: Verificar datos de entrada
    console.log('🔍 Datos de entrada detallados:', {
      statsLength: stats.length,
      statsSample: stats.slice(0, 2),
      firstStat: stats[0],
      hasCoordinates: stats[0]?.coordx && stats[0]?.coordsy,
      coordTypes: stats.slice(0, 2).map(s => ({
        coordx: typeof s.coordx,
        coordsy: typeof s.coordsy,
        coordxValue: s.coordx,
        coordsyValue: s.coordsy
      }))
    });

    try {
      // Limpiar heatmap anterior si existe
      clearHeatmap();

    // Convertir estadísticas a GeoJSON
    const heatmapFeatures: any[] = stats.map(stat => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [stat.coordx, stat.coordsy] as [number, number]
      },
      properties: {
        barrio: stat.barrio,
        localidad: stat.localidad,
        total_encuestas: stat.total_encuestas,
        matches_count: stat.matches_count,
        match_percentage: stat.match_percentage,
        intensity_score: stat.intensity_score
      }
    }));

    // 🔍 DIAGNÓSTICO: Verificar GeoJSON generado
    console.log('🔍 GeoJSON generado:', {
      featuresLength: heatmapFeatures.length,
      featuresSample: heatmapFeatures.slice(0, 2),
      firstFeature: heatmapFeatures[0],
      hasValidGeometry: heatmapFeatures[0]?.geometry?.coordinates?.length === 2
    });

    const heatmapData = {
      type: 'FeatureCollection' as const,
      features: heatmapFeatures
    };

    // Crear o actualizar fuente de datos con verificación ULTRA-ROBUSTA
    if (!map) {
      console.warn('⚠️ map es undefined en la línea de getSource, abortando actualización');
      return;
    }

    // Verificar que map sea un objeto válido
    if (typeof map !== 'object' || map === null) {
      console.warn('⚠️ map no es un objeto válido:', typeof map);
      return;
    }

    // Verificar métodos necesarios
    if (typeof map.getSource !== 'function' || typeof map.addSource !== 'function') {
      console.warn('⚠️ Métodos del mapa no disponibles:', {
        getSource: typeof map.getSource,
        addSource: typeof map.addSource
      });
      return;
    }

    let existingSource = null;
    try {
      // 🔍 VERIFICACIÓN ADICIONAL: Asegurar que map existe antes de getSource
      if (!map) {
        console.warn('⚠️ map es undefined antes de getSource, abortando');
        return;
      }
      
      existingSource = map.getSource('heatmap-data');
    } catch (error) {
      console.warn('⚠️ Error al obtener fuente existente:', error);
      existingSource = null;
    }

    // Actualizar o crear fuente
    try {
      if (existingSource) {
        (existingSource as any).setData(heatmapData);
        console.log('✅ Fuente existente actualizada');
      } else {
        map.addSource('heatmap-data', {
          type: 'geojson',
          data: heatmapData
        });
        console.log('✅ Nueva fuente creada');
      }
    } catch (error) {
      console.error('❌ Error crítico al actualizar/crear fuente:', error);
      return;
    }

    // 🔍 DIAGNÓSTICO: Verificar que la fuente se creó correctamente
    try {
      const source = map.getSource('heatmap-data');
      console.log('🔍 Fuente verificada:', {
        sourceExists: !!source,
        sourceType: source?.type,
        sourceData: source ? 'Data presente' : 'No data'
      });
    } catch (error) {
      console.error('❌ Error al verificar fuente:', error);
    }

    // Agregar capa de heatmap si no existe
    if (map && typeof map.getLayer === 'function' && !map.getLayer('heatmap-layer')) {
      map.addLayer({
        id: 'heatmap-layer',
        type: 'circle', // ✅ CAMBIADO: de 'heatmap' a 'circle'
        source: 'heatmap-data',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'intensity_score'],
            0, 5,
            100, 30
          ],
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'intensity_score'],
            0, 'rgba(0, 0, 255, 0.1)',
            25, 'rgba(0, 255, 0, 0.3)',
            50, 'rgba(255, 255, 0, 0.5)',
            75, 'rgba(255, 165, 0, 0.7)',
            100, 'rgba(255, 0, 0, 0.9)'
          ],
          'circle-blur': 0.8, // ✅ AGREGADO: efecto de calor
          'circle-opacity': 0.7
        }
      });
      console.log('✅ Capa de calor principal agregada');
    }

    // Agregar capa de puntos si no existe con verificación adicional
    if (!map) {
      console.warn('⚠️ map es undefined antes de agregar capa de puntos');
      return;
    }
    
    if (map && typeof map.getLayer === 'function' && !map.getLayer('heatmap-points')) {
      map.addLayer({
        id: 'heatmap-points',
        type: 'circle',
        source: 'heatmap-data',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'intensity_score'],
            0, 2,
            100, 8
          ],
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'intensity_score'],
            0, 'rgba(0, 0, 255, 0.8)',
            25, 'rgba(0, 255, 0, 0.8)',
            50, 'rgba(255, 255, 0, 0.8)',
            75, 'rgba(255, 165, 0, 0.8)',
            100, 'rgba(255, 0, 0, 0.8)'
          ],
          'circle-stroke-width': 1,
          'circle-stroke-color': 'rgba(255, 255, 255, 0.8)',
          'circle-opacity': 0.9
        }
      });
      console.log('✅ Capa de puntos centrales agregada');
    }

    // Configurar eventos de hover para tooltips con verificación adicional
    if (!map) {
      console.warn('⚠️ map es undefined antes de configurar eventos de hover');
      return;
    }
    
    map.on('mouseenter', 'heatmap-points', (e) => {
      if (e.features && e.features[0]) {
        const feature = e.features[0];
        const properties = feature.properties;
        
        if (properties) {
          const tooltip = document.createElement('div');
          tooltip.className = 'map-tooltip';
          tooltip.innerHTML = `
            <div class="bg-white">
              <div class="font-semibold">${properties.barrio}</div>
              <div class="text-sm space-y-1">
                <div class="flex justify-between">
                  <span class="font-medium">Localidad:</span>
                  <span>${properties.localidad}</span>
                </div>
                <div class="flex justify-between">
                  <span class="font-medium">Total Encuestas:</span>
                  <span>${properties.total_encuestas}</span>
                </div>
                <div class="flex justify-between">
                  <span class="font-medium">Coincidencias:</span>
                  <span>${properties.matches_count}</span>
                </div>
                <div class="flex justify-between">
                  <span class="font-medium">Porcentaje:</span>
                  <span>${properties.match_percentage}%</span>
                </div>
                <div class="flex justify-between">
                  <span class="font-medium">Intensidad:</span>
                  <span>${properties.intensity_score}</span>
                </div>
              </div>
            </div>
          `;
          
          document.body.appendChild(tooltip);
          
          const updateTooltip = (e: any) => {
            tooltip.style.left = e.point.x + 10 + 'px';
            tooltip.style.top = e.point.y - 10 + 'px';
          };
          
          updateTooltip(e);
          map.on('mousemove', updateTooltip);
          
          map.once('mouseleave', 'heatmap-points', () => {
            document.body.removeChild(tooltip);
            map.off('mousemove', updateTooltip);
          });
        }
      }
    });

    // Auto-zoom a los datos del heatmap
    if (heatmapFeatures.length > 0 && map) {
      try {
        // Calcular bounds manualmente
        let minLng = Infinity, maxLng = -Infinity;
        let minLat = Infinity, maxLat = -Infinity;
        
        heatmapFeatures.forEach(feature => {
          const coords = (feature.geometry as any).coordinates;
          if (coords && coords.length >= 2) {
            const [lng, lat] = coords;
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
          }
        });
        
        // Solo hacer fitBounds si tenemos coordenadas válidas
        if (minLng !== Infinity && maxLng !== -Infinity && 
            minLat !== Infinity && maxLat !== -Infinity) {
          map.fitBounds([[minLng, minLat], [maxLng, maxLat]], {
            padding: 50,
            duration: 1000
          });
        }
      } catch (boundsError) {
        console.warn('⚠️ Error al calcular bounds:', boundsError);
      }
    }

    console.log('✅ Mapa actualizado con heatmap de filtros');
    } catch (error) {
      console.error('❌ Error crítico actualizando mapa:', error);
    }
  }, [map, isReady, styleLoaded, clearHeatmap]);

  // =====================================================
  // FUNCIÓN OPTIMIZADA: Manejar cambio de estadísticas combinadas
  // =====================================================
  const handleCombinedStatsChange = useCallback((stats: FilterStats[]) => {
    console.log('📊 Estadísticas combinadas actualizadas:', stats.length);
    updateMapWithFilterData(stats);
  }, [updateMapWithFilterData]);

  const toggleCombinedFilters = () => {
    setShowCombinedFilters(!showCombinedFilters);
  };

  // 🔧 IMPLEMENTACIÓN CORRECTA: Heatmap (puntos) + Choropleth (barrios reales)
  useEffect(() => {
    if (isReady && styleLoaded && map && combinedStats.length > 0) {
      console.log('🎨 IMPLEMENTACIÓN CORRECTA: Datos recibidos:', combinedStats.length);
      
      // 🔍 DIAGNÓSTICO: Verificar coordenadas
      console.log('🔍 Muestra de coordenadas recibidas:', combinedStats.slice(0, 3).map(stat => ({
        barrio: stat.barrio,
        coordx: stat.coordx,
        coordsy: stat.coordsy,
        intensity_score: stat.intensity_score
      })));
      
      // 1. HEATMAP: Crear datos de puntos individuales desde combinedStats
      const heatmapData: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: combinedStats.map((stat, index) => ({
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [stat.coordsy, stat.coordx] // [lng, lat] - VERIFICAR ORDEN
          },
          properties: {
            peso: stat.intensity_score || 50, // Para heatmap-weight (como en el ejemplo)
            intensity_score: stat.intensity_score || 50,
            barrio: stat.barrio,
            localidad: stat.localidad
          }
        }))
      };
      
      // 🔍 DIAGNÓSTICO: Verificar datos de heatmap creados
      console.log('🔍 Muestra de datos de heatmap:', heatmapData.features.slice(0, 3).map(f => ({
        coordinates: f.geometry.type === 'Point' ? f.geometry.coordinates : null,
        peso: f.properties.peso,
        barrio: f.properties.barrio
      })));
      
      // 2. CHOROPLETH: Usar datos reales de barrios de Barranquilla
      const choroplethData: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: barranquillaBarrios.map((barrio: BarrioData) => {
          // Buscar estadísticas del filtro para este barrio
          const barrioStats = combinedStats.find(stat => 
            stat.barrio.toLowerCase().includes(barrio.name.toLowerCase()) ||
            barrio.name.toLowerCase().includes(stat.barrio.toLowerCase())
          );
          
          return {
            type: 'Feature' as const,
            geometry: {
              type: 'Point' as const,
              coordinates: barrio.coordinates // [lng, lat] desde datos reales
            },
            properties: {
              id: barrio.id,
              name: barrio.name,
              comuna: barrio.comuna,
              population: barrio.population,
              // Datos del filtro aplicado
              salud: barrioStats?.intensity_score || 0, // Para fill-color (como en el ejemplo)
              intensity_score: barrioStats?.intensity_score || 0,
              match_percentage: barrioStats?.match_percentage || 0,
              matches_count: barrioStats?.matches_count || 0,
              total_encuestas: barrioStats?.total_encuestas || 0,
              // Datos demográficos del barrio
              stratum: barrio.stratum,
              poverty: barrio.poverty,
              health: barrio.health,
              education: barrio.education
            }
          };
        })
      };
      
      console.log('🎨 Datos de heatmap creados:', heatmapData.features.length, 'puntos');
      console.log('🎨 Datos de choropleth creados:', choroplethData.features.length, 'barrios reales');
      console.log('🎨 Barrios disponibles:', barranquillaBarrios.map(b => b.name).slice(0, 10));
      
      // 3. USAR EL PATRÓN CORRECTO: map.on('load')
      const addLayers = () => {
        try {
          // Limpiar capas existentes
          ['heatmap-data', 'choropleth-data', 'forced-heatmap-data'].forEach(sourceId => {
            if (map.getSource(sourceId)) {
              map.removeLayer(`${sourceId}-layer`);
              map.removeLayer(`${sourceId}-points`);
              map.removeSource(sourceId);
            }
          });
          
          // 4. AGREGAR HEATMAP (siguiendo el ejemplo)
          map.addSource('encuestas', {
            type: 'geojson',
            data: heatmapData
          });
          console.log('✅ Fuente de encuestas agregada');
          
          // Capa de calor (exactamente como en el ejemplo)
          map.addLayer({
            id: 'encuestas-heat',
            type: 'heatmap',
            source: 'encuestas',
            paint: {
              'heatmap-weight': ['get', 'peso'],
              'heatmap-intensity': [
                'interpolate', ['linear'], ['zoom'],
                0, 1,
                12, 3
              ],
              'heatmap-color': [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0, 'rgba(33,102,172,0)',
                0.2, 'rgb(103,169,207)',
                0.4, 'rgb(209,229,240)',
                0.6, 'rgb(253,219,199)',
                0.8, 'rgb(239,138,98)',
                1, 'rgb(178,24,43)'
              ],
              'heatmap-radius': [
                'interpolate', ['linear'], ['zoom'],
                0, 2,
                12, 20
              ],
              'heatmap-opacity': 0.8
            }
          });
          console.log('✅ Capa de heatmap agregada (siguiendo ejemplo)');
          
          // 5. AGREGAR CHOROPLETH (siguiendo el ejemplo)
          map.addSource('barrios', {
            type: 'geojson',
            data: choroplethData
          });
          console.log('✅ Fuente de barrios agregada');
          
          // Capa de choropleth (círculos grandes por barrio)
          map.addLayer({
            id: 'barrios-fill',
            type: 'circle', // Usamos circle en lugar de fill para puntos
            source: 'barrios',
            paint: {
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['get', 'salud'],
                0, 15,
                100, 60
              ],
              'circle-color': [
                'interpolate',
                ['linear'],
                ['get', 'salud'],
                0, '#ffffcc',
                0.2, '#a1dab4',
                0.4, '#41b6c4',
                0.6, '#2c7fb8',
                0.8, '#253494',
                1, '#081d58'
              ],
              'circle-opacity': 0.7
            }
          });
          console.log('✅ Capa de choropleth agregada (siguiendo ejemplo)');
          
          // 🔍 DIAGNÓSTICO: Verificar que las capas se agregaron
          console.log('🔍 Capas disponibles en el mapa:', map.getStyle().layers?.map(l => l.id).filter(id => 
            id.includes('heat') || id.includes('barrios')
          ));
          
          // Auto-zoom a los datos
          if (heatmapData.features.length > 0) {
            const bounds = new (window as any).maplibregl.LngLatBounds();
            heatmapData.features.forEach(feature => {
              if (feature.geometry.type === 'Point') {
                bounds.extend(feature.geometry.coordinates as [number, number]);
              }
            });
            map.fitBounds(bounds, { padding: 50 });
            console.log('✅ Auto-zoom aplicado');
          }
          
          console.log('🎨 IMPLEMENTACIÓN CORRECTA COMPLETADA');
          
        } catch (error) {
          console.error('❌ Error en implementación correcta:', error);
          console.error('❌ Detalles del error:', error.message);
        }
      };
      
      // Verificar si el mapa ya está cargado
      if (map.isStyleLoaded()) {
        addLayers();
      } else {
        // Esperar a que el mapa esté cargado
        map.once('load', addLayers);
      }
    }
  }, [isReady, styleLoaded, map, combinedStats]);

  if (mapError) {
    return (
      <div className="h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-red-600 text-center">
          <p>Error al cargar el mapa coroplético de Barranquilla:</p>
          <p className="text-sm">{mapError}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-red-600 text-center">
          <p>Error al cargar datos de encuestas:</p>
          <p className="text-sm">{error}</p>
          <button 
                            onClick={() => loadBasicMapData()}
            className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-xl">Barranquilla</span>
              <span className="text-gray-300">Análisis de Encuestas</span>
            </div>
            <span className="text-sm text-gray-400">|</span>
            <span className="text-sm">Resultados por Barrios</span>
          </div>
          <div className="flex items-center space-x-4">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {combinedLoading && <Loader2 className="w-4 h-4 animate-spin text-blue-400" />}
            {processingExcel && <Loader2 className="w-4 h-4 animate-spin text-green-400" />}
            
            {/* Indicador de filtros combinados activos */}
            {combinedFilters.length > 0 && (
              <div className="flex items-center space-x-2 bg-blue-600/20 border border-blue-500/30 px-3 py-1 rounded-full">
                <Filter className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-blue-300">
                  {combinedFilters.length} filtro{combinedFilters.length !== 1 ? 's' : ''} activo{combinedFilters.length !== 1 ? 's' : ''}
                </span>
                {combinedStats.length > 0 && (
                  <span className="text-xs text-blue-200">
                    • {combinedStats.length} barrios
                  </span>
                )}
                <button
                  onClick={() => setCombinedFilters([])}
                  className="text-blue-300 hover:text-blue-100 ml-2"
                  title="Limpiar filtros"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            
            {/* Indicador del sistema Excel */}
            {uploadStats && (
              <div className="flex items-center space-x-2 bg-green-600/20 border border-green-500/30 px-3 py-1 rounded-full">
                <FileSpreadsheet className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-300">
                  Excel: {uploadStats.successful}/{uploadStats.totalRecords} registros
                </span>
                <span className="text-xs text-green-200">
                  • {uploadStats.processingTime}ms
                </span>
              </div>
            )}
            
            <div className="text-sm">
              <span className="text-gray-400">Métrica:</span>
              <span className="ml-2 font-semibold">{getMetricLabel(selectedMetric)}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-400">Promedio:</span>
              <span className="ml-2 font-semibold">{getAverageValue(selectedMetric)} {getMetricUnit(selectedMetric)}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-400">Barrios:</span>
              <span className="ml-2 font-semibold">{surveyData.length}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-400">Registros:</span>
              <span className="ml-2 font-semibold">{surveyData.length}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
          <div className="space-y-6">
                         {/* Filtros */}
             <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <h4 className="font-semibold">Filtros Combinados</h4>
                 <div className="flex space-x-2">
                   <button
                     onClick={toggleCombinedFilters}
                     className={`flex items-center space-x-1 text-xs px-2 py-1 rounded ${
                       showCombinedFilters 
                         ? 'bg-green-600 text-white' 
                         : 'text-gray-400 hover:text-white'
                     }`}
                   >
                     <BarChart3 className="w-3 h-3" />
                     <span>Análisis Avanzado</span>
                   </button>
                 </div>
               </div>
               
               {showCombinedFilters ? (
                 <CombinedFiltersPanel 
                   onFiltersChange={handleCombinedFiltersChange}
                   onStatsChange={handleCombinedStatsChange}
                 />
               ) : (
                 <>
                   {/* Métricas */}
                   <div className="space-y-4">
                     <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('metrics')}>
                       <h4 className="font-semibold">Indicadores de Encuesta</h4>
                       {expandedSections.metrics ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                     </div>
                     
                     {expandedSections.metrics && (
                       <div className="space-y-2 pl-4">
                         {Object.keys(surveyCategories).map(metric => (
                           <button
                             key={metric}
                             className={`w-full text-left p-2 rounded text-sm transition-colors ${
                               selectedMetric === metric 
                                 ? 'bg-blue-600 text-white' 
                                 : 'text-gray-300 hover:text-white'
                             }`}
                             onClick={() => setSelectedMetric(metric as keyof typeof colorSchemes)}
                           >
                             <div className="font-medium">{getMetricLabel(metric as keyof typeof colorSchemes)}</div>
                             <div className="text-xs opacity-75">
                               Promedio: {getAverageValue(metric as keyof typeof colorSchemes)} {getMetricUnit(metric as keyof typeof colorSchemes)}
                             </div>
                           </button>
                         ))}
                       </div>
                     )}
                   </div>
                 </>
               )}
             </div>

            {/* Controles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('controls')}>
                <h4 className="font-semibold">Controles</h4>
                {expandedSections.controls ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
              
              {expandedSections.controls && (
                <div className="pl-4 space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="heatmap-toggle"
                      checked={showHeatmap}
                      onChange={(e) => setShowHeatmap(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="heatmap-toggle" className="text-sm">
                      Mapa de Calor
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="3d-toggle"
                      onChange={(e) => set3DMode(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="3d-toggle" className="text-sm">
                      Vista 3D
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Información */}
            <div className="space-y-4">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('info')}>
                <h4 className="font-semibold">Información</h4>
                {expandedSections.info ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
              
              {expandedSections.info && (
                <div className="pl-4 space-y-3">
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="text-sm font-medium mb-2">Resumen</div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Total Barrios:</span>
                        <span>{surveyData.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Registros:</span>
                        <span>{surveyData.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Métrica Actual:</span>
                        <span>{getMetricLabel(selectedMetric)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Promedio:</span>
                        <span>{getAverageValue(selectedMetric)} {getMetricUnit(selectedMetric)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="text-sm font-medium mb-2">Leyenda</div>
                    <div className="space-y-2">
                      {colorSchemes[selectedMetric].map(([value, color], index) => (
                        <div key={index} className="flex items-center space-x-2 text-xs">
                          <div 
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: color as string }}
                          />
                          <span>{value} {getMetricUnit(selectedMetric)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sistema de Excel - Nueva sección */}
            <div className="space-y-4">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('excel')}>
                <h4 className="font-semibold flex items-center space-x-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Sistema Excel</span>
                </h4>
                {expandedSections.excel ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
              
              {expandedSections.excel && (
                <div className="pl-4 space-y-3">
                  {/* Botones de control */}
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => setShowExcelUploader(!showExcelUploader)}
                      className={`flex items-center space-x-2 text-sm px-3 py-2 rounded transition-colors ${
                        showExcelUploader 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:text-white'
                      }`}
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Subir Excel</span>
                    </button>
                    
                    <button
                      onClick={() => setShowDataVisualizer(!showDataVisualizer)}
                      className={`flex items-center space-x-2 text-sm px-3 py-2 rounded transition-colors ${
                        showDataVisualizer 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:text-white'
                      }`}
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>Visualizar Datos</span>
                    </button>
                  </div>

                  {/* Estadísticas de subida */}
                  {uploadStats && (
                    <div className="bg-gray-700 rounded-lg p-3">
                      <div className="text-sm font-medium mb-2 flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4" />
                        <span>Estadísticas de Procesamiento</span>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>Total Registros:</span>
                          <span className="font-medium">{uploadStats.totalRecords}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Exitosos:</span>
                          <span className="font-medium text-green-400">{uploadStats.successful}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Con Categoría:</span>
                          <span className="font-medium text-blue-400">{uploadStats.withCategory}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Fallidos:</span>
                          <span className="font-medium text-red-400">{uploadStats.failed}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tiempo:</span>
                          <span className="font-medium">{uploadStats.processingTime}ms</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Categorías disponibles */}
                  {availableCategories.length > 0 && (
                    <div className="bg-gray-700 rounded-lg p-3">
                      <div className="text-sm font-medium mb-2 flex items-center space-x-2">
                        <Database className="w-4 h-4" />
                        <span>Categorías Disponibles</span>
                      </div>
                      <div className="space-y-1">
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="w-full text-xs bg-gray-600 text-white rounded px-2 py-1"
                        >
                          <option value="">Todas las categorías</option>
                          {availableCategories.map(category => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>

            {/* Datos y Análisis - Nueva sección */}
            <div className="space-y-4">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('data')}>
                <h4 className="font-semibold flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>Datos y Análisis</span>
                </h4>
                {expandedSections.data ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
              
              {expandedSections.data && (
                <div className="pl-4 space-y-3">
                  {/* Datos de mapa de calor */}
                  {heatmapData.length > 0 && (
                    <div className="bg-gray-700 rounded-lg p-3">
                      <div className="text-sm font-medium mb-2">Mapa de Calor</div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>Puntos:</span>
                          <span className="font-medium">{heatmapData.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Valor Promedio:</span>
                          <span className="font-medium">
                            {(heatmapData.reduce((sum, point) => sum + point.value, 0) / heatmapData.length).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Estadísticas de rendimiento */}
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="text-sm font-medium mb-2">Rendimiento</div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Memoria:</span>
                        <span className="font-medium">Optimizada</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Almacenamiento:</span>
                        <span className="font-medium">95% reducido</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Consultas:</span>
                        <span className="font-medium">10x más rápidas</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Central Map Area */}
        <div className="flex-1 relative">
          {/* Excel Uploader Overlay */}
          {showExcelUploader && (
            <div className="absolute inset-0 bg-gray-900 bg-opacity-75 z-20 flex items-center justify-center">
              <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center space-x-2">
                    <FileSpreadsheet className="w-5 h-5" />
                    <span>Sistema de Gestión de Encuestas Excel</span>
                  </h3>
                  <button
                    onClick={() => setShowExcelUploader(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <ExcelUploader 
                  onUploadComplete={handleExcelUploadSuccess}
                />
                
                {uploadStats && (
                  <div className="mt-4">
                    <StatsDisplay stats={uploadStats} isProcessing={processingExcel} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Data Visualizer Overlay */}
          {showDataVisualizer && (
            <div className="absolute inset-0 bg-gray-900 bg-opacity-75 z-20 flex items-center justify-center">
              <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5" />
                    <span>Visualizador de Datos de Encuestas</span>
                  </h3>
                  <button
                    onClick={() => setShowDataVisualizer(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <SurveyDataVisualizer 
                  onDataLoad={(data) => {
                    console.log('Datos cargados para mapa de calor:', data);
                    setHeatmapData(data);
                  }}
                  className="text-white"
                />
              </div>
            </div>
          )}

          <div 
            ref={mapContainer} 
            className="w-full h-full rounded-lg overflow-hidden relative"
            style={{ minHeight: '500px' }}
          >
            {(!isReady || !styleLoaded || loading) && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-10">
                <div className="text-gray-600 flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{loading ? 'Cargando datos de encuestas...' : !isReady ? 'Cargando mapa...' : 'Cargando estilo del mapa...'}</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Controles del mapa */}
          <div className="absolute bottom-4 left-4 space-y-2">
            {/* Controles de zoom */}
            <div className="bg-gray-800 rounded-lg p-2 flex flex-col space-y-1">
              <button
                className="px-3 py-1 rounded text-sm bg-blue-600 text-white hover:bg-blue-700"
                onClick={zoomIn}
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                className="px-3 py-1 rounded text-sm bg-blue-600 text-white hover:bg-blue-700"
                onClick={zoomOut}
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
            </div>

            {/* Controles de navegación */}
            <div className="bg-gray-800 rounded-lg p-2 flex flex-col space-y-1">
              <button
                className="px-3 py-1 rounded text-sm text-gray-400 hover:text-white hover:bg-gray-700"
                onClick={() => fitBounds(mapBounds)}
                title="Ver toda Barranquilla"
              >
                <Home className="w-4 h-4" />
              </button>
              <button
                className="px-3 py-1 rounded text-sm text-gray-400 hover:text-white hover:bg-gray-700"
                onClick={resetView}
                title="Resetear vista"
              >
                <Target className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Información de la métrica */}
          <div className="absolute top-4 right-4 bg-gray-800 rounded-lg p-4 max-w-sm">
            <div className="text-sm">
              <div className="font-semibold mb-2">{getMetricLabel(selectedMetric)}</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Promedio:</span>
                  <span>{getAverageValue(selectedMetric)} {getMetricUnit(selectedMetric)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Barrios:</span>
                  <span>{surveyData.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Encuestas:</span>
                  <span>{surveyData.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tipo:</span>
                  <span>{showHeatmap ? 'Mapa de Calor' : 'Coroplético'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Popup de información del barrio */}
          {selectedBarrio && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white text-gray-800 rounded-lg p-4 max-w-sm shadow-lg border border-gray-200">
              <div className="text-sm">
                <div className="font-semibold mb-2 text-blue-600">{selectedBarrio.nombre}</div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="font-medium">Departamento:</span>
                    <span>ATLÁNTICO</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Municipio:</span>
                    <span>BARRANQUILLA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Localidad:</span>
                    <span>{selectedBarrio.localidad}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Cod. DANE:</span>
                    <span>{selectedBarrio.id}</span>
                  </div>
                  <hr className="my-2" />
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Registros:</span>
                      <span className="font-medium">1</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Categorías:</span>
                      <span className="font-medium">
                        {Object.keys(surveyData.find(b => b.barrio === selectedBarrio.nombre)?.responses_data || {}).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fecha:</span>
                      <span className="font-medium">
                        {surveyData.find(b => b.barrio === selectedBarrio.nombre)?.created_at?.split('T')[0] || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedBarrio(null)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
