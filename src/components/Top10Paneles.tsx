import React, { useEffect, useState } from 'react';
import { MapDataItem, FilterConfig, useCombinedFiltersOptimizado } from '@/hooks/useCombinedFiltersOptimizado';
import { supabase } from '@/integrations/supabase/client';

interface Top10PanelesProps {
  data: MapDataItem[];
  filters?: FilterConfig[];
}

const Top10Paneles: React.FC<Top10PanelesProps> = ({ data, filters }) => {
  const { getTopRespuestas } = useCombinedFiltersOptimizado();
  const [topRespuestas, setTopRespuestas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Estado para personas por barrio según filtros
  const [filteredPersons, setFilteredPersons] = useState<{ barrio: string; personas_unicas: number }[]>([]);
  const [loadingPersons, setLoadingPersons] = useState(false);

  // Construir filtros activos para la función
  const buildFilters = () => {
    return filters.map(f => ({
      subcategoria: f.category,
      pregunta: f.questionId,
      respuesta: f.response
    }));
  };

  // Cargar personas por barrio según filtros activos
  useEffect(() => {
    if (filters && filters.length > 0) {
      setLoadingPersons(true);
      const filterPayload = buildFilters();
      supabase.rpc('get_persons_by_barrio_with_filters', { filters: filterPayload })
        .then(({ data }) => setFilteredPersons(data || []))
        .finally(() => setLoadingPersons(false));
    } else {
      setFilteredPersons([]);
    }
  }, [filters]);

  // Top 10 barrios por personas que cumplen los filtros
  const sortedBarrios = filteredPersons.length > 0
    ? [...filteredPersons].sort((a, b) => b.personas_unicas - a.personas_unicas)
    : [...data].sort((a, b) => b.matches_count - a.matches_count);
  const top10Barrios = sortedBarrios.slice(0, 10);
  const totalRespuestas = filteredPersons.length > 0
    ? filteredPersons.reduce((acc, item) => acc + (item.personas_unicas || 0), 0)
    : data.reduce((acc, item) => acc + (item.matches_count || 0), 0);

  useEffect(() => {
    // Solo buscar top de respuestas si hay un solo filtro activo
    if (filters && filters.length === 1) {
      setLoading(true);
      getTopRespuestas(filters[0].category, filters[0].questionId)
        .then((res) => setTopRespuestas(res))
        .finally(() => setLoading(false));
    } else {
      setTopRespuestas([]);
    }
  }, [filters, getTopRespuestas]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      gap: 16,
      position: 'absolute',
      top: 16,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.98)',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        padding: 16,
        minWidth: 220,
        maxHeight: 400,
        overflowY: 'auto',
        color: '#222',
      }}>
        <div style={{ fontWeight: 700, marginBottom: 8, color: '#222' }}>🏆 Top 10 Barrios</div>
        <div style={{ fontSize: 13, marginBottom: 8, color: '#444' }}>
          {loadingPersons ? 'Cargando personas...' : 'Total personas que cumplen filtros: '}<b>{totalRespuestas}</b>
        </div>
        <ol style={{ margin: 0, paddingLeft: 20 }}>
          {top10Barrios.map((item, idx) => (
            <li key={item.barrio} style={{ marginBottom: 4, color: '#222' }}>
              <span style={{ fontWeight: 500 }}>{item.barrio}</span> 
              <span style={{ color: '#0074D9', fontWeight: 600 }}>
                ({filteredPersons.length > 0 ? item.personas_unicas : item.matches_count} personas)
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div style={{
        background: 'rgba(255,255,255,0.98)',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        padding: 16,
        minWidth: 260,
        maxHeight: 400,
        overflowY: 'auto',
        color: '#222',
      }}>
        <div style={{ fontWeight: 700, marginBottom: 8, color: '#222' }}>🔝 Top 10 Respuestas</div>
        {filters && filters.length === 1 ? (
          loading ? (
            <div style={{ color: '#888', fontSize: 13 }}>Cargando respuestas...</div>
          ) : (
            <>
              <div style={{ fontSize: 13, marginBottom: 8, color: '#444' }}>Total respuestas: <b>{topRespuestas.reduce((acc, r) => acc + (r.response_count || 0), 0)}</b></div>
              <ol style={{ margin: 0, paddingLeft: 20 }}>
                {topRespuestas.slice(0, 10).map((item, idx) => (
                  <li key={item.response_value} style={{ marginBottom: 6, color: '#222' }}>
                    <span style={{ fontWeight: 500 }}>{item.response_value}</span>
                    <span style={{ color: '#0074D9', fontWeight: 600 }}> ({item.response_count})</span>
                  </li>
                ))}
              </ol>
            </>
          )
        ) : (
          <div style={{ color: '#888', fontSize: 13, marginTop: 16 }}>
            Selecciona una sola pregunta para ver el top de respuestas.
          </div>
        )}
      </div>
    </div>
  );
};



export default Top10Paneles;
