import { useState, useEffect } from 'react';
import { useMapLibreMap } from '@/hooks/useMapLibreMap';
import { 
  barranquillaBarrios, 
  barranquillaComunas, 
  barranquillaGeneral,
  generateBarranquillaHeatmapData,
  getBarranquillaColorStops,
  BarrioData 
} from '@/data/barranquillaData';
import { 
  MapPin, 
  Users, 
  Home, 
  Zap, 
  Wifi, 
  GraduationCap, 
  Heart, 
  TrendingDown,
  Layers,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface BarranquillaMapProps {
  initialZoom?: number;
  showBarrios?: boolean;
  showComunas?: boolean;
}

export default function BarranquillaMap({ 
  initialZoom = 11, 
  showBarrios = true, 
  showComunas = false 
}: BarranquillaMapProps) {
  const [selectedMetric, setSelectedMetric] = useState<keyof BarrioData>('sewerage');
  const [selectedComuna, setSelectedComuna] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    metrics: true,
    comunas: true,
    stats: true
  });

  // Configuración del mapa centrado en Barranquilla
  const mapConfig = {
    center: barranquillaGeneral.coordinates,
    zoom: initialZoom,
    pitch: 45,
    style: 'https://demotiles.maplibre.org/style.json'
  };

  const { 
    mapContainer, 
    isReady, 
    styleLoaded,
    error, 
    addHeatmapLayer, 
    removeLayer, 
    set3DMode,
    flyTo
  } = useMapLibreMap(mapConfig);

  // Efecto para actualizar los datos del mapa
  useEffect(() => {
    if (!isReady || !styleLoaded) return;

    // Remover capa anterior
    removeLayer('barranquilla-data');

    // Generar nuevos datos basados en la métrica seleccionada
    const heatmapData = generateBarranquillaHeatmapData(barranquillaBarrios, selectedMetric);

    // Agregar nueva capa
    addHeatmapLayer(heatmapData, 'barranquilla-data');

  }, [selectedMetric, isReady, styleLoaded, addHeatmapLayer, removeLayer]);

  // Efecto para volar a una comuna específica
  useEffect(() => {
    if (selectedComuna && isReady) {
      const comuna = barranquillaComunas.find(c => c.id === selectedComuna);
      if (comuna) {
        flyTo(comuna.coordinates, 13);
      }
    }
  }, [selectedComuna, isReady, flyTo]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev]
    }));
  };

  const getMetricName = (metric: keyof BarrioData) => {
    const metricNames: Record<string, string> = {
      'sewerage': 'Alcantarillado',
      'energy': 'Energía',
      'internet': 'Internet',
      'education': 'Educación',
      'health': 'Salud',
      'poverty': 'Pobreza',
      'stratum': 'Estrato',
      'density': 'Densidad',
      'population': 'Población'
    };
    return metricNames[metric] || metric;
  };

  const getMetricIcon = (metric: keyof BarrioData) => {
    const icons: Record<string, React.ReactNode> = {
      'sewerage': <MapPin className="w-4 h-4" />,
      'energy': <Zap className="w-4 h-4" />,
      'internet': <Wifi className="w-4 h-4" />,
      'education': <GraduationCap className="w-4 h-4" />,
      'health': <Heart className="w-4 h-4" />,
      'poverty': <TrendingDown className="w-4 h-4" />,
      'stratum': <Layers className="w-4 h-4" />,
      'density': <Users className="w-4 h-4" />,
      'population': <Users className="w-4 h-4" />
    };
    return icons[metric] || <MapPin className="w-4 h-4" />;
  };

  const getMetricStats = (metric: keyof BarrioData) => {
    const values = barranquillaBarrios.map(barrio => barrio[metric] as number);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    return {
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      avg: Math.round(avg * 100) / 100
    };
  };

  const getTopBarrios = (metric: keyof BarrioData, limit: number = 3) => {
    return [...barranquillaBarrios]
      .sort((a, b) => (b[metric] as number) - (a[metric] as number))
      .slice(0, limit);
  };

  if (error) {
    return (
      <div className="h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-red-600 text-center">
          <p>Error al cargar el mapa de Barranquilla:</p>
          <p className="text-sm">{error}</p>
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
              <span className="text-gray-300">Geoportal</span>
            </div>
            <span className="text-sm text-gray-400">|</span>
            <span className="text-sm">Análisis por Barrios y Comunas</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <span className="text-gray-400">Población:</span>
              <span className="ml-2 font-semibold">{barranquillaGeneral.population.toLocaleString()}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-400">Barrios:</span>
              <span className="ml-2 font-semibold">{barranquillaGeneral.barrios}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-400">Comunas:</span>
              <span className="ml-2 font-semibold">{barranquillaGeneral.comunas}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
          <div className="space-y-6">
            {/* Métricas */}
            <div className="space-y-4">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('metrics')}>
                <h4 className="font-semibold">Métricas</h4>
                {expandedSections.metrics ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
              
              {expandedSections.metrics && (
                <div className="space-y-3 pl-4">
                  {(['sewerage', 'energy', 'internet', 'education', 'health', 'poverty', 'stratum', 'density'] as const).map(metric => (
                    <button
                      key={metric}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
                        selectedMetric === metric 
                          ? 'bg-red-600 text-white' 
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                      onClick={() => setSelectedMetric(metric)}
                    >
                      {getMetricIcon(metric)}
                      <span className="text-sm">{getMetricName(metric)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Comunas */}
            <div className="space-y-4">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('comunas')}>
                <h4 className="font-semibold">Comunas</h4>
                {expandedSections.comunas ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
              
              {expandedSections.comunas && (
                <div className="space-y-2 pl-4">
                  {barranquillaComunas.map(comuna => (
                    <button
                      key={comuna.id}
                      className={`w-full text-left p-2 rounded text-sm transition-colors ${
                        selectedComuna === comunas.id 
                          ? 'bg-blue-600 text-white' 
                          : 'text-gray-300 hover:text-white'
                      }`}
                      onClick={() => setSelectedComuna(comunas.id)}
                    >
                      <div className="font-medium">{comunas.name}</div>
                      <div className="text-xs opacity-75">
                        {comunas.population.toLocaleString()} hab • {comunas.barrios.length} barrios
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Estadísticas */}
            <div className="space-y-4">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('stats')}>
                <h4 className="font-semibold">Estadísticas</h4>
                {expandedSections.stats ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
              
              {expandedSections.stats && (
                <div className="pl-4 space-y-3">
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="text-sm font-medium mb-2">{getMetricName(selectedMetric)}</div>
                    {(() => {
                      const stats = getMetricStats(selectedMetric);
                      return (
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span>Mínimo:</span>
                            <span>{stats.min}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Promedio:</span>
                            <span>{stats.avg}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Máximo:</span>
                            <span>{stats.max}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="text-sm font-medium mb-2">Top 3 Barrios</div>
                    <div className="space-y-2">
                      {getTopBarrios(selectedMetric, 3).map((barrio, index) => (
                        <div key={barrio.id} className="flex justify-between items-center text-xs">
                          <span className="truncate">{barrio.name}</span>
                          <span className="font-medium">{barrio[selectedMetric]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Central Map Area */}
        <div className="flex-1 relative">
          <div 
            ref={mapContainer} 
            className="w-full h-full rounded-lg overflow-hidden relative"
            style={{ minHeight: '500px' }}
          >
            {(!isReady || !styleLoaded) && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-10">
                <div className="text-gray-600">
                  {!isReady ? 'Cargando mapa...' : 'Cargando estilo del mapa...'}
                </div>
              </div>
            )}
          </div>
          
          {/* Controles del mapa */}
          <div className="absolute bottom-4 left-4">
            <div className="bg-gray-800 rounded-lg p-2 flex space-x-2">
              <button
                className="px-3 py-1 rounded text-sm bg-red-600 text-white"
                onClick={() => set3DMode(true)}
              >
                3D
              </button>
              <button
                className="px-3 py-1 rounded text-sm text-gray-400 hover:text-white"
                onClick={() => set3DMode(false)}
              >
                2D
              </button>
            </div>
          </div>

          {/* Información del barrio seleccionado */}
          {selectedComuna && (
            <div className="absolute top-4 right-4 bg-gray-800 rounded-lg p-4 max-w-sm">
              <div className="text-sm">
                <div className="font-semibold mb-2">
                  {barranquillaComunas.find(c => c.id === selectedComuna)?.name}
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Población:</span>
                    <span>{barranquillaComunas.find(c => c.id === selectedComuna)?.population.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hogares:</span>
                    <span>{barranquillaComunas.find(c => c.id === selectedComuna)?.households.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Área:</span>
                    <span>{barranquillaComunas.find(c => c.id === selectedComuna)?.area} km²</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
