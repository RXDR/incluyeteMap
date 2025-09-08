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
  // Estado para el buscador
  const [searchTerm, setSearchTerm] = useState('');

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
      const csvContent = [
        // Encabezados
        ['Barrio', 'Total Encuestas', 'Coincidencias', 'Porcentaje'],
        // Datos
        ...filteredData.map(item => [
          item.barrio,
          item.total_encuestas,
          item.matches_count,
          ((item.matches_count / item.total_encuestas) * 100).toFixed(1)
        ])
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
        description: "No se pudieron descargar los datos",
        variant: "destructive",
      });
    }
  }, [filteredData]);

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
    return sortedData.map(item => ({
      ...item,
      percentage: Number(((item.matches_count / item.total_encuestas) * 100).toFixed(1))
    }));
  }, [data]);

  // Usar los datos de la card superior (totals) para el gráfico de Distribución General
  // Calcular los totales usando los datos filtrados (lo que realmente se está visualizando)
  const totalEncuestas = filteredData.reduce((acc, item) => acc + item.total_encuestas, 0);
  const totalCoincidencias = filteredData.reduce((acc, item) => acc + item.matches_count, 0);
  const porcentajeGlobal = totalEncuestas > 0 ? ((totalCoincidencias / totalEncuestas) * 100).toFixed(1) : '0';
  const generalChartData = totalEncuestas > 0 ? [
    {
      barrio: `Con Coincidencias (${porcentajeGlobal}%)`,
      matches_count: totalCoincidencias,
      total_encuestas: totalEncuestas,
      percentage: Number(porcentajeGlobal)
    },
    {
      barrio: `Sin Coincidencias (${(100 - Number(porcentajeGlobal)).toFixed(1)}%)`,
      matches_count: totalEncuestas - totalCoincidencias,
      total_encuestas: totalEncuestas,
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
          <button
            onClick={() => {
              // Guardar el estado actual antes de volver
              const currentState = {
                filters: location.state?.filters || [],
                stats: location.state?.stats || [],
                showHeatmap: true,
                chartType,
                showPercentage,
                dataView
              };
              localStorage.setItem('mapState', JSON.stringify(currentState));
              navigate(-1);
            }}
            className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-secondary/80 transition-colors"
          >
            ← Volver
          </button>
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
            <p className="text-2xl font-bold text-blue-500">{totalEncuestas.toLocaleString()}</p>
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
            <button
              className={`px-4 py-2 rounded-lg font-semibold ${activeTab === 'tabla' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => setActiveTab('tabla')}
            >Tabla</button>
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
                      Total de encuestas analizadas: {totalEncuestas}
                    </p>
                  </div>
                  <div className="chart-content transition-all duration-300 ease-in-out min-h-[400px]">
                    <BarriosChart
                      data={generalChartData}
                      chartType={chartType}
                      showPercentage={showPercentage}
                      dataView={dataView}
                      totalEncuestas={totalEncuestas}
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
                        totalEncuestas={top10ChartData.reduce((acc, item) => acc + item.total_encuestas, 0)}
                        totalCoincidencias={top10ChartData.reduce((acc, item) => acc + item.matches_count, 0)}
                        porcentajeGlobal={
                          top10ChartData.reduce((acc, item) => acc + item.total_encuestas, 0) > 0
                            ? (
                                top10ChartData.reduce((acc, item) => acc + item.matches_count, 0) /
                                top10ChartData.reduce((acc, item) => acc + item.total_encuestas, 0) * 100
                              ).toFixed(1)
                            : '0'
                        }
                      />
                  </div>
                </div>
              </div>
            </>
          )}
          {activeTab === 'tabla' && (
            <div>
              {loadingPersons ? (
                <div className="text-center py-8 text-gray-500">Cargando personas...</div>
              ) : (
                filteredPersons.length > 0
                  ? <>
                      {/* Buscador */}
                      <div className="flex justify-end mb-4">
                        <input
                          type="text"
                          placeholder="Buscar por nombre, documento o dirección..."
                          className="border rounded px-3 py-2 w-72 text-black bg-white shadow"
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <FilteredPersonsTable persons={filteredPersons.filter(p => {
                        const nombre = [p.responses_data?.OTROS?.['PRIMER NOMBRE'], p.responses_data?.OTROS?.['SEGUNDO NOMBRE'], p.responses_data?.OTROS?.['PRIMER APELLIDO'], p.responses_data?.OTROS?.['SEGUNDO APELLIDO']].filter(Boolean).join(' ');
                        const documento = p.responses_data?.OTROS?.['Número de documento de la persona con discapacidad'] || '';
                        const direccion = p.address || '';
                        const term = searchTerm.toLowerCase();
                        return nombre.toLowerCase().includes(term) || documento.toLowerCase().includes(term) || direccion.toLowerCase().includes(term);
                      })} />
                      <div className="flex justify-center items-center gap-2 mt-4">
                        <button
                          className="px-4 py-2 rounded bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition"
                          disabled={page === 1}
                          onClick={() => setPage(page - 1)}
                        >Anterior</button>
                        <span className="px-3 py-2 bg-white rounded shadow text-black font-semibold">Página {page}</span>
                        <button
                          className="px-4 py-2 rounded bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition"
                          disabled={filteredPersons.length < limit}
                          onClick={() => setPage(page + 1)}
                        >Siguiente</button>
                        <select
                          className="ml-4 px-2 py-1 rounded border text-black bg-white shadow"
                          value={limit}
                          onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
                        >
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                          <option value={250}>250</option>
                          <option value={500}>500</option>
                        </select>
                      </div>
                    </>
                  : <div className="text-center py-8 text-gray-500">No hay personas que cumplan con el filtro.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataVisualization;
