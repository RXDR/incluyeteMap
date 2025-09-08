import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface BarrioData {
  barrio: string;
  total_encuestas: number;
  matches_count: number;
  intensity_score?: number;
  percentage?: number;
}

interface BarriosChartProps {
  data: BarrioData[];
  chartType: 'bar' | 'pie' | 'line' | 'area';
  showPercentage?: boolean;
  dataView: 'top10' | 'all' | 'comparison';
  totalEncuestas?: number;
  totalCoincidencias?: number;
  porcentajeGlobal?: string;
}

const COLORS = ['#f6e05e', '#4B5563', '#1F2937', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB', '#E5E7EB', '#F3F4F6', '#F9FAFB'];

const BarriosChart: React.FC<BarriosChartProps> = ({ 
  data = [], 
  chartType = 'bar', 
  showPercentage = false,
  dataView = 'top10',
  totalEncuestas = 0,
  totalCoincidencias = 0,
  porcentajeGlobal = '0'
}) => {
  const { processedData } = React.useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return {
        processedData: [],
      };
    }
    return {
      processedData: data,
    };
  }, [data]);

  // Resumen General Component
  const TotalSummary = () => (
    <div className="bg-[#232946] p-4 rounded-lg mb-4 border border-gray-700">
      <h3 className="text-white text-lg font-medium mb-2">Resumen General</h3>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-gray-300 text-sm">Total Coincidencias</p>
          <p className="text-yellow-400 text-xl font-bold">{totalCoincidencias}</p>
        </div>
        <div>
          <p className="text-gray-300 text-sm">Total Encuestas</p>
          <p className="text-blue-400 text-xl font-bold">{totalEncuestas}</p>
        </div>
        <div>
          <p className="text-gray-300 text-sm">Porcentaje Total</p>
          <p className="text-green-400 text-xl font-bold">{porcentajeGlobal}%</p>
        </div>
      </div>
    </div>
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700">
          <p className="text-white font-medium">{data.barrio}</p>
          <div className="space-y-2 mt-2">
            <p className="text-yellow-400 font-medium">
              Total Coincidencias: {data.matches_count}
            </p>
            <p className="text-gray-300">
              Total Encuestas: {data.total_encuestas}
            </p>
            <p className="text-yellow-400 font-bold text-lg">
              Porcentaje: {data.percentage}%
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!processedData || processedData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] bg-gray-800 rounded-lg border border-gray-700">
        <p className="text-gray-400">No hay datos disponibles para visualizar</p>
      </div>
    );
  }

  if (chartType === 'pie') {
    return (
      <>
        <TotalSummary />
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={processedData}
              dataKey={showPercentage ? "percentage" : "matches_count"}
              nameKey="barrio"
              cx="50%"
              cy="50%"
              outerRadius={85}
              fill="#f6e05e"
              label={(props) => {
                const { cx, cy, midAngle, innerRadius, outerRadius, name, value } = props;
                const RADIAN = Math.PI / 180;
                const radius = outerRadius * 1.4; // Aumentado a 1.4 para más separación
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                const textAnchorValue = x > cx ? 'start' : 'end';
                
                return (
                  <text
                    x={x}
                    y={y}
                    fill="#000000"
                    textAnchor={textAnchorValue}
                    fontSize={11}
                    fontWeight="600"
                  >
                    {`${name}: ${value}${showPercentage ? '%' : ''}`}
                  </text>
                );
              }}
              labelLine={true}
            >
              {processedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </>
    );
  }

  return (
    <>
      <TotalSummary />
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={processedData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 60,
          }}
        >
  {/* <CartesianGrid strokeDasharray="3 3" stroke="#374151" /> */}
        <XAxis
          dataKey="barrio"
          angle={-45}
          textAnchor="end"
          height={60}
          tick={{ fill: '#9CA3AF', fontSize: 12 }}
        />
        <YAxis
          tick={{ fill: '#9CA3AF' }}
          // label removed
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar
          dataKey={showPercentage ? "percentage" : "matches_count"}
          fill="#f6e05e"
          radius={[4, 4, 0, 0]}
          label={({ x, y, width, value }) => (
            <text
              x={x + width / 2}
              y={y - 8}
              textAnchor="middle"
              fill="#374151"
              fontSize={12}
              fontWeight="bold"
            >
              {showPercentage ? `${value}%` : value}
            </text>
          )}
        />
      </BarChart>
    </ResponsiveContainer>
    </>
  );
};

export default BarriosChart;
