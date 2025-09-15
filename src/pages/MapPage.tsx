import React, { useState, useCallback, useEffect } from 'react';
// Warm-up: consulta rápida a Supabase para preparar la base de datos
import { createClient } from '@supabase/supabase-js';
// Configura tu URL y API KEY de Supabase

import { useBarriosStats } from '../hooks/useBarriosStats';
import TestMap from './TestMap';
import LeftPanel from '../components/LeftPanel';
import { CombinedFilter, FilterStats, useCombinedFilters } from '@/hooks/useCombinedFilters';
import { useTheme } from '@/context/ThemeContext';
import RightSidebarTop10Barrios from '../components/RightSidebarTop10Barrios';
import RightSidebarGeneralBarrios from '../components/RightSidebarGeneralBarrios';

import ThemeToggleButton from '@/components/ui/ThemeToggleButton';
import DataVisualization from './DataVisualization';
import '@fontsource/inter';
import { supabase } from '@/integrations/supabase/client';
import LoadingModal from '../components/LoadingModal';

const MapPage: React.FC = () => {
  // Estado para alternar entre vista de polígonos y puntos
  const [mapViewType, setMapViewType] = useState<'poligonos' | 'puntos'>('poligonos');
  // Eliminado: ya no se usa precálculo global ni su estado
  // Estado para la pregunta y caché
  const [questionCache, setQuestionCache] = useState<any[]>([]);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [questionLoaded, setQuestionLoaded] = useState(false);

  // Consulta la caché al montar
  useEffect(() => {
  // Eliminar lógica hardcodeada: categoría y pregunta deben venir de props, estado, o interacción
  }, []);
  // Estado para mostrar mensaje de carga y éxito
  // const [loadingQuestion, setLoadingQuestion] = useState(true);
  // const [questionLoaded, setQuestionLoaded] = useState(false);

  // Consulta repetida a la función get_responses_by_question_simple
  /*
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let stopped = false;
    const fetchQuestion = async () => {
      try {
        // Llama a la función de Supabase
        const { data, error } = await supabase.rpc('get_responses_by_question_simple', {
          category_name: 'TIPO DE DISCAPACIDAD',
          question_id: 'Pensar, memorizar'
        });
        if (data && !error) {
          setLoadingQuestion(false);
          setQuestionLoaded(true);
          stopped = true;
          clearInterval(intervalId);
        }
      } catch (e) {
        // Silenciar error
      }
    };
    // Ejecuta la primera vez
    fetchQuestion();
    // Repite cada 15 segundos hasta obtener respuesta
    intervalId = setInterval(() => {
      if (!stopped) fetchQuestion();
    }, 15000);
    return () => clearInterval(intervalId);
  }, []);
  */
  const [activeTab, setActiveTab] = useState<'map' | 'visualization'>('map');
  const [combinedFilters, setCombinedFilters] = useState<CombinedFilter[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string>('');
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
  const { theme } = useTheme();
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  // Importar el estado de carga de preguntas desde el hook de filtros combinados
  // Si usas useCombinedFiltersOptimizado, cambia el import aquí
  const { statsLoading } = useCombinedFilters();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    if (statsLoading) {
      setShowLoadingModal(true);
      // Si tarda más de 20 segundos, recarga la página
      timeoutId = setTimeout(() => {
        window.location.reload();
      }, 20000);
    } else {
      setShowLoadingModal(false);
      if (timeoutId) clearTimeout(timeoutId);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [statsLoading]);
  const [retryData, setRetryData] = useState<any>(null);

  // Estado para datos generales y filtrados
  const [generalBarriosStats, setGeneralBarriosStats] = useState<any[]>([]);
  const [barriosStats, setBarriosStats] = useState<any[]>([]);
  const [generalStatsLoading, setGeneralStatsLoading] = useState(false);

  // Cargar datos generales al iniciar o cuando no hay filtros y la vista es polígonos
  useEffect(() => {
    if (mapViewType === 'poligonos' && combinedFilters.length === 0) {
      setGeneralStatsLoading(true);
      supabase.rpc('get_survey_response_stats_by_barrio')
        .then(({ data, error }) => {
          if (!error && Array.isArray(data)) {
            setGeneralBarriosStats(data);
          } else {
            setGeneralBarriosStats([]);
          }
          setGeneralStatsLoading(false);
        });
    }
  }, [mapViewType, combinedFilters]);

  // Sincronizar stats cuando cambian los filtros
  const handleCombinedStatsChange = useCallback((stats: FilterStats[]) => {
    setBarriosStats(stats);
  }, [setBarriosStats]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleCombinedFiltersChange = useCallback((filters: CombinedFilter[]) => {
    const validFilters = filters.filter(f => f.questionId && f.response);
    if (JSON.stringify(validFilters) !== JSON.stringify(combinedFilters)) {
      setCombinedFilters(validFilters);
    }
  }, [combinedFilters]);

  // Handler para error de 'map'
  const handleMapError = useCallback((dataToRetry) => {
    setShowLoadingModal(true);
    setRetryData(dataToRetry);
    setTimeout(() => {
      // Reintentar la función con los mismos datos
      // Aquí deberías llamar a la función que falló, por ejemplo:
      // applyCombinedFilters(retryData);
      setShowLoadingModal(false);
    }, 20000);
  }, []);

  return (
  <>
      <LoadingModal visible={showLoadingModal} message="Se están cargando el total de respuestas para estas preguntas, espere por favor..." />
      {/* Eliminado: banner de precálculo global */}
      <div className={`h-screen flex flex-col ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} font-inter`}>
  {/* Eliminado: mensaje de carga de pregunta */}
        <header className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white border-b border-gray-200'} z-50 flex-shrink-0`}>
          <div className="py-4 px-6 flex justify-between items-center">
            <h1 className={`text-2xl md:text-4xl font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              <span style={{fontWeight:700, fontFamily:'inherit', letterSpacing:'-1px'}}>
                <span style={{textTransform:'capitalize'}}>Incl</span>
                <span style={{color: theme === 'dark' ? '#fff' : '#111', fontWeight:700}}>ú</span>
                <span style={{textTransform:'lowercase'}}>ye</span>
                <span style={{color: theme === 'dark' ? '#fff' : '#111', fontWeight:700}}>TE</span>
              </span>
              <span className="text-yellow-500 text-3xl md:text-5xl" style={{fontWeight:900, marginLeft:4}}>+</span>
            </h1>
            <div className="flex items-center gap-4">
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('map')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'map' 
                      ? 'bg-yellow-500 text-gray-900' 
                      : theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  Mapa
                </button>
                <button
                  onClick={() => setActiveTab('visualization')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'visualization' 
                      ? 'bg-yellow-500 text-gray-900' 
                      : theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  Visualización
                </button>
              </div>
              <ThemeToggleButton />
              <button
                className="ml-4 px-3 py-1 rounded bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
                onClick={() => {
                  localStorage.removeItem('incluyete_logged');
                  sessionStorage.clear();
                  window.location.href = '/login';
                }}
                title="Cerrar sesión"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        {combinedFilters.length > 0 && (
          <div className="border-t border-gray-700 z-0">
            <div className="p-3  text-white text-sm flex items-center justify-between z-0">
              <div className="flex items-center gap-2 flex-wrap z-0">
                {combinedFilters.map((filter, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-2 bg-gray-700 text-white text-sm px-3 py-1.5 rounded-full "
                  >
                    <span className="text-gray-300">{filter.questionText || filter.questionId}:</span>
                    <span>{filter.response}</span>
                   
                  </div>
                ))}

              </div>
            </div>
          </div>
        )}
      </header>
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar izquierdo */}
        <aside className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white border-r border-gray-200'} p-2 md:p-4 overflow-y-auto z-4 w-64 md:w-80 flex-shrink-0 max-h-full relative`}>
          <LeftPanel
            toggleCombinedFilters={() => setShowHeatmap(!showHeatmap)}
            showCombinedFilters={showHeatmap}
            combinedFilters={combinedFilters}
            handleCombinedFiltersChange={setCombinedFilters}
            handleCombinedStatsChange={handleCombinedStatsChange}
            toggleSection={toggleSection}
            expandedSections={expandedSections}
            setShowExcelUploader={() => {}}
            showExcelUploader={false}
            setShowDataVisualizer={() => {}}
            showDataVisualizer={false}
            uploadStats={undefined}
            mapViewType={mapViewType}
          />
          {/* El botón cerrar sesión ahora está en el header */}
        </aside>
        {/* Contenido principal */}
        <div className="flex-1 flex flex-col relative" style={{ minWidth: 0 }}>
          <main className="relative flex-1 z-30 overflow-hidden">
            {activeTab === 'map' ? (
              <TestMap
                combinedStats={
                  mapViewType === 'poligonos' && combinedFilters.length === 0
                    ? generalBarriosStats
                    : barriosStats
                }
                selectedMetric={selectedMetric}
                showHeatmap={showHeatmap}
                mapViewType={mapViewType}
                setMapViewType={setMapViewType}
                combinedFilters={combinedFilters}
              />
            ) : (
              <div className="h-full overflow-y-auto px-6">
                <DataVisualization
                  data={combinedFilters.length === 0 ? generalBarriosStats : barriosStats}
                  activeFilters={combinedFilters}
                />
              </div>
            )}
          </main>
        </div>
        {/* Sidebar derecho fijo solo en vista de mapa */}
        {activeTab === 'map' && (
          <div style={{ position: 'fixed', right: 0,  height: 'calc(100vh - 112px)', zIndex: 30, width: 340, maxWidth: '90vw', background: theme === 'dark' ? '#1f2937' : '#fff', boxShadow: '-2px 0 8px rgba(0,0,0,0.1)', borderLeft: theme === 'dark' ? '1px solid #23272f' : '1px solid #e5e7eb', padding: '20px 24px', overflowY: 'auto' }}>
            {((mapViewType === 'poligonos' || mapViewType === 'puntos') && combinedFilters.length === 0)
              ? <RightSidebarGeneralBarrios data={generalBarriosStats} headerHeight={112} />
              : <RightSidebarTop10Barrios data={barriosStats} headerHeight={112} />
            }
          </div>
        )}
      </div>
      </div>
    </>
  );
};
export default MapPage;
