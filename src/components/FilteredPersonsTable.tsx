
import React from 'react';
import { saveAs } from 'file-saver';


export interface FilteredPerson {
  id: number;
  barrio: string;
  localidad: string;
  address: string;
  x: number;
  y: number;
  metadata: any;
  responses_data: any;
}

interface FilteredPersonsTableProps {
  persons: FilteredPerson[];
}

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'documento', label: 'Documento' },
  { key: 'sexo_identidad', label: 'Sexo Identidad' },
  { key: 'sexo', label: 'Sexo (nacimiento)' },
  { key: 'celular', label: 'Celular' },
  { key: 'address', label: 'Dirección' },
  { key: 'x', label: 'Coord X' },
  { key: 'y', label: 'Coord Y' },
];

function getPersonField(row: FilteredPerson, key: string) {
  const otros = row.responses_data?.OTROS || {};
  if (key === 'nombre') {
    return [otros['PRIMER NOMBRE'], otros['SEGUNDO NOMBRE'], otros['PRIMER APELLIDO'], otros['SEGUNDO APELLIDO']].filter(Boolean).join(' ');
  }
  if (key === 'documento') {
    return otros['Número de documento de la persona con discapacidad'] || '';
  }
  if (key === 'sexo_identidad') {
    return otros['¿Cuál es su identidad de género / la identidad de género de la persona con discapacidad actualmente?'] || '';
  }
  if (key === 'sexo') {
    return otros['¿Qué sexo le fue asignado al nacer en su certificado de nacimiento / en el certificado de nacimiento de la persona con discapacidad?'] || '';
  }
  if (key === 'celular') {
    return [otros['Celular 1'], otros['Celular 2']].filter(Boolean).join(' / ');
  }
  if (key === 'address') {
    return row.address || '';
  }
  if (key === 'x') {
    return row.x;
  }
  if (key === 'y') {
    return row.y;
  }
  return row[key] || '';
}

function jsonToCSV(data: FilteredPerson[]) {
  const header = columns.map(col => col.label).join(',');
  const rows = data.map(row =>
    columns.map(col => {
      const value = getPersonField(row, col.key);
      if (typeof value === 'object') return JSON.stringify(value);
      return value;
    }).join(',')
  );
  return [header, ...rows].join('\n');
}

export const FilteredPersonsTable: React.FC<FilteredPersonsTableProps> = ({ persons }) => {
  const handleExport = () => {
    const csv = jsonToCSV(persons);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'personas_filtradas.csv');
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Personas que cumplen con el filtro</h2>
  <button onClick={handleExport} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Exportar a Excel</button>
      </div>
      <div className="overflow-x-auto">
  <table className="min-w-full border text-black">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} className="border px-2 py-1 bg-gray-100 text-xs">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {persons.map(person => (
              <tr key={person.id}>
                {columns.map(col => (
                  <td key={col.key} className="border px-2 py-1 text-xs text-black">
                    {getPersonField(person, col.key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
