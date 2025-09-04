const BARRANQUILLA_BOUNDS = {
  west: -74.9,
  east: -74.7,
  south: 10.9,
  north: 11.1
};

/**
 * Validates and fixes coordinates for MapLibre GL
 * Ensure coordinates are within Barranquilla's bounds
 */
export const validateCoordinates = (lon: number, lat: number): [number, number] => {
  try {
    // Validación básica de coordenadas
    if (isNaN(lon) || isNaN(lat)) {
      console.warn('⚠️ Coordenadas inválidas:', { lon, lat });
      return [BARRANQUILLA_BOUNDS.west + (BARRANQUILLA_BOUNDS.east - BARRANQUILLA_BOUNDS.west) / 2,
              BARRANQUILLA_BOUNDS.south + (BARRANQUILLA_BOUNDS.north - BARRANQUILLA_BOUNDS.south) / 2];
    }

    // Verificar si las coordenadas están en el rango aproximado de Barranquilla
    const isInRange = lon >= -75 && lon <= -74 && lat >= 10 && lat <= 12;
    
    if (!isInRange) {
      console.warn('⚠️ Coordenadas fuera del rango de Barranquilla:', { lon, lat });
      
      // Si las coordenadas están muy fuera de rango, usar el centro de Barranquilla
      if (Math.abs(lon) > 180 || Math.abs(lat) > 90) {
        return [BARRANQUILLA_BOUNDS.west + (BARRANQUILLA_BOUNDS.east - BARRANQUILLA_BOUNDS.west) / 2,
                BARRANQUILLA_BOUNDS.south + (BARRANQUILLA_BOUNDS.north - BARRANQUILLA_BOUNDS.south) / 2];
      }
    }

    // Restringir al área de Barranquilla
    const validLon = Math.max(BARRANQUILLA_BOUNDS.west, Math.min(BARRANQUILLA_BOUNDS.east, lon));
    const validLat = Math.max(BARRANQUILLA_BOUNDS.south, Math.min(BARRANQUILLA_BOUNDS.north, lat));

    return [validLon, validLat];
  } catch (error) {
    console.error('❌ Error validando coordenadas:', error);
    // Retornar centro de Barranquilla en caso de error
    return [-74.8, 11.0];
  }
};

/**
 * Transforms coordinates from the survey format to MapLibre format
 * Handles potential coordinate order issues
 */
export const transformSurveyCoordinates = (coordx: number, coordy: number): [number, number] => {
  try {
    // Verificar si las coordenadas parecen estar invertidas
    // En Barranquilla, la longitud (coordx) debe ser cercana a -74
    // y la latitud (coordy) debe ser cercana a 11
    const seemsInverted = 
      (Math.abs(coordx) < 20 && Math.abs(coordy) > 70) || // Caso común de inversión
      (coordx > 0 && coordy < 0); // Otro caso de posible inversión

    if (seemsInverted) {
      console.warn('⚠️ Corrigiendo coordenadas invertidas:', { original: [coordx, coordy] });
      return validateCoordinates(coordy, coordx);
    }

    // Si las coordenadas ya parecen estar en el orden correcto
    return validateCoordinates(coordx, coordy);
  } catch (error) {
    console.error('❌ Error transformando coordenadas:', error);
    // Retornar centro de Barranquilla en caso de error
    return [-74.8, 11.0];
  }
};
