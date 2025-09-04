import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'react-toastify';

import { FilterConfig } from '@/hooks/useCombinedFiltersOptimizado';
import { QUESTION_MAPPING } from '@/config/questionMapping';

interface FiltrosActivosProps {
  filtros: FilterConfig[];
  onRemove: (index: number) => void;
  onClearQuestion: (questionId: string, category?: string) => void;
  className?: string;
}

/**
 * Componente para mostrar los filtros activos agrupados por pregunta
 */
export function FiltrosActivos({ filtros, onRemove, onClearQuestion, className }: FiltrosActivosProps) {
  // Agrupar filtros por categoría y pregunta
  const filtrosAgrupados = useMemo(() => {
    const agrupados: Record<string, { 
      categoria: string;
      preguntaId: string;
      preguntaTexto: string;
      respuestas: { texto: string, indice: number }[] 
    }> = {};

    filtros.forEach((filtro, index) => {
      const key = `${filtro.category}__${filtro.questionId}`;
      
      // Obtener el texto de la pregunta del mapeo
      const questionMapping = QUESTION_MAPPING[filtro.category] || {};
      const preguntaTexto = questionMapping[filtro.questionId] || filtro.questionId;
      
      if (!agrupados[key]) {
        agrupados[key] = {
          categoria: filtro.category,
          preguntaId: filtro.questionId,
          preguntaTexto,
          respuestas: []
        };
      }
      
      agrupados[key].respuestas.push({
        texto: filtro.selectedResponse || filtro.response || '',
        indice: index
      });
    });
    
    return Object.values(agrupados);
  }, [filtros]);
  
  if (filtros.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <h3 className="text-sm font-medium mb-2">Filtros activos</h3>
      <ScrollArea className="h-[200px] w-full pr-3">
        <div className="space-y-3">
          {filtrosAgrupados.map((grupo) => (
            <div key={`${grupo.categoria}__${grupo.preguntaId}`} className="border rounded-md p-2">
              <div className="text-xs font-medium mb-1">{grupo.categoria}: {grupo.preguntaTexto}</div>
              <div className="flex flex-wrap gap-1">
                {grupo.respuestas.map((respuesta) => (
                  <Badge 
                    key={`${respuesta.indice}-${respuesta.texto}`} 
                    variant="secondary"
                    className="pr-1 flex items-center gap-1"
                  >
                    <span className="text-xs">{respuesta.texto}</span>
                    <button
                      onClick={() => onRemove(respuesta.indice)}
                      className="rounded-full hover:bg-muted p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </Badge>
                ))}
                <button
                  onClick={() => onClearQuestion(grupo.preguntaId, grupo.categoria)}
                  className="text-xs text-blue-500 hover:underline"
                >
                  Limpiar pregunta
                </button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export default FiltrosActivos;
