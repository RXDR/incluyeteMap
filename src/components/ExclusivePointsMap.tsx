import { useEffect, useState, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { supabase } from '@/integrations/supabase/client';
interface ExclusivePointsMapProps {
  filters: { category: string; questionId: string; response: string }[];
}

const ExclusivePointsMap: React.FC<ExclusivePointsMapProps> = ({ filters }) => {
  const [pointsData, setPointsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

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
    </div>
  );
};

export default ExclusivePointsMap;
