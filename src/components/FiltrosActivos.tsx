import React from 'react';
import { CombinedFilter } from '../hooks/useCombinedFilters';

interface FiltrosActivosProps {
  filtros: CombinedFilter[];
  onRemove: (index: number) => void;
  className?: string;
}

const FiltrosActivos: React.FC<FiltrosActivosProps> = ({ filtros, onRemove, className }) => {
  return (
    <div className={className}>
      <h4 className="text-sm font-medium text-gray-300 mb-2">Filtros Activos ({filtros.length})</h4>
      <div className="space-y-2">
        {filtros.map((filtro, index) => (
          <div
            key={index}
            className="flex items-center justify-between bg-gray-700 p-2 rounded"
          >
            <span className="text-xs text-white">
              {filtro.category ? `${filtro.category}: ` : ''}
              Pregunta {filtro.questionId} = {filtro.response}
            </span>
            <button
              onClick={() => onRemove(index)}
              className="text-red-300 hover:text-red-100"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FiltrosActivos;
