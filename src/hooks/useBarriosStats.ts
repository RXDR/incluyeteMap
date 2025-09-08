import { useState } from 'react';

export interface BarrioStats {
  barrio: string;
  localidad: string;
  coordx: number;
  coordsy: number;
  total_encuestas: number;
  matches_count: number;
  match_percentage: number;
  intensity_score?: number;
  matched_responses?: any;
}

export interface GeneralTotals {
  totalBarrios: number;
  totalEncuestas: number;
  totalCoincidencias: number;
  porcentajeGeneral: number;
}

export function useBarriosStats(initialStats: BarrioStats[] = []) {
  const [stats, setStats] = useState<BarrioStats[]>(initialStats);

  // Calcula los totales generales
  const totals: GeneralTotals = stats.length > 0
    ? {
        totalBarrios: stats.length,
        totalEncuestas: stats.reduce((acc, item) => acc + item.total_encuestas, 0),
        totalCoincidencias: stats.reduce((acc, item) => acc + item.matches_count, 0),
        porcentajeGeneral: stats.reduce((acc, item) => acc + item.matches_count, 0) /
          (stats.reduce((acc, item) => acc + item.total_encuestas, 0) || 1) * 100
      }
    : {
        totalBarrios: 0,
        totalEncuestas: 0,
        totalCoincidencias: 0,
        porcentajeGeneral: 0
      };

  // Top 10 barrios por coincidencias
  const top10Barrios = [...stats].sort((a, b) => b.matches_count - a.matches_count).slice(0, 10);

  return {
    stats,
    setStats,
    totals,
    top10Barrios
  };
}
