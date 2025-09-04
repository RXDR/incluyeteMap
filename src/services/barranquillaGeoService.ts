import barranquillaGeoData from '@/data/geo-barranquilla.json';

export interface BarranquillaFeature {
  type: 'Feature';
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  properties: {
    id: number;
    nombre: string;
    localidad: string;
    pieza_urba: string;
  };
}

export interface BarranquillaGeoData {
  type: 'FeatureCollection';
  features: BarranquillaFeature[];
}

export interface BarrioInfo {
  id: number;
  nombre: string;
  localidad: string;
  pieza_urba: string;
  coordinates: [number, number][];
  center: [number, number];
}

export interface LocalidadInfo {
  nombre: string;
  barrios: BarrioInfo[];
  center: [number, number];
}

export class BarranquillaGeoService {
  private static geoData: BarranquillaGeoData = barranquillaGeoData as BarranquillaGeoData;

  /**
   * Limpia y valida el GeoJSON
   */
  private static cleanGeoJSON(): BarranquillaGeoData {
    const cleanedFeatures = this.geoData.features.filter(feature => {
      // Verificar que el feature tenga geometría válida
      if (!feature.geometry || !feature.geometry.coordinates) {
        console.warn(`Feature ${feature.properties?.id} sin geometría válida`);
        return false;
      }

      // Verificar que las coordenadas no estén vacías
      if (!Array.isArray(feature.geometry.coordinates) || 
          feature.geometry.coordinates.length === 0 ||
          !Array.isArray(feature.geometry.coordinates[0]) ||
          feature.geometry.coordinates[0].length === 0) {
        console.warn(`Feature ${feature.properties?.id} con coordenadas vacías`);
        return false;
      }

      // Verificar que las coordenadas tengan al menos 3 puntos para formar un polígono
      if (feature.geometry.coordinates[0].length < 3) {
        console.warn(`Feature ${feature.properties?.id} con menos de 3 coordenadas`);
        return false;
      }

      // Verificar que todas las coordenadas sean números válidos
      const coordinates = feature.geometry.coordinates[0];
      const validCoordinates = coordinates.every(coord => 
        Array.isArray(coord) && 
        coord.length === 2 && 
        typeof coord[0] === 'number' && 
        typeof coord[1] === 'number' &&
        !isNaN(coord[0]) && 
        !isNaN(coord[1])
      );

      if (!validCoordinates) {
        console.warn(`Feature ${feature.properties?.id} con coordenadas inválidas`);
        return false;
      }

      return true;
    });

    console.log(`GeoJSON limpiado: ${this.geoData.features.length} features originales, ${cleanedFeatures.length} features válidas`);

    return {
      type: 'FeatureCollection',
      features: cleanedFeatures
    };
  }

  /**
   * Obtiene todos los barrios del GeoJSON
   */
  static getBarrios(): BarrioInfo[] {
    const cleanData = this.cleanGeoJSON();
    return cleanData.features.map(feature => {
      const coordinates = feature.geometry.coordinates[0] as [number, number][];
      const center = this.calculateCenter(coordinates);
      
      return {
        id: feature.properties.id,
        nombre: feature.properties.nombre,
        localidad: feature.properties.localidad,
        pieza_urba: feature.properties.pieza_urba,
        coordinates,
        center
      };
    });
  }

  /**
   * Obtiene un barrio por ID
   */
  static getBarrioById(id: number): BarrioInfo | undefined {
    const barrios = this.getBarrios();
    return barrios.find(barrio => barrio.id === id);
  }

  /**
   * Obtiene barrios por localidad
   */
  static getBarriosByLocalidad(localidad: string): BarrioInfo[] {
    const barrios = this.getBarrios();
    return barrios.filter(barrio => barrio.localidad === localidad);
  }

  /**
   * Obtiene todas las localidades únicas
   */
  static getLocalidades(): string[] {
    const barrios = this.getBarrios();
    const localidades = new Set(barrios.map(barrio => barrio.localidad));
    return Array.from(localidades).sort();
  }

  /**
   * Obtiene información de localidades con sus barrios
   */
  static getLocalidadesInfo(): LocalidadInfo[] {
    const localidades = this.getLocalidades();
    return localidades.map(localidad => {
      const barrios = this.getBarriosByLocalidad(localidad);
      const center = this.calculateLocalidadCenter(barrios);
      
      return {
        nombre: localidad,
        barrios,
        center
      };
    });
  }

  /**
   * Busca barrios por nombre (búsqueda parcial)
   */
  static searchBarrios(query: string): BarrioInfo[] {
    const barrios = this.getBarrios();
    const searchTerm = query.toLowerCase();
    
    return barrios.filter(barrio => 
      barrio.nombre.toLowerCase().includes(searchTerm) ||
      barrio.localidad.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Obtiene el GeoJSON completo (limpio)
   */
  static getGeoJSON(): BarranquillaGeoData {
    return this.cleanGeoJSON();
  }

  /**
   * Calcula el centro de un polígono
   */
  private static calculateCenter(coordinates: [number, number][]): [number, number] {
    let sumLng = 0;
    let sumLat = 0;
    
    coordinates.forEach(coord => {
      sumLng += coord[0];
      sumLat += coord[1];
    });
    
    return [sumLng / coordinates.length, sumLat / coordinates.length];
  }

  /**
   * Calcula el centro de una localidad basado en sus barrios
   */
  private static calculateLocalidadCenter(barrios: BarrioInfo[]): [number, number] {
    if (barrios.length === 0) return [0, 0];
    
    let sumLng = 0;
    let sumLat = 0;
    
    barrios.forEach(barrio => {
      sumLng += barrio.center[0];
      sumLat += barrio.center[1];
    });
    
    return [sumLng / barrios.length, sumLat / barrios.length];
  }

  /**
   * Obtiene estadísticas generales
   */
  static getStats() {
    const barrios = this.getBarrios();
    const localidades = this.getLocalidades();
    
    return {
      totalBarrios: barrios.length,
      totalLocalidades: localidades.length,
      barriosPorLocalidad: localidades.map(localidad => ({
        localidad,
        count: this.getBarriosByLocalidad(localidad).length
      }))
    };
  }

  /**
   * Genera datos para mapa de calor basado en una métrica
   */
  static generateHeatmapData(metric: 'localidad' | 'pieza_urba' | 'random' = 'random') {
    const barrios = this.getBarrios();
    
    return barrios.map(barrio => {
      let intensity: number;
      
      switch (metric) {
        case 'localidad':
          // Asignar intensidad basada en la localidad
          const localidades = this.getLocalidades();
          const localidadIndex = localidades.indexOf(barrio.localidad);
          intensity = (localidadIndex + 1) * (100 / localidades.length);
          break;
        case 'pieza_urba':
          // Asignar intensidad basada en pieza urbana
          const piezas = [...new Set(barrios.map(b => b.pieza_urba))];
          const piezaIndex = piezas.indexOf(barrio.pieza_urba);
          intensity = (piezaIndex + 1) * (100 / piezas.length);
          break;
        case 'random':
        default:
          // Intensidad aleatoria para demostración
          intensity = Math.random() * 100;
          break;
      }
      
      return {
        id: barrio.id.toString(),
        lng: barrio.center[0],
        lat: barrio.center[1],
        intensity,
        properties: {
          nombre: barrio.nombre,
          localidad: barrio.localidad,
          pieza_urba: barrio.pieza_urba,
          intensity
        }
      };
    });
  }

  /**
   * Obtiene los límites del mapa (bounds)
   */
  static getMapBounds(): [[number, number], [number, number]] {
    const barrios = this.getBarrios();
    
    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;
    
    barrios.forEach(barrio => {
      barrio.coordinates.forEach(coord => {
        minLng = Math.min(minLng, coord[0]);
        maxLng = Math.max(maxLng, coord[0]);
        minLat = Math.min(minLat, coord[1]);
        maxLat = Math.max(maxLat, coord[1]);
      });
    });
    
    return [[minLng, minLat], [maxLng, maxLat]];
  }
}
