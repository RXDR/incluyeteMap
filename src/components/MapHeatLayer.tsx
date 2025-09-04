import { useEffect, useRef, useState } from 'react';
import { Map } from 'maplibre-gl';
import type { GeoJSONSource } from 'maplibre-gl';
import geoBarranquilla from '@/data/geo-barranquilla.json';

interface MapHeatLayerProps {
  map: Map | null;
  data: Array<{
    coordinates: [number, number];
    value: number;
  }>;
  visible?: boolean;
}

const MapHeatLayer = ({ map, data, visible = true }: MapHeatLayerProps) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const sourceId = 'heat-data';
  const layerId = 'heat-layer';

  // Efecto para inicializar y limpiar el heatmap
  useEffect(() => {
    if (!map || !data || data.length === 0) return;

    const initializeHeatmap = () => {
      if (!map || !map.isStyleLoaded()) {
        map?.once('style.load', initializeHeatmap);
        return;
      }
      
      try {
        // Primero agregamos la capa choropleth con el GeoJSON base
        if (!map.getSource('barranquilla')) {
          map.addSource('barranquilla', {
            type: 'geojson',
            data: geoBarranquilla as GeoJSON.FeatureCollection
          });

          // Agregar capa base de choropleth
          map.addLayer({
            id: 'barranquilla-layer',
            type: 'fill',
            source: 'barranquilla',
            paint: {
              'fill-color': [
                'step',
                ['get', 'value'],
                '#6FCFF0',   // valor < 70994
                70994, '#45B7D1',    // 70994-229335
                229335, '#2D8EA6',   // 229335-319306
                319306, '#156B82',   // 319306-509169
                509169, '#004459'    // > 509169
              ],
              'fill-opacity': 0.7,
              'fill-outline-color': '#FFFFFF'
            }
          });
          
          // Agregar capa de borde
          map.addLayer({
            id: 'barranquilla-border',
            type: 'line',
            source: 'barranquilla',
            paint: {
              'line-color': '#FFFFFF',
              'line-width': 1
            }
          });
        }

        // Luego agregamos los datos del heatmap
        const geoJsonData: GeoJSON.FeatureCollection = {
          type: 'FeatureCollection',
          features: data.map(point => ({
            type: 'Feature',
            properties: {
              intensity: point.value
            },
            geometry: {
              type: 'Point',
              coordinates: point.coordinates
            }
          }))
        };

        // Agregar source si no existe
        if (!map.getSource(sourceId)) {
          map.addSource(sourceId, {
            type: 'geojson',
            data: geoJsonData
          });
        } else {
          // Actualizar datos si el source ya existe
          const source = map.getSource(sourceId) as GeoJSONSource;
          source.setData(geoJsonData);
        }

        // Agregar layer si no existe
        if (!map.getLayer(layerId)) {
          map.addLayer({
            id: layerId,
            type: 'heatmap',
            source: sourceId,
            paint: {
              // Radio del heatmap que aumenta con el zoom
              'heatmap-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0, 2,
                9, 20
              ],
              // Intensidad ajustada para mejor visualización
              'heatmap-intensity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0, 1,
                9, 3
              ],
              // Peso basado en el valor de intensidad
              'heatmap-weight': [
                'interpolate',
                ['linear'],
                ['get', 'intensity'],
                0, 0,
                0.2, 0.2,
                0.4, 0.4,
                0.6, 0.6,
                0.8, 0.8,
                1, 1
              ],
              // Colores del heatmap estilo DANE
              'heatmap-color': [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0, 'rgba(0, 0, 255, 0)',
                0.2, 'rgba(0, 255, 255, 0.6)',
                0.4, 'rgba(0, 255, 0, 0.7)',
                0.6, 'rgba(255, 255, 0, 0.8)',
                0.8, 'rgba(255, 0, 0, 0.9)',
                1, 'rgba(255, 0, 0, 1)'
              ],
              // Opacidad del heatmap
              'heatmap-opacity': 0.8
            },
            layout: {
              visibility: visible ? 'visible' : 'none'
            }
          });
        }

        setIsInitialized(true);
        console.log('✅ Heatmap inicializado correctamente');
      } catch (error) {
        console.error('❌ Error al inicializar el heatmap:', error);
      }
    };

    // Inicializar cuando el estilo esté cargado
    if (map.isStyleLoaded()) {
      initializeHeatmap();
    } else {
      map.once('style.load', initializeHeatmap);
    }

    // Cleanup
    return () => {
      if (!map) return;
      
      try {
        const layers = [layerId, 'barranquilla-layer', 'barranquilla-border'];
        const sources = [sourceId, 'barranquilla'];

        // Eliminar capas
        layers.forEach(layer => {
          if (map.getLayer(layer)) {
            map.removeLayer(layer);
          }
        });

        // Eliminar fuentes
        sources.forEach(source => {
          if (map.getSource(source)) {
            map.removeSource(source);
          }
        });

        setIsInitialized(false);
      } catch (error) {
        console.error('Error en cleanup:', error);
      }
    };
  }, [map, data]);

  // Efecto para manejar la visibilidad
  useEffect(() => {
    if (!map || !isInitialized) return;

    try {
      const layers = [layerId, 'barranquilla-layer', 'barranquilla-border'];
      
      layers.forEach(layer => {
        if (map.getLayer(layer)) {
          map.setLayoutProperty(
            layer,
            'visibility',
            visible ? 'visible' : 'none'
          );
        }
      });
      
      console.log(`🔍 Visibilidad de las capas: ${visible ? 'visible' : 'oculto'}`);
    } catch (error) {
      console.error('❌ Error al cambiar la visibilidad:', error);
    }
  }, [map, visible, isInitialized, layerId]);

  return null;
};

export default MapHeatLayer;
