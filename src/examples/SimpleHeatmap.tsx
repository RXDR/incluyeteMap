import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const DUMMY_DATA = [
  { lat: 10.96854, lng: -74.78132, value: 100 }, // Centro de Barranquilla
  { lat: 10.97854, lng: -74.77132, value: 75 },
  { lat: 10.95854, lng: -74.79132, value: 50 },
  { lat: 10.98854, lng: -74.76132, value: 25 }
];

export const SimpleHeatmap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://api.maptiler.com/maps/basic-v2/style.json?key=YOUR_MAPTILER_KEY', // Reemplaza con tu key
      center: [-74.78132, 10.96854], // [longitude, latitude] de Barranquilla
      zoom: 12
    });

    map.current.on('load', () => {
      const mapInstance = map.current;
      if (!mapInstance) return;

      // Add the source first
      map.addSource('points', {
        'type': 'geojson',
        'data': {
          'type': 'FeatureCollection',
          'features': DUMMY_DATA.map(point => ({
            'type': 'Feature',
            'geometry': {
              'type': 'Point',
              'coordinates': [point.lng, point.lat] // [longitude, latitude]
            },
            'properties': {
              'value': point.value
            }
          }))
        }
      });

      // Add heatmap layer
      map.addLayer({
        'id': 'heatmap',
        'type': 'heatmap',
        'source': 'points',
        'paint': {
          // Adjust weight based on value property
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'value'],
            0, 0,
            100, 1
          ],
          // Color gradient
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(0, 0, 255, 0)',
            0.2, 'rgba(0, 0, 255, 0.5)',
            0.4, 'rgba(0, 255, 0, 0.5)',
            0.6, 'rgba(255, 255, 0, 0.5)',
            0.8, 'rgba(255, 102, 0, 0.5)',
            1, 'rgba(255, 0, 0, 0.5)'
          ],
          // Size of the heatmap points
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 2,
            9, 20
          ],
          // Opacity based on zoom level
          'heatmap-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            7, 1,
            9, 0.5
          ]
        }
      });

      // Add a points layer on top
      map.addLayer({
        'id': 'points',
        'type': 'circle',
        'source': 'points',
        'paint': {
          'circle-radius': 6,
          'circle-color': '#FFFFFF',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#000000'
        }
      });

      // Log for debugging
      console.log('✅ Heatmap layers added');
      console.log('Data points:', DUMMY_DATA);
      console.log('Map center:', map.getCenter());
      console.log('Map zoom:', map.getZoom());
      
      // Add debug click handler
      map.on('click', (e) => {
        console.log('Click coordinates:', e.lngLat);
      });
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  return (
    <div>
      <div ref={mapContainer} style={{ width: '100%', height: '500px' }} />
      <div className="p-4 bg-gray-800 text-white">
        <h3 className="font-bold mb-2">Debug Info</h3>
        <pre className="text-xs">
          {JSON.stringify(DUMMY_DATA, null, 2)}
        </pre>
      </div>
    </div>
  );
};
