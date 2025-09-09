import React from 'react';
import { cn } from '@/lib/utils';

interface LeyendaHeatmapProps {
  className?: string;
  title?: string;
  steps: Array<{
    value: number;
    label: string;
    color: string;
    opacity: number;
  }>;
}


export function LeyendaHeatmap({ className, title = 'Leyenda del Mapa', steps }: LeyendaHeatmapProps) {
  return (
    <div className={cn('p-3 bg-white rounded-lg shadow-md')}>
      <h3 className="text-sm text-gray-900 font-medium mb-2">{title}</h3>
      <div className="space-y-2">
        {steps.map((step) => (
          <div key={step.label} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: step.color, opacity: step.opacity }}
            />
            <div className="flex flex-col">
              <span className="text-xs font-medium text-gray-900">{step.label} - Coincidencia</span>
            
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LeyendaHeatmap;
