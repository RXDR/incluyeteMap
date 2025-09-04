import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, CheckCircle, AlertCircle, Play, RotateCcw } from 'lucide-react';

interface MigrationStats {
  migration_stats: {
    total_persons_to_process: number;
    processed_persons: number;
    normalized_records: number;
    progress_percentage: number;
    estimated_remaining_batches: number;
  };
  geographic_mapping_verification: {
    localidad_mapped: boolean;
    barrio_mapped: boolean;
    estrato_mapped: boolean;
    coordx_mapped: boolean;
    coordy_mapped: boolean;
    full_address_mapped: boolean;
  };
}

interface BatchResult {
  success: boolean;
  message: string;
  batch_info: {
    offset_start: number;
    batch_size: number;
    processed_persons: number;
    total_records_inserted: number;
  };
  processing_time_seconds: number;
}

const BatchMigration: React.FC = () => {
  const [isMigrating, setIsMigrating] = useState(false);
  const [stats, setStats] = useState<MigrationStats | null>(null);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);

  const BATCH_SIZE = 1000;

  // Obtener estadísticas iniciales
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setError(null);
      const { data, error } = await supabase.rpc('get_migration_stats');
      
      if (error) {
        console.error('Error en get_migration_stats:', error);
        throw new Error(error.message || 'Error desconocido al cargar estadísticas');
      }
      
      if (!data) {
        throw new Error('No se recibieron datos de estadísticas');
      }
      
      console.log('Estadísticas cargadas:', data);
      setStats(data);
      
      // Extraer datos de la nueva estructura (sin migration_stats)
      setTotalBatches(Math.ceil(data.total_persons_to_process / BATCH_SIZE));
      setProgress(data.progress_percentage);
      
    } catch (err) {
      console.error('Error completo:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Error al cargar estadísticas: ${errorMessage}`);
    }
  };

  const startMigration = async () => {
    setIsMigrating(true);
    setError(null);
    setMessage('🚀 Iniciando migración por lotes...');
    setCurrentBatch(0);
    setBatchResults([]);

    try {
      // Limpiar tabla primero
      setMessage('🧹 Limpiando tabla normalizada...');
      console.log('🔧 Limpiando tabla normalizada...');
      const { error: clearError } = await supabase.rpc('clear_normalized_table');
      if (clearError) {
        console.error('❌ Error al limpiar tabla:', clearError);
        throw new Error(clearError.message || 'Error al limpiar tabla');
      }
      console.log('✅ Tabla limpiada correctamente');

             // Procesar lotes
       let offset = stats?.next_offset || 0;  // Usar OFFSET desde estadísticas
       let batchNumber = Math.floor(offset / 50) + 1;  // Calcular lote actual
       const totalPersons = stats?.total_persons_to_process || 0;

      console.log(`📊 Total de personas a procesar: ${totalPersons}`);
      console.log(`📦 Tamaño de lote: ${BATCH_SIZE}`);

      while (offset < totalPersons) {
        const currentBatchNumber = batchNumber + 1;
        setMessage(`📦 Procesando lote ${currentBatchNumber}/${totalBatches}...`);
        
        console.log(`🔄 Iniciando lote ${currentBatchNumber}/${totalBatches} - Offset: ${offset}`);
        
        const startTime = Date.now();
        const { data, error } = await supabase.rpc('migrate_batch_to_normalized_hybrid', {
          p_batch_size: 50,  // MIGRACIÓN HÍBRIDA: 1 persona = 1 registro
          p_offset: offset   // OFFSET para continuar desde donde se quedó
        });

        const endTime = Date.now();
        const processingTime = (endTime - startTime) / 1000;

        if (error) {
          console.error(`❌ Error en lote ${currentBatchNumber}:`, error);
          console.error(`📋 Detalles del error:`, {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          throw new Error(error.message || 'Error en la migración del lote');
        }

        console.log(`✅ Lote ${currentBatchNumber} completado en ${processingTime.toFixed(2)}s`);
        console.log(`📊 Resultado del lote:`, data);

        if (data && typeof data === 'string' && data.includes('✅')) {
          // Extraer número de registros procesados del mensaje
          const match = data.match(/(\d+) registros procesados/);
          const processedCount = match ? parseInt(match[1]) : 0;
          
          console.log(`📈 Registros procesados en este lote: ${processedCount}`);
          
          setCurrentBatch(currentBatchNumber);
          
          // Actualizar progreso
          const newProgress = Math.round(((offset + processedCount) / totalPersons) * 100);
          setProgress(newProgress);
          
          setMessage(`✅ Lote ${currentBatchNumber} completado: ${processedCount} registros procesados en ${processingTime.toFixed(2)}s`);
          
          // Pausa entre lotes para evitar sobrecarga
          await new Promise(resolve => setTimeout(resolve, 200));
        } else {
          console.error(`❌ Respuesta inesperada del lote ${currentBatchNumber}:`, data);
          throw new Error('Respuesta inesperada del servidor');
        }

                 offset += 50; // Incrementar por 50 (migración híbrida optimizada)
         batchNumber++;
         
         // Recargar estadísticas para obtener el siguiente OFFSET
         await loadStats();
      }

      console.log('🎯 Migración completada exitosamente');
      setMessage('🎯 ¡Migración completada exitosamente!');
      await loadStats(); // Recargar estadísticas finales
      
    } catch (err) {
      console.error('❌ Error en migración:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Error en la migración: ${errorMessage}`);
      setMessage('❌ Migración fallida');
    } finally {
      setIsMigrating(false);
    }
  };

  const stopMigration = () => {
    setIsMigrating(false);
    setMessage('⏹️ Migración detenida por el usuario');
  };

  const resetMigration = async () => {
    try {
      setError(null);
      setMessage('🧹 Limpiando tabla normalizada...');
      const { error } = await supabase.rpc('clear_normalized_table');
      if (error) {
        console.error('Error al limpiar:', error);
        throw new Error(error.message || 'Error al limpiar tabla');
      }
      
      setMessage('Tabla limpiada. Listo para nueva migración.');
      setProgress(0);
      setCurrentBatch(0);
      setBatchResults([]);
      await loadStats();
    } catch (err) {
      console.error('Error al resetear:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Error al limpiar: ${errorMessage}`);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Migración por Lotes
          </CardTitle>
          <CardDescription>
            Migra datos desde temp_excel_import a survey_responses_indexed en lotes de 50 personas (HÍBRIDA OPTIMIZADA)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Estadísticas */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.total_persons_to_process.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Personas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.processed_persons.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Procesadas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.processed_persons.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Registros</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.progress_percentage}%</div>
                <div className="text-sm text-muted-foreground">Progreso</div>
              </div>
            </div>
          )}

          {/* Barra de Progreso */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progreso de Migración</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
            <div className="text-sm text-muted-foreground">
              Lote {currentBatch} de {totalBatches} • {stats?.estimated_remaining_batches || 0} lotes restantes
            </div>
          </div>

          {/* Mensajes */}
          {message && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {/* Errores */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Botones de Control */}
          <div className="flex gap-2">
            {!isMigrating ? (
              <Button 
                onClick={startMigration} 
                disabled={!stats || stats.total_persons_to_process === 0}
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                Iniciar Migración
              </Button>
            ) : (
              <Button 
                onClick={stopMigration} 
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                Detener Migración
              </Button>
            )}
            
            <Button 
              onClick={resetMigration} 
              variant="outline"
              disabled={isMigrating}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Limpiar y Reiniciar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados de Lotes */}
      {batchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Lotes Completados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {batchResults.map((result, index) => (
                <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="font-medium text-green-800">
                    Lote {index + 1}: {result.batch_info.processed_persons} personas
                  </div>
                  <div className="text-sm text-green-600">
                    {result.batch_info.total_records_inserted} registros • {result.processing_time_seconds.toFixed(2)}s
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BatchMigration;
