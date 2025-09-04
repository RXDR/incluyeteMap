import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Database,
  Play,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Trash2,
  BarChart3,
  Clock,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MigrationStats {
  total_files: number;
  processed_files: number;
  error_files: number;
  total_responses: number;
  last_migration: string | null;
  status: string;
}

interface MigrationResult {
  result: string;
  details: {
    total_processed: number;
    total_errors: number;
    execution_time: string;
    status: string;
  };
}

const PostgreSQLMigrationProcessor = () => {
  const [stats, setStats] = useState<MigrationStats | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState(0);
  const [lastResult, setLastResult] = useState<MigrationResult | null>(null);
  const { toast } = useToast();

  // Cargar estadísticas iniciales
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_migration_stats');

      if (error) throw error;
      setStats(data[0] || null);
    } catch (error: any) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  // Ejecutar migración masiva
  const executeMigration = async () => {
    setIsMigrating(true);
    setMigrationProgress(0);

    try {
      // Simular progreso durante la migración
      const progressInterval = setInterval(() => {
        setMigrationProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      // Ejecutar migración PostgreSQL
      const { data, error } = await supabase
        .rpc('execute_migration', { batch_size: 1000 });

      clearInterval(progressInterval);

      if (error) throw error;

      const result = data[0] as MigrationResult;
      setLastResult(result);
      setMigrationProgress(100);

      // Mostrar resultado
      if (result.details.total_errors === 0) {
        toast({
          title: "✅ Migración completada exitosamente",
          description: `${result.details.total_processed} registros procesados en ${result.details.execution_time}`,
        });
      } else {
        toast({
          title: "⚠️ Migración completada con errores",
          description: `${result.details.total_processed} procesados, ${result.details.total_errors} errores`,
          variant: "destructive",
        });
      }

      // Recargar estadísticas
      await loadStats();

    } catch (error: any) {
      setMigrationProgress(0);
      toast({
        title: "❌ Error en la migración",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsMigrating(false);
      setTimeout(() => setMigrationProgress(0), 2000);
    }
  };

  // Limpiar datos temporales
  const cleanTempData = async () => {
    try {
      const { data, error } = await supabase
        .rpc('clean_temp_data');

      if (error) throw error;

      toast({
        title: "✅ Datos temporales limpiados",
        description: data,
      });

      await loadStats();
    } catch (error: any) {
      toast({
        title: "❌ Error limpiando datos",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case '✅ Completado':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completado</Badge>;
      case '🔄 En progreso':
        return <Badge variant="secondary">En progreso</Badge>;
      case '⏳ Pendiente':
        return <Badge variant="outline">Pendiente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-600" />
          Migración Masiva PostgreSQL
        </CardTitle>
        <p className="text-sm text-gray-600">
          Procesa 40,000+ registros en segundos usando PostgreSQL puro
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estadísticas actuales */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Archivos</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{stats.total_files}</p>
              <p className="text-xs text-blue-600">
                {stats.processed_files} procesados, {stats.error_files} con errores
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">Respuestas</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.total_responses.toLocaleString()}</p>
              <p className="text-xs text-green-600">En survey_responses_indexed</p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">Última Migración</span>
              </div>
              <p className="text-lg font-bold text-purple-600">
                {stats.last_migration ? new Date(stats.last_migration).toLocaleDateString() : 'Nunca'}
              </p>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg border">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">Estado</span>
              </div>
              <div className="mt-2">
                {getStatusBadge(stats.status)}
              </div>
            </div>
          </div>
        )}

        {/* Controles de migración */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              onClick={executeMigration}
              disabled={isMigrating || !stats || stats.total_files === 0}
              size="lg"
              className="bg-green-600 hover:bg-green-700"
            >
              {isMigrating ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <Play className="h-5 w-5 mr-2" />
              )}
              Ejecutar Migración Masiva
            </Button>
            <Button
              onClick={cleanTempData}
              variant="outline"
              size="lg"
              disabled={!stats || stats.processed_files === 0}
            >
              <Trash2 className="h-5 w-5 mr-2" />
              Limpiar Temporales
            </Button>
          </div>
          <Button
            onClick={loadStats}
            variant="ghost"
            size="sm"
          >
            <Loader2 className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Barra de progreso */}
        {isMigrating && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Procesando migración masiva...</span>
              <span>{Math.round(migrationProgress)}%</span>
            </div>
            <Progress value={migrationProgress} className="w-full" />
            <p className="text-xs text-gray-600 text-center">
              Procesando registros en PostgreSQL - No se bloqueará la página
            </p>
          </div>
        )}

        {/* Resultado de la última migración */}
        {lastResult && (
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h4 className="font-medium text-gray-800 mb-3">📊 Resultado de la Última Migración</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{lastResult.details.total_processed.toLocaleString()}</p>
                <p className="text-xs text-gray-600">Registros procesados</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{lastResult.details.total_errors}</p>
                <p className="text-xs text-gray-600">Errores</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{lastResult.details.execution_time}</p>
                <p className="text-xs text-gray-600">Tiempo de ejecución</p>
              </div>
              <div className="text-center">
                <Badge variant={lastResult.details.total_errors === 0 ? "default" : "destructive"}>
                  {lastResult.details.total_errors === 0 ? "✅ Exitoso" : "⚠️ Con errores"}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Información del sistema */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">🚀 Sistema de Migración Masiva</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>PostgreSQL puro</strong> - 1000x más rápido que frontend</li>
            <li>• <strong>Sin bloqueo</strong> - La página permanece responsiva</li>
            <li>• <strong>Lotes de 1000</strong> - Procesamiento optimizado</li>
            <li>• <strong>Datos normalizados</strong> - Cada columna = 1 respuesta individual</li>
            <li>• <strong>UUID único</strong> - Cada encuesta tiene identificador único</li>
            <li>• <strong>Manejo de errores</strong> - Continúa procesando si hay fallos</li>
          </ul>
        </div>

        {/* Instrucciones de uso */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-800 mb-2">📋 Flujo de Trabajo</h4>
          <ol className="text-sm text-green-700 space-y-1">
            <li>1. <strong>Subir Excel</strong> → Se guarda en temp_excel_import</li>
            <li>2. <strong>Ejecutar Migración</strong> → Procesa con PostgreSQL</li>
            <li>3. <strong>Datos Normalizados</strong> → Se guardan en survey_responses_indexed</li>
            <li>4. <strong>Limpiar Temporales</strong> → Libera espacio en temp_excel_import</li>
            <li>5. <strong>Visualizar</strong> → Usar datos en mapas y análisis</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default PostgreSQLMigrationProcessor;
