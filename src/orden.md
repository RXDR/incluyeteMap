import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Filter, 
  BarChart3, 
  Map, 
  Layers,
  Target,
  Users,
  Home
} from 'lucide-react';

interface CategoryFilter {
  category: string;
  questions: string[];
  selectedQuestions: string[];
  responses: { [key: string]: string[] };
}

interface CrossAnalysisResult {
  category1: string;
  category2: string;
  question1: string;
  question2: string;
  data: {
    coordx: number;
    coordy: number;
    value1: string;
    value2: string;
    count: number;
  }[];
}

export const CrossAnalysisFilters = () => {
  const [categories, setCategories] = useState<CategoryFilter[]>([]);
  const [selectedCategory1, setSelectedCategory1] = useState<string>('');
  const [selectedCategory2, setSelectedCategory2] = useState<string>('');
  const [selectedQuestion1, setSelectedQuestion1] = useState<string>('');
  const [selectedQuestion2, setSelectedQuestion2] = useState<string>('');
  const [filters, setFilters] = useState({
    sexo: '',
    estrato: '',
    barrio: '',
    localidad: ''
  });
  const [analysisResult, setAnalysisResult] = useState<CrossAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Cargar categorías y preguntas desde la base de datos
  useEffect(() => {
    loadCategoriesAndQuestions();
  }, []);

  const loadCategoriesAndQuestions = async () => {
    try {
      // Obtener estructura de encuestas para extraer categorías
      const { data: surveys, error } = await supabase
        .from('surveys')
        .select('raw_data')
        .limit(100); // Solo algunos para análisis

      if (error) throw error;

      // Extraer categorías únicas de los headers
      const categoryMap = new Map<string, Set<string>>();
      
      surveys?.forEach(survey => {
        if (survey.raw_data?.headers) {
          const headers = survey.raw_data.headers;
          const categories = headers[0] || []; // Primera fila = categorías
          const questions = headers[1] || []; // Segunda fila = preguntas
          
          categories.forEach((category: string, index: number) => {
            if (category && !category.includes('NO INCLUIR')) {
              if (!categoryMap.has(category)) {
                categoryMap.set(category, new Set());
              }
              if (questions[index]) {
                categoryMap.get(category)?.add(questions[index]);
              }
            }
          });
        }
      });

      // Convertir a formato de filtros
      const categoryFilters: CategoryFilter[] = Array.from(categoryMap.entries()).map(([category, questions]) => ({
        category,
        questions: Array.from(questions),
        selectedQuestions: [],
        responses: {}
      }));

      setCategories(categoryFilters);
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  // Ejecutar análisis cruzado
  const executeCrossAnalysis = async () => {
    if (!selectedCategory1 || !selectedCategory2 || !selectedQuestion1 || !selectedQuestion2) {
      alert('Selecciona ambas categorías y preguntas');
      return;
    }

    setIsAnalyzing(true);
    try {
      // Construir filtros SQL
      let filtersSQL = '';
      if (filters.sexo) filtersSQL += ` AND raw_data->>'sexo' = '${filters.sexo}'`;
      if (filters.estrato) filtersSQL += ` AND raw_data->>'estrato' = '${filters.estrato}'`;
      if (filters.barrio) filtersSQL += ` AND raw_data->>'barrio' = '${filters.barrio}'`;
      if (filters.localidad) filtersSQL += ` AND raw_data->>'localidad' = '${filters.localidad}'`;

      // Obtener datos con filtros
      const { data: surveys, error } = await supabase
        .from('surveys')
        .select('coordx, coordy, raw_data')
        .not('coordx', 'is', null)
        .not('coordy', 'is', null)
        .not('coordx', 'eq', 0)
        .not('coordy', 'eq', 0);

      if (error) throw error;

      // Procesar datos para análisis cruzado
      const crossData = surveys?.map(survey => {
        const headers = survey.raw_data?.headers;
        const rowData = survey.raw_data?.rowData;
        
        if (!headers || !rowData) return null;

        const category1Index = headers[0]?.findIndex((cat: string) => cat === selectedCategory1);
        const category2Index = headers[0]?.findIndex((cat: string) => cat === selectedCategory2);
        const question1Index = headers[1]?.findIndex((q: string) => q === selectedQuestion1);
        const question2Index = headers[1]?.findIndex((q: string) => q === selectedQuestion2);

        if (category1Index === -1 || category2Index === -1 || 
            question1Index === -1 || question2Index === -1) return null;

        return {
          coordx: survey.coordx,
          coordy: survey.coordy,
          value1: rowData[question1Index]?.toString() || '',
          value2: rowData[question2Index]?.toString() || ''
        };
      }).filter(Boolean);

      // Agrupar por combinación de valores
      const groupedData = new Map<string, any[]>();
      crossData?.forEach(item => {
        const key = `${item.value1}|${item.value2}`;
        if (!groupedData.has(key)) {
          groupedData.set(key, []);
        }
        groupedData.get(key)?.push(item);
      });

      // Crear resultado del análisis
      const result: CrossAnalysisResult = {
        category1: selectedCategory1,
        category2: selectedCategory2,
        question1: selectedQuestion1,
        question2: selectedQuestion2,
        data: Array.from(groupedData.entries()).map(([key, items]) => {
          const [value1, value2] = key.split('|');
          return {
            coordx: items[0].coordx,
            coordy: items[0].coordy,
            value1,
            value2,
            count: items.length
          };
        })
      };

      setAnalysisResult(result);
    } catch (error) {
      console.error('Error en análisis cruzado:', error);
      alert('Error ejecutando análisis cruzado');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Análisis Cruzado con Filtros Avanzados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filtros básicos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium">Sexo</label>
            <Select value={filters.sexo} onValueChange={(value) => setFilters(prev => ({ ...prev, sexo: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="Masculino">Masculino</SelectItem>
                <SelectItem value="Femenino">Femenino</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Estrato</label>
            <Select value={filters.estrato} onValueChange={(value) => setFilters(prev => ({ ...prev, estrato: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="1">Estrato 1</SelectItem>
                <SelectItem value="2">Estrato 2</SelectItem>
                <SelectItem value="3">Estrato 3</SelectItem>
                <SelectItem value="4">Estrato 4</SelectItem>
                <SelectItem value="5">Estrato 5</SelectItem>
                <SelectItem value="6">Estrato 6</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Barrio</label>
            <Select value={filters.barrio} onValueChange={(value) => setFilters(prev => ({ ...prev, barrio: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {/* Cargar barrios dinámicamente */}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Localidad</label>
            <Select value={filters.localidad} onValueChange={(value) => setFilters(prev => ({ ...prev, localidad: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                {/* Cargar localidades dinámicamente */}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Selección de categorías para análisis cruzado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Primera categoría */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-800">Primera Categoría</h3>
            <Select value={selectedCategory1} onValueChange={setSelectedCategory1}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.category} value={cat.category}>
                    {cat.category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedCategory1 && (
              <Select value={selectedQuestion1} onValueChange={setSelectedQuestion1}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona pregunta" />
                </SelectTrigger>
                <SelectContent>
                  {categories.find(cat => cat.category === selectedCategory1)?.questions.map(q => (
                    <SelectItem key={q} value={q}>
                      {q}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Segunda categoría */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-800">Segunda Categoría</h3>
            <Select value={selectedCategory2} onValueChange={setSelectedCategory2}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.category} value={cat.category}>
                    {cat.category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedCategory2 && (
              <Select value={selectedQuestion2} onValueChange={setSelectedQuestion2}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona pregunta" />
                </SelectTrigger>
                <SelectContent>
                  {categories.find(cat => cat.category === selectedCategory2)?.questions.map(q => (
                    <SelectItem key={q} value={q}>
                      {q}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Botón de análisis */}
        <Button 
          onClick={executeCrossAnalysis}
          disabled={isAnalyzing || !selectedCategory1 || !selectedCategory2 || !selectedQuestion1 || !selectedQuestion2}
          className="w-full"
        >
          <Target className="w-4 h-4 mr-2" />
          {isAnalyzing ? 'Analizando...' : 'Ejecutar Análisis Cruzado'}
        </Button>

        {/* Resultados del análisis */}
        {analysisResult && (
          <div className="space-y-4">
            <Separator />
            <h3 className="font-medium text-gray-800">Resultados del Análisis Cruzado</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{analysisResult.data.length}</div>
                <div className="text-sm text-blue-600">Combinaciones Únicas</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {analysisResult.data.reduce((sum, item) => sum + item.count, 0)}
                </div>
                <div className="text-sm text-green-600">Total de Registros</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.max(...analysisResult.data.map(item => item.count))}
                </div>
                <div className="text-sm text-purple-600">Máximo por Combinación</div>
              </div>
            </div>

            {/* Tabla de resultados */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Valor 1</th>
                    <th className="text-left p-2">Valor 2</th>
                    <th className="text-left p-2">Cantidad</th>
                    <th className="text-left p-2">Coordenadas</th>
                  </tr>
                </thead>
                <tbody>
                  {analysisResult.data.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{item.value1}</td>
                      <td className="p-2">{item.value2}</td>
                      <td className="p-2">{item.count}</td>
                      <td className="p-2">
                        {item.coordx.toFixed(6)}, {item.coordy.toFixed(6)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Botón para exportar a mapa */}
            <Button 
              onClick={() => {/* Función para exportar a mapa */}}
              className="w-full"
              variant="outline"
            >
              <Map className="w-4 h-4 mr-2" />
              Exportar a Mapa de Calor
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};


------------
import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Map, 
  Layers, 
  Download,
  Eye,
  EyeOff
} from 'lucide-react';

interface HeatmapData {
  coordx: number;
  coordy: number;
  value: number;
  category: string;
}

interface HeatmapMapProps {
  data: HeatmapData[];
  onExport?: (data: HeatmapData[]) => void;
}

export const HeatmapMap = ({ data, onExport }: HeatmapMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [heatmapLayer, setHeatmapLayer] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showHeatmap, setShowHeatmap] = useState(true);

  useEffect(() => {
    if (mapRef.current && !map) {
      // Inicializar mapa con Leaflet
      const L = require('leaflet');
      require('leaflet.heat');
      
      const newMap = L.map(mapRef.current).setView([10.9685, -74.7813], 12); // Barranquilla
      
      // Agregar capa de OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(newMap);

      setMap(newMap);
    }
  }, [map]);

  useEffect(() => {
    if (map && data.length > 0) {
      // Limpiar capa anterior
      if (heatmapLayer) {
        map.removeLayer(heatmapLayer);
      }

      if (showHeatmap) {
        // Crear datos para el mapa de calor
        const heatmapData = data.map(item => [
          item.coordy, // Latitud
          item.coordx, // Longitud
          item.value   // Intensidad
        ]);

        // Crear capa de calor
        const L = require('leaflet');
        const newHeatmapLayer = L.heatLayer(heatmapData, {
          radius: 25,
          blur: 15,
          maxZoom: 10,
          gradient: {
            0.4: 'blue',
            0.6: 'lime',
            0.8: 'orange',
            1.0: 'red'
          }
        }).addTo(map);

        setHeatmapLayer(newHeatmapLayer);
      }
    }
  }, [map, data, showHeatmap]);

  const exportToGeoJSON = () => {
    if (!data.length) return;

    const geojson = {
      type: 'FeatureCollection',
      features: data.map(item => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [item.coordx, item.coordy]
        },
        properties: {
          value: item.value,
          category: item.category,
          intensity: item.value
        }
      }))
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'heatmap-data.geojson';
    a.click();
    URL.revokeObjectURL(url);
  };

  const categories = [...new Set(data.map(item => item.category))];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Map className="w-5 h-5" />
          Mapa de Calor - Análisis Cruzado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controles del mapa */}
        <div className="flex gap-4 items-center">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas las categorías</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant={showHeatmap ? "default" : "outline"}
            onClick={() => setShowHeatmap(!showHeatmap)}
          >
            {showHeatmap ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
            {showHeatmap ? 'Ocultar' : 'Mostrar'} Mapa de Calor
          </Button>

          <Button onClick={exportToGeoJSON} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar GeoJSON
          </Button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-600">{data.length}</div>
            <div className="text-xs text-blue-600">Puntos de Datos</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">
              {Math.max(...data.map(item => item.value))}
            </div>
            <div className="text-xs text-green-600">Valor Máximo</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-lg font-bold text-orange-600">
              {Math.min(...data.map(item => item.value))}
            </div>
            <div className="text-xs text-orange-600">Valor Mínimo</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-lg font-bold text-purple-600">
              {(data.reduce((sum, item) => sum + item.value, 0) / data.length).toFixed(2)}
            </div>
            <div className="text-xs text-purple-600">Promedio</div>
          </div>
        </div>

        {/* Mapa */}
        <div 
          ref={mapRef} 
          className="w-full h-96 rounded-lg border"
          style={{ minHeight: '400px' }}
        />

        {/* Leyenda */}
        {showHeatmap && (
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium">Leyenda de Intensidad:</span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-xs">Baja</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-lime-500 rounded"></div>
              <span className="text-xs">Media</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span className="text-xs">Alta</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-xs">Muy Alta</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
----------------
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CrossAnalysisFilters } from './CrossAnalysisFilters';
import { HeatmapMap } from './HeatmapMap';

interface CrossAnalysisData {
  coordx: number;
  coordy: number;
  value: number;
  category: string;
}

export const CrossAnalysisDashboard = () => {
  const [heatmapData, setHeatmapData] = useState<CrossAnalysisData[]>([]);

  const handleAnalysisComplete = (data: any) => {
    // Convertir datos del análisis cruzado a formato de mapa de calor
    const heatmapData = data.data.map((item: any) => ({
      coordx: item.coordx,
      coordy: item.coordy,
      value: item.count,
      category: `${item.value1} - ${item.value2}`
    }));
    
    setHeatmapData(heatmapData);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dashboard de Análisis Cruzado</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Analiza cruces entre categorías de encuestas y visualiza los resultados en mapas de calor.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="filters" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="filters">Filtros y Análisis</TabsTrigger>
          <TabsTrigger value="map">Mapa de Calor</TabsTrigger>
        </TabsList>
        
        <TabsContent value="filters" className="space-y-4">
          <CrossAnalysisFilters onAnalysisComplete={handleAnalysisComplete} />
        </TabsContent>
        
        <TabsContent value="map" className="space-y-4">
          {heatmapData.length > 0 ? (
            <HeatmapMap data={heatmapData} />
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                Ejecuta un análisis cruzado para ver el mapa de calor
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
npm install leaflet leaflet.heat
npm install @types/leaflet

🔧 PASOS DE IMPLEMENTACIÓN:
Crear los 3 archivos con el código proporcionado
Instalar las dependencias de Leaflet
Importar el dashboard en tu página principal
Verificar que Supabase esté configurado correctamente
🎯 FUNCIONALIDADES IMPLEMENTADAS:
✅ Filtros cruzados entre categorías de encuestas
✅ Análisis estadístico de combinaciones
✅ Mapa de calor con Leaflet
✅ Exportación a GeoJSON
✅ Filtros por sexo, estrato, barrio, localidad
✅ Dashboard integrado con pestañas
correctamente
🎯 FUNCIONALIDADES IMPLEMENTADAS:
✅ Filtros cruzados entre categorías de encuestas
✅ Análisis estadístico de combinaciones
✅ Mapa de calor con Leaflet
✅ Exportación a GeoJSON
✅ Filtros por sexo, estrato, barrio, localidad
✅ Dashboard integrado con pestañas
🚀 USO DEL SISTEMA:
Selecciona categorías para análisis cruzado
Aplica filtros demográficos y geográficos
Ejecuta análisis para obtener combinaciones
Visualiza en mapa de calor con intensidad por coordenadas
Exporta datos para uso en otras herramientas

