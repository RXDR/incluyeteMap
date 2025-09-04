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
  Eye,
  BarChart3,
  MapPin
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TempFile {
  id: number;
  filename: string;
  total_rows: number;
  total_columns: number;
  batch_count: number;
  total_batches: number;
  batch_status: string;
  batch_progress: number;
  processed: boolean;
  has_error: boolean;
  error_message?: string;
  created_at: string;
  processed_at?: string;
}

interface ProcessingStats {
  totalFiles: number;
  processedFiles: number;
  errorFiles: number;
  totalRecords: number;
  processedRecords: number;
  errorRecords: number;
}

const DataProcessor = () => {
  const [tempFiles, setTempFiles] = useState<TempFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [stats, setStats] = useState<ProcessingStats>({
    totalFiles: 0,
    processedFiles: 0,
    errorFiles: 0,
    totalRecords: 0,
    processedRecords: 0,
    errorRecords: 0
  });
  const { toast } = useToast();

  // Cargar archivos temporales
  useEffect(() => {
    loadTempFiles();
  }, []);

  const loadTempFiles = async () => {
    try {
      // Usar la vista optimizada que incluye información de lotes
      const { data, error } = await supabase
        .from('v_excel_files_summary')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTempFiles(data || []);
      updateStats(data || []);
    } catch (error: any) {
      toast({
        title: "❌ Error al cargar archivos",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateStats = (files: TempFile[]) => {
    const totalFiles = files.length;
    const processedFiles = files.filter(f => f.processed).length;
    const errorFiles = files.filter(f => f.has_error).length;
    
    const totalRecords = files.reduce((sum, f) => sum + (f.total_rows || 0), 0);
    const processedRecords = files
      .filter(f => f.processed)
      .reduce((sum, f) => sum + (f.total_rows || 0), 0);
    const errorRecords = files
      .filter(f => f.has_error)
      .reduce((sum, f) => sum + (f.total_rows || 0), 0);

    setStats({
      totalFiles,
      processedFiles,
      errorFiles,
      totalRecords,
      processedRecords,
      errorRecords
    });
  };

  // Función para extraer campos clave de los datos
  const extractKeyFields = (headers: string[][], dataRow: any[]): any => {
    const categories = headers[0] || [];
    const questions = headers[1] || [];
    const subQuestions = headers[2] || [];

    // Mapeo de campos reconocidos
    const fieldMappings: { [key: string]: string[] } = {
      'full_name': ['nombre completo', 'nombre', 'full name', 'name'],
      'barrio': ['barrio', 'neighborhood', 'sector'],
      'localidad': ['localidad', 'locality', 'ciudad', 'city'],
      'estrato': ['estrato', 'stratum', 'nivel socioeconómico'],
      'coordx': ['coordx', 'longitud', 'longitude', 'x'],
      'coordy': ['coordy', 'latitud', 'latitude', 'y']
    };

    const extractedFields: any = {};

    // Buscar campos reconocidos
    Object.entries(fieldMappings).forEach(([fieldName, searchTerms]) => {
      for (let colIndex = 0; colIndex < categories.length; colIndex++) {
        const category = categories[colIndex]?.toLowerCase() || '';
        const question = questions[colIndex]?.toLowerCase() || '';
        const subQuestion = subQuestions[colIndex]?.toLowerCase() || '';

        const matches = searchTerms.some(term => 
          category.includes(term) || 
          question.includes(term) || 
          subQuestion.includes(term)
        );

        if (matches && dataRow[colIndex] !== undefined) {
          extractedFields[fieldName] = dataRow[colIndex];
          break;
        }
      }
    });

    return extractedFields;
  };

  // Función para procesar un archivo por lotes
  const processFile = async (file: TempFile): Promise<{ success: boolean; processedRecords: number; errors: string[] }> => {
    try {
      const processedRecords: any[] = [];
      const errors: string[] = [];

      // Obtener los lotes del archivo
      const { data: batches, error: batchesError } = await supabase
        .from('temp_excel_batches')
        .select('*')
        .eq('file_id', file.id)
        .order('batch_number');

      if (batchesError) throw batchesError;

      // Procesar cada lote
      for (const batch of batches || []) {
        try {
          // Marcar lote como procesando
          await supabase
            .from('temp_excel_batches')
            .update({ status: 'processing' })
            .eq('id', batch.id);

          const batchData = batch.batch_data;
          
          // Procesar cada fila del lote
          for (let rowIndex = 0; rowIndex < batchData.length; rowIndex++) {
            const dataRow = batchData[rowIndex];
            const globalRowIndex = batch.row_start + rowIndex - 1;
            
            try {
              // Obtener headers del archivo principal
              const { data: fileData } = await supabase
                .from('temp_excel_import')
                .select('raw_data->headers')
                .eq('id', file.id)
                .single();

              const headers = fileData?.raw_data?.headers || [];
              const extractedFields = extractKeyFields(headers, dataRow);
              
              // Validar campos requeridos
              if (!extractedFields.full_name) {
                errors.push(`Fila ${globalRowIndex + 4}: Nombre no encontrado`);
                continue;
              }

              // Crear registro procesado
              const processedRecord = {
                full_name: extractedFields.full_name,
                barrio: extractedFields.barrio || 'No especificado',
                localidad: extractedFields.localidad || 'No especificado',
                estrato: extractedFields.estrato || 'No especificado',
                coordx: extractedFields.coordx ? parseFloat(extractedFields.coordx) : null,
                coordy: extractedFields.coordy ? parseFloat(extractedFields.coordy) : null,
                raw_data: {
                  row_index: globalRowIndex + 4,
                  original_data: dataRow,
                  headers: headers,
                  extracted_fields: extractedFields,
                  batch_id: batch.id,
                  batch_number: batch.batch_number
                },
                created_at: new Date().toISOString()
              };

              processedRecords.push(processedRecord);
            } catch (rowError: any) {
              errors.push(`Fila ${globalRowIndex + 4}: ${rowError.message}`);
            }
          }

          // Marcar lote como completado
          await supabase
            .from('temp_excel_batches')
            .update({ 
              status: 'completed',
              processed_at: new Date().toISOString()
            })
            .eq('id', batch.id);

        } catch (batchError: any) {
          // Marcar lote como con error
          await supabase
            .from('temp_excel_batches')
            .update({ 
              status: 'error',
              error_message: batchError.message
            })
            .eq('id', batch.id);
          
          errors.push(`Error en lote ${batch.batch_number}: ${batchError.message}`);
        }
      }

      // Insertar registros procesados en la tabla surveys
      if (processedRecords.length > 0) {
        const { error: insertError } = await supabase
          .from('surveys')
          .insert(processedRecords);

        if (insertError) throw insertError;
      }

      return {
        success: errors.length === 0 || processedRecords.length > 0,
        processedRecords: processedRecords.length,
        errors
      };

    } catch (error: any) {
      throw new Error(`Error procesando archivo: ${error.message}`);
    }
  };

  // Función para procesar todos los archivos pendientes
  const processAllFiles = async () => {
    setIsProcessing(true);
    setProcessingProgress(0);

    const pendingFiles = tempFiles.filter(f => !f.processed && !f.has_error);
    let totalProcessed = 0;
    let totalErrors = 0;

    try {
      for (let i = 0; i < pendingFiles.length; i++) {
        const file = pendingFiles[i];
        
        // Actualizar progreso
        setProcessingProgress((i / pendingFiles.length) * 100);

        try {
          const result = await processFile(file);
          
          if (result.success) {
            // Marcar archivo como procesado
            await supabase
              .from('temp_excel_import')
              .update({ 
                processed: true, 
                processed_at: new Date().toISOString(),
                has_error: result.errors.length > 0,
                error_message: result.errors.length > 0 ? result.errors.join('; ') : null
              })
              .eq('id', file.id);

            totalProcessed += result.processedRecords;
          } else {
            // Marcar archivo con errores
            await supabase
              .from('temp_excel_import')
              .update({ 
                processed: true, 
                processed_at: new Date().toISOString(),
                has_error: true,
                error_message: result.errors.join('; ')
              })
              .eq('id', file.id);

            totalErrors += result.errors.length;
          }

        } catch (fileError: any) {
          // Marcar archivo con error
          await supabase
            .from('temp_excel_import')
            .update({ 
              processed: true, 
              processed_at: new Date().toISOString(),
              has_error: true,
              error_message: fileError.message
            })
            .eq('id', file.id);

          totalErrors++;
        }
      }

      setProcessingProgress(100);
      
      toast({
        title: "✅ Procesamiento completado",
        description: `${totalProcessed} registros procesados, ${totalErrors} errores encontrados`,
      });

      // Recargar archivos y estadísticas
      await loadTempFiles();

    } catch (error: any) {
      toast({
        title: "❌ Error en el procesamiento",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  // Función para limpiar archivos procesados
  const clearProcessedFiles = async () => {
    try {
      // Obtener IDs de archivos procesados
      const { data: processedFiles, error: fetchError } = await supabase
        .from('temp_excel_import')
        .select('id')
        .eq('processed', true);

      if (fetchError) throw fetchError;

      if (processedFiles && processedFiles.length > 0) {
        const fileIds = processedFiles.map(f => f.id);

        // Eliminar lotes asociados primero (por la restricción de clave foránea)
        const { error: batchesError } = await supabase
          .from('temp_excel_batches')
          .delete()
          .in('file_id', fileIds);

        if (batchesError) throw batchesError;

        // Eliminar archivos principales
        const { error: filesError } = await supabase
          .from('temp_excel_import')
          .delete()
          .eq('processed', true);

        if (filesError) throw filesError;
      }

      toast({
        title: "✅ Archivos limpiados",
        description: "Archivos procesados y sus lotes eliminados exitosamente",
      });

      await loadTempFiles();
    } catch (error: any) {
      toast({
        title: "❌ Error al limpiar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Función para ver detalles de un archivo
  const viewFileDetails = (file: TempFile) => {
    // Aquí se mostraría un modal con detalles completos
    console.log('Detalles del archivo:', file);
  };

  const getStatusIcon = (file: TempFile) => {
    if (file.has_error) return <XCircle className="h-4 w-4 text-red-500" />;
    if (file.processed) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <AlertCircle className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusBadge = (file: TempFile) => {
    if (file.has_error) return <Badge variant="destructive">Con errores</Badge>;
    if (file.processed) return <Badge variant="default" className="bg-green-100 text-green-800">Procesado</Badge>;
    return <Badge variant="secondary">Pendiente</Badge>;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Procesamiento de Datos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Archivos</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.totalFiles}</p>
            <p className="text-xs text-blue-600">
              {stats.processedFiles} procesados, {stats.errorFiles} con errores
            </p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">Registros</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.totalRecords}</p>
            <p className="text-xs text-green-600">
              {stats.processedRecords} procesados, {stats.errorRecords} con errores
            </p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">Ubicaciones</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {stats.processedRecords > 0 ? Math.round((stats.processedRecords / stats.totalRecords) * 100) : 0}%
            </p>
            <p className="text-xs text-purple-600">Con coordenadas</p>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg border">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">Estado</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">
              {stats.totalFiles > 0 ? Math.round((stats.processedFiles / stats.totalFiles) * 100) : 0}%
            </p>
            <p className="text-xs text-orange-600">Completado</p>
          </div>
        </div>

        {/* Controles */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              onClick={processAllFiles}
              disabled={isProcessing || tempFiles.filter(f => !f.processed).length === 0}
              size="sm"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Procesar Todos
            </Button>
            <Button
              onClick={clearProcessedFiles}
              variant="outline"
              size="sm"
              disabled={tempFiles.filter(f => f.processed).length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpiar Procesados
            </Button>
          </div>
          <Button
            onClick={loadTempFiles}
            variant="ghost"
            size="sm"
          >
            <Loader2 className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Barra de progreso */}
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Procesando archivos...</span>
              <span>{Math.round(processingProgress)}%</span>
            </div>
            <Progress value={processingProgress} className="w-full" />
          </div>
        )}

        {/* Lista de archivos */}
        {tempFiles.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Archivos en Cola</h3>
            {tempFiles.map((file) => (
              <div key={file.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(file)}
                                         <div>
                       <p className="font-medium">{file.filename}</p>
                       <p className="text-sm text-gray-500">
                         {file.total_rows} registros • {file.total_columns} columnas
                       </p>
                       <p className="text-xs text-blue-600">
                         📦 Lotes: {file.batch_count}/{file.total_batches} • {file.batch_progress}% completado
                       </p>
                     </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(file)}
                    <Button
                      onClick={() => viewFileDetails(file)}
                      variant="ghost"
                      size="sm"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Información adicional */}
                <div className="text-xs text-gray-600">
                  <p>📅 Subido: {new Date(file.created_at).toLocaleDateString()}</p>
                  {file.processed && (
                    <p>⚙️ Procesado: {new Date(file.processed_at!).toLocaleDateString()}</p>
                  )}
                  {file.has_error && file.error_message && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                      <p className="text-red-700 font-medium">Errores encontrados:</p>
                      <p className="text-red-600 text-xs">{file.error_message}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Instrucciones */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-800 mb-2">🔄 Proceso de Procesamiento:</h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Los archivos se procesan automáticamente al hacer clic en "Procesar Todos"</li>
            <li>• Se extraen campos clave: nombre, barrio, localidad, estrato, coordenadas</li>
            <li>• Los datos procesados se guardan en la tabla "surveys"</li>
            <li>• Los archivos originales se marcan como procesados</li>
            <li>• Se pueden limpiar archivos procesados para liberar espacio</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataProcessor;
