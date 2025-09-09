import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';

interface RightSidebarTop10BarriosProps {
  data: Array<{
    barrio: string;
    total_encuestas: number;
    matches_count: number;
    intensity_score?: number;
  }>;
  headerHeight?: number;
}

const RightSidebarTop10Barrios: React.FC<RightSidebarTop10BarriosProps> = ({ data, headerHeight }) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  
  const sortedBarrios = React.useMemo(() => {
    console.log('Datos recibidos en RightSidebarTop10Barrios:', data);
    if (!data || !Array.isArray(data)) return [];
    return [...data].sort((a, b) => b.matches_count - a.matches_count).slice(0, 10);
  }, [data]);

  // Calcular totales de TODOS los barrios, no solo del top 10
  const totals = React.useMemo(() => {
    if (!data || !Array.isArray(data)) return null;
    return data.reduce((acc, item) => ({
      totalBarrios: acc.totalBarrios + 1,
      totalEncuestas: acc.totalEncuestas + item.total_encuestas,
      totalCoincidencias: acc.totalCoincidencias + item.matches_count
    }), { totalBarrios: 0, totalEncuestas: 0, totalCoincidencias: 0 });
  }, [data]);

  return (
    <div style={{
      position: 'fixed',
      
      right: 0,
      height: `calc(100vh - ${headerHeight || 112}px)`,
      width: 340,
      background: theme === 'dark' ? '#1f2937' : '#ffffff',
      borderLeft: theme === 'dark' ? '1px solid #23272f' : '1px solid #e5e7eb',
      boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
      zIndex: 40,
      padding: '20px 24px',
      overflowY: 'auto',
      color: theme === 'dark' ? '#fff' : '#111827',
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
      fontFamily: 'Inter, sans-serif',
      marginBottom: 32 // <-- margen extra para que el último barrio se vea bien
    }}>
      {totals && (
        <div 
          style={{
            background: theme === 'dark' ? '#23272f' : '#f8fafc',
            border: theme === 'dark' ? '1.5px solid #2d3748' : '1.5px solid #e2e8f0',
            borderRadius: 8,
            padding: '16px',
            marginBottom: 20,
           
            
          }}
          
        
        >
          <div style={{ 
            fontWeight: 700, 
            fontSize: 20, 
            marginBottom: 12, 
            color: '#f6e05e',
            display: 'flex',
            alignItems: 'center',
            gap: 8 
          }}>
            <span>📊</span>
            <span>Totales Generales</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div>Total Barrios: <span style={{ color: '#f6e05e' }}>{totals.totalBarrios}</span></div>
            <div>Total Encuestas: <span style={{ color: '#f6e05e' }}>{totals.totalEncuestas}</span></div>
            <div>Total Coincidencias: <span style={{ color: '#f6e05e' }}>{totals.totalCoincidencias}</span></div>
            <div>Porcentaje General: <span style={{ color: '#f6e05e' }}>{((totals.totalCoincidencias / totals.totalEncuestas) * 100).toFixed(2)}%</span></div>
          </div>
          
        </div>
      )}

      <div style={{ 
        fontWeight: 700, 
        fontSize: 22, 
        marginBottom: 12, 
        color: theme === 'dark' ? '#fff' : '#111827',
        display: 'flex', 
        alignItems: 'center', 
        gap: 8 
      }}>
        <span role="img" aria-label="Top">🏆</span>
        <span>Top 10 Barrios</span>
      </div>

      <ol style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sortedBarrios.map((item, idx) => (
          <li
            key={item.barrio}
            style={{
              marginBottom: idx === sortedBarrios.length - 1 ? 0 : 12,
              background: theme === 'dark' ? '#23272f' : '#f8fafc',
              border: theme === 'dark' ? '1.5px solid #2d3748' : '1.5px solid #e2e8f0',
              borderRadius: 8,
              padding: '12px 16px',
              color: theme === 'dark' ? '#fff' : '#111827',
              fontSize: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
              transition: 'border 0.2s',
              paddingBottom: '12px' // <-- espacio extra para que el último barrio se vea bien
            }}
          >
            <span style={{ fontWeight: 500 }}>
              {idx + 1}. {item.barrio}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 12 }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="10" fill="#f6e05e" />
                <path d="M10 10.5c1.38 0 2.5-1.12 2.5-2.5S11.38 5.5 10 5.5 7.5 6.62 7.5 8 8.62 10.5 10 10.5zm0 1.25c-1.67 0-5 0.84-5 2.5V16h10v-1.75c0-1.66-3.33-2.5-5-2.5z" fill="#23272f" />
              </svg>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ color: '#f6e05e', fontWeight: 700, fontSize: 17 }}>{item.matches_count}</span>
                <span style={{ color: '#4b5563', fontSize: 12 }}>/{item.total_encuestas}</span>
              </div>
            </span>
          </li>
        ))}
      </ol>

      {sortedBarrios.length === 0 && (
        <div style={{ color: '#f6e05e', fontSize: 15, marginTop: 24 }}>
          No hay datos disponibles.
        </div>
      )}

      
    </div>
  );
};

export default RightSidebarTop10Barrios;
