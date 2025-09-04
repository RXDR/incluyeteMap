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
  const [selectedQuestion, setSelectedQuestion] = useState(0);

  // Lista de preguntas de ejemplo
  const questions = [
    {
      id: 0,
      question: "¿Cuántas personas viven en este hogar?",
      description: "Total de personas que habitan en la vivienda",
      ranges: ["0-2", "3-4", "5-6", "7-8", "9+"]
    },
    {
      id: 1,
      question: "¿Cuántos hogares hay en esta vivienda?",
      description: "Número de grupos familiares en la vivienda",
      ranges: ["1", "2", "3", "4", "5+"]
    },
    {
      id: 2,
      question: "¿Cuál es el ingreso promedio del hogar?",
      description: "Ingreso mensual promedio en pesos colombianos",
      ranges: ["0-1M", "1M-2M", "2M-3M", "3M-4M", "4M+"]
    }
  ];

  // Colores del DANE para el mapa coroplético
  const daneColors = [
    '#E6F5F5', // Valor más bajo - turquesa muy claro
    '#99D8D8', // turquesa claro
    '#66B2B2', // turquesa medio
    '#008080', // turquesa oscuro
    '#005555'  // Valor más alto - turquesa muy oscuro
  ];

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
      // Simular diferentes respuestas para cada pregunta
      const features = geoBarranquilla.features.map(feature => ({
        ...feature,
        properties: {
          ...feature.properties,
          respuestas: [
            Math.floor(Math.random() * 100),
            Math.floor(Math.random() * 100),
            Math.floor(Math.random() * 100)
          ]
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
            ['at', ['get', 'respuestas'], ['literal', selectedQuestion]],
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
          const currentQuestion = questions[selectedQuestion];
          new maplibregl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`
              <div class="p-4 max-w-sm">
                <h3 class="font-bold text-lg mb-2">${properties.nombre || 'Sin nombre'}</h3>
                <div class="mb-3 p-2 bg-blue-50 rounded">
                  <p class="font-medium">${currentQuestion.question}</p>
                  <p class="text-sm text-gray-600">${currentQuestion.description}</p>
                </div>
                <p class="mb-2">
                  <strong>Respuestas:</strong> ${properties.respuestas[selectedQuestion]}
                </p>
                <div class="text-sm text-gray-600">
                  <p><strong>Localidad:</strong> ${properties.localidad}</p>
                  <p><strong>Pieza Urbana:</strong> ${properties.pieza_urba}</p>
                </div>
              </div>
            `)
            .addTo(map.current!);
        }
      });
    });

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [lng, lat, zoom, selectedQuestion]);

  // Actualizar el estilo cuando cambia la pregunta seleccionada
  useEffect(() => {
    if (map.current) {
      map.current.setPaintProperty('barrios', 'fill-color', [
        'step',
        ['at', ['get', 'respuestas'], ['literal', selectedQuestion]],
        daneColors[0],   // 0-20 respuestas
        20, daneColors[1], // 20-40 respuestas
        40, daneColors[2], // 40-60 respuestas
        60, daneColors[3], // 60-80 respuestas
        80, daneColors[4]  // 80+ respuestas
      ]);
    }
  }, [selectedQuestion]);

  return (
    <div className="flex h-screen">
      {/* Panel de control */}
      <div className="w-96 bg-gray-800 p-6 text-white overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Encuesta Barranquilla</h2>
        
        <div className="space-y-6">
          {/* Sección de Preguntas */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="font-semibold text-xl mb-4 text-blue-300">Seleccione una Pregunta</h3>
            <div className="space-y-4">
              {questions.map((q, index) => (
                <div 
                  key={q.id}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    selectedQuestion === index 
                      ? 'bg-blue-600 shadow-lg' 
                      : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                  onClick={() => setSelectedQuestion(index)}
                >
                  <p className="font-medium mb-2">{q.question}</p>
                  <p className="text-sm text-gray-300">{q.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Leyenda */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Rangos de Respuestas</h3>
            <div className="space-y-2">
              {questions[selectedQuestion].ranges.map((range, i) => (
                <div key={range} className="flex items-center">
                  <span className="w-4 h-4 mr-2" style={{backgroundColor: daneColors[i]}}></span>
                  <span className="text-sm">{range}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Información del Mapa */}
          <div className="text-xs text-gray-400">
            <p className="mb-2">Centro: [{lng.toFixed(4)}, {lat.toFixed(4)}] | Zoom: {zoom}</p>
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
