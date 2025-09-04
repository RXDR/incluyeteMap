import { supabase } from '@/integrations/supabase/client';
import type { ProcessedRow, ProcessingStats, ColumnMapping, CategoryMapping } from '@/types/excel';

// Categorías conocidas según las imágenes proporcionadas
const KNOWN_CATEGORIES = [
  'SOCIODEMOGRÁFICA',
  'TIPO DE DISCAPACIDAD'
];

// Columnas especiales que no pertenecen a categorías
const SPECIAL_COLUMNS = {
  COORDX: 'coordinates_x',
  COORDY: 'coordinates_y', 
  COORDSX: 'coordinates_x',
  COORDSY: 'coordinates_y',
  LOCALIDAD: 'localidad',
  BARRIO: 'barrio',
  DIRECCIÓN: 'address',
  DIRECCION: 'address',
  ESTRATO: 'stratum',
  OBSERVACIONES: 'observations'
};

/**
 * Procesa los datos crudos del Excel según la estructura esperada
 */
export function processExcelData(rawData: string[][]): ProcessedRow[] {
  const startTime = Date.now();
  
  if (rawData.length < 4) {
    throw new Error('El archivo no tiene suficientes filas para procesar');
  }

  // Identificar estructura del Excel
  const categoryRow = rawData[0] || [];
  const skipRow = rawData[1] || []; // Fila que se ignora
  const questionRow = rawData[2] || [];
  const dataRows = rawData.slice(3);

  console.log('Estructura identificada:');
  console.log('- Categorías:', categoryRow.slice(0, 10));
  console.log('- Preguntas:', questionRow.slice(0, 10));
  console.log('- Total filas de datos:', dataRows.length);

  // Crear mapeo de columnas
  const columnMappings = createColumnMappings(categoryRow, questionRow);
  
  // Procesar cada fila de datos
  const processedRows: ProcessedRow[] = [];
  
  dataRows.forEach((row, index) => {
    try {
      const processedRow = processDataRow(row, columnMappings, index);
      if (processedRow) {
        processedRows.push(processedRow);
      }
    } catch (error) {
      console.error(`Error procesando fila ${index + 4}:`, error);
      // Continuar con la siguiente fila
    }
  });

  console.log(`Procesamiento completado: ${processedRows.length} filas válidas de ${dataRows.length} totales`);
  
  return processedRows;
}

/**
 * Crea el mapeo de columnas basado en categorías y preguntas
 */
function createColumnMappings(categories: string[], questions: string[]): ColumnMapping[] {
  const mappings: ColumnMapping[] = [];
  
  categories.forEach((category, index) => {
    const question = questions[index] || '';
    const cleanCategory = (category || '').toString().trim().toUpperCase();
    const cleanQuestion = (question || '').toString().trim();

    // Determinar la categoría final
    let finalCategory = 'OTROS';
    
    if (KNOWN_CATEGORIES.includes(cleanCategory)) {
      finalCategory = cleanCategory;
    } else if (cleanCategory && cleanCategory !== 'NO INCLUIR') {
      finalCategory = cleanCategory;
    }
    
    // Verificar si es una columna especial
    const specialKey = Object.keys(SPECIAL_COLUMNS).find(key => 
      cleanQuestion.includes(key) || cleanCategory.includes(key)
    );
    
    mappings.push({
      index,
      category: finalCategory,
      question: cleanQuestion,
      originalHeader: `${cleanCategory}_${cleanQuestion}`.replace(/\s+/g, '_')
    });
  });

  return mappings;
}

/**
 * Procesa una fila individual de datos
 */
function processDataRow(
  row: string[], 
  mappings: ColumnMapping[], 
  rowIndex: number
): ProcessedRow | null {
  
  // Generar ID único para la fila
  const id = `row_${Date.now()}_${rowIndex}`;
  
  // Inicializar estructura de datos
  const processedRow: ProcessedRow = {
    id,
    sociodemographic: {},
    location: {
      localidad: '',
      barrio: '',
      coordinates: { x: null, y: null },
      address: ''
    },
    responses: {},
    metadata: {
      stratum: '',
      observations: '',
      category_distribution: {},
      processing_date: new Date().toISOString(),
      row_number: rowIndex + 4 // +4 porque empezamos desde la fila 4
    }
  };

  // Procesar cada columna
  mappings.forEach((mapping, colIndex) => {
    const cellValue = row[colIndex]?.toString().trim() || '';
    
    if (!cellValue) return; // Ignorar celdas vacías
    
    // Verificar si es una columna especial
    const specialKey = Object.keys(SPECIAL_COLUMNS).find(key => 
      mapping.question.toUpperCase().includes(key)
    );
    
    if (specialKey) {
      handleSpecialColumn(processedRow, SPECIAL_COLUMNS[specialKey as keyof typeof SPECIAL_COLUMNS], cellValue);
    } else {
      // Agrupar por categoría
      if (mapping.category === 'SOCIODEMOGRÁFICA') {
        processedRow.sociodemographic[mapping.question || `col_${colIndex}`] = cellValue;
      } else {
        // Crear estructura anidada por categoría
        if (!processedRow.responses[mapping.category]) {
          processedRow.responses[mapping.category] = {};
        }
        processedRow.responses[mapping.category][mapping.question || `col_${colIndex}`] = cellValue;
      }
      
      // Actualizar distribución de categorías
      if (!processedRow.metadata.category_distribution[mapping.category]) {
        processedRow.metadata.category_distribution[mapping.category] = '';
      }
    }
  });

  // Validar que la fila tenga datos mínimos
  const hasData = Object.keys(processedRow.sociodemographic).length > 0 || 
                  Object.keys(processedRow.responses).length > 0 ||
                  processedRow.location.localidad ||
                  processedRow.location.barrio;

  return hasData ? processedRow : null;
}

/**
 * Maneja columnas especiales como coordenadas, localidad, etc.
 */
function handleSpecialColumn(row: ProcessedRow, specialType: string, value: string) {
  switch (specialType) {
    case 'coordinates_x':
      const x = parseFloat(value);
      if (!isNaN(x)) row.location.coordinates.x = x;
      break;
    case 'coordinates_y':
      const y = parseFloat(value);
      if (!isNaN(y)) row.location.coordinates.y = y;
      break;
    case 'localidad':
      row.location.localidad = value;
      break;
    case 'barrio':
      row.location.barrio = value;
      break;
    case 'address':
      row.location.address = value;
      break;
    case 'stratum':
      row.metadata.stratum = value;
      break;
    case 'observations':
      row.metadata.observations = value;
      break;
  }
}

/**
 * Sube los datos procesados a Supabase en lotes
 */
export async function uploadToSupabase(
  data: ProcessedRow[], 
  onProgress?: (progress: number) => void
): Promise<ProcessingStats> {
  const startTime = Date.now();
  const BATCH_SIZE = 100; // Procesar en lotes de 100 registros
  
  let successful = 0;
  let failed = 0;
  let withCategory = 0;
  let withoutCategory = 0;
  const categories = new Set<string>();
  
  // Procesar en lotes
  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE);
    
    try {
      // Preparar datos para inserción
      const supabaseRows = batch.map(row => ({
        id: row.id,
        sociodemographic_data: row.sociodemographic,
        location_data: row.location,
        responses_data: row.responses,
        metadata: row.metadata,
        created_at: new Date().toISOString()
      }));
      
      // Insertar en Supabase
      const { error } = await supabase
        .from('survey_responses')
        .insert(supabaseRows);
      
      if (error) {
        console.error('Error insertando lote:', error);
        failed += batch.length;
      } else {
        successful += batch.length;
        
        // Actualizar estadísticas
        batch.forEach(row => {
          const hasCategories = Object.keys(row.responses).length > 0;
          if (hasCategories) {
            withCategory++;
            Object.keys(row.responses).forEach(cat => categories.add(cat));
          } else {
            withoutCategory++;
          }
        });
      }
      
    } catch (error) {
      console.error('Error procesando lote:', error);
      failed += batch.length;
    }
    
    // Actualizar progreso
    const progress = ((i + BATCH_SIZE) / data.length) * 100;
    onProgress?.(Math.min(progress, 100));
  }
  
  const processingTime = Date.now() - startTime;
  
  return {
    totalRecords: data.length,
    successful,
    failed,
    withCategory,
    withoutCategory,
    processingTime,
    categories: Array.from(categories)
  };
}

/**
 * Función auxiliar para limpiar y validar datos
 */
export function validateAndCleanData(data: any[]): any[] {
  return data.filter(row => {
    // Filtrar filas completamente vacías
    return row && Object.values(row).some(value => 
      value !== null && value !== undefined && value !== ''
    );
  });
}