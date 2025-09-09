import { useEffect, useRef, useCallback, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import geoBarranquilla from '../data/geo-barranquilla.json';
import LeyendaHeatmap from '@/components/ui/leyenda-heatmap';
import Top10Paneles from '@/components/Top10Paneles';
import { FilterStats, useCombinedFilters } from '@/hooks/useCombinedFilters';
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
    matches_count: number; // Agregado para mostrar en la interfaz
    match_percentage: number;
    intensity_score: number;
  }[];
}

const TestMap: React.FC<TestMapProps> = ({ combinedStats, selectedMetric, showHeatmap, incomeData }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  // Estado para tooltip flotante
  const [hoveredFeature, setHoveredFeature] = useState<any>(null);
  const [tooltipPos, setTooltipPos] = useState<{x: number, y: number} | null>(null);

  // Calcular el máximo matches_count para ajustar color y opacidad
  const maxMatchesCount = incomeData
    ? Math.max(...incomeData.map(d => d.matches_count))
    : combinedStats && combinedStats.length > 0
      ? Math.max(...combinedStats.map(d => d.matches_count || 0))
      : 1;

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
        }
      }
      return {
        ...f,
        properties,
      };
    });
    return { type: 'FeatureCollection', features };
  }, [combinedStats, incomeData, maxMatchesCount]);

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

    // Add zoom and rotation controls to top-left
    map.current.addControl(new maplibregl.NavigationControl({
      showCompass: true,
      showZoom: true,
      visualizePitch: true
    }), 'bottom-left');

    // Move the zoom controls above the legend
    const navigationControl = document.querySelector('.maplibregl-ctrl-top-left');
    if (navigationControl) {
      navigationControl.setAttribute('style', 'top: 10px; left: 10px; z-index: 11;');
    }

    map.current.on('load', () => {
      map.current?.addSource('barranquilla', {
        type: 'geojson',
        data: buildFeatureCollection(),
      });

      // Agregar capa de relleno
      // Solo agregamos una capa para los barrios con datos (matches_count > 0)
      map.current?.addLayer({
        id: 'barrios',
        type: 'fill',
        source: 'barranquilla',
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['get', 'intensity_score'],
              0, '#cc3333',
              Math.max(1, Math.floor(maxMatchesCount * 0.25)), '#b30000',
              Math.max(1, Math.floor(maxMatchesCount * 0.5)), '#990000',
              Math.max(1, Math.floor(maxMatchesCount * 0.75)), '#800000',
              maxMatchesCount, '#4d0000'
          ],
          'fill-opacity': ['get', 'fill_opacity']
        },
        layout: {
          visibility: 'visible',
        },
        filter: ['>', ['get', 'matches_count'], 0]
      });

      // Agregar bordes solo para barrios con datos (matches_count > 0)
      map.current?.addLayer({
        id: 'barrios-line',
        type: 'line',
        source: 'barranquilla',
        paint: {
          'line-color': '#000',
          'line-width': 1,
          'line-opacity': 0.3
        },
        layout: {
          visibility: 'visible',
        },
        filter: ['>', ['get', 'matches_count'], 0]
      });


    });

    map.current.on('mousemove', 'barrios', (e) => {
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        const properties = feature.properties || {};
        console.log('🔍 Hovered feature properties:', properties); // Registro adicional
        setHoveredFeature(properties);
        if (mapContainer.current && e.originalEvent) {
          const rect = mapContainer.current.getBoundingClientRect();
          setTooltipPos({
            x: e.originalEvent.clientX - rect.left,
            y: e.originalEvent.clientY - rect.top
          });
        }
      } else {
        console.log('🔍 No feature hovered'); // Registro adicional
        setHoveredFeature(null);
        setTooltipPos(null);
      }
    });

    map.current.on('mouseleave', 'barrios', () => {
      setHoveredFeature(null);
      setTooltipPos(null);
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

  const { combinedFilters } = useCombinedFilters();
  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      {(combinedStats.length > 0 || incomeData) && (
        <>
          <div className="absolute top-4 left-4 z-10">
            <LeyendaHeatmap
              title="Personas que cumplen con el filtro"
              steps={[
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
          </div>
        </>
      )}
      {hoveredFeature && tooltipPos && (
        <div
          className="z-50 pointer-events-none"
          style={{
            position: 'absolute',
            left: tooltipPos.x + 16,
            top: tooltipPos.y + 16,
            background: 'rgba(255,255,255,0.97)',
            color: '#222',
            borderRadius: 8,
            boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
            padding: '12px 16px',
            minWidth: 220,
            maxWidth: 320,
            fontSize: 14,
            border: '2px solid #ffa500',
            fontFamily: 'inherit',
          }}
        >
          <div style={{fontWeight: 700, fontSize: 16, marginBottom: 4}}>{hoveredFeature.nombre || ''}</div>
          <div><b>Localidad:</b> {hoveredFeature.localidad || ''}</div>
          <div><b>Pieza urbana:</b> {hoveredFeature.pieza_urba || ''}</div>
          <div><b>Personas que cumplen con el filtro:</b> {hoveredFeature.matches_count !== undefined ? hoveredFeature.matches_count : 'Sin respuestas'}</div>
          <div><b>Total de encuestas:</b> {hoveredFeature.total_encuestas !== undefined ? hoveredFeature.total_encuestas : 'Sin respuestas'}</div>
        </div>
      )}
    </div>
  );
};

export default TestMap;
