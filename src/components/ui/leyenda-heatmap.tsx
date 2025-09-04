import React from 'react';
import { cn } from '@/lib/utils';

interface LeyendaHeatmapProps {
  className?: string;
  mode?: 'income' | 'combined';
  title?: string;
}

/**
 * Componente de leyenda para el mapa de calor
 * Muestra la escala de colores según el porcentaje de coincidencia
 * Basado en la imagen de leyenda proporcionada
 */
export function LeyendaHeatmap({ className, mode = 'combined', title = 'Leyenda del Mapa' }: LeyendaHeatmapProps) {
  // Rangos según el modo
  const rangos = mode === 'income' ? [
    { min: 0, max: 25, color: '#e5e5e5', label: 'Sin ingresos', description: 'Población sin ingresos' },
    { min: 25, max: 50, color: '#ffe4b5', label: 'Ingresos bajos', description: '$1 - $300.000' },
    { min: 50, max: 75, color: '#ffa500', label: 'Ingresos medios', description: '$300.001 - $1.000.000' },
    { min: 75, max: 100, color: '#ff4500', label: 'Ingresos altos', description: '$1.000.001 - $2.000.000' },
    { min: 100, max: null, color: '#8b0000', label: 'Ingresos muy altos', description: 'Más de $2.000.000' },
  ] : [
    { min: 0, max: 25, color: '#e5e5e5', label: '0 - 25%', description: 'Coincidencia Baja' },
    { min: 25, max: 50, color: '#ffe4b5', label: '25 - 50%', description: 'Coincidencia Media-Baja' },
    { min: 50, max: 75, color: '#ffa500', label: '50 - 75%', description: 'Coincidencia Media' },
    { min: 75, max: 100, color: '#ff4500', label: '75 - 100%', description: 'Coincidencia Alta' },
    { min: 100, max: null, color: '#8b0000', label: '100%', description: 'Coincidencia Total' },
  ];

  return (
    <div className={cn('p-3 bg-white rounded-lg shadow-md', className)}>
      <h3 className="text-sm font-medium mb-2">{title}</h3>
      <div className="space-y-2">
        {rangos.map((rango) => (
          <div key={rango.label} className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded" 
              style={{ backgroundColor: rango.color }}
            />
            <div className="flex flex-col">
              <span className="text-xs font-medium text-gray-900">{rango.label}</span>
              <span className="text-xs text-gray-500">{rango.description}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LeyendaHeatmap;
