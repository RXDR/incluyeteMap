import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FilteredPersonsTable, FilteredPerson } from '@/components/FilteredPersonsTable';
import BarriosChart from '../components/charts/BarriosChart';
import ChartControls from '../components/charts/ChartControls';

import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from '../hooks/use-toast';
import html2canvas from 'html2canvas';

interface DataVisualizationProps {
  data?: Array<{
    barrio: string;
    total_encuestas: number;
    matches_count: number;
    intensity_score?: number;
  }>;
  totals?: {
    totalEncuestas: number;
    totalCoincidencias: number;
  };
  activeFilters?: any[];
}

interface FilterOptions {
  minEncuestas: number;
  maxEncuestas: number;
  minMatches: number;
  maxMatches: number;
}

const DataVisualization: React.FC<DataVisualizationProps> = ({ data: initialData, activeFilters }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Constante para el total general (usado cuando no hay filtros)
  const TOTAL_GENERAL_ENCUESTAS = 43064;
  const [filters, setFilters] = useState<FilterOptions>({
    minEncuestas: 0,
    maxEncuestas: Infinity,
    minMatches: 0,
    maxMatches: Infinity
  });
  const [filteredPersons, setFilteredPersons] = useState<FilteredPerson[]>([]);
  const [loadingPersons, setLoadingPersons] = useState(false);
  const [activeTab, setActiveTab] = useState<'graficos' | 'tabla'>('graficos');
  // Estados para paginación
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(100);
  const [totalRows, setTotalRows] = useState(0);

  const data = location.state?.data || initialData || [];
  const totals = location.state?.totals;
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'line' | 'area'>(totals ? 'pie' : 'bar');
  const [showPercentage, setShowPercentage] = useState(true);
  const [dataView, setDataView] = useState<'top10' | 'all' | 'comparison'>(totals ? 'all' : 'top10');
  
  // Filtrar datos basado en los filtros actuales
  const filteredData = React.useMemo(() => {
    return data.filter(item => 
      item.total_encuestas >= filters.minEncuestas &&
      item.total_encuestas <= filters.maxEncuestas &&
      item.matches_count >= filters.minMatches &&
      item.matches_count <= filters.maxMatches
    );
  }, [data, filters]);

  // Solo llamar la función de personas filtradas cuando el tab es 'tabla'
  useEffect(() => {
    if (activeTab !== 'tabla') return;
    async function fetchPersons() {
      setLoadingPersons(true);
      try {
        const rpcFilters = (activeFilters || []).map(f => ({
          category: f.category,
          questionId: f.questionId,
          response: f.response
        }));
        if (rpcFilters.length === 0) {
          setFilteredPersons([]);
          setTotalRows(0);
          setLoadingPersons(false);
          return;
        }
        // Llamada RPC con paginación
        const { data, error } = await supabase.rpc('get_filtered_persons_with_coords', {
          filters: rpcFilters,
          limit_rows: limit,
          offset_rows: (page - 1) * limit
        });
        if (error) {
          setFilteredPersons([]);
          setTotalRows(0);
        } else {
          setFilteredPersons(data || []);
          // Si la función puede devolver el total, aquí lo asignas. Si no, puedes estimar o mostrar solo la paginación básica.
          // setTotalRows(data?.total || 0);
        }
      } catch (err) {
        setFilteredPersons([]);
        setTotalRows(0);
      }
      setLoadingPersons(false);
    }
    fetchPersons();
  }, [activeFilters, activeTab, page, limit]);

  const handleDownloadData = useCallback(() => {
    try {
      const hasActiveFilters = activeFilters && activeFilters.length > 0;
      
      const csvContent = [
        // Encabezados
        ['Barrio', 'Total Encuestas', 'Coincidencias', 'Porcentaje'],
        // Datos
        ...filteredData.map(item => {
          // Si no hay filtros, usar el total general; si hay filtros, usar encuestas del barrio
          const denominador = hasActiveFilters ? item.total_encuestas : TOTAL_GENERAL_ENCUESTAS;
          const porcentaje = ((item.matches_count / denominador) * 100).toFixed(1);
          
          return [
            item.barrio,
            item.total_encuestas,
            item.matches_count,
            porcentaje
          ];
        })
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'datos_barrios.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: "Éxito",
        description: "Los datos se han descargado correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "error al  descargar los datos",
        variant: "destructive",
      });
    }
  }, [filteredData, activeFilters, TOTAL_GENERAL_ENCUESTAS]);

  const handleExportChart = useCallback(async () => {
    try {
      setIsLoading(true);

      // Crear un contenedor temporal para los gráficos y los filtros
      const tempContainer = document.createElement('div');
      tempContainer.style.backgroundColor = '#1f2937'; // Fondo oscuro
      tempContainer.style.padding = '20px';
      tempContainer.style.width = '1200px'; // Ancho fijo para mejor calidad

      // Crear los badges de filtros activos
      if (activeFilters && activeFilters.length > 0) {
        const filtersDiv = document.createElement('div');
        filtersDiv.style.display = 'flex';
        filtersDiv.style.flexWrap = 'wrap';
        filtersDiv.style.gap = '8px';
        filtersDiv.style.marginBottom = '16px';
        activeFilters.forEach(f => {
          const question = f.questionText || f.questionId;
          const response = f.response;
          const category = f.category ? `(${f.category})` : '';
          const badge = document.createElement('span');
          badge.textContent = `${question}: ${response} ${category}`;
          badge.style.background = '#dbeafe';
          badge.style.color = '#1e40af';
          badge.style.fontSize = '13px';
          badge.style.fontWeight = '500';
          badge.style.borderRadius = '999px';
          badge.style.padding = '6px 14px';
          badge.style.border = '1px solid #93c5fd';
          filtersDiv.appendChild(badge);
        });
        tempContainer.appendChild(filtersDiv);
      }

      // Clonar los elementos de los gráficos
      const chartsContainer = document.querySelector('.charts-grid');
      if (!chartsContainer) throw new Error('No se encontraron los gráficos');

      const clone = chartsContainer.cloneNode(true);
      tempContainer.appendChild(clone);

      // Añadir el contenedor temporal al documento
      document.body.appendChild(tempContainer);

      // Configurar opciones de html2canvas
      const options = {
        backgroundColor: '#1f2937',
        scale: 2, // Mayor calidad
        logging: false,
        width: 1200,
        height: 800,
        useCORS: true
      };

      // Capturar la imagen
      const canvas = await html2canvas(tempContainer, options);

      // Crear y descargar el archivo
      const link = document.createElement('a');
      link.download = `graficos_incluyete_${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      // Limpiar
      document.body.removeChild(tempContainer);

      toast({
        title: "Éxito",
        description: "Los gráficos se han exportado correctamente en alta calidad",
      });
    } catch (error) {
      console.error('Error al exportar:', error);
      toast({
        title: "Error",
        description: "No se pudieron exportar los gráficos. Por favor, intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeFilters]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 p-6 flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p className="text-gray-400">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-4 bg-yellow-500 text-gray-900 px-4 py-2 rounded"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Calcular estadísticas globales
  const globalStats = React.useMemo(() => {
    if (!filteredData || filteredData.length === 0) return null;
    
    console.log('🏘️ Calculando estadísticas para los siguientes barrios:');
    filteredData.forEach((item, index) => {
      const barrioPercentage = ((item.matches_count / item.total_encuestas) * 100).toFixed(1);
      console.log(`${index + 1}. ${item.barrio}:`);
      console.log(`   - Coincidencias: ${item.matches_count}`);
      console.log(`   - Encuestas: ${item.total_encuestas}`);
      console.log(`   - Porcentaje individual: ${barrioPercentage}%`);
    });
    
    const totals = filteredData.reduce((acc, item) => ({
      matches: acc.matches + item.matches_count,
      encuestas: acc.encuestas + item.total_encuestas,
      sumPercentages: acc.sumPercentages + (item.matches_count / item.total_encuestas * 100)
    }), { matches: 0, encuestas: 0, sumPercentages: 0 });

    const stats = {
      totalBarrios: filteredData.length,
      totalMatches: totals.matches,
      totalEncuestas: totals.encuestas,
      porcentajeGlobal: ((totals.matches / totals.encuestas) * 100).toFixed(1),
      promedioPorBarrio: (totals.sumPercentages / filteredData.length).toFixed(1)
    };

    console.log('📊 Resumen de estadísticas globales:');
    console.log(`Total de barrios procesados: ${stats.totalBarrios}`);
    console.log(`Total de coincidencias: ${stats.totalMatches}`);
    console.log(`Total de encuestas: ${stats.totalEncuestas}`);
    console.log(`Porcentaje global: ${stats.porcentajeGlobal}%`);
    console.log(`Promedio por barrio: ${stats.promedioPorBarrio}%`);

    return stats;
  }, [filteredData]);

  // Preparar datos para los gráficos
  const top10ChartData = React.useMemo(() => {
    const sortedData = [...data].sort((a, b) => b.matches_count - a.matches_count).slice(0, 10);
    const hasActiveFilters = activeFilters && activeFilters.length > 0;
    
    return sortedData.map(item => {
      // Si no hay filtros activos, usar el total general (43,064)
      // Si hay filtros, usar el total de encuestas del barrio
      const denominador = hasActiveFilters ? item.total_encuestas : TOTAL_GENERAL_ENCUESTAS;
      const percentage = Number(((item.matches_count / denominador) * 100).toFixed(1));
      
      console.log(`📊 Barrio: ${item.barrio}`);
      console.log(`   - Coincidencias: ${item.matches_count}`);
      console.log(`   - ${hasActiveFilters ? 'Con filtros - Encuestas del barrio' : 'Sin filtros - Total general'}: ${denominador}`);
      console.log(`   - Porcentaje calculado: ${percentage}%`);
      
      return {
        ...item,
        percentage
      };
    });
  }, [data, activeFilters, TOTAL_GENERAL_ENCUESTAS]);

  // Calcular estadísticas del Top 10 con logs
  const top10Stats = React.useMemo(() => {
    const hasActiveFilters = activeFilters && activeFilters.length > 0;
    const totalCoincidenciasTop10 = top10ChartData.reduce((acc, item) => acc + item.matches_count, 0);
    const totalEncuestasTop10 = top10ChartData.reduce((acc, item) => acc + item.total_encuestas, 0);
    const denominadorTop10 = hasActiveFilters ? totalEncuestasTop10 : TOTAL_GENERAL_ENCUESTAS;
    const porcentajeTop10 = denominadorTop10 > 0 ? (totalCoincidenciasTop10 / denominadorTop10 * 100).toFixed(1) : '0';

    console.log(`🏆 Top 10 Estadísticas:`);
    console.log(`   - ${hasActiveFilters ? 'Con filtros activos' : 'Sin filtros activos'}`);
    console.log(`   - Total coincidencias Top 10: ${totalCoincidenciasTop10}`);
    console.log(`   - Total encuestas Top 10: ${totalEncuestasTop10}`);
    console.log(`   - Denominador usado: ${denominadorTop10} (${hasActiveFilters ? 'encuestas del Top 10' : 'total general'})`);
    console.log(`   - Porcentaje Top 10: ${porcentajeTop10}%`);

    return {
      totalCoincidencias: totalCoincidenciasTop10,
      totalEncuestas: hasActiveFilters ? totalEncuestasTop10 : TOTAL_GENERAL_ENCUESTAS,
      porcentaje: porcentajeTop10
    };
  }, [top10ChartData, activeFilters, TOTAL_GENERAL_ENCUESTAS]);

  // Usar los datos de la card superior (totals) para el gráfico de Distribución General
  // Calcular los totales usando los datos filtrados (lo que realmente se está visualizando)
  const hasActiveFilters = activeFilters && activeFilters.length > 0;
  const totalEncuestas = filteredData.reduce((acc, item) => acc + item.total_encuestas, 0);
  const totalCoincidencias = filteredData.reduce((acc, item) => acc + item.matches_count, 0);
  
  // Para el gráfico general, usar el total correcto según si hay filtros o no
  const denominadorGeneral = hasActiveFilters ? totalEncuestas : TOTAL_GENERAL_ENCUESTAS;
  const porcentajeGlobal = denominadorGeneral > 0 ? ((totalCoincidencias / denominadorGeneral) * 100).toFixed(1) : '0';
  
  console.log(`🌍 Distribución General:`);
  console.log(`   - ${hasActiveFilters ? 'Con filtros activos' : 'Sin filtros activos'}`);
  console.log(`   - Total coincidencias: ${totalCoincidencias}`);
  console.log(`   - Denominador usado: ${denominadorGeneral} (${hasActiveFilters ? 'encuestas filtradas' : 'total general'})`);
  console.log(`   - Porcentaje global: ${porcentajeGlobal}%`);
  
  const generalChartData = denominadorGeneral > 0 ? [
    {
      barrio: `Con Coincidencias (${porcentajeGlobal}%)`,
      matches_count: totalCoincidencias,
      total_encuestas: denominadorGeneral,
      percentage: Number(porcentajeGlobal)
    },
    {
      barrio: `Sin Coincidencias (${(100 - Number(porcentajeGlobal)).toFixed(1)}%)`,
      matches_count: denominadorGeneral - totalCoincidencias,
      total_encuestas: denominadorGeneral,
      percentage: Number((100 - Number(porcentajeGlobal)).toFixed(1))
    }
  ] : [];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Visualización de Datos
          </h1>
         
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card p-4 rounded-lg shadow-xl">
            <h3 className="text-sm font-medium text-muted-foreground">Total Barrios</h3>
            <p className="text-2xl font-bold text-card-foreground">{filteredData.length}</p>
          </div>
          <div className="bg-card p-4 rounded-lg shadow-xl">
            <h3 className="text-sm font-medium text-muted-foreground">Total Coincidencias</h3>
            <p className="text-2xl font-bold text-yellow-500">{totalCoincidencias.toLocaleString()}</p>
          </div>
          <div className="bg-card p-4 rounded-lg shadow-xl">
            <h3 className="text-sm font-medium text-muted-foreground">Total Encuestas</h3>
            <p className="text-2xl font-bold text-blue-500">{hasActiveFilters ? totalEncuestas.toLocaleString() : TOTAL_GENERAL_ENCUESTAS.toLocaleString()}</p>
          </div>
          <div className="bg-card p-4 rounded-lg shadow-xl">
            <h3 className="text-sm font-medium text-muted-foreground">Porcentaje Global</h3>
            <p className="text-2xl font-bold text-green-500">{porcentajeGlobal}%</p>
            <p className="text-xs text-muted-foreground mt-1">Promedio por barrio: {globalStats?.promedioPorBarrio ?? ''}%</p>
          </div>
        </div>

        <div className="bg-card rounded-lg p-6 shadow-xl">
          {/* Tabs para cambiar entre gráficos y tabla */}
          <div className="flex gap-2 mb-6">
            <button
              className={`px-4 py-2 rounded-lg font-semibold ${activeTab === 'graficos' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => setActiveTab('graficos')}
            >Gráficos</button>
           
          </div>
          {/* Filtros activos visuales */}
          {activeFilters && activeFilters.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {activeFilters.map((f, idx) => {
                const question = f.questionText || f.questionId;
                const response = f.response;
                const category = f.category ? `(${f.category})` : '';
                return (
                  <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium border border-blue-300">
                    {question}: <span className="font-semibold ml-1">{response}</span> {category}
                  </span>
                );
              })}
            </div>
          )}
          {/* Renderizado condicional por tab */}
          {activeTab === 'graficos' && (
            <>
              <ChartControls
                chartType={chartType}
                showPercentage={showPercentage}
                dataView="all"
                onChartTypeChange={setChartType}
                onShowPercentageChange={setShowPercentage}
                onDataViewChange={() => {}}
                onDownloadData={handleDownloadData}
                onExportChart={handleExportChart}
                filters={filters}
                onFiltersChange={setFilters}
                isLoading={isLoading}
              />
              <div className="charts-grid grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de Totales Generales */}
                <div className="chart-container bg-card p-6 rounded-lg shadow-xl">
                  <div className="chart-header border-b border-border pb-4 mb-4">
                    <h2 className="text-xl font-bold text-card-foreground">Distribución General de Coincidencias</h2>
                    <p className="text-muted-foreground text-sm mt-1">
                      Total de encuestas analizadas: {hasActiveFilters ? totalEncuestas : TOTAL_GENERAL_ENCUESTAS}
                    </p>
                  </div>
                  <div className="chart-content transition-all duration-300 ease-in-out min-h-[400px]">
                    <BarriosChart
                      data={generalChartData}
                      chartType={chartType}
                      showPercentage={showPercentage}
                      dataView={dataView}
                      totalEncuestas={hasActiveFilters ? totalEncuestas : TOTAL_GENERAL_ENCUESTAS}
                      totalCoincidencias={totalCoincidencias}
                      porcentajeGlobal={porcentajeGlobal}
                    />
                  </div>
                </div>

                {/* Gráfico del Top 10 Barrios */}
                <div className="chart-container bg-card p-6 rounded-lg shadow-xl">
                  <div className="chart-header border-b border-border pb-4 mb-4">
                    <h2 className="text-xl font-bold text-card-foreground">Top 10 Barrios por Coincidencias</h2>
                    <p className="text-muted-foreground text-sm mt-1">
                      Mostrando los 10 barrios con mayor número de coincidencias
                    </p>
                  </div>
                  <div className="chart-content transition-all duration-300 ease-in-out min-h-[400px]">
                      <BarriosChart
                        data={top10ChartData}
                        chartType={chartType}
                        showPercentage={showPercentage}
                        dataView="top10"
                        totalEncuestas={top10Stats.totalEncuestas}
                        totalCoincidencias={top10Stats.totalCoincidencias}
                        porcentajeGlobal={top10Stats.porcentaje}
                      />
                  </div>
                </div>
              </div>
            </>
          )}
         
        </div>
      </div>
    </div>
  );
};

export default DataVisualization;
