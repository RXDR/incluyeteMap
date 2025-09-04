import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';

interface ExcelStructure {
  recordType: string;
  totalRecords: number;
  sampleData: any[];
  structureInfo: any;
}

const ExcelUploader: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [excelStructure, setExcelStructure] = useState<ExcelStructure[]>([]);
  const [samples, setSamples] = useState<any[]>([]);
  
  // Estados para la barra de progreso
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [processedRows, setProcessedRows] = useState(0);
  const [totalRows, setTotalRows] = useState(0);

  // =====================================================
  // FUNCIÓN ULTRA SIMPLE: Procesar Excel tal como está
  // =====================================================
  const processExcelFileSimple = async (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          if (jsonData.length === 0) {
            reject(new Error('El archivo está vacío'));
            return;
          }
          
          console.log('🔍 Datos tal como están en Excel:', {
            totalRows: jsonData.length,
            sampleRow: jsonData[0],
            sampleRowLength: jsonData[0]?.length || 0
          });
          
          resolve({
            dataRows: jsonData,
            totalRows: jsonData.length
          });
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  // =====================================================
  // FUNCIÓN: Subir con procesamiento simple
  // =====================================================
  const uploadSimple = async (processedData: any) => {
    try {
      setIsUploading(true);
      setMessage('🚀 Procesando Excel tal como está...');
      setMessageType('info');
      
      const totalRows = processedData.dataRows.length;
      const batchSize = 500;
      const totalBatches = Math.ceil(totalRows / batchSize);
      
      setTotalRows(totalRows);
      setTotalChunks(totalBatches);
      setCurrentChunk(0);
      setProcessedRows(0);
      
      // =====================================================
      // PROCESAR POR LOTES
      // =====================================================
      for (let batchNumber = 1; batchNumber <= totalBatches; batchNumber++) {
        const startIndex = (batchNumber - 1) * batchSize;
        const endIndex = Math.min(startIndex + batchSize, totalRows);
        const batchData = processedData.dataRows.slice(startIndex, endIndex);
        
        setCurrentChunk(batchNumber);
        setMessage(`📦 Procesando lote ${batchNumber}/${totalBatches} (${batchData.length} registros)...`);
        
        // =====================================================
        // LLAMAR FUNCIÓN ULTRA SIMPLE
        // =====================================================
        const { data: result, error } = await supabase.rpc('insert_excel_data_simple', {
          batch_data: batchData,
          batch_number: batchNumber,
          total_batches: totalBatches
        });

        if (error) {
          console.error('❌ Error de Supabase:', error);
          throw new Error(`Error en lote ${batchNumber}: ${error.message}`);
        }

        if (!result || !result.success) {
          console.error('❌ Error en procesamiento:', result);
          throw new Error(`Error en lote ${batchNumber}: ${result?.error || 'Error desconocido'}`);
        }

        // Actualizar progreso
        setProcessedRows(prev => prev + batchData.length);
        setUploadProgress((batchNumber / totalBatches) * 100);
        
        console.log(`✅ Lote ${batchNumber} procesado: ${result.processed_count} registros`);
      }

      // =====================================================
      // VERIFICAR RESULTADO FINAL
      // =====================================================
      const { data: finalStats } = await supabase.rpc('get_total_record_count');
      
      setMessage(`🎉 ¡Archivo procesado exitosamente! ${finalStats} registros cargados`);
      setMessageType('success');

    } catch (error) {
      console.error('❌ Error en procesamiento funcional:', error);
      setMessage(`❌ Error: ${(error as Error).message}`);
      setMessageType('error');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setCurrentChunk(0);
      setTotalChunks(0);
    }
  };

  // =====================================================
  // FUNCIÓN PRINCIPAL DE SUBIDA
  // =====================================================
  const handleFileUpload = async () => {
    if (!file) {
      setMessage('❌ Por favor selecciona un archivo');
      setMessageType('error');
      return;
    }

    try {
      setMessage('📖 Leyendo archivo Excel...');
      setMessageType('info');

      // =====================================================
      // PROCESAR ARCHIVO TAL COMO ESTÁ
      // =====================================================
      const processedData = await processExcelFileSimple(file);
      
      // =====================================================
      // SUBIR CON FUNCIÓN SIMPLE
      // =====================================================
      await uploadSimple(processedData);

    } catch (error) {
      console.error('❌ Error al procesar archivo:', error);
      setMessage(`❌ Error: ${(error as Error).message}`);
      setMessageType('error');
      setIsUploading(false);
    }
  };

  // =====================================================
  // FUNCIÓN DE LIMPIEZA
  // =====================================================
  const handleClearData = async () => {
    try {
      setMessage('🧹 Limpiando datos...');
      setMessageType('info');
      
      const { data, error } = await supabase.rpc('clear_temp_excel');
      
      if (error) {
        throw error;
      }
      
      setMessage('✅ Datos limpiados exitosamente');
      setMessageType('success');
      
    } catch (error) {
      console.error('❌ Error al limpiar datos:', error);
      setMessage(`❌ Error: ${(error as Error).message}`);
      setMessageType('error');
    }
  };

  // =====================================================
  // FUNCIÓN DE AUDITORÍA COMPLETA
  // =====================================================
  const handleAuditSystem = async () => {
    try {
      setMessage('🔍 Ejecutando auditoría completa del sistema...');
      setMessageType('info');
      
      const { data, error } = await supabase.rpc('audit_complete_system');
      
      if (error) {
        throw error;
      }
      
      console.log('🔍 Auditoría completa del sistema:', data);
      
      setMessage('✅ Auditoría completada. Revisa la consola para ver los detalles.');
      setMessageType('success');
      
    } catch (error) {
      console.error('❌ Error en auditoría:', error);
      setMessage(`❌ Error: ${(error as Error).message}`);
      setMessageType('error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">📊 Cargador de Excel Dinámico</h2>
      
      {/* Mensaje de estado */}
      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          messageType === 'success' ? 'bg-green-100 text-green-800' :
          messageType === 'error' ? 'bg-red-100 text-red-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {message}
        </div>
      )}

      {/* Barra de progreso */}
      {isUploading && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progreso: {Math.round(uploadProgress)}%</span>
            <span>Lote {currentChunk}/{totalChunks}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Registros procesados: {processedRows}/{totalRows}
          </div>
        </div>
      )}

      {/* Selector de archivo */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Seleccionar archivo Excel
        </label>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          disabled={isUploading}
        />
      </div>

      {/* Botones de acción */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={handleFileUpload}
          disabled={!file || isUploading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? '⏳ Procesando...' : '🚀 Subir Excel'}
        </button>
        
        <button
          onClick={handleClearData}
          disabled={isUploading}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          🧹 Limpiar Datos
        </button>
        
                 <button
           onClick={handleAuditSystem}
           disabled={isUploading}
           className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
         >
           🔍 Auditoría Sistema
         </button>
      </div>

      {/* Información de estructura */}
      {excelStructure.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">📋 Estructura de Datos</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            {excelStructure.map((structure, index) => (
              <div key={index} className="mb-4">
                <h4 className="font-medium text-gray-700">{structure.recordType}</h4>
                <p className="text-sm text-gray-600">Total de registros: {structure.totalRecords}</p>
                {structure.structureInfo && (
                  <div className="mt-2 text-sm text-gray-600">
                    <p>Categorías: {structure.structureInfo.stats?.categories_count || 0}</p>
                    <p>Preguntas: {structure.structureInfo.stats?.questions_count || 0}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Información del sistema */}
                              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 text-blue-800">ℹ️ Sistema Ultra Simple</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Sube todos los datos tal como están en el Excel</li>
            <li>• Sin filtros, sin mapeo, sin complicaciones</li>
            <li>• Guarda cada columna con su índice</li>
            <li>• Para ver la estructura real de los datos</li>
          </ul>
        </div>
    </div>
  );
};

export default ExcelUploader;

