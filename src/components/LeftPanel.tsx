import React, { useState } from 'react';
import { FiBarChart, FiFileText, FiChevronDown, FiChevronRight, FiTrendingUp, FiDollarSign } from 'react-icons/fi';
import CombinedFiltersPanel from '../components/CombinedFiltersPanel';
import { useTheme } from '@/context/ThemeContext';
import IncomeAnalysis from './IncomeAnalysis';
import ExcelUploaderModal from './ExcelUploaderModal';
import { CombinedFilter } from '../hooks/useCombinedFilters';

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
  className
}) => {
  const [isUploaderModalOpen, setIsUploaderModalOpen] = useState(false);
  const { theme } = useTheme();

  const handleUploadComplete = (stats: any) => {
    // Actualizamos las estadísticas
    if (stats) {
      console.log('📊 Upload completado:', stats);
    }
    setIsUploaderModalOpen(false);
  };
  return (
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
          
          {showCombinedFilters ? (
            <>
              <CombinedFiltersPanel 
                onFiltersChange={handleCombinedFiltersChange}
                onStatsChange={handleCombinedStatsChange}
              />
              

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
                
                <button
                  onClick={() => setShowDataVisualizer(!showDataVisualizer)}
                  className={`flex items-center space-x-2 text-sm px-3 py-2 rounded transition-colors ${
                    showDataVisualizer 
                      ? 'bg-blue-600 text-white' 
                      : theme === 'dark'
                        ? 'bg-gray-700 text-gray-300 hover:text-white'
                        : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  <FiBarChart className="w-4 h-4" />
                  <span>Visualizar Datos</span>
                </button>
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
  );
};

export default LeftPanel;
