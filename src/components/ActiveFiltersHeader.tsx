import React from 'react';

interface Filter {
  type: string;
  pregunta: string;
  respuesta: string;
}

interface ActiveFiltersHeaderProps {
  filters: Filter[];
  onRemoveFilter: (filter: Filter) => void;
  onClearAll: () => void;
}

const ActiveFiltersHeader: React.FC<ActiveFiltersHeaderProps> = ({
  filters,
  onRemoveFilter,
  onClearAll
}) => {
  if (filters.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex flex-wrap gap-2 flex-1">
        {filters.map((filter, index) => (
          <div
            key={index}
            className="inline-flex items-center gap-2 bg-gray-700 text-white text-sm px-3 py-1.5 rounded-full"
          >
            <span className="text-gray-300">{filter.pregunta}:</span>
            <span>{filter.respuesta}</span>
            <button
              onClick={() => onRemoveFilter(filter)}
              className="ml-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      {filters.length > 0 && (
        <button
          onClick={onClearAll}
          className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
        >
          <span>Limpiar todo</span>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default ActiveFiltersHeader;
