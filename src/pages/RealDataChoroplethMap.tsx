import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import geoBarranquilla from '../data/geo-barranquilla.json';
import { supabase } from '@/lib/supabase'; // Asegúrate de tener configurado tu cliente de supabase

interface DataPoint {
  barrio: string;
  localidad: string;
  coordx: number;
  coordy: number;
  total_encuestas: number;
  matches_count: number;
  match_percentage: number;
  intensity_score: number;
}

const RealDataChoroplethMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [lng] = useState(-74.8304);
  const [lat] = useState(10.9685);
  const [zoom] = useState(12);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapData, setMapData] = useState<DataPoint[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("SALUD"); // Categoría predeterminada

  // Lista de categorías disponibles
  const categories = [
    { key: "SALUD", label: "Salud" },
    { key: "CERTIFICADO", label: "Certificado" },
    { key: "NECESIDADES", label: "Necesidades" },
    { key: "ACCESIBILIDAD", label: "Accesibilidad" },
    { key: "CUIDADEOR DE PCD", label: "Cuidador de PCD" },
    { key: "SOCIODEMOGRÁFICO", label: "Sociodemográfico" },
    { key: "CONDICIONES DE VIDA", label: "Condiciones de Vida" },
    { key: "TIPO DE DISCAPACIDAD", label: "Tipo de Discapacidad" },
    { key: "NECESIDAD DE CUIDADOR", label: "Necesidad de Cuidador" },
    { key: "EDUCACIÓN Y ECONOMÍA", label: "Educación y Economía" },
    { key: "OTROS", label: "Otros" }
  ];

  // Colores en tonalidades azules para los diferentes niveles
  const blueColors = [
    '#EBF8FF', // Azul muy claro
    '#BEE3F8', 
    '#90CDF4', 
    '#63B3ED', 
    '#4299E1',
    '#3182CE', 
    '#2B6CB0', 
    '#2C5282', 
    '#2A4365', 
    '#1A365D'  // Azul muy oscuro
  ];

  // Cargar datos reales del API
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Intentar usar la función SQL optimizada para obtener los datos
      // Puedes ajustar esto según la estructura real de tu API
      const { data, error } = await supabase.rpc('get_heatmap_data', {
        category_filter: selectedCategory || null
      });
      
      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        // Formatear los datos recibidos
        const formattedData = data.map((item: any) => ({
          barrio: item.barrio || "Desconocido",
          localidad: item.localidad || "Metropolitana",
          coordx: parseFloat(item.coordx || 0),
          coordy: parseFloat(item.coordy || 0),
          total_encuestas: parseInt(item.total_encuestas || 1),
          matches_count: parseInt(item.matches_count || 1),
          match_percentage: parseFloat(item.match_percentage || 100),
          intensity_score: parseFloat(item.intensity_score || 100)
        }));
        
        setMapData(formattedData);
        console.log('Datos cargados:', formattedData.length, 'puntos');
      } else {
        // Si no hay datos, establecer array vacío
        setMapData([]);
        console.log('No se encontraron datos para la categoría:', selectedCategory);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error cargando datos:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  // Efecto para cargar datos cuando cambie la categoría
  useEffect(() => {
    fetchData();
  }, [fetchData, selectedCategory]);

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

    // Esperar a que el mapa se cargue
    map.current.on('load', () => {
      updateMapData();
    });

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [lng, lat, zoom]);

  // Función para actualizar los datos del mapa
  const updateMapData = useCallback(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;
    
    // Si no hay datos, no hacer nada
    if (mapData.length === 0) return;

    // Crear un mapeo de los datos por barrio para usarlo con el GeoJSON
    const barrioDataMap = mapData.reduce((acc, item) => {
      acc[item.barrio] = item;
      return acc;
    }, {} as Record<string, DataPoint>);

    // Construir FeatureCollection con los datos reales
    const buildFeatureCollection = () => {
      const features = (geoBarranquilla as any).features.map((f: any) => {
        const nombre = String(f?.properties?.nombre || 'Barrio');
        // Buscar si tenemos datos reales para este barrio
        const barrioData = barrioDataMap[nombre] || null;
        
        return {
          ...f,
          properties: {
            ...f.properties,
            // Usar datos reales o valores por defecto
            total_encuestas: barrioData?.total_encuestas || 0,
            matches_count: barrioData?.matches_count || 0,
            match_percentage: barrioData?.match_percentage || 0,
            intensity_score: barrioData?.intensity_score || 0,
            // Usar intensity_score como valor para colorear
            score: barrioData?.intensity_score || 0
          }
        };
      });
      return { type: 'FeatureCollection', features } as any;
    };

    // Verificar si ya existe la fuente
    const sourceExists = map.current.getSource('barranquilla');
    
    if (sourceExists) {
      // Actualizar datos de la fuente existente
      (map.current.getSource('barranquilla') as maplibregl.GeoJSONSource).setData(buildFeatureCollection());
    } else {
      // Agregar la fuente de datos
      map.current.addSource('barranquilla', {
        type: 'geojson',
        data: buildFeatureCollection()
      });

      // Agregar capa de polígonos para los barrios
      map.current.addLayer({
        id: 'barrios',
        type: 'fill',
        source: 'barranquilla',
        paint: {
          // Pintar según score (intensity_score de la API)
          'fill-color': [
            'step',
            ['coalesce', ['get', 'score'], 0],
            blueColors[0],   // 0-10
            10, blueColors[1], // 10-20
            20, blueColors[2], // 20-30
            30, blueColors[3], // 30-40
            40, blueColors[4], // 40-50
            50, blueColors[5], // 50-60
            60, blueColors[6], // 60-70
            70, blueColors[7], // 70-80
            80, blueColors[8], // 80-90
            90, blueColors[9]  // 90-100
          ],
          'fill-opacity': 0.7,
          'fill-outline-color': '#FFFFFF'
        }
      });

      // Agregar capa de contornos
      map.current.addLayer({
        id: 'barrios-outline',
        type: 'line',
        source: 'barranquilla',
        paint: {
          'line-color': '#FFFFFF',
          'line-width': 1
        }
      });

      // Agregar interactividad
      map.current.on('mouseenter', 'barrios', () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = 'pointer';
        }
      });

      map.current.on('mouseleave', 'barrios', () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = '';
        }
      });

      // Mostrar información del barrio al hacer click
      map.current.on('click', 'barrios', (e) => {
        if (e.features && e.features[0]) {
          const properties = e.features[0].properties;
          new maplibregl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`
              <div style="min-width:220px">
                <h3 class="font-bold">${properties.nombre || 'Sin nombre'}</h3>
                <div style="margin-top:6px">
                  <div><strong>Total encuestas:</strong> ${properties.total_encuestas || 0}</div>
                  <div><strong>Coincidencias:</strong> ${properties.matches_count || 0}</div>
                  <div><strong>Porcentaje:</strong> ${properties.match_percentage?.toFixed(1) || 0}%</div>
                  <div><strong>Puntuación:</strong> ${properties.intensity_score?.toFixed(1) || 0}</div>
                </div>
                <hr style="margin:8px 0" />
                <div>Localidad: ${properties.localidad}</div>
                <div>Categoría: ${selectedCategory}</div>
              </div>
            `)
            .addTo(map.current!);
        }
      });
    }
  }, [mapData, selectedCategory]);

  // Actualizar el mapa cuando cambien los datos
  useEffect(() => {
    if (map.current && map.current.isStyleLoaded()) {
      updateMapData();
    }
  }, [mapData, updateMapData]);

  return (
    <div className="flex h-screen">
      {/* Panel de control */}
      <div className="w-80 bg-gray-800 p-4 text-white overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Mapa de Distribución</h2>
        <div className="space-y-4">
          {/* Selector de categoría */}
          <div>
            <h3 className="font-semibold mb-2">Categoría</h3>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-gray-700 text-white p-2 rounded"
            >
              {categories.map(cat => (
                <option key={cat.key} value={cat.key}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Estado */}
          <div>
            <h3 className="font-semibold mb-2">Estado</h3>
            {loading ? (
              <div className="text-blue-400">Cargando datos...</div>
            ) : error ? (
              <div className="text-red-400">{error}</div>
            ) : (
              <div className="text-green-400">{mapData.length} registros encontrados</div>
            )}
            <button 
              onClick={() => fetchData()}
              className="mt-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm w-full"
              disabled={loading}
            >
              Actualizar datos
            </button>
          </div>

          {/* Leyenda con tonos azules */}
          <div>
            <h3 className="font-semibold mb-2">Leyenda</h3>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2"><span className="w-4 h-4" style={{ background: blueColors[0] }}></span><span>0 - 10</span></div>
              <div className="flex items-center gap-2"><span className="w-4 h-4" style={{ background: blueColors[1] }}></span><span>10 - 20</span></div>
              <div className="flex items-center gap-2"><span className="w-4 h-4" style={{ background: blueColors[2] }}></span><span>20 - 30</span></div>
              <div className="flex items-center gap-2"><span className="w-4 h-4" style={{ background: blueColors[3] }}></span><span>30 - 40</span></div>
              <div className="flex items-center gap-2"><span className="w-4 h-4" style={{ background: blueColors[4] }}></span><span>40 - 50</span></div>
              <div className="flex items-center gap-2"><span className="w-4 h-4" style={{ background: blueColors[5] }}></span><span>50 - 60</span></div>
              <div className="flex items-center gap-2"><span className="w-4 h-4" style={{ background: blueColors[6] }}></span><span>60 - 70</span></div>
              <div className="flex items-center gap-2"><span className="w-4 h-4" style={{ background: blueColors[7] }}></span><span>70 - 80</span></div>
              <div className="flex items-center gap-2"><span className="w-4 h-4" style={{ background: blueColors[8] }}></span><span>80 - 90</span></div>
              <div className="flex items-center gap-2"><span className="w-4 h-4" style={{ background: blueColors[9] }}></span><span>90 - 100</span></div>
            </div>
          </div>

          {/* Info */}
          <div>
            <h3 className="font-semibold mb-2">Información</h3>
            <div className="text-sm space-y-1">
              <p>Centro: [{lng.toFixed(4)}, {lat.toFixed(4)}]</p>
              <p>Zoom: {zoom}</p>
              <p>Categoría: {selectedCategory}</p>
            </div>
          </div>

          {/* Descripción de los datos */}
          <div>
            <h3 className="font-semibold mb-2">Descripción</h3>
            <p className="text-xs text-gray-300">
              Este mapa muestra la distribución de intensidad para la categoría seleccionada.
              Los colores más oscuros indican mayor intensidad o relevancia.
            </p>
          </div>
        </div>
      </div>

      {/* Mapa */}
      <div ref={mapContainer} className="flex-1" />
    </div>
  );
};

export default RealDataChoroplethMap;
