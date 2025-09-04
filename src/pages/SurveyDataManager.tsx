import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, BarChart3, Map, Database } from 'lucide-react';
import ExcelUploader from '@/components/excel/ExcelUploader';
import StatsDisplay from '@/components/excel/StatsDisplay';
import SurveyDataVisualizer from '@/components/excel/SurveyDataVisualizer';
import type { ProcessingStats } from '@/types/excel';

export const SurveyDataManager: React.FC = () => {
  const [uploadStats, setUploadStats] = useState<ProcessingStats | null>(null);
  const [visualizerData, setVisualizerData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("upload");

  const handleUploadComplete = (stats: ProcessingStats) => {
    setUploadStats(stats);
    // Cambiar automáticamente a la pestaña de estadísticas tras completar subida
    setActiveTab("stats");
  };

  const handleDataLoad = (data: any[]) => {
    setVisualizerData(data);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Sistema de Gestión de Encuestas
        </h1>
        <p className="text-gray-600">
          Procesa, analiza y visualiza datos de encuestas desde archivos Excel para generar mapas de calor
        </p>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Subir Datos
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Estadísticas
          </TabsTrigger>
          <TabsTrigger value="visualizer" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            Visualizador
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Base de Datos
          </TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subir y Procesar Datos de Excel</CardTitle>
              <CardDescription>
                Sube archivos Excel con datos de encuestas. El sistema procesará automáticamente las categorías,
                preguntas y respuestas, organizándolas para su análisis posterior.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExcelUploader onUploadComplete={handleUploadComplete} />
            </CardContent>
          </Card>

          {/* Guía de Formato */}
          <Card>
            <CardHeader>
              <CardTitle>Formato de Archivo Excel</CardTitle>
              <CardDescription>
                Tu archivo debe seguir esta estructura para procesarse correctamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium mb-2">Estructura Requerida:</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li><strong>Fila 1:</strong> Categorías (SOCIODEMOGRÁFICA, TIPO DE DISCAPACIDAD, etc.)</li>
                      <li><strong>Fila 2:</strong> Se omite (puede contener subcategorías)</li>
                      <li><strong>Fila 3:</strong> Preguntas específicas</li>
                      <li><strong>Fila 4+:</strong> Datos de respuestas</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Columnas Especiales:</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li><strong>COORDX/COORDY:</strong> Coordenadas geográficas</li>
                      <li><strong>LOCALIDAD:</strong> Nombre de la localidad</li>
                      <li><strong>BARRIO:</strong> Nombre del barrio</li>
                      <li><strong>DIRECCIÓN:</strong> Dirección completa</li>
                      <li><strong>ESTRATO:</strong> Estrato socioeconómico</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="space-y-6">
          {uploadStats ? (
            <StatsDisplay stats={uploadStats} />
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <BarChart3 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay estadísticas disponibles
                </h3>
                <p className="text-gray-600 mb-4">
                  Sube un archivo Excel primero para ver las estadísticas de procesamiento.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Visualizer Tab */}
        <TabsContent value="visualizer" className="space-y-6">
          <SurveyDataVisualizer onDataLoad={handleDataLoad} />
          
          {/* Información del Mapa de Calor */}
          {visualizerData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Datos para Mapa de Calor</CardTitle>
                <CardDescription>
                  {visualizerData.length} puntos de datos listos para visualización
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600">
                  <p>
                    Los datos están optimizados para su uso en mapas de calor. Cada punto representa 
                    una respuesta de encuesta con sus coordenadas geográficas correspondientes.
                  </p>
                  <p className="mt-2">
                    <strong>Próximos pasos:</strong> Integra estos datos con tu componente de mapa 
                    (Leaflet, Google Maps, etc.) para crear visualizaciones interactivas.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Database Tab */}
        <TabsContent value="database" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Base de Datos</CardTitle>
              <CardDescription>
                Información sobre la estructura de la base de datos y consultas disponibles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Información de la Tabla */}
                <div>
                  <h4 className="font-medium mb-3">Estructura de la Tabla</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <code className="text-sm">
                      <div><strong>Tabla:</strong> survey_responses</div>
                      <div className="mt-2 space-y-1">
                        <div>• id: TEXT (Primary Key)</div>
                        <div>• sociodemographic_data: JSONB</div>
                        <div>• location_data: JSONB</div>
                        <div>• responses_data: JSONB</div>
                        <div>• metadata: JSONB</div>
                        <div>• created_at, updated_at: TIMESTAMPTZ</div>
                      </div>
                    </code>
                  </div>
                </div>

                {/* Funciones Disponibles */}
                <div>
                  <h4 className="font-medium mb-3">Funciones SQL Disponibles</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border p-4 rounded-lg">
                      <h5 className="font-medium text-sm mb-2">get_heatmap_data(category_filter)</h5>
                      <p className="text-xs text-gray-600">
                        Obtiene datos optimizados para mapas de calor con coordenadas válidas
                      </p>
                    </div>
                    
                    <div className="border p-4 rounded-lg">
                      <h5 className="font-medium text-sm mb-2">get_available_categories()</h5>
                      <p className="text-xs text-gray-600">
                        Lista todas las categorías disponibles con su conteo
                      </p>
                    </div>
                    
                    <div className="border p-4 rounded-lg">
                      <h5 className="font-medium text-sm mb-2">get_stats_by_location()</h5>
                      <p className="text-xs text-gray-600">
                        Estadísticas agrupadas por localidad
                      </p>
                    </div>
                    
                    <div className="border p-4 rounded-lg">
                      <h5 className="font-medium text-sm mb-2">filter_survey_data(...)</h5>
                      <p className="text-xs text-gray-600">
                        Filtrado avanzado por múltiples criterios
                      </p>
                    </div>
                  </div>
                </div>

                {/* Índices */}
                <div>
                  <h4 className="font-medium mb-3">Índices Optimizados</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• GIN en location_data (localidad, barrio, coordenadas)</li>
                    <li>• GIN en responses_data (respuestas por categoría)</li>
                    <li>• GIN en sociodemographic_data</li>
                    <li>• Índice temporal en created_at</li>
                  </ul>
                </div>

                {/* Ejemplo de Consulta */}
                <div>
                  <h4 className="font-medium mb-3">Ejemplo de Consulta</h4>
                  <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono">
                    <div>-- Obtener datos para mapa de calor filtrado por categoría</div>
                    <div>SELECT * FROM get_heatmap_data('SOCIODEMOGRÁFICA');</div>
                    <div className="mt-2">-- Estadísticas por ubicación</div>
                    <div>SELECT * FROM get_stats_by_location();</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Script SQL */}
          <Card>
            <CardHeader>
              <CardTitle>Script de Configuración</CardTitle>
              <CardDescription>
                Ejecuta este script en tu base de datos Supabase para crear la estructura necesaria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                <p className="mb-3 text-gray-600">
                  Encontrarás el script SQL completo en el archivo <code>supabase_survey_table.sql</code> 
                  en la raíz del proyecto.
                </p>
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <p className="text-blue-800">
                    <strong>Instrucciones:</strong>
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-blue-700 mt-2">
                    <li>Abre el panel SQL de Supabase</li>
                    <li>Copia y pega el contenido del archivo SQL</li>
                    <li>Ejecuta el script</li>
                    <li>Verifica que la tabla y funciones se crearon correctamente</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SurveyDataManager;