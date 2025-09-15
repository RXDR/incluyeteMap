import { useEffect, useState, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { supabase } from '@/integrations/supabase/client';
import geoBarranquilla from '@/data/geo-barranquilla.json';
interface ExclusivePointsMapProps {
  filters: { category: string; questionId: string; response: string }[];
}

const ExclusivePointsMap: React.FC<ExclusivePointsMapProps> = ({ filters }) => {
  const [pointsData, setPointsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{x: number, y: number} | null>(null);

  // Cargar todos los puntos (sin límite)
  const fetchAllPoints = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filtrosFormateados = filters.map(f => ({
        category: f.category || '',
        questionId: f.questionId,
        response: f.response
      }));
      console.log('Filtros enviados a get_filtered_persons_with_coords:', filtrosFormateados);
      const { data, error } = await supabase.rpc('get_filtered_persons_with_coords', {
        filters: filtrosFormateados,
        limit_rows: 50000,
        offset_rows: 0
      });
      if (error) {
        setError(error.message);
        setPointsData([]);
      } else {
        // Validar que las coordenadas vengan como x (latitud) y y (longitud)
        const validPoints = Array.isArray(data)
          ? data.filter(d => typeof d.x === 'number' && typeof d.y === 'number')
          : [];
        setPointsData(validPoints);
      }
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
      setPointsData([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // ...existing code...
  useEffect(() => {
    fetchAllPoints();
  }, [fetchAllPoints, filters]);

  useEffect(() => {
    if (!mapContainer.current || pointsData.length === 0) return;
    if (map.current) {
      map.current.remove();
      map.current = null;
    }
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
          },
        },
        layers: [
          {
            id: 'background',
            type: 'background',
            paint: {
              'background-color': 'transparent',
              'background-opacity': 0
            }
          },
          {
            id: 'osm',
            type: 'raster',
            source: 'osm',
            paint: {
              'raster-opacity': 1
            }
          },
        ],
      },
      center: [-74.8304, 10.9685],
      zoom: 12,
    });

    // Agregar control de navegación (zoom) en la esquina inferior izquierda
    map.current.addControl(new maplibregl.NavigationControl({
      showCompass: true,
      showZoom: true,
      visualizePitch: true
    }), 'bottom-left');
    map.current.on('load', () => {
      // Crear features para los puntos usando x (latitud) y y (longitud)
      const features = pointsData.map((d, idx) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [d.y, d.x] },
        properties: {
          id: d.id || idx,
          nombre: d.nombre,
          barrio: d.barrio,
          localidad: d.localidad
        }
      }));
        // Agregar fuente y capa de polígonos de barrios
        map.current!.addSource('barrios', {
          type: 'geojson',
          data: geoBarranquilla
        });
        map.current!.addLayer({
          id: 'barrios-layer',
          type: 'fill',
          source: 'barrios',
          paint: {
            'fill-color': '#ffa500',
            'fill-opacity': 0.18
          }
        });
        map.current!.addLayer({
          id: 'barrios-outline',
          type: 'line',
          source: 'barrios',
          paint: {
            'line-color': '#ffa500',
            'line-width': 2,
            'line-opacity': 0.7
          }
        });
          // Capa de nombres de barrios con fuente pequeña
          map.current!.addLayer({
            id: 'barrios-labels',
            type: 'symbol',
            source: 'barrios',
            layout: {
              'text-field': ['get', 'nombre'],
              'text-size': 8,
              'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
              'text-offset': [0, 0.5],
              'text-anchor': 'top',
              'text-allow-overlap': true
            },
            paint: {
              'text-color': '#222',
              'text-halo-color': '#fff',
              'text-halo-width': 1
            }
          });
      map.current!.addSource('puntos', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features },
      });
      map.current!.addLayer({
        id: 'puntos-layer',
        type: 'circle',
        source: 'puntos',
        paint: {
          'circle-radius': 4,
          'circle-color': '#cc3333',
          'circle-opacity': 0.8,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fff'
        }
      });

      // Evento hover para puntos
      map.current!.on('mousemove', 'puntos-layer', (e: any) => {
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          setHoveredPoint(feature.properties);
          if (mapContainer.current && e.originalEvent) {
            const rect = mapContainer.current.getBoundingClientRect();
            setTooltipPos({
              x: e.originalEvent.clientX - rect.left,
              y: e.originalEvent.clientY - rect.top
            });
          }
        } else {
          setHoveredPoint(null);
          setTooltipPos(null);
        }
      });
      map.current!.on('mouseleave', 'puntos-layer', () => {
        setHoveredPoint(null);
        setTooltipPos(null);
      });
    });
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [pointsData]);

  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center gap-4 min-w-[320px]">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-400 border-opacity-80 mb-2" style={{borderColor:'#ffa500'}}></div>
            <div className="text-xl font-bold text-gray-800 text-center">Cargando puntos, espere por favor...</div>
            <div className="text-base text-gray-500 text-center">No cierre ni recargue la página.</div>
          </div>
        </div>
      )}
      {error && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center gap-4 min-w-[320px]">
            <div className="text-xl font-bold text-red-600 text-center">Error: {error}</div>
            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded" onClick={fetchAllPoints}>Reintentar</button>
          </div>
        </div>
      )}
      <div ref={mapContainer} className="w-full h-full" />
      {/* Tooltip flotante para puntos */}
      {hoveredPoint && tooltipPos && (
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
            {hoveredPoint.nombre || 'Sin nombre'}
          </div>
          <div><b>Barrio:</b> {hoveredPoint.barrio || 'N/A'}</div>
          <div><b>Localidad:</b> {hoveredPoint.localidad || 'N/A'}</div>
        </div>
      )}
    </div>
  );
};

export default ExclusivePointsMap;
