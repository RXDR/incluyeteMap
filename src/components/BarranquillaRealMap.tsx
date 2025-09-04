import { useState, useEffect } from 'react';
import { useMapLibreMap } from '@/hooks/useMapLibreMap';
import { BarranquillaGeoService, BarrioInfo, LocalidadInfo } from '@/services/barranquillaGeoService';
import AdvancedFilters from './AdvancedFilters';
import { 
  MapPin, 
  Users, 
  Search, 
  Layers,
  ChevronDown,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Home,
  Filter
} from 'lucide-react';

interface BarranquillaRealMapProps {
  initialZoom?: number;
}

export default function BarranquillaRealMap({ 
  initialZoom = 11 
}: BarranquillaRealMapProps) {
  const [selectedLocalidad, setSelectedLocalidad] = useState<string | null>(null);
  const [selectedBarrio, setSelectedBarrio] = useState<BarrioInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<any[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    localidades: true,
    barrios: true,
    stats: true
  });

  // Obtener datos del servicio
  const barrios = BarranquillaGeoService.getBarrios();
  const localidades = BarranquillaGeoService.getLocalidadesInfo();
  const stats = BarranquillaGeoService.getStats();
  const mapBounds = BarranquillaGeoService.getMapBounds();

  // Calcular centro del mapa basado en los bounds
  const mapCenter: [number, number] = [
    (mapBounds[0][0] + mapBounds[1][0]) / 2,
    (mapBounds[0][1] + mapBounds[1][1]) / 2
  ];

  // Configuración del mapa
  const mapConfig = {
    center: mapCenter,
    zoom: 12, // Zoom más cercano para ver mejor los barrios
    pitch: 0, // Empezar en 2D
    bearing: 0,
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
    flyTo,
    zoomIn,
    zoomOut,
    fitBounds,
    resetView,
    addGeoJSONLayer
  } = useMapLibreMap(mapConfig);

  // Efecto para cargar el GeoJSON de Barranquilla
  useEffect(() => {
    if (!isReady || !styleLoaded) return;

    // Remover capas anteriores
    removeLayer('barranquilla-geojson');
    removeLayer('barranquilla-heatmap');

         // Agregar capa del GeoJSON
     const geoJSON = BarranquillaGeoService.getGeoJSON();
     addGeoJSONLayer('barranquilla-geojson', geoJSON, {
       fillColor: '#4F46E5', // Color más vibrante
       fillOpacity: 0.4, // Más opaco para mejor visibilidad
       strokeColor: '#1F2937', // Borde más oscuro
       strokeWidth: 2, // Borde más grueso
       strokeOpacity: 0.9
     });

     }, [isReady, styleLoaded, addGeoJSONLayer, removeLayer]);

   // Efecto para hacer zoom automático a los bounds cuando el mapa se carga
   useEffect(() => {
     if (isReady && styleLoaded) {
       // Esperar un poco para que el mapa se estabilice
       setTimeout(() => {
         fitBounds(mapBounds, { padding: 100 });
       }, 1000);
     }
   }, [isReady, styleLoaded, fitBounds, mapBounds]);

  // Efecto para volar a una localidad específica
  useEffect(() => {
    if (selectedLocalidad && isReady) {
      const localidad = localidades.find(l => l.nombre === selectedLocalidad);
      if (localidad) {
        flyTo(localidad.center, 13);
      }
    }
  }, [selectedLocalidad, isReady, flyTo, localidades]);

  // Efecto para volar a un barrio específico
  useEffect(() => {
    if (selectedBarrio && isReady) {
      flyTo(selectedBarrio.center, 15);
    }
  }, [selectedBarrio, isReady, flyTo]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev]
    }));
  };

  const handleLocalidadClick = (localidad: string) => {
    setSelectedLocalidad(selectedLocalidad === localidad ? null : localidad);
    setSelectedBarrio(null);
  };

  const handleBarrioClick = (barrio: BarrioInfo) => {
    setSelectedBarrio(selectedBarrio?.id === barrio.id ? null : barrio);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = BarranquillaGeoService.searchBarrios(query);
      if (results.length > 0) {
        setSelectedBarrio(results[0]);
        flyTo(results[0].center, 14);
      }
    }
  };

  const handleFiltersChange = (filters: any[]) => {
    setActiveFilters(filters);
    console.log('Filtros aplicados:', filters);
    // Aquí implementaremos la lógica para aplicar los filtros a los datos
  };

  const toggleAdvancedFilters = () => {
    setShowAdvancedFilters(!showAdvancedFilters);
  };

  const fitToBounds = () => {
    if (isReady) {
      fitBounds(mapBounds);
    }
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
              <span className="text-gray-300">Área de Encuestas</span>
            </div>
            <span className="text-sm text-gray-400">|</span>
            <span className="text-sm">Zona de Estudio</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <span className="text-gray-400">Barrios:</span>
              <span className="ml-2 font-semibold">{stats.totalBarrios}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-400">Localidades:</span>
              <span className="ml-2 font-semibold">{stats.totalLocalidades}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
          <div className="space-y-6">
            {/* Filtros Avanzados */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Filtros</h4>
                <button
                  onClick={toggleAdvancedFilters}
                  className="flex items-center space-x-1 text-xs text-gray-400 hover:text-white"
                >
                  <Filter className="w-3 h-3" />
                  <span>{showAdvancedFilters ? 'Ocultar' : 'Avanzados'}</span>
                </button>
              </div>
              
              {showAdvancedFilters ? (
                <AdvancedFilters 
                  onFiltersChange={handleFiltersChange}
                />
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar barrio o localidad..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full bg-gray-700 text-white pl-10 pr-4 py-2 rounded-lg text-sm"
                  />
                </div>
              )}
            </div>

            {/* Localidades */}
            <div className="space-y-4">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('localidades')}>
                <h4 className="font-semibold">Localidades</h4>
                {expandedSections.localidades ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
              
              {expandedSections.localidades && (
                <div className="space-y-2 pl-4">
                  {localidades.map(localidad => (
                    <button
                      key={localidad.nombre}
                      className={`w-full text-left p-2 rounded text-sm transition-colors ${
                        selectedLocalidad === localidad.nombre 
                          ? 'bg-blue-600 text-white' 
                          : 'text-gray-300 hover:text-white'
                      }`}
                      onClick={() => handleLocalidadClick(localidad.nombre)}
                    >
                      <div className="font-medium">{localidad.nombre}</div>
                      <div className="text-xs opacity-75">
                        {localidad.barrios.length} barrios
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Barrios de la localidad seleccionada */}
            {selectedLocalidad && (
              <div className="space-y-4">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('barrios')}>
                  <h4 className="font-semibold">Barrios - {selectedLocalidad}</h4>
                  {expandedSections.barrios ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
                
                {expandedSections.barrios && (
                  <div className="space-y-2 pl-4 max-h-60 overflow-y-auto">
                    {localidades
                      .find(l => l.nombre === selectedLocalidad)
                      ?.barrios.map(barrio => (
                        <button
                          key={barrio.id}
                          className={`w-full text-left p-2 rounded text-sm transition-colors ${
                            selectedBarrio?.id === barrio.id 
                              ? 'bg-green-600 text-white' 
                              : 'text-gray-300 hover:text-white'
                          }`}
                          onClick={() => handleBarrioClick(barrio)}
                        >
                          <div className="font-medium">{barrio.nombre}</div>
                          <div className="text-xs opacity-75">
                            {barrio.pieza_urba}
                          </div>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Estadísticas */}
            <div className="space-y-4">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('stats')}>
                <h4 className="font-semibold">Estadísticas</h4>
                {expandedSections.stats ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
              
              {expandedSections.stats && (
                <div className="pl-4 space-y-3">
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="text-sm font-medium mb-2">Resumen General</div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Total Barrios:</span>
                        <span>{stats.totalBarrios}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Localidades:</span>
                        <span>{stats.totalLocalidades}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="text-sm font-medium mb-2">Barrios por Localidad</div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {stats.barriosPorLocalidad.map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-xs">
                          <span className="truncate">{item.localidad}</span>
                          <span className="font-medium">{item.count}</span>
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
           <div className="absolute bottom-4 left-4 space-y-2">
             {/* Controles de zoom */}
             <div className="bg-gray-800 rounded-lg p-2 flex flex-col space-y-1">
               <button
                 className="px-3 py-1 rounded text-sm bg-blue-600 text-white hover:bg-blue-700"
                 onClick={zoomIn}
                 title="Zoom In"
               >
                 <ZoomIn className="w-4 h-4" />
               </button>
               <button
                 className="px-3 py-1 rounded text-sm bg-blue-600 text-white hover:bg-blue-700"
                 onClick={zoomOut}
                 title="Zoom Out"
               >
                 <ZoomOut className="w-4 h-4" />
               </button>
             </div>

             {/* Controles de vista */}
             <div className="bg-gray-800 rounded-lg p-2 flex space-x-2">
               <button
                 className="px-3 py-1 rounded text-sm bg-red-600 text-white hover:bg-red-700"
                 onClick={() => set3DMode(true)}
                 title="Vista 3D"
               >
                 3D
               </button>
               <button
                 className="px-3 py-1 rounded text-sm text-gray-400 hover:text-white hover:bg-gray-700"
                 onClick={() => set3DMode(false)}
                 title="Vista 2D"
               >
                 2D
               </button>
             </div>
             
             {/* Controles de navegación */}
             <div className="bg-gray-800 rounded-lg p-2 flex flex-col space-y-1">
               <button
                 className="px-3 py-1 rounded text-sm text-gray-400 hover:text-white hover:bg-gray-700"
                 onClick={fitToBounds}
                 title="Ver toda Barranquilla"
               >
                 <Home className="w-4 h-4" />
               </button>
               <button
                 className="px-3 py-1 rounded text-sm text-gray-400 hover:text-white hover:bg-gray-700"
                 onClick={resetView}
                 title="Resetear vista"
               >
                 <Layers className="w-4 h-4" />
               </button>
             </div>
           </div>

          {/* Información del barrio seleccionado */}
          {selectedBarrio && (
            <div className="absolute top-4 right-4 bg-gray-800 rounded-lg p-4 max-w-sm">
              <div className="text-sm">
                <div className="font-semibold mb-2">{selectedBarrio.nombre}</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Localidad:</span>
                    <span>{selectedBarrio.localidad}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pieza Urbana:</span>
                    <span>{selectedBarrio.pieza_urba}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ID:</span>
                    <span>{selectedBarrio.id}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Información de la localidad seleccionada */}
          {selectedLocalidad && !selectedBarrio && (
            <div className="absolute top-4 right-4 bg-gray-800 rounded-lg p-4 max-w-sm">
              <div className="text-sm">
                <div className="font-semibold mb-2">{selectedLocalidad}</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Barrios:</span>
                    <span>{localidades.find(l => l.nombre === selectedLocalidad)?.barrios.length}</span>
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
