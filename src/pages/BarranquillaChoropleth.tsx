import { useEffect, useState } from 'react';
import { Map } from 'maplibre-gl';
import MapHeatLayer from '@/components/MapHeatLayer';
import geoBarranquilla from '@/data/geo-barranquilla.json';

interface ChoroplethProps {
  metric?: string;
  filters?: any;
}

export const BarranquillaChoropleth = ({ metric = 'Salud', filters }: ChoroplethProps) => {
  const [map, setMap] = useState<Map | null>(null);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    // Inicializar el mapa
    const initializeMap = () => {
      const mapInstance = new Map({
        container: 'map',
        style: 'https://demotiles.maplibre.org/style.json',
        center: [-74.8068, 10.9839], // Coordenadas de Barranquilla
        zoom: 12,
        maxZoom: 18,
        minZoom: 10
      });

      mapInstance.on('load', () => {
        // Añadir fuente de datos de barrios
        mapInstance.addSource('barrios', {
          type: 'geojson',
          data: geoBarranquilla as any
        });

        // Añadir capa base de polígonos
        mapInstance.addLayer({
          id: 'barrios-fill',
          type: 'fill',
          source: 'barrios',
          paint: {
            'fill-color': '#627BC1',
            'fill-opacity': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              0.8,
              0.5
            ]
          }
        });

        // Añadir contornos de barrios
        mapInstance.addLayer({
          id: 'barrios-outline',
          type: 'line',
          source: 'barrios',
          paint: {
            'line-color': '#000000',
            'line-width': 1
          }
        });
      });

      setMap(mapInstance);
    };

      // Cargar datos de ejemplo (reemplazar con datos reales)
      const loadData = async () => {
        // Aquí deberías cargar tus datos reales
        const sampleData = geoBarranquilla.features.map(feature => {
          // Calcular el centro del polígono (centroide)
          const coords = feature.geometry.coordinates[0];
          const centroid = coords.reduce(
            (acc, curr) => [acc[0] + curr[0], acc[1] + curr[1]],
            [0, 0]
          ).map(v => v / coords.length);

          return {
            barrio: feature.properties.nombre,
            localidad: feature.properties.localidad || '',
            coordx: centroid[0],
            coordy: centroid[1],
            total_encuestas: Math.floor(Math.random() * 100),
            matches_count: Math.floor(Math.random() * 50),
            match_percentage: Math.random() * 100,
            intensity_score: Math.random() * 100
          };
        });      setData(sampleData);
    };

    if (!map) {
      initializeMap();
      loadData();
    }

    return () => {
      if (map) {
        map.remove();
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div id="map" className="absolute inset-0" />
      {map && data.length > 0 && (
        <MapHeatLayer
          map={map}
          data={data.map(point => ({
            coordinates: [point.coordx, point.coordy],
            value: point.intensity_score
          }))}
          visible={true}
        />
      )}
    </div>
  );
};

export default BarranquillaChoropleth;
