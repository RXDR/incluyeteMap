import { useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import geoBarranquilla from '../data/geo-barranquilla.json';
import LeyendaHeatmap from '@/components/ui/leyenda-heatmap';
import { FilterStats } from '@/hooks/useCombinedFilters';
import { FeatureCollection, Geometry } from 'geojson';

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
    matches_count: number;
    match_percentage: number;
    intensity_score: number;
  }[];
}

const TestMap: React.FC<TestMapProps> = ({ combinedStats, selectedMetric, showHeatmap, incomeData }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  const buildFeatureCollection = useCallback((): FeatureCollection<Geometry, { [name: string]: any }> => {
    const features = (geoBarranquilla as any).features.map((f: any) => {
      const properties = { ...f.properties };
      const nombre = String(properties.nombre || 'Barrio').trim().toLowerCase();
      
      // Si hay datos de ingresos, usarlos, sino usar stats combinados
      if (incomeData) {
        const incomeStats = incomeData.find(stat => stat.barrio.trim().toLowerCase() === nombre);
        properties.score = incomeStats?.match_percentage || 0;
        properties.intensity_score = incomeStats?.intensity_score || 0;
        properties.total_encuestas = incomeStats?.total_encuestas || 0;
        properties.matches_count = incomeStats?.matches_count || 0;
      } else {
        const barrioStats = combinedStats?.find(stat => stat.barrio.trim().toLowerCase() === nombre);
        properties.score = barrioStats?.match_percentage || 0;
      }

      return {
        ...f,
        properties,
      };
    });

    return { type: 'FeatureCollection', features };
  }, [combinedStats]);

  useEffect(() => {
    if (!mapContainer.current) return;

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
            id: 'osm',
            type: 'raster',
            source: 'osm',
          },
        ],
      },
      center: [-74.8304, 10.9685],
      zoom: 12,
    });

    map.current.on('load', () => {
      map.current?.addSource('barranquilla', {
        type: 'geojson',
        data: buildFeatureCollection(),
      });

      map.current?.addLayer({
        id: 'barrios',
        type: 'fill',
        source: 'barranquilla',
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['get', 'score'],
            0, '#e5e5e5',
            25, '#ffe4b5',
            50, '#ffa500',
            75, '#ff4500',
            100, '#8b0000'
          ],
          'fill-opacity': 0.7,
        },
      });
    });

    // Agregar popup
    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false
    });

    map.current.on('mousemove', 'barrios', (e) => {
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        const score = feature.properties.score || 0;
        
        // Cambiar el cursor a pointer
        map.current!.getCanvas().style.cursor = 'pointer';
        
        // HTML del popup
        const html = `
          <div class="px-2 py-1">
            <div class="font-bold">${feature.properties.nombre}</div>
            <div class="text-sm">Coincidencia: ${score.toFixed(1)}%</div>
          </div>
        `;
        
        popup.setLngLat(e.lngLat).setHTML(html).addTo(map.current!);
      }
    });

    map.current.on('mouseleave', 'barrios', () => {
      map.current!.getCanvas().style.cursor = '';
      popup.remove();
    });

    return () => {
      map.current?.remove();
    };
  }, [buildFeatureCollection]);

  useEffect(() => {
    if (map.current) {
      const source = map.current.getSource('barranquilla') as maplibregl.GeoJSONSource;
      if (source) {
        source.setData(buildFeatureCollection());
      }
    }
  }, [combinedStats, buildFeatureCollection]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      {(combinedStats.length > 0 || incomeData) && (
        <div className="absolute bottom-4 right-4 z-10">
          <LeyendaHeatmap 
            mode={incomeData ? 'income' : 'combined'}
            title={incomeData ? 'Análisis de Ingresos' : 'Coincidencias de Filtros'}
          />
        </div>
      )}
    </div>
  );
};

export default TestMap;
