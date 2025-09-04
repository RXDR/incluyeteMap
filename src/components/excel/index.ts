// Exportaciones principales del sistema de gestión de encuestas

// Componentes principales
export { default as ExcelUploader } from './ExcelUploader';
export { default as StatsDisplay } from './StatsDisplay';
export { default as SurveyDataVisualizer } from './SurveyDataVisualizer';

// Tipos
export type {
  ProcessedRow,
  ProcessingStats,
  CategoryMapping,
  ColumnMapping,
  ExcelStructure
} from '@/types/excel';

// Servicios
export {
  processExcelData,
  uploadToSupabase,
  validateAndCleanData
} from '@/services/excelProcessor';