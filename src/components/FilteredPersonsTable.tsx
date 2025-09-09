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
       
        {/* Selector de cantidad por página */}
     
        {/* Paginación visual */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-2 rounded-lg font-semibold shadow-sm border border-gray-300 bg-white text-black hover:bg-gray-200 disabled:bg-gray-100 disabled:border-gray-300 disabled:text-black cursor-pointer"
              onClick={() => onPageChange && onPageChange(page - 1)}
              disabled={page === 0}
            >
              ← Anterior
            </button>
            <span className="px-4 py-2 rounded text-sm font-medium bg-white border border-gray-300 text-black">Página {page + 1} de {totalPages}</span>
            <button
              className="px-3 py-2 rounded-lg font-semibold shadow-sm border border-gray-300 bg-white text-black hover:bg-gray-200 disabled:bg-gray-100 disabled:border-gray-300 disabled:text-black cursor-pointer"
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
