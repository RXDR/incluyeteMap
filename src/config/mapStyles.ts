// Configuración de estilos de mapa para diferentes visualizaciones

export const mapStyles = {
  // Estilo básico de MapLibre (actual)
  basic: 'https://demotiles.maplibre.org/style.json',
  
  // Estilo de OpenStreetMap más detallado
  osm: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  
  // Estilo satelital
  satellite: 'https://basemaps.cartocdn.com/gl/satellite-gl-style/style.json',
  
  // Estilo de calles detallado
  streets: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  
  // Estilo personalizado para Barranquilla (similar al DANE)
  barranquilla: {
    version: 8,
    sources: {
      'osm': {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors'
      }
    },
    layers: [
      {
        id: 'osm-tiles',
        type: 'raster',
        source: 'osm',
        minzoom: 0,
        maxzoom: 22
      }
    ]
  }
};

// Configuración específica para Barranquilla
export const barranquillaConfig = {
  center: [-74.7964, 10.9685] as [number, number], // Centro de Barranquilla
  zoom: 12,
  bounds: [
    [-74.9, 10.8], // Southwest
    [-74.7, 11.1]  // Northeast
  ] as [[number, number], [number, number]],
  style: mapStyles.osm // Usar estilo OSM más detallado
};

// Configuración de colores para diferentes métricas
export const metricColors = {
  energia: {
    name: 'Energía',
    unit: '%',
    colors: [
      [0, '#d73027'],    // Rojo oscuro para baja cobertura
      [25, '#fc8d59'],   // Naranja
      [50, '#fee08b'],   // Amarillo
      [75, '#d9ef8b'],   // Verde claro
      [100, '#1a9850']   // Verde oscuro para alta cobertura
    ]
  },
  agua: {
    name: 'Agua',
    unit: '%',
    colors: [
      [0, '#d73027'],
      [25, '#fc8d59'],
      [50, '#fee08b'],
      [75, '#d9ef8b'],
      [100, '#1a9850']
    ]
  },
  internet: {
    name: 'Internet',
    unit: '%',
    colors: [
      [0, '#d73027'],
      [25, '#fc8d59'],
      [50, '#fee08b'],
      [75, '#d9ef8b'],
      [100, '#1a9850']
    ]
  },
  educacion: {
    name: 'Educación',
    unit: '%',
    colors: [
      [0, '#d73027'],
      [25, '#fc8d59'],
      [50, '#fee08b'],
      [75, '#d9ef8b'],
      [100, '#1a9850']
    ]
  },
  salud: {
    name: 'Salud',
    unit: '%',
    colors: [
      [0, '#d73027'],
      [25, '#fc8d59'],
      [50, '#fee08b'],
      [75, '#d9ef8b'],
      [100, '#1a9850']
    ]
  },
  pobreza: {
    name: 'Pobreza',
    unit: '%',
    colors: [
      [0, '#1a9850'],    // Verde para baja pobreza
      [25, '#d9ef8b'],
      [50, '#fee08b'],
      [75, '#fc8d59'],
      [100, '#d73027']   // Rojo para alta pobreza
    ]
  },
  densidad: {
    name: 'Densidad',
    unit: 'hab/km²',
    colors: [
      [0, '#f7fcf5'],
      [10000, '#e5f5e0'],
      [20000, '#a1d99b'],
      [30000, '#74c476'],
      [40000, '#238b45'],
      [50000, '#006d2c']
    ]
  },
  poblacion: {
    name: 'Población',
    unit: 'hab',
    colors: [
      [0, '#f7fcf5'],
      [10000, '#e5f5e0'],
      [20000, '#a1d99b'],
      [30000, '#74c476'],
      [40000, '#238b45'],
      [50000, '#006d2c']
    ]
  }
};
