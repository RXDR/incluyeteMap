import React from 'react';
import { MapDataItem } from '@/hooks/useCombinedFiltersOptimizado';

interface Top10BarriosProps {
  data: MapDataItem[];
  metric?: 'matches_count' | 'intensity_score';
  title?: string;
}

export const Top10Barrios: React.FC<Top10BarriosProps> = ({ data, metric = 'matches_count', title }) => {
  // Ordenar y tomar top 10
  const sorted = [...data]
    .filter(b => b.barrio && b[metric] !== undefined && b[metric] !== null)
    .sort((a, b) => Number(b[metric]) - Number(a[metric]))
    .slice(0, 10);

  return (
    <div className="bg-gray-800 text-white rounded-lg p-3 w-full h-[250px] overflow-y-auto">
      <h3 className="font-bold mb-2 text-xs flex items-center text-white">
        <span className="mr-2">🏆</span>
        Top 10 Barrios
      </h3>
      <ol className="space-y-1">
        {sorted.map((barrio, idx) => (
          <li key={barrio.barrio} className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center justify-center w-4 h-4 text-[10px] font-medium rounded-full 
                ${idx < 3 ? 'bg-blue-600' : 'bg-gray-700'}`}>
                {idx + 1}
              </span>
              <span className="text-gray-300">{barrio.barrio}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-yellow-400">
                {barrio.matches_count}
              </span>
              <span className="text-[10px] text-gray-500">
                /{barrio.total_encuestas}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
};
