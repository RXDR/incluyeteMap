import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiBarChart2 } from 'react-icons/fi';

interface IncomeData {
  barrio: string;
  localidad: string;
  total_encuestas: number;
  ingreso_bajo: number;
  ingreso_medio: number;
  ingreso_alto: number;
  sin_ingresos: number;
  porcentaje_vulnerable: number;
}

interface IncomeAnalysisProps {
  onFilterChange: (filters: any[]) => void;
  onUpdateStats: (stats: any) => void;
}

const INCOME_RANGES = [
  { label: 'Sin ingresos', value: 'No tiene ingresos', color: 'bg-red-500' },
  { label: 'Ingresos bajos ($1 - $300.000)', value: '1 - De $1 a $300.000', color: 'bg-orange-500' },
  { label: 'Ingresos medios ($300.001 - $1.000.000)', value: ['2 - De $300.001 a $500.000', '3 - De $500.001 a $700.000', '4 - De $700.001 a $1.000.000'], color: 'bg-yellow-500' },
  { label: 'Ingresos altos (> $1.000.000)', value: ['5 - De $1.000.001 a $1.500.000', '6 - De $1.500.001 a $2.000.000', '7 - Más de $2.000.000'], color: 'bg-green-500' },
];

export const IncomeAnalysis: React.FC<IncomeAnalysisProps> = ({ onFilterChange, onUpdateStats }) => {
  const [selectedRange, setSelectedRange] = useState<string | null>(null);
  const [top10Data, setTop10Data] = useState<IncomeData[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar el top 10 de barrios por vulnerabilidad económica
  const loadTop10Data = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ingresos/top10');
      const data = await response.json();
      setTop10Data(data);
    } catch (error) {
      console.error('Error loading top 10 data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtro por rango de ingresos
  const handleRangeSelect = async (range: string | string[]) => {
    try {
      setLoading(true);
      setSelectedRange(Array.isArray(range) ? range[0] : range);

      // Si es un array de rangos, creamos un filtro más complejo
      const filters = Array.isArray(range) 
        ? range.map(r => ({
            category: 'EDUCACIÓN Y ECONOMÍA',
            questionId: 'ENTREGUE TARJETA 2: ¿A cuánto asciende, aproximadamente, los ingresos mensuales suyos / de la persona con discapacidad (incluyendo subsidios de programas sociales)?',
            response: r
          }))
        : [{
            category: 'EDUCACIÓN Y ECONOMÍA',
            questionId: 'ENTREGUE TARJETA 2: ¿A cuánto asciende, aproximadamente, los ingresos mensuales suyos / de la persona con discapacidad (incluyendo subsidios de programas sociales)?',
            response: range
          }];

      onFilterChange(filters);

      // Obtener estadísticas
      const response = await fetch('/api/ingresos/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ range })
      });
      const stats = await response.json();
      onUpdateStats(stats);
    } catch (error) {
      console.error('Error applying income filter:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTop10Data();
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3 flex items-center">
          <FiDollarSign className="mr-2" />
          Análisis de Ingresos
        </h3>
        
        {/* Filtros de rangos de ingresos */}
        <div className="space-y-2">
          {INCOME_RANGES.map((range) => (
            <button
              key={Array.isArray(range.value) ? range.value[0] : range.value}
              onClick={() => handleRangeSelect(range.value)}
              className={`w-full text-left px-3 py-2 rounded flex items-center justify-between ${
                selectedRange === range.value ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <span className="flex items-center">
                <span className={`w-3 h-3 rounded-full ${range.color} mr-2`} />
                {range.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Top 10 Barrios más vulnerables */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3 flex items-center">
          <FiBarChart2 className="mr-2" />
          Top 10 Barrios Vulnerables
        </h3>
        
        {loading ? (
          <div className="text-center py-4">Cargando...</div>
        ) : (
          <div className="space-y-2">
            {top10Data.map((item, index) => (
              <div
                key={item.barrio}
                className="bg-gray-700 rounded p-3"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    {index + 1}. {item.barrio}
                  </span>
                  <span className="text-sm bg-red-500 px-2 py-1 rounded">
                    {item.porcentaje_vulnerable}% vulnerable
                  </span>
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  Sin ingresos: {item.sin_ingresos} | Ingresos bajos: {item.ingreso_bajo}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default IncomeAnalysis;
