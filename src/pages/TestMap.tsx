import { useEffect, useRef, useCallback, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import geoBarranquilla from '../data/geo-barranquilla.json';
import LeyendaHeatmap from '@/components/ui/leyenda-heatmap';
// import Top10Paneles from '@/components/Top10Paneles';
import { FilterStats, useCombinedFilters } from '@/hooks/useCombinedFilters';
import { FeatureCollection, Geometry } from 'geojson';
import { supabase } from '@/integrations/supabase/client';
import ExclusivePointsMap from '@/components/ExclusivePointsMap';
import CombinedFiltersPanel from '@/components/CombinedFiltersPanel';
import { useOnlyCombinedFilters } from '@/hooks/useOnlyCombinedFilters';


interface TestMapProps {
  combinedStats: FilterStats[];
  selectedMetric: string;
  showHeatmap: boolean;
  incomeData?: {
    barrio: string;
    localidad: string;
    coordx: number;
    coordsy: number;
    total_encuestas: number;
    matches_count: number; // Agregado para mostrar en la interfaz
    match_percentage: number;
    intensity_score: number;
  }[];
  mapViewType: 'poligonos' | 'puntos';
  setMapViewType: React.Dispatch<React.SetStateAction<'poligonos' | 'puntos'>>;
  combinedFilters: any[];
}

const TestMap: React.FC<TestMapProps> = ({ combinedStats, selectedMetric, showHeatmap, incomeData, mapViewType, setMapViewType, combinedFilters }) => {
  // Usar los filtros recibidos por props
  // Estado para verificar si el mapa está cargado (debe ir antes de cualquier uso)
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  // Estado para datos de respuestas por barrio
  const [barrioResponseStats, setBarrioResponseStats] = useState<any[] | null>(null);
  const [initialLoading, setInitialLoading] = useState(false);

  // Función para obtener el conteo de respuestas por barrio
  const getSurveyResponseCountsByBarrio = useCallback(async () => {
    setInitialLoading(true);
    try {
      // Llama a la función SQL optimizada para conteo por barrio
      const { data, error } = await supabase.rpc('count_filtered_persons_with_coords', {});
      if (error || !Array.isArray(data)) {
        setBarrioResponseStats([]);
      } else {
        setBarrioResponseStats(data);
      }
    } finally {
      setInitialLoading(false);
    }
  }, []);

  // Al montar el componente, cargar el conteo de respuestas por barrio
  useEffect(() => {
    getSurveyResponseCountsByBarrio();
  }, [getSurveyResponseCountsByBarrio]);
    
  // Hook de filtros combinado (debe ir antes de cualquier uso de combinedFilters)
  // const { combinedFilters } = useCombinedFilters(); // Ya no se usa directamente aquí

  // El estado mapViewType ahora viene de props
  // Estado para loader profesional y modal de error
  const [loading, setLoading] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [retryTimeout, setRetryTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Handler para alternar a la vista de puntos
  const handlePointsView = useCallback(() => {
    setLoading(true);
    setMapViewType('puntos');
  }, [setMapViewType]);

  // Handler para alternar a la vista de polígonos con loader
  const handlePolygonsView = useCallback(() => {
    setLoading(true);
    setMapViewType('poligonos');
  }, [setMapViewType]);

  // Desactivar loader cuando el mapa de polígonos termina de cargar
  useEffect(() => {
    if (mapViewType === 'poligonos' && mapLoaded) {
      setLoading(false);
    }
    if (mapViewType === 'puntos') {
      setLoading(false); // El loader de puntos se maneja en ExclusivePointsMap
    }
  }, [mapViewType, mapLoaded]);
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  // Estado para tooltip flotante (hover)
  const [hoveredFeature, setHoveredFeature] = useState<any>(null);
  const [tooltipPos, setTooltipPos] = useState<{x: number, y: number} | null>(null);
  // Estado para controlar la visibilidad de las etiquetas fijas
  const [showLabels, setShowLabels] = useState<boolean>(true);
  // Estado para tooltips fijos
  const [fixedTooltips, setFixedTooltips] = useState<any[]>([]);

  // Calcular el máximo matches_count para ajustar color y opacidad
  const maxMatchesCount = incomeData
    ? Math.max(...incomeData.map(d => d.matches_count))
    : combinedStats && combinedStats.length > 0
      ? Math.max(...combinedStats.map(d => d.matches_count || 0))
      : 1;

  // Función para calcular el centroide de un polígono de manera más precisa
  const getCentroid = (geometry: any): number[] | null => {
    if (geometry.type === 'Polygon') {
      const coords = geometry.coordinates[0];
      let area = 0;
      let x = 0;
      let y = 0;
      
      // Calcular centroide usando el método del área
      for (let i = 0; i < coords.length - 1; i++) {
        const xi = coords[i][0];
        const yi = coords[i][1];
        const xi1 = coords[i + 1][0];
        const yi1 = coords[i + 1][1];
        const a = xi * yi1 - xi1 * yi;
        area += a;
        x += (xi + xi1) * a;
        y += (yi + yi1) * a;
      }
      
      area *= 0.5;
      if (area === 0) {
        // Fallback al promedio simple si el área es 0
        let avgX = 0, avgY = 0;
        for (let i = 0; i < coords.length - 1; i++) {
          avgX += coords[i][0];
          avgY += coords[i][1];
        }
        return [avgX / (coords.length - 1), avgY / (coords.length - 1)];
      }
      
      x /= (6 * area);
      y /= (6 * area);
      return [x, y];
      
    } else if (geometry.type === 'MultiPolygon') {
      // Para MultiPolygon, usar el polígono más grande
      let largestPoly = geometry.coordinates[0];
      let largestArea = 0;
      
      geometry.coordinates.forEach((poly: any) => {
        const coords = poly[0];
        let area = 0;
        for (let i = 0; i < coords.length - 1; i++) {
          area += (coords[i][0] * coords[i + 1][1] - coords[i + 1][0] * coords[i][1]);
        }
        area = Math.abs(area) / 2;
        if (area > largestArea) {
          largestArea = area;
          largestPoly = poly;
        }
      });
      
      return getCentroid({ type: 'Polygon', coordinates: largestPoly });
    }
    return null;
  };

  const buildFeatureCollection = useCallback((): FeatureCollection<Geometry, { [name: string]: any }> => {
    const features = (geoBarranquilla as any).features.map((f: any) => {
      const properties = { ...f.properties };
      const nombre = String(properties.nombre || 'Barrio').trim().toLowerCase();
      let totalEncuestas = 0;
      let score = 0;
      let matchesCount = 0;
      let matchPercentage = 0;

      // Usar datos de ingresos si existen, sino stats combinados
      if (incomeData) {
        const incomeStats = incomeData.find(stat => stat.barrio.trim().toLowerCase() === nombre);
        if (incomeStats && incomeStats.matches_count > 0) {
          score = incomeStats.matches_count;
          properties.score = score;
          properties.intensity_score = score; // El color depende del matches_count
          totalEncuestas = incomeStats.total_encuestas;
          matchesCount = incomeStats.matches_count;
          properties.total_encuestas = totalEncuestas;
          properties.matches_count = matchesCount;
          // Opacidad proporcional al matches_count
          properties.fill_opacity = maxMatchesCount > 0 ? 0.5 + 0.5 * (matchesCount / maxMatchesCount) : 0.7;
        } else {
          properties.matches_count = 0;
          properties.fill_opacity = 0.1;
        }
      } else {
        const barrioStats = combinedStats?.find(stat => stat.barrio.trim().toLowerCase() === nombre);
        if (barrioStats && barrioStats.matches_count > 0) {
          score = barrioStats.matches_count;
          properties.score = score;
          properties.intensity_score = score; // El color depende del matches_count
          totalEncuestas = barrioStats.total_encuestas;
          matchesCount = barrioStats.matches_count;
          properties.total_encuestas = totalEncuestas;
          properties.matches_count = matchesCount;
          // Opacidad proporcional al matches_count
          properties.fill_opacity = maxMatchesCount > 0 ? 0.5 + 0.5 * (matchesCount / maxMatchesCount) : 0.7;
        } else {
          properties.matches_count = 0;
          properties.fill_opacity = 0.1;
        }
      }
      return {
        ...f,
        properties,
      };
    });
    return { type: 'FeatureCollection', features };
  }, [combinedStats, incomeData, maxMatchesCount]);

  // Effect principal para manejar el mapa
  useEffect(() => {
    if (mapViewType !== 'poligonos' || !mapContainer.current) return;

    // Limpiar completamente el mapa anterior
    if (map.current) {
      try {
        map.current.remove();
      } catch (error) {
        console.error('Error al limpiar mapa:', error);
      }
      map.current = null;
    }

    // Limpiar el contenedor
    if (mapContainer.current) {
      mapContainer.current.innerHTML = '';
    }

    setMapLoaded(false);
    setFixedTooltips([]);

    // Crear nuevo mapa después de un pequeño delay para asegurar limpieza
    setTimeout(() => {
      if (!mapContainer.current || mapViewType !== 'poligonos') return;

      try {
        map.current = new maplibregl.Map({
          container: mapContainer.current,
          style: {
            version: 8,
            sources: {
              'osm-tiles': {
                type: 'raster',
                tiles: [
                  'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
                ],
                tileSize: 256,
                attribution: '&copy; OpenStreetMap contributors'
              },
            },
            layers: [
              {
                id: 'background',
                type: 'background',
                paint: {
                  'background-color': '#f8f9fa'
                }
              },
              {
                id: 'osm-layer',
                type: 'raster',
                source: 'osm-tiles',
                paint: {
                  'raster-opacity': 1
                }
              },
            ],
          },
          center: [-74.8304, 10.9685],
          zoom: 12,
          maxZoom: 18,
          minZoom: 8,
          attributionControl: false
        });

        // Agregar controles de navegación
        map.current.addControl(new maplibregl.NavigationControl({
          showCompass: true,
          showZoom: true,
          visualizePitch: true
        }), 'bottom-left');

        // Manejar la carga del estilo
        map.current.on('style.load', () => {
          if (!map.current) return;
          
          console.log('Estilo del mapa cargado, agregando capas...');

          try {
            // Agregar fuente de datos de polígonos
            const featureCollection = buildFeatureCollection();
            console.log('FeatureCollection creada:', featureCollection);

            map.current.addSource('barranquilla', {
              type: 'geojson',
              data: featureCollection,
            });

            // Agregar capa de relleno de polígonos con TODOS los polígonos visibles
            map.current.addLayer({
              id: 'barrios',
              type: 'fill',
              source: 'barranquilla',
              paint: {
                'fill-color': [
                  'case',
                  ['>', ['get', 'matches_count'], 0],
                  [
                    'interpolate',
                    ['linear'],
                    ['get', 'intensity_score'],
                    0, '#cc3333',
                    Math.max(1, Math.floor(maxMatchesCount * 0.25)), '#b30000',
                    Math.max(1, Math.floor(maxMatchesCount * 0.5)), '#990000',
                    Math.max(1, Math.floor(maxMatchesCount * 0.75)), '#800000',
                    maxMatchesCount, '#4d0000'
                  ],
                  '#adb5bd' // Color gris oscuro para polígonos sin datos
                ],
                'fill-opacity': [
                  'case',
                  ['>', ['get', 'matches_count'], 0],
                  ['get', 'fill_opacity'],
                  0.3 // Opacidad baja para polígonos sin datos
                ]
              },
              layout: {
                visibility: 'visible',
              }
              // NO FILTRAR - mostrar todos los polígonos
            });

            // Agregar capa de bordes de polígonos
            map.current.addLayer({
              id: 'barrios-line',
              type: 'line',
              source: 'barranquilla',
              paint: {
                'line-color': '#6c757d',
                'line-width': 1,
                'line-opacity': 0.5
              },
              layout: {
                visibility: 'visible',
              }
            });

            console.log('Capas agregadas correctamente');

            // Eventos hover para polígonos
            map.current.on('mousemove', 'barrios', (e) => {
              if (e.features && e.features.length > 0) {
                const feature = e.features[0];
                const properties = feature.properties || {};
                setHoveredFeature(properties);
                if (mapContainer.current && e.originalEvent) {
                  const rect = mapContainer.current.getBoundingClientRect();
                  setTooltipPos({
                    x: e.originalEvent.clientX - rect.left,
                    y: e.originalEvent.clientY - rect.top
                  });
                }
              }
            });

            map.current.on('mouseleave', 'barrios', () => {
              setHoveredFeature(null);
              setTooltipPos(null);
            });

            // Actualizar posiciones de tooltips cuando el mapa se mueva
            map.current.on('move', () => {
              if (fixedTooltips.length > 0 && map.current) {
                const currentZoom = map.current.getZoom();
                const updatedTooltips = fixedTooltips.map(tooltip => {
                  if (tooltip.lngLat) {
                    const point = map.current!.project(tooltip.lngLat);
                    return {
                      ...tooltip,
                      position: { x: point.x, y: point.y },
                      zoom: currentZoom
                    };
                  }
                  return tooltip;
                });
                setFixedTooltips(updatedTooltips);
              }
            });

            // Crear tooltips fijos
            const createTooltips = () => {
              const tooltips: any[] = [];
              const features = featureCollection.features;
              
              if (map.current) {
                const currentZoom = map.current.getZoom();

                features.forEach((feature: any) => {
                  if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
                    const center = getCentroid(feature.geometry);
                    if (center && center.length === 2) {
                      const point = map.current!.project([center[0], center[1]] as [number, number]);
                      tooltips.push({
                        id: feature.properties.nombre || 'Sin nombre',
                        nombre: feature.properties.nombre || 'Sin nombre',
                        position: { x: point.x, y: point.y },
                        lngLat: [center[0], center[1]],
                        zoom: currentZoom
                      });
                    }
                  }
                });
                
                setFixedTooltips(tooltips);
              }
            };

            setMapLoaded(true);
            setTimeout(createTooltips, 300);

          } catch (error) {
            console.error('Error al configurar capas del mapa:', error);
          }
        });

        map.current.on('error', (e) => {
          console.warn('Error en el mapa:', e.error);
        });

      } catch (error) {
        console.error('Error al crear el mapa:', error);
      }
    }, 100);

    // Cleanup
    return () => {
      if (mapViewType !== 'poligonos' && map.current) {
        try {
          map.current.remove();
          map.current = null;
          setMapLoaded(false);
          setFixedTooltips([]);
        } catch (error) {
          console.error('Error en cleanup:', error);
        }
      }
    };
  }, [mapViewType, maxMatchesCount]); // Solo estas dependencias para evitar bucles

  // Effect separado para actualizar datos
  useEffect(() => {
    if (mapLoaded && map.current && mapViewType === 'poligonos') {
      try {
        if (map.current.isStyleLoaded()) {
          const source = map.current.getSource('barranquilla') as maplibregl.GeoJSONSource;
          if (source) {
            const newData = buildFeatureCollection();
            source.setData(newData);
            console.log('Datos del mapa actualizados');
          }
        }
      } catch (error) {
        console.error('Error al actualizar datos del mapa:', error);
      }
    }
  }, [combinedStats, incomeData, mapLoaded, mapViewType, buildFeatureCollection]);

  const toggleLabels = () => {
    setShowLabels(!showLabels);
  };

  return (
    <div className="relative w-full h-full">
      {/* Loader profesional y modal de error */}
      {(loading || showLoadingModal || initialLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center gap-4 min-w-[320px]">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-400 border-opacity-80 mb-2" style={{borderColor:'#ffa500'}}></div>
            <div className="text-xl font-bold text-gray-800 text-center">
              {initialLoading
                ? 'Cargando datos para encuesta, espere por favor...'
                : 'Se están cargando el total de respuestas para estas preguntas, espere por favor...'}
            </div>
            <div className="text-base text-gray-500 text-center">No cierre ni recargue la página.</div>
          </div>
        </div>
      )}
      
      {/* Panel de controles flotante a la izquierda */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-4">
        <div className="flex gap-2">
          <button
            onClick={handlePolygonsView}
            className={`px-3 py-2 rounded-lg font-medium transition-colors shadow-md ${
              mapViewType === 'poligonos'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            }`}
          >
            Polígonos
          </button>
          <button
            onClick={handlePointsView}
            className={`px-3 py-2 rounded-lg font-medium transition-colors shadow-md ${
              mapViewType === 'puntos'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            }`}
          >
            Puntos
          </button>
        </div>
        {/* Botón para mostrar/ocultar nombres de barrios en ambas vistas */}
        <button
          onClick={toggleLabels}
          className={`px-4 py-2 rounded-lg font-medium transition-colors shadow-md ${
            showLabels
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
          }`}
          title={showLabels ? 'Ocultar nombres de barrios' : 'Mostrar nombres de barrios'}
        >
          {showLabels ? 'Ocultar barrios' : 'Mostrar barrios'}
        </button>

        {/* Mostrar leyenda solo en vista de polígonos */}
        {mapViewType === 'poligonos' && (combinedStats.length > 0 || incomeData) && (
          <LeyendaHeatmap
            title="Personas que cumplen con el filtro"
            steps={[ 
              {
                value: 0,
                label: 'Sin respuestas',
                color: '#adb5bd',
                opacity: 0.7
              },
              {
                value: Math.max(1, Math.floor(maxMatchesCount * 0.25)),
                label: '0 - 25%',
                color: '#cc3333',
                opacity: maxMatchesCount > 0 ? 0.5 + 0.5 * (Math.max(1, Math.floor(maxMatchesCount * 0.25)) / maxMatchesCount) : 0.7
              },
              {
                value: Math.max(1, Math.floor(maxMatchesCount * 0.5)),
                label: '25 - 50%',
                color: '#b30000',
                opacity: maxMatchesCount > 0 ? 0.5 + 0.5 * (Math.max(1, Math.floor(maxMatchesCount * 0.5)) / maxMatchesCount) : 0.7
              },
              {
                value: Math.max(1, Math.floor(maxMatchesCount * 0.75)),
                label: '50 - 75%',
                color: '#990000',
                opacity: maxMatchesCount > 0 ? 0.5 + 0.5 * (Math.max(1, Math.floor(maxMatchesCount * 0.75)) / maxMatchesCount) : 0.7
              },
              {
                value: maxMatchesCount,
                label: '75 - 100%',
                color: '#800000',
                opacity: 1
              },
              {
                value: maxMatchesCount,
                label: '100%',
                color: '#4d0000',
                opacity: 1
              }
            ]}
          />
        )}
      </div>
      
      {/* Renderizar mapa de polígonos o puntos según la vista seleccionada */}
      {mapViewType === 'poligonos' ? (
        <>
          <div ref={mapContainer} className="w-full h-full" />
          {/* Tooltips fijos para nombres de barrios solo en vista polígonos */}
          {showLabels && mapLoaded && (
            <>
              {fixedTooltips.map((tooltip) => {
                  const fontSize = Math.max(5, Math.min(8, (tooltip.zoom || 12) - 6));
                  const maxWidth = Math.max(30, Math.min(60, fontSize * 6));
                return (
                  <div
                    key={tooltip.id}
                    className="absolute pointer-events-none z-20"
                    style={{
                      left: tooltip.position.x,
                      top: tooltip.position.y,
                      transform: 'translate(-50%, -50%)',
                      color: '#000',
                        fontSize: `${fontSize}px`,
                        fontWeight: 700,
                        textShadow: '1px 1px 2px rgba(255,255,255,0.9), -1px -1px 2px rgba(255,255,255,0.9), 1px -1px 2px rgba(255,255,255,0.9), -1px 1px 2px rgba(255,255,255,0.9)',
                        whiteSpace: 'nowrap',
                        maxWidth: `${maxWidth}px`,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        userSelect: 'none',
                        lineHeight: '1'
                    }}
                  >
                    {tooltip.nombre}
                  </div>
                );
              })}
            </>
          )}
          {/* Tooltip hover para polígonos */}
          {hoveredFeature && tooltipPos && (
            <div
              className="z-50 pointer-events-none"
              style={{
                position: 'absolute',
                left: tooltipPos.x + 16,
                top: tooltipPos.y + 16,
                background: 'rgba(0,0,0,0.9)',
                color: '#fff',
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                padding: '12px 16px',
                minWidth: 220,
                maxWidth: 320,
                fontSize: 14,
                border: '2px solid #ffa500',
                fontFamily: 'inherit',
              }}
            >
              <div style={{fontWeight: 700, fontSize: 16, marginBottom: 6, color: '#ffa500'}}>
                {hoveredFeature.nombre || hoveredFeature.barrio || 'Barrio sin nombre'}
              </div>
              <div><b>Localidad:</b> {hoveredFeature.localidad || 'N/A'}</div>
              <div><b>Pieza urbana:</b> {hoveredFeature.pieza_urba || 'N/A'}</div>
              <div><b>Personas que cumplen filtro:</b> {hoveredFeature.matches_count !== undefined ? hoveredFeature.matches_count : 'Sin datos'}</div>
              <div><b>Total de encuestas:</b> {hoveredFeature.total_encuestas !== undefined ? hoveredFeature.total_encuestas : 'Sin datos'}</div>
            </div>
          )}
        </>
      ) : (
        /* Vista de puntos: usar componente optimizado y pasarle el filtro recibido por props */
        <ExclusivePointsMap filters={combinedFilters.map(f => ({
          category: f.category || '',
          questionId: f.questionId,
          response: f.response
        }))} />
      )}
    </div>
  );
};

export default TestMap;