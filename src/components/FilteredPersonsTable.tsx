import React from "react";
import * as XLSX from "xlsx";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";

export interface PersonData {
  sexo: string;
  nombre: string;
  direccion: string;
  celular: string;
  barrio: string;
  [key: string]: any;
}

interface FilteredPersonsTableProps {
  data: PersonData[];
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
}

const columns: ColumnDef<PersonData>[] = [
  { accessorKey: "nombre", header: "Nombre" },
  { accessorKey: "sexo", header: "Sexo" },
  { accessorKey: "direccion", header: "Dirección" },
  { accessorKey: "celular", header: "Celular" },
  { accessorKey: "barrio", header: "Barrio" },
];

export const FilteredPersonsTable: React.FC<FilteredPersonsTableProps> = ({ data, page = 0, totalPages = 1, onPageChange, pageSize = 1000, onPageSizeChange }) => {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Exportar a Excel con formato correcto
  const handleExportExcel = () => {
    // Generar hoja de cálculo con los datos y encabezados
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DatosFiltrados");
    XLSX.writeFile(wb, "datos_filtrados.xlsx");
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex flex-wrap justify-between items-center mb-2 gap-2">
        <button
          className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          onClick={handleExportExcel}
        >
          Exportar a Excel
        </button>
        {/* Selector de cantidad por página */}
        <div className="flex items-center gap-2">
          <label htmlFor="pageSize" className="text-sm font-medium text-gray-700 dark:text-gray-200">Registros por página:</label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={e => onPageSizeChange && onPageSizeChange(Number(e.target.value))}
            className="px-2 py-1 rounded border border-gray-300 text-black dark:text-black bg-white dark:bg-yellow-100"
            style={{ minWidth: 80 }}
          >
            <option value={100}>100</option>
            <option value={250}>250</option>
            <option value={500}>500</option>
            <option value={1000}>1000</option>
          </select>
        </div>
        {/* Paginación visual */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              className={`px-3 py-2 rounded-lg font-semibold transition-colors shadow-sm border
                ${page === 0
                  ? 'bg-gray-100 text-gray-700 border-gray-300 cursor-not-allowed'
                  : 'bg-yellow-400 text-black border-yellow-500 hover:bg-yellow-500 hover:border-yellow-600'}
                dark:${page === 0
                  ? 'bg-gray-800 text-gray-300 border-gray-700 cursor-not-allowed'
                  : 'bg-yellow-300 text-black border-yellow-400 hover:bg-yellow-400 hover:border-yellow-500'}
              `}
              onClick={() => onPageChange && onPageChange(page - 1)}
              disabled={page === 0}
            >
              ← Anterior
            </button>
            <span className="px-4 py-2 rounded text-sm font-medium bg-gray-100 text-black border border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-700">Página {page + 1} de {totalPages}</span>
            <button
              className={`px-3 py-2 rounded-lg font-semibold transition-colors shadow-sm border
                ${(page + 1 >= totalPages)
                  ? 'bg-gray-100 text-gray-700 border-gray-300 cursor-not-allowed'
                  : 'bg-yellow-400 text-black border-yellow-500 hover:bg-yellow-500 hover:border-yellow-600'}
                dark:${(page + 1 >= totalPages)
                  ? 'bg-gray-800 text-gray-300 border-gray-700 cursor-not-allowed'
                  : 'bg-yellow-300 text-black border-yellow-400 hover:bg-yellow-400 hover:border-yellow-500'}
              `}
              onClick={() => onPageChange && onPageChange(page + 1)}
              disabled={page + 1 >= totalPages}
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
      <table className="min-w-full border text-gray-900">
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th key={header.id} className="px-2 py-1 border-b bg-gray-100 text-left">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr key={row.id}>
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="px-2 py-1 border-b">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="p-4 text-center text-gray-500">No hay datos para mostrar.</div>
      )}
    </div>
  );
};
