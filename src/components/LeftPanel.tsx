import React, { useState } from 'react';
import { FilteredPersonsTable } from './FilteredPersonsTable';
import { useEffect } from 'react';

import { FiBarChart, FiFileText, FiChevronDown, FiChevronRight, FiTrendingUp, FiDollarSign } from 'react-icons/fi';
import CombinedFiltersPanel from '../components/CombinedFiltersPanel';
import { useTheme } from '@/context/ThemeContext';
import IncomeAnalysis from './IncomeAnalysis';
import ExcelUploaderModal from './ExcelUploaderModal';
import ProcesarDatosModal from './ProcesarDatosModal';
import { CombinedFilter } from '../hooks/useCombinedFilters';
import { supabase } from '@/integrations/supabase/client';
import ExportFilteredPersonsExcel from './ExportFilteredPersonsExcel';

interface LeftPanelProps {
  toggleCombinedFilters: () => void;
  showCombinedFilters: boolean;
  combinedFilters: CombinedFilter[];
  handleCombinedFiltersChange: (filters: CombinedFilter[]) => void;
  handleCombinedStatsChange: (stats: any) => void;
  toggleSection: (section: string) => void;
  expandedSections: { [key: string]: boolean };
  setShowExcelUploader: (show: boolean) => void;
  showExcelUploader: boolean;
  setShowDataVisualizer: (show: boolean) => void;
  showDataVisualizer: boolean;
  uploadStats?: {
    totalRecords: number;
    successful: number;
    withCategory: number;
    failed: number;
  };
  className?: string;
  mapViewType: 'poligonos' | 'puntos';
}

const LeftPanel: React.FC<LeftPanelProps> = ({
  toggleCombinedFilters,
  showCombinedFilters,
  combinedFilters,
  handleCombinedFiltersChange,
  handleCombinedStatsChange,
  toggleSection,
  expandedSections,
  setShowExcelUploader,
  showExcelUploader,
  setShowDataVisualizer,
  showDataVisualizer,
  uploadStats,
  className,
  mapViewType
}) => {
  const [isUploaderModalOpen, setIsUploaderModalOpen] = useState(false);
  const [isProcesarModalOpen, setIsProcesarModalOpen] = useState(false);
  const [loadingProcesar, setLoadingProcesar] = useState(false);
  // Backend-driven filter readiness and table data
  const [filtersReady, setFiltersReady] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [tableRows, setTableRows] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 1000;
  // Track total filtered count for pagination
  const [filteredCount, setFilteredCount] = useState(0);
  const { theme } = useTheme();

  const handleUploadComplete = (stats: any) => {
    // Actualizamos las estadísticas
    if (stats) {
      console.log('📊 Upload completado:', stats);
    }
    setIsUploaderModalOpen(false);
  };
  // Simulate backend filter queries (replace with your actual RPC calls)
  useEffect(() => {
    async function fetchFilterOptions() {
      setFiltersReady(false);
      setGlobalLoading(true);
      // Simulate backend filter queries
      console.log('🔄 Consultando opciones y conteos de filtros en backend...');
      // TODO: Replace with actual Supabase RPC calls for filter options/counts
      await new Promise(res => setTimeout(res, 800));
      setFiltersReady(true);
      setGlobalLoading(false);
      console.log('✅ Opciones y conteos de filtros listos (backend)');
    }
    fetchFilterOptions();
  }, [combinedFilters]);

  // Fetch paginated filtered data and total count from backend when table is shown
  useEffect(() => {
    async function fetchTableData() {
      if (!modalOpen || !filtersReady || combinedFilters.length === 0) return;
      setTableLoading(true);
      setGlobalLoading(true);
      console.log('🔄 Consultando datos filtrados en backend (página', page + 1, ')...');
      try {
        // Consulta los datos paginados
        const { data, error } = await supabase.rpc('get_filtered_persons_with_coords', {
          filters: combinedFilters,
          limit_rows: PAGE_SIZE,
          offset_rows: page * PAGE_SIZE
        });
        // Consulta el total de registros filtrados
        const { data: totalData, error: errorCount } = await supabase.rpc('count_filtered_persons_with_coords', {
          filters: combinedFilters
        });
        if (error) {
          console.error('❌ Error consultando datos filtrados:', error.message);
          setTableRows([]);
        } else {
          setTableRows(data || []);
          console.log('✅ Datos filtrados recibidos (backend):', data ? data.length : 0);
        }
        if (errorCount) {
          console.error('❌ Error consultando total filtrado:', errorCount.message);
          setFilteredCount(0);
        } else {
          setFilteredCount(totalData ?? 0);
        }
      } catch (err) {
        console.error('❌ Error inesperado:', err);
        setTableRows([]);
        setFilteredCount(0);
      }
      setTableLoading(false);
      setGlobalLoading(false);
    }
    fetchTableData();
  }, [modalOpen, filtersReady, combinedFilters, page]);

  return (
    <>
      {globalLoading && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black bg-opacity-40">
          <div className="flex flex-col items-center justify-center">
            <span className="animate-spin text-yellow-500 text-5xl mb-4">⏳</span>
            <span className="text-xl font-semibold text-white">Cargando datos, por favor espere...</span>
          </div>
        </div>
      )}
      <div className={`w-full ${className}`}>
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
                    : theme === 'dark'
                      ? 'text-gray-400 hover:text-white'
                      : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FiBarChart className="w-3 h-3" />
                <span>Análisis Avanzado</span>
              </button>
            </div>
          </div>
          
          {(mapViewType === 'poligonos' || mapViewType === 'puntos') && showCombinedFilters ? (
            <>
              <CombinedFiltersPanel 
                onFiltersChange={handleCombinedFiltersChange}
                onStatsChange={handleCombinedStatsChange}
              />
              {/* Botón para ver tabla de datos solo si filtros están listos y hay filtros activos */}
              {mapViewType === 'poligonos' && (
                <div className="flex flex-col gap-2 mt-4">
                  <button
                    className={`px-4 py-2 rounded font-semibold flex items-center justify-center gap-2 shadow ${filtersReady && combinedFilters.length > 0 ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-400 text-gray-200 cursor-not-allowed'}`}
                    onClick={() => {
                      if (filtersReady && combinedFilters.length > 0) setModalOpen(true);
                    }}
                    disabled={!filtersReady || combinedFilters.length === 0}
                  >
                    <FiBarChart className="w-5 h-5" />
                    {filtersReady ? 'Mostrar datos de la tabla' : 'Cargando filtros...'}
                  </button>
                  <ExportFilteredPersonsExcel combinedFilters={combinedFilters} />
                </div>
              )}
              {/* Modal grande para la tabla de datos */}
              {mapViewType === 'poligonos' && modalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60">
                  <div className="bg-white rounded-lg shadow-lg w-[90vw] h-[80vh] flex flex-col z-[101]">
                    <div className="flex justify-between items-center p-4 border-b">
                      <h2 className="text-xl font-bold">Tabla de Datos Filtrados</h2>
                      <button
                        className="px-3 py-1 rounded-lg font-semibold border border-yellow-500 bg-yellow-400 text-black hover:bg-yellow-500 hover:border-yellow-600 transition-colors shadow-sm"
                        onClick={() => setModalOpen(false)}
                        title="Cerrar"
                      >
                        <span className="font-bold">✕</span> <span className="ml-1">Cerrar</span>
                      </button>
                    </div>
                    <div className="flex-1 overflow-auto p-4">
                      {tableLoading ? (
                        <div className="flex flex-col items-center justify-center py-8 text-lg">
                          <span className="animate-spin text-blue-600 text-3xl mb-2">⏳</span>
                          <span className="text-gray-700">Cargando datos filtrados...</span>
                        </div>
                      ) : (
                        <>
                          <FilteredPersonsTable
                            data={tableRows.map(row => {
                              // Extraer los datos relevantes del objeto recibido
                              const otros = row.responses_data?.OTROS || {};
                              return {
                                nombre: `${otros["PRIMER NOMBRE"] || ""} ${otros["SEGUNDO NOMBRE"] || ""} ${otros["PRIMER APELLIDO"] || ""} ${otros["SEGUNDO APELLIDO"] || ""}`.trim(),
                                sexo: otros["¿Qué sexo le fue asignado al nacer en su certificado de nacimiento / en el certificado de nacimiento de la persona con discapacidad?"] || otros["¿Cuál es su identidad de género / la identidad de género de la persona con discapacidad actualmente?"] || "",
                                direccion: row.address || "",
                                celular: otros["Celular 1"] || "",
                                barrio: row.barrio || "",
                              };
                            })}
                          />
                          {/* Paginación visual */}
                          <div className="flex justify-center items-center gap-2 mt-4">
                            <button
                              className="px-3 py-1 rounded border border-gray-300 bg-white text-black hover:bg-gray-100 disabled:opacity-50"
                              onClick={() => setPage(p => Math.max(0, p - 1))}
                              disabled={page === 0 || tableLoading}
                            >Anterior</button>
                            <span className="text-black text-sm font-medium">Página {page + 1} de {Math.max(1, Math.ceil(filteredCount / PAGE_SIZE))}</span>
                            <button
                              className="px-3 py-1 rounded border border-gray-300 bg-white text-black  hover:bg-gray-100 disabled:opacity-50"
                              onClick={() => setPage(p => p + 1)}
                              disabled={(page + 1) * PAGE_SIZE >= filteredCount || tableLoading}
                            >Siguiente</button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg p-3`}>
              <div className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Seleccione Análisis Avanzado
              </div>
              <div className={`space-y-1 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                <p>Utilice la opción de Análisis Avanzado para aplicar filtros y visualizar datos en el mapa.</p>
              </div>
            </div>
          )}
        </div>

        {/* Espacio adicional para separación de secciones */}
        <div className="h-4"></div>

        {/* Análisis de Ingresos */}
        <div className="space-y-4">
         
          
          {expandedSections.income && (
            <IncomeAnalysis 
              onFilterChange={handleCombinedFiltersChange}
              onUpdateStats={handleCombinedStatsChange}
            />
          )}
        </div>

        {/* Sistema de Excel - Nueva sección */}
        <div className="space-y-4">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('excel')}>
            <h4 className="font-semibold flex items-center space-x-2">
              <FiFileText className="w-4 h-4" />
              <span>Sistema Excel</span>
            </h4>
            {expandedSections.excel ? <FiChevronDown className="w-4 h-4" /> : <FiChevronRight className="w-4 h-4" />}
          </div>
          
          {expandedSections.excel && (
            <div className="pl-4 space-y-3">
              {/* Botones de control */}
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => setIsUploaderModalOpen(true)}
                  className={`flex items-center space-x-2 text-sm px-3 py-2 rounded transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-700 text-gray-300 hover:text-white hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  <FiFileText className="w-4 h-4" />
                  <span>Subir Excel</span>
                </button>
                
                {/* Modal de carga de Excel */}
                <ExcelUploaderModal
                  isOpen={isUploaderModalOpen}
                  onClose={() => setIsUploaderModalOpen(false)}
                  onUploadComplete={handleUploadComplete}
                />
                
               
               
              
              </div>

              {/* Estadísticas de subida */}
              {uploadStats && (
                <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg p-3`}>
                  <div className={`text-sm font-medium mb-2 flex items-center space-x-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    <FiTrendingUp className="w-4 h-4 mr-1" />
                    <span>Estadísticas de Procesamiento</span>
                  </div>
                  <div className={`space-y-1 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    <div className="flex justify-between">
                      <span>Total Registros:</span>
                      <span className="font-medium">{uploadStats.totalRecords}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Exitosos:</span>
                      <span className={`font-medium ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                        {uploadStats.successful}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Con Categoría:</span>
                      <span className={`font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                        {uploadStats.withCategory}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fallidos:</span>
                      <span className={`font-medium ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                        {uploadStats.failed}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default LeftPanel;
