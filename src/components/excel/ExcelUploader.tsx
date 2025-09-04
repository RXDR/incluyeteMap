import React, { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { processExcelData, uploadToSupabase } from '@/services/excelProcessor';
import type { ProcessedRow, ProcessingStats } from '@/types/excel';

interface ExcelUploaderProps {
  onUploadComplete?: (stats: ProcessingStats) => void;
}

export const ExcelUploader: React.FC<ExcelUploaderProps> = ({ onUploadComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<ProcessingStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validar que sea un archivo Excel
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      
      if (!validTypes.includes(selectedFile.type)) {
        setError('Por favor selecciona un archivo Excel válido (.xlsx o .xls)');
        return;
      }
      
      setFile(selectedFile);
      setError(null);
      setStats(null);
    }
  }, []);

  const processFile = useCallback(async () => {
    if (!file) return;

    setProcessing(true);
    setProgress(0);
    setError(null);

    try {
      // Leer archivo Excel
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Obtener la primera hoja
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convertir a JSON manteniendo estructura completa
      const rawData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1, // Usar números como headers para mantener estructura
        defval: '', // Valor por defecto para celdas vacías
        raw: false // Convertir todo a string
      }) as string[][];

      console.log('Datos crudos leídos:', rawData.slice(0, 5)); // Log primeras 5 filas
      
      // Actualizar progreso
      setProgress(25);
      
      // Procesar datos usando la función especializada
      const processedData = processExcelData(rawData);
      
      console.log('Datos procesados:', processedData.slice(0, 3)); // Log primeras 3 filas procesadas
      
      // Actualizar progreso
      setProgress(50);
      
      // Subir a Supabase en lotes
      const uploadStats = await uploadToSupabase(processedData, (currentProgress) => {
        setProgress(50 + (currentProgress * 0.5)); // 50% base + 50% del upload
      });
      
      setProgress(100);
      setStats(uploadStats);
      
      // Callback si se proporciona
      onUploadComplete?.(uploadStats);
      
    } catch (err) {
      console.error('Error procesando archivo:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido procesando el archivo');
    } finally {
      setProcessing(false);
    }
  }, [file, onUploadComplete]);

  const resetUpload = useCallback(() => {
    setFile(null);
    setProgress(0);
    setStats(null);
    setError(null);
    // Limpiar input
    const fileInput = document.getElementById('excel-file') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }, []);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Subir Datos de Excel
        </CardTitle>
        <CardDescription>
          Procesa y sube datos de encuestas desde archivos Excel a la base de datos
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* File Selection */}
        {!file && !processing && !stats && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Selecciona un archivo Excel (.xlsx, .xls)
              </p>
              <input
                id="excel-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button 
                onClick={() => document.getElementById('excel-file')?.click()}
                variant="outline"
              >
                Seleccionar Archivo
              </Button>
            </div>
          </div>
        )}

        {/* File Selected */}
        {file && !processing && !stats && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button onClick={resetUpload} variant="ghost" size="sm">
                Cambiar
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={processFile} className="flex-1">
                Procesar y Subir
              </Button>
            </div>
          </div>
        )}

        {/* Processing */}
        {processing && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm font-medium mb-2">Procesando archivo...</p>
              <Progress value={progress} className="w-full" />
              <p className="text-xs text-gray-500 mt-1">{progress.toFixed(0)}% completado</p>
            </div>
          </div>
        )}

        {/* Success */}
        {stats && !error && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                ¡Datos procesados y subidos exitosamente!
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total registros:</span>
                  <span className="font-medium">{stats.totalRecords}</span>
                </div>
                <div className="flex justify-between">
                  <span>Exitosos:</span>
                  <span className="font-medium text-green-600">{stats.successful}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fallidos:</span>
                  <span className="font-medium text-red-600">{stats.failed}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Con categoría:</span>
                  <span className="font-medium">{stats.withCategory}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sin categoría:</span>
                  <span className="font-medium">{stats.withoutCategory}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tiempo:</span>
                  <span className="font-medium">{stats.processingTime}ms</span>
                </div>
              </div>
            </div>
            
            <Button onClick={resetUpload} variant="outline" className="w-full">
              Subir Otro Archivo
            </Button>
          </div>
        )}

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default ExcelUploader;