import geoBarranquilla from '@/data/geo-barranquilla.json';
import { transformSurveyCoordinates } from './coordinateUtils';

interface SurveyData {
  barrio: string;
  localidad: string;
  coordx: number;
  coordy: number;
  total_encuestas: number;
  matches_count: number;
  match_percentage: number;
  intensity_score: number;
}

/**
 * Procesa y valida los datos de la encuesta para el mapa de calor
 */
export const processHeatmapData = (data: Array<{
  barrio: string;
  localidad: string;
  coordx: number;
  coordy: number;
  total_encuestas: number;
  matches_count: number;
  match_percentage: number;
  intensity_score: number;
}>) => {
  if (!data || data.length === 0) {
    console.warn('⚠️ No hay datos para procesar');
    return [];
  }

  try {
    console.log('🔄 Procesando', data.length, 'puntos para el mapa de calor');

    // Transformar datos al formato esperado por el HeatmapManager
    return data.map(point => ({
      barrio: point.barrio,
      localidad: point.localidad,
      coordx: point.coordx,
      coordy: point.coordy,
      total_encuestas: point.total_encuestas,
      matches_count: point.matches_count,
      match_percentage: point.match_percentage,
      intensity_score: point.intensity_score
    }));

    // Encontrar valores máximos para normalización
    const maxIntensity = Math.max(...validPoints.map(p => p.intensity_score));
    const maxMatches = Math.max(...validPoints.map(p => p.matches_count));
    const maxTotal = Math.max(...validPoints.map(p => p.total_encuestas));

    // Crear un mapa de datos por barrio
    const barrioDataMap = new Map(
      validPoints.map(point => [point.barrio.toLowerCase(), point])
    );

    // Procesar features
    const features = validPoints.flatMap(point => {
      // Convertir coordenadas a números
      const longitude = Number(point.coordx);
      const latitude = Number(point.coordy);

      // Transformar coordenadas si es necesario
      const [transformedLng, transformedLat] = transformSurveyCoordinates(longitude, latitude);

      // Normalizar valores
      const normalizedIntensity = maxIntensity > 0 ? (point.intensity_score / maxIntensity) * 100 : 50;
      const normalizedMatches = maxMatches > 0 ? (point.matches_count / maxMatches) * 100 : 50;

      // Calcular intensidad combinada
      const intensity = Math.min((normalizedIntensity + normalizedMatches) / 2, 100);

      // Crear punto principal
      const mainPoint = {
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [transformedLng, transformedLat]
        },
        properties: {
          id: `${point.barrio}-${transformedLng}-${transformedLat}`,
          barrio: point.barrio,
          localidad: point.localidad,
          total_encuestas: point.total_encuestas,
          matches_count: point.matches_count,
          match_percentage: point.match_percentage,
          intensity_score: intensity,
          // Propiedades adicionales para visualización
          weight: intensity / 100,
          magnitude: point.total_encuestas / maxTotal,
          category: point.localidad
        }
      };

      const results = [mainPoint];

      // Buscar y añadir geometría del barrio si existe
      const barrioFeature = geoBarranquilla.features.find(f => 
        f.properties.nombre?.toLowerCase() === point.barrio.toLowerCase()
      );

      if (barrioFeature) {
        results.push({
          type: 'Feature' as const,
          geometry: barrioFeature.geometry,
          properties: {
            ...mainPoint.properties,
            isPolygon: true
          }
        });
      }

      return results;
    });

    // Log para debugging
    console.log('🔍 Muestra de features procesados:', 
      features.slice(0, 2).map(f => ({
        coords: f.geometry.coordinates,
        intensity: f.properties.intensity_score,
        barrio: f.properties.barrio
      }))
    );

    return features;
  } catch (error) {
    console.error('❌ Error procesando datos:', error);
    return [];
  }
};
