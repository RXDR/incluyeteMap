import { useEffect, useRef } from 'react';
import { Map } from 'maplibre-gl';

interface SimpleHeatmapProps {
  map: Map | null;
}

// Datos de ejemplo hardcodeados
const SAMPLE_DATA = [
  { lat: 10.9878, lng: -74.7889, intensity: 1 }, // Barranquilla centro
  { lat: 10.9912, lng: -74.7883, intensity: 0.8 },
  { lat: 10.9934, lng: -74.7912, intensity: 0.9 },
  { lat: 10.9867, lng: -74.7856, intensity: 0.7 },
  { lat: 10.9945, lng: -74.7934, intensity: 0.6 },
  { lat: 10.9823, lng: -74.7845, intensity: 0.5 },
  { lat: 10.9956, lng: -74.7967, intensity: 0.4 },
  { lat: 10.9789, lng: -74.7834, intensity: 0.3 },
  { lat: 10.9967, lng: -74.7989, intensity: 0.2 },
  { lat: 10.9745, lng: -74.7823, intensity: 0.1 },
];

export const SimpleHeatmap = ({ map }: SimpleHeatmapProps) => {
  const heatmapLayerId = 'heatmap-layer';
  
  useEffect(() => {
    if (!map) {
      console.log('⚠️ Map not available');
      return;
    }

    // Esperar a que el mapa esté listo
    if (!map.isStyleLoaded()) {
      map.once('style.load', addHeatmap);
    } else {
      addHeatmap();
    }

    function addHeatmap() {
      // Remover capa existente si existe
      if (map.getLayer(heatmapLayerId)) {
        map.removeLayer(heatmapLayerId);
      }

      // Agregar source con datos de ejemplo
      const source = {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: SAMPLE_DATA.map(point => ({
            type: 'Feature',
            properties: {
              intensity: point.intensity
            },
            geometry: {
              type: 'Point',
              coordinates: [point.lng, point.lat]
            }
          }))
        }
      };

      if (map.getSource('heat')) {
        map.removeSource('heat');
      }
      
      map.addSource('heat', source);

      // Agregar capa de heatmap
      map.addLayer({
        id: heatmapLayerId,
        type: 'heatmap',
        source: 'heat',
        paint: {
          // Intensidad del heatmap
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'intensity'],
            0, 0,
            1, 1
          ],
          // Radio del heatmap en pixeles
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 2,
            9, 20
          ],
          // Color del heatmap
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(33,102,172,0)',
            0.2, 'rgb(103,169,207)',
            0.4, 'rgb(209,229,240)',
            0.6, 'rgb(253,219,199)',
            0.8, 'rgb(239,138,98)',
            1, 'rgb(178,24,43)'
          ],
          // Opacidad basada en el zoom
          'heatmap-opacity': 0.8
        }
      });

      console.log('✅ Heatmap added successfully');
    }

    return () => {
      if (map.getLayer(heatmapLayerId)) {
        map.removeLayer(heatmapLayerId);
      }
      if (map.getSource('heat')) {
        map.removeSource('heat');
      }
    };
  }, [map]);

  return null;
};
