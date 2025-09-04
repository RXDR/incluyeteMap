import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  Database,
  BarChart3,
  MapPin,
  Users,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Zap
} from 'lucide-react';
import ExcelUploader from './ExcelUploader';
import DataProcessor from './DataProcessor';
import PostgreSQLMigrationProcessor from './PostgreSQLMigrationProcessor';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

interface SystemStats {
  totalSurveys: number;
  totalBarrios: number;
  totalLocalidades: number;
  surveysWithCoordinates: number;
  lastUpload: string | null;
  lastProcessed: string | null;
}

const DataManagement = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalSurveys: 0,
    totalBarrios: 0,
    totalLocalidades: 0,
    surveysWithCoordinates: 0,
    lastUpload: null,
    lastProcessed: null
  });
  const { toast } = useToast();

  // Cargar estadísticas del sistema
  useEffect(() => {
    loadSystemStats();
  }, []);

  const loadSystemStats = async () => {
    try {
      // Obtener estadísticas de encuestas
      const { data: surveys, error: surveysError } = await supabase
        .from('surveys')
        .select('barrio, localidad, coordx, coordy, created_at');

      if (surveysError) throw surveysError;

      // Obtener estadísticas de archivos temporales
      const { data: tempFiles, error: tempFilesError } = await supabase
        .from('temp_excel_import')
        .select('created_at, processed_at')
        .order('created_at', { ascending: false })
        .limit(1);

      if (tempFilesError) throw tempFilesError;

      // Calcular estadísticas
      const totalSurveys = surveys?.length || 0;
      const uniqueBarrios = new Set(surveys?.map(s => s.barrio).filter(Boolean) || []);
      const uniqueLocalidades = new Set(surveys?.map(s => s.localidad).filter(Boolean) || []);
      const surveysWithCoords = surveys?.filter(s => s.coordx && s.coordy).length || 0;
      
      const lastUpload = tempFiles?.[0]?.created_at || null;
      const lastProcessed = tempFiles?.[0]?.processed_at || null;

      setSystemStats({
        totalSurveys,
        totalBarrios: uniqueBarrios.size,
        totalLocalidades: uniqueLocalidades.size,
        surveysWithCoordinates: surveysWithCoords,
        lastUpload,
        lastProcessed
      });

    } catch (error: any) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'stats') {
      loadSystemStats();
    }
  };

  const getStatusBadge = () => {
    const hasData = systemStats.totalSurveys > 0;
    const hasCoordinates = systemStats.surveysWithCoordinates > 0;
    
    if (hasData && hasCoordinates) {
      return <Badge variant="default" className="bg-green-100 text-green-800">✅ Sistema Activo</Badge>;
    } else if (hasData) {
      return <Badge variant="secondary">⚠️ Datos sin coordenadas</Badge>;
    } else {
      return <Badge variant="outline">⏳ Sin datos</Badge>;
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header con estadísticas rápidas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-6 w-6" />
              Gestión de Datos - Sistema de Encuestas
            </CardTitle>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Encuestas</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{systemStats.totalSurveys}</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <MapPin className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Barrios</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{systemStats.totalBarrios}</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">Localidades</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{systemStats.totalLocalidades}</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <CheckCircle className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-gray-700">Con Coordenadas</span>
              </div>
              <p className="text-2xl font-bold text-orange-600">
                {systemStats.totalSurveys > 0 
                  ? Math.round((systemStats.surveysWithCoordinates / systemStats.totalSurveys) * 100)
                  : 0}%
              </p>
            </div>
          </div>

          {/* Información adicional */}
          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              <span>
                Última subida: {systemStats.lastUpload 
                  ? new Date(systemStats.lastUpload).toLocaleDateString()
                  : 'Nunca'
                }
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span>
                Último procesamiento: {systemStats.lastProcessed
                  ? new Date(systemStats.lastProcessed).toLocaleDateString()
                  : 'Nunca'
                }
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs principales */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="upload" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Subida de Datos
                  </TabsTrigger>
                  <TabsTrigger value="process" className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Procesamiento
                  </TabsTrigger>
                  <TabsTrigger value="migration" className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Migración Masiva
                  </TabsTrigger>
                  <TabsTrigger value="stats" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Estadísticas
                  </TabsTrigger>
                </TabsList>

        <TabsContent value="upload" className="mt-6">
          <ExcelUploader />
        </TabsContent>

                        <TabsContent value="process" className="mt-6">
                  <DataProcessor />
                </TabsContent>

                <TabsContent value="migration" className="mt-6">
                  <PostgreSQLMigrationProcessor />
                </TabsContent>

                <TabsContent value="stats" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Estadísticas Detalladas del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Estadísticas generales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-800">📊 Datos de Encuestas</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-blue-800">Total de encuestas</span>
                      <Badge variant="default" className="bg-blue-100 text-blue-800">
                        {systemStats.totalSurveys}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-green-800">Con coordenadas</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        {systemStats.surveysWithCoordinates}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                      <span className="text-yellow-800">Sin coordenadas</span>
                      <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                        {systemStats.totalSurveys - systemStats.surveysWithCoordinates}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-800">🗺️ Cobertura Geográfica</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span className="text-purple-800">Barrios únicos</span>
                      <Badge variant="default" className="bg-purple-100 text-purple-800">
                        {systemStats.totalBarrios}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
                      <span className="text-indigo-800">Localidades únicas</span>
                      <Badge variant="default" className="bg-indigo-100 text-indigo-800">
                        {systemStats.totalLocalidades}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-pink-50 rounded-lg">
                      <span className="text-pink-800">Promedio por barrio</span>
                      <Badge variant="default" className="bg-pink-100 text-pink-800">
                        {systemStats.totalBarrios > 0 
                          ? Math.round(systemStats.totalSurveys / systemStats.totalBarrios)
                          : 0
                        }
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Estado del sistema */}
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="text-lg font-medium text-gray-800 mb-3">🔍 Estado del Sistema</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${
                      systemStats.totalSurveys > 0 ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                    <p className="text-sm font-medium">Datos Cargados</p>
                    <p className="text-xs text-gray-600">
                      {systemStats.totalSurveys > 0 ? '✅ Activo' : '⏳ Pendiente'}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${
                      systemStats.surveysWithCoordinates > 0 ? 'bg-green-500' : 'bg-yellow-500'
                    }`}></div>
                    <p className="text-sm font-medium">Geolocalización</p>
                    <p className="text-xs text-gray-600">
                      {systemStats.surveysWithCoordinates > 0 ? '✅ Completado' : '⚠️ Parcial'}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${
                      systemStats.totalBarrios > 0 ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                    <p className="text-sm font-medium">Cobertura</p>
                    <p className="text-xs text-gray-600">
                      {systemStats.totalBarrios > 0 ? `${systemStats.totalBarrios} barrios` : 'Sin datos'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Acciones rápidas */}
              <div className="flex gap-3">
                <button
                  onClick={() => setActiveTab('upload')}
                  className="flex-1 p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Upload className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-800 font-medium">Subir Nuevos Datos</span>
                  </div>
                </button>
                
                <button
                  onClick={() => setActiveTab('process')}
                  className="flex-1 p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Database className="h-4 w-4 text-green-600" />
                    <span className="text-green-800 font-medium">Procesar Datos</span>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataManagement;
