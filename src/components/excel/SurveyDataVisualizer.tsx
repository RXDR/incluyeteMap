import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Filter, RefreshCw, Download, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface HeatmapDataPoint {
  latitude: number;
  longitude: number;
  value: number;
  location_info: {
    localidad: string;
    barrio: string;
    address: string;
  };
  response_data: Record<string, any>;
}

interface FilterOptions {
  category: string | null;
  localidad: string | null;
  barrio: string | null;
}

interface SurveyDataVisualizerProps {
  onDataLoad?: (data: HeatmapDataPoint[]) => void;
  className?: string;
}

export const SurveyDataVisualizer: React.FC<SurveyDataVisualizerProps> = ({ 
  onDataLoad, 
  className = "" 
}) => {
  const [data, setData] = useState<HeatmapDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Array<{category: string, count: number}>>([]);
  const [locations, setLocations] = useState<Array<{localidad: string, count: number}>>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    category: null,
    localidad: null,
    barrio: null
  });
  const [stats, setStats] = useState({
    total: 0,
    withCoordinates: 0,
    uniqueLocations: 0,
    dateRange: { from: '', to: '' }
  });

  // Cargar categorías disponibles
  const loadCategories = async () => {
    try {
      const { data: categoryData, error } = await supabase
        .rpc('get_available_categoriess');
      
      if (error) throw error;
      setCategories(categoryData || []);
    } catch (err) {
      console.error('Error cargando categorías:', err);
    }
  };

  // Cargar estadísticas por ubicación
  const loadLocationStats = async () => {
    try {
      const { data: locationData, error } = await supabase
        .rpc('get_stats_by_location');
      
      if (error) throw error;
      setLocations(locationData || []);
    } catch (err) {
      console.error('Error cargando estadísticas de ubicación:', err);
    }
  };

  // Cargar datos para mapa de calor
  const loadHeatmapData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Usar la función SQL personalizada para obtener datos optimizados
      const { data: heatmapData, error } = await supabase
        .rpc('get_heatmap_data', { 
          category_filter: filters.category 
        });
      
      if (error) throw error;

      let filteredData = heatmapData || [];

      // Aplicar filtros adicionales en el cliente si es necesario
      if (filters.localidad) {
        filteredData = filteredData.filter(point => 
          point.location_info?.localidad?.toLowerCase().includes(filters.localidad!.toLowerCase())
        );
      }

      if (filters.barrio) {
        filteredData = filteredData.filter(point => 
          point.location_info?.barrio?.toLowerCase().includes(filters.barrio!.toLowerCase())
        );
      }

      setData(filteredData);
      
      // Calcular estadísticas
      const totalRecords = filteredData.length;
      const withCoords = filteredData.filter(p => p.latitude && p.longitude).length;
      const uniqueLocs = new Set(filteredData.map(p => p.location_info?.localidad)).size;
      
      setStats({
        total: totalRecords,
        withCoordinates: withCoords,
        uniqueLocations: uniqueLocs,
        dateRange: { from: '', to: '' } // Se puede implementar después
      });

      // Callback para componente padre
      onDataLoad?.(filteredData);

    } catch (err) {
      console.error('Error cargando datos:', err);
      setError(err instanceof Error ? err.message : 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  // Exportar datos filtrados
  const exportData = async () => {
    try {
      const exportData = data.map(point => ({
        latitud: point.latitude,
        longitud: point.longitude,
        localidad: point.location_info?.localidad || '',
        barrio: point.location_info?.barrio || '',
        direccion: point.location_info?.address || '',
        datos_respuesta: JSON.stringify(point.response_data)
      }));

      const csvContent = [
        Object.keys(exportData[0]).join(','),
        ...exportData.map(row => Object.values(row).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `survey_data_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exportando datos:', err);
    }
  };

  // Efectos
  useEffect(() => {
    loadCategories();
    loadLocationStats();
  }, []);

  useEffect(() => {
    loadHeatmapData();
  }, [filters]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Panel de Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Datos
          </CardTitle>
          <CardDescription>
            Filtra los datos para visualización en el mapa de calor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Filtro por Categoría */}
            <div>
              <label className="text-sm font-medium mb-2 block">Categoría</label>
              <Select 
                value={filters.category || ''} 
                onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, category: value || null }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las categorías</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.category} value={cat.category}>
                      {cat.category} ({cat.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Localidad */}
            <div>
              <label className="text-sm font-medium mb-2 block">Localidad</label>
              <Select 
                value={filters.localidad || ''} 
                onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, localidad: value || null }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas las localidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las localidades</SelectItem>
                  {locations.slice(0, 20).map((loc) => (
                    <SelectItem key={loc.localidad} value={loc.localidad}>
                      {loc.localidad} ({loc.total_responses})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Botones de Acción */}
            <div className="md:col-span-2 flex items-end gap-2">
              <Button 
                onClick={loadHeatmapData}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              
              <Button 
                variant="outline"
                onClick={exportData}
                disabled={data.length === 0}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>

          {/* Filtros Activos */}
          {(filters.category || filters.localidad || filters.barrio) && (
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-sm text-gray-600">Filtros activos:</span>
              {filters.category && (
                <Badge variant="secondary" className="cursor-pointer" 
                  onClick={() => setFilters(prev => ({ ...prev, category: null }))}>
                  Categoría: {filters.category} ✕
                </Badge>
              )}
              {filters.localidad && (
                <Badge variant="secondary" className="cursor-pointer"
                  onClick={() => setFilters(prev => ({ ...prev, localidad: null }))}>
                  Localidad: {filters.localidad} ✕
                </Badge>
              )}
              {filters.barrio && (
                <Badge variant="secondary" className="cursor-pointer"
                  onClick={() => setFilters(prev => ({ ...prev, barrio: null }))}>
                  Barrio: {filters.barrio} ✕
                </Badge>
              )}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setFilters({ category: null, localidad: null, barrio: null })}
                className="text-xs h-6"
              >
                Limpiar todos
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Estadísticas de Datos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-900">{stats.total.toLocaleString()}</div>
              <div className="text-sm text-blue-700">Total Registros</div>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-900">{stats.withCoordinates.toLocaleString()}</div>
              <div className="text-sm text-green-700">Con Coordenadas</div>
            </div>
            
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-900">{stats.uniqueLocations}</div>
              <div className="text-sm text-purple-700">Localidades Únicas</div>
            </div>
            
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-900">{categories.length}</div>
              <div className="text-sm text-orange-700">Categorías</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Categorías */}
      {categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Categorías Disponibles</CardTitle>
            <CardDescription>
              Categorías encontradas en los datos con número de registros
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Badge 
                  key={category.category}
                  variant={filters.category === category.category ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                  onClick={() => setFilters(prev => ({ 
                    ...prev, 
                    category: prev.category === category.category ? null : category.category 
                  }))}
                >
                  {category.category} ({category.count})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Localidades */}
      {locations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Top Localidades
            </CardTitle>
            <CardDescription>
              Localidades con más registros de encuestas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {locations.slice(0, 10).map((location, index) => (
                <div key={location.localidad} className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium text-gray-500">#{index + 1}</div>
                    <div>
                      <div className="font-medium">{location.localidad}</div>
                    </div>
                  </div>
                  <Badge variant="secondary">{location.total_responses} registros</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default SurveyDataVisualizer;