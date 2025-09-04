import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import geoBarranquilla from '../data/geo-barranquilla.json';

const TestMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [lng] = useState(-74.8304);
  const [lat] = useState(10.9685);
  const [zoom] = useState(12);
  const legendRef = useRef<HTMLDivElement>(null);

  // Colores del DANE para el mapa coroplético (estilo actualizado)
  const daneColors = [
    '#E6F5F5', // Valor más bajo - turquesa muy claro
    '#99D8D8', // turquesa claro
    '#66B2B2', // turquesa medio
    '#008080', // turquesa oscuro
    '#005555'  // Valor más alto - turquesa muy oscuro
  ];

  // Pregunta de ejemplo
  const pregunta = "¿Cuántas personas viven en este hogar?";

  useEffect(() => {
    if (!mapContainer.current) return;

    // Inicializar el mapa
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap Contributors'
          }
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      },
      center: [lng, lat],
      zoom: zoom
    });

    // Agregar controles de navegación
    map.current.addControl(new maplibregl.NavigationControl());

    map.current.on('load', () => {
      // Procesar el GeoJSON para agregar datos de respuestas simuladas
      const features = geoBarranquilla.features.map(feature => ({
        ...feature,
        properties: {
          ...feature.properties,
          respuestas: Math.floor(Math.random() * 100) // Simulamos respuestas aleatorias
        }
      }));

      // Agregar la fuente de datos
      map.current?.addSource('barranquilla', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features
        }
      });

      // Agregar capa de polígonos
      map.current?.addLayer({
        id: 'barrios',
        type: 'fill',
        source: 'barranquilla',
        paint: {
          'fill-color': [
            'step',
            ['coalesce', ['get', 'respuestas'], 0],
            daneColors[0],   // 0-20 respuestas
            20, daneColors[1], // 20-40 respuestas
            40, daneColors[2], // 40-60 respuestas
            60, daneColors[3], // 60-80 respuestas
            80, daneColors[4]  // 80+ respuestas
          ],
          'fill-opacity': 0.8,
          'fill-outline-color': '#FFFFFF'
        }
      });

      // Agregar capa de contornos
      map.current?.addLayer({
        id: 'barrios-outline',
        type: 'line',
        source: 'barranquilla',
        paint: {
          'line-color': '#FFFFFF',
          'line-width': 1
        }
      });

      // Interactividad
      map.current?.on('mouseenter', 'barrios', () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = 'pointer';
        }
      });

      map.current?.on('mouseleave', 'barrios', () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = '';
        }
      });

      // Popup con información
      map.current?.on('click', 'barrios', (e) => {
        if (e.features && e.features[0]) {
          const properties = e.features[0].properties;
          new maplibregl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`
              <div class="p-4">
                <h3 class="font-bold text-lg mb-2">${properties.nombre || 'Sin nombre'}</h3>
                <p class="mb-2"><strong>Pregunta:</strong> ${pregunta}</p>
                <p class="mb-2"><strong>Total de respuestas:</strong> ${properties.respuestas}</p>
                <p><strong>Localidad:</strong> ${properties.localidad}</p>
                <p><strong>Pieza Urbana:</strong> ${properties.pieza_urba}</p>
              </div>
            `)
            .addTo(map.current!);
        }
      });

      // Crear y agregar la leyenda
      const legend = document.createElement('div');
      legend.className = 'map-legend';
      legend.innerHTML = `
        <div class="bg-white p-4 rounded-lg shadow-lg">
          <h4 class="font-bold mb-3">Total de Respuestas</h4>
          <div class="space-y-2">
            ${[
              '0-20',
              '20-40',
              '40-60',
              '60-80',
              '80+'
            ].map((range, i) => `
              <div class="flex items-center">
                <span class="inline-block w-6 h-6 mr-2" style="background-color: ${daneColors[i]}"></span>
                <span>${range}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      legend.style.position = 'absolute';
      legend.style.bottom = '24px';
      legend.style.right = '24px';

      mapContainer.current?.appendChild(legend);
      legendRef.current = legend;
    });

    // Cleanup
    return () => {
      map.current?.remove();
      legendRef.current?.remove();
    };
  }, [lng, lat, zoom]);

  return (
    <div className="flex h-screen">
      {/* Panel de control */}
      <div className="w-64 bg-gray-800 p-4 text-white">
        <h2 className="text-xl font-bold mb-4">Visualización de Respuestas</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Pregunta Actual</h3>
            <p className="text-sm">{pregunta}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Información</h3>
            <div className="text-sm space-y-1">
              <p>Centro: [{lng.toFixed(4)}, {lat.toFixed(4)}]</p>
              <p>Zoom: {zoom}</p>
            </div>
          </div>

          <div className="text-xs text-gray-400">
            <p>Visualización de respuestas por barrio en la ciudad de Barranquilla.</p>
          </div>
        </div>
      </div>

      {/* Mapa */}
      <div ref={mapContainer} className="flex-1" />
    </div>
  );
};

export default TestMap;
