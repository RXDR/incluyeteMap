import React, { useState, useCallback } from 'react';
import { useBarriosStats } from '../hooks/useBarriosStats';
import TestMap from './TestMap';
import LeftPanel from '../components/LeftPanel';
import { CombinedFilter, FilterStats } from '@/hooks/useCombinedFilters';
import { useTheme } from '@/context/ThemeContext';
import RightSidebarTop10Barrios from '../components/RightSidebarTop10Barrios';
import ActiveFiltersHeader from '../components/ActiveFiltersHeader';
import ThemeToggleButton from '@/components/ui/ThemeToggleButton';
import DataVisualization from './DataVisualization';
import '@fontsource/inter';

const MapPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'map' | 'visualization'>('map');
  const [combinedFilters, setCombinedFilters] = useState<CombinedFilter[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string>('');
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
  const { theme } = useTheme();

  // Usar el hook global para manejar stats
  const {
    stats: barriosStats,
    setStats: setBarriosStats,
    totals: generalTotals,
    top10Barrios
  } = useBarriosStats([]);

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

  return (
  <div className={`h-screen flex flex-col ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} font-inter`}>
        <header className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white border-b border-gray-200'} z-50 flex-shrink-0`}>
          <div className="py-4 px-6 flex justify-between items-center">
            <h1 className={`text-2xl md:text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Incluyete <span className="text-yellow-500 text-3xl md:text-5xl">+</span>
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
        <aside className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white border-r border-gray-200'} p-2 md:p-4 overflow-y-auto z-4 w-64 md:w-80 flex-shrink-0 max-h-full`}>
          <LeftPanel
            toggleCombinedFilters={() => setShowHeatmap(!showHeatmap)}
            showCombinedFilters={showHeatmap}
            combinedFilters={combinedFilters}
            handleCombinedFiltersChange={handleCombinedFiltersChange}
            handleCombinedStatsChange={handleCombinedStatsChange}
            toggleSection={toggleSection}
            expandedSections={expandedSections}
            setShowExcelUploader={() => {}}
            showExcelUploader={false}
            setShowDataVisualizer={() => {}}
            showDataVisualizer={false}
            uploadStats={undefined}
          />
        </aside>
        {/* Contenido principal */}
        <div className="flex-1 flex flex-col relative" style={{ minWidth: 0 }}>
          <main className="relative flex-1 z-30 overflow-hidden">
            {activeTab === 'map' ? (
              <TestMap
                combinedStats={barriosStats}
                selectedMetric={selectedMetric}
                showHeatmap={showHeatmap}
              />
            ) : (
              <div className="h-full overflow-y-auto px-6">
                <DataVisualization
                  data={barriosStats}
                  totals={{
                    totalEncuestas: generalTotals.totalEncuestas,
                    totalCoincidencias: generalTotals.totalCoincidencias
                  }}
                  activeFilters={combinedFilters}
                />
              </div>
            )}
          </main>
        </div>
        {/* Sidebar derecho fijo solo en vista de mapa */}
        {activeTab === 'map' && (
          <div style={{ position: 'fixed', right: 0,  height: 'calc(100vh - 112px)', zIndex: 30, width: 340, maxWidth: '90vw', background: theme === 'dark' ? '#1f2937' : '#fff', boxShadow: '-2px 0 8px rgba(0,0,0,0.1)', borderLeft: theme === 'dark' ? '1px solid #23272f' : '1px solid #e5e7eb', padding: '20px 24px', overflowY: 'auto' }}>
            <RightSidebarTop10Barrios data={barriosStats} headerHeight={112} />
          </div>
        )}
      </div>
      </div>
  );
};export default MapPage;
