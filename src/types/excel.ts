// Tipos para el procesamiento de datos de Excel

export interface CategoryMapping {
  [key: string]: string;
}

export interface ProcessedRow {
  id: string;
  sociodemographic: Record<string, any>;
  location: {
    localidad: string;
    barrio: string;
    coordinates: {
      x: number | null;
      y: number | null;
    };
    address: string;
  };
  responses: Record<string, any>;
  metadata: {
    stratum: string;
    observations: string;
    category_distribution: CategoryMapping;
    processing_date: string;
    row_number: number;
  };
}

export interface ProcessingStats {
  totalRecords: number;
  successful: number;
  failed: number;
  withCategory: number;
  withoutCategory: number;
  processingTime: number;
  categories: string[];
}

export interface ExcelStructure {
  categoryRow: number;
  skipRow: number;
  questionRow: number;
  dataStartRow: number;
}

export interface ColumnMapping {
  index: number;
  category: string;
  question: string;
  originalHeader: string;
}