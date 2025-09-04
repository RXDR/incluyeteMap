import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';

export interface HeatmapData {
  id: string;
  lng: number;
  lat: number;
  intensity: number;
  properties?: Record<string, any>;
}

export interface MapConfig {
  center: [number, number];
  zoom: number;
  pitch?: number;
  bearing?: number;
  style?: string;
}

export const useMapLibreMap = (config: MapConfig) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [styleLoaded, setStyleLoaded] = useState(false);

  useEffect(() => {
    if (map.current) return; // initialize map only once

    if (mapContainer.current) {
      try {
        map.current = new maplibregl.Map({
          container: mapContainer.current,
          style: config.style || 'https://demotiles.maplibre.org/style.json',
          center: config.center,
          zoom: config.zoom,
          pitch: config.pitch || 0,
          bearing: config.bearing || 0
        });

        // Agregar controles de navegación con zoom
        map.current.addControl(new maplibregl.NavigationControl({
          showCompass: true,
          showZoom: true,
          visualizePitch: true
        }), 'top-right');
        
        // Agregar control de geolocalización
        map.current.addControl(new maplibregl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true,
          showUserHeading: true,
          showAccuracyCircle: true
        }), 'top-right');

        // Agregar control de escala
        map.current.addControl(new maplibregl.ScaleControl({
          maxWidth: 100,
          unit: 'metric'
        }), 'bottom-left');

        // Agregar control de pantalla completa
        map.current.addControl(new maplibregl.FullscreenControl(), 'top-right');

        // Evento cuando el mapa se carga
        map.current.on('load', () => {
          setIsReady(true);
          console.log('Mapa cargado correctamente');
        });

        // Evento cuando el estilo se carga completamente
        map.current.on('styledata', () => {
          setStyleLoaded(true);
          console.log('Estilo del mapa cargado completamente');
        });

        // Evento de error
        map.current.on('error', (e) => {
          setError(e.error.message);
          console.error('Error en el mapa:', e.error);
        });

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        console.error('Error inicializando el mapa:', err);
      }
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [config]);

  // Función auxiliar para verificar si el mapa está listo para agregar capas
  const isMapReadyForLayers = () => {
    return map.current && isReady && styleLoaded && map.current.isStyleLoaded();
  };

  const addHeatmapLayer = (data: HeatmapData[], layerId: string) => {
    if (!isMapReadyForLayers()) {
      console.log('Mapa no está listo para agregar capas');
      return;
    }

    try {
      // Verificar si las capas ya existen y removerlas
      if (map.current!.getLayer(`${layerId}-points`)) {
        map.current!.removeLayer(`${layerId}-points`);
      }
      if (map.current!.getLayer(layerId)) {
        map.current!.removeLayer(layerId);
      }
      if (map.current!.getSource(layerId)) {
        map.current!.removeSource(layerId);
      }

      // Crear fuente de datos
      const source: maplibregl.GeoJSONSourceRaw = {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: data.map(point => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [point.lng, point.lat]
            },
            properties: {
              intensity: point.intensity,
              ...point.properties
            }
          }))
        }
      };

      // Agregar fuente
      map.current!.addSource(layerId, source);

      // Agregar capa de mapa de calor
      map.current!.addLayer({
        id: layerId,
        type: 'heatmap',
        source: layerId,
        paint: {
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'intensity'],
            0, 0,
            50, 0.5,
            100, 1
          ],
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 1,
            9, 3
          ],
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
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 2,
            9, 20
          ],
          'heatmap-opacity': 0.8
        }
      });

      // Agregar capa de puntos para interactividad
      map.current!.addLayer({
        id: `${layerId}-points`,
        type: 'circle',
        source: layerId,
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'total'],
            1, 4,
            10, 12
          ],
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'percentage'],
            0, '#3b82f6',
            50, '#f59e0b',
            100, '#ef4444'
          ],
          'circle-opacity': 0.7,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#ffffff'
        }
      });

      console.log(`Capa de calor ${layerId} agregada exitosamente`);
    } catch (err) {
      console.error(`Error al agregar capa de calor ${layerId}:`, err);
      setError(err instanceof Error ? err.message : 'Error al agregar capa de calor');
    }
  };

  const removeLayer = (layerId: string) => {
    if (!map.current || !isReady) return;

    try {
      if (map.current.getLayer(layerId)) {
        map.current.removeLayer(layerId);
      }
      if (map.current.getSource(layerId)) {
        map.current.removeSource(layerId);
      }
      console.log(`Capa ${layerId} removida exitosamente`);
    } catch (err) {
      console.error(`Error al remover capa ${layerId}:`, err);
    }
  };

  const updateMapStyle = (styleUrl: string) => {
    if (!map.current || !isReady) return;
    
    try {
      setStyleLoaded(false); // Reset style loaded state
      map.current.setStyle(styleUrl);
    } catch (err) {
      console.error('Error al actualizar estilo del mapa:', err);
      setError(err instanceof Error ? err.message : 'Error al actualizar estilo');
    }
  };

  const set3DMode = (enabled: boolean) => {
    if (!map.current || !isReady) return;
    
    try {
      if (enabled) {
        map.current.setPitch(45);
      } else {
        map.current.setPitch(0);
      }
    } catch (err) {
      console.error('Error al cambiar modo 3D:', err);
    }
  };

  const flyTo = (center: [number, number], zoom?: number) => {
    if (!map.current || !isReady) return;
    
    try {
      map.current.flyTo({
        center,
        zoom: zoom || map.current.getZoom(),
        duration: 2000
      });
    } catch (err) {
      console.error('Error al navegar al punto:', err);
    }
  };

  const zoomIn = () => {
    if (!map.current || !isReady) return;
    
    try {
      map.current.zoomIn();
    } catch (err) {
      console.error('Error al hacer zoom in:', err);
    }
  };

  const zoomOut = () => {
    if (!map.current || !isReady) return;
    
    try {
      map.current.zoomOut();
    } catch (err) {
      console.error('Error al hacer zoom out:', err);
    }
  };

  const fitBounds = (bounds: [[number, number], [number, number]], options?: any) => {
    if (!map.current || !isReady) return;
    
    try {
      map.current.fitBounds(bounds, {
        padding: 50,
        duration: 2000,
        ...options
      });
    } catch (err) {
      console.error('Error al ajustar bounds:', err);
    }
  };

  const resetView = () => {
    if (!map.current || !isReady) return;
    
    try {
      map.current.flyTo({
        center: config.center,
        zoom: config.zoom,
        bearing: 0,
        pitch: 0,
        duration: 2000
      });
    } catch (err) {
      console.error('Error al resetear vista:', err);
    }
  };

  const addChoroplethLayer = (
    layerId: string, 
    data: any, 
    colorStops: [number, string][],
    property: string,
    paintOptions: {
      strokeColor?: string;
      strokeWidth?: number;
      strokeOpacity?: number;
    } = {}
  ) => {
    if (!isMapReadyForLayers()) {
      console.log('Mapa no está listo para agregar capas coropléticas');
      return;
    }

    try {
      // Verificar si la capa ya existe
      if (map.current!.getLayer(layerId)) {
        console.log(`Capa coroplética ${layerId} ya existe, removiendo...`);
        removeLayer(layerId);
        removeLayer(`${layerId}-border`);
      }

      // Agregar fuente de datos
      map.current!.addSource(layerId, {
        type: 'geojson',
        data: data
      });

      // Agregar capa coroplética
      map.current!.addLayer({
        id: layerId,
        type: 'fill',
        source: layerId,
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['get', property],
            ...colorStops.flat()
          ],
          'fill-opacity': 0.8
        }
      });

      // Agregar borde
      map.current!.addLayer({
        id: `${layerId}-border`,
        type: 'line',
        source: layerId,
        paint: {
          'line-color': paintOptions.strokeColor || '#ffffff',
          'line-width': paintOptions.strokeWidth || 1,
          'line-opacity': paintOptions.strokeOpacity || 0.8
        }
      });

        // Agregar interactividad
  map.current!.on('mouseenter', layerId, () => {
    map.current!.getCanvas().style.cursor = 'pointer';
  });
  
  map.current!.on('mouseleave', layerId, () => {
    map.current!.getCanvas().style.cursor = '';
  });

  // Agregar evento de clic
  map.current!.on('click', layerId, (e) => {
    if (e.features && e.features.length > 0) {
      // Disparar evento personalizado con los datos del feature
      const customEvent = new CustomEvent('barrio-click', {
        detail: e.features[0]
      });
      map.current!.getCanvas().dispatchEvent(customEvent);
    }
  });

      console.log(`Capa coroplética ${layerId} agregada exitosamente`);
    } catch (err) {
      console.error(`Error al agregar capa coroplética ${layerId}:`, err);
      setError(err instanceof Error ? err.message : 'Error al agregar capa coroplética');
    }
  };

  const addGeoJSONLayer = (
    layerId: string,
    geoJSON: any,
    paintOptions: {
      fillColor?: string | any[];
      fillOpacity?: number;
      strokeColor?: string;
      strokeWidth?: number;
      strokeOpacity?: number;
    } = {}
  ) => {
    if (!isMapReadyForLayers()) {
      console.log('Mapa no está listo para agregar capas GeoJSON');
      return;
    }

    try {
      // Verificar si la capa ya existe
      if (map.current!.getLayer(layerId)) {
        console.log(`Capa GeoJSON ${layerId} ya existe, removiendo...`);
        removeLayer(layerId);
        removeLayer(`${layerId}-border`);
      }

      // Agregar fuente de datos
      map.current!.addSource(layerId, {
        type: 'geojson',
        data: geoJSON
      });

      // Agregar capa de relleno
      map.current!.addLayer({
        id: layerId,
        type: 'fill',
        source: layerId,
        paint: {
          'fill-color': paintOptions.fillColor || '#3388ff',
          'fill-opacity': paintOptions.fillOpacity || 0.3
        }
      });

      // Agregar borde
      map.current!.addLayer({
        id: `${layerId}-border`,
        type: 'line',
        source: layerId,
        paint: {
          'line-color': paintOptions.strokeColor || '#ffffff',
          'line-width': paintOptions.strokeWidth || 1,
          'line-opacity': paintOptions.strokeOpacity || 0.8
        }
      });

      console.log(`Capa GeoJSON ${layerId} agregada exitosamente`);
    } catch (err) {
      console.error(`Error al agregar capa GeoJSON ${layerId}:`, err);
      setError(err instanceof Error ? err.message : 'Error al agregar capa GeoJSON');
    }
  };

  return {
    mapContainer,
    map: map.current || null,
    isReady,
    styleLoaded,
    error,
    addHeatmapLayer,
    removeLayer,
    updateMapStyle,
    set3DMode,
    flyTo,
    zoomIn,
    zoomOut,
    fitBounds,
    resetView,
    addChoroplethLayer,
    addGeoJSONLayer
  };
};
