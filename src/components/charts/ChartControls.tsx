import React from 'react';

interface FilterOptions {
  minEncuestas: number;
  maxEncuestas: number;
  minMatches: number;
  maxMatches: number;
}

interface ChartControlsProps {
  chartType: 'bar' | 'pie' | 'line' | 'area';
  showPercentage: boolean;
  dataView: 'top10' | 'all' | 'comparison';
  onChartTypeChange: (type: 'bar' | 'pie' | 'line' | 'area') => void;
  onShowPercentageChange: (show: boolean) => void;
  onDataViewChange: (view: 'top10' | 'all' | 'comparison') => void;
  onDownloadData: () => void;
  onExportChart: () => void;
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  isLoading: boolean;
}

const ChartControls: React.FC<ChartControlsProps> = ({
  chartType,
  showPercentage,
  dataView,
  onChartTypeChange,
  onShowPercentageChange,
  onDataViewChange,
  onDownloadData,
  onExportChart,
  filters,
  onFiltersChange,
  isLoading,
}) => {
  return (
    <div className="flex flex-col gap-4 p-4 bg-card rounded-lg mb-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tipo de Vista */}
        

        {/* Tipo de Gráfico */}
        <div className="space-y-2">
          <label className="text-muted-foreground text-sm block">Tipo de Gráfico:</label>
          <select
            value={chartType}
            onChange={(e) => onChartTypeChange(e.target.value as 'bar' | 'pie' | 'line' | 'area')}
            className="w-full bg-secondary text-secondary-foreground rounded px-3 py-2 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="bar">Barras</option>
            <option value="pie">Circular</option>
            
          </select>
        </div>

        {/* Tipo de Datos */}
        <div className="space-y-2">
          <label className="text-muted-foreground text-sm block">Mostrar:</label>
          <select
            value={showPercentage ? "percentage" : "absolute"}
            onChange={(e) => onShowPercentageChange(e.target.value === "percentage")}
            className="w-full bg-secondary text-secondary-foreground rounded px-3 py-2 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="absolute">Valores absolutos</option>
            <option value="percentage">Porcentajes</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end space-x-4 mt-4">
       
        <button
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          onClick={onExportChart}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
              <span>Exportando...</span>
            </>
          ) : (
            <>📊 Exportar Gráfico</>
          )}
        </button>
      </div>
    </div>
  );
};

export default ChartControls;
