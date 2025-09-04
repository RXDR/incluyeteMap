import maplibregl, { Map } from 'maplibre-gl';
import { HEATMAP_CONFIG } from '@/config/heatmapConfig';
import { transformSurveyCoordinates } from './coordinateUtils';

interface SurveyPoint {
  barrio: string;
  localidad: string;
  coordx: number;
  coordy: number;
  total_encuestas: number;
  matches_count: number;
  match_percentage: number;
  intensity_score: number;
}

export class HeatmapManager {
  private readonly map: Map;
  private readonly layerId: string;

  constructor(map: Map, layerId: string = 'survey-heat') {
    this.map = map;
    this.layerId = layerId;
  }

  /**
   * Adds or updates a heatmap layer with the provided survey points
   */
  addHeatmap(data: SurveyPoint[]) {
    if (!this.map || !data || data.length === 0) {
      console.warn('⚠️ No hay mapa o datos válidos para el heatmap');
      return;
    }

    try {
      // Remover capas existentes
      this.removeHeatmap();

      // Validar y transformar datos
      const features = data
        .filter(point => {
          const isValid = 
            point.coordx != null && 
            point.coordy != null && 
            !isNaN(point.coordx) && 
            !isNaN(point.coordy) &&
            point.coordx !== 0 && 
            point.coordy !== 0;

          if (!isValid) {
            console.warn('⚠️ Punto inválido en addHeatmap:', point);
          }
          return isValid;
        })
        .map(point => {
          // Asegurar que las coordenadas sean números
          const coordx = Number(point.coordx);
          const coordy = Number(point.coordy);
          
          return {
            type: 'Feature' as const,
            geometry: {
              type: 'Point' as const,
              coordinates: [coordx, coordy]
            },
            properties: {
              intensity: point.intensity_score,
              weight: point.intensity_score / 100,
              matches: point.matches_count,
              total: point.total_encuestas,
              percentage: point.match_percentage,
              barrio: point.barrio,
              localidad: point.localidad
            }
          };
        });

      if (features.length === 0) {
        console.warn('⚠️ No hay puntos válidos después del filtrado');
        return;
      }

      console.log('📊 Agregando heatmap con:', features.length, 'puntos');

      // Agregar nueva fuente
      this.map.addSource(this.layerId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: features
        }
      });

      // Add heatmap layer with optimized configuration
      this.map.addLayer({
        id: `${this.layerId}-heatmap`,
        type: 'heatmap',
        source: this.layerId,
        maxzoom: 15,
        paint: {
          // Peso basado en intensidad con mejor distribución
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'intensity'],
            0, 0,
            25, 0.5,  // Punto medio para mejor gradiente
            50, 0.75, // Valor alto más suave
            100, 1    // Máximo valor
          ],
          // Mayor intensidad para mejor visibilidad
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 0.4,   // Valor base más alto
            9, 0.75,  // Intensidad media más alta
            13, 1     // Máxima intensidad
          ],
          // Colores más vibrantes y visibles
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(0, 0, 255, 0)',      // Azul transparente
            0.2, 'rgba(0, 128, 255, 0.6)', // Azul claro
            0.4, 'rgba(0, 255, 255, 0.7)', // Cian
            0.6, 'rgba(255, 255, 0, 0.8)', // Amarillo
            0.8, 'rgba(255, 128, 0, 0.9)', // Naranja
            1, 'rgba(255, 0, 0, 1)'        // Rojo
          ],
          // Radio más grande para mejor visibilidad
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 8,     // Radio base más grande
            9, 15,    // Radio medio más grande
            13, 25    // Radio máximo más grande
          ],
          // Mayor opacidad general
          'heatmap-opacity': 0.9
        }
      });

      // Add polygon fill layer for barrios
      this.map.addLayer({
        id: `${this.layerId}-fill`,
        type: 'fill',
        source: this.layerId,
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['get', 'percentage'],
            0, '#3b82f6',   // Azul para bajo porcentaje de coincidencia
            50, '#f59e0b',  // Naranja para coincidencia media
            100, '#ef4444'  // Rojo para alta coincidencia
          ],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.8,
            0.6
          ]
        }
      });

      // Add polygon outline layer
      this.map.addLayer({
        id: `${this.layerId}-outline`,
        type: 'line',
        source: this.layerId,
        paint: {
          'line-color': '#000000',
          'line-width': 1,
          'line-opacity': 0.5
        }
      });

      // Add points layer for specific locations
      this.map.addLayer({
        id: `${this.layerId}-points`,
        type: 'circle',
        source: this.layerId,
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'total'],
            1, 4,
            5, 8,
            10, 12
          ],
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'percentage'],
            0, '#3b82f6',
            50, '#f59e0b',
            100, '#ef4444'
          ],
          'circle-opacity': 0.8,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#ffffff'
        },
        filter: ['==', '$type', 'Point']
      });

      // Add interactivity
      this.setupInteractivity();

      console.log('✅ Heatmap added successfully');
    } catch (error) {
      console.error('❌ Error adding heatmap:', error);
    }
  }

  /**
   * Removes the heatmap and point layers along with their source
   */
  removeHeatmap() {
    try {
      // Remove layers if they exist
      if (this.map.getLayer(`${this.layerId}-points`)) {
        this.map.removeLayer(`${this.layerId}-points`);
      }
      if (this.map.getLayer(`${this.layerId}-heatmap`)) {
        this.map.removeLayer(`${this.layerId}-heatmap`);
      }
      
      // Remove source if it exists
      if (this.map.getSource(this.layerId)) {
        this.map.removeSource(this.layerId);
      }

      console.log('✅ Heatmap removed successfully');
    } catch (error) {
      console.error('❌ Error removing heatmap:', error);
    }
  }

  /**
   * Updates the visibility of the heatmap layers
   */
  setVisibility(visible: boolean) {
    try {
      const visibility = visible ? 'visible' : 'none';
      if (this.map.getLayer(`${this.layerId}-heatmap`)) {
        this.map.setLayoutProperty(`${this.layerId}-heatmap`, 'visibility', visibility);
      }
      if (this.map.getLayer(`${this.layerId}-points`)) {
        this.map.setLayoutProperty(`${this.layerId}-points`, 'visibility', visibility);
      }
    } catch (error) {
      console.error('❌ Error setting heatmap visibility:', error);
    }
  }

  /**
   * Updates the heatmap data without removing the layers
   */
  updateData(data: SurveyPoint[]) {
    if (!this.map || !data) {
      console.warn('⚠️ Invalid map or data for update');
      return;
    }

    try {
      const source = this.map.getSource(this.layerId);
      if (source) {
        (source as any).setData({
          type: 'FeatureCollection',
          features: data.map(point => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [point.coordx, point.coordy]
            },
            properties: {
              intensity: point.intensity_score,
              matches: point.matches_count,
              total: point.total_encuestas,
              percentage: point.match_percentage,
              barrio: point.barrio,
              localidad: point.localidad
            }
          }))
        });
        console.log('✅ Heatmap data updated successfully');
      }
    } catch (error) {
      console.error('❌ Error updating heatmap data:', error);
    }
  }

  private setupInteractivity() {
    this.map.on('mouseenter', `${this.layerId}-points`, () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });

    this.map.on('mouseleave', `${this.layerId}-points`, () => {
      this.map.getCanvas().style.cursor = '';
    });

    // Add click popup
    this.map.on('click', `${this.layerId}-points`, (e: any) => {
      if (!e.features?.[0]) return;

      const props = e.features[0].properties;
      const coordinates = e.features[0].geometry.coordinates.slice();

      new maplibregl.Popup()
        .setLngLat(coordinates)
        .setHTML(`
          <div class="bg-white p-2 rounded shadow">
            <h3 class="font-bold">${props.barrio}</h3>
            <p class="text-sm text-gray-600">${props.localidad}</p>
            <div class="mt-2">
              <div>Total: ${props.total}</div>
              <div>Coincidencias: ${props.matches}</div>
              <div>Porcentaje: ${props.percentage}%</div>
            </div>
          </div>
        `)
        .addTo(this.map);
    });
  }
}

// Create singleton instance for easy access
let heatmapManager: HeatmapManager | null = null;

export const initializeHeatmapManager = (map: Map, layerId?: string) => {
  heatmapManager = new HeatmapManager(map, layerId);
  return heatmapManager;
};

export const getHeatmapManager = () => {
  if (!heatmapManager) {
    throw new Error('HeatmapManager not initialized. Call initializeHeatmapManager first.');
  }
  return heatmapManager;
};
