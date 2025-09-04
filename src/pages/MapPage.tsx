import React, { useState } from 'react';
import TestMap from './TestMap';
import LeftPanel from '../components/LeftPanel';
import { CombinedFilter, FilterStats } from '@/hooks/useCombinedFilters';
import '@fontsource/inter';

const MapPage: React.FC = () => {
  const [combinedFilters, setCombinedFilters] = useState<CombinedFilter[]>([]);
  const [combinedStats, setCombinedStats] = useState<FilterStats[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string>('');
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);

  const handleCombinedFiltersChange = (filters: CombinedFilter[]) => {
    const validFilters = filters.filter(f => f.questionId && f.response);
    console.log('🔍 Filtros válidos antes de enviar:', validFilters);
    if (JSON.stringify(validFilters) !== JSON.stringify(combinedFilters)) {
        setCombinedFilters(validFilters);
    }
  };

  const handleCombinedStatsChange = (stats: FilterStats[]) => {
    setCombinedStats(stats);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white font-inter">
      <header className="bg-gray-800 py-4 px-6 z-50 flex-shrink-0">
        <h1 className="text-2xl md:text-4xl font-bold text-white">
          Incluyete <span className="text-yellow-500 text-3xl md:text-5xl">+</span>
        </h1>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="bg-gray-800 p-2 md:p-4 overflow-y-auto z-40 w-64 md:w-80 flex-shrink-0 max-h-full">
          <LeftPanel
            toggleCombinedFilters={() => setShowHeatmap(!showHeatmap)}
            showCombinedFilters={showHeatmap}
            combinedFilters={combinedFilters}
            handleCombinedFiltersChange={handleCombinedFiltersChange}
            handleCombinedStatsChange={handleCombinedStatsChange}
            toggleSection={() => {}}
            expandedSections={{}}
            setShowExcelUploader={() => {}}
            showExcelUploader={false}
            setShowDataVisualizer={() => {}}
            showDataVisualizer={false}
            uploadStats={undefined}
          />
        </aside>
        <main className="relative flex-1 z-30 overflow-hidden">
          <TestMap
            combinedStats={combinedStats}
            selectedMetric={selectedMetric}
            showHeatmap={showHeatmap}
          />
        </main>
      </div>
    </div>
  );
};

export default MapPage;
