import React, { useState } from "react";
import { CombinedFilter } from '@/hooks/useCombinedFilters';
import * as XLSX from "xlsx";
import { useCombinedFilters } from '@/hooks/useCombinedFilters';
import { supabase } from '@/integrations/supabase/client';

interface ExportFilteredPersonsExcelProps {
  combinedFilters?: CombinedFilter[];
}

const ExportFilteredPersonsExcel: React.FC<ExportFilteredPersonsExcelProps> = ({ combinedFilters: propCombinedFilters }) => {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [maxPages, setMaxPages] = useState<number | null>(null);
  // Usar los filtros recibidos por prop si existen, si no usar el hook
  const { combinedFilters: hookCombinedFilters } = useCombinedFilters();
  const combinedFilters = propCombinedFilters ?? hookCombinedFilters;

  const fetchAllFilteredDataAndExportExcel = async () => {
    setExporting(true);
    setProgress(0);
    setCurrentPage(0);
    setMaxPages(null);
    try {
      const PAGE_SIZE = 1000;
      let allRows: any[] = [];
      let page = 0;
      let hasMore = true;
      // Formatear los filtros igual que en la tabla principal
      const filtrosFormateados = combinedFilters.map(filter => ({
        category: filter.category || '',
        questionId: filter.questionId,
        response: filter.response || ''
      }));
      while (hasMore) {
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        const { data: batch, error } = await supabase.rpc('get_filtered_persons_by_batch', {
          filters: filtrosFormateados,
          from_offset: from,
          to_offset: to
        });
        if (error) throw error;
        if (batch && batch.length > 0) {
          allRows = allRows.concat(batch);
          page++;
          setCurrentPage(page);
          // Estimar progreso: cada página representa 1 paso, si la última página tiene menos de PAGE_SIZE, es la final
          if (batch.length < PAGE_SIZE) {
            setMaxPages(page);
            setProgress(100);
          } else {
            setProgress(Math.min((page * 100) / ((maxPages ?? page + 1)), 99));
          }
          hasMore = batch.length === PAGE_SIZE;
        } else {
          hasMore = false;
          setMaxPages(page);
          setProgress(100);
        }
      }
      const flatRows = allRows.map(row => ({
        ...row,
        ...(row.sociodemographic_data || {}),
        ...(row.metadata || {}),
        ...(row.location_data || {}),
      }));
      const ws = XLSX.utils.json_to_sheet(flatRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "DatosFiltrados");
      XLSX.writeFile(wb, "datos_filtrados_completos.xlsx");
    } catch (err) {
      alert('Error exportando datos completos: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setExporting(false);
      setTimeout(() => setProgress(0), 1500);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        onClick={fetchAllFilteredDataAndExportExcel}
        disabled={exporting || combinedFilters.length === 0}
      >
        {exporting
          ? 'Exportando todo...'
          : combinedFilters.length === 0
            ? 'Seleccione filtros para exportar'
            : 'Exportar Excel Completo'}
      </button>
      {exporting && (
        <div className="w-full flex flex-col items-center">
          <div className="w-64 h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-4 bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs mt-1 text-gray-700">
            {maxPages !== null
              ? `Progreso: ${Math.round(progress)}% (${currentPage} / ${maxPages} páginas)`
              : `Progreso: ${Math.round(progress)}% (página ${currentPage})`}
          </span>
        </div>
      )}
    </div>
  );
};

export default ExportFilteredPersonsExcel;
