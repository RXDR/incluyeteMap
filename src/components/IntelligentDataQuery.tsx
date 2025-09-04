import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface ExcelStructure {
  column_index: number;
  category: string;
  question: string;
  sub_question: string;
  data_type: string;
  is_coordinate: boolean;
  is_personal_info: boolean;
}

interface StructuredUserData {
  column_index: number;
  category: string;
  question: string;
  sub_question: string;
  response_value: string;
  data_type: string;
  is_coordinate: boolean;
  is_personal_info: boolean;
  batch_number: number;
  row_in_batch: number;
}

interface CategoryStats {
  category: string;
  total_questions: number;
  total_responses: number;
  unique_responses: number;
  response_rate: number;
  sample_responses: any[];
  data_type: string;
}

interface SearchResult {
  user_row: number;
  category: string;
  question: string;
  response_value: string;
  batch_number: number;
  relevance_score: number;
}

interface ExecutiveSummary {
  metric_name: string;
  metric_value: string;
  details: any;
}

const IntelligentDataQuery: React.FC = () => {
  const [excelStructure, setExcelStructure] = useState<ExcelStructure[]>([]);
  const [userData, setUserData] = useState<StructuredUserData[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [executiveSummary, setExecutiveSummary] = useState<ExecutiveSummary[]>([]);
  
  const [selectedUser, setSelectedUser] = useState<number>(1);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchPattern, setSearchPattern] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  // Cargar estructura del Excel
  const loadExcelStructure = async () => {
    try {
      setIsLoading(true);
      setMessage('🔍 Cargando estructura del Excel...');
      setMessageType('info');

      const { data, error } = await supabase.rpc('get_excel_structure');
      if (error) throw error;

      setExcelStructure(data || []);
      setMessage(`✅ Estructura cargada: ${data?.length || 0} columnas`);
      setMessageType('success');

    } catch (error) {
      console.error('Error cargando estructura:', error);
      setMessage(`❌ Error: ${(error as Error).message}`);
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Extraer datos de usuario específico
  const extractUserData = async () => {
    try {
      setIsLoading(true);
      setMessage(`👤 Extrayendo datos del usuario en fila ${selectedUser}...`);
      setMessageType('info');

      const { data, error } = await supabase.rpc('extract_structured_user_data', {
        user_row_number: selectedUser,
        include_categories: selectedCategories.length > 0 ? selectedCategories : null
      });
      if (error) throw error;

      setUserData(data || []);
      setMessage(`✅ Datos extraídos: ${data?.length || 0} respuestas`);
      setMessageType('success');

    } catch (error) {
      console.error('Error extrayendo datos:', error);
      setMessage(`❌ Error: ${(error as Error).message}`);
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Obtener estadísticas por categoría
  const loadCategoryStats = async () => {
    try {
      setIsLoading(true);
      setMessage('📊 Cargando estadísticas por categoría...');
      setMessageType('info');

      const { data, error } = await supabase.rpc('get_category_response_stats', {
        category_filter: selectedCategories.length > 0 ? selectedCategories[0] : null,
        sample_size: 100
      });
      if (error) throw error;

      setCategoryStats(data || []);
      setMessage(`✅ Estadísticas cargadas: ${data?.length || 0} categorías`);
      setMessageType('success');

    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      setMessage(`❌ Error: ${(error as Error).message}`);
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Buscar respuestas por patrón
  const searchResponses = async () => {
    if (!searchPattern.trim()) return;
    
    try {
      setIsLoading(true);
      setMessage(`🔍 Buscando: "${searchPattern}"...`);
      setMessageType('info');

      const { data, error } = await supabase.rpc('search_responses_by_pattern', {
        search_pattern: searchPattern,
        category_filter: selectedCategories.length > 0 ? selectedCategories[0] : null,
        limit_results: 50
      });
      if (error) throw error;

      setSearchResults(data || []);
      setMessage(`✅ Búsqueda completada: ${data?.length || 0} resultados`);
      setMessageType('success');

    } catch (error) {
      console.error('Error en búsqueda:', error);
      setMessage(`❌ Error: ${(error as Error).message}`);
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar resumen ejecutivo
  const loadExecutiveSummary = async () => {
    try {
      setIsLoading(true);
      setMessage('📋 Cargando resumen ejecutivo...');
      setMessageType('info');

      const { data, error } = await supabase.rpc('get_data_executive_summary');
      if (error) throw error;

      setExecutiveSummary(data || []);
      setMessage(`✅ Resumen ejecutivo cargado`);
      setMessageType('success');

    } catch (error) {
      console.error('Error cargando resumen:', error);
      setMessage(`❌ Error: ${(error as Error).message}`);
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar todo automáticamente
  useEffect(() => {
    loadExcelStructure();
    loadExecutiveSummary();
  }, []);

  const getDataTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'coordinate': 'bg-red-100 text-red-800',
      'personal': 'bg-blue-100 text-blue-800',
      'demographic': 'bg-green-100 text-green-800',
      'disability': 'bg-purple-100 text-purple-800',
      'health': 'bg-indigo-100 text-indigo-800',
      'education': 'bg-yellow-100 text-yellow-800',
      'economic': 'bg-pink-100 text-pink-800',
      'accessibility': 'bg-orange-100 text-orange-800',
      'needs': 'bg-teal-100 text-teal-800',
      'caregiver': 'bg-cyan-100 text-cyan-800',
      'other': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || colors.other;
  };

  const getMessageStyle = () => {
    switch (messageType) {
      case 'success':
        return 'bg-green-100 border-green-400 text-green-700';
      case 'error':
        return 'bg-red-100 border-red-400 text-red-700';
      case 'info':
      default:
        return 'bg-blue-100 border-blue-400 text-blue-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          🧠 Consulta Inteligente de Datos
        </h2>
        
        <div className="space-y-4">
          <p className="text-gray-600">
            Sistema que mapea automáticamente los datos del Excel con las preguntas y categorías para consultas inteligentes.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Usuario */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuario (fila):
              </label>
              <input
                type="number"
                value={selectedUser}
                onChange={(e) => setSelectedUser(parseInt(e.target.value) || 1)}
                min="1"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            
            {/* Categorías */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categorías:
              </label>
              <select
                multiple
                value={selectedCategories}
                onChange={(e) => setSelectedCategories(
                  Array.from(e.target.selectedOptions, option => option.value)
                )}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                {excelStructure
                  .filter(col => col.category !== 'NO INCLUIR')
                  .map((col, index) => (
                    <option key={index} value={col.category}>
                      {col.category}
                    </option>
                  ))
                }
              </select>
            </div>
            
            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar:
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={searchPattern}
                  onChange={(e) => setSearchPattern(e.target.value)}
                  placeholder="Patrón de búsqueda..."
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                />
                <button
                  onClick={searchResponses}
                  disabled={!searchPattern.trim() || isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                >
                  🔍
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={extractUserData}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              👤 Extraer Datos de Usuario
            </button>
            
            <button
              onClick={loadCategoryStats}
              disabled={isLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              📊 Estadísticas por Categoría
            </button>
            
            <button
              onClick={loadExecutiveSummary}
              disabled={isLoading}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              📋 Resumen Ejecutivo
            </button>
          </div>
        </div>
      </div>

      {/* Mensajes */}
      {message && (
        <div className={`p-4 border rounded-lg ${getMessageStyle()}`}>
          <span>{message}</span>
        </div>
      )}

      {/* Estructura del Excel */}
      {excelStructure.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            📋 Estructura del Excel (118 columnas)
          </h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Columna
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pregunta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sub-pregunta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Especial
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {excelStructure.slice(0, 20).map((col, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {col.column_index}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {col.category}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {col.question}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {col.sub_question}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDataTypeColor(col.data_type)}`}>
                        {col.data_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {col.is_coordinate && '📍 Coordenada'}
                      {col.is_personal_info && '👤 Personal'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {excelStructure.length > 20 && (
              <div className="text-center py-4 text-sm text-gray-500">
                Mostrando 20 de {excelStructure.length} columnas. Usa los filtros para ver más.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Datos del Usuario */}
      {userData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            👤 Datos del Usuario en Fila {selectedUser}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userData.map((data, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm text-blue-600">
                    {data.category}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDataTypeColor(data.data_type)}`}>
                    {data.data_type}
                  </span>
                </div>
                
                <div className="space-y-2 text-xs text-gray-600">
                  <div>
                    <span className="font-medium">Pregunta:</span> {data.question}
                  </div>
                  {data.sub_question && (
                    <div>
                      <span className="font-medium">Sub-pregunta:</span> {data.sub_question}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Respuesta:</span> 
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                      {data.response_value}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Columna: {data.column_index} | Batch: {data.batch_number}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estadísticas por Categoría */}
      {categoryStats.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            📊 Estadísticas por Categoría
          </h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preguntas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Respuestas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Únicas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tasa Respuesta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categoryStats.map((stat, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {stat.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stat.total_questions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stat.total_responses}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stat.unique_responses}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stat.response_rate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDataTypeColor(stat.data_type)}`}>
                        {stat.data_type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resultados de Búsqueda */}
      {searchResults.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            🔍 Resultados de Búsqueda: "{searchPattern}"
          </h3>
          
          <div className="space-y-3">
            {searchResults.map((result, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-medium text-sm text-blue-600">
                      {result.category}
                    </span>
                    <div className="text-xs text-gray-500">
                      Usuario: {result.user_row} | Batch: {result.batch_number}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    Relevancia: {result.relevance_score}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm">
                    <span className="font-medium">Pregunta:</span> {result.question}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Respuesta:</span> 
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                      {result.response_value}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resumen Ejecutivo */}
      {executiveSummary.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            📋 Resumen Ejecutivo de Datos
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {executiveSummary.map((summary, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-2">
                  {summary.metric_name}
                </h4>
                
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {summary.metric_value}
                </div>
                
                <div className="text-xs text-gray-600">
                  <pre className="bg-gray-100 p-2 rounded overflow-x-auto">
                    {JSON.stringify(summary.details, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default IntelligentDataQuery;
