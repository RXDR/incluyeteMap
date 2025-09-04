import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  FileSpreadsheet, 
  Database, 
  BarChart3, 
  Map, 
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  Search,
  Filter
} from 'lucide-react';
// Importar componentes de Claude
import { ExcelUploader } from '@/components/excel/ExcelUploader';
import { StatsDisplay } from '@/components/excel/StatsDisplay';
import { SurveyDataVisualizer } from '@/components/excel/SurveyDataVisualizer';
import IntelligentDataQuery from '@/components/IntelligentDataQuery';
import BatchMigration from '@/components/BatchMigration';

const Dashboard = () => {
  const [uploadStats, setUploadStats] = useState<any>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const handleUploadComplete = (stats: any) => {
    setUploadStats(stats);
    setIsDataLoaded(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard de Encuestas</h1>
        <Badge variant="outline" className="text-sm">
          Sistema Inteligente de Migración
        </Badge>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Cargar Excel
          </TabsTrigger>
          <TabsTrigger value="migration" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Migración
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Análisis
          </TabsTrigger>
          <TabsTrigger value="map" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            Mapa
          </TabsTrigger>
          <TabsTrigger value="query" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Consulta
          </TabsTrigger>
          <TabsTrigger value="survey-manager" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Gestión Encuestas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Carga de Archivo Excel
              </CardTitle>
              <CardDescription>
                Sube tu archivo Excel de 40,064 registros para comenzar la migración inteligente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExcelUploader onUploadComplete={handleUploadComplete} />
              
              {/* Mostrar estadísticas después de la carga */}
              {uploadStats && (
                <div className="mt-6">
                  <StatsDisplay stats={uploadStats} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="migration" className="space-y-6">
          <BatchMigration />
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Análisis Cruzado de Datos
              </CardTitle>
              <CardDescription>
                Análisis avanzado con filtros cruzados y visualizaciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isDataLoaded ? (
                <SurveyDataVisualizer 
                  onDataLoad={(heatmapData) => {
                    console.log('Datos para mapa de calor:', heatmapData);
                  }}
                />
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">Datos no disponibles</h3>
                  <p className="text-gray-600">
                    Sube un archivo Excel en la pestaña "Cargar Excel" para ver el análisis
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="map" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map className="h-5 w-5" />
                Visualización en Mapa
              </CardTitle>
              <CardDescription>
                Mapa de calor con las respuestas geolocalizadas y análisis espacial
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Controles del Mapa */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Controles del Mapa</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Visualización
                      </label>
                      <select className="w-full px-3 py-2 border rounded-lg">
                        <option>Mapa de Calor</option>
                        <option>Puntos Individuales</option>
                        <option>Clusters</option>
                        <option>Coropoplético</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Variable de Color
                      </label>
                      <select className="w-full px-3 py-2 border rounded-lg">
                        <option>Densidad de Población</option>
                        <option>Nivel de Discapacidad</option>
                        <option>Accesibilidad</option>
                        <option>Nivel Socioeconómico</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Radio de Influencia
                      </label>
                      <input 
                        type="range" 
                        min="100" 
                        max="5000" 
                        step="100"
                        className="w-full"
                      />
                      <span className="text-sm text-gray-500">100m - 5km</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Opacidad
                      </label>
                      <input 
                        type="range" 
                        min="0.1" 
                        max="1" 
                        step="0.1"
                        className="w-full"
                      />
                      <span className="text-sm text-gray-500">10% - 100%</span>
                    </div>
                  </div>
                </div>

                {/* Mapa Principal */}
                <div className="bg-gray-100 rounded-lg overflow-hidden">
                  <div className="h-96 bg-gray-200 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <Map className="h-16 w-16 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Mapa de Calor</h3>
                      <p>Visualización geográfica de respuestas</p>
                      <p className="text-sm mt-2">Se generará después de la migración de datos</p>
                      <div className="mt-4 p-4 bg-white rounded-lg border">
                        <p className="text-sm font-medium">Funcionalidades del Mapa:</p>
                        <ul className="text-xs text-gray-600 mt-2 space-y-1">
                          <li>• Zoom y navegación interactiva</li>
                          <li>• Capas de datos configurables</li>
                          <li>• Filtros espaciales en tiempo real</li>
                          <li>• Exportación de visualizaciones</li>
                          <li>• Análisis de patrones geográficos</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Leyenda y Estadísticas del Mapa */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Leyenda del Mapa</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-red-500 rounded"></div>
                          <span className="text-sm">Alta densidad</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-yellow-500 rounded"></div>
                          <span className="text-sm">Media densidad</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-green-500 rounded"></div>
                          <span className="text-sm">Baja densidad</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Estadísticas Espaciales</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span>Total de puntos:</span>
                          <span className="font-medium">-</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Área cubierta:</span>
                          <span className="font-medium">-</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Densidad promedio:</span>
                          <span className="font-medium">-</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Puntos por km²:</span>
                          <span className="font-medium">-</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="query" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Consulta Inteligente de Datos
              </CardTitle>
              <CardDescription>
                Sistema que mapea automáticamente los datos del Excel con las preguntas para consultas inteligentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IntelligentDataQuery />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="survey-manager" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Sistema de Gestión de Encuestas
              </CardTitle>
              <CardDescription>
                Sistema completo para procesar archivos Excel con datos de encuestas, almacenarlos en Supabase y prepararlos para visualización
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Información del sistema */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2 text-blue-800">ℹ️ Sistema de Claude</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Procesamiento en lotes de archivos Excel grandes</li>
                    <li>• Mapeo inteligente de categorías y preguntas dinámicas</li>
                    <li>• Almacenamiento optimizado en JSONB para máxima flexibilidad</li>
                    <li>• Funciones SQL especializadas para consultas rápidas</li>
                    <li>• Preparación de datos para mapas de calor</li>
                  </ul>
                </div>

                {/* Componentes del sistema */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Carga de Datos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ExcelUploader onUploadComplete={handleUploadComplete} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Visualización y Filtros</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isDataLoaded ? (
                        <SurveyDataVisualizer 
                          onDataLoad={(heatmapData) => {
                            console.log('Datos para mapa de calor:', heatmapData);
                          }}
                        />
                      ) : (
                        <div className="text-center py-8">
                          <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <p className="text-gray-600">
                            Sube datos para ver la visualización
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Estadísticas */}
                {uploadStats && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Estadísticas del Procesamiento</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <StatsDisplay stats={uploadStats} />
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;