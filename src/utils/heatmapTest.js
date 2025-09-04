// 🔍 PRUEBA: VERIFICAR SOPORTE DE HEATMAP EN MAPLIBRE GL
// Archivo de prueba para verificar si MapLibre GL soporta heatmaps

import maplibregl from 'maplibre-gl';

// Datos de prueba
const testData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-74.8032007, 10.9388604] // Barranquilla
      },
      properties: {
        intensity_score: 60,
        barrio: '20 de Julio',
        localidad: 'Metropolitana'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-74.828247, 10.930659]
      },
      properties: {
        intensity_score: 100,
        barrio: '20 de Julio',
        localidad: 'Metropolitana'
      }
    }
  ]
};

// Función de prueba para verificar soporte de heatmap
export function testHeatmapSupport() {
  console.log('🔍 Probando soporte de heatmap en MapLibre GL v5.7.0');
  
  // Verificar si MapLibre GL tiene soporte nativo para heatmap
  const hasHeatmapSupport = maplibregl && typeof maplibregl !== 'undefined';
  console.log('✅ MapLibre GL disponible:', hasHeatmapSupport);
  
  // Verificar tipos de capas soportados
  const supportedLayerTypes = [
    'fill',
    'line', 
    'symbol',
    'circle',
    'heatmap', // ❌ Este puede no estar soportado
    'hillshade',
    'background'
  ];
  
  console.log('📋 Tipos de capas soportados:', supportedLayerTypes);
  
  return {
    hasHeatmapSupport,
    supportedLayerTypes,
    testData
  };
}

// Configuración de prueba para heatmap
export const heatmapTestConfig = {
  // ❌ CONFIGURACIÓN PROBLEMÁTICA (puede no funcionar)
  heatmapLayer: {
    id: 'test-heatmap',
    type: 'heatmap', // ❌ Este tipo puede no estar soportado
    source: 'test-data',
    paint: {
      'heatmap-weight': ['get', 'intensity_score'],
      'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
      'heatmap-color': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0, 'rgba(0, 0, 255, 0)',
        0.2, 'rgba(0, 0, 255, 0.5)',
        0.4, 'rgba(0, 255, 0, 0.5)',
        0.6, 'rgba(255, 255, 0, 0.5)',
        0.8, 'rgba(255, 165, 0, 0.5)',
        1, 'rgba(255, 0, 0, 0.8)'
      ],
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 9, 20],
      'heatmap-opacity': 0.8
    }
  },
  
  // ✅ CONFIGURACIÓN ALTERNATIVA (debería funcionar)
  circleLayer: {
    id: 'test-circle-heatmap',
    type: 'circle',
    source: 'test-data',
    paint: {
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['get', 'intensity_score'],
        0, 5,
        100, 30
      ],
      'circle-color': [
        'interpolate',
        ['linear'],
        ['get', 'intensity_score'],
        0, 'rgba(0, 0, 255, 0.1)',
        25, 'rgba(0, 255, 0, 0.3)',
        50, 'rgba(255, 255, 0, 0.5)',
        75, 'rgba(255, 165, 0, 0.7)',
        100, 'rgba(255, 0, 0, 0.9)'
      ],
      'circle-blur': 0.8,
      'circle-opacity': 0.7
    }
  }
};

// Función para probar ambas configuraciones
export async function testBothConfigurations(map) {
  if (!map) {
    console.error('❌ Mapa no disponible para pruebas');
    return;
  }
  
  try {
    // Agregar fuente de datos de prueba
    map.addSource('test-data', {
      type: 'geojson',
      data: testData
    });
    console.log('✅ Fuente de datos de prueba agregada');
    
    // Probar configuración de círculos (debería funcionar)
    try {
      map.addLayer(heatmapTestConfig.circleLayer);
      console.log('✅ Capa de círculos agregada exitosamente');
    } catch (error) {
      console.error('❌ Error al agregar capa de círculos:', error);
    }
    
    // Probar configuración de heatmap (puede fallar)
    try {
      map.addLayer(heatmapTestConfig.heatmapLayer);
      console.log('✅ Capa de heatmap agregada exitosamente');
    } catch (error) {
      console.error('❌ Error al agregar capa de heatmap:', error.message);
      console.log('💡 MapLibre GL no soporta nativamente type: "heatmap"');
    }
    
  } catch (error) {
    console.error('❌ Error general en pruebas:', error);
  }
}
