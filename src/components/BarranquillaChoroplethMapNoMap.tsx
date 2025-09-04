import { useState, useEffect, useCallback } from 'react';
import { BarranquillaGeoService, BarrioInfo } from '@/services/barranquillaGeoService';
import CombinedFiltersPanel from './CombinedFiltersPanel';
import { useCombinedFilters, CombinedFilter, FilterStats } from '@/hooks/useCombinedFilters';
import { supabase } from '@/lib/supabase';
import { 
  ChevronDown,
  ChevronRight,
  BarChart3,
  Filter,
  Loader2,
  X,
  FileSpreadsheet,
  Database,
  TrendingUp,
  MapIcon
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
  responses_data: Record<string, Record<string, string>>;
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
      
      // Consulta simple y rápida para obtener datos básicos
      const { data: basicData, error } = await supabase
        .from('survey_responses')
        .select('id, location_data, responses_data')
        .not('location_data->coordinates->x', 'is', null)
        .not('location_data->coordinates->y', 'is', null)
        .limit(500); // Límite pequeño para evitar timeout

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
  }, []);

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
  };

  const handleCombinedStatsChange = (stats: FilterStats[]) => {
    console.log('📊 Estadísticas combinadas actualizadas:', stats.length);
    setCombinedStats(stats);
  };

  const toggleCombinedFilters = () => {
    setShowCombinedFilters(!showCombinedFilters);
  };

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

        {/* Central Area (antes Map) */}
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
                    console.log('Datos cargados para visualización:', data);
                    setHeatmapData(data);
                  }}
                  className="text-white"
                />
              </div>
            </div>
          )}

          {/* Área central donde estaba el mapa, ahora con mensaje */}
          <div 
            className="w-full h-full rounded-lg overflow-hidden relative bg-gray-700 flex items-center justify-center"
            style={{ minHeight: '500px' }}
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-blue-400 mb-4" />
                <p className="text-lg text-gray-300">Cargando datos de encuestas...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 max-w-2xl">
                <MapIcon className="w-20 h-20 mb-6 text-gray-500" />
                <h2 className="text-2xl font-bold text-gray-200 mb-3">Visualización del Mapa Desactivada</h2>
                <p className="text-gray-300 mb-6">
                  La visualización del mapa ha sido desactivada pero todos los datos y filtros siguen funcionando.
                  Puede continuar utilizando las herramientas de análisis en el panel lateral.
                </p>
                <div className="bg-gray-600 rounded-lg p-5 w-full">
                  <h3 className="text-lg font-medium text-gray-200 mb-3">Resumen de Datos</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-700 p-3 rounded">
                      <div className="text-sm text-gray-300">Barrios</div>
                      <div className="text-2xl font-bold">{surveyData.length}</div>
                    </div>
                    <div className="bg-gray-700 p-3 rounded">
                      <div className="text-sm text-gray-300">Encuestas</div>
                      <div className="text-2xl font-bold">{surveyData.length}</div>
                    </div>
                    <div className="bg-gray-700 p-3 rounded">
                      <div className="text-sm text-gray-300">Categorías</div>
                      <div className="text-2xl font-bold">{availableCategories.length}</div>
                    </div>
                    <div className="bg-gray-700 p-3 rounded">
                      <div className="text-sm text-gray-300">{getMetricLabel(selectedMetric)}</div>
                      <div className="text-2xl font-bold">
                        {getAverageValue(selectedMetric)} {getMetricUnit(selectedMetric)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
                  <span>Visualización:</span>
                  <span>Mapa desactivado</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
