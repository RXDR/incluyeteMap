import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface DaneStyleMapProps {
  data: Array<{
    properties: {
      barrio: string;
      localidad: string;
      total_encuestas: number;
    };
    geometry: {
      coordinates: [number, number];
    };
  }>;
}

const DaneStyleMap = ({ data }: DaneStyleMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [opacity, setOpacity] = useState(100);

  // Definir los breakpoints y colores como el DANE
  const breaks = [6829, 70994, 229335, 319306, 509169];
  const colors = [
    '#E3F2FD', // Muy bajo
    '#90CAF9', // Bajo
    '#42A5F5', // Medio
    '#1E88E5', // Alto
    '#0D47A1'  // Muy alto
  ];

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
            attribution: '&copy; OpenStreetMap Contributors'
          }
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm',
            paint: {
              'raster-opacity': 0.5 // Fondo más tenue como el DANE
            }
          }
        ]
      },
      center: [-74.8304, 10.9685], // Barranquilla
      zoom: 12
    });

    // Agregar controles como el DANE
    map.current.addControl(new maplibregl.NavigationControl());
    map.current.addControl(new maplibregl.ScaleControl());

    map.current.on('load', () => {
      // Agregar source con los datos
      map.current?.addSource('survey-data', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: data.map(d => ({
            type: 'Feature',
            properties: {
              ...d.properties,
              value: d.properties.total_encuestas
            },
            geometry: {
              type: 'Point',
              coordinates: d.geometry.coordinates
            }
          }))
        }
      });

      // Capa de coropletas estilo DANE
      map.current?.addLayer({
        id: 'dane-choropleth',
        type: 'circle',
        source: 'survey-data',
        paint: {
          'circle-radius': [
            'step',
            ['get', 'value'],
            10,  // radio por defecto
            breaks[0], 12,
            breaks[1], 15,
            breaks[2], 18,
            breaks[3], 21,
            breaks[4], 24
          ],
          'circle-color': [
            'step',
            ['get', 'value'],
            colors[0],
            breaks[0], colors[0],
            breaks[1], colors[1],
            breaks[2], colors[2],
            breaks[3], colors[3],
            breaks[4], colors[4]
          ],
          'circle-opacity': opacity / 100,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#FFFFFF',
          'circle-stroke-opacity': 0.5
        }
      });

      // Agregar popups estilo DANE
      map.current?.on('click', 'dane-choropleth', (e) => {
        if (!e.features?.[0]) return;

        const props = e.features[0].properties;
        const coordinates = e.features[0].geometry.type === 'Point' 
          ? (e.features[0].geometry as any).coordinates.slice()
          : e.lngLat;

        new maplibregl.Popup()
          .setLngLat(coordinates)
          .setHTML(`
            <div style="font-family: Arial, sans-serif;">
              <h3 style="margin: 0 0 5px; font-size: 14px; font-weight: bold;">
                ${props.barrio}
              </h3>
              <p style="margin: 0; font-size: 12px;">
                Localidad: ${props.localidad}<br>
                Total encuestas: ${props.total_encuestas.toLocaleString()}
              </p>
            </div>
          `)
          .addTo(map.current!);
      });

      // Cambiar el cursor al pasar sobre los puntos
      map.current?.on('mouseenter', 'dane-choropleth', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });

      map.current?.on('mouseleave', 'dane-choropleth', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
    });

    return () => {
      map.current?.remove();
    };
  }, [data]);

  return (
    <div className="relative h-screen">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Panel de control estilo DANE */}
      <div className="absolute top-4 right-4 bg-white p-4 rounded shadow-lg">
        <h3 className="text-sm font-bold mb-2">Transparencia del mapa</h3>
        <input
          type="range"
          min="0"
          max="100"
          value={opacity}
          onChange={(e) => setOpacity(Number(e.target.value))}
          className="w-full"
        />
        
        {/* Leyenda */}
        <div className="mt-4">
          <h3 className="text-sm font-bold mb-2">Leyenda</h3>
          <div className="space-y-1">
            {breaks.map((breakValue, i) => (
              <div key={i} className="flex items-center text-xs">
                <div 
                  className="w-4 h-4 mr-2" 
                  style={{ backgroundColor: colors[i] }}
                />
                <span>
                  {i === 0 ? '< ' : ''}
                  {breakValue.toLocaleString()}
                  {i === breaks.length - 1 ? '+' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DaneStyleMap;
